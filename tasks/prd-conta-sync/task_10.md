# Tarefa 10.0: Preview sem backend remoto e E2E offline

## Visão geral

Publica a entrega no preview da Vercel a partir da branch `des`, sem variáveis do Supabase. O preview permite estudar offline e informa que a sincronização não está disponível. Conta e sincronização usam exclusivamente o Supabase local no desenvolvimento e já foram validadas na Tarefa 9.0. O único banco remoto, `certamecards`, é reservado à produção.

<skills>
### Conformidade com skills

`vercel-cli` — inspeção de escopos e deploy de preview. `agent-browser` — roteiros E2E offline no preview.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Preview/Development não recebem `NG_APP_SUPABASE_URL` nem `NG_APP_SUPABASE_PUBLISHABLE_KEY`. Não aplicar migration remota, usar `--linked`, alterar variáveis de Production ou promover para `prod`. Nunca `npx vercel env pull` sem argumento. Não incluir `.env.local`, caches ou capturas no upload do preview.
</rules>

<requirements>
- Isolamento entre ambientes: desenvolvimento usa Supabase local; preview não acessa o banco de produção.
- CA-17 e CA-S1: estudo sem conta funciona e Conta/Ajustes indicam sincronização indisponível no preview.
- E2E-08/E2E-09 de conta e sincronização permanecem cobertos pela Tarefa 9.0 com Supabase local.
</requirements>

## Subtarefas

- [x] 10.1 Confirmar que Preview/Development da Vercel não têm variáveis Supabase e que o pacote não inclui segredos locais.
- [x] 10.2 Publicar ou confirmar um deploy de preview da branch `des` com o código desta entrega e sem configuração Supabase.
- [x] 10.3 Repetir no preview E2E-01 a E2E-07, E2E-10 e E2E-S1 com `agent-browser`.
- [x] 10.4 Registrar resultados e capturas em `tasks/prd-conta-sync/evidences/`.

## Detalhes de implementação

Ver `AGENTS.md`, seção "Isolamento entre desenvolvimento e produção", e a TechSpec desta entrega, "Testes E2E". Conta e sincronização só podem ser testadas com o Supabase local até a etapa de produção, que exige pedido explícito do Rafael.

## Critérios de aceitação relacionados

- CA-17
- CA-21
- CA-22
- CA-23
- CA-S1

## Testes da tarefa

### Testes E2E

- [x] E2E-01 a E2E-07, E2E-10 e E2E-S1 no preview sem Supabase.

## Arquivos relevantes

- `tasks/prd-conta-sync/evidences/` (capturas do preview)
- `.vercelignore` (exclusões do upload)
- Variáveis de ambiente da Vercel (fora do repositório)
