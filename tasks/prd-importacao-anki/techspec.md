# Especificação técnica — Importação do Anki

> PRD: [prd.md](prd.md). TechSpec-base: [tasks/produto/techspec.md](../produto/techspec.md). O modelo `Card`/`Deck`, o Dexie `version(1)`, a sincronização e as decisões gerais estão lá, e este documento não os repete. Os IDs de teste da base (TI-12, E2E-15) foram mantidos. Os casos próprios usam o sufixo `A` (`TU-A*`, `TI-A*`, `E2E-A*`). A leitura do pacote é portada do Lingo (`src/services/ankiImport.ts`, `screens/Import.tsx`, `components/AnkiNotePicker.tsx`, `db.insertCardsInChunks`). São novos: o formato `anki21b`, o `.colpkg`, o tipo de nota, o HTML com destaque, as lacunas, as etiquetas, a deduplicação e a gravação atômica.

## Resumo

A importação roda inteira no navegador, na thread principal, em quatro camadas puras e uma de escrita. (1) **Pacote**: `fflate` abre o ZIP e infla só a coleção (`collection.anki21b` → `anki21` → `anki2`, nessa prioridade). No formato novo, `fzstd` descompacta o SQLite. (2) **Coleção**: `sql.js` (SQLite em WebAssembly) lê tipos de nota, campos, baralhos e notas nos dois esquemas do Anki: o moderno, com as tabelas `notetypes`/`fields`/`decks` e o tipo de nota num protobuf, e o legado, com JSON em `col.models`/`col.decks`. (3) **Conversão**: um `DOMParser` percorre o HTML de cada campo e produz texto + intervalos de destaque. Lacunas `{{cN::…}}` viram elementos sentinela antes do parse, e assim os offsets saem certos na mesma passada. A expansão gera um rascunho por número. Etiquetas passam por `normalizeTags` e adotam a grafia do catálogo. (4) **Plano**: a contagem de criados, pulados por motivo, duplicados e etiquetas descartadas é calculada antes de importar.

A escrita é **uma única transação Dexie** (`rw` em `decks` e `cards`). Ela cria o baralho novo, se for o caso, relê as chaves de conteúdo do destino para deduplicar e grava em lotes de 500, checando um `AbortSignal` entre os lotes. Falha, cancelamento ou recarregamento abortam a transação, e o IndexedDB desfaz tudo (CA-35, CA-A14). Isso substitui o “grava e apaga se falhar” do Lingo, que deixava cartões quando a aba era fechada no meio. Cartões entram como cartões novos comuns: `createCard` é refatorado para expor um construtor puro (`newCardRecord`), com `createdAt` incrementado por índice para preservar a ordem do arquivo na fila. Não há mudança de schema, migration, RPC nem sync. O `.wasm` do `sql.js` (~650 KB) fica num `assetGroup` lazy do service worker e é baixado só por quem abre a importação. `state/anki-reader-status.ts` faz o RF60p: preparo em segundo plano, “precisa de conexão” e nova tentativa no evento `online`. A tela `/importar` tem cinco passos, como subcomponentes de `pages/import/`, com o estado num serviço de escopo da página.

## Arquitetura do sistema

### Visão dos componentes

| Camada | Módulo | Novo/mod. | Papel |
| --- | --- | --- | --- |
| domain | `anki-errors.ts` | novo | `AnkiImportError` (`code`: `not-anki`, `no-notes`, `reader-unavailable`, `cancelled`) e `ankiErrorMessage(code)` em português. |
| domain | `anki-package.ts` | novo | `unpackAnkiPackage(bytes)`: `fflate.unzipSync` com filtro só para `meta` e `collection.*`; escolhe a entrada pela prioridade; `fzstd.decompress` no `anki21b`; erro `not-anki` se nada servir. Sem wasm. |
| domain | `anki-reader.ts` | novo | `prepareAnkiReader(locateWasm?)`: carrega o `sql.js` uma vez (memoizado) e devolve `AnkiReader`. Falha de rede/wasm vira `reader-unavailable`. `readAnkiFile(file, reader)` orquestra pacote → coleção. |
| domain | `anki-schema-modern.ts` | novo | Esquema moderno: `notetypes` + `fields` + `decks` (consultas sem `ORDER BY`/`WHERE` em colunas `COLLATE unicase`, que o `sql.js` não tem). |
| domain | `anki-schema-legacy.ts` | novo | Esquema legado: `col.models` (`type: 1` = lacuna) e `col.decks` em JSON. |
| domain | `anki-collection.ts` | novo | `readCollection(db)`: escolhe o esquema, lê notas (`id, mid, flds, tags`) e o baralho de cada nota (`cards.odid \|\| cards.did`, primeiro cartão), descarta notas sem conteúdo, monta `AnkiCollection`. |
| domain | `anki-notetype-config.ts` | novo | Leitor mínimo de protobuf (varint e length-delimited) para `notetypes.config`: campo 1 = `kind` (1 = lacuna), campo 9 = `originalStockKind` (6 = oclusão de imagem). |
| domain | `anki-html.ts` | novo | `htmlToMarkedText(html)`: `DOMParser` + caminhada na árvore → `{ text, emphasis, clozes }`. Blocos, listas, tabelas, entidades, `[sound:]`, mídia, negrito/sublinhado por tag ou `style` (RF61a–c). |
| domain | `anki-cloze.ts` | novo | `markClozes(html)` troca `{{cN::conteúdo::dica}}` bem formados por `<anki-cloze data-n="N">conteúdo</anki-cloze>` e remove as chaves dos malformados/aninhados. `expandCloze(parsed)` → um `FieldDraft` de Frente e um de Verso por número (RF62a–d). |
| domain | `anki-mapping.ts` | novo | `suggestMapping(notetype)` (nome vence posição, PT/EN) e `classifyNotetype` (`basic` / `cloze` / `unsupported`). |
| domain | `anki-tags.ts` | novo | `importTags(raw, catalog)`: separa por espaço, `_` → espaço, descarta `leech`/`marked`/longas, aplica `normalizeTags` e a grafia do catálogo; devolve `{ tags, dropped }` (RF63a–b). |
| domain | `anki-convert.ts` | novo | `convertNote` (nota → `CardDraft[]` ou motivo de pulo, com limites de `card-limits`) e `convertNotes` (assíncrono, lotes de 500 com `yieldToUi` entre eles, `AbortSignal`, progresso) → `ConversionResult`. |
| domain | `anki-dedupe.ts` | novo | `contentKey(draft \| card)` (Frente, Verso e marcas das duas) e `dropDuplicates(drafts, existingKeys)` → `{ unique, duplicates }`; também elimina repetição dentro da própria importação (RF65d). |
| domain | `anki-import.ts` | novo | Escrita: `existingContentKeys(deckId)` e `importDrafts(input)`: uma transação `rw` (`decks`, `cards`), baralho novo dentro dela, dedupe relido dentro dela, `bulkAdd` em lotes de 500, `signal` checado entre lotes → `ImportOutcome`. |
| domain | `anki-selection.ts` | novo | Contagens do passo de origem e de campos: `summarizeSourceDecks`, `notetypesInSelection`, `countPlannedCards` (lacunas contam um por número) e `suggestDeckName` (RF60e, RF60l). |
| domain | `cards.ts` | mod. | Extrai `newCardRecord(input, now)` (puro, inicialização FSRS + `normalizeCardMarks` + `normalizeTags`), usado por `createCard` e pela importação. Contrato de `createCard` inalterado. |
| state | `anki-reader-status.ts` | novo | `@Injectable()` com escopo na página: `status` (`preparing` \| `ready` \| `needs-network`), `retry()`, escuta `window:online` enquanto `needs-network` (RF60p). |
| state | `anki-import-session.ts` | novo | `@Injectable()` com escopo na página: passo atual, arquivo lido, baralhos marcados, mapeamento por tipo, `ConversionResult`, destino, progresso, `AbortController`, resultado. Chama as funções de `domain/`; guarda o que foi escolhido ao voltar de passo. |
| pages | `import/` (`/importar`) | novo | `import.ts/.html` (moldura, “Passo N de 4”, “Voltar”, erro) + um subcomponente por passo: `import-file`, `import-decks`, `import-fields` (+ `import-notetype` por tipo), `import-preview`, `import-target`, `import-progress`, `import-summary`. |
| pages | `settings/settings.html` | mod. | Seção “Importar do Anki” com link para `/importar` (RF60o). |
| pages | `no-deck/no-deck.html` | mod. | Link “Importar do Anki” para `/importar` (RF60m). |
| app | `app.routes.ts` | mod. | Rota `importar` (`title: 'Importar do Anki'`, sem guarda de baralho: serve aos dois casos). |
| config | `angular.json`, `ngsw-config.json`, `package.json` | mod. | Copia `sql-wasm.wasm` para `/sqljs/`; `assetGroup` `anki-reader` lazy; dependências `fflate`, `fzstd`, `sql.js` e `@types/sql.js` (dev). |
| test | `src/test/anki-builder.ts`, `src/test/anki-fixtures.ts` | novo | Monta coleções `anki2`/`anki21` em memória com `sql.js` + `fflate.zipSync`; fixture `anki21b` (zstd) embutida em base64, gerada uma vez por `scripts/make-anki21b-fixture.mjs`. |

A TechSpec-base previa `ui/anki-field-mapper`. Como só a página de importação usa o mapeador, ele fica em `pages/import/import-notetype` (AGENTS: `ui/` é para o que duas páginas usam).

### Relacionamentos e fluxo de dados

```
/importar ─ AnkiReaderStatus ─ prepareAnkiReader() ─ fetch /sqljs/sql-wasm.wasm (SW lazy)
   │           └─ needs-network ─ window:online ─ retry (RF60p)
   ├─ 1. import-file ─ readAnkiFile(file, reader)
   │        unpackAnkiPackage (fflate, fzstd) → reader.open → readCollection → AnkiCollection
   ├─ 2. import-decks ─ summarizeSourceDecks / countPlannedCards        (pulado com 1 baralho)
   ├─ 3. import-fields ─ classifyNotetype + suggestMapping por tipo ─ import-notetype × N
   │        └─ import-preview ─ convertNote(3 primeiras do tipo) → previewCard → ui/card-face
   ├─ 4. import-target ─ convertNotes(lotes, signal) → ConversionResult
   │        existingContentKeys(deckId) → dropDuplicates → “Importar N cartões em X”
   ├─ importDrafts({ drafts, target, signal, onProgress })  ── uma transação rw ──▶ Dexie
   │        └─ import-progress (barra, Cancelar → AbortController.abort)
   └─ import-summary ─ DeckStore.switchDeck(deckId) ─ “Ir para o início” / “Ver cartões”
listTagCatalog() ─▶ importTags (grafia existente)         normalizeCardMarks/normalizeTags na entrada
```

**Offline e sem conta**: nada desta entrega chama o Supabase. Ler, converter, deduplicar e gravar usam só o aparelho. O único recurso de rede é o `.wasm` do `sql.js`, buscado ao abrir `/importar` e guardado pelo service worker no grupo lazy. Os chunks JS do leitor (`fflate`, `fzstd`, `sql.js`) entram no prefetch atual de `/*.js` (decisão do Rafael: ~40 KB gzip, o peso real é o wasm). Sem rede e sem o wasm em cache, `AnkiReaderStatus` fica em `needs-network`: a escolha de arquivo fica bloqueada, e a página tenta de novo sozinha no `online` ou no “Tentar de novo”. Em `ng serve` (sem service worker), o wasm vem do servidor de desenvolvimento, e o caso offline é validado no build de produção (E2E-A6).

**Sync, LWW e CAS**: os cartões e o baralho novo nascem com `dirty: 1` (hook `trackDirty`) e `updatedAt = createdAt`. O push seguinte os envia como qualquer criação local, cards antes de logs (não há logs), paginado. Como a transação só confirma no fim, o push nunca vê uma importação pela metade. Uma sincronização que dispara durante a importação espera a transação, porque o IndexedDB serializa as escritas nas mesmas tabelas. Não há interação com o CAS: nenhuma linha existente é alterada.

## Design de implementação

### Principais interfaces

```ts
// domain/anki-package.ts · anki-reader.ts
unpackAnkiPackage(bytes: Uint8Array): AnkiPackage                 // lança AnkiImportError('not-anki')
prepareAnkiReader(locateWasm?: (file: string) => string): Promise<AnkiReader>   // memoizado
interface AnkiReader { open(collection: Uint8Array): AnkiCollection }           // lança 'not-anki' | 'no-notes'
readAnkiFile(file: File, reader: AnkiReader): Promise<AnkiCollection>

// domain/anki-notetype-config.ts
readNotetypeConfig(config: Uint8Array): { kind: number; originalStockKind: number }

// domain/anki-html.ts · anki-cloze.ts
htmlToMarkedText(html: string): ParsedField                       // { text, emphasis, clozes }
markClozes(html: string): string
expandCloze(parsed: ParsedField): ClozeSide[]                     // um por número, ordem crescente
```

```ts
// domain/anki-mapping.ts · anki-selection.ts · anki-tags.ts
classifyNotetype(notetype: AnkiNotetype): NotetypeClass          // 'basic' | 'cloze' | 'unsupported'
suggestMapping(notetype: AnkiNotetype): FieldMapping
summarizeSourceDecks(collection: AnkiCollection): SourceDeckSummary[]
countPlannedCards(input: SelectionInput): number
suggestDeckName(input: { fileName: string; decks: readonly string[] }): string
importTags(raw: string, catalog: ReadonlyMap<string, string>): { tags: string[]; dropped: number }

// domain/anki-convert.ts · anki-dedupe.ts
convertNote(note: AnkiNote, context: ConvertContext): CardDraft[] | SkipReason
convertNotes(input: ConvertInput): Promise<ConversionResult>      // lotes + yieldToUi + signal
contentKey(content: Pick<CardDraft, 'front' | 'back' | 'marks'>): string
dropDuplicates(drafts: readonly CardDraft[], existing: ReadonlySet<string>): DedupeResult

// domain/anki-import.ts · cards.ts
existingContentKeys(deckId: string): Promise<Set<string>>
importDrafts(input: ImportInput): Promise<ImportOutcome>          // lança AnkiImportError('cancelled')
newCardRecord(input: NewCardInput, now: number): Card
```

```ts
// state/anki-reader-status.ts (providers de /importar)
readonly status: Signal<'preparing' | 'ready' | 'needs-network'>;  readonly reader: Signal<AnkiReader | null>
retry(): void

// state/anki-import-session.ts (providers de /importar)
readonly step: Signal<ImportStep>;  readonly error: Signal<string | null>
readFile(file: File): Promise<void>;  toggleDeck(name: string): void;  setAll(checked: boolean): void
setMapping(notetypeId: string, mapping: FieldMapping): void;  goToTarget(): Promise<void>
chooseTarget(target: ImportTarget): Promise<void>;  run(): Promise<void>;  cancel(): void;  back(): void
```

Regras dos contratos:

- `unpackAnkiPackage` lê `meta` quando existe (protobuf, campo 1: 1 = legado `anki2`, 2 = `anki21`, 3 = `anki21b`), mas decide pela entrada presente, na prioridade `anki21b` → `anki21` → `anki2`. Num pacote versão 3, o `collection.anki2` é um banco-isca com uma nota “atualize o Anki”, e o Lingo, que lia `anki21` → `anki2` → `anki21b`, importaria essa nota. ZIP inválido, nenhuma entrada de coleção ou zstd inválido → `not-anki`.
- `AnkiReader.open` fecha o banco do `sql.js` em `finally`. Um banco sem as tabelas `notes`/`col` dá `not-anki`. Zero notas com algum campo não vazio dá `no-notes`.
- Nenhuma consulta usa `ORDER BY`, `GROUP BY`, `WHERE` ou `JOIN` em colunas `COLLATE unicase` (`notetypes.name`, `fields.name`, `decks.name`), porque o `sql.js` não registra essa collation e a consulta falharia (“no such collation sequence: unicase”). A ordenação dos campos usa `fields.ord`, e a dos baralhos é feita em TS com `localeCompare('pt-BR')`.
- `htmlToMarkedText` nunca lança erro: HTML malformado é tolerado pelo `DOMParser`. Os intervalos são offsets no `text` final (depois de aparar e de colapsar espaços) e saem ordenados, sem sobreposição, aparados nos espaços (RF8) e com encostados fundidos.
- `expandCloze` aplica a regra de RF62c: na Frente, a lacuna do número N prevalece, e destaques que a cruzam são recortados para fora dela. No Verso, a resposta de N é unida aos destaques existentes. As lacunas de outros números ficam como texto, com os destaques que tiverem.
- `convertNote` devolve um `SkipReason` (não lança) para `empty-side`, `too-long`, `no-cloze` e `unsupported-type`. Os limites vêm de `FRONT_MAX`, `BACK_MAX` e `NOTES_MAX`, medidos sobre o texto já aparado, como `validateCardContent`.
- `convertNotes` só cede a vez (`yieldToUi`, `setTimeout(0)`) **fora** de transação. `importDrafts` nunca espera nada que não seja do Dexie dentro da transação, senão ela confirmaria sozinha.
- `importDrafts` relê `existingContentKeys` dentro da transação e reaplica `dropDuplicates`. A contagem mostrada no botão é uma prévia, e a garantia é a releitura. `createdAt = now + índice` e `updatedAt = createdAt`. Com `signal.aborted` entre lotes, lança `AnkiImportError('cancelled')`, e o Dexie aborta a transação.
- Com destino `{ kind: 'new' }`, o `Deck` é criado dentro da mesma transação por `newDeckRecord` (extraído de `decks.ts` como `newCardRecord`). `DeckStore.switchDeck` só é chamado depois do commit.
- Todo `CardDraft` passa por `newCardRecord`, que aplica `normalizeCardMarks` (lacuna só na Frente) e `normalizeTags` de novo: a regra de domínio vale mesmo que a conversão erre.

### Modelos de dados

Sem mudança de schema no Dexie (`version(1)`) nem no Postgres. Os tipos abaixo são contratos internos do domínio, em memória.

#### `AnkiCollection` — o arquivo lido

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `fileName` | `string` | sim | Nome do arquivo escolhido, para sugerir o nome do baralho. |
| `notetypes` | `AnkiNotetype[]` | sim | Só os tipos que têm nota no arquivo. |
| `notes` | `AnkiNote[]` | sim | Na ordem de `notes.id` (ordem de criação no Anki), sem as que têm todos os campos vazios. |
| `AnkiNotetype.id` | `string` | sim | Id do tipo no Anki (ms desde 1970), como texto, para servir de chave de mapa e de `FieldMapping`. |
| `AnkiNotetype.name` | `string` | sim | “Básico”, “Omissão de Palavras”. |
| `AnkiNotetype.fields` | `string[]` | sim | Nomes por `ord`. |
| `AnkiNotetype.kind` | `'normal' \| 'cloze' \| 'image-occlusion'` | sim | Moderno: `config` campo 1 e 9. Legado: `type === 1` → `cloze`. |
| `AnkiNote.notetypeId` | `string` | sim | Tipo da nota. |
| `AnkiNote.fields` | `string[]` | sim | HTML cru de cada campo (separados por `\u001f` no Anki). |
| `AnkiNote.tags` | `string` | sim | Texto cru do Anki (`" cespe Direito_Constitucional leech "`). |
| `AnkiNote.deck` | `string` | sim | Nome completo do baralho de origem com `::`; `''` sem informação. |

```text
{
  "fileName": "Pacote Regular Flashcards - TI.colpkg",
  "notetypes": [
    { "id": "1738205931998", "name": "Básico", "fields": ["Frente", "Verso"], "kind": "normal" },
    { "id": "1738205932002", "name": "Omissão de Palavras", "fields": ["Texto", "Verso Extra"], "kind": "cloze" }
  ],
  "notes": [
    { "notetypeId": "1738205931998", "fields": ["O que é <b>DevOps</b>?", "Cultura que une<div>desenvolvimento e operação</div>"], "tags": " cespe ", "deck": "DevOps" }
  ]
}
```

> **Degradação — esquema legado sem `col.decks` legível:** `deck` vem `''` em todas as notas, `summarizeSourceDecks` devolve uma única entrada sem nome e o passo de origem é pulado, como com um só baralho.

#### `FieldMapping` e `NotetypeClass` — passo de campos (RF60f–j)

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `include` | `boolean` | sim | “Não importar este tipo” = `false`. Sempre `false` e travado em `unsupported`. |
| `front` | `number` | sim | Índice do campo; em `cloze`, o campo com as lacunas (o 1º). |
| `back` | `number \| null` | sim | Índice; `null` só em `cloze` (o Verso vem do texto revelado). |
| `notes` | `number \| null` | sim | Índice ou “Nenhum”; em `cloze`, o “Extra” se houver. |

Sugestão (`suggestMapping`), comparando sem acento e sem maiúsculas:

| Destino | Nomes reconhecidos (contém) | Sem nome reconhecido |
| --- | --- | --- |
| Frente | `frente`, `front`, `pergunta`, `question`, `enunciado`, `texto`, `text` | 1º campo |
| Verso | `verso`, `back`, `resposta`, `answer`, `gabarito` | 2º campo |
| Notas | `extra`, `nota`, `notes`, `comentario`, `comment`, `explicacao` | 3º campo, se houver; senão `null` |

Um nome já usado por um destino anterior não é reaproveitado pela sugestão: “Verso Extra” vai para Notas, não para o Verso, porque `extra` é testado antes nos tipos `cloze` e o Verso não existe neles. `classifyNotetype` devolve `unsupported` para `kind: 'image-occlusion'`, com o motivo “Oclusão de imagem não é suportada”.

```text
{ "1738205931998": { "include": true, "front": 0, "back": 1, "notes": null },
  "1738205932002": { "include": true, "front": 0, "back": null, "notes": 1 } }
```

#### `ParsedField` — HTML convertido (RF61)

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `text` | `string` | sim | Texto puro com `\n`, aparado. |
| `emphasis` | `Range[]` | sim | Destaques (offsets em `text`). |
| `clozes` | `{ n: number; range: Range }[]` | sim | Lacunas bem formadas; vazio fora de nota de lacuna. |

Regras de conversão:

| HTML | Texto |
| --- | --- |
| `<br>` | `\n` |
| fim de `<div>`, `<p>`, `<h1>`–`<h6>`, `<tr>` | `\n` (blocos vazios seguidos: no máximo uma linha em branco) |
| `<li>` | `\n• ` antes do conteúdo |
| `<td>`/`<th>` depois do primeiro da linha | ` \| ` antes do conteúdo |
| `<b>`, `<strong>`, `<u>`, `style` com `font-weight: bold\|bolder\|600–900` ou `text-decoration(-line): underline` | destaque |
| `<img>`, `<audio>`, `<video>`, `<script>`, `<style>`, `[sound:…]` | removidos |
| `&nbsp;` e demais entidades | caractere (o `DOMParser` decodifica; ` ` vira espaço) |
| espaços repetidos na linha | um espaço; cada linha aparada |

```text
html: "<b>salvo</b> disposição<div>em <u>contrário</u></div>"
{ "text": "salvo disposição\nem contrário", "emphasis": [{ "start": 0, "end": 5 }, { "start": 20, "end": 28 }], "clozes": [] }
```

#### `CardDraft` — cartão pronto para gravar

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `front`, `back`, `notes` | `string` | sim | Texto convertido; `notes` pode ser `''`. |
| `marks` | `CardMarks` | sim | Lacuna só na Frente. |
| `tags` | `string[]` | sim | Já normalizadas e com a grafia do catálogo. |
| `notetypeId` | `string` | sim | Para a prévia por tipo. |

```text
{
  "front": "A União legisla privativamente",
  "back": "A União legisla privativamente",
  "notes": "Art. 22, CF",
  "marks": { "front": { "cloze": [{ "start": 2, "end": 7 }], "emphasis": [] },
             "back": { "cloze": [], "emphasis": [{ "start": 2, "end": 7 }] },
             "notes": { "cloze": [], "emphasis": [] } },
  "tags": ["CESPE", "constitucional"],
  "notetypeId": "1738205932002"
}
```

#### `ConversionResult` e `SkipReason` — plano antes de importar (RF65c)

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `drafts` | `CardDraft[]` | sim | Na ordem do arquivo; lacunas de uma nota em ordem de número. |
| `skipped` | `Record<SkipReason, number>` | sim | Notas puladas por motivo. |
| `droppedTags` | `number` | sim | Etiquetas descartadas (internas, longas, além de 20). |

| `SkipReason` | Texto na tela |
| --- | --- |
| `empty-side` | “Frente ou Verso vazio” |
| `too-long` | “Texto acima do limite” |
| `no-cloze` | “Lacuna sem lacuna válida” |
| `unsupported-type` | “Tipo não suportado” |

Notas de tipos desmarcados pelo usuário (`include: false`) não contam como puladas: o usuário escolheu deixá-las de fora. As de tipo `unsupported` contam (CA-A6).

```text
{ "drafts": ["…1.262 rascunhos…"], "skipped": { "empty-side": 3, "too-long": 1, "no-cloze": 0, "unsupported-type": 10 }, "droppedTags": 4 }
```

#### `ImportInput`, `ImportTarget` e `ImportOutcome` — escrita

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `drafts` | `readonly CardDraft[]` | sim | Saída de `convertNotes`. |
| `target` | `{ kind: 'existing'; deckId: string } \| { kind: 'new'; name: string }` | sim | Destino (RF60l). |
| `signal` | `AbortSignal` | sim | “Cancelar”. |
| `onProgress` | `(done: number, total: number) => void` | sim | Chamado depois de cada lote. |
| `ImportOutcome.deckId`, `deckName` | `string` | sim | Baralho que recebeu os cartões. |
| `ImportOutcome.created` | `number` | sim | Cartões gravados. |
| `ImportOutcome.duplicates` | `number` | sim | Pulados por já existirem (RF65d). |

```text
{ "deckId": "d-4c1", "deckName": "Constitucional", "created": 1230, "duplicates": 32 }
```

> **Degradação — tudo duplicado:** `unique` vazio. A UI desabilita o botão (“Importar 0 cartões”, CA-A12) e `importDrafts` nem é chamado. Se for chamado assim mesmo (duplicatas criadas entre a prévia e o clique), a transação confirma sem gravar nada e devolve `created: 0`. Com destino `new`, o baralho não é criado.

#### `AnkiImportError` — erros esperados

| Código | Quando | Mensagem |
| --- | --- | --- |
| `not-anki` | ZIP inválido, sem coleção, zstd ou SQLite ilegível | “Este arquivo não parece ser um baralho do Anki.” |
| `no-notes` | Coleção sem nenhuma nota com conteúdo | “Nenhuma nota encontrada no arquivo.” |
| `reader-unavailable` | O `.wasm` não pôde ser baixado/compilado | “Para importar pela primeira vez, conecte-se à internet. Depois disso, a importação funciona sem rede.” |
| `cancelled` | `signal` abortado | Sem mensagem: volta ao passo do destino. |

Qualquer outro erro na gravação (cota do IndexedDB, por exemplo) é mostrado como “Não foi possível importar os cartões. Nada foi gravado.” e registrado no `console.error`.

#### Parâmetros fixos

| Constante | Valor | Onde |
| --- | --- | --- |
| `COLLECTION_ENTRIES` | `['collection.anki21b', 'collection.anki21', 'collection.anki2']` | `anki-package.ts` |
| `SQL_WASM_URL` | `'/sqljs/sql-wasm-browser.wasm'` (build de navegador do `sql.js`) | `anki-reader.ts` |
| `FIELD_SEPARATOR` | `'\u001f'` | `anki-collection.ts` |
| `CLOZE_KIND`, `IMAGE_OCCLUSION_STOCK_KIND` | `1`, `6` | `anki-notetype-config.ts` |
| `ANKI_INTERNAL_TAGS` | `['leech', 'marked']` | `anki-tags.ts` |
| `CONVERT_CHUNK_SIZE`, `INSERT_CHUNK_SIZE` | `500`, `500` | `anki-convert.ts`, `anki-import.ts` |
| `PREVIEW_SIZE` | `3` | `anki-convert.ts` |
| `LARGE_FILE_BYTES` | `300 * 1024 * 1024` | `pages/import/import-file.ts` (aviso, não bloqueia) |

#### Build e service worker

| Arquivo | Mudança |
| --- | --- |
| `angular.json` → `assets` | `{ "glob": "sql-wasm-browser.wasm", "input": "node_modules/sql.js/dist", "output": "sqljs" }`; `allowedCommonJsDependencies: ["sql.js"]` |
| `ngsw-config.json` → `assetGroups` | `{ "name": "anki-reader", "installMode": "lazy", "updateMode": "lazy", "resources": { "files": ["/sqljs/*.wasm"] } }` |
| `package.json` | `fflate`, `fzstd`, `sql.js`; dev: `@types/sql.js`. Importados só por `import()` dinâmico a partir de `anki-reader.ts`, e assim ficam fora do bundle inicial. |

O `budget` `initial` do `angular.json` não muda. Se mudar, é sinal de que algum import estático puxou o leitor para o bundle inicial, e o build acusa.

### Endpoints da API

Não se aplica. Nenhum endpoint novo nem alterado, e nenhuma chamada ao Supabase.

## Pontos de integração

- **Formato do Anki** (externo, sem rede): pacotes `.apkg`/`.colpkg` nas versões 1 (`anki2`), 2 (`anki21`) e 3 (`anki21b`, zstd + esquema 18). O contrato depende do esquema do Anki, que pode mudar. Erros de leitura viram `not-anki`, e o resto do app não é afetado.
- **Rede, só para o `.wasm`**: buscado do próprio domínio do app (`/sqljs/sql-wasm.wasm`), sem terceiros. Modos de falha: offline sem cache, conexão que cai no meio do download e resposta corrompida. Os três viram `reader-unavailable` (RF60p, CA-A17). Não há timeout próprio: vale o do navegador. A nova tentativa é idempotente, porque `prepareAnkiReader` só memoiza a promessa quando ela dá certo.
- **Supabase**: não participa. Os cartões sobem pelo push existente.

## Abordagem de testes

Vitest com `fake-indexeddb`, `src/test/db-helpers.ts` (`resetDb` no `afterEach`) e `src/test/card-fixtures.ts`. O `sql.js` roda de verdade nos testes, com `locateWasm` apontando para `node_modules/sql.js/dist/` (carregar a biblioteca não é I/O de teste). Os pacotes do Anki são montados em memória por `src/test/anki-builder.ts` (`sql.js` + `fflate.zipSync`). O caso `anki21b`, que exige zstd e o `fzstd` só descompacta, usa uma fixture pequena embutida em base64 em `src/test/anki-fixtures.ts`, gerada uma vez pelo `scripts/make-anki21b-fixture.mjs` (CLI `zstd`). Nenhum arquivo é lido do disco nos testes. Relógio fixado com `vi.setSystemTime`; `crypto.randomUUID` determinístico onde a asserção depende do id. Piso de 80% em `src/app/domain/**`. Todo módulo novo de `domain/` entra com teste no mesmo commit.

Prioridade (regra 3 de `tests.md`): primeiro a atomicidade e a ausência de duplicação (TI-12, TI-A1–TI-A3), porque mexem em dados. Depois a fidelidade da conversão (HTML, lacunas, etiquetas), porque um erro ali se multiplica por milhares de cartões. Por último, a sugestão de mapeamento e as contagens.

### Testes de unidade

| ID | Nome do caso de teste | Critérios de aceitação | Resultado esperado |
|----|-----------------------|------------------------|--------------------|
| TU-A1 | `unpackAnkiPackage` escolhe a coleção certa | CA-A1, CA-A2 | `anki21b` + `anki2`-isca → devolve o `anki21b` descompactado (fixture base64); `anki21` + `anki2` → `anki21`; só `anki2` → `anki2`; ZIP sem coleção, bytes aleatórios e zstd truncado → `AnkiImportError('not-anki')`. |
| TU-A2 | `readNotetypeConfig` | CA-A6 | `08 01 …` → `kind: 1`; config dos tipos “Básico” reais (sem campo 1) → `kind: 0`; `… 48 06` → `originalStockKind: 6`; campos length-delimited longos (CSS) são pulados sem desalinhar. |
| TU-A3 | `htmlToMarkedText`: quebras, parágrafos, listas e tabelas | CA-33, CA-A8 | Dois `<div>` → duas linhas; `<div></div><div></div>` seguidos → no máximo uma linha em branco; `<ul><li>Legalidade</li><li>Impessoalidade</li></ul>` → `• Legalidade\n• Impessoalidade`; tabela 2×2 → `a \| b\nc \| d`; `A&nbsp;&amp;&nbsp;B` → `A & B`. |
| TU-A4 | `htmlToMarkedText`: destaques | CA-33, RF61b | `<b>vedado</b>`, `<strong>`, `<u>`, `style="font-weight:700"` e `text-decoration: underline` viram destaque com offsets exatos; `<b> salvo </b>` é aparado; `<b>a</b><u>b</u>` vira um destaque só; `<i>`, `<font color>` viram texto normal. |
| TU-A5 | `htmlToMarkedText`: mídia e som removidos | CA-A10 | `texto [sound:aula.mp3]<img src="x.png">` → `texto`, sem destaque nem espaço sobrando; campo só com `<img>` → `''`. |
| TU-A6 | `markClozes` + `expandCloze`: um cartão por número | CA-34, CA-A5 | `A {{c1::União}} legisla {{c2::privativamente}}` → 2 lados; c1: Frente com lacuna em “União”, Verso inteiro com “União” destacado; c2 análogo; `{{c1::a}} e {{c1::b}}` → 1 cartão com 2 lacunas; a dica `::dica` some do texto. |
| TU-A7 | Lacuna e destaque juntos | CA-A9 | `<b>salvo</b> {{c1::<b>disposição</b> em contrário}}` → Frente: destaque em “salvo”, lacuna em “disposição em contrário” e nenhum destaque dentro dela; Verso: “salvo” e “disposição em contrário” destacados, sem sobreposição. |
| TU-A8 | Lacunas malformadas e aninhadas | RF62d | `{{c1::sem fim`, `{{c::x}}` e `{{c1::a {{c2::b}}}}` → texto sem chaves e sem lacuna; nota sem nenhuma válida → `no-cloze`. |
| TU-A9 | `importTags` | CA-34, CA-A11 | `" cespe constitucional "` → `["cespe","constitucional"]`; com o catálogo `cespe → CESPE`, `"cespe Direito_Constitucional leech"` → `["CESPE","Direito Constitucional"]`, `dropped: 1`; `Concurso::CESPE` literal; etiqueta de 41 caracteres descartada; 22 etiquetas → 20, `dropped: 2`; `cespe Cespe` → uma. |
| TU-A10 | `classifyNotetype` e `suggestMapping` | CA-A4 | Tipo `Básico (Frente, Verso)` → `0/1/null`; `Questão (Enunciado, Gabarito, Comentário)` → `0/1/2`; `(Back, Front)` → Frente = 1, Verso = 0; `(A, B, C)` → posição; lacuna `(Texto, Verso Extra)` → `front 0, back null, notes 1`; oclusão → `unsupported`, `include: false`. |
| TU-A11 | `convertNote`: limites e motivos de pulo | CA-A10, CA-A13 | Frente de 6.000 caracteres → `too-long`; Verso só com `<img>` → `empty-side`; tipo `unsupported` → `unsupported-type`; nota básica válida → 1 rascunho com as Notas do campo mapeado; Notas “Nenhum” → `''`. |
| TU-A12 | `contentKey` e `dropDuplicates` | CA-A12 | Mesmo texto e marcas → mesma chave; mesma Frente com destaque diferente → chaves diferentes; Notas e etiquetas não entram na chave; duplicata dentro da própria lista e contra `existing` contadas em `duplicates`; a ordem dos únicos é preservada. |
| TU-A13 | `summarizeSourceDecks`, `countPlannedCards` e `suggestDeckName` | CA-A3, RF60e, RF60l | Contagem por baralho com hierarquia `Direito::Constitucional`; desmarcar “Administrativo” → 300 notas; nota de lacuna com c1–c3 conta 3; tipo desmarcado conta 0; nome: um baralho `Direito::Constitucional` → `Constitucional`; vários → nome do arquivo sem extensão, cortado em `DECK_NAME_MAX`. |
| TU-A14 | `newCardRecord` | CA-A15, RF64a | Cartão novo do FSRS (`state` 0, `reps` 0, `due` = `now`), `createdAt = updatedAt = now`, `deletedAt: 0`, marcas de Verso/Notas sem lacuna mesmo com lacuna na entrada; `createCard` continua igual (testes de `cards.test.ts` verdes). |

### Testes de integração

| ID | Nome do caso de teste | Critérios de aceitação | Resultado esperado |
|----|-----------------------|------------------------|--------------------|
| TI-12 | Importação que falha no meio não deixa nada | CA-35 | `importDrafts` com 11 rascunhos em lotes de 5 (`chunkSize`) para um baralho novo, com a gravação do 2º lote falhando, rejeita; depois, `db.cards.count()` e `db.decks.count()` são os de antes. |
| TI-A1 | Cancelar entre lotes desfaz tudo | CA-A14 | `onProgress` aborta o `AbortController` depois do 1º lote (11 rascunhos em lotes de 5): rejeita com `cancelled`; nenhum cartão nem o baralho novo existem; uma nova chamada com outro `signal` grava tudo sem duplicar. |
| TI-A2 | Reimportar no mesmo baralho cria zero | CA-A12 | Importa um pacote montado em memória; a segunda importação no mesmo baralho devolve `created: 0` e `duplicates` = total; num baralho diferente, cria todos; um cartão excluído (`deletedAt ≠ 0`) não conta como existente. |
| TI-A3 | Ordem e ritmo dos novos | CA-A15 | 520 cartões importados (mais de um lote) num baralho com “novos por dia” = 20: `createdAt` estritamente crescente na ordem do arquivo; `buildQueue` devolve os 20 primeiros do arquivo, na ordem. |
| TI-A4 | Pacote real ponta a ponta no esquema legado | CA-33, CA-34, CA-A4 | `anki-builder` monta um `anki21` com tipos Básico, Questão e Lacuna, etiquetas e baralhos: `readAnkiFile` → `convertNotes` → `importDrafts` grava os cartões esperados (texto, marcas, etiquetas, Notas) no Dexie. |
| TI-A5 | Pacote no formato novo (`anki21b`) | CA-A1, CA-A6 | A fixture base64 (esquema 18, collation `unicase`, tipos Básico, Omissão de Palavras e Oclusão de Imagem, 2 baralhos) abre sem erro de collation, classifica a oclusão como `unsupported` e importa o resto. |
| TI-A6 | Grafia do catálogo vem do Dexie | CA-A11 | Com um cartão local etiquetado “CESPE”, `listTagCatalog` + `convertNotes` gravam “CESPE” para a etiqueta `cespe` do Anki. |
| TI-A7 | Cartões importados sobem no push | CA-A18 | Com `fake-supabase`, depois de importar 210 cartões (acima do lote de 200 do push; os 1.000 do CA-A18 ficam no E2E-A5), `pushDirty` envia o baralho e os 210 cartões em lotes, com etiquetas e marcas, e limpa `dirty`; um segundo `syncNow` não reenvia nada. |
| TI-A8 | `prepareAnkiReader` indisponível e nova tentativa | CA-A17 | `locateWasm` apontando para um caminho inexistente → `reader-unavailable`; a chamada seguinte com o caminho certo resolve (a falha não foi memoizada). |

### Testes E2E

Roteiros executados à mão com a skill `agent-browser` contra `npm start -- --port <porta livre>` (E2E-A6 contra o build de produção servido localmente, para haver service worker; E2E-A5 com `npx supabase start`), com capturas em `tasks/prd-importacao-anki/evidences/`. Sem Playwright nem pasta `e2e/`. Arquivos usados: os dois pacotes reais do autor na Área de Trabalho (“Inglês (Curso).apkg”, “Pacote Regular Flashcards - TI.colpkg”, que não são versionados) e pacotes sintéticos gerados com o `anki-builder` por um script de apoio no scratchpad do agente (lacunas, negrito, listas, etiquetas, 10.000 notas). O `upload` do `agent-browser` alimenta o `<input type="file">`.

| ID | Nome do caso de teste | Critérios de aceitação | Resultado esperado |
|----|-----------------------|------------------------|--------------------|
| E2E-15 | Importar `.apkg` com lacunas, negrito e etiquetas | CA-33, CA-34, CA-35 | Os cartões aparecem na lista e na revisão conforme o PRD: “vedado” destacado, Verso em dois parágrafos, dois cartões da lacuna c1/c2 com as duas etiquetas. Um arquivo corrompido mostra o erro e não cria nada. |
| E2E-A1 | Pacotes reais do autor | CA-A1 | O `.colpkg` de TI mostra 1.404 notas e 13 baralhos; o `.apkg` de Inglês mostra 1.952 notas sem resto de `[sound:]`; os dois importam sem reexportar. |
| E2E-A2 | Passos de origem, campos e prévia | CA-A3, CA-A4, CA-A6, CA-A7 | Desmarcar um baralho atualiza as contagens; dois tipos com mapeamentos independentes; o tipo de oclusão aparece desmarcado com o motivo e o aviso de notas puladas; trocar o campo do Verso muda a prévia na hora; “Voltar” preserva as escolhas. |
| E2E-A3 | Destino, duplicatas, cancelamento e resumo | CA-A12, CA-A14, CA-A15 | Botão “Importar N cartões em X”; reimportar no mesmo baralho dá “Importar 0 cartões”, desabilitado; “Cancelar” no meio e, em outra tentativa, recarregar no meio não deixam baralho nem cartões (conferido na lista e pelo `eval` do IndexedDB); o resumo mostra criados, pulados por motivo e etiquetas descartadas; o baralho de destino fica ativo; a Home mostra no máximo “novos por dia”. |
| E2E-A4 | Começar pelo Anki, sem baralho | CA-A16 | Depois de excluir o último baralho, “Crie seu primeiro baralho” oferece “Importar do Anki”; o destino só oferece “Novo baralho”; ao fim, a Home do baralho novo. Em Ajustes, a entrada “Importar do Anki” abre a mesma tela. |
| E2E-A5 | Sincronização dos importados (Supabase local) | CA-A18 | Importa 1.000 cartões no perfil A, “Sincronizar agora”; no perfil B, depois da sincronização, os 1.000 cartões com etiquetas e marcas, sem duplicar. |
| E2E-A6 | Offline e preparo do leitor (build de produção) | CA-A17, RF60p | Num perfil novo, com o DevTools offline antes de abrir `/importar`: mensagem de conexão, escolha de arquivo bloqueada, resto do app normal; religar a rede libera a escolha sem toque; depois de uma importação, offline + recarregar → importa sem erro (o `.wasm` veio do cache do SW). Rede “Slow 3G” cortada no meio do download → a mesma mensagem, nunca erro genérico. |
| E2E-A7 | Volume e legibilidade | CA-A19, CA-A20 | 10.000 notas básicas no desktop e 5.000 com o celular emulado (CPU 4× lenta) da confirmação ao resumo < 30 s, com barra e “Cancelar” respondendo; 360 px sem rolagem horizontal em todos os passos; `npm run check:type-scale` verde. |

## Sequenciamento do desenvolvimento

### Ordem de construção

1. **Leitura do pacote** — dependências (`fflate`, `fzstd`, `sql.js`, `@types/sql.js`), `anki-errors.ts`, `anki-package.ts`, `anki-notetype-config.ts`, `anki-schema-*.ts`, `anki-collection.ts`, `anki-reader.ts`, `src/test/anki-builder.ts`, `anki-fixtures.ts` + o script da fixture → TU-A1, TU-A2, TI-A5, TI-A8. Vem primeiro porque é o maior risco técnico (formato novo, collation, wasm no Vitest), e nada depois funciona sem ele.
2. **Conversão** — `anki-html.ts`, `anki-cloze.ts`, `anki-tags.ts`, `anki-mapping.ts`, `anki-selection.ts`, `anki-convert.ts` → TU-A3–TU-A11, TU-A13, TI-A6. Puro, sem tela.
3. **Gravação atômica** — `newCardRecord`/`newDeckRecord` extraídos, `anki-dedupe.ts`, `anki-import.ts` → TU-A12, TU-A14, TI-12, TI-A1–TI-A4, TI-A7. A garantia de tudo-ou-nada é provada antes de existir botão.
4. **Infra de build** — `angular.json` (asset do wasm), `ngsw-config.json` (grupo lazy), rota `importar`, `state/anki-reader-status.ts`. Conferir no `npm run build` que o bundle inicial não cresceu.
5. **Tela** — `state/anki-import-session.ts` e `pages/import/` (moldura + 7 subcomponentes), entradas em Ajustes e em “Sem baralho” → E2E-15, E2E-A1–E2E-A4.
6. **Validação** — `npm run lint`, `npm run check:type-scale`, `npm run test:coverage`, `npm run build`; E2E-A5 (Supabase local), E2E-A6 (build de produção) e E2E-A7.

### Dependências técnicas

- Fase 1 e [prd-etiquetas](../prd-etiquetas/techspec.md) concluídas: `normalizeTags`, `tagKey`, `listTagCatalog`, `ui/tag-chips`, `ui/card-face`.
- Dependências npm novas: `fflate` (~8 KB gzip), `fzstd` (~8 KB gzip), `sql.js` (~20 KB gzip de JS + ~650 KB de wasm), `@types/sql.js` (dev). Todas sem dependências transitivas.
- CLI `zstd` só na máquina de quem gera a fixture `anki21b` (uma vez). O CI não precisa dela.
- Supabase local (Docker) só para o E2E-A5.
- Deploy: sem migration nem variável de ambiente. A entrega vai para produção só com a promoção da `des` para a `prod`, a pedido do Rafael. Conferir no preview da `des` que `/sqljs/sql-wasm.wasm` é servido como `application/wasm`, e não reescrito para `index.html` pelo `rewrites` do `vercel.json` (arquivos estáticos existentes têm precedência na Vercel).

## Monitoramento e observabilidade

Sem backend novo, nada a expor.

- Erros esperados (`AnkiImportError`) aparecem na tela e não vão para o console.
- Erros inesperados na leitura ou na gravação vão para `console.error` com o erro original e o passo, **sem** conteúdo de notas nem nomes de baralho (PRD: privacidade).
- O tempo da importação é medido à mão no E2E-A7 (painel Performance). Não há telemetria.

## Considerações técnicas

### Principais decisões

- **Uma transação Dexie para a importação inteira**, em vez do `insertCardsInChunks` do Lingo (grava em lotes e apaga se falhar). Só a transação cobre o recarregamento ou o fechamento da aba no meio (CA-A14). Ela também emite uma única notificação de `liveQuery` no commit, em vez de 20 recálculos de Home e contador. Custo: as leituras das mesmas tabelas em outras telas esperam o commit (alguns segundos numa importação grande). Aceito: durante a importação o usuário está na tela de progresso.
- **`fflate` em vez de `JSZip`** (decisão do Rafael). É menor e mais rápido, e o filtro do `unzipSync` infla só a coleção, sem descompactar a mídia de pacotes grandes. A lógica de escolha da entrada é a do Lingo, com a ordem corrigida.
- **Leitura na thread principal** (decisão do Rafael), como no Lingo. A abertura do SQLite pode congelar a tela de 1 a 3 s num arquivo grande, com o indicador indeterminado. A conversão cede a vez entre lotes, e a gravação usa requisições assíncronas do IndexedDB, então a barra e o “Cancelar” respondem nas etapas longas (PRD). Descartado: Web Worker, que acrescentaria um build e um protocolo de mensagens e continuaria precisando do `DOMParser` na thread principal.
- **Só o `.wasm` fora do precache** (decisão do Rafael). O `ngsw-config.json` faz prefetch de todo `/*.js`, e tirar os chunks do leitor exigiria nomes de chunk previsíveis. O peso real é o wasm, que vai num grupo lazy. É um desvio pequeno da restrição do PRD (“fora do precache obrigatório”), registrado aqui.
- **`DOMParser` com lacunas como elementos sentinela.** Trocar `{{cN::…}}` por `<anki-cloze>` antes do parse faz lacuna, destaque e quebra de linha saírem da mesma caminhada, com offsets consistentes no texto final. Descartado: tratar as lacunas depois de converter o HTML, porque as chaves podem cruzar tags (`{{c1::<b>x</b>}}`) e os offsets teriam de ser remapeados.
- **Tipo de nota pelo protobuf de `notetypes.config`**, lendo só os campos 1 e 9, com um leitor de varint de ~30 linhas. Descartado: uma biblioteca de protobuf (peso e esquema do Anki para manter) e a heurística “tem `{{c` no texto”, que confundiria um tipo básico que cita a sintaxe.
- **Deduplicação por conteúdo** (decisão do PRD): Frente, Verso e as marcas das duas. Notas e etiquetas ficam de fora da chave, para que um comentário corrigido no pacote não gere outra cópia do mesmo cartão. Sem guardar o `guid` do Anki, não há coluna nova nem reemissão de `sync_push`.
- **`createdAt = now + índice`**: a fila ordena os novos por `createdAt` (`queue.ts`), e todos os cartões nasceriam no mesmo milissegundo. O deslocamento de até alguns segundos no futuro não afeta nada visível. `due` continua `now`.
- **`newCardRecord`/`newDeckRecord` extraídos**: a importação reaproveita exatamente a inicialização do FSRS e a normalização do cadastro manual, sem uma segunda fonte de verdade para “cartão novo”.
- **Rota `/importar` sem guarda de baralho**, como `/conta`: a mesma tela atende a quem tem baralho e a quem não tem (RF60m). Sem baralho, a página oferece só “Novo baralho”, lendo `DeckStore.decks()`.
- **Estado em serviço de escopo da página** (`providers` de `/importar`), como o `ReinforceSession`: os 7 subcomponentes compartilham arquivo, mapeamento e plano sem store global, e sair da tela descarta tudo.

### Riscos conhecidos

- **Memória com pacotes grandes no celular**: o `File` inteiro vai para um `ArrayBuffer`, e o `sql.js` carrega o banco inteiro. O filtro do `fflate` evita inflar a mídia, mas o ZIP compactado continua em memória. Mitigação: aviso acima de 300 MB (PRD) e teste com o maior pacote real disponível no E2E-A7. Se estourar, ler só o diretório central e a entrada da coleção com `File.slice`.
- **Mudanças no formato do Anki**: o esquema 18 e o protobuf de `config` não são API pública. Mitigação: o leitor tolera campos desconhecidos, a fixture `anki21b` vem de um pacote real, e um erro de leitura vira `not-anki` sem efeito no resto do app.
- **Collation `unicase`**: qualquer consulta futura que ordene ou filtre por nome falha no `sql.js`. Mitigação: regra no contrato, e o TI-A5 usa um banco real do esquema 18.
- **`DOMParser` em 30.000 campos**: estimado em 1 a 3 s no desktop e o dobro ou mais no celular. Fica dentro dos 30 s, mas é a etapa mais cara. Mitigação: medir no E2E-A7. Se passar do orçamento, trocar o `DOMParser` por um `<template>` reaproveitado.
- **Transação longa**: 10.000 `bulkAdd` em 20 lotes numa transação é rotina para o IndexedDB, mas um navegador com cota baixa pode abortar com `QuotaExceededError`. O resultado é o mesmo da falha comum: nada gravado, mensagem genérica.
- **Lacunas aninhadas** (aceitas pelo Anki desde a 2.1.56) viram texto (PRD). Um pacote que dependa delas perde as lacunas internas. O caso é contado em `no-cloze` só se não sobrar nenhuma válida.
- **Tamanho de arquivos**: `anki-html.ts` é o candidato a passar de 100 linhas. Se passar, separar as regras de bloco (`anki-html-blocks.ts`) da caminhada. Na página, cada passo é um subcomponente, para que `.ts` e `.html` fiquem abaixo de 100 linhas cada.

### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e todas as rules de `.agents/rules/` (`code-standards.md`, `javascript-typescript.md`, `tests.md`).

- **Camadas**: todo `anki-*.ts` está em `domain/`, sem `@angular/*` nem `rxjs`. O `DOMParser` é API do navegador, como o `crypto` já usado em `db.ts`. `pages/import/` não abre o Dexie nem o `sql.js`: chama `domain/` pelo serviço da página. `state/anki-*` existe porque o estado é compartilhado entre os subcomponentes da página, com escopo na página e não na raiz. `ui/` não ganha nada nem importa `pages/`. `liveQuery` não é usado.
- **Regras de domínio**: lacuna só na Frente (`normalizeCardMarks` em `newCardRecord`); campos FSRS só da inicialização do `ts-fsrs`, nunca a partir do histórico do Anki (RF64); limites de `card-limits.ts`; etiquetas por `normalizeTags`/`tagKey`.
- **Schema e sync**: sem coluna nova, sem migration, sem reemitir `sync_push`, sem mudança em `sync-rows`.
- **Código**: arquivos ≤ 100 linhas (divisão por responsabilidade acima), funções ≤ 30 linhas, ≤ 3 parâmetros (objetos `ImportInput`, `ConvertInput`, `SelectionInput`), constantes nomeadas (tabela de parâmetros), `function` nas funções de topo e arrow nos callbacks, `unknown` + narrowing nos dados do SQLite e do JSON legado (nunca `any`), erros como `AnkiImportError`, `import()` dinâmico para manter o leitor fora do bundle inicial, sem comentários além das regex de lacuna e do leitor de protobuf (onde o “porquê” não cabe no nome).
- **UI**: `@if`/`@for`/`@switch`, `input()`/`output()`/`signal`/`computed`, `inject()`, OnPush, `<input type="file">` nativo com rótulo, `<select>` nativo, `role="progressbar"`, `aria-live` nos marcos de progresso e no resumo; cores por token, escala `text-label`/`text-meta`/`text-body`/`text-front`; `npm run check:type-scale`.
- **Testes**: todo módulo novo de `domain/` com teste, AAA, relógio fixado, fakes do repositório, nenhum disco nem rede (fixture em base64, pacotes montados em memória). UI pelos E2E manuais com `agent-browser`.

### Conformidade com skills

- `angular-developer`: rota com `loadComponent` e `title`, serviços com escopo de componente (`providers`), `DestroyRef` para soltar o listener de `online`, `@switch` por passo, configuração de `assets` no `angular.json` e `assetGroups` do `@angular/service-worker`.
- `agent-browser`: roteiros E2E-15 e E2E-A1–E2E-A7, inclusive `upload` de arquivo e emulação de offline e CPU lenta.
- `supabase`: nada a consultar (sem migration, RLS ou RPC). Só o E2E-A5 usa o Supabase local.
- `vercel-cli`: nenhuma variável nova. Só a conferência do tipo MIME do `.wasm` no preview.

Desvio: o `ui/anki-field-mapper` previsto na TechSpec-base virou `pages/import/import-notetype`, porque só uma página o usa (AGENTS: `ui/` é para duas ou mais).

### Arquivos relevantes e dependentes

> **Ajustes feitos na implementação:**
> - Módulos de apoio extraídos para respeitar o limite de 100 linhas: `anki-types`, `anki-char-stream`, `anki-ranges`, `anki-draft`, `anki-convert-batch`, `anki-steps` e `anki-import-text` (textos e plurais da tela, com teste).
> - O serviço `state/anki-import-run.ts` separa destino, gravação e cancelamento de `anki-import-session.ts`.
> - O wasm é baixado pelo próprio `anki-reader`, validado pela assinatura `\0asm` e entregue como `wasmBinary`. O `sql.js` memoiza a própria inicialização, inclusive quando falha, e por isso não pode baixar o wasm sozinho.
> - `ImportInput.chunkSize` é opcional (padrão 500) e existe para os testes de atomicidade, porque desfazer 500 registros no `fake-indexeddb` leva cerca de 3 s.
> - `ui/card-face` passou a usar `whitespace-pre-wrap` (defeito anterior do RF2, achado no E2E-15).

- Novos: `src/app/domain/anki-{errors,package,reader,schema-modern,schema-legacy,collection,notetype-config,html,cloze,mapping,tags,convert,dedupe,import,selection}.ts` e os respectivos `.test.ts`; `src/app/state/{anki-reader-status,anki-import-session}.ts`; `src/app/pages/import/{import,import-file,import-decks,import-fields,import-notetype,import-preview,import-target,import-progress,import-summary}.{ts,html}`; `src/test/{anki-builder,anki-fixtures}.ts`; `scripts/make-anki21b-fixture.mjs`.
- Modificados: `src/app/domain/cards.ts` (`newCardRecord`), `src/app/domain/decks.ts` (`newDeckRecord` exportado), `src/app/app.routes.ts`, `src/app/pages/settings/settings.html`, `src/app/pages/no-deck/no-deck.html`, `angular.json`, `ngsw-config.json`, `package.json`/`package-lock.json`.
- Só leitura (contrato inalterado): `src/app/domain/{db,card-limits,tags,tag-catalog,text-marks,text-marks-normalize,queue,sync}.ts`, `src/app/state/deck-store.ts`, `src/app/ui/{card-face,tag-chips,marked-text}/*`, `src/test/{db-helpers,fake-supabase,card-fixtures}.ts`.
- Referência no Lingo (`~/Desktop/lingo`, branch `des`): `src/services/ankiImport.ts` (+ `.test.ts`), `src/screens/Import.tsx`, `src/components/{AnkiNotePicker,ImportTarget}.tsx`, `src/services/db.ts#insertCardsInChunks`.
- Documentos: [tasks/produto/techspec.md](../produto/techspec.md) (a linha de `anki-import.ts`/`anki-html.ts`/`anki-cloze.ts` bate com os nomes daqui; `ui/anki-field-mapper` virou `pages/import/import-notetype`).
