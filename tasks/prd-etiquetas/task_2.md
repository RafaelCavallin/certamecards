# Tarefa 2.0: domain — etiquetas na escrita do cartão e no pull

## Visão geral

Leva `tags` ao conteúdo editável do cartão (`CardContent`). `createCard` e `updateCardContent` passam a gravar as etiquetas normalizadas, e `updateCardContent` devolve o conteúdo normalizado para a revisão atualizar o cartão atual. No pull, `parseCardRow` aplica `normalizeTags`. Com isso, a integridade das etiquetas fica garantida no Dexie antes de existir qualquer UI.

<skills>
### Conformidade com skills

`supabase`: só para confirmar que o contrato de `cards.tags` no PostgREST e na `sync_push` não muda (sem migration nem RPC).
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e as rules em `.agents/rules/`. Pontos relevantes:
- Campos FSRS só são escritos pelo `scheduler`: editar etiquetas não reagenda nem gera log (RF5, RF47c).
- Sem coluna nova, então `sync_push` não é reemitida. `sync-rows` só ganha a normalização no parse, e linhas do pull continuam com `dirty: 0`.
- Prioridade máxima de teste (integridade de dados e sync), conforme a regra 3 de `tests.md`.
- Chamadores (`card-edit`, `review`) são ajustados só no tipo nesta tarefa. A UI de etiquetas é da tarefa 5.0.
</rules>

<requirements>
- RF47b: a normalização vale também na sincronização (pull).
- RF47c: adicionar ou remover etiquetas não reagenda e não gera revisão.
- RF46: o limite de 20/40 é respeitado em toda escrita.
</requirements>

## Subtarefas

- [x] 2.1 Adicionar `tags: string[]` a `CardContent`. `createCard` grava `normalizeTags(input.tags)` em vez de `[]`.
- [x] 2.2 `updateCardContent` grava `tags` normalizadas e devolve `Promise<CardContent>` com o conteúdo como ficou gravado.
- [x] 2.3 Ajustar os chamadores ao novo tipo: `initial`/`editInitial` em `card-edit.ts` e `review.ts` passam `tags: card.tags`. `review.saveEdit` usa o retorno de `updateCardContent` em `replaceCurrent`.
- [x] 2.4 `parseCardRow` em `sync-rows-card.ts` aplica `normalizeTags(data.tags ?? [])`.
- [x] 2.5 Escrever TI-E1 e TU-E10, e a parte de pull do TI-E5 (linha com `["Cespe","CESPE"]` gravada como `["Cespe"]`, `dirty: 0`).

## Detalhes de implementação

Ver [techspec.md](techspec.md): “Modelos de dados” (`CardContent`, “Mapeamento remoto → local”), o parágrafo “Sync, LWW e CAS” e “Regras dos contratos”.

## Critérios de aceitação relacionados

- CA-E3
- CA-E5
- CA-E14

## Testes da tarefa

### Testes de unidade

- [x] TU-E10 — `parseCardRow` normaliza `tags`

### Testes de integração

- [x] TI-E1 — `createCard` + `updateCardContent` com etiquetas no Dexie real
- [x] TI-E5 (parte do pull) — etiquetas no pull com `fake-supabase`

## Arquivos relevantes

- `src/app/domain/cards.ts`
- `src/app/domain/cards.test.ts`
- `src/app/domain/sync-rows-card.ts`
- `src/app/domain/sync-rows.test.ts`
- `src/app/domain/sync-pull.test.ts`
- `src/app/pages/card-edit/card-edit.ts`
- `src/app/pages/review/review.ts`
- `src/test/fake-supabase.ts` (leitura)
