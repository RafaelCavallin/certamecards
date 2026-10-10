# Especificação técnica — Imagens nas Notas

> PRD: [prd.md](prd.md). TechSpec-base: [tasks/produto/techspec.md](../produto/techspec.md). O modelo `Card`, o Dexie `version(1)`, o ciclo de sincronização (pull keyset → push com CAS) e as decisões gerais estão lá, e este documento não os repete. Os IDs de teste da base (TU-28, TI-15, TI-16, E2E-18) foram mantidos. Os casos próprios usam o sufixo `I` (`TU-I*`, `TI-I*`, `E2E-I*`). O Lingo não sincroniza arquivos (o áudio dele é só local, em `audioBlobs`), então o que vem de lá é o padrão de blob separado dos metadados, a limpeza junto com o cartão e o `Blob` do Node no setup dos testes. O envio, o download e a compressão são novos.

## Resumo

Cada imagem tem duas partes no aparelho: os **metadados** (`cardImages`, sincronizados por LWW como os cartões) e o **arquivo** (`imageBlobs`, `id → Blob`, nunca lido por listas e buscas). Um campo local, `blobState`, diz onde o arquivo está (`local`, `uploaded`, `remote`, `pending-delete`, `purged`). O banco já está pronto: a migration `20261101000000_images_reminders.sql`, já aplicada em produção, tem a tabela `card_images`, a RPC `sync_push_images` e o bucket privado `card-images` com as políticas por pasta do usuário. A entrega **não muda schema nem `sync_push`**. No cliente, entram o Dexie `version(2)`, a compressão, a galeria do formulário, a galeria e o visualizador da revisão, e duas etapas novas na sincronização.

A imagem é reduzida no aparelho, na thread principal: `createImageBitmap`, canvas, WebP com qualidade decrescente até caber em 1,5 MB, e JPEG onde o navegador não codifica WebP. A detecção é pelo `type` do blob devolvido, sem farejar o navegador. O formulário guarda as imagens num **rascunho em memória**, e salvar grava cartão, metadados e arquivos numa **única transação Dexie** (RF76c, CA-I8). A sincronização ganha duas etapas, ambas depois de cartões e logs: o pull de `card_images` e o envio das imagens em três fases (arquivos → RPC de metadados → limpeza do Storage). Falhas de imagem ficam isoladas e nunca derrubam o resultado da sincronização (RF77b). O download é sob demanda: o cartão exibido mais os 2 próximos da fila, por um serviço de `state/` que tenta de novo quando a rede volta. Por decisão do Rafael, a entrega cria também o aviso “Descartar alterações?” do formulário, que vale para o texto (RF76c).

## Arquitetura do sistema

### Visão dos componentes

| Camada | Módulo | Novo/mod. | Papel |
| --- | --- | --- | --- |
| domain | `db-types.ts` | novo (extraído) | Interfaces das entidades (`Deck`, `Card`, `ReviewLog`, `UserSettings`, `SyncState`) e as novas `CardImage`, `ImageBlobRecord`, `BlobState`. `db.ts` reexporta tudo, então os imports atuais não mudam. É necessário porque `db.ts` já tem 95 linhas. |
| domain | `db.ts` | mod. | Tabelas `cardImages` e `imageBlobs`; `db.version(2)` sem `upgrade` (só tabelas novas); `trackDirty(db.cardImages, true)`. |
| domain | `card-limits.ts` | mod. | `IMAGES_PER_CARD_MAX = 6`, `IMAGE_SIDE_MAX = 2000`, `IMAGE_BYTES_MAX = 1_572_864`, `IMAGE_CAPTION_MAX = 200`, `IMAGE_INPUT_BYTES_MAX = 50 MB`, `IMAGE_MIME_TYPES`. Espelham os `check` de `card_images` e do bucket. |
| domain | `image-errors.ts` | novo | `ImageError` com `code: 'unreadable' \| 'too-large' \| 'input-too-large' \| 'storage-full'` e a mensagem do PRD. |
| domain | `image-resize.ts` | novo | Puro: `fitWithin(w, h, max)` (sem ampliar), `QUALITY_STEPS` (0,9 → 0,5), `nextQuality`. |
| domain | `image-codec.ts` | novo | Adaptador do navegador: `browserCodec.decode(file)` (`createImageBitmap(file, { imageOrientation: 'from-image' })`) e `browserCodec.encode({ source, size, type, quality, opaque })` (`OffscreenCanvas` quando existe, senão `<canvas>`; fundo branco quando `opaque`). É a única peça que toca canvas. |
| domain | `image-compress.ts` | novo | `compressImage(file, codec?)`: guarda de tamanho de entrada → decodifica → `fitWithin` → tenta WebP nas qualidades → cai para JPEG se o blob não voltar WebP → `ImageError('too-large')` se nada couber. |
| domain | `gallery-draft.ts` | novo | Puro: `GalleryItem`, `acceptedCount`, `moveItem`, `removeItem`, `setCaption`, `orderedPositions` (posição limitada a 0–5), `planGallerySave(saved, items, now)` → `{ adds, updates, removals }`. |
| domain | `card-draft.ts` | novo | `CardDraft = { content, gallery }`; `emptyDraft()`; `loadCardDraft(cardId)` (cartão + galeria com blobs); `hasDraftChanges(initial, current)` puro, usado pelo aviso de descarte. |
| domain | `card-save.ts` | novo | `saveNewCard({ deckId, draft })` e `saveCardEdit({ cardId, draft })`: uma transação em `cards`, `cardImages` e `imageBlobs`; `QuotaExceededError` vira `ImageError('storage-full')`. Reaproveita `newCardRecord` e a normalização de `updateCardContent`. |
| domain | `card-images.ts` | novo | Leituras: `liveCardImages(cardId)` (ordenadas por `position`, `createdAt`, `id`), `galleryImages(cardId)` (metadados + blob ou `null`), `imageUsage()`, `pendingUploadCount()`. Escrita: `tombstoneImagesOfCards(cardIds, now)`, que tombstona e apaga os blobs, chamada dentro das transações de exclusão. |
| domain | `cards.ts`, `decks.ts` | mod. | `deleteCards` e `deleteDeck` incluem `cardImages`/`imageBlobs` na transação e chamam `tombstoneImagesOfCards` (RF78a). |
| domain | `sync-rows-image.ts` | novo | `parseCardImageRow` (zod, `snake_case` → `CardImage` com `dirty: 0`) e `toCardImageRow`. Exportados também por `sync-rows.ts`. |
| domain | `sync-pull-images.ts` | novo | `applyCardImages`: LWW por linha. Vencedor vivo mantém o blob local (`uploaded`) ou fica `remote`; vencedor tombstone apaga o blob e vira `purged`. |
| domain | `sync-pull.ts`, `sync-pull-page.ts`, `sync-pull-apply.ts` | mod. | Quinta tabela `card_images`. `applyCards` tombstona as imagens vivas de cartões que chegaram excluídos, o que fecha a corrida “imagem nova num cartão excluído no outro aparelho”. |
| domain | `image-storage.ts` | novo | Bucket `card-images`, `imagePath(userId, imageId)`, `isDuplicateUpload(error)` (`status 409`, `statusCode '409'` ou `/duplicate\|already exists/i`). |
| domain | `image-sync-push.ts` | novo | `pushImages(client, userId)`, em três fases. (1) Upload dos arquivos `local` vivos e sujos, 2 por vez, com `upsert: false` e 409 contando como sucesso, que muda o estado para `uploaded`. (2) `sync_push_images` em lotes de 200 com metadados cujo arquivo já está na nuvem, mais tombstones, e `clearDirty` (CAS). (3) `remove()` em lote das imagens `pending-delete` cujo tombstone já subiu, que viram `purged`. Devolve `{ pushed, failed }` e nunca lança. |
| domain | `image-download.ts` | novo | `fetchMissingImages(cardIds)`: imagens `remote` sem blob → `storage.download`, 2 por vez, deduplicado por id (`Map` de promessas em andamento) → grava o blob e muda para `uploaded`, preservando `dirty`. Sem rede, sem conta ou sem sessão, não faz nada. |
| domain | `sync.ts` | mod. | `runSync`: pull (5 tabelas) → `pushDirty` (decks, settings, cards, logs; inalterado) → `pushImages`. O resultado continua `ok` mesmo com imagens falhando (RF77b). |
| domain | `local-data.ts` | novo (extraído de `auth.ts`) | `wipeLocalData` (inclui `cardImages`/`imageBlobs`), `markAllDirty` (inclui `cardImages`; imagens vivas com blob voltam a `local`), `clearCursors` (inclui `cursor:card_images`). `auth.ts` já tem 95 linhas. |
| domain | `image-labels.ts` | novo | Textos puros: `galleryCountLabel`, `waitingImagesLabel`, `skippedFilesMessage`, `imageAlt`, `imageUsageLabel`, `pendingUploadsLabel`, `formatMegabytes` (pt-BR). |
| domain | `viewer-input.ts` | novo | Puro: `viewerKeyAction(key)` → `'prev' \| 'next' \| 'zoom-in' \| 'zoom-out' \| 'close' \| null`; `swipeDirection({ dx, dy, scale })`; `clampIndex`. |
| state | `image-prefetch.ts` | novo | `@Service()` raiz. `request(cardIds)` chama `fetchMissingImages` e guarda o último pedido; no `online`, refaz (RF77d). Não expõe estado: a galeria reage ao blob gravado pela `liveQuery`. |
| state | `review-session.ts`, `reinforce-session.ts` | mod. | `effect` que pede ao `ImagePrefetch` o cartão atual e os 2 próximos (`queue[index..index+2]` / `pending[0..2]`). |
| state | `guards.ts` | mod. | `confirmLeave: CanDeactivateFn<LeaveAware>` → `component.canLeave()`. |
| ui | `image-thumb/` | novo | Mostra um `Blob \| null`: cria e revoga o object URL (`DestroyRef`), `decoding="async"`, quadrado com `object-cover`. Com `null`, mostra “Imagem disponível quando houver conexão”. Usado pelo editor, pela galeria e pelo visualizador. |
| ui | `image-gallery/` | novo | Galeria da revisão e do reforço: `liveQueryFor(cardId, galleryImages)`, grade de miniaturas com espaço reservado, `request([cardId])` no prefetch, abre o `image-viewer`. |
| ui | `image-viewer/` | novo | `<dialog>` em tela cheia, `@panzoom/panzoom` por `import()` dinâmico, botões, legenda, “2 / 4”, teclas e deslize por `viewer-input`, foco devolvido à miniatura. |
| ui | `image-gallery-editor/` | novo | Seção Imagens do formulário: “Adicionar imagem” (`multiple`), “Tirar foto” (`capture="environment"`, só com `pointer: coarse`), área de soltar, `cdkDropList` com `orientation="mixed"`, itens “Preparando imagem…”, avisos `aria-live`. `model<GalleryItem[]>` e `output` de pendências. |
| ui | `image-gallery-editor/image-editor-item` | novo | Uma miniatura com “Mover para a esquerda/direita”, “Remover” e o campo Legenda (contador perto de 200). |
| ui | `card-form/` | mod. | Inclui o editor; `initial: CardDraft \| null`; `onSubmit(draft)`; `(paste)` no host encaminha imagens (só quando a área de transferência não tem texto); salvar bloqueado com pendências (“Aguardando 2 imagens”); `hasChanges()`, `confirmDiscard()` e `window:beforeunload`. |
| ui | `card-face/` | mod. | `<app-image-gallery [cardId]>` depois das Notas, só com `revealed()`. |
| ui | `card-edit-dialog/` | mod. | Carrega o rascunho por `loadCardDraft`; salva com `saveCardEdit`; o evento `cancel` (Escape) passa por `confirmDiscard()`. |
| ui | `confirm-dialog/` | mod. | Ganha `ask(): Promise<boolean>` (resolve no confirmar ou no fechar) e `tone` (`danger` padrão, `neutral` para “Descartar”). |
| pages | `card-new/`, `card-edit/` | mod. | Salvam por `card-save`; implementam `canLeave()`; `card-edit` carrega por `loadCardDraft`. |
| pages | `review/review.ts` | mod. | Os atalhos ignoram a tecla quando há `dialog[open]` no documento, o que cobre o editor e o visualizador (RF75d). |
| pages | `settings/settings-images.ts/.html` | novo | Linha “Imagens” (`imageUsage`) e, com sessão, “N imagens aguardando envio” na seção Conta e sincronização. |
| app | `app.routes.ts` | mod. | `canDeactivate: [confirmLeave]` em `cartoes/novo` e `cartoes/:id`. |
| estilo | `src/styles.css` | mod. | Tokens `--viewer`/`--on-viewer` (fundo escuro fixo nos dois temas, mapeados em `@theme inline`) e `html:has(dialog[open]) { overflow: hidden }`. |
| test | `src/test/setup.ts`, `fake-supabase.ts`, `db-helpers.ts`, `image-fixtures.ts` | mod./novo | `Blob`/`File` de `node:buffer` (padrão do Lingo); `storage.from(bucket).upload/download/remove` em memória com falhas injetáveis; `resetDb` limpa as tabelas novas; fixtures de `CardImage` e blobs. |
| deps | `package.json` | mod. | `@panzoom/panzoom@^4.6` (MIT, ~4 KB gzip). `@angular/cdk` já está instalado (drag-drop). |

### Relacionamentos e fluxo de dados

```
Formulário (card-form)
  image-gallery-editor ─ arquivo/câmera/colar/soltar ─ compressImage ─ image-codec (canvas)
     └ GalleryItem[] em memória (rascunho; nada gravado)
  Salvar ─ card-save ─ 1 transação Dexie: cards + cardImages (dirty=1, local) + imageBlobs
  Sair ─ confirmLeave / cancel do dialog / beforeunload ─ hasDraftChanges ─ confirm-dialog.ask

Revisão / reforço
  card-face (revealed) ─ image-gallery ─ liveQueryFor(cardId, galleryImages) ─ cardImages + imageBlobs
     ├ image-thumb (object URL) ─ image-viewer (dialog + panzoom lazy)
     └ ImagePrefetch.request([atual]) ; sessão: request([atual, +1, +2])
           └ fetchMissingImages ─ storage.download ─ imageBlobs (liveQuery redesenha)

syncNow
  pullAll: decks, cards (tombstone → tombstoneImagesOfCards), review_logs, user_settings, card_images (applyCardImages)
  pushDirty: decks/settings → cards → logs                 (inalterado; falha aqui = erro da sync)
  pushImages: (1) upload local→uploaded  (2) sync_push_images + CAS  (3) remove pending-delete→purged
              (falhas isoladas por imagem; resultado da sync continua ok)
```

#### Estados do arquivo (`blobState`)

| De | Evento | Para | Arquivo local |
| --- | --- | --- | --- |
| — | salvar imagem nova | `local` | gravado |
| `local` | upload `2xx` ou `409` | `uploaded` | mantido |
| — | pull de imagem viva sem blob local | `remote` | — |
| `remote` | download ok | `uploaded` | gravado |
| `local`/`uploaded`/`remote` | remover no formulário, excluir cartão/baralho, cartão chegou excluído | `pending-delete` | apagado na hora |
| `pending-delete` | tombstone subiu e `remove()` respondeu | `purged` | — |
| qualquer | pull de tombstone vencedor | `purged` | apagado |

**Offline e sem conta**: anexar, comprimir, salvar, revisar, ampliar e excluir só usam o Dexie e o canvas. Sem `env` do Supabase, `getSupabase()` devolve `null`: `pushImages`, `fetchMissingImages` e o prefetch saem cedo, e a UI não mostra nada de envio (“aguardando envio” só aparece com sessão). Tombstones de imagens nunca enviadas ficam em `pending-delete` sem custo. Se a conta vier depois, `markAllDirty` leva tudo na primeira sincronização e o `remove()` de arquivo inexistente responde ok. Com conta e sem rede, a imagem fica `local` e conta em “aguardando envio”. No outro aparelho, a imagem `remote` mostra o placeholder e não bloqueia a revisão (CA-I17).

**Sync, LWW e CAS**: metadados seguem o LWW por linha de sempre (`wins`, desempate por id). O arquivo é imutável, então só os metadados disputam versão. A ordem cartões → logs → imagens respeita a FK `(user_id, card_id)` de `card_images`. Metadado de imagem viva só sobe com o arquivo já na nuvem (fase 1 antes da fase 2), então outro aparelho nunca recebe metadado de arquivo inexistente. `clearDirty` compara `updatedAt` (CAS): uma legenda editada durante o envio continua suja. Atualizações feitas pela própria sincronização (`blobState`) passam `dirty` explícito, porque o hook `updating` de `trackDirty` marcaria a linha como suja.

## Design de implementação

### Principais interfaces

```ts
// domain/image-compress.ts + image-codec.ts
compressImage(file: Blob, codec?: ImageCodec): Promise<CompressedImage>
interface ImageCodec {
  decode(file: Blob): Promise<DecodedImage>              // lança ImageError('unreadable')
  encode(input: EncodeInput): Promise<Blob>              // blob.type revela o formato real
}
interface DecodedImage { source: CanvasImageSource; width: number; height: number; close(): void }
interface EncodeInput { source: CanvasImageSource; size: Size; type: OutputMime; quality: number; opaque: boolean }
fitWithin(width: number, height: number, max: number): Size
```

```ts
// domain/card-draft.ts + card-save.ts + gallery-draft.ts
interface CardDraft { content: CardContent; gallery: GalleryItem[] }
emptyDraft(): CardDraft
loadCardDraft(cardId: string): Promise<CardDraft | null>
hasDraftChanges(initial: CardDraft, current: CardDraft): boolean
saveNewCard(input: { deckId: string; draft: CardDraft }): Promise<Card>
saveCardEdit(input: { cardId: string; draft: CardDraft }): Promise<Card>
planGallerySave(input: { saved: CardImage[]; items: GalleryItem[]; now: number }): GallerySavePlan
acceptedCount(current: number, incoming: number): number
moveItem(items: GalleryItem[], index: number, delta: -1 | 1): GalleryItem[]
```

```ts
// domain/card-images.ts
liveCardImages(cardId: string): Promise<CardImage[]>
galleryImages(cardId: string): Promise<GalleryImage[]>
imageUsage(): Promise<ImageUsage>
pendingUploadCount(): Promise<number>
tombstoneImagesOfCards(cardIds: string[], now: number): Promise<void>   // dentro de transação do chamador
```

```ts
// domain/image-sync-push.ts + image-download.ts + sync-pull-images.ts
pushImages(client: SupabaseClient, userId: string): Promise<ImagePushResult>
fetchMissingImages(cardIds: string[]): Promise<number>          // quantas baixou
applyCardImages(items: Parsed<CardImage>[], cursorKey: string): Promise<number>
parseCardImageRow(raw: unknown): Parsed<CardImage> | null
toCardImageRow(row: CardImage): object
```

```ts
// state/image-prefetch.ts, state/guards.ts, ui/confirm-dialog
ImagePrefetch.request(cardIds: string[]): void
interface LeaveAware { canLeave(): boolean | Promise<boolean> }
confirmLeave: CanDeactivateFn<LeaveAware>
ConfirmDialog.ask(): Promise<boolean>
CardForm.hasChanges(): boolean ; CardForm.confirmDiscard(): Promise<boolean>
```

### Modelos de dados

#### `CardImage` — metadados da imagem (Dexie `cardImages`, camelCase)

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `id` | `string` (uuid) | sim | Gerado no cliente. Também é o nome do arquivo no Storage. |
| `cardId` | `string` | sim | Cartão dono. Índice. |
| `position` | `number` | sim | 0–5. Gravado como `min(índice, 5)`; a exibição ordena por `position`, `createdAt`, `id`, o que tolera empates depois de edições concorrentes. |
| `caption` | `string` | sim | 0–200, aparada, texto puro. `''` = sem legenda. |
| `mimeType` | `'image/webp' \| 'image/jpeg'` | sim | O banco também aceita `image/png`, mas o app nunca gera. |
| `width`, `height` | `number` | sim | 1–2000. |
| `byteSize` | `number` | sim | 1–1.572.864. Base do contador de Ajustes. |
| `blobState` | `BlobState` | sim | Só local, não sincroniza. Ver a tabela de estados. |
| `createdAt`, `updatedAt` | `number` (epoch ms) | sim | `updatedAt` é a versão do LWW. |
| `deletedAt` | `number` | sim | `0` = viva. |
| `dirty` | `0 \| 1` | sim | Marcado pelo `trackDirty`. |

```text
{ "id": "e1f2c3d4-…", "cardId": "c0a8b1c2-…", "position": 0, "caption": "Mapa: controle difuso × concentrado",
  "mimeType": "image/webp", "width": 2000, "height": 1250, "byteSize": 412345, "blobState": "local",
  "createdAt": 1790000000000, "updatedAt": 1790000000000, "deletedAt": 0, "dirty": 1 }
```

#### `ImageBlobRecord` — arquivo (Dexie `imageBlobs`)

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `id` | `string` | sim | Mesmo `id` da `CardImage`. |
| `blob` | `Blob` | sim | Já comprimido, com `type` = `mimeType`. Downloads são regravados como `new Blob([data], { type: mimeType })`. |

```ts
db.version(2).stores({
  cardImages: 'id, cardId, dirty, deletedAt, blobState',
  imageBlobs: 'id',
});
```

#### `CompressedImage` — saída da compressão

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `blob` | `Blob` | sim | ≤ `IMAGE_BYTES_MAX`. |
| `mimeType` | `'image/webp' \| 'image/jpeg'` | sim | JPEG só quando o navegador devolve outro tipo ao pedir WebP. |
| `width`, `height` | `number` | sim | Depois de `fitWithin`. |
| `byteSize` | `number` | sim | `blob.size`. |

```text
{ "mimeType": "image/webp", "width": 2000, "height": 1500, "byteSize": 523118, "blob": "<Blob 523118 bytes>" }
```

#### `GalleryItem` — item do rascunho no formulário

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `id` | `string` | sim | Id da imagem salva, ou um `uid()` novo para imagem adicionada. |
| `origin` | `'saved' \| 'new'` | sim | Decide entre `updates` e `adds` no `planGallerySave`. |
| `blob` | `Blob \| null` | sim | `null` = imagem salva ainda não baixada (placeholder, mas pode ser reordenada, legendada e removida). |
| `caption` | `string` | sim | Editada no formulário. |
| `image` | `CompressedImage` | só `new` | Dados do arquivo novo. |

```text
[ { "id": "e1f2…", "origin": "saved", "blob": "<Blob>", "caption": "Mapa: atos" },
  { "id": "9a8b…", "origin": "new", "blob": "<Blob>", "caption": "", "image": { "mimeType": "image/webp", "width": 1600, "height": 1200, "byteSize": 301877 } } ]
```

#### `GallerySavePlan` — o que a transação de salvar grava

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `adds` | `{ image: CardImage; blob: Blob }[]` | Itens `new`, com `blobState: 'local'`, posição pela ordem. |
| `updates` | `{ id: string; changes: Pick<CardImage, 'position' \| 'caption' \| 'updatedAt'> }[]` | Só itens `saved` cuja posição ou legenda mudou. Sem mudança, nada é gravado e nada sobe. |
| `removals` | `string[]` | Imagens salvas que saíram do rascunho → tombstone + blob apagado. |

```text
{ "adds": [{ "image": { "id": "9a8b…", "position": 2, "blobState": "local", "…": "…" }, "blob": "<Blob>" }],
  "updates": [{ "id": "e1f2…", "changes": { "position": 1, "caption": "Mapa: atos", "updatedAt": 1790000005000 } }],
  "removals": ["77aa…"] }
```

> **Só imagens mudaram:** `saveCardEdit` não toca a linha do cartão quando o conteúdo de texto é igual ao carregado. Assim a sincronização não reenvia o cartão nem muda o `updatedAt` dele. O agendamento nunca é tocado em nenhum caso (RF76e).

#### `GalleryImage`, `ImageUsage` e `ImagePushResult`

| Tipo | Campos | Uso |
| --- | --- | --- |
| `GalleryImage` | `image: CardImage`, `blob: Blob \| null` | Galeria da revisão e rascunho da edição. |
| `ImageUsage` | `count: number`, `bytes: number` | Imagens vivas de cartões vivos (RF74e). |
| `ImagePushResult` | `pushed: number`, `failed: number` | Para log e testes; a UI usa `pendingUploadCount()`. |

```text
{ "count": 34, "bytes": 12897484 }      → "34 imagens · 12,3 MB"  (com sessão: "34 imagens · 12,3 MB de 1 GB")
```

#### `ImageError` — erros esperados

| Código | Quando | Mensagem (PT-BR, mostrada na tela) |
| --- | --- | --- |
| `unreadable` | `createImageBitmap` rejeita (PDF, HEIC fora do Safari, arquivo corrompido) | “Não foi possível abrir este arquivo como imagem.” |
| `input-too-large` | Arquivo de entrada > 50 MB, recusado antes de decodificar | “Esta imagem é grande demais para abrir.” |
| `too-large` | Nem a qualidade 0,5 coube em 1,5 MB | “Esta imagem ficou grande demais mesmo reduzida.” |
| `storage-full` | `QuotaExceededError` na transação de salvar | “Sem espaço no aparelho para salvar as imagens.” |

```text
{ "name": "ImageError", "code": "storage-full", "message": "Sem espaço no aparelho para salvar as imagens." }
```

#### Mapeamento `card_images` (Postgres) ↔ `CardImage`

| Origem (`card_images`) | Destino (`CardImage`) |
| --- | --- |
| `id`, `card_id` | `id`, `cardId` |
| `position`, `caption`, `mime_type` | `position`, `caption`, `mimeType` |
| `width`, `height`, `byte_size` | `width`, `height`, `byteSize` |
| `created_at`, `updated_at`, `deleted_at` | `createdAt`, `updatedAt`, `deletedAt` |
| `synced_at` | cursor `cursor:card_images` (não vai para a linha) |
| — | `dirty: 0`; `blobState` decidido em `applyCardImages` |

`toCardImageRow` é o inverso, sem `user_id` (preenchido por `auth.uid()` na RPC), `synced_at`, `blobState` e `dirty`. Linha com `mime_type` fora de `IMAGE_MIME_TYPES` ou campos ausentes é descartada pelo zod, com o `console.warn` existente de `parsePage`.

#### Parâmetros fixos

| Peça | Parâmetros |
| --- | --- |
| Compressão | `IMAGE_SIDE_MAX = 2000`; `QUALITY_STEPS = [0.9, 0.85, 0.8, 0.7, 0.6, 0.5]`; WebP primeiro; JPEG com `opaque: true` (fundo branco). |
| Entrada | `IMAGE_INPUT_BYTES_MAX = 52_428_800`; `accept="image/*"`. |
| Storage | bucket `card-images`; caminho `{userId}/{imageId}`; `upload(path, blob, { contentType, upsert: false, cacheControl: '31536000' })`. |
| Envio | lotes de 200 na RPC (`chunk` existente); 2 uploads e 2 downloads simultâneos. |
| Prefetch | atual + 2 seguintes da fila (revisão e reforço). |
| Visualizador | `maxScale: 5`, `minScale: 1`, `step: 0.5`, `contain: 'outside'`; deslize ≥ 60 px na horizontal com `scale === 1`. |

### Endpoints da API

Todos já existem (migration da Fase 2). Esta entrega só os consome pelo `supabase-js`, com a sessão do usuário (`authenticated`).

#### Visão geral

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/rest/v1/card_images` | Pull incremental (keyset por `synced_at`, 500 por página). |
| `POST` | `/rest/v1/rpc/sync_push_images` | Metadados (inclusive tombstones), LWW no servidor. |
| `POST` | `/storage/v1/object/card-images/{user_id}/{image_id}` | Upload do arquivo. |
| `GET` | `/storage/v1/object/authenticated/card-images/{user_id}/{image_id}` | Download (`storage.download`). |
| `DELETE` | `/storage/v1/object/card-images` | Limpeza em lote (`storage.remove(paths)`). |

---

#### `GET /rest/v1/card_images`

Mesmo contrato de `pullTable` para as outras tabelas: `select=*`, `synced_at=gt.{cursor − 5 s}`, `order=synced_at.asc`, `limit=500`. A RLS devolve só as linhas do dono.

| Status | Corpo | Quando |
| --- | --- | --- |
| `200` | `card_images[]` | Página (vazia encerra o laço). |
| `401`/rede | erro | Propaga como hoje: a sincronização termina `offline`/`error`. |

```text
[{ "id": "e1f2…", "user_id": "u-1", "card_id": "c0a8…", "position": 0, "caption": "", "mime_type": "image/webp",
   "width": 2000, "height": 1250, "byte_size": 412345, "created_at": 1790000000000, "updated_at": 1790000000000,
   "deleted_at": 0, "synced_at": "2026-11-02T12:00:00.123Z" }]
```

---

#### `POST /rest/v1/rpc/sync_push_images`

**Corpo**: `{ "p_images": CardImageRow[] }` (exemplo na TechSpec-base). Só sobem imagens vivas com `blobState ∈ {uploaded, remote}` e tombstones.

| Status | Corpo | Quando |
| --- | --- | --- |
| `200` | `{ "images": n }` | `n` linhas aplicadas (versões mais velhas são ignoradas pelo `where`). |
| `400`/`23514` | erro PostgREST | `check` violado (não deve ocorrer: limites espelhados). O lote fica sujo, há `console.warn` com os ids, e as outras fases seguem. |
| `409`/`23503` | erro PostgREST | FK: cartão inexistente na nuvem (não deve ocorrer: cartões sobem antes). Mesmo tratamento. |

> Clamp de relógio no servidor (`least(updated_at, now + 1 h)`), igual ao `sync_push`.

---

#### `POST /storage/v1/object/card-images/{user_id}/{image_id}`

| Status | Quando | Cliente |
| --- | --- | --- |
| `200` | Gravado | `blobState: 'uploaded'` (com `dirty` explícito). |
| `409` (ou `400` com `statusCode '409'`/“Duplicate”) | Reenvio de arquivo que já subiu | Igual ao `200` (idempotente, TI-15). |
| `413` | > 1,5 MB | Não deve ocorrer. A imagem fica `local`, com `console.warn`. |
| `403` | Pasta de outro usuário | Não deve ocorrer (caminho montado com o `userId` da sessão vinculada). Idem. |
| rede | — | Fica `local`; nova tentativa na próxima sincronização. |

---

#### `GET …/card-images/{user_id}/{image_id}` (download)

| Status | Quando | Cliente |
| --- | --- | --- |
| `200` | Arquivo | Grava em `imageBlobs` e muda para `uploaded`. |
| `400`/`404` | Objeto ausente | Mantém `remote` (placeholder), com `console.warn`. Tenta de novo no próximo pedido. |
| rede | — | Mantém `remote`; o `ImagePrefetch` refaz no `online`. |

---

#### `DELETE /storage/v1/object/card-images` (`remove([...paths])`)

| Status | Quando | Cliente |
| --- | --- | --- |
| `200` | Removidos ou inexistentes | `blobState: 'purged'`. |
| erro/rede | — | Continua `pending-delete`; nova tentativa na próxima sincronização, sem aviso (RF78a, TI-16). |

---

## Pontos de integração

- **Supabase Storage** (bucket privado `card-images`, já criado): autenticação pela sessão do `supabase-js`; políticas de `select`/`insert`/`delete` só na pasta `auth.uid()`; sem `update` (arquivo imutável). Falhas tratadas por imagem, sem derrubar a sincronização. Idempotência: upload com `upsert: false` + 409 = sucesso; `remove` de objeto inexistente = sucesso. Sem timeout próprio: vale o do `fetch`.
- **PostgREST/RPC**: `sync_push_images` e o pull de `card_images`, com o mesmo cliente e o mesmo lock (`navigator.locks`) do `syncNow`. `fetchMissingImages` roda fora do lock: só lê `card_images` local e escreve `imageBlobs`/`blobState`, sem conflito com o push (que não toca imagens `remote`).
- **APIs do navegador**: `createImageBitmap` (com `imageOrientation: 'from-image'`), `OffscreenCanvas.convertToBlob` / `HTMLCanvasElement.toBlob`, `ClipboardEvent.clipboardData.files`, `<input type="file" capture>`, `URL.createObjectURL`, `<dialog>`, Pointer Events. Sem serviço de terceiros.

## Abordagem de testes

Vitest com `fake-indexeddb`, `src/test/db-helpers.ts` (`resetDb` no `afterEach`, agora com as tabelas novas), `src/test/fake-supabase.ts` (agora com `storage`) e `src/test/image-fixtures.ts`. O `setup.ts` troca `Blob`/`File` pelos de `node:buffer`, como no Lingo: o `Blob` do jsdom não sobrevive ao `structuredClone` do `fake-indexeddb`. Não há canvas no jsdom. `compressImage` é testado com um `ImageCodec` fake, que devolve blobs de tamanho controlado por qualidade e tipo, e `image-codec.ts` com `vi.stubGlobal` de `createImageBitmap` e `OffscreenCanvas`. Relógio fixado com `vi.setSystemTime`; `crypto.randomUUID` determinístico onde a asserção depende do id. Piso de 80% em `src/app/domain/**`. Todo módulo novo de `domain/` entra com teste no mesmo commit.

Prioridade (regra 3 de `tests.md`): (1) integridade entre aparelhos, isto é, ordem e idempotência do envio, CAS, tombstones e LWW do pull (TI-15, TI-16, TI-I1–TI-I7); (2) atomicidade de salvar e excluir (TI-I8–TI-I11); (3) compressão e rascunho (TU-28, TU-I*); (4) textos e teclas.

### Testes de unidade

| ID | Nome do caso de teste | Critérios de aceitação | Resultado esperado |
|----|-----------------------|------------------------|--------------------|
| TU-28 | `fitWithin` e laço de qualidade da compressão | CA-40 | 4000×3000 → 2000×1500; 800×600 inalterado; 1500×3000 → 1000×2000; para na 1ª qualidade que dá ≤ 1,5 MB. |
| TU-I1 | Compressão cai para JPEG quando o codec não devolve WebP | CA-I4 | Codec fake devolve `image/png` ao pedir WebP → saída `image/jpeg` com `opaque: true`. |
| TU-I2 | Compressão recusa entrada > 50 MB sem decodificar | CA-I4 | `ImageError('input-too-large')`; `decode` não é chamado. |
| TU-I3 | Compressão propaga arquivo ilegível | CA-I4 | `decode` rejeita → `ImageError('unreadable')` com a mensagem do PRD. |
| TU-I4 | Compressão desiste quando nem 0,5 cabe | RF74d | `ImageError('too-large')`; tentou as 6 qualidades em ordem. |
| TU-I5 | `browserCodec` usa orientação da imagem, fundo branco no opaco e libera o bitmap | CA-I5 | `createImageBitmap` chamado com `imageOrientation: 'from-image'`; `fillRect` antes do `drawImage` só com `opaque`; `close()` chamado. |
| TU-I6 | `acceptedCount` respeita o limite de 6 | CA-I1 | (4, 5) → 2; (6, 1) → 0; (0, 3) → 3. |
| TU-I7 | `moveItem` e `removeItem` não mutam a lista e respeitam as pontas | CA-I9 | Mover a 3ª para a esquerda → 2ª; mover a 1ª para a esquerda → lista igual (nova referência só quando muda). |
| TU-I8 | `planGallerySave` gera adds, updates só do que mudou e removals | CA-I9, CA-I10 | Legenda alterada vira update; imagem intacta não aparece; removida vira removal; posição limitada a 5. |
| TU-I9 | `hasDraftChanges` detecta texto, etiquetas, ordem, legenda e imagens | CA-I10 | Igual → `false`; cada diferença isolada → `true`; espaços nas pontas não contam. |
| TU-I10 | `parseCardImageRow`/`toCardImageRow` | CA-42 | Ida e volta preservam campos; `dirty: 0`; `mime_type: 'image/gif'` ou campo ausente → `null`. |
| TU-I11 | `isDuplicateUpload` | TI-15 | `status 409`, `statusCode '409'` e “Duplicate” → `true`; 403/413 → `false`. |
| TU-I12 | Textos da galeria e de Ajustes | CA-I1, CA-I7, CA-I19, CA-I23 | “6 de 6 imagens”; “Aguardando 1 imagem”/“2 imagens”; “Só cabiam mais 2 imagens; 3 ficaram de fora.”; “3 imagens aguardando envio”; “34 imagens · 12,3 MB” e “… de 1 GB”; alt “Imagem 2 de 4 do cartão” sem legenda. |
| TU-I13 | `viewerKeyAction` e `swipeDirection` | CA-41, CA-I13 | ←/→/+/−/=/Escape mapeados; Espaço, 1 e 2 → `null`; deslize só com `scale === 1` e `|dx| ≥ 60` maior que `|dy|`. |

### Testes de integração

| ID | Nome do caso de teste | Critérios de aceitação | Resultado esperado |
|----|-----------------------|------------------------|--------------------|
| TI-15 | Push de imagem: upload → metadados → `uploaded`; `409` no reenvio | CA-42 | Ordem upload antes da RPC; metadado de imagem `local` nunca na RPC; reenvio com 409 conta como sucesso; `dirty: 0`. |
| TI-16 | Tombstone de imagem e limpeza do arquivo com falha e nova tentativa | CA-43 | RPC com `deleted_at` antes do `remove`; `remove` falhando mantém `pending-delete`; próxima sincronização → `purged`. |
| TI-I1 | Falha de upload de uma imagem não bloqueia as outras nem a sincronização | CA-I19 | Upload da imagem B falha: A sobe e fica limpa; B fica `local` e suja; `syncNow` → `ok`; cartões e logs enviados antes. |
| TI-I2 | CAS: legenda editada durante o envio continua suja | CA-I20 | `updatedAt` muda entre a leitura e o `clearDirty` → `dirty` permanece 1, e o próximo push leva a legenda nova. |
| TI-I3 | Pull de imagem nova sem blob local | CA-42 | Linha gravada com `blobState: 'remote'`, `dirty: 0`; cursor `cursor:card_images` avançado. |
| TI-I4 | Pull LWW de legenda e de tombstone | CA-I20, CA-43 | Versão remota mais nova vence e mantém o blob local (`uploaded`); mais velha perde; tombstone vencedor apaga o blob e marca `purged`. |
| TI-I5 | Cartão chega excluído pelo pull → imagens vivas dele são tombstonadas | CA-43 | Imagem local viva do cartão vira `deletedAt > 0`, `pending-delete`, suja, sem blob. |
| TI-I6 | `fetchMissingImages` baixa só o que falta e é deduplicado | CA-42, CA-I18 | Duas chamadas simultâneas para o mesmo cartão → 1 `download` por imagem; grava blob; `uploaded`; `dirty` preservado. |
| TI-I7 | `fetchMissingImages` sem rede, sem conta ou com download falhando | CA-I16, CA-I17 | Offline/sem cliente/sem sessão → 0 chamadas; 404 ou erro de rede → continua `remote`, sem lançar. |
| TI-I8 | `saveNewCard` grava cartão, metadados e blobs numa transação | CA-I11, CA-40 | 1 cartão, 2 `cardImages` (`local`, posições 0 e 1), 2 `imageBlobs`; campos FSRS iguais a `newCardRecord`. |
| TI-I9 | `saveNewCard` com cota estourada não grava nada | CA-I8 | `imageBlobs.add` lança `QuotaExceededError` → `ImageError('storage-full')`; nenhum cartão nem imagem gravado. |
| TI-I10 | `saveCardEdit` reordena, legenda, remove e não reagenda | CA-I9, CA-I11, CA-I10 | Só os itens mudados ficam sujos; a removida é tombstonada sem blob; `due`/`reps` intactos; sem mudança de texto, `cards.updatedAt` não muda. |
| TI-I11 | Excluir cartões e baralho tombstona as imagens na mesma transação | CA-43, CA-I22 | `deleteCards`/`deleteDeck` → imagens `pending-delete`, blobs apagados; `imageUsage()` cai na hora. |
| TI-I12 | `imageUsage` e `pendingUploadCount` | CA-I19, CA-I23 | Conta só imagens vivas de cartões vivos; `pending` = vivas em `local`. |
| TI-I13 | Entrar na conta: juntar, descartar e trocar de conta | CA-I21 | `merge` marca imagens sujas e as com blob como `local`, e limpa `cursor:card_images`; `discard`/troca apagam `cardImages` e `imageBlobs`. |
| TI-I14 | Sem Supabase configurado, `syncNow` e o prefetch não tocam em imagens | CA-I16 | `disabled`; nenhuma linha muda de `blobState`; nenhum erro. |

### Testes E2E

Roteiros executados à mão com a skill `agent-browser` contra `npm start -- --port <porta livre em 4200–4299>`. E2E-I6 e E2E-I7 usam `npx supabase start` com dois perfis de navegador (aparelhos A e B). E2E-I8 roda contra o build de produção servido localmente, para haver service worker. As capturas vão para `tasks/prd-imagens-notas/evidences/`, sem Playwright nem pasta `e2e/`. As imagens de teste são geradas por um script de apoio no scratchpad do agente: foto 4000×3000 (12 MP) com EXIF de GPS e orientação “retrato”, PNG transparente, GIF animado, um `.txt` renomeado para `.png`, um esquema com texto de 10 pt e um `.pdf`. Elas entram pelo `upload` do `agent-browser`, e a colagem é simulada com `eval` despachando um `ClipboardEvent` com `DataTransfer`. Tamanho, dimensões e EXIF do salvo são conferidos por `eval` no IndexedDB (`blob.size`, `createImageBitmap`) e pelo arquivo baixado.

| ID | Nome do caso de teste | Critérios de aceitação | Resultado esperado |
|----|-----------------------|------------------------|--------------------|
| E2E-18 | Colar foto grande, revisar, ampliar, sincronizar e excluir em dois aparelhos | CA-40–CA-43 | Foto de 12 MP salva ≤ 2.000 px e ≤ 1,5 MB; zoom e Escape; chega ao B depois que A reconecta e B exibe o cartão; exclusão some no B após sincronizar. |
| E2E-I1 | Adicionar, limite e mensagens | CA-I1, CA-I2, CA-I4, CA-I7 | 4 + 5 arquivos → entram 2, “6 de 6 imagens”, botões desabilitados, aviso dos 3; colar imagem com foco no Verso não muda o Verso, colar texto não muda a galeria; PNG transparente vira WebP com alfa; GIF vira imagem parada; `.txt`/`.pdf` → “Não foi possível abrir…”; “Preparando imagem…” e “Aguardando 1 imagem” com os campos editáveis. |
| E2E-I2 | Câmera no celular emulado | CA-I3 | Com `pointer: coarse` (emulação de dispositivo), “Tirar foto” existe e o `input` tem `capture="environment"`; o arquivo enviado aparece na galeria sem sair da tela. |
| E2E-I3 | Orientação, metadados, dimensões e legibilidade | CA-I5, CA-I6 | A foto “retrato” fica em pé; o blob salvo não tem segmento EXIF/GPS; 800×600 continua 800×600; o esquema de 10 pt legível no visualizador ampliado em 360 px (captura). |
| E2E-I4 | Organizar e descartar | CA-I9, CA-I10, CA-I11 | Mover a 3ª para a esquerda e legendar “Mapa: atos” → na revisão é a 2ª, com alt e legenda; remover + “← Voltar” → “Descartar alterações?”; confirmar mantém as 3; sem mudança sai direto; o mesmo com texto e com Escape no diálogo da revisão; criação em série limpa a galeria; editar imagens não muda o “próxima revisão” do cartão. |
| E2E-I5 | Revisão, reforço e visualizador | CA-41, CA-I12, CA-I13, CA-I14, CA-I15, CA-I24 | Nada antes de revelar; miniaturas na ordem, sem pulo do texto; Enter abre; →/←, +/−, toque duplo, roda e deslize; “2 / 4” → “3 / 4”; 2 e Espaço não respondem com o visualizador aberto; Escape devolve o foco à miniatura, e então 2 registra “Acertei”; reforço igual, sem alterar agenda; editar na revisão e adicionar imagem mostra a nova miniatura; sessão com 6 imagens por cartão responde em < 150 ms e abre em < 300 ms (painel Performance). |
| E2E-I6 | Dois aparelhos, offline e envio pendente (Supabase local) | CA-42, CA-I17, CA-I18, CA-I19, CA-I20 | A offline salva 3 imagens → Ajustes “3 imagens aguardando envio”; reconecta → some; B sincroniza: rede cortada → placeholder e cartão respondível; religada → imagem aparece sozinha; depois de responder, os 2 próximos já estão em `imageBlobs`; legenda editada em A e depois em B → os dois mostram a de B. |
| E2E-I7 | Conta, exclusões e contador (Supabase local) | CA-43, CA-I21, CA-I22, CA-I23 | Juntar dados com imagens locais → aparecem no B; descartar → somem do aparelho e do contador; excluir baralho com 10 cartões ilustrados → contador cai na hora e, após sincronizar, os objetos somem do bucket (Studio, porta 55323); “N imagens · X MB de 1 GB” com conta e sem o “de 1 GB” sem conta. |
| E2E-I8 | Sem conta, sem rede, build de produção | CA-I16, CA-I8 | Sem `env` do Supabase e com o DevTools offline: cria cartão com 3 imagens, revisa, amplia (o chunk do panzoom veio do cache do SW) e exclui, sem nenhuma mensagem de erro ou de envio. Com a cota do DevTools reduzida (Application → Storage → cota simulada), salvar mostra “Sem espaço no aparelho…” e o texto continua no formulário. |
| E2E-I9 | Legibilidade e acessibilidade | CA-I25, CA-23 | 360 px sem rolagem horizontal no formulário, na galeria e no visualizador; todas as ações por Tab/Enter; áreas de toque ≥ 44 px; foco preso no visualizador; `prefers-reduced-motion` sem animação; `npm run check:type-scale` verde. |

## Sequenciamento do desenvolvimento

### Ordem de construção

1. **Base de dados local** — `db-types.ts`, `db.ts` `version(2)`, limites em `card-limits.ts`, `setup.ts` com o `Blob` do Node, `resetDb`, `image-fixtures.ts`. Vem primeiro porque tudo grava ou lê essas tabelas, e o `Blob` no `fake-indexeddb` é o primeiro risco de teste.
2. **Compressão** — `image-errors.ts`, `image-resize.ts`, `image-codec.ts`, `image-compress.ts` → TU-28, TU-I1–TU-I5. Validar cedo num celular real (Android e iPhone): WebP/JPEG, orientação e memória.
3. **Rascunho, salvar e excluir** — `gallery-draft.ts`, `card-draft.ts`, `card-save.ts`, `card-images.ts`, mudanças em `cards.ts`/`decks.ts` → TU-I6–TU-I9, TI-I8–TI-I12. A atomicidade é provada antes de existir tela.
4. **Formulário** — `ui/image-thumb`, `ui/image-gallery-editor` (+ item), `card-form`, `confirm-dialog.ask`, `confirmLeave`, `card-new`/`card-edit`/`card-edit-dialog` → E2E-I1–E2E-I4. Neste ponto o fluxo inteiro já funciona sem conta.
5. **Revisão** — `viewer-input.ts`, `@panzoom/panzoom`, `ui/image-viewer`, `ui/image-gallery`, `card-face`, `review.ts` (teclas com `dialog[open]`), tokens do visualizador → TU-I13, E2E-I5.
6. **Sincronização** — `fake-supabase` com `storage`, `sync-rows-image.ts`, `sync-pull-images.ts`, pull da 5ª tabela e tombstone por cartão, `image-storage.ts`, `image-sync-push.ts`, `sync.ts`, `local-data.ts` → TU-I10, TU-I11, TI-15, TI-16, TI-I1–TI-I5, TI-I13, TI-I14.
7. **Download e Ajustes** — `image-download.ts`, `state/image-prefetch.ts`, prefetch nas sessões, `pages/settings/settings-images`, `image-labels.ts` → TI-I6, TI-I7, TU-I12.
8. **Validação** — `npm run lint`, `npm run check:type-scale`, `npm run test:coverage`, `npm run build` (conferir que o `initial` do bundle não cresceu com o panzoom); E2E-18, E2E-I6, E2E-I7 com Supabase local; E2E-I8 no build de produção; E2E-I9.

### Dependências técnicas

- Fase 1 e [prd-dificeis-reforco](../prd-dificeis-reforco/techspec.md) concluídas: `ui/card-face`, `ui/card-edit-dialog`, `ui/session-shell`, `ReinforceSession`, `review-keys`.
- Migration `20261101000000_images_reminders.sql` já aplicada em produção (confirmado pelo Rafael) e aplicada no local por `npx supabase start`/`db reset`. **Sem migration nova, sem reemitir `sync_push`, sem variável de ambiente.**
- Dependência npm nova: `@panzoom/panzoom` (MIT, sem dependências transitivas), carregada só por `import()` dinâmico. O chunk entra no prefetch de `/*.js` do `ngsw-config.json`, então o visualizador funciona offline depois da primeira visita, sem mudar o arquivo.
- Supabase local (Docker) para E2E-18, E2E-I6 e E2E-I7. Um celular real (ou o dispositivo do Rafael) para a etapa 2 e para o iPhone instalado.
- Deploy: só com a promoção da `des` para a `prod`, a pedido do Rafael. Os fluxos offline são validados no preview da `des`, que não tem Supabase.

## Monitoramento e observabilidade

Sem backend novo e sem telemetria.

- Erros esperados (`ImageError`) aparecem na tela e não vão para o console.
- Falhas de envio, download e limpeza vão para `console.warn` com o id da imagem, a fase (`upload`, `metadata`, `remove`, `download`) e o código do erro, **sem** legenda nem conteúdo, no mesmo padrão do `warnRejectedChunk`.
- Sinais visíveis ao usuário, que servem de monitoramento manual: “N imagens aguardando envio” (fila de upload presa) e o contador de Ajustes (uso da cota). A cota real do bucket é conferida no painel do Supabase de produção.
- Tempo de compressão e de abertura do visualizador medidos à mão nos E2E (painel Performance).

## Considerações técnicas

### Principais decisões

- **Metadados e arquivo em tabelas separadas** (padrão `audioBlobs` do Lingo e da TechSpec-base). Listas, buscas, contagens e o pull não carregam `Blob`, e o LWW trabalha só com metadados pequenos.
- **`blobState` local com 5 estados**: a base previa 4. Entrou `purged` para distinguir o tombstone já limpo do `pending-delete` que ainda precisa de `remove()`. Sem ele, a fase 3 tentaria apagar para sempre.
- **Rascunho em memória + uma transação ao salvar**, em vez de gravar cada imagem ao adicionar. Cancelar não deixa lixo, a cota estourada não grava nada pela metade (CA-I8), e o RF76c sai de graça. Custo: até 6 blobs comprimidos (≤ 9 MB) em memória enquanto o formulário está aberto, o que é aceito.
- **Compressão na thread principal** (mesma decisão da importação do Anki): `createImageBitmap` e a codificação do canvas já são assíncronas. A parte síncrona é o `drawImage`, de dezenas de ms. Descartado: Worker com `OffscreenCanvas`, por mais um build e um protocolo de mensagens para ganho pequeno.
- **WebP detectado pelo resultado** (`blob.type`), não pelo navegador. O Safari devolve PNG ao pedir WebP, e o código cai para JPEG sem lista de navegadores.
- **Sempre recodificar**: mesmo uma imagem pequena passa pelo canvas, o que remove EXIF/GPS (PRD, privacidade) e uniformiza o formato.
- **Miniatura = o próprio arquivo** com `object-cover` e `decoding="async"`, sem gerar uma segunda versão pequena. Menos estado e nada a sincronizar. Se o E2E-I5 medir atraso com 6 imagens de 2.000 px no celular, a evolução é um cache local de miniaturas gerado ao gravar o blob, sem tocar no sync.
- **Envio em três fases, depois de cartões e logs, com falhas isoladas**: cumpre o RF77b e a FK, e garante que outro aparelho nunca vê metadado de arquivo ausente. Descartado: enviar imagens dentro do `pushDirty`, porque um 413/403 numa imagem abortaria a sincronização de texto.
- **Tombstone das imagens no cliente** ao excluir cartão ou baralho e ao receber um cartão excluído: cartões nunca são apagados no Postgres (só tombstonados), então o `on delete cascade` da FK não dispara.
- **Posição limitada a 0–5 na gravação**: edições concorrentes podem deixar mais de 6 imagens vivas num cartão (o banco não tem unicidade por cartão). Renumerar além de 5 violaria o `check` e travaria o lote inteiro. A exibição desempata por `createdAt`. O editor bloqueia novas imagens enquanto houver 6 ou mais.
- **Download sob demanda pelo cartão exibido + 2**, e nunca a conta inteira (PRD, fora do escopo). O prefetch fica num serviço raiz porque galeria, revisão e reforço pedem a mesma coisa, e o `online` é tratado num lugar só.
- **Atalhos da revisão suspensos por `dialog[open]`**: cobre o visualizador (que vive dentro de `ui/`, sem a página conhecer) e o editor com uma regra só. Descartado: um store global de “modal aberto”.
- **`@panzoom/panzoom`** (decisão da base): pinça, roda, arrasto e limites prontos em ~4 KB. Deslize e toque duplo ficam em `viewer-input.ts`, que é puro e testável. Descartado: escrever o zoom com Pointer Events, que daria mais código e mais risco no iOS.
- **Reordenar com `@angular/cdk/drag-drop`**, já instalado, e não com outra biblioteca. Os botões “Mover” continuam sendo o caminho acessível e o único no celular.
- **Aviso de descarte criado nesta entrega** (decisão do Rafael): o PRD citava um aviso que não existia. A comparação é pura (`hasDraftChanges`), com três entradas: `canDeactivate` nas rotas, `cancel` do diálogo e `beforeunload`.
- **Fundo do visualizador por token fixo** (`--viewer`), porque `ink` vira o fundo claro no tema claro (AGENTS), e o PRD pede fundo escuro nos dois temas.

### Riscos conhecidos

- **Memória ao decodificar fotos enormes no iPhone** (48 MP ≈ 190 MB em RGBA). Mitigação: recusar entradas > 50 MB e, quando o lado maior passar de 2× o alvo, decodificar de novo com `createImageBitmap(file, { resizeWidth, resizeHeight, resizeQuality: 'high' })` onde houver suporte. Validar na etapa 2 com uma foto de 48 MP.
- **`Blob` no `fake-indexeddb`**: sem o `Blob` do Node no setup, o teste grava um objeto vazio e passa errado. Mitigação: o setup do Lingo e uma asserção de `blob.size` em TI-I8.
- **Safari**: sem codificação WebP (vira JPEG, maior para esquemas com texto) e com `OffscreenCanvas` só a partir do 16.4 (há o *fallback* para `<canvas>`). HEIC só abre no Safari. Mitigação: TU-I1 e o teste no iPhone da etapa 2.
- **Pinça do visualizador × zoom da página no iOS**. Mitigação: `touch-action: none` só no palco do visualizador e `html:has(dialog[open]) { overflow: hidden }`.
- **Colar no celular**: o menu “Colar” do iOS/Android nem sempre entrega imagens ao evento `paste` de um campo de texto. Mitigação: “Adicionar imagem” e “Tirar foto” cobrem o celular. O E2E-I1 valida a colagem no desktop.
- **Cota do Storage** (1 GB). Mitigação: limites, contador em Ajustes e conferência periódica no painel. Não há bloqueio nesta entrega.
- **Vazamento de object URLs** numa sessão longa de revisão. Mitigação: só `ui/image-thumb` cria URLs, e ele revoga a cada troca de `Blob` e no `destroy`.
- **Corrida “excluir no A × adicionar imagem no B”**: resolvida pelo tombstone por cartão no pull (TI-I5). O arquivo enviado por B é removido pelo próprio B na sincronização seguinte.
- **Detecção do 409 do Storage** varia entre versões (`409` ou `400` com `statusCode '409'`). Mitigação: `isDuplicateUpload` cobre as duas (TU-I11) e é conferido contra o Supabase local no E2E-I6.
- **Tamanho de arquivos**: `image-sync-push.ts` e `image-gallery-editor` são os candidatos a passar de 100 linhas. Se passarem, separar uma fase por arquivo (`image-sync-upload.ts`, `image-sync-remove.ts`) e extrair do editor a área de adicionar (`image-add-bar`).

### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e todas as rules de `.agents/rules/` (`code-standards.md`, `javascript-typescript.md`, `tests.md`).

- **Camadas**: toda regra, consulta e escrita em `domain/`, sem `@angular/*` nem `rxjs`. Canvas, `createImageBitmap` e `navigator.onLine` são APIs do navegador, como o `DOMParser` da importação. `pages/` e `ui/` não abrem o Dexie nem o Supabase: leitura reativa por `liveQueryFor` (galeria) e `liveQuerySignal` (Ajustes), e escrita direta por funções de `domain/` (`saveNewCard`, `saveCardEdit`). `state/image-prefetch.ts` existe porque o prefetch é compartilhado entre galeria, revisão e reforço. `ui/` não importa `pages/`. `liveQuery()` continua só em `state/live-query.ts`.
- **Regras de domínio**: lacuna continua só na Frente (as imagens não têm marcas, e `normalizeCardMarks` segue no salvar); campos FSRS nunca escritos fora do `scheduler` (TI-I10); reforço sem escrita, porque a galeria só lê e o prefetch grava apenas blobs baixados, que não são dados de estudo, e a regra `no-restricted-imports` do reforço não é afetada; limites em `card-limits.ts`, espelhando os `check` do banco e do bucket.
- **Schema e sync**: nenhuma coluna nova em `cards`/`decks`/`user_settings`, então `sync_push` e `sync-rows` dos cartões não mudam. Imagens têm tabela e RPC próprias, já aplicadas. Nenhuma migration editada.
- **Código**: arquivos ≤ 100 linhas (extrações de `db-types.ts` e `local-data.ts` previstas), funções ≤ 30 linhas, ≤ 3 parâmetros (objetos `EncodeInput`, `{ deckId, draft }`, `{ saved, items, now }`), constantes nomeadas (tabela de parâmetros), `function` no topo e arrow em callbacks, `unknown` + zod nas linhas remotas e nos erros do Storage (nunca `any`), `ImageError` como classe, `import type` para `SupabaseClient`, `import()` dinâmico para o panzoom, `void` explícito nos disparos em segundo plano (`void prefetch.request(...)`), sem comentários.
- **UI**: standalone, OnPush, `input()`/`model()`/`output()`, `inject()`, `@if`/`@for`; `<dialog>` nativo; `<input type="file">` com rótulo visível; cores por token (`viewer`, `on-viewer` novos); escala `text-label`/`text-meta`/`text-body`, sem `text-xs` nem tamanhos arbitrários; `npm run check:type-scale`.
- **Testes**: todo módulo novo de `domain/` com teste, AAA, relógio e ids fixados, fakes do repositório (o `fake-supabase` ganha `storage`, sem rede real), nenhum disco. UI pelos roteiros E2E com `agent-browser`.
- **Commits**: sem linha de coautoria de modelo.

### Conformidade com skills

- `angular-developer`: `model()` para a lista do editor, `DestroyRef` para revogar URLs e soltar o `online`, `CanDeactivateFn` funcional, `HostListener('window:beforeunload')`, `@angular/cdk/drag-drop` com `cdkDropListOrientation="mixed"`, `<dialog>` com foco devolvido, `import()` dinâmico.
- `supabase`: consumo do Storage (`upload` com `upsert: false`, `download`, `remove` em lote), RLS por pasta e RPC existente. Nenhuma mudança de schema: a migration da Fase 2 já cobre RLS e o bucket.
- `agent-browser`: roteiros E2E-18 e E2E-I1–E2E-I9, inclusive `upload`, emulação de dispositivo/offline/cota e `eval` no IndexedDB.
- `vercel-cli`: não se aplica (nenhuma variável nova).

Desvios em relação à TechSpec-base: os nomes `images.ts`/`image-sync.ts` viraram `card-images.ts`, `card-save.ts`, `image-sync-push.ts`, `image-download.ts` e `sync-pull-images.ts`, por responsabilidade e pelo limite de 100 linhas; `blobState` ganhou `purged`; `mimeType` gerado é só WebP/JPEG.

### Arquivos relevantes e dependentes

- Novos: `src/app/domain/{db-types,image-errors,image-resize,image-codec,image-compress,gallery-draft,card-draft,card-save,card-images,sync-rows-image,sync-pull-images,image-storage,image-sync-push,image-download,local-data,image-labels,viewer-input}.ts` e os respectivos `.test.ts`; `src/app/state/image-prefetch.ts`; `src/app/ui/{image-thumb,image-gallery,image-viewer,image-gallery-editor}/*` (com `image-editor-item`); `src/app/pages/settings/settings-images.{ts,html}`; `src/test/image-fixtures.ts`.
- Modificados: `src/app/domain/{db,card-limits,cards,decks,auth,sync,sync-pull,sync-pull-page,sync-pull-apply,sync-rows}.ts`; `src/app/state/{review-session,reinforce-session,guards}.ts`; `src/app/ui/{card-form,card-face,card-edit-dialog,confirm-dialog}/*`; `src/app/pages/{card-new,card-edit}/*`, `src/app/pages/review/review.ts`, `src/app/pages/settings/settings.{ts,html}`; `src/app/app.routes.ts`; `src/styles.css`; `src/test/{setup,fake-supabase,db-helpers}.ts`; `package.json`/`package-lock.json`.
- Só leitura (contrato inalterado): `supabase/migrations/20261101000000_images_reminders.sql`, `src/app/domain/{lww,sync-push,sync-push-dirty,text-marks-normalize,tags,scheduler,reinforce}.ts`, `src/app/state/live-query.ts`, `ngsw-config.json`.
- Referência no Lingo (`~/Desktop/lingo`, branch `des`): `src/services/db.ts` (`audioBlobs` e a limpeza junto com o cartão em `deleteCard`/`deleteDeck`), `src/test/setup.ts` (`Blob` de `node:buffer`), `src/services/dbMigrations.test.ts` (teste de upgrade de versão do Dexie).
- Documentos: [tasks/produto/techspec.md](../produto/techspec.md) (linhas de `images.ts`/`image-compress.ts`/`image-sync.ts`, `CardImage`, endpoints de Storage, TU-28/TI-15/TI-16/E2E-18, que esta TechSpec detalha); [prd.md](prd.md) (RF76c e CA-I10 atualizados com o aviso de descarte).
