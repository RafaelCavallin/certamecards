# Tarefa 4.0: domain — `sync-pull.ts`, `sync-push.ts` e `sync.ts`

## Visão geral

Porta `src/services/sync.ts` do Lingo, dividido por responsabilidade (regra de 100 linhas): `sync-pull.ts` (busca paginada por keyset em `synced_at`, overlap de 5 s), `sync-push.ts` (envio em chunks de 200, cards antes de logs pela FK, `clearDirty` com CAS em `updatedAt`) e `sync.ts` (orquestra pull → merge LWW → push, `navigator.locks` com chave `certamecards-sync`, expõe `syncNow(reason)`). Depende das Tarefas 2.0 (`supabase.ts`) e 3.0 (`lww.ts`, `sync-rows.ts`).

<skills>
### Conformidade com skills

`supabase` — paginação PostgREST, RPC `sync_push`, tratamento de erros de rede/sessão.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Lido o `AGENTS.md` e as rules em `.agents/rules/`. `domain/` é TS puro. Regra de 100 linhas por arquivo já motiva a divisão em três módulos (`code-standards.md`, item 2, cita exatamente `sync.ts`/`syncPull.ts`/`syncPush.ts` como exemplo). Guardas para os casos sem config/sem sessão/offline (`javascript-typescript.md`/`code-standards.md`, item 4). Campos FSRS só são escritos pelo `scheduler` — o pull/push nunca reagenda, só transporta o que já está no Dexie.
</rules>

<requirements>
- RF37, RF38 (sincronização por linha, sem duplicar logs).
- CA-17 (regressão): com Supabase configurado mas sem conta/sem rede, o app segue funcionando sem erro.
- CA-S1: sem config, `syncNow` nunca chama o Supabase.
</requirements>

## Subtarefas

- [ ] 4.1 Criar `src/app/domain/sync-pull.ts`: busca por `synced_at gt <cursor - 5s>`, `limit 500`, avança o cursor só na mesma transação Dexie que aplica a página, aplica LWW linha a linha.
- [ ] 4.2 Criar `src/app/domain/sync-push.ts`: monta os chunks (`p_settings`/`p_decks` no primeiro, `p_cards` em lotes de 200, `p_logs` só depois de todos os chunks de cards confirmados), chama `sync_push`, limpa `dirty` por CAS.
- [ ] 4.3 Criar `src/app/domain/sync.ts`: `syncNow(reason: SyncReason)` orquestra pull → push sob `navigator.locks.request('certamecards-sync', …)`; retorna `SyncOutcome` (`disabled`/`signed-out`/`offline`/`ok`/erro), nunca lança exceção.
- [ ] 4.4 Escrever TI-05, TI-06, TI-07, TI-09 com `fake-supabase.ts` e `fake-indexeddb`.

## Detalhes de implementação

Ver TechSpec-base, "Camada `domain/`" (`sync.ts`, `sync-pull.ts`, `sync-push.ts`), "Fluxo de dados", endpoints `GET /rest/v1/cards` e `POST /rest/v1/rpc/sync_push` (paginação, chunking, `SyncOutcome`), "Riscos conhecidos" (evicção do IndexedDB não é tratada aqui, mas o cursor por transação é). Ver TechSpec da entrega, "Principais interfaces" (`syncNow`, `SyncReason`) e "Endpoints da API".

## Critérios de aceitação relacionados

- CA-17
- CA-18
- CA-S1

## Testes da tarefa

### Testes de integração

- [ ] TI-05 — push: cards antes de logs em chunks de 200
- [ ] TI-06 — push: CAS mantém `dirty` quando `updatedAt` mudou em trânsito
- [ ] TI-07 — pull: keyset com overlap é idempotente
- [ ] TI-09 — `syncNow` sem config / sem sessão / offline

## Arquivos relevantes

- `src/app/domain/sync.ts` (novo)
- `src/app/domain/sync-pull.ts` (novo)
- `src/app/domain/sync-push.ts` (novo)
- `src/app/domain/sync.test.ts`, `sync-pull.test.ts`, `sync-push.test.ts` (novos)
- `src/test/fake-supabase.ts` (novo, portado do Lingo)
