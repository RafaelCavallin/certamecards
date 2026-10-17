# Tarefa 1.0: Linha de base do escuro

## Visão geral

Captura o tema escuro da Fase 1 **antes** de qualquer mudança de cor ou de classe. Essas capturas são a referência do E2E-T12 (tarefa 4.0) e do CA-T12. Depois que as tarefas 3.0 e 4.0 mexerem nos tokens, não há mais como reproduzir o “antes”. Por isso esta tarefa vem primeiro e não altera código.

<skills>
### Conformidade com skills

- `agent-browser`: navegação, emulação de viewport e capturas de tela.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e as rules em `.agents/rules/`. Pontos relevantes:
- Subir o app com `npm start -- --port <porta>`, numa porta livre entre 4200 e 4299 (conferir com `ss -ltn`). Registrar o que subiu e encerrar só os processos iniciados por esta tarefa.
- Nenhum arquivo de `src/` é alterado. Sem Playwright e sem pasta `e2e/`.
- Os dados de teste (baralho, cartões com destaque e lacuna, histórico de revisões, cartões agendados) são criados pela própria UI ou por backup de teste, nunca contra banco remoto.
</rules>

<requirements>
- CA-T12 (suporte): referência visual do escuro de todas as telas, para comparar depois.
- Objetivo “Cobertura total das telas” do PRD: as 9 rotas, o seletor de baralhos, o menu ☰ e os diálogos.
</requirements>

## Subtarefas

- [x] 1.1 Garantir que a árvore de trabalho não tem nenhuma mudança de tokens ou de classes desta entrega.
- [x] 1.2 Subir o app e preparar os dados:
  - um baralho com cartões, incluindo um com destaque e lacuna na Frente;
  - histórico de revisões em dias de intensidades diferentes;
  - cartões agendados nos próximos 14 dias.
- [x] 1.3 Capturar a 360 px e a 1280 px:
  - as 9 rotas (Início, Revisão com a resposta oculta e revelada, Cartões, Novo cartão, Editar cartão, Progresso, Ajustes, Conta, Sem baralho);
  - o seletor de baralhos, o menu ☰, o diálogo de confirmação e o diálogo de edição durante a revisão;
  - um campo com placeholder visível e um campo com foco por Tab.
- [x] 1.4 Salvar em `tasks/prd-tema-claro/evidences/baseline-dark/` com nomes estáveis (`<tela>-<largura>.png`) e um `README.md` com o commit, a porta e os passos usados.

## Detalhes de implementação

Ver [techspec.md](techspec.md): “Testes E2E” (linha E2E-T0) e “Sequenciamento do desenvolvimento”, passo 1.

## Critérios de aceitação relacionados

- CA-T12

## Testes da tarefa

### Testes E2E

- [x] E2E-T0 — Capturar o escuro de todas as telas antes de qualquer mudança

## Arquivos relevantes

- `tasks/prd-tema-claro/evidences/baseline-dark/` (novo)
