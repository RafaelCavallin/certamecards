# Resumo das tarefas de implementação de Conta e sincronização

## Tarefas

- [x] 1.0 Validar a migration existente no Supabase local
- [x] 2.0 domain: `supabase.ts` — cliente Supabase por import dinâmico
- [x] 3.0 domain: `lww.ts` e `sync-rows.ts` — LWW e parse/serialize das linhas
- [x] 4.0 domain: `sync-pull.ts`, `sync-push.ts` e `sync.ts` — orquestração do ciclo de sincronização
- [x] 5.0 domain: `auth.ts` — decisão e conclusão de login
- [x] 6.0 state: `auth-store.ts` e `sync-store.ts` — ponte Angular para autenticação e sincronização
- [x] 7.0 pages: `account` (rota `conta`) — entrar, cadastrar e decidir sobre dados locais
- [x] 8.0 pages: seção de conta em `settings` — entrar/sair, status e "Sincronizar agora"
- [x] 9.0 Validação E2E local (E2E-07, E2E-08, E2E-09, E2E-S1)
- [x] 10.0 Preview sem backend remoto e E2E offline
