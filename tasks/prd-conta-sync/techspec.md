# Especificação técnica — Conta e sincronização

> PRD: [prd.md](prd.md). TechSpec-base: [tasks/produto/techspec.md](../produto/techspec.md) — modelos de dados, mapeamento Dexie → Postgres, DDL, RLS, contratos de endpoint e decisões estão lá; este documento recorta o que entra nesta entrega e não repete detalhes. IDs de teste (TU, TI, E2E) preservados da base. Referência de implementação: repositório **lingo**, branch `des` (commit `41d116b`).

## Resumo

Segunda entrega da Fase 1, sobre o MVP offline já no preview. Cria a migration inicial do Supabase (já com `cards.tags` e `user_settings`, para a RPC não ser reemitida na Fase 2), porta do Lingo `lww`, `sync*`, `sync-rows`, `auth` e `supabase` com os testes, e liga tudo à UI por `auth-store`, `sync-store`, a página `account` e a seção de conta em Ajustes. Termina com a Fase 1 em produção.

## Arquitetura do sistema

### Visão dos componentes

| Camada | Módulos | Origem na base |
| --- | --- | --- |
| `supabase/` | `migrations/20261001000000_schema.sql`, `config.toml` (portas 55321–55327) | “Esquema do banco (DDL)” e “Trigger, RLS e grants” |
| `domain/` | `lww`, `sync`, `sync-pull`, `sync-push`, `sync-rows`, `auth`, `supabase` | Tabela “Camada `domain/`” |
| `state/` | `auth-store`, `sync-store` | Tabela “Camada `state/`” |
| `pages/` | `account` (rota `conta`); seção de conta em `settings` | Tabela “Camada `pages/`” |
| `src/test/` | `fake-supabase.ts` | Portado do Lingo |

Nada do MVP offline muda de contrato. `sync-store` registra os gatilhos (boot, `online`, `NavigationEnd` para `/`, login concluído) sem que `pages/` saibam da rede.

## Design de implementação

### Principais interfaces

`syncNow(reason: SyncReason): Promise<SyncOutcome>` e `SyncReason`, como na base; `auth-store` com `session`, `phase`, `pendingDecision`, `signIn`, `signUp`, `signOut`, `resolveDecision(plan)`; `sync-store` com `status`, `lastSyncAt`, `syncNow(reason)`.

### Modelos de dados

`SyncState` e `UserSettings` como na base, sobre as tabelas Dexie `syncState` e `settings` que o MVP offline já criou na `version(1)`. Mapeamento local → remoto: tabela “Mapeamento local (Dexie) → remoto (Postgres)” da base. Degradação no pull: linha inválida no Zod é descartada individualmente.

### Esquema do banco

A migration `20261001000000_schema.sql` contém exatamente a DDL, os índices, o trigger `touch_synced_at`, a RLS, os grants e a RPC `sync_push(p_decks, p_cards, p_logs, p_settings)` descritos na base. Os `check` de tamanho espelham `domain/card-limits.ts`, já existente.

### Endpoints da API

Da tabela “Visão geral” da base, só: `GET /rest/v1/{decks|cards|review_logs|user_settings}` (pull por keyset), `POST /rest/v1/rpc/sync_push`, `HEAD` de contagem para a decisão de login e `/auth/v1/*`. Contratos em “`GET /rest/v1/cards`” e “`POST /rest/v1/rpc/sync_push`” da base.

## Pontos de integração

- **Supabase Auth** e **PostgREST/RPC** — como na base (confirmação por email; Inbucket em `localhost:55324` no local; erro de rede → `offline` silencioso).
- **Vercel** — `NG_APP_SUPABASE_URL` e `NG_APP_SUPABASE_PUBLISHABLE_KEY` por escopo: Development/Preview → `certamecards-dev`; Production → `certamecards-prod`. O agente prepara o comando do escopo Production e entrega ao Rafael.
- **Projetos Supabase** — criados fora da integração Vercel Marketplace.

## Abordagem de testes

Mesmo runner da base; `fake-supabase.ts` e fake de Web Locks, sem rede.

### Testes de unidade

| ID | Caso | Critérios |
| --- | --- | --- |
| TU-12 | `wins` LWW com empate de `updatedAt` | CA-18 |
| TU-13 | `parseCardRow` com `marks` inválido e com chaves ausentes | CA-18 |
| TU-14 | `toCardRow` / `parseCardRow` ida e volta | CA-18 |
| TU-16 | `decideOnSignIn` — matriz resume/auto-adopt/prompt/switch | CA-19, CA-20 |

### Testes de integração

| ID | Caso | Critérios |
| --- | --- | --- |
| TI-05 | push: cards antes de logs em chunks de 200 | CA-18 |
| TI-06 | push: CAS mantém `dirty` quando `updatedAt` mudou em trânsito | CA-18 |
| TI-07 | pull: keyset com overlap é idempotente | CA-18 |
| TI-08 | `completeSignIn` discard/merge/cancel e troca de conta | CA-19, CA-20 |
| TI-09 | `syncNow` sem config / sem sessão / offline | CA-17, CA-S1 |

Resultados esperados: tabelas da base.

### Banco

Depois de `npx supabase db reset`, repetir no Supabase local as verificações listadas em “Esquema do banco (DDL)” da base que se aplicam a esta migration: LWW em cards e configurações, log duplicado ignorado, `DELETE`/`UPDATE` em logs negados, `marks` não-objeto e 21 etiquetas rejeitados, isolamento entre usuários, `anon` sem `EXECUTE` na RPC.

### Testes E2E

Roteiros com `agent-browser` contra `ng serve` e Supabase local.

| ID | Caso | Critérios |
| --- | --- | --- |
| E2E-08 | Dois perfis de navegador na mesma conta | CA-18 |
| E2E-09 | Login com dados dos dois lados | CA-19, CA-20 |
| E2E-07 | Regressão: offline com Supabase configurado e sem conta | CA-17 |
| E2E-S1 | Build sem variáveis: abrir Conta e Ajustes | CA-S1 |

Antes da promoção, repetir no preview da `des` (projeto `certamecards-dev`) o roteiro E2E completo das duas entregas da Fase 1.

## Sequenciamento do desenvolvimento

### Ordem de construção

Etapas 7 e 8 da base:

1. **Migration** no Supabase local e verificações do banco.
2. **Domínio** — `supabase`, `lww`, `sync-rows`, `sync-pull`, `sync-push`, `sync`, `auth`, com TU e TI desta entrega.
3. **Estado e UI** — `auth-store`, `sync-store`, `account`, seção de conta em Ajustes, status de sincronização.
4. **Dev hospedado** — migration no `certamecards-dev` por `--db-url`, variáveis de Preview/Development na Vercel, roteiro E2E completo no preview.
5. **Produção** — somente com pedido explícito do Rafael: migration manual no `certamecards-prod`, variáveis do escopo Production, merge da `des` na `prod`.

### Dependências técnicas

Docker para o Supabase local; projetos `certamecards-dev` e `certamecards-prod` criados; Supabase CLI.

## Monitoramento e observabilidade

Como na base: status de sync visível, `console.warn` para linha descartada no pull e chunk rejeitado no push (id, tabela, código Postgres, nunca conteúdo), logs de API/Postgres no dashboard do Supabase.

## Considerações técnicas

### Principais decisões

Da base: `marks` em jsonb único; colunas reservadas (`request_retention`, `fsrs_params`, `params_optimized_at`); Fase 2 no schema desde o início (`tags`, `user_settings`, `p_settings`); portas locais +1000; SDK por import dinâmico.

### Riscos conhecidos

Da base: limites de texto divergentes entre cliente e banco travariam o push; evicção do IndexedDB no iOS (a conta passa a ser a mitigação principal). Mais: credencial de produção injetada no escopo errado da Vercel — mitigado pelos projetos fora da integração Marketplace e por nunca rodar `vercel env pull` sem argumento.

### Conformidade com o AGENTS.md e as rules

Como na base, mais a seção “Isolamento entre desenvolvimento e produção” e “O que nenhum agente faz sozinho” do `AGENTS.md`.

### Conformidade com skills

`supabase` para migration, RLS e RPC; `angular-developer` em `src/app/`; `vercel-cli` para variáveis e deploy; `agent-browser` nos roteiros E2E.

### Arquivos relevantes e dependentes

Do Lingo (`des`): `src/services/lww.ts`, `sync.ts`, `syncRows.ts`, `auth.ts`, `supabase.ts` (+ testes), `src/test/fakeSupabase.ts`, `src/screens/Account.tsx`, `supabase/migrations/*.sql` (consolidadas em `20261001000000_schema.sql`).
