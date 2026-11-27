# Tarefa 7.0: Validação final — CI local, roteiros E2E restantes e TechSpec-base

## Visão geral

Fecha a entrega. Roda os quatro comandos do CI, executa os roteiros E2E que dependem da funcionalidade inteira (offline, sincronização entre dois aparelhos, backup e importação do Anki, desempenho com 5.000 cartões) e atualiza a TechSpec-base com o novo modelo de marcas e o novo visual da lacuna.

<skills>
### Conformidade com skills

- `agent-browser`: E2E-06 a E2E-09, com capturas em `tasks/prd-marca-texto/evidences/`.
- `supabase`: nenhum comando de banco. O E2E-07 só usa o `certamecards-dev` pelo app.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e as rules em `.agents/rules/`. Pontos relevantes:
- “Como um agente sobe o app”: `npm start -- --port <porta>` numa porta livre entre 4200 e 4299 (confirmada com `ss -ltn`). No fim, inclusive se interrompido, encerrar só os processos iniciados.
- E2E-07 contra o `certamecards-dev` com usuário `qa-<AAAAMMDD-HHMM>@example.com` criado pelo cadastro do app, registrado no relatório. Nunca a conta pessoal do Rafael nem o banco de produção. Se o `.env.local` não tiver as variáveis do dev, parar e avisar.
- O `.apkg` do E2E-08 e o backup do E2E-09 são gerados por um script descartável no scratchpad, fora do repositório. Nada de Playwright nem pasta `e2e/`.
- Comandos obrigatórios antes de fechar: `npm run lint`, `npm run check:type-scale`, `npm run test:coverage`, `npm run build`.
</rules>

<requirements>
- RF93: sem rede e sem conta, marcar, trocar e tirar funcionam e persistem; com conta, o marca-texto sincroniza.
- RF94: backup e restauração preservam o marca-texto.
- RF96–RF97: a importação do Anki gera o marca-texto esperado na prévia e nos cartões.
- Desempenho do PRD: lista fluida com 5.000 cartões e resposta a um cartão ≤ 150 ms.
</requirements>

## Subtarefas

- [x] 7.1 Rodar `npm run lint`, `npm run check:type-scale`, `npm run test:coverage` e `npm run build`, e registrar o resultado.
- [x] 7.2 Gerar no scratchpad o `.apkg` do E2E-08 e o backup de 5.000 cartões do E2E-09 e registrar como foram gerados.
- [x] 7.3 Executar E2E-06, E2E-07, E2E-08 e E2E-09 com `agent-browser`, salvando as capturas em `evidences/`.
- [x] 7.4 Atualizar `tasks/produto/techspec.md`: modelo `CardMarks`/`Marks` com `highlight`, a nota de semântica por campo e a linha do `marked-text` com a lacuna como moldura. Acrescentar a F19 à tabela “Fase 2 — componentes novos ou modificados” e ao sequenciamento.
- [x] 7.5 Atualizar o estado da entrega na tabela “Divisão em entregas” de `tasks/produto/prd.md`.

## Detalhes de implementação

Ver [techspec.md](techspec.md):
- “Abordagem de testes”: “Testes E2E”, com os roteiros E2E-06 a E2E-09 e a geração do `.apkg` e do backup.
- “Monitoramento e observabilidade”: console limpo no E2E-07.
- “Arquivos relevantes e dependentes”: documentos a atualizar.

## Critérios de aceitação relacionados

- CA-M12
- CA-M13
- CA-M14
- CA-M16
- CA-M19

## Testes da tarefa

### Testes E2E

- [x] E2E-06 — Offline e sem conta
- [x] E2E-07 — Sincronização entre dois aparelhos
- [x] E2E-08 — Backup e importação do Anki
- [x] E2E-09 — Desempenho com 5.000 cartões

## Arquivos relevantes

- `tasks/prd-marca-texto/evidences/` (capturas)
- `tasks/produto/techspec.md`
- `tasks/produto/prd.md`
- `src/test/anki-builder.ts`, `src/test/backup-fixtures.ts` (base dos scripts descartáveis)
