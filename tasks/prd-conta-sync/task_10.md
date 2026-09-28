# Tarefa 10.0: Dev hospedado — migration, variáveis Vercel e E2E no preview

## Visão geral

Leva a entrega ao projeto Supabase hospedado `certamecards-dev` e ao preview da Vercel (branch `des`), e repete o roteiro E2E completo das duas entregas da Fase 1 (MVP offline + conta/sync) contra esse ambiente antes de qualquer promoção para produção. Depende das Tarefas 1.0–9.0 concluídas e validadas localmente.

<skills>
### Conformidade com skills

`supabase` — aplicação de migration num projeto hospedado. `vercel-cli` — variáveis de ambiente por escopo, deploy de preview. `agent-browser` — roteiro E2E completo no preview.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Lido o `AGENTS.md` e as rules em `.agents/rules/`, em especial "Isolamento entre desenvolvimento e produção" e "O que nenhum agente faz sozinho". Migration em `certamecards-dev` só com `npx supabase db push --db-url "postgresql://postgres:<senha>@db.<ref-dev>.supabase.co:5432/postgres"` — nunca `--linked`. Variáveis `NG_APP_SUPABASE_URL`/`NG_APP_SUPABASE_PUBLISHABLE_KEY` só nos escopos Development/Preview da Vercel, apontando para `certamecards-dev`. Nunca `npx vercel env pull` sem argumento. Esta tarefa **não** promove para produção — isso exige pedido explícito do Rafael e é tratado à parte.
</rules>

<requirements>
- Isolamento entre ambientes (documento-mãe / AGENTS.md): desenvolvimento nunca fala com o banco de produção.
- Roteiro E2E completo das duas entregas da Fase 1 repetido no preview antes da promoção (TechSpec da entrega, "Testes E2E").
</requirements>

## Subtarefas

- [ ] 10.1 Aplicar a migration `20261001000000_schema.sql` no projeto `certamecards-dev` via `--db-url`.
- [ ] 10.2 Configurar `NG_APP_SUPABASE_URL` e `NG_APP_SUPABASE_PUBLISHABLE_KEY` nos escopos Development/Preview da Vercel, apontando para `certamecards-dev`.
- [ ] 10.3 Acionar (ou confirmar) o deploy de preview da branch `des` com as novas variáveis.
- [ ] 10.4 Repetir contra o preview o roteiro E2E completo das duas entregas da Fase 1 (MVP offline + conta/sync), com `agent-browser`, evidências em `tasks/prd-conta-sync/evidences/`.

## Detalhes de implementação

Ver `AGENTS.md`, seções "Isolamento entre desenvolvimento e produção" e "Fluxo de uma migration nova". Ver TechSpec da entrega, "Sequenciamento do desenvolvimento", etapa 4 ("Dev hospedado"). Ver TechSpec-base, "Pontos de integração" (Vercel, `scripts/write-env.mjs`).

## Critérios de aceitação relacionados

- CA-17
- CA-18
- CA-19
- CA-20
- CA-S1

## Testes da tarefa

### Testes E2E

- [ ] Roteiro E2E completo das duas entregas da Fase 1, repetido no preview de `certamecards-dev` (mesmos IDs da Tarefa 9.0 mais os roteiros E2E-01 a E2E-06/E2E-10 do MVP offline).

## Arquivos relevantes

- `tasks/prd-conta-sync/evidences/` (capturas de tela do preview)
- Variáveis de ambiente da Vercel (fora do repositório)
