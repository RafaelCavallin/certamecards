# Tarefa 9.0: Validação E2E local (E2E-07, E2E-08, E2E-09, E2E-S1)

## Visão geral

Com todo o domínio, estado e UI de conta/sync no lugar (Tarefas 1.0–8.0), roda os roteiros E2E de conta contra `ng serve` + Supabase local, com a skill `agent-browser`, antes de publicar o preview sem backend remoto. Fecha o ciclo local desta entrega.

<skills>
### Conformidade com skills

`agent-browser` — execução dos roteiros E2E com captura de tela como evidência.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Lido o `AGENTS.md` e as rules em `.agents/rules/`. Não há Playwright nem pasta `e2e/` no projeto — os roteiros rodam à mão com `agent-browser`, evidências em `tasks/prd-conta-sync/evidences/` (`.agents/rules/tests.md`, item 5). Dois perfis de navegador simultâneos para E2E-08 (mesma conta em dois "aparelhos").
</rules>

<requirements>
- CA-17 (regressão offline sem conta), CA-18 (sync entre aparelhos), CA-19/CA-20 (decisão de login, isolamento entre contas), CA-S1 (build sem variáveis).
</requirements>

## Subtarefas

- [x] 9.1 E2E-07 — DevTools offline, Supabase configurado, sem conta: criar, revisar e ver progresso sem erro.
- [x] 9.2 E2E-08 — dois perfis de navegador na mesma conta: revisão feita num perfil aparece no outro após sincronizar, sem duplicar logs.
- [x] 9.3 E2E-09 — login com dados dos dois lados: opções corretas (juntar/descartar/cancelar); troca de conta nunca mistura dados.
- [x] 9.4 E2E-S1 — build gerado sem `NG_APP_SUPABASE_URL`: abrir Conta e Ajustes, confirmar aviso de indisponibilidade sem erro no console e sem requisição ao Supabase.
- [x] 9.5 Salvar capturas de tela de cada roteiro em `tasks/prd-conta-sync/evidences/`.

## Detalhes de implementação

Ver TechSpec da entrega, "Testes E2E". Ver TechSpec-base, "Testes E2E" (mesmos IDs) e "Abordagem de testes" (proporção 70/20/10, E2E reservado para jornadas de maior valor).

## Critérios de aceitação relacionados

- CA-17
- CA-18
- CA-19
- CA-20
- CA-S1

## Testes da tarefa

### Testes E2E

- [x] E2E-07 — Regressão: offline com Supabase configurado e sem conta
- [x] E2E-08 — Dois perfis de navegador na mesma conta
- [x] E2E-09 — Login com dados dos dois lados
- [x] E2E-S1 — Build sem variáveis: abrir Conta e Ajustes

## Arquivos relevantes

- `tasks/prd-conta-sync/evidences/` (capturas de tela, novo)
