# Tarefa 1.0: domain — regra de dificuldade

## Visão geral

Cria a regra que decide quais cartões são difíceis e como cada um é descrito. `difficulty.ts` é puro: pontuação, contagem de erros recentes, resumo do histórico de erros, corte e ordenação, filtro OU por etiqueta e opções do filtro. `difficulty-data.ts` faz a leitura no Dexie em duas fases (erros dos últimos 30 dias pelo índice `reviewedAt` → candidatos; histórico inteiro só dos candidatos pelo índice `cardId`) e expõe `listDifficult`, `countDifficult` e `liveCardIds`. `days-ago.ts` formata “hoje / ontem / há N dias” e a legenda “errou N vezes · último erro há X dias”.

<skills>
### Conformidade com skills

Nenhuma skill específica: é TS puro de `domain/`.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e as rules em `.agents/rules/`. Pontos relevantes:
- `domain/` sem `@angular/*` nem `rxjs`.
- Somente leitura: nenhuma função desta tarefa escreve no Dexie.
- Constantes nomeadas (`LAPSE_WEIGHT`, `RECENT_ERROR_WINDOW_MS`, `DIFFICULT_THRESHOLD`), `now` como parâmetro com padrão `Date.now()`.
- `rankDifficult` recebe um objeto (`RankInput`) para respeitar o limite de 3 parâmetros.
- Erros contados por `cardId`, nunca por `log.deckId`.
- Relógio controlado nos testes (`now` explícito ou `vi.setSystemTime`), AAA, um Act por teste.
</rules>

<requirements>
- RF51, RF51a: pontuação = 2 × lapsos + erros (“Errei”) nos últimos 30 dias, contados por instante e com o limite incluso.
- RF51b: cartões vivos do baralho ativo com pontuação ≥ 3.
- RF51c: ordem por pontuação desc, último erro mais recente, criação mais antiga.
- RF51d: legenda “errou N vezes · último erro há X dias”, com N = total de “Errei” no histórico (no mínimo `lapses`) e sem data quando não há log local.
- RF52a: filtro OU por etiqueta e opções com a contagem entre os difíceis.
- RF53e (suporte): `liveCardIds` para a sessão detectar exclusões.
</requirements>

## Subtarefas

- [x] 1.1 Criar `difficulty.ts`: constantes, `difficultyScore`, `countRecentErrors`, `summarizeErrorHistory`, `rankDifficult`, `filterDifficultByTags`, `difficultTagOptions` (reusa `summarizeTags` e `hasAnyTag`).
- [x] 1.2 Criar `days-ago.ts`: `formatDaysAgo` por dia de calendário local (`startOfToday`) e `difficultyCaption` (singular “1 vez”, N = `max(totalErrors, lapses)`, sem data quando `lastErrorAt` é `null`).
- [x] 1.3 Criar `difficulty-data.ts`: `listDifficult` (fase 1: `liveCards` + `reviewLogs.where('reviewedAt').aboveOrEqual(since)`; fase 2: `reviewLogs.where('cardId').anyOf(candidatos)`), `countDifficult` (só a fase 1) e `liveCardIds`.
- [x] 1.4 Escrever TU-21, TU-D1–TU-D5 e TI-D1–TI-D4.

## Detalhes de implementação

Ver [techspec.md](techspec.md):
- “Principais interfaces”: blocos `domain/difficulty.ts`, `domain/difficulty-data.ts` e `domain/days-ago.ts`.
- “Modelos de dados”: `DifficultCard` (com a degradação “histórico ainda não sincronizado”), `RankInput` e `ErrorHistory`, “Parâmetros fixos”.
- “Principais decisões”: “Duas fases de leitura” e “Erros por `cardId`”.

## Critérios de aceitação relacionados

- CA-28
- CA-D1
- CA-D2
- CA-D3
- CA-D4
- CA-D5
- CA-D7
- CA-D18
- CA-D19

## Testes da tarefa

### Testes de unidade

- [x] TU-21 — `difficultyScore` e corte em 3 por `rankDifficult`
- [x] TU-D1 — `countRecentErrors` nos limites da janela
- [x] TU-D2 — `rankDifficult`: ordem e desempates
- [x] TU-D3 — `summarizeErrorHistory`: total e último erro
- [x] TU-D4 — `formatDaysAgo` e `difficultyCaption`
- [x] TU-D5 — `filterDifficultByTags` (OU) e `difficultTagOptions`

### Testes de integração

- [x] TI-D1 — `listDifficult` no Dexie real
- [x] TI-D2 — terceiro erro pela revisão normal faz o cartão aparecer
- [x] TI-D3 — `countDifficult` igual a `listDifficult(...).length`
- [x] TI-D4 — logs vindos do pull entram na pontuação

## Arquivos relevantes

- `src/app/domain/difficulty.ts` + `.test.ts` (novos)
- `src/app/domain/difficulty-data.ts` + `.test.ts` (novos)
- `src/app/domain/days-ago.ts` + `.test.ts` (novos)
- `src/app/domain/db.ts`, `cards.ts` (`liveCards`), `dates.ts` (`DAY`, `startOfToday`), `tag-catalog.ts` (`summarizeTags`), `tag-filter.ts` (`hasAnyTag`), `scheduler.ts` (usado no TI-D2), `sync-pull.ts` (usado no TI-D4) — só leitura
- `src/test/db-helpers.ts`, `src/test/card-fixtures.ts`, `src/test/fake-supabase.ts`
