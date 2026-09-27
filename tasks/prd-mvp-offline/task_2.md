# Tarefa 2.0: Domínio — persistência

## Visão geral

Portar do Lingo o banco Dexie, os hooks de `dirty` e as operações de baralho e cartão, já no formato final da Fase 1 (com `settings` e `syncState`), junto com a infraestrutura de teste do domínio.

<skills>
### Conformidade com skills

Nenhuma skill de UI ou backend: TypeScript puro em `src/app/domain/`. Consultar o Lingo (`des`, commit `41d116b`).
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Lidos o `AGENTS.md` e todas as rules em `.agents/rules/`.

- `domain/` nunca importa `@angular/*`, `rxjs` nem `state/`/`pages/`/`ui/`.
- Arquivos ≤ 100 linhas, funções ≤ 30, ≤ 3 parâmetros; sem comentários; constantes nomeadas.
- Campos FSRS só são escritos pelo `scheduler`: `updateCardContent` nunca os toca.
- Limites de texto vêm de `card-limits.ts`, espelhando os `check` do banco.
- `deletedAt` é `0` para vivo, nunca `undefined`.
- Testes AAA, independentes, com `fake-indexeddb` limpo a cada teste.
</rules>

<requirements>
- Dexie `certamecards` `version(1)` exatamente como no esquema da base, incluindo `settings` e `syncState` (sem uso ainda).
- RF1, RF2: Frente e Verso obrigatórios até 5.000; Notas até 20.000; quebras de linha preservadas.
- RF5: editar texto não reagenda nem gera log.
- RF14: baralho padrão “Meus cartões” criado uma única vez, mesmo com chamadas concorrentes.
- RF16: excluir baralho tombstona os cartões dele.
- RF17: depois de excluir o último baralho, nada é recriado sozinho.
- RF18: baralho com `newCardsPerDay` 20 e `youngLimit` 50 por padrão, editáveis.
</requirements>

## Subtarefas

- [x] 2.1 `src/test/setup.ts` (fake-indexeddb, Web Locks) e `src/test/db-helpers.ts`
- [x] 2.2 `db.ts` com os tipos `Deck`, `Card`, `ReviewLog`, `SyncState`, `UserSettings` — `CardMarks` ganhou um stub de tipos em `text-marks.ts` (só a forma dos dados: `Range`, `Marks`, `CardField`, `CardMarks`, `EMPTY_CARD_MARKS`), já que a lógica de marcas (`normalizeCardMarks` etc.) é da tarefa 3.0
- [x] 2.3 `dirty-tracking.ts` (hooks `creating`/`updating`)
- [x] 2.4 `card-limits.ts` e `validateCardContent`
- [x] 2.5 `decks.ts`: `ensureDefaultDeck`, `createDeck`, `renameDeck`, `updateDeckRhythm`, `deleteDeck`
- [x] 2.6 `cards.ts`: `createCard`, `updateCardContent`, `deleteCards`, `liveCards`

## Detalhes de implementação

Ver `techspec.md` → “Modelos de dados” e “Principais interfaces”; na base, “Esquema Dexie”, “`Deck`”, “`Card`”, “`ReviewLog`” e a “Regra de consistência” dos limites. `createCard` deve aplicar `normalizeCardMarks` quando a tarefa 3.0 estiver pronta; até lá, receber `CardMarks` já normalizado.

## Critérios de aceitação relacionados

- CA-01
- CA-03
- CA-09

## Testes da tarefa

### Testes de unidade

- [x] TU-15 — `validateCardContent` nos limites 5000/5000/20000

### Testes de integração

- [x] TI-01 — `createCard` + `updateCardContent` no Dexie real
- [x] TI-03 — `ensureDefaultDeck` concorrente e após excluir o último

## Arquivos relevantes

- `src/app/domain/db.ts`, `dirty-tracking.ts`, `card-limits.ts`, `decks.ts`, `cards.ts` (+ `.test.ts`)
- `src/test/setup.ts`, `src/test/db-helpers.ts`
- Lingo: `src/services/db.ts`, `src/test/setup.ts`, `src/test/dbHelpers.ts`
