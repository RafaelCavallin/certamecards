# Tarefa 8.0: pages — seção de conta em `settings`

## Visão geral

Estende `src/app/pages/settings/` (já existe do MVP offline) com a seção de conta: entrar/sair, última sincronização, botão "Sincronizar agora", e o status sem bloqueio ("Sincronizado há 2 min" / "Offline — seus dados estão no aparelho" / erro curto). Sem `NG_APP_SUPABASE_URL`, a seção mostra que a sincronização não está disponível (RF42 parcial, CA-S1). Depende da Tarefa 6.0 (`auth-store`, `sync-store`).

<skills>
### Conformidade com skills

`angular-developer` — extensão de componente standalone existente, `OnPush`, signals.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Lido o `AGENTS.md` e as rules em `.agents/rules/`. `pages/` só acessa `auth-store`/`sync-store`, nunca o Supabase direto. `settings.ts`/`settings.html` ≤ 100 linhas cada — se a seção de conta ultrapassar, extrair um componente de `ui/` (ex.: `account-status`) em vez de inflar a página. Tipografia pela escala semântica.
</rules>

<requirements>
- RF42 (parcial): seção de conta em Ajustes com entrar/sair, última sincronização, "Sincronizar agora".
- CA-17: com Supabase configurado mas sem conta/rede, a tela não trava nem mostra erro.
- CA-S1: sem `NG_APP_SUPABASE_URL`, mostra indisponibilidade sem erro no console e sem requisição.
</requirements>

## Subtarefas

- [x] 8.1 Adicionar a seção de conta em `settings.html`/`settings.ts`: estado logado (email, "Sair") vs. deslogado (link para `conta`).
- [x] 8.2 Exibir `sync-store.status` e `lastSyncAt` formatado ("Sincronizado há 2 min" / "Offline…" / erro curto) e o botão "Sincronizar agora" chamando `syncNow('manual')`.
- [x] 8.3 Tratar o caso sem config (`env.supabaseUrl` nulo): seção mostra "sincronização não disponível", sem renderizar controles que dependam de sessão.

## Detalhes de implementação

Ver TechSpec da entrega, "Visão dos componentes" (linha `pages/`: "seção de conta em `settings`") e "Experiência do usuário" (fluxo "Status"). Ver TechSpec-base, "Monitoramento e observabilidade" (texto do status de sync).

## Critérios de aceitação relacionados

- CA-17
- CA-S1

## Testes da tarefa

`pages/` fora do gate de cobertura — validada pelos roteiros E2E da Tarefa 9.0 (E2E-07, E2E-S1).

### Testes E2E (validados na Tarefa 9.0)

- [x] E2E-07 — Regressão: offline com Supabase configurado e sem conta
- [x] E2E-S1 — Build sem variáveis: abrir Conta e Ajustes

## Arquivos relevantes

- `src/app/pages/settings/settings.ts` (alterado)
- `src/app/pages/settings/settings.html` (alterado)
- `src/app/domain/format-relative-time.ts`, `format-relative-time.test.ts` (novo — formata "Sincronizado há N min/h/d" a partir de `lastSyncAt`)
