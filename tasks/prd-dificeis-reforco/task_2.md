# Tarefa 2.0: domain — sessão de reforço pura

## Visão geral

Cria a regra da sessão de reforço como uma máquina de estados pura, sem I/O: sorteio dos 30 mais difíceis (`pickReinforceCards`, com `random` injetável), “Errei volta para o fim até acertar” (`answerReinforce`), poda de cartões excluídos (`dropMissing`), progresso e placar pela primeira resposta. Cria também o parâmetro de URL das etiquetas (`tag-param.ts`) e extrai o mapeamento de teclas da revisão para uma função testável (`review-keys.ts`). O TI-11 prova que uma sessão completa não altera nada no banco.

<skills>
### Conformidade com skills

Nenhuma skill específica: é TS puro de `domain/`.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e as rules em `.agents/rules/`. Pontos relevantes:
- Regra de domínio inegociável: a sessão de reforço não escreve nada (agenda, log, estatística). `reinforce.ts` não importa `scheduler`, `db` (exceto tipos) nem módulos de escrita. A trava de lint entra na tarefa 5.0, e esta tarefa já nasce respeitando-a.
- Transições imutáveis: `answerReinforce` e `dropMissing` devolvem um estado novo (regra 8 de `javascript-typescript.md`).
- Aleatoriedade controlada nos testes por gerador determinístico, nunca `Math.random` (regra 9 de `tests.md`).
- `REINFORCE_LIMIT` e `TAG_PARAM` como constantes nomeadas.
</rules>

<requirements>
- RF52e: até 30 cartões de maior pontuação do resultado filtrado, em ordem embaralhada a cada sessão.
- RF52g, RF52h: “Errei” volta para o fim até ser acertado; progresso = acertados / cartões distintos.
- RF53, RF53b: nada é gravado (agenda, histórico, estatística, sync).
- RF53e: cartão excluído antes de aparecer é pulado e sai do total.
- RF54a, RF54b, RF54d: placar pela primeira resposta; errados na ordem do primeiro erro com a contagem; sem lista quando todos acertaram de primeira.
- RF52c (suporte): filtro serializável em `?etiquetas=`.
- RF52f, RF27 (suporte): Espaço/1/2 iguais na revisão e no reforço.
</requirements>

## Subtarefas

- [x] 2.1 Criar `reinforce.ts`: `REINFORCE_LIMIT`, `pickReinforceCards` (top 30 + Fisher–Yates), `startReinforce`, `answerReinforce`, `dropMissing`, `reinforceProgress`, `summarizeReinforce`.
- [x] 2.2 Criar `tag-param.ts`: `parseTagParam` (aplica `tagKey`, descarta vazios e duplicatas, nunca lança) e `serializeTagParam` (`[]` → `null`).
- [x] 2.3 Criar `review-keys.ts` com `reviewKeyAction` (tabela `ReviewKeyAction`). A troca em `review.ts` fica na tarefa 3.0.
- [x] 2.4 Escrever TU-D6–TU-D11, TI-11 e TI-D5.

## Detalhes de implementação

Ver [techspec.md](techspec.md):
- “Principais interfaces”: blocos `domain/reinforce.ts`, `domain/review-keys.ts` e `domain/tag-param.ts`, e as “Regras dos contratos”.
- “Modelos de dados”: `ReinforceState` (com a variante “Sessão vazia”), `ReinforceSummary`, `ReviewKeyAction` e “Contrato de rota — `?etiquetas=`”.
- “Principais decisões”: “Sessão como máquina de estados pura” e “Somente leitura garantido duas vezes”.

## Critérios de aceitação relacionados

- CA-29
- CA-D6
- CA-D8
- CA-D9
- CA-D10
- CA-D11
- CA-D12
- CA-D15

## Testes da tarefa

### Testes de unidade

- [x] TU-D6 — `parseTagParam` / `serializeTagParam`
- [x] TU-D7 — `pickReinforceCards`: top 30 e embaralhamento
- [x] TU-D8 — `answerReinforce`: “Errei” volta para o fim até acertar
- [x] TU-D9 — `summarizeReinforce`
- [x] TU-D10 — `dropMissing`
- [x] TU-D11 — `reviewKeyAction`

### Testes de integração

- [x] TI-11 — sessão de reforço completa não grava nada
- [x] TI-D5 — `liveCardIds` reflete a exclusão

## Arquivos relevantes

- `src/app/domain/reinforce.ts` + `.test.ts` (novos)
- `src/app/domain/tag-param.ts` + `.test.ts` (novos)
- `src/app/domain/review-keys.ts` + `.test.ts` (novos)
- `src/app/domain/difficulty-data.ts` (da tarefa 1.0: `listDifficult`, `liveCardIds`)
- `src/app/domain/scheduler.ts` (só o tipo `BinaryRating`), `tags.ts` (`tagKey`), `queue.ts` e `stats.ts` (retrato no TI-11), `cards.ts` (`deleteCards` no TI-D5)
- `src/test/db-helpers.ts`, `src/test/card-fixtures.ts`
