# Tarefa 1.0: domain — base local e compressão

## Visão geral

Prepara o armazenamento local das imagens e a redução no aparelho. As interfaces das entidades saem de `db.ts` para `db-types.ts`, que `db.ts` reexporta: `db.ts` já tem 95 linhas e ganha as tabelas novas. O Dexie sobe para `version(2)`, com `cardImages` (metadados, `trackDirty`) e `imageBlobs` (arquivo). Os limites das imagens entram em `card-limits.ts`, espelhando os `check` de `card_images` e do bucket. Os testes passam a usar o `Blob`/`File` de `node:buffer`, padrão do Lingo, para o `fake-indexeddb` guardar blobs de verdade. A compressão fica em quatro módulos: os erros esperados (`ImageError`), o cálculo puro de dimensões e qualidades, o adaptador do navegador (única peça que toca canvas) e a orquestração WebP → JPEG → `too-large`. Nada disso tem tela ainda.

<skills>
### Conformidade com skills

Nenhuma skill específica: é TS puro de `domain/` e configuração de teste.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e as rules em `.agents/rules/`. Pontos relevantes:
- `domain/` sem `@angular/*` nem `rxjs`. `createImageBitmap`, `OffscreenCanvas` e `<canvas>` são APIs do navegador, isoladas em `image-codec.ts`.
- Limites de imagem em `card-limits.ts`, como manda o AGENTS (“limites vêm de `domain/card-limits.ts`”).
- `db.ts` ≤ 100 linhas: extrair `db-types.ts` e reexportar, sem mudar nenhum import existente.
- Constantes nomeadas (`QUALITY_STEPS`, `IMAGE_SIDE_MAX`, `IMAGE_INPUT_BYTES_MAX`…); união de strings para `BlobState` e `ImageErrorCode`; `ImageError` como subclasse de `Error`.
- `encode` recebe objeto `EncodeInput` (≤ 3 parâmetros); `unknown` + narrowing no `catch` do decode.
- Testes AAA, sem canvas real: `ImageCodec` fake para `compressImage` e `vi.stubGlobal` para `image-codec.ts`.
</rules>

<requirements>
- RF74a: aceitar qualquer imagem decodificável; saída WebP, ou JPEG quando o navegador não gera WebP; GIF vira o primeiro quadro; arquivo ilegível → “Não foi possível abrir este arquivo como imagem.”
- RF74b: girar pela orientação da câmera, lado maior ≤ 2.000 px sem ampliar, ≤ 1,5 MB com a maior qualidade que caiba, sem metadados, alfa preservado no WebP e fundo branco no JPEG.
- RF74d (parte): `too-large` quando nem a menor qualidade cabe; `storage-full` definido aqui e usado na tarefa 2.
- Entrada > 50 MB recusada antes de decodificar (“Esta imagem é grande demais para abrir.”).
- Dexie `version(2)` sem perder os dados da `version(1)`.
</requirements>

## Subtarefas

- [x] 1.1 Extrair as interfaces para `db-types.ts` e acrescentar `CardImage`, `ImageBlobRecord` e `BlobState` (`local | uploaded | remote | pending-delete | purged`); `db.ts` reexporta.
- [x] 1.2 `db.ts`: tabelas `cardImages`/`imageBlobs`, `db.version(2)` e `trackDirty(db.cardImages, true)`. Teste em `db.test.ts`: um banco criado em `version(1)` com cartões abre na 2 com os dados intactos e as tabelas novas vazias.
- [x] 1.3 `card-limits.ts`: `IMAGES_PER_CARD_MAX`, `IMAGE_SIDE_MAX`, `IMAGE_BYTES_MAX`, `IMAGE_CAPTION_MAX`, `IMAGE_INPUT_BYTES_MAX` e `IMAGE_MIME_TYPES`, com teste de que batem com os valores da migration.
- [x] 1.4 `src/test/setup.ts` com `Blob`/`File` de `node:buffer`; `resetDb` limpando `cardImages` e `imageBlobs`; `src/test/image-fixtures.ts` (`makeCardImage`, `makeImageBlob`).
- [x] 1.5 `image-errors.ts`: `ImageError` com `code` e as mensagens do PRD.
- [x] 1.6 `image-resize.ts`: `fitWithin` e `QUALITY_STEPS`/`nextQuality`.
- [x] 1.7 `image-codec.ts`: `browserCodec` (decode com `imageOrientation: 'from-image'`, decodificação com redimensionamento quando o lado maior passa de 2× o alvo, `OffscreenCanvas` ou `<canvas>`, `fillRect` branco quando `opaque`, `close()` do bitmap).
- [x] 1.8 `image-compress.ts`: `compressImage(file, codec = browserCodec)` → `CompressedImage`.
- [x] 1.9 Escrever TU-28 e TU-I1–TU-I5.

## Detalhes de implementação

Ver [techspec.md](techspec.md):
- “Visão dos componentes”: linhas `db-types.ts`, `db.ts`, `card-limits.ts`, `image-errors.ts`, `image-resize.ts`, `image-codec.ts`, `image-compress.ts` e `test`.
- “Principais interfaces”: bloco `domain/image-compress.ts + image-codec.ts`.
- “Modelos de dados”: `CardImage`, `ImageBlobRecord` (com o `db.version(2)`), `CompressedImage`, `ImageError`, “Parâmetros fixos” (compressão e entrada).
- “Riscos conhecidos”: memória ao decodificar no iPhone, `Blob` no `fake-indexeddb`, Safari.

Ao terminar, validar num celular real (Android e iPhone), com uma página de teste ou pelo console, que a saída é WebP/JPEG, a orientação está certa e uma foto de 48 MP não derruba a aba (sequenciamento, etapa 2).

## Critérios de aceitação relacionados

- CA-40
- CA-I4
- CA-I5
- CA-I6

## Testes da tarefa

### Testes de unidade

- [x] TU-28 — `fitWithin` (dimensões) e laço de qualidade da compressão
- [x] TU-I1 — Compressão cai para JPEG quando o codec não devolve WebP
- [x] TU-I2 — Compressão recusa entrada > 50 MB sem decodificar
- [x] TU-I3 — Compressão propaga arquivo ilegível
- [x] TU-I4 — Compressão desiste quando nem 0,5 cabe
- [x] TU-I5 — `browserCodec` usa orientação da imagem, fundo branco no opaco e libera o bitmap

## Arquivos relevantes

- `src/app/domain/{db-types,image-errors,image-resize,image-codec,image-compress}.ts` + `.test.ts` (novos)
- `src/app/domain/db.ts`, `db.test.ts`, `card-limits.ts`, `card-limits.test.ts` (modificados)
- `src/test/setup.ts`, `src/test/db-helpers.ts` (modificados); `src/test/image-fixtures.ts` (novo)
- `supabase/migrations/20261101000000_images_reminders.sql` — só leitura (limites)
- Lingo `~/Desktop/lingo/src/test/setup.ts` e `src/services/dbMigrations.test.ts` — referência

> **Ajustes feitos na implementação:**
> - O fundo do JPEG opaco é a cor `white` (palavra-chave CSS), porque o `check:type-scale` barra cor em hex até em `.ts`.
> - `browserCodec.decode` redecodifica já reduzida (`resizeWidth`/`resizeHeight` de 2.000 px) quando o lado maior passa de 4.000 px. Se o navegador recusar o redimensionamento, usa o bitmap original. O ganho de memória precisa ser confirmado no celular real: o pico da primeira decodificação continua existindo.
> - O teste de limites confere os valores literais da migration (6, 2.000 px, 1.572.864 bytes, 200), sem ler o arquivo SQL: testes não tocam o disco.
> - `db.test.ts` ganhou o teste de migração `version(1)` → `version(2)` num banco separado, e a ida e volta de um `Blob` pelo `fake-indexeddb`.
> - Pendente para o Rafael (não é automatizável): validar `browserCodec` num Android e num iPhone (WebP/JPEG, orientação, foto de 48 MP), como pede a etapa 2 da TechSpec.
