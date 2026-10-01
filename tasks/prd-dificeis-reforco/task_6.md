# Tarefa 6.0: Validação final

## Visão geral

Fecha a entrega com a mesma sequência do CI e os roteiros E2E que dependem de tudo pronto: dois aparelhos na mesma conta contra o Supabase local (E2E-D5) e o roteiro offline, a 360 px e com volume (E2E-D6). Confere que todo critério de aceitação do PRD tem evidência em alguma tarefa.

<skills>
### Conformidade com skills

- `agent-browser`: execução dos E2E-D5 e E2E-D6, com dois perfis de navegador no E2E-D5.
- `supabase`: subir e parar o Supabase local para o E2E-D5 (portas 55321–55327). Sem migration.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e as rules em `.agents/rules/`. Pontos relevantes:
- Comandos de validação obrigatórios: `npm run lint`, `npm run check:type-scale`, `npm run test:coverage` (piso de 80% em `src/app/domain/**`) e `npm run build`.
- Subir o app em porta livre (`npm start -- --port <porta>` em 4200–4299, conferida com `ss -ltn`), registrar no relatório o que subiu e encerrar só os processos iniciados. Se `supabase start` acusar porta ocupada, `npx supabase stop --project-id <id>` (nunca `--no-backup`) e avisar.
- Desenvolvimento nunca fala com o banco de produção; nada vai para produção sem pedido do Rafael.
</rules>

<requirements>
- Todos os RF51–RF54 e derivados do [prd.md](prd.md) cobertos por pelo menos um caso de teste com resultado registrado.
- Metas do PRD: Difíceis < 500 ms com 5.000 cartões e 50.000 revisões; resposta no reforço < 150 ms; tudo offline.
</requirements>

## Subtarefas

- [x] 6.1 Rodar `npm run lint`, `npm run check:type-scale`, `npm run test:coverage` e `npm run build`, todos verdes, com a cobertura de `domain/` ≥ 80%.
- [x] 6.2 Executar o E2E-D5 com o Supabase local e dois perfis na mesma conta.
- [x] 6.3 Executar o E2E-D6: offline sem conta, 360 px e volume semeado (5.000 cartões, 50.000 logs), medindo pelo painel Performance.
- [x] 6.4 Conferir a matriz CA × teste (todas as tarefas) e marcar em `tasks.md` o que foi concluído.
- [x] 6.5 Encerrar o app e o Supabase local iniciados e registrar portas e processos no relatório.

## Detalhes de implementação

Ver [techspec.md](techspec.md):
- “Testes E2E”: preparação por `eval` no IndexedDB e as linhas E2E-D5 e E2E-D6.
- “Dependências técnicas”.
- “Riscos conhecidos”: “Recalcular a cada escrita” (se a meta de 500 ms falhar, aplicar a mitigação descrita lá).

## Critérios de aceitação relacionados

- CA-D12
- CA-D17
- CA-D18
- CA-D20

## Testes da tarefa

### Testes E2E

- [x] E2E-D5 — dois perfis na mesma conta (Supabase local)
- [x] E2E-D6 — offline, 360 px e volume

## Arquivos relevantes

- `tasks/prd-dificeis-reforco/evidences/`
- `tasks/prd-dificeis-reforco/tasks.md`
- `supabase/migrations/` — só leitura (nenhuma migration nesta entrega)
