# Tarefa 9.0: validação final — CI local e roteiros de ponta a ponta

## Visão geral

Fecha a entrega:
- roda os quatro comandos do CI;
- executa a jornada completa E2E-11;
- executa a sincronização entre dois perfis no Supabase local (E2E-E5);
- executa o roteiro offline e a 360 px (E2E-E6), com as capturas em `tasks/prd-etiquetas/evidences/`.

Não há migration nem variável de ambiente nova: a promoção para a `prod` só acontece a pedido do Rafael.

<skills>
### Conformidade com skills

- `agent-browser`: E2E-11, E2E-E5 e E2E-E6.
- `supabase`: `npx supabase start` local para o E2E-E5 (nunca o banco de produção).
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e as rules em `.agents/rules/`. Pontos relevantes:
- Subir o app numa porta livre de `4200–4299` (conferir com `ss -ltn`) e registrar no relatório o que subiu.
- Encerrar só os processos iniciados por esta tarefa.
- Se o `supabase start` acusar porta ocupada, rodar `npx supabase stop --project-id <id>` (sem `--no-backup`) e avisar.
- Desenvolvimento nunca fala com o banco de produção.
- Sem Playwright nem pasta `e2e/`.
- Piso de 80% em `src/app/domain/**`.
</rules>

<requirements>
- Todos os critérios do PRD verificados de ponta a ponta, em especial CA-E14 (sincronização entre aparelhos), CA-E15 (offline sem conta) e CA-E16 (360 px).
- `npm run lint`, `npm run check:type-scale`, `npm run test:coverage` e `npm run build` verdes.
</requirements>

## Subtarefas

- [ ] 9.1 Rodar `npm run lint`, `npm run check:type-scale`, `npm run test:coverage` e `npm run build`, e corrigir o que falhar (com teste, se for bug).
- [ ] 9.2 Executar o E2E-11 (jornada completa sem conta) e salvar as capturas.
- [ ] 9.3 Subir o Supabase local e executar o E2E-E5 com dois perfis de navegador na mesma conta.
- [ ] 9.4 Executar o E2E-E6 com o DevTools offline e a viewport de 360 px.
- [ ] 9.5 Registrar os resultados e as evidências. Marcar as tarefas em `tasks.md` e encerrar os processos iniciados.

## Detalhes de implementação

Ver [techspec.md](techspec.md): “Testes E2E” (roteiros e forma de semear o IndexedDB) e “Dependências técnicas”. Portas e isolamento: `AGENTS.md`, seções “Como um agente sobe o app” e “Isolamento entre desenvolvimento e produção”.

## Critérios de aceitação relacionados

- CA-24
- CA-25
- CA-26
- CA-27
- CA-E14
- CA-E15
- CA-E16

## Testes da tarefa

### Testes E2E

- [ ] E2E-11 — Jornada completa: criar com etiquetas, autocompletar, filtrar a lista, “Estudar só…”, renomear em Ajustes
- [ ] E2E-E5 — dois perfis na mesma conta (Supabase local)
- [ ] E2E-E6 — offline sem conta e a 360 px

## Arquivos relevantes

- `tasks/prd-etiquetas/evidences/` (capturas)
- `tasks/prd-etiquetas/tasks.md`
- `.github/workflows/ci.yml` (referência dos comandos)
