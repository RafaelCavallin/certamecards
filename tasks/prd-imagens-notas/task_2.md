# Tarefa 2.0: domain — rascunho, salvar e excluir

## Visão geral

Cria a lógica que o formulário e as telas vão usar, ainda sem tela. `gallery-draft.ts` são as operações puras do rascunho: limite de 6, mover, remover, legendar e o plano de gravação (`adds`, `updates`, `removals`). `card-draft.ts` define o `CardDraft` (texto + galeria), carrega o rascunho de um cartão salvo e compara rascunhos para o aviso de descarte. `card-save.ts` grava cartão, metadados e arquivos numa transação só, sem tocar no agendamento, e converte `QuotaExceededError` em `ImageError('storage-full')`. `card-images.ts` concentra as leituras (galeria, contador, pendentes) e o tombstone das imagens. Por fim, `deleteCards` e `deleteDeck` passam a excluir as imagens na mesma transação. `image-labels.ts` reúne os textos de usuário da galeria e de Ajustes.

<skills>
### Conformidade com skills

Nenhuma skill específica: é TS puro de `domain/`.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e as rules em `.agents/rules/`. Pontos relevantes:
- Campos FSRS só pelo `scheduler`: `saveNewCard` usa `newCardRecord`; `saveCardEdit` reaproveita a normalização de `updateCardContent` e não toca a linha do cartão quando o texto não mudou (RF5, RF76e).
- `normalizeCardMarks` e `normalizeTags` continuam aplicados ao salvar: lacuna só na Frente.
- Operações do rascunho imutáveis (regra 8): devolvem lista nova, nunca mutam.
- ≤ 3 parâmetros: `{ deckId, draft }`, `{ cardId, draft }`, `{ saved, items, now }`.
- `tombstoneImagesOfCards` roda dentro da transação do chamador; `cards.ts` e `decks.ts` incluem `cardImages`/`imageBlobs` no escopo.
- Textos de usuário em PT-BR, números em pt-BR (“12,3 MB”), código em inglês.
</rules>

<requirements>
- RF73d: limite de 6 por cartão; aceitar os primeiros na ordem da escolha e informar quantos ficaram de fora.
- RF74c (suporte): texto “Aguardando N imagens”.
- RF74d: cota estourada não grava nada e mantém o texto no formulário.
- RF76a, RF76b: reordenar, remover e legendar (≤ 200, aparada); posição gravada limitada a 0–5.
- RF76c (suporte): `hasDraftChanges` para o aviso de descarte; mudanças só valem ao salvar.
- RF76d, RF76e, RF76f: criação em série sem imagens; editar imagens não reagenda; imagens com Notas vazias.
- RF78a, RF78b: excluir cartão, lote ou baralho e remover imagem salva tombstonam a imagem e apagam o arquivo local na hora.
- RF74e (suporte): `imageUsage` só com imagens vivas de cartões vivos; `pendingUploadCount` = vivas em `local`.
</requirements>

## Subtarefas

- [x] 2.1 `gallery-draft.ts`: `GalleryItem`, `acceptedCount`, `moveItem`, `removeItem`, `setCaption`, `orderedPositions` e `planGallerySave`.
- [x] 2.2 `card-draft.ts`: `CardDraft`, `emptyDraft`, `loadCardDraft(cardId)` e `hasDraftChanges`.
- [x] 2.3 `card-images.ts`: `liveCardImages`, `galleryImages`, `imageUsage`, `pendingUploadCount` e `tombstoneImagesOfCards` (tombstone, `pending-delete`, blob apagado).
- [x] 2.4 `card-save.ts`: `saveNewCard` e `saveCardEdit` numa transação em `cards`, `cardImages` e `imageBlobs`, mais a conversão de cota.
- [x] 2.5 `cards.ts` (`deleteCards`) e `decks.ts` (`deleteDeck`): incluir as imagens na transação.
- [x] 2.6 `image-labels.ts`: `galleryCountLabel`, `waitingImagesLabel`, `skippedFilesMessage`, `imageAlt`, `imageUsageLabel`, `pendingUploadsLabel` e `formatMegabytes`.
- [x] 2.7 Escrever TU-I6–TU-I9, TU-I12 e TI-I8–TI-I12.

## Detalhes de implementação

Ver [techspec.md](techspec.md):
- “Visão dos componentes”: linhas `gallery-draft.ts`, `card-draft.ts`, `card-save.ts`, `card-images.ts`, `cards.ts`/`decks.ts`, `image-labels.ts`.
- “Principais interfaces”: blocos `domain/card-draft.ts + card-save.ts + gallery-draft.ts` e `domain/card-images.ts`.
- “Modelos de dados”: `GalleryItem`, `GallerySavePlan` (inclusive a nota “Só imagens mudaram”), `GalleryImage`/`ImageUsage`, `ImageError` (`storage-full`).
- “Estados do arquivo (`blobState`)”: linhas “salvar imagem nova” e “remover no formulário, excluir cartão/baralho”.
- “Principais decisões”: rascunho em memória + uma transação; posição limitada a 0–5; tombstone no cliente.

## Critérios de aceitação relacionados

- CA-43
- CA-I1
- CA-I7
- CA-I8
- CA-I9
- CA-I10
- CA-I11
- CA-I19
- CA-I22
- CA-I23

## Testes da tarefa

### Testes de unidade

- [x] TU-I6 — `acceptedCount` respeita o limite de 6
- [x] TU-I7 — `moveItem` e `removeItem` não mutam a lista e respeitam as pontas
- [x] TU-I8 — `planGallerySave` gera adds, updates só do que mudou e removals
- [x] TU-I9 — `hasDraftChanges` detecta texto, etiquetas, ordem, legenda e imagens
- [x] TU-I12 — Textos da galeria e de Ajustes

### Testes de integração

- [x] TI-I8 — `saveNewCard` grava cartão, metadados e blobs numa transação
- [x] TI-I9 — `saveNewCard` com cota estourada não grava nada
- [x] TI-I10 — `saveCardEdit` reordena, legenda, remove e não reagenda
- [x] TI-I11 — Excluir cartões e baralho tombstona as imagens na mesma transação
- [x] TI-I12 — `imageUsage` e `pendingUploadCount`

## Arquivos relevantes

- `src/app/domain/{gallery-draft,card-draft,card-save,card-images,image-labels}.ts` + `.test.ts` (novos)
- `src/app/domain/cards.ts`, `decks.ts` e os testes deles (modificados)
- `src/app/domain/{db,card-limits,image-errors,image-compress}.ts` (tarefa 1)
- `src/app/domain/{text-marks-normalize,tags}.ts` — só leitura
- Lingo `~/Desktop/lingo/src/services/db.ts` (`deleteCard`/`deleteDeck` com `audioBlobs`) — referência

> **Ajustes feitos na implementação:**
> - `planGallerySave` recebe também o `cardId` (`{ cardId, saved, items, now }`), porque as imagens novas precisam do dono e, na criação, o id do cartão só existe depois de `newCardRecord`.
> - Extraído `card-content.ts` (`normalizeCardContent`, `sameCardContent`): `newCardRecord`, `updateCardContent` e `saveCardEdit` compartilham a mesma normalização, e `cards.ts` continua abaixo de 100 linhas.
> - `card-images.ts` também exporta `tombstoneImages(ids, now)`, usada ao remover imagens no formulário; `tombstoneImagesOfCards` cobre cartões e baralhos.
> - Fixtures novas em `src/test/gallery-fixtures.ts` (`newGalleryItem`, `savedGalleryItem`).
> - `saveCardEdit` devolve o cartão sem alterá-lo (nem `updatedAt`) quando só as imagens mudam.
