# Tarefa 6.0: Validação final — CI local e roteiros E2E

## Visão geral

Fecha a entrega: roda os quatro comandos do CI e deixa os roteiros E2E prontos para o `/executar-qa`, com os dados de apoio (backup grande para desempenho e recarregamento, backup de versão futura, `.zip` qualquer). Os roteiros são executados à mão com a skill `agent-browser` no QA, com evidências em `tasks/prd-backup/evidences/`; esta tarefa garante que o app está pronto para eles e faz a passada rápida dos fluxos principais.

<skills>
### Conformidade com skills

- `agent-browser`: passada rápida nos fluxos de exportar, Mesclar e Substituir sem conta.
- `supabase`: subir o Supabase local para os roteiros com conta (E2E-B6, E2E-B9).
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e as rules em `.agents/rules/`. Pontos relevantes:
- Os únicos comandos de validação: `lint`, `check:type-scale`, `test:coverage` (piso de 80% em `domain/`) e `build`.
- Sem Playwright nem pasta `e2e/`: os roteiros são passos manuais com `agent-browser`.
- Subir o app numa porta livre de `4200–4299`, conferir a porta, registrar o que subiu e encerrar só os processos iniciados.
- Nenhuma migration nem variável de ambiente nova.
</rules>

<requirements>
- `npm run lint`, `npm run check:type-scale`, `npm run test:coverage` e `npm run build` verdes.
- Dados de apoio para E2E-B3, E2E-B7 e E2E-B11 (gerados no navegador ou por script de teste; nada versionado com dados pessoais).
- Passada rápida de E2E-B1, E2E-B4 e E2E-B5 sem conta.
</requirements>

## Subtarefas

- [x] 6.1 Rodar os quatro comandos do CI e corrigir o que falhar.
- [x] 6.2 Preparar os dados de apoio dos roteiros (backup com 5.000 cartões e 20.000 revisões, backup com `version: 2`, `.zip` alheio).
- [x] 6.3 Passada rápida com `agent-browser` em E2E-B1, E2E-B4 e E2E-B5; registrar no relatório o que subiu e encerrar os processos.

## Detalhes de implementação

Ver [techspec.md](techspec.md), “Testes E2E” (roteiros e ambiente: `npm start` sem conta, Supabase local para conta, `npm run build` servido localmente para o caso offline).

## Critérios de aceitação relacionados

- CA-36
- CA-37
- CA-B1 a CA-B16

## Testes da tarefa

### Testes E2E

- [ ] E2E-16 — Exportar backup, restaurar em outro perfil (Substituir e Mesclar)
- [ ] E2E-B1 — Exportar com dados variados
- [ ] E2E-B2 — Trocar de “celular”
- [ ] E2E-B3 — Arquivos errados
- [ ] E2E-B4 — Mesclar depois de estudar
- [ ] E2E-B5 — Substituir com backup automático
- [ ] E2E-B6 — Backup de outra conta
- [ ] E2E-B7 — Recarregar no meio
- [ ] E2E-B8 — Offline e sem conta
- [ ] E2E-B9 — Dois aparelhos
- [ ] E2E-B10 — Aviso de 30 dias
- [ ] E2E-B11 — Desempenho
- [ ] E2E-B12 — Legibilidade e acessibilidade

## Arquivos relevantes

- `tasks/prd-backup/evidences/` (capturas no QA)
- `.github/workflows/ci.yml`, `vitest.config.ts` — só leitura
