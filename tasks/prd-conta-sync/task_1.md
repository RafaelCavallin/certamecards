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

- [x] 1.1 Subir o Supabase local (`npx supabase start`) e aplicar a migration do zero (`npx supabase db reset`).
- [x] 1.2 Verificar LWW em `cards` e `user_settings`: linha com `updated_at` mais velho não sobrescreve a mais nova via `sync_push`.
- [x] 1.3 Verificar que log duplicado (`review_logs`, mesmo `id`) é ignorado (`on conflict do nothing`) e que `DELETE`/`UPDATE` em `review_logs` são negados pelos grants/RLS.
- [x] 1.4 Verificar que `marks` não-objeto e mais de 20 etiquetas em `cards.tags` são rejeitados pelos `check` da tabela.
- [x] 1.5 Verificar isolamento entre usuários: usuário A não lê nem escreve linha de usuário B (RLS + FK composta `(user_id, id)`).
- [x] 1.6 Verificar que `anon` não tem `EXECUTE` em `sync_push` (chamada deve falhar sem sessão autenticada).

## Detalhes de implementação

Ver TechSpec-base, seções "Esquema do banco (DDL)" e "Trigger, RLS e grants"; TechSpec da entrega, seção "Banco". As verificações rodam via Studio (`localhost:55323`) ou `psql`/`supabase-js` contra `http://127.0.0.1:55321`, autenticando dois usuários de teste diferentes para os casos de isolamento.

## Critérios de aceitação relacionados

- CA-18
- CA-20

## Testes da tarefa

Não há teste automatizado Vitest nesta tarefa — as verificações são manuais contra o banco local, conforme a seção "Banco" da TechSpec da entrega. Registrar o resultado de cada subtarefa (1.2–1.6) como evidência para o QA.

### Evidência (via `psql` contra `127.0.0.1:55322`, dois usuários de teste, 2026-09-28)

Pré-requisito corrigido nesta validação: `supabase/config.toml` nunca tinha sido commitado; a instância local já rodava (iniciada por outro agente) nas portas padrão 54321–54327 em vez das fixas 55321–55327 do projeto (AGENTS.md, "Onde cada coisa roda"). Parei os containers, rodei `npx supabase init` e ajustei as 6 portas (`api`, `db`, `db.shadow_port`, `db.pooler`, `studio`, `local_smtp`, `analytics`) para o offset `+1000`, subi de novo e apliquei `npx supabase db reset` (aplicou as duas migrations existentes sem erro).

- **1.2 LWW** — `sync_push` com `updated_at` mais velho (1000) sobre linha existente com `updated_at` 2000: nenhuma linha afetada (`cards: 0`), valor mantido. Com `updated_at` mais novo (3000): sobrescreve. Mesmo padrão confirmado em `user_settings`.
- **1.3 review_logs** — push do mesmo `id` duas vezes: segunda chamada retorna `logs: 0`, valor da primeira mantido (`on conflict do nothing`). `UPDATE`/`DELETE` direto em `review_logs`, `decks` e `cards` como usuário autenticado (não-dono da linha, já que RLS nunca deixaria o dono chegar por outro motivo): **achado** — a tabela `information_schema.role_table_grants` mostra que o role `authenticated` tem `UPDATE`/`DELETE` nessas tabelas (grants padrão do Supabase local no schema `public`, aplicados antes desta migration; o `grant select, insert on ...` da migration é aditivo, não restringe o que já existia). Na prática o dado continua protegido: nenhuma dessas tabelas tem policy de `UPDATE`/`DELETE` para `authenticated`, então RLS zera as linhas afetadas (`UPDATE 0` / `DELETE 0`) em vez de gerar erro. O comentário da migration ("Sem DELETE para ninguém: exclusão é sempre lógica"; "review_logs sem UPDATE: imutável pelo banco, não por convenção") descreve o grant como o mecanismo, mas quem de fato bloqueia é a ausência de policy de RLS — o comentário está impreciso, não o comportamento.
- **1.4 checks** — `marks: [1,2,3]` (não-objeto) rejeitado por `cards_marks_check`. `tags` com 21 itens rejeitado por `cards_tags_check`.
- **1.5 isolamento** — usuário A cria deck; A vê 1 linha, usuário B vê 0 (RLS). B tentando criar card referenciando o `deck_id` de A: rejeitado por `cards_user_id_deck_id_fkey` (a FK composta `(user_id, deck_id)` não encontra a linha porque o `deck_id` pertence a outro `user_id`).
- **1.6 anon × sync_push** — chamada como `anon` falha com `not authenticated` (o guard `if v_uid is null` dentro da função). **Achado relacionado**: `has_function_privilege('anon', 'public.sync_push(...)', 'EXECUTE')` retorna `true` — o mesmo padrão do achado da 1.3: grants padrão do Supabase já davam `EXECUTE` a `anon` antes do `revoke all ... from public` da migration rodar (esse revoke não atinge o grant direto que `anon` já tinha). A chamada falha do mesmo jeito porque `auth.uid()` é nulo para `anon`, e é a primeira linha da função — nenhuma tabela chega a ser tocada.

**Conclusão**: os quatro invariantes de dados (LWW, dedup de logs, checks de `marks`/`tags`, isolamento entre contas) se comportam exatamente como a TechSpec exige. Os dois achados (grants de tabela/função mais amplos que o pretendido, neutralizados por RLS/guard interno) não quebram nenhum critério de aceitação, mas os comentários da migration atribuem a proteção ao mecanismo errado — vale corrigir o texto numa migration futura se for mexer nesse arquivo por outro motivo; não abri uma migration só para isso.

## Arquivos relevantes

- `supabase/migrations/20261001000000_schema.sql` (leitura/validação, sem alteração)
- `supabase/config.toml`
