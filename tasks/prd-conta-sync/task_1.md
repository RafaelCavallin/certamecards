# Tarefa 1.0: Validar a migration existente no Supabase local

## Visão geral

A migration `supabase/migrations/20261001000000_schema.sql` já foi commitada junto com o MVP offline (`7f6f745`) e contém exatamente o schema, os índices, o trigger `touch_synced_at`, a RLS, os grants e a RPC `sync_push` descritos na TechSpec-base. Esta tarefa não cria a migration — valida, no Supabase local, que ela se comporta como especificado antes de qualquer código de domínio depender dela.

<skills>
### Conformidade com skills

`supabase` — aplicação da migration, verificação de RLS, RPC e grants no Supabase local.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Lido o `AGENTS.md` e as rules em `.agents/rules/` (`code-standards.md`, `javascript-typescript.md`, `tests.md`). Esta tarefa não escreve código de aplicação, então as rules de tamanho de arquivo/função não se aplicam; qualquer script SQL de verificação ad-hoc roda direto no Studio/`psql`, sem entrar no repositório. Nenhuma migration é editada — mudança de schema seria sempre uma migration nova (AGENTS.md, "O que nenhum agente faz sozinho").
</rules>

<requirements>
- RF37–RF41 (conta e sincronização), conforme descritos no documento-mãe.
- Migration nasce com `cards.tags` e `user_settings` para a RPC `sync_push` não precisar ser reemitida na Fase 2 (techspec-base, "Principais decisões").
</requirements>

## Subtarefas

- [ ] 1.1 Subir o Supabase local (`npx supabase start`) e aplicar a migration do zero (`npx supabase db reset`).
- [ ] 1.2 Verificar LWW em `cards` e `user_settings`: linha com `updated_at` mais velho não sobrescreve a mais nova via `sync_push`.
- [ ] 1.3 Verificar que log duplicado (`review_logs`, mesmo `id`) é ignorado (`on conflict do nothing`) e que `DELETE`/`UPDATE` em `review_logs` são negados pelos grants/RLS.
- [ ] 1.4 Verificar que `marks` não-objeto e mais de 20 etiquetas em `cards.tags` são rejeitados pelos `check` da tabela.
- [ ] 1.5 Verificar isolamento entre usuários: usuário A não lê nem escreve linha de usuário B (RLS + FK composta `(user_id, id)`).
- [ ] 1.6 Verificar que `anon` não tem `EXECUTE` em `sync_push` (chamada deve falhar sem sessão autenticada).

## Detalhes de implementação

Ver TechSpec-base, seções "Esquema do banco (DDL)" e "Trigger, RLS e grants"; TechSpec da entrega, seção "Banco". As verificações rodam via Studio (`localhost:55323`) ou `psql`/`supabase-js` contra `http://127.0.0.1:55321`, autenticando dois usuários de teste diferentes para os casos de isolamento.

## Critérios de aceitação relacionados

- CA-18
- CA-20

## Testes da tarefa

Não há teste automatizado Vitest nesta tarefa — as verificações são manuais contra o banco local, conforme a seção "Banco" da TechSpec da entrega. Registrar o resultado de cada subtarefa (1.2–1.6) como evidência para o QA.

## Arquivos relevantes

- `supabase/migrations/20261001000000_schema.sql` (leitura/validação, sem alteração)
- `supabase/config.toml`
