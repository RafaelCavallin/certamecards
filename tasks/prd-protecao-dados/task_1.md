# Tarefa 1.0: domain — detecção da perda

## Visão geral

Cria a base da detecção, toda em TS puro. `store-marker.ts` lê e grava os marcadores `certamecards.storeCreatedAt` e `certamecards.storeLostAt` num `KeyValueStorage`. `db.ts` registra `db.on('populate')` para chamar `recordStoreCreated` quando o banco é criado. `storage-loss.ts` garante o marcador em instalações antigas (`initStoreMarker`) e observa o fechamento da conexão (`watchConnectionClosed`), bloqueando a reabertura automática do Dexie.

<skills>
### Conformidade com skills

Nenhuma skill específica: é TS puro de `domain/`.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e as rules em `.agents/rules/`. Pontos relevantes:
- `domain/` sem `@angular/*` nem `rxjs`.
- `store-marker.ts` não importa `db`, para não criar ciclo com `db.ts`.
- Todo acesso ao `localStorage` em `try/catch`; chaves como constantes nomeadas.
- Arquivos ≤ 100 linhas, funções ≤ 30, sem comentários; `console.warn` só nos dois eventos previstos na TechSpec.
- Testes que fecham ou apagam o banco o reabrem no `afterEach`.
</rules>

<requirements>
- RF80a, RF80c, RF80d: o banco recriado com marcador presente gera perda pendente; dispensar limpa; primeiro uso, limpeza total e instalação antiga não geram perda.
- RF79c, RF80e: depois de um `close`, o banco não reabre sozinho e a perda é registrada se o banco for recriado.
</requirements>

## Subtarefas

- [x] 1.1 Criar `src/app/domain/store-marker.ts` (`recordStoreCreated`, `ensureStoreMarker`, `pendingStoreLoss`, `dismissStoreLoss`).
- [x] 1.2 Registrar `db.on('populate', …)` em `src/app/domain/db.ts`, chamando `recordStoreCreated(browserStorage(), Date.now())`.
- [x] 1.3 Criar `src/app/domain/storage-loss.ts` (`initStoreMarker`, `watchConnectionClosed` com fechamento definitivo em microtarefa e chamada única).
- [x] 1.4 Escrever TU-P01–P05, TU-P07 e TI-P01–P03.

## Detalhes de implementação

Ver [techspec.md](techspec.md): “Resumo”, linhas `store-marker.ts`, `db.ts` e `storage-loss.ts` da “Visão dos componentes”, “Principais interfaces”, “Marcadores no `localStorage`” e “Principais decisões”.

## Critérios de aceitação relacionados

- CA-44
- CA-45
- CA-P02

## Testes da tarefa

### Testes de unidade

- [x] TU-P01 — `recordStoreCreated` sem marcador
- [x] TU-P02 — `recordStoreCreated` com marcador
- [x] TU-P03 — `ensureStoreMarker` não sobrescreve
- [x] TU-P04 — `dismissStoreLoss`
- [x] TU-P05 — Storage indisponível
- [x] TU-P07 — `pendingStoreLoss` com valor inválido

### Testes de integração

- [x] TI-P01 — Banco recriado com marcador
- [x] TI-P02 — `initStoreMarker` num banco existente
- [x] TI-P03 — `watchConnectionClosed`

## Arquivos relevantes

- `src/app/domain/store-marker.ts`, `store-marker.test.ts` (novos)
- `src/app/domain/storage-loss.ts`, `storage-loss.test.ts` (novos)
- `src/app/domain/db.ts`
- `src/app/domain/local-storage.ts`
- `src/test/db-helpers.ts`, `src/test/setup.ts`
