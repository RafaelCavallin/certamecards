# Especificação técnica — Backup e restauração

> PRD: [prd.md](prd.md). TechSpec-base: [tasks/produto/techspec.md](../produto/techspec.md). O modelo `Deck`/`Card`/`ReviewLog`/`UserSettings`/`CardImage`, o Dexie `version(2)`, a sincronização, a fila de imagens e as decisões gerais estão lá e em [prd-imagens-notas/techspec.md](../prd-imagens-notas/techspec.md), e este documento não os repete. Os IDs de teste da base (TU-29, TI-13, TI-14, E2E-16) foram mantidos. Os casos próprios usam o sufixo `B` (`TU-B*`, `TI-B*`, `E2E-B*`). A lógica é portada do Lingo (`services/backupFormat.ts`, `backupManifest.ts`, `backupPlan.ts`, `backupApply.ts`, `backupRecords.ts`, `backupExport.ts`, `backupRestore.ts`, `components/restoreConfirm.ts`, `RestorePlanChoice.tsx`, `BackupSection.tsx`), sem áudio. São novos: imagens no arquivo, configurações do usuário, o formato de linha da sincronização como formato do arquivo, a entrega pelo compartilhamento no iPhone, a restauração atômica com imagens e o aviso de 30 dias.

## Resumo

O backup é um `.zip` com `backup.json` (o manifesto) e uma pasta `images/` com um arquivo por imagem, sem recompressão. O manifesto guarda cada registro **no mesmo formato de linha que a sincronização envia ao Supabase** (`toDeckRow`, `toCardRow`, `toLogRow`, `toSettingsRow`, `toCardImageRow`), e a leitura reusa os parsers da sincronização (`parseDeckRow`, `parseCardRow`…). Assim o arquivo tem uma única definição de formato, e a normalização que já protege o pull (marcas com lacuna só na Frente, etiquetas normalizadas) protege também a restauração. Por decisão do Rafael, o arquivo leva também os baralhos e cartões **excluídos** (como no Lingo): sem eles, as revisões de cartões excluídos apontariam para linhas inexistentes e o push numa conta nova falharia na FK de `review_logs`. A prévia e o resumo contam só os não excluídos. A compactação usa o `fflate` que já está no projeto (importação do Anki), no modo de streaming (`Zip` com `ZipDeflate` para o JSON e `ZipPassThrough` para as imagens), com progresso por arquivo.

A restauração lê o arquivo inteiro uma vez, valida o manifesto (envelope rígido, registros soltos inválidos descartados e contados), monta a prévia sem gravar nada e, na confirmação, aplica tudo numa **única transação Dexie** sobre `decks`, `cards`, `reviewLogs`, `settings`, `cardImages` e `imageBlobs`. Os `Blob` das imagens são montados antes de abrir a transação, para que nada fora do Dexie seja aguardado dentro dela; falha, falta de espaço ou recarregamento abortam a transação e o IndexedDB desfaz tudo (RF67l). Isso substitui o “dados numa transação, mídia depois” do Lingo. **Mesclar** aplica LWW por linha (`wins` de `lww.ts`) e une revisões por id. **Substituir** grava o arquivo por cima carimbando `updatedAt = agora` (senão o servidor manteria a versão mais nova e o pull desfaria a substituição), exclui por tombstone os baralhos, cartões e imagens locais que o arquivo não tem, e também une as revisões. Toda linha gravada fica `dirty: 1`, e as imagens gravadas ficam `blobState: 'local'`: com conta, a sincronização e a fila de imagens existentes enviam o resultado, sem mudança de schema nem de RPC. A tela `/ajustes/backup` tem a seção de exportação e a restauração em passos, com o estado num serviço de escopo da página. O aviso de 30 dias (RF69) é uma regra pura em `domain/` lida por Ajustes, com a data do último backup em `localStorage`.

## Arquitetura do sistema

### Visão dos componentes

| Camada | Módulo | Novo/mod. | Papel |
| --- | --- | --- | --- |
| domain | `backup-format.ts` | novo | Constantes (`BACKUP_FORMAT = 'certamecards-backup'`, `BACKUP_VERSION = 1`, `MANIFEST_PATH = 'backup.json'`, `IMAGES_DIR = 'images'`), `imageEntryPath(id, mime)` e os tipos `BackupContent`, `ParsedBackup`, `BackupPreview`, `RestorePlan`, `RestoreProgress`, `RestoreReport`. |
| domain | `backup-errors.ts` | novo | `BackupError` (`code`: `not-backup`, `newer-version`, `empty`, `storage-full`, `delivery-failed`, `nothing-to-save`) e `backupErrorMessage(code)` em português (RF67b, RF66f, RF67i). |
| domain | `backup-records.ts` | novo | `collectBackupContent()`: lê decks e cards (vivos e excluídos), todas as revisões, a linha `settings` (ou `null`) e as imagens vivas de cartões vivos que têm `imageBlobs`; devolve o conteúdo e a contagem de imagens sem arquivo no aparelho (os arquivos são lidos depois, por `backup-export`). `hasBackupContent()` (algum baralho ou cartão vivo). `hasStudyData()` (algum cartão vivo ou revisão). |
| domain | `backup-images.ts` | novo | `downloadMissingForBackup()`: chama `fetchMissingImages` (de `image-download.ts`) com os ids dos cartões vivos, só com sessão e rede; nunca lança (RF66e). |
| domain | `backup-manifest-write.ts` | novo | `toManifest(content, meta)`: serializa com os `to*Row` da sincronização e acrescenta `path` às imagens. |
| domain | `backup-manifest-read.ts` | novo | `parseManifest(raw)`: envelope por Zod (`format` literal, `version` numérica). Versão maior que `BACKUP_VERSION` → `newer-version`; envelope inválido → `not-backup`. Cada registro passa pelo `parse*Row` correspondente (com `synced_at` sintético) e pelas regras de `backup-validate.ts`; inválidos são descartados e contados. |
| domain | `backup-validate.ts` | novo | Regras de entrada além do parser: `validateCardContent` (limites de `card-limits`), integridade referencial dentro do arquivo (cartão sem baralho, revisão sem cartão/baralho, imagem sem cartão vivo → descartados), imagem fora de `IMAGE_MIME_TYPES`/`IMAGE_BYTES_MAX`/`IMAGE_CAPTION_MAX`/`IMAGES_PER_CARD_MAX` ou sem arquivo no zip → descartada. |
| domain | `backup-zip.ts` | novo | `zipBackup(input)`: streaming do `fflate` (`Zip` + `ZipDeflate` no manifesto + `ZipPassThrough` nas imagens) → `Blob`, com progresso por arquivo. `unzipManifest(bytes)` (devolve o manifesto e os caminhos de `images/`) e `unzipImages(bytes, paths)`: `unzipSync` do `fflate` com `filter`, sem inflar o que não foi pedido. ZIP ilegível → `not-backup`. |
| domain | `backup-export.ts` | novo | `createBackup(onProgress)`: `downloadMissingForBackup` → `collectBackupContent` → `toManifest` → `zipBackup`; devolve `{ blob, fileName, missingImages }`. `backupFileName(now)` → `certamecards-backup-AAAA-MM-DD.zip` (data local). Sem dados → `nothing-to-save` (RF66g). |
| domain | `backup-estimate.ts` | novo | `estimateBackupSize()`: tamanho do JSON serializado + soma de `byteSize` das imagens com arquivo (RF66a). |
| domain | `file-delivery.ts` | novo | `chooseDelivery({ standalone, canShareFiles })` (pura) → `'share' \| 'download'`; `deliverFile(blob, name)`: `navigator.share({ files })` no iPhone instalado, âncora `download` nos demais. Cancelamento ou falha do compartilhamento → `delivery-failed` (RF66b). |
| domain | `backup-plan.ts` | novo | Port de `backupPlan.ts`: `selectWinners` (LWW por linha com `wins`), `selectOrphans` (locais vivos que o arquivo não tem) e `selectBlobFills` (imagem local vencedora, mas sem arquivo no aparelho, que o zip tem). Sem I/O. |
| domain | `backup-apply.ts` | novo | `applyBackup(input)`: a transação única. Ordem: `dropUntouchedDefaultDeck` → decks → cards → settings → imagens + blobs → revisões (união) → tombstones de órfãos (Substituir). Lotes de 500 com `onProgress` entre eles. `QuotaExceededError` → `storage-full`. |
| domain | `backup-apply-rows.ts` | novo | Passos da transação: `applyRows(table, rows, plan)`, `addMissingLogs(logs)`, `tombstoneOrphans(content, now)` (decks, cards e, via `tombstoneImages`/`tombstoneImagesOfCards`, imagens) e `dropUntouchedDefaultDeck(content, now)` (port do Lingo). |
| domain | `backup-apply-images.ts` | novo | `applyImages(input)`: grava metadados vencedores com `blobState: 'local'` e o `Blob` em `imageBlobs`; preenche o arquivo de imagens locais `remote` que o zip tem, marcando `uploaded` (`selectBlobFills`). |
| domain | `backup-restore.ts` | novo | `readBackup(file)` → `BackupPreview` (lê, valida, conta, compara `accountId` com `getBoundUserId`; não grava). `restoreBackup(input)` → `RestoreReport` (extrai as imagens necessárias, monta os `Blob`, chama `applyBackup`). |
| domain | `backup-reminder.ts` | novo | `shouldSuggestBackup(input)` (pura, RF69a) e `backupReminderFacts()` (algum cartão vivo e o `createdAt` mais antigo entre eles). |
| domain | `backup-labels.ts` | novo | Textos com plural e formato brasileiro: “Último backup: há 12 dias”, “3 imagens não estavam neste aparelho…”, contagens da prévia e do resumo, avisos de confirmação (port de `restoreConfirm.ts`: `confirmationFor({ plan, accountMismatch })`). |
| state | `backup-store.ts` | novo | `@Service()` root: `lastBackupAt` (signal lido de `localStorage['certamecards.lastBackupAt']`, com try/catch) e `markBackedUp(now)`. Usado por Ajustes e por `/ajustes/backup`. |
| state | `backup-export-session.ts`, `backup-restore-session.ts` | novo | `@Injectable()` com escopo na página: exportação (`exporting`, progresso, `missingImages`, erro) e restauração (`step`: `pick` \| `reading` \| `preview` \| `confirm` \| `restoring` \| `done`, prévia, plano, progresso, relatório, erro). Na Substituição com `hasStudyData()`, gera e entrega o backup automático antes de restaurar (RF67i). Depois de restaurar, com sessão, chama `SyncStore.syncNow('manual')` (RF68b). |
| pages | `backup/` (`/ajustes/backup`) | novo | `backup.ts/.html` (moldura, título, `providers: [BackupSession]`) + `backup-export` (RF66a–g), `backup-pick`, `backup-preview` (contagens, rádio Mesclar/Substituir), `backup-confirm`, `backup-progress` e `backup-summary`. |
| pages | `settings/settings.html/.ts` | mod. | Seção “Backup” com link para `/ajustes/backup` (RF66h) e a linha de aviso (RF69) a partir de `shouldSuggestBackup`. |
| app | `app.routes.ts` | mod. | Rota `ajustes/backup` (`title: 'Backup'`, `requireDeck`, como `ajustes`). |
| test | `src/test/backup-fixtures.ts` | novo | Monta conteúdos (decks, cards vivos e excluídos, revisões, settings, imagens com `Blob` pequeno) e zips de backup em memória com `fflate.zipSync`, inclusive malformados e de versão futura. |

A TechSpec-base previa `ui/restore-preview`. Como só `/ajustes/backup` usa a prévia, ela fica em `pages/backup/backup-preview` (AGENTS: `ui/` é para o que duas páginas usam).

### Relacionamentos e fluxo de dados

```
Ajustes ─ backupReminderFacts() + BackupStore.lastBackupAt ─▶ shouldSuggestBackup ─▶ aviso + link
   └─ “Backup” ─▶ /ajustes/backup  (BackupSession)
Exportar:
   estimateBackupSize() ─▶ “arquivo estimado: 12,4 MB”
   createBackup(onProgress)
      downloadMissingForBackup ─ fetchMissingImages (Storage, só com sessão e rede)
      collectBackupContent ─ Dexie (leitura)
      toManifest (to*Row) ─▶ zipBackup (fflate streaming) ─▶ Blob
   deliverFile(blob, name) ─ share (iPhone instalado) | âncora download ─▶ BackupStore.markBackedUp
Restaurar:
   readBackup(file) ─ unzipManifest ─ parseManifest (parse*Row + backup-validate) ─▶ BackupPreview
   preview: Mesclar (padrão) | Substituir ─ confirmationFor({ plan, accountMismatch })
   [Substituir + hasStudyData] createBackup ─ deliverFile ─ markBackedUp   (falhou → para, RF67i)
   restoreBackup ─ unzipImages ─ Blob[] ─ applyBackup ── uma transação rw ──▶ Dexie (6 tabelas)
   resumo ─▶ [sessão] SyncStore.syncNow ─ pushDirty (decks → cards → logs → settings) + pushImages
DeckStore.deck  (liveQuery) ─ baralho ativo some → primeiro baralho; nenhum → requireDeck → /sem-baralho
```

**Offline e sem conta**: exportar, ler, prévia e restaurar usam só o aparelho e funcionam sem Supabase configurado no build. O único uso de rede é opcional: `downloadMissingForBackup` só baixa quando há sessão e `navigator.onLine`, e qualquer falha vira contagem de `missingImages`, nunca erro. Os chunks JS do `fflate` e da página entram no prefetch de `/*.js` do service worker; nada novo no `ngsw-config.json`. Sem conta, as imagens restauradas ficam `local` como as criadas no aparelho.

**Sync, LWW e CAS**: toda linha gravada pela restauração fica `dirty: 1`. Mesclar mantém o `updatedAt` do arquivo: se o servidor tiver versão mais nova, o push perde no LWW do `sync_push` e o pull seguinte traz a versão do servidor, o que é o comportamento de “mais recente vence”. Substituir carimba `updatedAt = now` em todas as linhas do arquivo e nos tombstones, para vencerem no servidor e nos outros aparelhos (RF67g). Revisões novas entram `dirty: 1` e sobem depois dos cartões (ordem já garantida por `pushDirty`); como o arquivo leva os cartões e baralhos excluídos, toda revisão tem pai. Imagens gravadas com `blobState: 'local'` sobem pela fila de F17; um id que já existe no Storage responde `409`, tratado como sucesso por `isDuplicateUpload`. Uma sincronização disparada durante a restauração espera a transação, porque o IndexedDB serializa escritas nas mesmas tabelas; o CAS de `clearDirty` protege linhas que a restauração alterar depois de lidas pelo push.

## Design de implementação

### Principais interfaces

```ts
// domain/backup-export.ts · backup-estimate.ts · file-delivery.ts
createBackup(onProgress?: (progress: ExportProgress) => void): Promise<ExportResult>   // lança BackupError('nothing-to-save')
backupFileName(now: Date): string
estimateBackupSize(): Promise<number>
chooseDelivery(env: { standalone: boolean; canShareFiles: boolean }): 'share' | 'download'
deliverFile(blob: Blob, fileName: string): Promise<void>                               // lança BackupError('delivery-failed')

// domain/backup-restore.ts
readBackup(file: Blob): Promise<BackupPreview>          // lança 'not-backup' | 'newer-version' | 'empty'; não grava
restoreBackup(input: RestoreInput): Promise<RestoreReport>   // lança 'storage-full'; tudo-ou-nada
hasStudyData(): Promise<boolean>
```

```ts
// domain/backup-manifest-*.ts · backup-zip.ts
toManifest(content: BackupContent, meta: { exportedAt: number; accountId: string | null }): BackupManifest
parseManifest(raw: unknown, availablePaths: ReadonlySet<string>): ParsedBackup   // lança 'not-backup' | 'newer-version'
zipBackup(input: { manifest: BackupManifest; images: ImageFile[]; onProgress?: (done: number, total: number) => void }): Promise<Blob>
unzipManifest(bytes: Uint8Array): { manifest: unknown; imagePaths: Set<string> }   // síncrono; filtro não infla as imagens
unzipImages(bytes: Uint8Array, paths: readonly string[]): Map<string, Uint8Array>

// domain/backup-plan.ts · backup-apply.ts
selectWinners<T extends Versioned>(input: { incoming: T[]; local: (T | undefined)[] }): T[]
selectOrphans(input: { localIds: string[]; incomingIds: string[] }): string[]
applyBackup(input: ApplyInput): Promise<AppliedCounts>

// domain/backup-reminder.ts · backup-labels.ts
shouldSuggestBackup(input: ReminderInput): boolean
confirmationFor(input: { plan: RestorePlan; accountMismatch: boolean }): RestoreConfirmation | null
```

```ts
// state/backup-store.ts (root)
readonly lastBackupAt: Signal<number | null>;  markBackedUp(now: number): void

// state/backup-session.ts (providers de /ajustes/backup)
readonly exporting: Signal<boolean>;  readonly exportProgress: Signal<number | null>;  readonly exportNotice: Signal<string | null>
readonly step: Signal<RestoreStep>;  readonly preview: Signal<BackupPreview | null>;  readonly plan: WritableSignal<RestorePlan>
readonly progress: Signal<RestoreProgress | null>;  readonly report: Signal<RestoreReport | null>;  readonly error: Signal<string | null>
exportNow(): Promise<void>;  pickFile(file: File): Promise<void>;  proceed(): void;  confirm(): Promise<void>;  back(): void
```

Regras dos contratos:

- `collectBackupContent` exporta decks e cards **com** os excluídos (`deletedAt > 0`), todas as revisões, a linha `settings` se existir, e só imagens vivas de cartões vivos com arquivo em `imageBlobs`. Imagens `remote` que continuarem sem arquivo depois de `downloadMissingForBackup` entram em `missingImages` e ficam fora do zip e do manifesto. Tombstones de imagem não entram (não há FK que precise deles).
- `createBackup` lança `nothing-to-save` quando não há nenhum deck nem card vivo. O progresso tem três fases (`images` → `collect` → `zip`); só a última é medida por arquivo, as outras são indeterminadas.
- `deliverFile` usa `share` quando o app está instalado (`display-mode: standalone` ou `navigator.standalone`) **e** `navigator.canShare({ files })` aceita o arquivo; nos demais casos, âncora com `download` e `URL.revokeObjectURL` no próximo tique. `AbortError` do compartilhamento (usuário fechou a folha) também é `delivery-failed`: a data do último backup não é atualizada e, no caso do backup automático, a substituição não acontece.
- `parseManifest`: `format` diferente ou JSON ilegível → `not-backup`; `version > BACKUP_VERSION` → `newer-version`; `version < 1` → `not-backup`. Cada registro é validado pelo `parse*Row` correspondente (`{ ...raw, synced_at: '' }`), o que aplica `normalizeCardMarks` (lacuna só na Frente) e `normalizeTags`. A seguir, `backup-validate.ts` descarta: cartão acima dos limites; cartão cujo `deckId` não está entre os decks do arquivo; revisão cujo `cardId` ou `deckId` não está no arquivo; imagem de cartão ausente ou excluído, fora das regras de F17, além da 6ª do cartão (por `position`) ou sem entrada no zip. `discarded` soma todos. Nada no arquivo além de decks, cards, revisões, settings e imagens é lido.
- `readBackup` lança `empty` quando, depois da validação, não há nenhum deck vivo, card vivo nem revisão. `accountMismatch = bound !== null && manifest.accountId !== null && bound !== manifest.accountId` (RF67j).
- `restoreBackup` extrai só as imagens que vão ser gravadas ou preenchidas (o plano é calculado contra o Dexie antes de abrir a transação e **recalculado dentro dela**; a extração cobre o conjunto do arquivo inteiro para que o recálculo não precise de nada fora do Dexie). Os `Blob` são criados (`new Blob([bytes], { type })`) antes de `applyBackup`.
- `applyBackup` nunca aguarda nada que não seja do Dexie dentro da transação. `onProgress` é síncrono e chamado entre lotes de 500. Substituir: linhas do arquivo com `updatedAt: now`, `dirty: 1`, gravadas sem consultar LWW; órfãos (decks, cards e imagens vivos locais ausentes do arquivo) tombstonados com `deletedAt = updatedAt = now`, `dirty: 1`, e as imagens com `blobState: 'pending-delete'` e arquivo removido. Mesclar: só vencedores de `selectWinners`, com o `updatedAt` do arquivo e `dirty: 1`; nada é tombstonado. Nos dois planos, revisões são `bulkAdd` das ausentes, com `dirty: 1`, e `settings` segue o mesmo tratamento das linhas versionadas.
- `dropUntouchedDefaultDeck` (port do Lingo): se o arquivo tem algum deck vivo e o aparelho só tem baralhos “Meus cartões” sem nenhum cartão (vivo ou excluído) e sem revisão, esses baralhos são tombstonados dentro da transação, nos dois planos. Evita o baralho padrão vazio ao lado do que veio do arquivo no celular novo.
- Campos FSRS vêm do arquivo como estão: a restauração não chama o `scheduler` nem gera revisão.
- `shouldSuggestBackup({ signedIn, hasCards, firstCardAt, lastBackupAt, now })`: `false` com sessão ou sem cartões; senão, `true` quando `now − (lastBackupAt ?? firstCardAt) > 30 dias` (RF69a). `lastBackupAt` é do aparelho e não sincroniza.

### Modelos de dados

Sem mudança de schema no Dexie (`version(2)`) nem no Postgres. Os contratos abaixo são o formato do arquivo e tipos internos do domínio.

#### `BackupManifest` — `backup.json` dentro do zip

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `format` | `'certamecards-backup'` | sim | Identifica o arquivo; outro valor → `not-backup`. |
| `version` | `number` | sim | `1` nesta entrega; maior que a do app → `newer-version`. |
| `exportedAt` | `number` | sim | Epoch ms da geração; data da prévia. |
| `accountId` | `string \| null` | sim | `getBoundUserId()` na geração; `null` sem conta. |
| `decks` | `DeckRow[]` | sim | `toDeckRow` de todos os decks, vivos e excluídos. |
| `cards` | `CardRow[]` | sim | `toCardRow` de todos os cards, vivos e excluídos. |
| `reviewLogs` | `LogRow[]` | sim | `toLogRow` de todas as revisões. |
| `settings` | `SettingsRow \| null` | sim | `toSettingsRow` da linha `me`, ou `null` se nunca foi salva. |
| `images` | `ImageEntry[]` | sim | `toCardImageRow` + `path` das imagens incluídas. |

```text
{
  "format": "certamecards-backup",
  "version": 1,
  "exportedAt": 1790971200000,
  "accountId": null,
  "decks": [{ "id": "4b1e…", "name": "Constitucional", "new_cards_per_day": 20, "young_limit": 50,
              "request_retention": 0.9, "created_at": 1788000000000, "updated_at": 1790000000000, "deleted_at": 0 }],
  "cards": [{ "id": "9f2c…", "deck_id": "4b1e…", "front": "O mandato é de quatro anos", "back": "Art. 82, CF",
              "notes": "", "marks": { "front": { "cloze": [{ "start": 15, "end": 21 }], "emphasis": [] },
              "back": { "cloze": [], "emphasis": [] }, "notes": { "cloze": [], "emphasis": [] } },
              "tags": ["CESPE"], "due": 1791057600000, "stability": 12.4, "difficulty": 5.1, "elapsed_days": 9,
              "scheduled_days": 12, "learning_steps": 0, "reps": 5, "lapses": 1, "state": 2,
              "last_review": 1790020000000, "created_at": 1788100000000, "updated_at": 1790020000000, "deleted_at": 0 }],
  "reviewLogs": [{ "id": "c71d…", "card_id": "9f2c…", "deck_id": "4b1e…", "rating": "good",
                   "reviewed_at": 1790020000000, "state_before": 2, "scheduled_days": 12, "duration_ms": 5400 }],
  "settings": { "daily_goal": 40, "reminder_enabled": false, "reminder_minute": 1200,
                "time_zone": "America/Sao_Paulo", "updated_at": 1789000000000 },
  "images": [{ "id": "a03e…", "card_id": "9f2c…", "position": 0, "caption": "Esquema do art. 82",
               "mime_type": "image/webp", "width": 1600, "height": 1200, "byte_size": 248311,
               "created_at": 1788100000000, "updated_at": 1788100000000, "deleted_at": 0,
               "path": "images/a03e….webp" }]
}
```

Os campos de cada linha são exatamente os de `src/app/domain/sync-rows-*.ts`; o exemplo abrevia ids. O zip contém `backup.json` (deflate) e `images/<id>.webp|jpg` (armazenado, sem compressão).

> **Imagens que não estavam no aparelho:** ficam fora de `images` e do zip. A exportação devolve `missingImages` > 0 e a tela mostra o aviso de RF66e; o manifesto não registra a ausência (para quem restaura, a imagem simplesmente não existe no arquivo).

#### `BackupPreview` — resultado de `readBackup` (RF67d)

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `exportedAt` | `number` | sim | Data e hora do backup. |
| `counts` | `{ decks; cards; reviewLogs; images }` | sim | Só decks e cards **vivos**; todas as revisões; imagens válidas. |
| `imageBytes` | `number` | sim | Soma de `byte_size` das imagens válidas. |
| `accountMismatch` | `boolean` | sim | RF67j. |
| `discarded` | `number` | sim | Registros descartados na validação (RF67c). |
| `source` | `{ parsed: ParsedBackup; bytes: Uint8Array }` | sim | Mantido em memória até a restauração, para ler as imagens. |

```text
{ "exportedAt": 1790971200000, "counts": { "decks": 2, "cards": 50, "reviewLogs": 300, "images": 4 },
  "imageBytes": 993244, "accountMismatch": false, "discarded": 0, "source": "…" }
```

#### `RestoreInput`, `RestoreProgress` e `RestoreReport` — restauração (RF67k, RF67m)

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `RestoreInput.preview` | `BackupPreview` | sim | O que foi lido. |
| `RestoreInput.plan` | `'merge' \| 'replace'` | sim | Mesclar (padrão) ou Substituir. |
| `RestoreInput.onProgress` | `(p: RestoreProgress) => void` | não | Chamado entre lotes. |
| `RestoreProgress` | `{ done: number; total: number }` | — | `total` = decks + cards + settings + imagens + revisões do arquivo. |
| `RestoreReport.applied` | `{ decks; cards; reviewLogs; images }` | sim | Linhas gravadas (vivas, para decks e cards). |
| `RestoreReport.keptLocal` | `number` | sim | Mesclar: linhas do arquivo que perderam para a versão local mais nova. |
| `RestoreReport.removed` | `number` | sim | Substituir: baralhos e cartões locais tombstonados. |
| `RestoreReport.discarded` | `number` | sim | Igual a `preview.discarded`. |

```text
{ "applied": { "decks": 2, "cards": 48, "reviewLogs": 120, "images": 4 },
  "keptLocal": 2, "removed": 0, "discarded": 0 }
```

#### `ExportResult` — resultado de `createBackup` (RF66e, RF66f)

```text
{ "blob": "Blob(12.4 MB)", "fileName": "certamecards-backup-2026-10-02.zip", "missingImages": 3 }
```

#### `BackupError` — erros esperados

| Código | HTTP | Significado |
| --- | --- | --- |
| `not-backup` | — | “Este arquivo não é um backup do CertameCards.” |
| `newer-version` | — | “Este backup foi feito por uma versão mais nova do app. Atualize o app e tente de novo.” |
| `empty` | — | “O arquivo não contém dados para restaurar.” |
| `storage-full` | — | “Não há espaço suficiente no aparelho para restaurar este backup. Nada foi alterado.” |
| `delivery-failed` | — | “Não foi possível salvar o arquivo de backup.” (na Substituição: “…, então nada foi substituído.”) |
| `nothing-to-save` | — | “Não há nada para salvar ainda.” |

```text
{ "name": "BackupError", "code": "newer-version", "message": "Este backup foi feito por uma versão mais nova do app. Atualize o app e tente de novo." }
```

Erros inesperados (ex.: falha do IndexedDB que não seja cota) chegam à tela como “Não foi possível restaurar o backup. Nada foi alterado.” e são registrados com `console.warn` sem conteúdo do usuário.

#### Parâmetros fixos

| Parâmetro | Valor |
| --- | --- |
| Lote de gravação na transação | 500 linhas |
| Compressão | `backup.json` com `ZipDeflate` nível 6; imagens com `ZipPassThrough` (WebP/JPEG já comprimidos) |
| Prazo do aviso (RF69) | 30 dias (`BACKUP_REMINDER_DAYS`), contados de `lastBackupAt` ou, sem ele, do `createdAt` mais antigo entre os cartões vivos |
| Chave do aparelho | `localStorage['certamecards.lastBackupAt']` (epoch ms), já prevista na TechSpec-base |
| Marcos do `aria-live` | 25%, 50%, 75%, 100% |

### Endpoints da API

Não aplicável: nenhum endpoint novo. A única chamada de rede é o download de imagens do Storage já existente (`fetchMissingImages`), opcional e só com sessão.

## Pontos de integração

- **Supabase Storage (existente)**: `downloadMissingForBackup` reusa `fetchMissingImages`, que já exige sessão do usuário vinculado e `navigator.onLine`, baixa com concorrência 2 e registra falhas com `warnImage`. Falhas viram `missingImages`, nunca erro da exportação.
- **Sincronização (existente)**: nenhum contrato muda. A restauração só deixa linhas `dirty` e imagens `local`; `pushDirty` e `pushImages` fazem o resto.
- **Web Share API**: `navigator.canShare({ files: [file] })` + `navigator.share({ files, title })` só no app instalado. Sem suporte, âncora `download`. Testado com stubs em `navigator`.
- **File API**: `file.arrayBuffer()` lê o backup uma vez; não há envio do arquivo a lugar nenhum.

## Abordagem de testes

Vitest com `fake-indexeddb` (Dexie real em memória), `src/test/db-helpers.ts` e `src/test/fake-supabase.ts`; zips montados em memória por `src/test/backup-fixtures.ts` com `fflate.zipSync`. Nada de rede, disco ou banco remoto. `URL.createObjectURL`, `navigator.share`/`canShare` e `matchMedia` são stubs. Piso de 80% em `src/app/domain/**`.

### Testes de unidade

| ID | Nome do caso de teste | Critérios de aceitação | Resultado esperado |
|----|-----------------------|------------------------|--------------------|
| TU-29 | Validação do manifesto de backup (formato, versão, contagens) | CA-36, CA-B4 | `format` alheio → `not-backup`; `version: 2` → `newer-version`; envelope válido → contagens corretas. |
| TU-B1 | `parseManifest` descarta registros soltos inválidos e segue | CA-B5 | Cartão com Frente de 6.000 caracteres descartado; `discarded = 1`; os outros 99 mantidos. |
| TU-B2 | `parseManifest` remove lacuna fora da Frente | CA-B5 | Cartão com `back.cloze` chega com `back.cloze = []` e o resto intacto. |
| TU-B3 | `backup-validate` descarta órfãos de referência | CA-36 | Revisão sem cartão, cartão sem baralho e imagem de cartão excluído descartados e contados. |
| TU-B4 | `backup-validate` aplica as regras de imagem de F17 | CA-B5 | MIME fora da lista, > 1,5 MB, legenda > 200, 7ª imagem e entrada ausente no zip descartadas. |
| TU-B5 | `toManifest` → `parseManifest` é ida e volta exata | CA-36, CA-B2 | Decks, cards (FSRS, marcas, etiquetas), revisões, settings e imagens iguais aos de entrada, com `dirty: 0`. |
| TU-B6 | `selectWinners` aplica LWW com desempate por id | CA-37, CA-B6 | Mais novo vence; empate de `updatedAt` decidido por id; ausente local sempre vence. |
| TU-B7 | `selectOrphans` lista só os locais ausentes do arquivo | CA-B7 | Ids locais fora do arquivo; arquivo vazio de um tipo → todos os locais. |
| TU-B8 | `selectBlobFills` escolhe imagens locais sem arquivo | CA-36 | Local `remote` sem blob + zip com o arquivo → preencher; local com blob → ignorar. |
| TU-B9 | `confirmationFor` monta os avisos por plano e conta | CA-B7, CA-B9 | Mesclar sem divergência → `null`; Substituir → aviso de exclusão; conta divergente → aviso de outra conta e “Sim, restaurar mesmo assim”. |
| TU-B10 | `shouldSuggestBackup` nos limites | CA-B14 | 31 dias → `true`; 29 → `false`; com sessão → `false`; sem cartões → `false`; sem backup conta do primeiro cartão. |
| TU-B11 | `backupFileName` usa a data local | CA-B1 | `2026-10-02 23:30` local → `certamecards-backup-2026-10-02.zip`. |
| TU-B12 | `chooseDelivery` escolhe compartilhar só no app instalado com suporte | CA-B1 | `standalone && canShareFiles` → `share`; qualquer outro → `download`. |
| TU-B13 | Rótulos de backup em português | CA-B3, CA-B14 | “Último backup: há 12 dias”, “Nenhum backup feito neste aparelho”, “1 imagem não estava neste aparelho e ficou de fora do backup”, “12,4 MB”. |
| TU-B14 | `deliverFile` trata cancelamento do compartilhamento | CA-B8 | `share` rejeita com `AbortError` → `BackupError('delivery-failed')`. |

Os testes de unidade cobrem as funções puras de formato, validação, plano, regras do aviso e rótulos, com as entradas mais arriscadas: limites, empates de LWW, órfãos e versões de formato.

### Testes de integração

| ID | Nome do caso de teste | Critérios de aceitação | Resultado esperado |
|----|-----------------------|------------------------|--------------------|
| TI-13 | Backup → restaurar “Substituir” em banco vazio | CA-36, CA-B2 | Baralhos, cartões (com excluídos), etiquetas, revisões, settings e imagens (bytes, ordem, legenda) idênticos aos de origem, exceto `updatedAt`/`dirty`. |
| TI-14 | Restaurar “Mesclar” com edição mais nova local | CA-37 | Versão local mais nova mantida; `keptLocal = 1`. |
| TI-B1 | `createBackup` lê do Dexie e gera zip legível | CA-B1 | `readBackup` do blob gerado mostra 2 decks, 50 cards, 300 revisões e 4 imagens. |
| TI-B2 | Exportação com imagem só na nuvem | CA-B3 | Sem rede: `missingImages = 1` e imagem fora do zip. Com sessão e fake Storage respondendo: imagem baixada e incluída. |
| TI-B3 | Mesclar depois de estudar | CA-B6 | 20 revisões novas mantidas sem duplicar; 3 cartões novos mantidos; cartão excluído continua excluído; agenda de hoje preservada. |
| TI-B4 | Substituir exclui órfãos e preserva histórico | CA-B7 | Baralho “Penal” e seus cartões e imagens tombstonados com `dirty: 1`; revisões de “Penal” continuam em `reviewLogs`. |
| TI-B5 | Substituir carimba `updatedAt` e marca `dirty` | CA-B13 | Todas as linhas do arquivo com `updatedAt = now` e `dirty: 1`; imagens `blobState: 'local'`. |
| TI-B6 | Falha no meio não deixa nada | CA-B10 | Erro forçado no 3º lote (stub de `bulkPut`) → Dexie igual ao estado anterior; nova restauração conclui. |
| TI-B7 | Falta de espaço vira `storage-full` | CA-B10 | `QuotaExceededError` simulado → `BackupError('storage-full')` e nenhum dado alterado. |
| TI-B8 | Baralho padrão intocado some na restauração | CA-B11 | Aparelho com “Meus cartões” vazio + arquivo com 2 baralhos → só os 2 baralhos vivos (Mesclar). |
| TI-B9 | Restauração com conta e push | CA-B13 | Com fake Supabase, depois de Substituir e `syncNow`, o fake recebe decks, cards (com tombstones) e logs nessa ordem, e as imagens no Storage; reenvio de imagem existente (409) termina `uploaded`. |
| TI-B10 | Preenchimento de arquivo de imagem `remote` | CA-36 | Local vence o LWW mas não tem blob; zip tem → blob gravado e `blobState: 'uploaded'`, sem `dirty` novo. |
| TI-B11 | `readBackup` não grava nada | CA-B4, CA-B9 | Antes e depois de `readBackup` (válido, inválido e de outra conta) o Dexie é igual; `accountMismatch` correto. |

### Testes E2E

Roteiros executados à mão no `/executar-qa` com a skill `agent-browser`, contra `npm start` (fluxos sem conta) e contra o Supabase local (conta), com capturas em `tasks/prd-backup/evidences/`. O caso offline do service worker usa `npm run build` servido localmente.

| ID | Nome do caso de teste | Critérios de aceitação | Resultado esperado |
|----|-----------------------|------------------------|--------------------|
| E2E-16 | Exportar backup, restaurar em outro perfil (Substituir e Mesclar) | CA-36, CA-37 | Dados idênticos / edição recente mantida. |
| E2E-B1 | Exportar com dados variados | CA-B1 | Ajustes → Backup mostra o estimado; “Baixar backup” baixa `certamecards-backup-AAAA-MM-DD.zip`; “Último backup: hoje”. |
| E2E-B2 | Trocar de “celular” | CA-B2, CA-B11 | Perfil novo do navegador, com tema claro escolhido → restaurar com Substituir → cartão que vencia amanhã continua com a mesma data e reps, meta igual, tema continua claro, baralho ativo é o primeiro do arquivo, sem “Meus cartões” vazio. |
| E2E-B3 | Arquivos errados | CA-B4 | `.zip` qualquer, zip com `backup.json` de `version: 2` → mensagens do PRD e volta à escolha de arquivo. |
| E2E-B4 | Mesclar depois de estudar | CA-B6 | Backup → revisar 3 cartões, criar 1, excluir 1 → Mesclar → Progresso e lista conferem. |
| E2E-B5 | Substituir com backup automático | CA-B7, CA-B8 | Criar “Penal” → Substituir → confirmação com o texto do PRD → download do backup automático → “Penal” some; revisões continuam no Progresso. Com o download bloqueado (stub), nada é substituído. |
| E2E-B6 | Backup de outra conta | CA-B9 | Conta A no Supabase local, arquivo gerado na conta B → aviso de outra conta antes de restaurar. |
| E2E-B7 | Recarregar no meio | CA-B10 | Backup com 5.000 cartões; recarregar durante “Restaurando…” → lista e contagens iguais às de antes. |
| E2E-B8 | Offline e sem conta | CA-B12 | Build de produção, rede desligada no DevTools → exportar, Mesclar e Substituir sem erro. |
| E2E-B9 | Dois aparelhos | CA-B13 | Dois perfis na mesma conta (Supabase local) → Substituir no A, sincronizar A e B → B mostra os cartões, imagens e exclusões; Progresso sem revisões duplicadas. |
| E2E-B10 | Aviso de 30 dias | CA-B14 | Sem conta, `certamecards.lastBackupAt` = agora − 31 dias → aviso em Ajustes; baixar backup → some; − 29 dias → não aparece; com conta → não aparece. |
| E2E-B11 | Desempenho | CA-B15 | Celular intermediário emulado (DevTools, CPU 4×) com 5.000 cartões e 20.000 revisões sem imagens: exportar < 10 s, restaurar < 15 s, medidos do toque ao “Backup baixado”/resumo. |
| E2E-B12 | Legibilidade e acessibilidade | CA-B16 | 360 px sem rolagem horizontal em todos os passos; `npm run check:type-scale` verde; rádios, barra de progresso e anúncios `aria-live` presentes; foco visível em todo o fluxo por teclado. |

## Sequenciamento do desenvolvimento

### Ordem de construção

1. **Formato e validação** (`backup-format`, `backup-errors`, `backup-manifest-write/read`, `backup-validate`, `backup-zip`, fixtures): é o contrato de tudo e o maior risco de integridade (TU-29, TU-B1–B5).
2. **Exportação** (`backup-records`, `backup-images`, `backup-export`, `backup-estimate`, `file-delivery`, `backup-labels`): depende do formato; já permite gerar arquivos reais para os passos seguintes (TI-B1, TI-B2).
3. **Plano e aplicação** (`backup-plan`, `backup-apply`, `backup-apply-rows`, `backup-apply-images`, `backup-restore`): a transação única, Mesclar, Substituir, órfãos, baralho padrão (TI-13, TI-14, TI-B3–B11).
4. **Estado e tela** (`backup-store`, `backup-session`, `pages/backup/*`, rota): exportação, passos da restauração, backup automático da Substituição, sync depois de restaurar.
5. **Ajustes e aviso** (`backup-reminder`, seção “Backup” em `settings`): RF66h e RF69.
6. **Validação**: `lint`, `check:type-scale`, `test:coverage`, `build` e roteiros E2E no `/executar-qa`.

### Dependências técnicas

- Nenhuma dependência nova: `fflate` e `zod` já estão no `package.json`.
- [prd-imagens-notas](../prd-imagens-notas/prd.md) concluída: `cardImages`, `imageBlobs`, `fetchMissingImages`, `tombstoneImages` e a fila de upload.
- Supabase local (`npx supabase start`) só para os roteiros E2E-B6 e E2E-B9; os testes automatizados usam o fake.
- Sem migration, sem RPC, sem Edge Function, sem variável de ambiente.

## Monitoramento e observabilidade

App sem servidor próprio e sem telemetria: a observabilidade é local.

- `console.warn('[backup]', { phase, code })` em falhas de exportação, leitura, entrega e restauração, **sem** conteúdo do usuário, nomes de baralho ou ids de conta (só o código do erro e a fase).
- Falhas de download de imagem continuam registradas por `warnImage` (fase `download`).
- A data do último backup em Ajustes é o indicador da métrica de produto do PRD.

## Considerações técnicas

### Principais decisões

- **Formato de linha da sincronização como formato do arquivo.** Reusa `to*Row`/`parse*Row`, que já normalizam marcas e etiquetas e já acompanham toda coluna nova (a regra do AGENTS de atualizar `sync-rows.ts` passa a cobrir o backup de graça). Alternativa descartada: schemas Zod próprios, como no Lingo (`backupSchema.ts`), que duplicariam os campos e divergiriam na primeira coluna nova.
- **Levar baralhos e cartões excluídos** (decisão do Rafael). Mantém o histórico íntegro e a FK de `review_logs` válida numa conta nova, e faz o Mesclar respeitar uma exclusão mais nova que a edição local. Custo: arquivo um pouco maior e texto de cartões excluídos dentro dele. O RF66c do PRD ganha nota sobre isso.
- **Uma transação para dados e imagens.** O PRD exige tudo-ou-nada (RF67l). O Lingo aplicava a mídia fora da transação para a falta de espaço não impedir a recuperação dos dados; aqui a falta de espaço aborta tudo com `storage-full` e mensagem clara, e o usuário pode liberar espaço e repetir. Restauração parcial sem imagens ficou fora do escopo do PRD.
- **Substituir carimba `updatedAt = now`** (port do Lingo). Sem isso, um registro do arquivo mais antigo que o do servidor perderia no push e o pull desfaria a substituição. Mesclar mantém o `updatedAt` do arquivo, para “mais recente vence” valer também contra o servidor.
- **Backup automático antes de Substituir** só quando há cartão vivo ou revisão (`hasStudyData`): no celular novo, só com o baralho padrão, ele seria um arquivo inútil.
- **Leitura do arquivo inteiro em memória** (`file.arrayBuffer()`), com `fflate.unzip` filtrado. As imagens são armazenadas sem compressão, então extrair é copiar bytes. Alternativa descartada: ler o diretório central com `File.slice` para extrair imagem a imagem — menos memória, mas um leitor de zip próprio para um risco que só aparece com centenas de MB.
- **Streaming do `fflate` na exportação** (`Zip` + `ZipPassThrough`): progresso real por arquivo e sem deflate inútil nas imagens. O `zipSync` travaria a thread principal no JSON grande.
- **Entrega por compartilhamento só no app instalado**: no iPhone em modo standalone, a âncora `download` não salva; no navegador comum, ela funciona em todas as plataformas e não abre a folha do sistema.
- **Página própria `/ajustes/backup`**, como a TechSpec-base previa, em vez de uma seção dentro de Ajustes: a restauração tem passos e estado próprio, e `settings.ts/.html` já está perto do limite de linhas.

### Riscos conhecidos

- **Memória no celular com backups grandes** (6 imagens × 1,5 MB × centenas de cartões): o arquivo, os bytes extraídos e os `Blob` coexistem na restauração. Mitigação: extrair só as imagens que serão gravadas, liberar `source.bytes` assim que a restauração termina, e E2E-B11 medir; se aparecer problema real, passar à leitura por `File.slice`.
- **Callback da transação Dexie**: tem de ser `async () => applyAll(...)`; passar `() => applyAll(...)` (que devolve a promessa nativa direto) causou `PrematureCommitError` nos testes com dados locais. Chamadas Dexie com lista vazia (`bulkPut([])`, `anyOf([])`) também são puladas por guarda. Os testes TI-B6/B7 pegam qualquer escrita fora da transação.
- **Transação longa**: com milhares de imagens, a transação pode durar segundos e segurar a sincronização. Aceitável (a sincronização espera); a barra de progresso evita a impressão de travamento.
- **`navigator.share` com arquivos grandes no iOS** pode falhar acima de limites não documentados. Mitigação: `delivery-failed` com mensagem clara; a validação manual no iPhone entra no QA.
- **Data do último backup “otimista”**: a âncora `download` não informa se o navegador salvou o arquivo. Aceito: é o mesmo comportamento do Lingo, e o aviso é só um lembrete.
- **Coluna nova futura** em `cards`/`decks`/`user_settings`/`card_images`: entra no backup automaticamente pelo `to*Row`; um backup antigo sem a coluna precisa que o `parse*Row` aceite o campo ausente (já é a convenção com `nullish`). Mudança incompatível exige `BACKUP_VERSION = 2` e leitura da versão 1.

### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e todas as rules em `.agents/rules/` (`code-standards.md`, `javascript-typescript.md`, `tests.md`).

- `domain/backup-*.ts` e `file-delivery.ts` são TS puro, sem `@angular/*` nem `rxjs`; usam APIs do navegador (`Blob`, `navigator`, `URL`), como `image-download.ts` e `anki-html.ts` já fazem.
- `pages/backup/` e `settings` não abrem o Dexie nem o Supabase: chamam `domain/` e leem por `liveQuerySignal`. Estado compartilhado entre páginas (`lastBackupAt`) fica em `state/backup-store.ts`; o estado da tela, em `state/backup-session.ts` com escopo da página.
- Arquivos ≤ 100 linhas (por isso manifesto, aplicação e imagens estão separados), funções ≤ 30 linhas, ≤ 3 parâmetros (objetos de entrada nomeados), constantes nomeadas, sem comentários, sem `any` (manifesto lido como `unknown` + Zod), `import type`, exports nomeados, código em inglês e textos em português.
- Regras de domínio: lacuna só na Frente garantida por `normalizeCardMarks` via `parseCardRow`; limites de `card-limits.ts`; campos FSRS não reescritos pelo backup; revisões imutáveis e unidas por id.
- Sem mudança de schema; nenhuma coluna nova, logo nada a reemitir em `sync_push`.
- Textos de tela com `text-label`/`text-meta`/`text-body`, cores por token, `text-on-signal` sobre `bg-signal`, confirmação destrutiva em `miss` com texto.
- Todo código entra com teste; o piso de 80% em `domain/` é coberto pelos TU/TI acima; a UI é validada pelos roteiros E2E com `agent-browser`.

### Conformidade com skills

- `angular-developer`: componentes standalone, `OnPush`, `input()`/`output()`, signals, `inject()`, `@if`/`@for`, serviço com escopo da página por `providers`, rota com `loadComponent`.
- `agent-browser`: roteiros E2E-16 e E2E-B1–B12 no QA.
- `supabase`: consultada só para confirmar que a FK de `review_logs` exige o cartão e o baralho pais (origem da decisão de levar as exclusões) e que nada muda no banco. Nenhum desvio.

### Arquivos relevantes e dependentes

- Novos em `src/app/domain/`: `backup-format.ts`, `backup-errors.ts`, `backup-records.ts`, `backup-images.ts`, `backup-manifest-write.ts`, `backup-manifest-read.ts`, `backup-validate.ts`, `backup-zip.ts`, `backup-export.ts`, `backup-estimate.ts`, `file-delivery.ts`, `backup-plan.ts`, `backup-apply.ts`, `backup-apply-rows.ts`, `backup-apply-images.ts`, `backup-restore.ts`, `backup-reminder.ts`, `backup-labels.ts` e os `*.test.ts` correspondentes.
- Novos em `src/app/state/`: `backup-store.ts`, `backup-session.ts`.
- Novos em `src/app/pages/backup/`: `backup`, `backup-export`, `backup-pick`, `backup-preview`, `backup-confirm`, `backup-progress`, `backup-summary` (`.ts` + `.html`).
- Novo em `src/test/`: `backup-fixtures.ts`.
- Modificados: `src/app/app.routes.ts`, `src/app/pages/settings/settings.html`, `src/app/pages/settings/settings.ts`, `tasks/prd-backup/prd.md` (nota em RF66c).
- Reusados sem alteração: `domain/sync-rows*.ts`, `domain/lww.ts`, `domain/image-download.ts`, `domain/card-images.ts`, `domain/auth.ts` (`getBoundUserId`), `domain/decks.ts` (`DEFAULT_DECK_NAME`), `domain/card-limits.ts`, `domain/text-marks-normalize.ts`, `domain/tags.ts`, `state/sync-store.ts`, `state/deck-store.ts`, `state/live-query.ts`.
- Referência no Lingo: `src/services/backupFormat.ts`, `backupManifest.ts`, `backupPlan.ts`, `backupApply.ts`, `backupRecords.ts`, `backupExport.ts`, `backupRestore.ts`, `src/components/restoreConfirm.ts`, `RestorePlanChoice.tsx`, `BackupSection.tsx`, `src/screens/Restore.tsx`.
