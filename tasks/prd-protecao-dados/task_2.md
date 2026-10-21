# Tarefa 2.0: domain — persistência, estado da edição e resposta a cartão inexistente

## Visão geral

Três regras de domínio que a UI das tarefas seguintes consome. `storage-persistence.ts` traduz a API de armazenamento persistente em três estados. `loadCardDraftState` em `card-draft.ts` distingue cartão pronto, inexistente e falha de leitura. O `scheduler` deixa de gravar revisão para um cartão que não existe mais.

<skills>
### Conformidade com skills

Nenhuma skill específica: é TS puro de `domain/`.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e as rules em `.agents/rules/`. Pontos relevantes:
- Campos FSRS continuam escritos só pelo `scheduler`; a mudança só recusa o cartão inexistente, dentro da mesma transação.
- União de strings para `PersistenceState` e `DraftLoadState`; `PersistenceManager` injetável para teste, sem `any`.
- Bug corrigido entra com teste que falha antes da correção (TI-P04).
</rules>

<requirements>
- RF81a, RF81d: estado de leitura explícito para a edição; responder cartão inexistente lança e não grava log.
- RF82a, RF82b, RF82c: estados `persisted`, `best-effort` e `unsupported`, com toda falha virando `best-effort`.
</requirements>

## Subtarefas

- [x] 2.1 Criar `src/app/domain/storage-persistence.ts` (`browserPersistenceManager`, `readPersistence`, `requestPersistence`).
- [x] 2.2 Acrescentar `DraftLoadState` e `loadCardDraftState` em `src/app/domain/card-draft.ts`.
- [x] 2.3 Em `src/app/domain/scheduler.ts`, lançar `Error('Cartão não encontrado.')` quando `db.cards.update` devolver `0`.
- [x] 2.4 Escrever TU-P06 e TI-P04–P06.

## Detalhes de implementação

Ver [techspec.md](techspec.md): linhas `storage-persistence.ts`, `card-draft.ts` e `scheduler.ts` da “Visão dos componentes”, “Principais interfaces”, “`PersistenceState` e `PersistenceManager`” e “`DraftLoadState`”.

## Critérios de aceitação relacionados

- CA-46
- CA-P04
- CA-P05
- CA-P06

## Testes da tarefa

### Testes de unidade

- [x] TU-P06 — `readPersistence` e `requestPersistence`

### Testes de integração

- [x] TI-P04 — `answer` em cartão inexistente
- [x] TI-P05 — `answer` em cartão existente
- [x] TI-P06 — `loadCardDraftState`

## Arquivos relevantes

- `src/app/domain/storage-persistence.ts`, `storage-persistence.test.ts` (novos)
- `src/app/domain/card-draft.ts`, `card-draft.test.ts`
- `src/app/domain/scheduler.ts`, `scheduler.test.ts`
