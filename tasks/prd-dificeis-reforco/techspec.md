# Especificação técnica — Difíceis e reforço

> PRD: [prd.md](prd.md). TechSpec-base: [tasks/produto/techspec.md](../produto/techspec.md). O modelo `Card`/`ReviewLog`, o Dexie `version(1)`, a sincronização e as decisões gerais estão lá, e este documento não os repete. Os IDs de teste da base (TU-21, TI-11, E2E-12) foram mantidos. Os casos próprios usam o sufixo `D` (`TU-D*`, `TI-D*`, `E2E-D*`). O Lingo não tem cartões difíceis nem reforço, então a lógica é nova e segue o estilo de `queue.ts` e `tag-catalog.ts`.

## Resumo

A pontuação de dificuldade é calculada no aparelho com dados que já existem: `Card.lapses` (escrito pelo `scheduler`) e as respostas `again` em `reviewLogs`. A entrega não muda schema, migration, RPC nem sync. Um módulo puro (`domain/difficulty.ts`) calcula a pontuação, ordena e filtra. Outro (`domain/difficulty-data.ts`) faz a leitura no Dexie em duas fases: (1) cartões do baralho + erros dos últimos 30 dias pelo índice `reviewedAt`, que gera os candidatos; (2) o histórico inteiro só dos candidatos, pelo índice `cardId`, que dá “errou N vezes” e o último erro. A lista se mantém viva por `liveQuery`, por uma variante nova de `state/live-query.ts` que reage à troca de baralho.

O reforço é **somente leitura** por construção. A sessão é uma máquina de estados pura (`domain/reinforce.ts`: sorteio dos 30, “Errei volta para o fim”, placar pela primeira resposta), guardada num serviço de `state/` com escopo na página. Nenhum arquivo do reforço pode importar `scheduler`, `db` (exceto tipos) nem os módulos de escrita: uma regra `no-restricted-imports` no ESLint faz o CI falhar se isso mudar. A única escrita alcançável a partir dessas telas é a edição de texto, por um diálogo extraído da revisão (`ui/card-edit-dialog`). As telas são duas rotas, `/dificeis` e `/reforco`, que carregam o filtro de etiquetas na query string (`?etiquetas=`), lida por `withComponentInputBinding()`. A revisão é refatorada para compartilhar a moldura (`ui/session-shell`), o diálogo de edição e o mapeamento de teclas (`domain/review-keys.ts`).

## Arquitetura do sistema

### Visão dos componentes

| Camada | Módulo | Novo/mod. | Papel |
| --- | --- | --- | --- |
| domain | `difficulty.ts` | novo | Constantes da regra; `difficultyScore`; `countRecentErrors`, `summarizeErrorHistory` (puros sobre `ReviewLog[]`); `rankDifficult` (corte + ordem); `filterDifficultByTags` (OU); `difficultTagOptions`. |
| domain | `difficulty-data.ts` | novo | Leitura no Dexie: `listDifficult(deckId, now?)` (duas fases) e `countDifficult(deckId, now?)` (só a fase 1, para a Home); `liveCardIds(deckId)` para o reforço detectar exclusões. |
| domain | `days-ago.ts` | novo | `formatDaysAgo(at, now)` (“hoje”, “ontem”, “há N dias”, por dia de calendário local) e `difficultyCaption(item, now)` (“errou N vezes · último erro há X dias”). |
| domain | `tag-param.ts` | novo | `parseTagParam` / `serializeTagParam`: chaves de etiqueta ↔ `?etiquetas=a,b`. |
| domain | `reinforce.ts` | novo | `REINFORCE_LIMIT = 30`; `pickReinforceCards` (top 30 + Fisher–Yates com `random` injetável); máquina de estados `startReinforce` / `answerReinforce` / `dropMissing` / `reinforceProgress` / `summarizeReinforce`. Sem I/O. |
| domain | `review-keys.ts` | novo (extraído) | `reviewKeyAction(event, revealed)` → `'reveal' \| 'again' \| 'good' \| null`. Hoje essa lógica mora em `review.ts`, sem teste. |
| state | `live-query.ts` | mod. | Ganha `liveQueryFor(source, querier)`: refaz a `liveQuery` quando o signal de origem muda (troca de baralho). Continua sendo o único arquivo que chama `liveQuery()`. |
| state | `reinforce-session.ts` | novo | `@Injectable()` com escopo na página `/reforco`: carrega a lista, sorteia, guarda o `ReinforceState` e os `Card` por id, controla `revealed`, poda os cartões excluídos. Não importa `scheduler` nem `db`. |
| ui | `session-shell/` | novo (extraído) | Moldura da sessão: “← Sair”, “n / total”, barra fina, área rolável do cartão e rodapé fixo, com slots `[banner]`, conteúdo e `[footer]`. Usado pela revisão e pelo reforço. |
| ui | `card-edit-dialog/` | novo (extraído) | `<dialog>` com `card-form`; `open(card)`; chama `updateCardContent` e emite o `Card` atualizado. Usado pela revisão, pela lista Difíceis e pelo reforço (sessão e resumo). |
| ui | `mobile-nav/nav-items.ts` | novo (extraído) | `NAV_ITEMS` único, com “Difíceis” entre “Cartões” e “Progresso”. Hoje a lista está duplicada em `app.ts` e `mobile-nav.ts`. |
| pages | `difficult/` (`/dificeis`) | novo | `difficult.ts/.html` (cabeçalho, critério, filtro, lista, estado vazio, “Reforçar N”) + `difficult-row.ts/.html` (item). |
| pages | `reinforce/` (`/reforco`) | novo | `reinforce.ts/.html` (faixa, sessão, teclas, edição) + `reinforce-summary.ts/.html` (placar, errados, botões). |
| pages | `home/difficult-shortcut.ts/.html` | novo | “N cartões difíceis · Reforçar” → `/dificeis`, com contagem viva. Fica separado porque `home.ts` já tem 98 linhas. |
| pages | `review/` | mod. | Passa a usar `session-shell`, `card-edit-dialog` e `reviewKeyAction`, sem mudar comportamento. |
| pages | `home/home.html`, `home.ts` | mod. | Inclui `<app-difficult-shortcut />` nos estados `today` e `filtered-empty`. |
| app | `app.routes.ts`, `app.config.ts`, `app.ts` | mod. | Rotas `dificeis` e `reforco` (`requireDeck`, `title`); `provideRouter(routes, withComponentInputBinding())`; `app.ts` importa `NAV_ITEMS`. |
| config | `eslint.config.js` | mod. | Bloco `@typescript-eslint/no-restricted-imports` para os arquivos do reforço. |

### Relacionamentos e fluxo de dados

```
/dificeis ─ etiquetas = input() (query) ─ parseTagParam
   ├─ liveQueryFor(deckId, listDifficult) ─ difficulty-data ─ Dexie (cards, reviewLogs)
   │      └─ rankDifficult ─ DifficultCard[]
   ├─ difficultTagOptions + filterDifficultByTags (OU) ─ tag-filter (ui) ─ router.navigate(?etiquetas)
   ├─ difficult-row ─ card-edit-dialog ─ updateCardContent (única escrita, RF5)
   └─ “Reforçar N” ─ /reforco?etiquetas=…
/reforco ─ ReinforceSession (providers da página)
   ├─ listDifficult → filterDifficultByTags → pickReinforceCards(random) → startReinforce
   ├─ answerReinforce / reinforceProgress / summarizeReinforce  (puro, em memória)
   ├─ liveQueryFor(deckId, liveCardIds) → dropMissing (RF53e)
   └─ session-shell + card-face + answer-bar + card-edit-dialog + reinforce-summary
home ─ difficult-shortcut ─ liveQueryFor(deckId, countDifficult)
review ─ session-shell + card-face + answer-bar + card-edit-dialog + reviewKeyAction (sem mudança de regra)
```

**Offline e sem conta**: tudo lê o Dexie local. Nenhuma tela desta entrega chama o Supabase nem depende de rede. Sem conta, a lista reflete só o histórico do aparelho. Com conta, o pull já existente traz cartões (com `lapses`) e `reviewLogs` dos outros aparelhos, e a `liveQuery` recalcula a lista sozinha quando eles chegam (CA-D18).

**Sync, LWW e CAS**: o reforço não grava nada, então não marca `dirty`, não muda `updatedAt` e não cria log. O push seguinte não leva nada dele (CA-D12). A edição de texto pelo diálogo é a mesma `updateCardContent` de hoje (`dirty: 1`, `updatedAt` = agora, campos FSRS intactos), com o LWW e o CAS de sempre. A ordem cards → logs não é afetada.

## Design de implementação

### Principais interfaces

```ts
// domain/difficulty.ts (puro)
difficultyScore(input: { lapses: number; recentErrors: number }): number
countRecentErrors(logs: readonly ReviewLog[], since: number): Map<string, number>   // só 'again', reviewedAt ≥ since
summarizeErrorHistory(logs: readonly ReviewLog[]): Map<string, ErrorHistory>       // total de 'again' e último
rankDifficult(input: RankInput): DifficultCard[]                                    // score ≥ 3, ordenado
filterDifficultByTags(list: readonly DifficultCard[], keys: readonly string[]): DifficultCard[]  // OU; [] = todos
difficultTagOptions(list: readonly DifficultCard[]): TagSummary[]                   // summarizeTags dos difíceis

// domain/difficulty-data.ts (Dexie, só leitura)
listDifficult(deckId: string, now?: number): Promise<DifficultCard[]>
countDifficult(deckId: string, now?: number): Promise<number>
liveCardIds(deckId: string): Promise<string[]>

// domain/days-ago.ts
formatDaysAgo(at: number, now: number): string
difficultyCaption(item: DifficultCard, now: number): string
```

```ts
// domain/reinforce.ts (puro, sem I/O)
pickReinforceCards(list: readonly DifficultCard[], random: () => number): string[]
startReinforce(ids: readonly string[]): ReinforceState
answerReinforce(state: ReinforceState, rating: BinaryRating): ReinforceState
dropMissing(state: ReinforceState, alive: ReadonlySet<string>): ReinforceState
reinforceProgress(state: ReinforceState): { done: number; total: number }
summarizeReinforce(state: ReinforceState): ReinforceSummary

// domain/review-keys.ts
reviewKeyAction(event: Pick<KeyboardEvent, 'code' | 'key'>, revealed: boolean): ReviewKeyAction | null

// domain/tag-param.ts
parseTagParam(raw: string | null | undefined): string[]
serializeTagParam(keys: readonly string[]): string | null
```

```ts
// state/live-query.ts (acréscimo)
liveQueryFor<K, T>(source: Signal<K | undefined>, querier: (key: K) => Promise<T>): Signal<T | undefined>

// state/reinforce-session.ts (@Injectable, providers de /reforco)
start(deckId: string, tagKeys: readonly string[]): Promise<void>
readonly current: Signal<Card | undefined>;  readonly again: Signal<boolean>   // “de novo”
readonly progress: Signal<{ done: number; total: number }>;  readonly revealed: Signal<boolean>
readonly summary: Signal<ReinforceSummary | null>                              // não nulo quando acaba
reveal(): void;  answer(rating: BinaryRating): void;  replaceCard(card: Card): void

// ui/session-shell: position = input.required<string>(); progress = input.required<number>(); exit = output<void>()
// ui/card-edit-dialog: open(card: Card): void; saved = output<Card>()
```

Regras dos contratos:

- `now` é parâmetro (padrão `Date.now()`) em toda função que depende do relógio, para os testes fixarem o tempo sem `vi.setSystemTime` quando não for preciso.
- `listDifficult` não lança erro por falta de histórico. Cartão sem log local fica com `totalErrors = 0` e `lastErrorAt = null`, e a legenda usa `max(totalErrors, lapses)` como N, porque todo lapso é uma resposta `again` (RF51d).
- `rankDifficult` exclui cartões com `deletedAt ≠ 0` mesmo que venham na entrada. `liveCards(deckId)` já filtra, mas a regra fica no ponto puro para o teste cobrir.
- `answerReinforce` é imutável: devolve um estado novo e nunca altera a entrada. Com a fila vazia, devolve o mesmo estado.
- `ReinforceSession.answer` é síncrono e zera `revealed` **na mesma chamada**, antes de mudar o cartão atual. Assim um segundo “2” ou Espaço no mesmo cartão não registra uma segunda resposta (RF27, CA-D10), sem depender do `effect` usado pela revisão.
- `pickReinforceCards` recebe `random` explícito. A página passa `Math.random` e os testes passam um gerador determinístico.
- `parseTagParam` aplica `tagKey` em cada item, descarta vazios e duplicatas e nunca lança erro com entrada malformada. Etiquetas não contêm vírgula (o `splitTagInput` já quebra nela), então a vírgula é um separador seguro.
- `liveQueryFor` devolve `undefined` enquanto carrega e quando a origem é `undefined`, como `liveQuerySignal`.

### Modelos de dados

Sem mudança de schema no Dexie (`version(1)`) nem no Postgres. As consultas usam índices que já existem: `reviewLogs.reviewedAt`, `reviewLogs.cardId` e `cards.[deckId+deletedAt]` (por `liveCards`).

#### `DifficultCard` — item da lista Difíceis

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `card` | `Card` | sim | O cartão vivo, com `lapses`, texto, marcas e etiquetas. |
| `score` | `number` | sim | `2 × lapses + recentErrors`, sempre ≥ 3. |
| `recentErrors` | `number` | sim | Respostas `again` com `reviewedAt ≥ now − 30 × DAY`. |
| `totalErrors` | `number` | sim | Respostas `again` em todo o histórico local do cartão. |
| `lastErrorAt` | `number \| null` | sim | `reviewedAt` do `again` mais recente; `null` sem log local. |

```text
{
  "card": { "id": "c-7f1", "deckId": "d-const", "front": "O mandato é de quatro anos", "lapses": 2, "tags": ["CESPE"], "...": "…" },
  "score": 5,
  "recentErrors": 1,
  "totalErrors": 4,
  "lastErrorAt": 1790380800000
}
```

> **Degradação — histórico ainda não sincronizado:** o cartão chegou do pull com `lapses: 2`, mas os logs ainda não. Ele entra pela fase 1 (pontuação 4) e a fase 2 não acha log. A legenda fica “errou 2 vezes”, sem data.

```text
{ "card": { "id": "c-9a0", "lapses": 2, "…": "…" }, "score": 4, "recentErrors": 0, "totalErrors": 0, "lastErrorAt": null }
```

#### `RankInput` e `ErrorHistory` — entradas puras de `rankDifficult`

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `cards` | `readonly Card[]` | sim | Cartões vivos do baralho ativo. |
| `recent` | `ReadonlyMap<string, number>` | sim | Saída de `countRecentErrors`, por `cardId`. |
| `history` | `ReadonlyMap<string, ErrorHistory>` | sim | Saída de `summarizeErrorHistory`, só para os candidatos. |
| `ErrorHistory.total` | `number` | sim | Total de `again` no histórico do cartão. |
| `ErrorHistory.lastAt` | `number \| null` | sim | Último `again`. |

Ordem de `rankDifficult`: `score` desc → `lastErrorAt` desc (`null` por último) → `card.createdAt` asc (RF51c).

```text
{
  "cards": ["…5.000 cartões…"],
  "recent": { "c-7f1": 1, "c-2b4": 3 },
  "history": { "c-7f1": { "total": 4, "lastAt": 1790380800000 }, "c-2b4": { "total": 3, "lastAt": 1790467200000 } }
}
```

#### `ReinforceState` — sessão em memória

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `pending` | `readonly string[]` | sim | Ids na ordem em que vão aparecer; o primeiro é o atual. “Errei” move o atual para o fim. |
| `cleared` | `readonly string[]` | sim | Ids já acertados, na ordem do acerto. |
| `misses` | `Readonly<Record<string, number>>` | sim | Quantas vezes cada id foi errado na sessão. `misses[id] > 0` com o id em `pending` = “de novo”. |

Derivados: `total = cleared.length + pending.length` (ids distintos ainda existentes); `done = cleared.length`; a sessão acaba quando `pending.length === 0`. `dropMissing` tira de `pending` os ids que não estão vivos, e com isso eles saem do total (RF53e).

```text
{
  "pending": ["c-2b4", "c-7f1"],
  "cleared": ["c-11e", "c-5d0", "c-a93"],
  "misses": { "c-7f1": 1 }
}
```

> **Sessão vazia:** `/reforco` aberto pela URL com um filtro sem difíceis, ou depois de todos os candidatos serem excluídos. `pending` e `cleared` vazios: a página mostra “Nenhum cartão difícil para reforçar” e “Voltar para Difíceis”, sem resumo.

```text
{ "pending": [], "cleared": [], "misses": {} }
```

#### `ReinforceSummary` — fim do reforço (RF54)

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `total` | `number` | sim | Cartões distintos da sessão (os que foram acertados). |
| `firstTry` | `number` | sim | Acertados sem nenhum “Errei” na sessão. |
| `missed` | `ReadonlyArray<{ id: string; misses: number }>` | sim | Errados ao menos uma vez, na ordem do primeiro erro. Vazio quando todos acertaram de primeira (RF54d). |

```text
{ "total": 10, "firstTry": 7, "missed": [{ "id": "c-7f1", "misses": 2 }, { "id": "c-2b4", "misses": 1 }, { "id": "c-a93", "misses": 1 }] }
```

#### `ReviewKeyAction` — teclado da revisão e do reforço

| Tecla | `revealed = false` | `revealed = true` |
| --- | --- | --- |
| `Space` (`code`) | `'reveal'` | `'good'` |
| `1` (`key`) | `null` | `'again'` |
| `2` (`key`) | `null` | `'good'` |
| outra | `null` | `null` |

A página continua responsável por `preventDefault` no Espaço e por ignorar teclas com o diálogo de edição aberto.

#### Contrato de rota — `?etiquetas=`

| Rota | Parâmetro | Tipo | Padrão | Regras |
| --- | --- | --- | --- | --- |
| `/dificeis` | `etiquetas` | `string` | — | Chaves `tagKey` separadas por vírgula. Chaves que não existem entre os difíceis do baralho são mantidas: o filtro não casa com nenhum cartão, e a tela mostra “Nenhum cartão difícil com essas etiquetas” com “Limpar filtro” (RF52d, CA-D7). |
| `/reforco` | `etiquetas` | `string` | — | Mesmo formato. Repassado de volta em “← Sair” e em “Voltar para Difíceis”. |

```text
/dificeis?etiquetas=cespe,art.%2037
/reforco?etiquetas=cespe,art.%2037
```

Regras de navegação:

- Mudar o filtro em `/dificeis` usa `router.navigate([], { queryParams, replaceUrl: true })`: o filtro não empilha histórico.
- O item “Difíceis” do menu e o atalho da Home apontam para `/dificeis` sem parâmetro, e assim limpam o filtro (RF52c).
- Trocar de baralho com `/dificeis` aberta limpa o parâmetro (efeito na página que compara o `deckId` anterior). Em `/reforco`, a sessão já montada segue com os cartões carregados, como a revisão.
- Recarregar `/reforco` monta uma sessão nova com o mesmo filtro. A anterior some sem resumo, e nada se perde porque nada foi gravado (RF53d).

#### Parâmetros fixos

| Constante | Valor | Onde |
| --- | --- | --- |
| `LAPSE_WEIGHT` | `2` | `difficulty.ts` |
| `RECENT_ERROR_WINDOW_MS` | `30 * DAY` (de `dates.ts`) | `difficulty.ts` |
| `DIFFICULT_THRESHOLD` | `3` | `difficulty.ts` |
| `REINFORCE_LIMIT` | `30` | `reinforce.ts` |
| `TAG_PARAM` | `'etiquetas'` | `tag-param.ts` |

#### Regra de lint — reforço sem escrita

`eslint.config.js` ganha um bloco para `src/app/domain/reinforce.ts`, `src/app/state/reinforce-session.ts` e `src/app/pages/reinforce/**/*.ts`:

| Regra | Configuração |
| --- | --- |
| `@typescript-eslint/no-restricted-imports` | `patterns: [{ group: ['**/domain/scheduler', '**/domain/db', '**/domain/cards', '**/domain/decks', '**/domain/tag-bulk', '**/domain/sync*'], allowTypeImports: true, message: 'O reforço não grava nada (RF53). Edição de texto só via ui/card-edit-dialog.' }]` |

`import type { Card } from '…/domain/db'` continua permitido. A regra é por arquivo, não transitiva: `/reforco` pode usar `ui/card-edit-dialog`, que importa `cards.ts`. É o caminho intencional da edição de texto.

### Endpoints da API

Não se aplica. Nenhum endpoint novo nem alterado, e nenhuma chamada ao Supabase nas telas desta entrega.

## Pontos de integração

Nenhuma integração externa nova. O Supabase só participa indiretamente: o pull existente traz `cards.lapses` e `review_logs`, que alimentam a lista. Não há modo de falha novo. Se o pull falhar, a lista reflete o histórico local, sem aviso (PRD, “Offline e sem conta”).

## Abordagem de testes

Vitest com `fake-indexeddb`, `src/test/db-helpers.ts` (`resetDb` no `afterEach`), `src/test/card-fixtures.ts` e `src/test/fake-supabase.ts`. O relógio é fixado com `vi.useFakeTimers` + `vi.setSystemTime` ou passado como `now`. A aleatoriedade usa um gerador determinístico passado como `random`. Nenhuma rede. Piso de 80% em `src/app/domain/**`. Todo módulo novo de `domain/` entra com teste no mesmo commit.

Prioridade (regra 3 de `tests.md`): primeiro a garantia de que o reforço não grava (TI-11) e a regra de pontuação nos limites, depois a máquina de estados da sessão e, por fim, legenda, parâmetro de URL e teclas.

### Testes de unidade

| ID | Nome do caso de teste | Critérios de aceitação | Resultado esperado |
|----|-----------------------|------------------------|--------------------|
| TU-21 | `difficultyScore` e corte em 3 por `rankDifficult` | CA-28 | 2 lapsos + 1 erro recente → 5, entra; 1 lapso + 0 → 2, fica de fora; 0 lapsos + 3 erros → 3, entra. |
| TU-D1 | `countRecentErrors` nos limites da janela | CA-D1 | Só conta `again`; erro em `now − 30×DAY` conta; em `now − 30×DAY − 1` não conta; `good` nunca conta. |
| TU-D2 | `rankDifficult`: ordem e desempates | CA-D2 | Pontuações 7, 5, 5: o 7 primeiro, depois o 5 com último erro ontem, depois o 5 com 10 dias; empate total pela criação mais antiga; `lastErrorAt: null` depois dos que têm data; cartão com `deletedAt ≠ 0` excluído. |
| TU-D3 | `summarizeErrorHistory`: total e último erro | CA-D2 | 4 `again` e 3 `good` → `total: 4`, `lastAt` = maior `reviewedAt` dos `again`; sem `again` → id ausente do mapa. |
| TU-D4 | `formatDaysAgo` e `difficultyCaption` | CA-D2, RF51d | Mesmo dia → “hoje”; dia anterior às 23:59 com `now` às 00:01 → “ontem”; 5 dias → “há 5 dias”; “errou 1 vez”; sem log → “errou 2 vezes” (N = `lapses`), sem data. |
| TU-D5 | `filterDifficultByTags` (OU) e `difficultTagOptions` | CA-D5, CA-D7 | 8 “CESPE”, 3 “FGV”, 2 com as duas e 5 sem etiqueta: “CESPE, FGV” → 13; `[]` → 18; chave inexistente → `[]`; opções com a contagem entre os difíceis. |
| TU-D6 | `parseTagParam` / `serializeTagParam` | CA-D6 | `null`/`''` → `[]`; `'CESPE,,cespe, fgv '` → `['cespe','fgv']`; `[]` → `null`; ida e volta preserva as chaves. |
| TU-D7 | `pickReinforceCards`: top 30 e embaralhamento | CA-D8 | De 45 ordenados, devolve exatamente os 30 primeiros (como conjunto); dois `random` determinísticos diferentes dão ordens diferentes; com 12, devolve os 12. |
| TU-D8 | `answerReinforce`: “Errei” volta para o fim até acertar | CA-D9 | Sessão de 5, erra o 2º: ele vai para depois do 5º, `misses = 1`, `reinforceProgress` = 4/5 após acertar o 5º; acertar o 2º encerra com 5/5. A entrada não é alterada. |
| TU-D9 | `summarizeReinforce` | CA-D15, RF54d | 10 cartões, 3 errados (um duas vezes) → `firstTry: 7`, `total: 10`, `missed` na ordem do primeiro erro com `misses` 2/1/1; todos de primeira → `missed: []`. |
| TU-D10 | `dropMissing` | RF53e | Id pendente excluído sai de `pending` e do total; id já em `cleared` permanece; todos pendentes excluídos → sessão encerrada. |
| TU-D11 | `reviewKeyAction` | CA-D10, CA-13 | Tabela de `ReviewKeyAction` inteira, incluindo `1`/`2` antes de revelar → `null`. |

### Testes de integração

| ID | Nome do caso de teste | Critérios de aceitação | Resultado esperado |
|----|-----------------------|------------------------|--------------------|
| TI-11 | Sessão de reforço completa não grava nada | CA-29, CA-D11, CA-D12 | Semeia um baralho com cartões difíceis (um deles vencido hoje) e logs; tira um retrato de `db.cards`, `db.reviewLogs` e `db.syncState` (incluindo `dirty`, `updatedAt` e campos FSRS) e de `buildQueue`/`computeStats`; roda `listDifficult` → `pickReinforceCards` → `answerReinforce` com “Errei” e “Acertei” até o fim; depois, tabelas, fila do dia e estatísticas são idênticas ao retrato. |
| TI-D1 | `listDifficult` no Dexie real | CA-28, CA-D1, CA-D2 | Ignora cartões excluídos e de outro baralho (com logs de mesmo `cardId` semeados); `totalErrors` conta o histórico inteiro; `recentErrors` só os 30 dias; a ordem é a de TU-D2. |
| TI-D2 | Terceiro erro pela revisão normal faz o cartão aparecer | CA-D3 | Um cartão com 2 erros recentes não está na lista; depois de `scheduler.answer` com `again`, `listDifficult` o inclui com `recentErrors: 3`. |
| TI-D3 | `countDifficult` igual a `listDifficult(...).length` | CA-D4, CA-D19 | Baralho sem difíceis → 0; com 4 → 4, nos mesmos dados. |
| TI-D4 | Logs vindos do pull entram na pontuação | CA-D18 | Com `fake-supabase`, o pull de três `review_logs` `again` de outro aparelho para um cartão local faz `listDifficult` incluí-lo. |
| TI-D5 | `liveCardIds` reflete a exclusão | RF53e | Após `deleteCards([id])`, o id não aparece; `dropMissing` com esse conjunto tira o cartão da sessão. |

### Testes E2E

Roteiros executados à mão com a skill `agent-browser` contra `npm start -- --port <porta livre>` (e `npx supabase start` só para o E2E-D5), com capturas em `tasks/prd-dificeis-reforco/evidences/`. Sem Playwright nem pasta `e2e/`. Para criar cartões difíceis sem revisar à mão, o roteiro semeia o IndexedDB `certamecards` pelo `eval` do navegador com a API nativa (`indexedDB.open('certamecards')` → `cards.put` e `reviewLogs.put` em lote, no formato de `Card`/`ReviewLog`, com `lapses` e logs `again` de datas controladas) e recarrega a página. O mesmo `eval` lê `due`, `reps`, `updatedAt` e `dirty` antes e depois do reforço.

| ID | Nome do caso de teste | Critérios de aceitação | Resultado esperado |
|----|-----------------------|------------------------|--------------------|
| E2E-12 | Difíceis → Reforçar → conferir agenda inalterada | CA-28, CA-29, CA-D11 | A lista tem só os cartões com pontuação ≥ 3; depois de um reforço com “Errei” e “Acertei”, `due`, `reps`, `updatedAt` e `dirty` lidos pelo `eval` são iguais; a Home mostra o mesmo número; Progresso mostra a mesma retenção, total e heatmap. |
| E2E-D1 | Tela Difíceis: ordem, legenda, vazio, edição e atualização viva | CA-D2, CA-D3, CA-D4, CA-D19 | Ordem e “errou N vezes · último erro há X dias” conferem com os dados semeados; editar um item no diálogo e salvar mantém a rolagem; errar um cartão pela terceira vez em outra aba faz ele aparecer sem recarregar; baralho sem difíceis mostra o critério e nenhum “Reforçar”; menu (desktop e ☰) com “Difíceis” entre “Cartões” e “Progresso”; atalho da Home com a contagem certa, ausente sem difíceis. |
| E2E-D2 | Filtro por etiqueta | CA-D5, CA-D6, CA-D7 | “CESPE, FGV” mostra 13 e “Reforçar 13”; o filtro sobrevive a ir e voltar do reforço; o menu abre a tela sem filtro; trocar de baralho limpa; o “Estudar só…” da Home continua como estava; um filtro sem resultado mostra a mensagem e não abre sessão. |
| E2E-D3 | Sessão de reforço | CA-D8, CA-D9, CA-D10, CA-D13, CA-D14, CA-D16 | 45 difíceis → sessão de 30, em ordem diferente em duas aberturas; Espaço/1/2 funcionam e “2” duplo conta uma vez; o cartão errado volta no fim com “de novo” e o contador só avança no acerto; a faixa “Reforço — não mexe na sua agenda” fica visível a 360 px e no desktop; editar o cartão atual volta a ele com o texto novo; recarregar no meio não mostra erro e não altera os cartões. |
| E2E-D4 | Resumo do reforço | CA-D15, RF54d | “Acertou de primeira: 7 de 10” e a lista dos 3 errados com as contagens; editar um deles e salvar volta ao resumo com o texto novo; uma sessão sem erros não mostra a lista; o resumo é anunciado (`aria-live`). |
| E2E-D5 | Dois perfis na mesma conta (Supabase local) | CA-D12, CA-D18 | O reforço em A seguido de “Sincronizar agora” não muda nada em B; três erros em A pela revisão normal + sync fazem o cartão aparecer em Difíceis de B depois da sincronização. |
| E2E-D6 | Offline, 360 px e volume | CA-D17, CA-D20 | Com o DevTools offline e sem conta: Difíceis, filtro, reforço e resumo sem erro. Sem rolagem horizontal a 360 px; `npm run check:type-scale` verde. Com 5.000 cartões e 50.000 logs semeados, abrir Difíceis e mudar o filtro fica < 500 ms (painel Performance). |
| E2E-D7 | Regressão da revisão depois da refatoração | CA-13, CA-14 | A revisão normal continua igual: teclas, “n / total”, barra, edição do cartão atual e fim de sessão. |

## Sequenciamento do desenvolvimento

### Ordem de construção

1. **Regra de dificuldade** — `difficulty.ts`, `days-ago.ts`, `difficulty-data.ts` + TU-21, TU-D1–TU-D5, TI-D1–TI-D4. É o núcleo, e nada de UI depende de outra coisa antes dele.
2. **Sessão pura** — `reinforce.ts`, `tag-param.ts`, `review-keys.ts` + TU-D6–TU-D11, TI-11 e TI-D5. A garantia de “não grava nada” fica provada antes de existir tela.
3. **Refatoração da revisão** — `ui/session-shell`, `ui/card-edit-dialog`, `review.ts/.html` usando `reviewKeyAction` → E2E-D7. Vem antes das telas novas para o reforço já nascer sobre as peças compartilhadas, e a regressão é verificada isoladamente.
4. **Infra de rota e navegação** — `liveQueryFor` em `live-query.ts`, `withComponentInputBinding()`, rotas `dificeis`/`reforco`, `nav-items.ts`.
5. **Tela Difíceis** — `pages/difficult` (+ `difficult-row`), filtro, diálogo de edição, `home/difficult-shortcut` → E2E-D1, E2E-D2.
6. **Reforço** — `state/reinforce-session.ts`, `pages/reinforce` (+ `reinforce-summary`), regra de lint → E2E-D3, E2E-D4, E2E-12.
7. **Validação** — `npm run lint`, `npm run check:type-scale`, `npm run test:coverage`, `npm run build`; E2E-D5 (Supabase local) e E2E-D6.

### Dependências técnicas

- Fase 1 e [prd-etiquetas](../prd-etiquetas/techspec.md) concluídas: `tag-catalog.summarizeTags`, `ui/tag-filter`, `ui/tag-chips`, `tagKey`.
- Nenhuma dependência npm nova. `withComponentInputBinding` faz parte de `@angular/router`.
- Supabase local (Docker) só para o E2E-D5.
- Deploy: sem migration, a entrega vai para produção só com a promoção da `des` para a `prod`, a pedido do Rafael.

## Monitoramento e observabilidade

Sem backend novo, nada a expor.

- Falha ao salvar no `card-edit-dialog` mostra a mensagem do `card-form` (comportamento atual) e vai para `console.error` com o erro original, sem o texto do cartão.
- Leituras de `listDifficult` que falham (IndexedDB indisponível) deixam a tela no estado de carregamento e vão para `console.error`. É o mesmo caso que já derruba o app inteiro, então não há tratamento próprio.
- O uso do reforço (métrica do PRD) é observado pelo autor. O reforço não deixa rastro de propósito, e não há telemetria.

## Considerações técnicas

### Principais decisões

- **Duas fases de leitura.** A pontuação só precisa dos logs dos últimos 30 dias (faixa do índice `reviewedAt`), e o “errou N vezes” precisa do histórico inteiro só dos candidatos (`cardId` `anyOf`). Ler todos os logs do baralho (até 50.000) a cada mudança custaria mais que a meta de 500 ms. A `countDifficult` da Home para na fase 1.
- **Histórico dos candidatos por consultas `equals` em uma transação, não `anyOf`.** Medido no E2E-D6 (build de produção, 5.000 cartões e 50.000 revisões): o `anyOf` com 734 ids levou ~6,5 s; as consultas `equals` em paralelo, ~0,7 s. Com ~100 difíceis a tela abre em ~0,3 s; com 734 (15% do baralho, caso extremo) fica em ~0,7 s, acima da meta de 500 ms.
- **Erros por `cardId`, não por `log.deckId`.** Um log é atribuído ao baralho do cartão atual. Isso protege a regra se algum dia houver mover cartão entre baralhos, e não custa nada a mais.
- **Sessão como máquina de estados pura.** Toda a regra do reforço (sorteio, volta do erro, placar, poda) é testável sem Angular e conta na cobertura. O serviço de `state/` só guarda o estado e os `Card`.
- **Somente leitura garantido duas vezes**: pelo lint (nenhum import de escrita nos arquivos do reforço) e pelo TI-11 (retrato do banco antes e depois). Descartado: um “modo reforço” dentro do `scheduler`, que poria o caminho de escrita a uma flag de distância.
- **Filtro na query string** (decisão do Rafael). Dá ao “voltar” do navegador o comportamento esperado, mantém o filtro entre `/dificeis` e `/reforco` sem store, e o menu limpa o filtro naturalmente. O custo é recarregar `/reforco` montar uma sessão nova em vez de “encerrar”. É aceitável, porque nada se perde.
- **`withComponentInputBinding()`** para ler `?etiquetas` como `input()`, sem `ActivatedRoute` + RxJS nas páginas (AGENTS: RxJS só nas bordas). Nenhuma página atual tem `input()` com nome de parâmetro de rota, então a mudança global não afeta as outras rotas.
- **`liveQueryFor` em `live-query.ts`.** O `liveQuerySignal` atual fixa a consulta na criação e não percebe a troca do baralho ativo (que não é escrita no Dexie). A variante usa `toObservable` + `switchMap` no mesmo arquivo de borda, que continua sendo o único a chamar `liveQuery()`. Descartado: recriar o componente por baralho com `@for … track deck.id`, que esconderia a intenção.
- **Edição em diálogo** (decisão do Rafael) em vez de navegar para `/cartoes/:id`. A lista e o resumo nunca saem da tela, então rolagem e placar ficam no lugar sem restauração manual. O diálogo sai da revisão para `ui/`, e a revisão passa a usá-lo.
- **Extração de `session-shell` e `review-keys`** (decisão do Rafael). A revisão e o reforço ficam idênticos na moldura e nas teclas, e as teclas ganham teste (hoje não têm).
- **`revealed` zerado dentro de `answer`**, no reforço, em vez de por `effect`. Como a resposta é síncrona e não há `answering` de I/O, essa é a trava contra a resposta dupla (CA-D10).
- **Atalho da Home como subcomponente com consulta própria**, em vez de um campo novo em `HomeSnapshot`. `home.ts` está com 98 linhas, e o atalho fica vivo sem depender do `refresh` da Home.

### Riscos conhecidos

- **Janela de 30 dias com a tela aberta**: a `liveQuery` só recalcula quando o Dexie muda. Um erro que completa 30 dias com a tela aberta só sai da lista na próxima escrita ou na reabertura. Impacto baixo (a pontuação cai 1). Mitigação: aceitar e registrar. Se incomodar, a página pode ler o `DueTick` como gatilho extra.
- **Recalcular a cada escrita**: com Difíceis aberta em outra aba durante a revisão, cada resposta refaz `listDifficult`. Fase 1 (5.000 cartões + logs de 30 dias) + fase 2 (candidatos) fica bem abaixo de 500 ms no E2E-D6. Se não ficar, a fase 1 passa a ler só `lapses > 0` ou erros recentes em vez de todos os cartões.
- **Refatoração da revisão**: é o fluxo diário. Mitigação: a regra de teclas ganha teste (TU-D11), a moldura é só apresentação, e o E2E-D7 é obrigatório antes de seguir para as telas novas.
- **Aleatoriedade**: `Math.random` na página, gerador determinístico nos testes. O teste de “ordens diferentes” (TU-D7) usa dois geradores fixos, nunca o acaso real.
- **`withComponentInputBinding()` global**: uma página futura com `input()` homônimo de um parâmetro passaria a recebê-lo. Mitigação: registrar no AGENTS.md, na seção de convenções de Angular.
- **Tamanho de arquivos**: `review.ts` (76) e `review.html` (68) diminuem com as extrações. `difficult.ts` e `reinforce.ts` nascem com subcomponentes (`difficult-row`, `reinforce-summary`) para ficar abaixo de 100 linhas cada `.ts`/`.html`.

### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e todas as rules de `.agents/rules/` (`code-standards.md`, `javascript-typescript.md`, `tests.md`).

- **Camadas**: `difficulty*.ts`, `days-ago.ts`, `tag-param.ts`, `reinforce.ts` e `review-keys.ts` são TS puro, sem `@angular/*` nem `rxjs`. `pages/` e `ui/` não abrem o Dexie: leitura reativa por `liveQueryFor` e escrita (`updateCardContent`) pelo `card-edit-dialog`. `ReinforceSession` existe porque a sessão precisa de estado entre os subcomponentes da página, com escopo na página e não na raiz. `ui/` não importa `pages/`.
- **`liveQuery`**: continua chamado só em `state/live-query.ts`. A linha do AGENTS.md que cita `liveQuerySignal` como único ponto passa a citar o arquivo (`liveQuerySignal` e `liveQueryFor`).
- **RxJS**: só em `live-query.ts` (borda já prevista). As páginas leem a query por `input()`.
- **Regras de domínio**: o reforço não escreve nada (RF53, lint + TI-11). Campos FSRS continuam exclusivos do `scheduler`. Editar texto não reagenda (RF5), pelo mesmo `updateCardContent`.
- **Schema e sync**: sem coluna nova, sem migration, sem reemitir `sync_push`, sem mudança em `sync-rows`.
- **Código**: arquivos ≤ 100 linhas (subcomponentes e extrações listados), funções ≤ 30 linhas, ≤ 3 parâmetros (`RankInput` como objeto), constantes nomeadas (tabela de parâmetros), `function` nas funções de topo e arrow nos callbacks, sem `any`, imutabilidade nas transições de `ReinforceState`, sem comentários.
- **UI**: `@if`/`@for`, `input()`/`output()`/`signal`/`computed`, `inject()`, OnPush, `<dialog>` nativo; cores por token (a faixa do reforço usa token, sem hex), escala `text-label`/`text-meta`/`text-body`; `npm run check:type-scale` no CI.
- **Testes**: todo módulo novo de `domain/` com teste, AAA, relógio e aleatoriedade controlados, fakes do repositório, piso de 80% em `domain/`. UI validada pelos E2E manuais com `agent-browser`.

### Conformidade com skills

- `angular-developer`: `withComponentInputBinding` e `input()` para query params, `toObservable`/`toSignal` em `liveQueryFor`, content projection com slots nomeados no `session-shell`, `<dialog>` nativo no `card-edit-dialog`, serviço com escopo de componente (`providers`) para a sessão.
- `agent-browser`: execução dos roteiros E2E-12 e E2E-D1 a E2E-D7.
- `supabase`: não há o que consultar (sem migration, RLS ou RPC). Só o E2E-D5 usa o Supabase local.
- `vercel-cli`: não se aplica (sem variável de ambiente nova).

Nenhum desvio.

### Arquivos relevantes e dependentes

- Novos: `src/app/domain/{difficulty,difficulty-data,days-ago,tag-param,reinforce,review-keys}.ts` e os respectivos `.test.ts`; `src/app/state/reinforce-session.ts`; `src/app/ui/{session-shell,card-edit-dialog}/*`; `src/app/ui/mobile-nav/nav-items.ts`; `src/app/pages/difficult/{difficult,difficult-row}.{ts,html}`; `src/app/pages/reinforce/{reinforce,reinforce-summary}.{ts,html}`; `src/app/pages/home/difficult-shortcut.{ts,html}`.
- Modificados: `src/app/state/live-query.ts`; `src/app/pages/review/review.{ts,html}`; `src/app/pages/home/home.{ts,html}`; `src/app/ui/mobile-nav/mobile-nav.ts`; `src/app/app.{ts,routes.ts,config.ts}`; `eslint.config.js`; `AGENTS.md` (linha do `liveQuery` e nota sobre `withComponentInputBinding`).
- Só leitura (contrato inalterado): `src/app/domain/{db,scheduler,cards,queue,stats,tag-catalog,tag-filter,tags,dates}.ts`, `src/app/ui/{card-face,answer-bar,card-form,tag-filter,tag-chips,marked-text}/*`, `src/test/{db-helpers,fake-supabase,card-fixtures}.ts`.
- Documentos: [tasks/produto/techspec.md](../produto/techspec.md) (linhas de `difficulty.ts`, `reinforce.ts` e `pages` da Fase 2 batem com os nomes daqui; `buildReinforceQueue` virou `pickReinforceCards` + `startReinforce`).
