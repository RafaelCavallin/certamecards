# Resumo das tarefas de implementação de Conta e sincronização

## Tarefas

- [ ] 1.0 Validar a migration existente no Supabase local
- [ ] 2.0 domain: `supabase.ts` — cliente Supabase por import dinâmico
- [ ] 3.0 domain: `lww.ts` e `sync-rows.ts` — LWW e parse/serialize das linhas
- [ ] 4.0 domain: `sync-pull.ts`, `sync-push.ts` e `sync.ts` — orquestração do ciclo de sincronização
- [ ] 5.0 domain: `auth.ts` — decisão e conclusão de login
- [ ] 6.0 state: `auth-store.ts` e `sync-store.ts` — ponte Angular para autenticação e sincronização
- [ ] 7.0 pages: `account` (rota `conta`) — entrar, cadastrar e decidir sobre dados locais
- [ ] 8.0 pages: seção de conta em `settings` — entrar/sair, status e "Sincronizar agora"
- [ ] 9.0 Validação E2E local (E2E-07, E2E-08, E2E-09, E2E-S1)
- [ ] 10.0 Dev hospedado — migration em `certamecards-dev`, variáveis Vercel e E2E completo no preview
