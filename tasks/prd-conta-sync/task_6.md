# Tarefa 6.0: state — `auth-store.ts` e `sync-store.ts`

## Visão geral

Serviços Angular (`@Service`, signals) que expõem o domínio de auth/sync às páginas, substituindo `AuthContext`/gatilhos manuais do Lingo. `auth-store` expõe `session`, `phase` (`restoring`/`signed-out`/`signed-in`), `pendingDecision`, `signIn`, `signUp`, `signOut`, `resolveDecision(plan)`. `sync-store` expõe `status`, `lastSyncAt`, `syncNow(reason)` e registra os próprios gatilhos (boot, evento `online`, `NavigationEnd` para `/`, login concluído) sem que `pages/` conheçam a rede. Depende das Tarefas 4.0 (`sync.ts`) e 5.0 (`auth.ts`).

<skills>
### Conformidade com skills

`angular-developer` — `@Service`, signals, `inject()`, eventos do `Router`.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Lido o `AGENTS.md` e as rules em `.agents/rules/`. `state/` existe para estado compartilhado entre páginas (regra de dependência do AGENTS.md) — aqui, sessão e status de sync são exatamente esse caso. RxJS só nas bordas: eventos do `Router` no `sync-store` são a exceção documentada. `pages/`/`ui/` nunca chamam o Supabase diretamente — sempre por `auth-store`/`sync-store` ou por `domain/` puro. Este código de UI fica fora do gate de cobertura de 80% (`.agents/rules/tests.md`, item 2): é validado pelos roteiros E2E da Tarefa 9.0.
</rules>

<requirements>
- RF41: sem config, `phase`/`status` refletem "sincronização não disponível", sem chamar o Supabase.
- Techspec da entrega, "Principais interfaces" (`auth-store`, `sync-store`).
</requirements>

## Subtarefas

- [ ] 6.1 Criar `src/app/state/auth-store.ts`: `session` e `phase` a partir da sessão do Supabase (restaurada no boot), `signIn`/`signUp`/`signOut` delegando para `domain/auth.ts` e `domain/supabase.ts`, `pendingDecision`/`resolveDecision` ligados a `decideOnSignIn`/`completeSignIn`.
- [ ] 6.2 Criar `src/app/state/sync-store.ts`: `status` (`disabled`/`offline`/`syncing`/`synced`/`error`), `lastSyncAt` (persistido em `localStorage.certamecards.lastSync`), `syncNow(reason)` delegando para `domain/sync.ts`.
- [ ] 6.3 Registrar os gatilhos de sync no próprio `sync-store` (boot, `window:online`, `Router.events` filtrando `NavigationEnd` para `/`, término de `signIn`/`resolveDecision`), com `DestroyRef` para cancelar assinaturas.

## Detalhes de implementação

Ver TechSpec da entrega, "Visão dos componentes" (linha `state/`) e "Principais interfaces". Ver TechSpec-base, "Camada `state/`" (`auth-store.ts`, `sync-store.ts`) e "Fluxo de dados".

## Critérios de aceitação relacionados

- CA-17
- CA-19
- CA-20
- CA-S1

## Testes da tarefa

Camada `state/` fora do gate de cobertura — validada pelos roteiros E2E da Tarefa 9.0 (E2E-07, E2E-08, E2E-09, E2E-S1). Testes de componente com `ng test` são bem-vindos, mas não obrigatórios.

## Arquivos relevantes

- `src/app/state/auth-store.ts` (novo)
- `src/app/state/sync-store.ts` (novo)
