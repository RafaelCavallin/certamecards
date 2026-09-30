# Tarefa 4.0: domain — fila filtrada por etiquetas

## Visão geral

Refatora `buildQueue` para aceitar um filtro opcional de etiquetas (OU), aplicado **antes** dos limites de novos do baralho. Para `queue.ts` caber em 100 linhas, `isYoung`, `interleave` e `countIntroducedToday` vão para `queue-mix.ts`. Cria `tagQueueCounts` (quantos cartões cada etiqueta teria na fila de hoje, numa leitura só) e estende `homeView` com o filtro e o estado `filtered-empty`.

<skills>
### Conformidade com skills

Nenhuma skill específica: é TS puro de `domain/`.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e as rules em `.agents/rules/`. Pontos relevantes:
- A fila é a regra mais crítica da revisão diária: TU-06, TU-07 e o restante de `queue.test.ts` precisam continuar verdes **sem mudança** (é a rede de segurança da refatoração).
- `buildQueue(deck)` sem filtro se comporta exatamente como hoje.
- Relógio fixo (`vi.setSystemTime`) nos testes.
- Funções ≤ 30 linhas: `loadQueueContext` + `assembleQueue`.
- Sem `any`.
</rules>

<requirements>
- RF49: “Estudar só…” restringe a fila de hoje.
- RF49a: contagem de cartões de hoje por etiqueta; filtro OU.
- RF49b: o número, a estimativa e a sessão contam só os filtrados. Os limites de novos e do teto de não firmados são aplicados depois do filtro, e os novos estudados com filtro contam para o limite do dia.
- RF49c, RF49f: o filtro fica visível; sem cartões filtrados, mostra o estado vazio com o total sem filtro e sem sessão vazia.
</requirements>

## Subtarefas

- [ ] 4.1 Extrair `isYoung`, `interleave` e `countIntroducedToday` para `queue-mix.ts` (os testes existentes continuam passando; ajustar só os imports).
- [ ] 4.2 Refatorar `buildQueue(deck, filter?: QueueFilter)` em `loadQueueContext(deck)` + `assembleQueue(ctx, predicate)`. Aplicar `hasAnyTag` em vencidos e novos antes do `slice(room)`.
- [ ] 4.3 Criar `queue-tags.ts` com `tagQueueCounts(deck, keys)`, reusando o mesmo contexto (vencidos por etiqueta + `min(novos por etiqueta, room)`).
- [ ] 4.4 Estender `home-summary.ts`: `today.filter` (`names`, `unfilteredSize`) e o estado `filtered-empty`. `studyButtonLabel` continua coerente.
- [ ] 4.5 Escrever TU-20, TU-E11, TU-E8 e TI-E4. Rodar TU-06/TU-07 sem alteração.

## Detalhes de implementação

Ver [techspec.md](techspec.md):
- “Principais interfaces”: bloco `domain/queue.ts / queue-tags.ts`.
- “Modelos de dados”: `QueueFilter` e `HomeView`.
- “Principais decisões”: “Filtro antes do limite de novos” e “`tagQueueCounts` numa leitura só”.
- “Riscos conhecidos”: refatoração de `buildQueue`.

## Critérios de aceitação relacionados

- CA-26
- CA-E7
- CA-E8
- CA-E10
- CA-E11

## Testes da tarefa

### Testes de unidade

- [ ] TU-20 — `buildQueue` com filtro de etiquetas (OU) e limites depois do filtro
- [ ] TU-E8 — `homeView` com filtro: `today.filter` e `filtered-empty`
- [ ] TU-E11 — `tagQueueCounts` igual a `buildQueue` com uma etiqueta

### Testes de integração

- [ ] TI-E4 — fila filtrada consome o limite de novos do dia

## Arquivos relevantes

- `src/app/domain/queue.ts`
- `src/app/domain/queue.test.ts`
- `src/app/domain/queue-mix.ts` (novo)
- `src/app/domain/queue-tags.ts` + `.test.ts` (novos)
- `src/app/domain/home-summary.ts`
- `src/app/domain/home-summary.test.ts`
- `src/app/domain/tag-filter.ts` (da tarefa 3.0; se esta tarefa vier antes, `hasAnyTag` nasce aqui)
