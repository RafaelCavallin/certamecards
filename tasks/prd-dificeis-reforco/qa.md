# Relatório de QA — Difíceis e reforço

As evidências da ferramenta de navegador estão em `tasks/prd-dificeis-reforco/evidences/` (as desta rodada de QA em `evidences/qa/`, as das tarefas 3.0 a 6.0 na raiz da pasta).

## Resumo
- Data: 2026-10-01
- Status: APROVADO (com a ressalva de desempenho descrita na Conclusão)
- Total de critérios de aceitação: 22 (CA-28, CA-29 e CA-D1 a CA-D20)
- Critérios de aceitação atendidos: 22
- Bugs encontrados: 2 (ambos corrigidos), mais 1 problema de desempenho corrigido na tarefa 6.0

Ambiente desta rodada: `npm start -- --port 4236` (encerrado), perfil de navegador `qa` (IndexedDB isolado), 2 baralhos semeados pelo `eval` do navegador (6 cartões no “Meus cartões” e 2 no “Penal”). O Supabase local já estava rodando antes e não foi tocado. Os critérios de conta e sync (CA-D12, CA-D18) foram validados na tarefa 6.0 contra esse Supabase, com duas portas e dois perfis.

## Critérios de aceitação verificados
| ID | Critério de aceitação | Casos de teste | Status | Evidência |
|----|-----------------------|----------------|--------|-----------|
| CA-28 | Pontuação 5 aparece; pontuação 2 não | TU-21, TI-D1, E2E-12 | PASSOU | qa/qa-01-dificeis-1280.png (cartão C, 1 lapso e 1 erro antigo, fora da lista) |
| CA-29 | Reforço com “Errei” não muda próxima revisão, retenção nem heatmap | TI-11, E2E-12 | PASSOU | qa/qa-07-resumo-1280.png; comparação do IndexedDB antes/depois: 15 logs → 15, `due`, `reps`, `lapses` e `state` iguais em todos os cartões |
| CA-D1 | Janela de 30 dias | TU-D1, TI-D1 | PASSOU | qa/qa-01-dificeis-1280.png: cartão D (3 erros recentes) entra; cartão F (2 recentes + 1 de 31 dias) fica de fora. O limite exato de 30 dias é coberto pelo TU-D1 |
| CA-D2 | Ordem e legenda | TU-D2, TU-D3, TU-D4, TI-D1 | PASSOU | qa/qa-01-dificeis-1280.png (B 7, A 5 “ontem”, E 5 “há 10 dias”, D 3) |
| CA-D3 | Cartão aparece sem recarregar após o 3º erro | TI-D2, E2E-D1 | PASSOU | qa/qa-09-atualizacao-viva.png (3 → 4 difíceis, cartão F surgiu na outra aba) |
| CA-D4 | Estado vazio, sem “Reforçar” e sem atalho na Home | TI-D3, E2E-D1 | PASSOU | qa/qa-11-vazio-1280.png |
| CA-D5 | Filtro OU com contagem | TU-D5, E2E-D2 | PASSOU | qa/qa-02-filtro-or.png (CESPE + FGV → 3 e “Reforçar 3”). Os números exatos do PRD (8/3/2/5 → 13) estão no TU-D5 |
| CA-D6 | Filtro independente do “Estudar só…” | TU-D6, E2E-D2 | PASSOU | qa/qa-03-home-so-cespe-atalho.png (Difíceis em FGV, reforço, “← Sair” volta com `?etiquetas=fgv`; a Home segue “Só: CESPE”) |
| CA-D7 | Filtro sem resultado | TU-D5, E2E-D2 | PASSOU (após BUG-02) | qa/qa-19-filtro-vazio.png |
| CA-D8 | Sessão com os 30 mais difíceis, embaralhados | TU-D7, E2E-D3 | PASSOU | d6-2-reforco-360-offline.png (50 difíceis → “0 / 30”); a ordem diferente entre aberturas é o TU-D7 |
| CA-D9 | “Errei” volta para o fim e o contador só avança no acerto | TU-D8, E2E-D3 | PASSOU | qa/qa-07-resumo-1280.png; d3-2-de-novo.png (“DE NOVO” e 1 / 2) |
| CA-D10 | Teclas e resposta dupla | TU-D11, E2E-D3 | PASSOU | qa/qa-07-resumo-1280.png (o segundo `2` seguido foi ignorado: 3 cartões, 3 respostas) |
| CA-D11 | Cartão vencido e difícil continua na fila | TI-11, E2E-12 | PASSOU | Comparação do IndexedDB (cartão A, vencido, respondido no reforço, idêntico); d3-session: Home continuou em 1 cartão para revisar |
| CA-D12 | Reforço não sobe nada na sincronização | TI-11, E2E-D5 | PASSOU | d5-a-reforco-fim.png; hash dos cartões no Postgres e contagem de logs idênticos antes e depois |
| CA-D13 | Faixa “Reforço — não mexe na sua agenda” sempre visível | E2E-D3 | PASSOU | qa/qa-04-reforco-frente-1280.png, qa/qa-13-390-reforco-frente.png, d6-2-reforco-360-offline.png |
| CA-D14 | Recarregar no meio não gera erro nem altera cartões | E2E-D3 | PASSOU | d3-3-360px.png (tarefa 5.0: recarregou em “0 / 2”, banco intacto). Não repeti nesta rodada |
| CA-D15 | Resumo: placar, errados com contagem e edição | TU-D9, E2E-D4 | PASSOU | qa/qa-07-resumo-1280.png, qa/qa-08-resumo-editado.png |
| CA-D16 | Editar o cartão atual no reforço | E2E-D3 | PASSOU | qa/qa-05-reforco-edicao.png (volta ao mesmo cartão com o texto novo; `reps`, `lapses`, `due` e `state` do cartão iguais) |
| CA-D17 | Offline sem conta | E2E-D6 | PASSOU | d6-1-dificeis-360-offline.png, d6-2-reforco-360-offline.png, d6-3-resumo-360-offline.png (tarefa 6.0; console sem erros) |
| CA-D18 | Erros de outro aparelho entram na lista | TI-D4, E2E-D5 | PASSOU | d5-b-difíceis-sync.png (tarefa 6.0: 4 → 5 difíceis no perfil B depois do sync) |
| CA-D19 | Menu e atalho da Home | E2E-D1 | PASSOU | qa/qa-12-390-home.png, qa/qa-17-390-menu.png, qa/qa-01-dificeis-1280.png (menu lateral) |
| CA-D20 | 360/390 px sem rolagem horizontal e sem texto abaixo da escala | E2E-D6 | PASSOU | qa/qa-12-390-home.png, qa-12-390-dificeis.png, qa-13…16 (varredura por script: nenhum texto < 13 px, `scrollWidth` = largura) |

Regressão da revisão (CA-13 e CA-14, herdados do MVP): E2E-D7 executado na tarefa 3.0 (evidences/d7-*.png); nesta rodada a revisão foi usada para gerar erros (CA-D3) sem alteração de comportamento.

## Testes E2E executados
| ID | Fluxo | Resultado | Observações |
|----|-------|-----------|-------------|
| E2E-12 | Difíceis → Reforçar → agenda inalterada | PASSOU | Comparação do IndexedDB antes e depois |
| E2E-D1 | Tela Difíceis: ordem, legenda, vazio, edição, atualização viva, menu e atalho | PASSOU | |
| E2E-D2 | Filtro por etiqueta | PASSOU | Troca de baralho limpa o filtro (qa/qa-10-troca-baralho.png); BUG-02 corrigido |
| E2E-D3 | Sessão de reforço | PASSOU | Inclui edição durante a sessão e poda de cartão excluído em outra aba (0 / 4 → 0 / 3, qa/qa-06-reforco-poda.png) |
| E2E-D4 | Resumo do reforço | PASSOU | Edição pelo resumo e “Voltar para Difíceis” |
| E2E-D5 | Dois perfis na mesma conta | PASSOU | Tarefa 6.0 (Supabase local; conta de teste removida depois) |
| E2E-D6 | Offline, 360 px e volume | PASSOU, com ressalva | Ver Conclusão |
| E2E-D7 | Regressão da revisão | PASSOU | Tarefa 3.0 |

## Testes automatizados e cobertura
| Camada | ID | Resultado | Validação/comando | Observações |
|--------|----|-----------|-------------------|------------|
| Unidade | TU-21, TU-D1 a TU-D11 | PASSOU | `npm run test:coverage` | 309 testes na suíte, 54 arquivos |
| Integração | TI-11, TI-D1 a TI-D5 | PASSOU | `npm run test:coverage` | TI-11 compara cartões, logs, fila e estatísticas antes e depois |
| Lint | — | PASSOU | `npm run lint` | Inclui a regra `no-restricted-imports` do reforço |
| Escala tipográfica | — | PASSOU | `npm run check:type-scale` | |
| Build | — | PASSOU | `npm run build` | O aviso de orçamento do bundle inicial é anterior a esta entrega |

- Cobertura de `src/app/domain/**`: 96,65% de instruções, 92,85% de ramos, 94,91% de funções, 97,51% de linhas (piso: 80%). `pages/`, `ui/` e `state/` ficam fora do gate e foram validados pelos roteiros E2E.

## Acessibilidade
- [x] Navegação por teclado: a ordem de Tab em Difíceis é lógica (pular conteúdo → menu → filtros → “Reforçar” → itens), todo foco tem contorno visível, Enter abre o diálogo de edição e Esc fecha (qa/qa-18-dialogo-teclado.png). No reforço, Espaço, 1 e 2 funcionam e são ignorados com o diálogo aberto.
- [x] Rótulos descritivos: itens da lista são botões com o texto do cartão e a legenda; “Editar cartão: …” no resumo; “Abrir menu”; título da página “Reforço”.
- [x] Imagens com `alt`: não se aplica (a entrega não tem imagens).
- [x] Contraste: só tokens do projeto. `signal`, `miss` e `muted` sobre `ink` ficam entre 6,5:1 e 10:1 por cálculo; não medi com ferramenta.
- [x] Formulários: o diálogo de edição reaproveita o `card-form` já validado no MVP.
- [x] Mensagens: contagem e resumo em regiões `role="status"` com `aria-live="polite"`; estados vazios têm texto explicativo e ação.
- [x] Fontes: varredura por script em 390 px, nenhum texto abaixo de 13 px.
- [x] Áreas de toque ≥ 44 px: ver BUG-01.
- Não testei leitor de tela real; só a árvore de acessibilidade do `agent-browser`.

## Bugs encontrados e corrigidos
| ID | Descrição | Severidade | Status | Correção | Teste de regressão | Evidência |
|----|-----------|------------|--------|----------|--------------------|-----------|
| BUG-01 | “← Sair” e “Editar cartão” com 20 px de altura, abaixo dos 44 px exigidos (existia na revisão do MVP e foi herdado pelo reforço) | Média | Corrigido | `min-h-11` e área horizontal no “← Sair” em `session-shell.html`; `min-h-11` no “Editar cartão” em `review.html` e `reinforce.html` | Sem teste automatizado possível (UI fora do gate). Verificação manual repetível: script que lista botões de `main` e da sessão com altura < 44 px; antes devolvia os dois, depois devolve `[]` | qa/qa-13-390-reforco-frente.png |
| BUG-02 | Em `/dificeis?etiquetas=<etiqueta que não existe>` a tela ignorava a chave e mostrava a lista inteira. A mensagem “Nenhum cartão difícil com essas etiquetas” (RF52d, CA-D7) era inalcançável, e “Reforçar” divergia do `/reforco`, que usa a chave bruta | Média | Corrigido | `activeKeys` passou a usar as chaves da URL sem descartar as desconhecidas, em `difficult.ts`; TechSpec ajustada | Sem teste automatizado possível (lógica no componente). Verificação manual: abrir `/dificeis?etiquetas=inexistente` deve mostrar a mensagem, “Limpar filtro” e nenhum “Reforçar” | qa/qa-19-filtro-vazio.png |
| BUG-03 (tarefa 6.0) | Consulta do histórico dos candidatos com `anyOf` levava ~6,5 s com 734 difíceis | Alta | Corrigido | Consultas `equals` em paralelo numa transação, em `difficulty-data.ts` | TI-D1 e TI-D4 continuam passando; medição no E2E-D6 | TechSpec, “Principais decisões” |

## Conclusão
Os 22 critérios de aceitação foram atendidos e os dois bugs desta rodada foram corrigidos e revalidados no navegador. Lint, escala tipográfica, testes (309) e build passam, com cobertura de `domain/` em 96,65%.

Ressalvas, nenhuma delas reprova a entrega:
- **Desempenho (objetivo do PRD, não critério de aceitação):** com 5.000 cartões e 50.000 revisões, a tela Difíceis abre em cerca de 0,3 s com ~100 difíceis, dentro da meta de 500 ms. No caso extremo de 734 difíceis (15% do baralho) leva cerca de 0,7 s. Fica registrado na TechSpec.
- **Evidências herdadas:** CA-D12, CA-D14, CA-D17 e CA-D18 foram verificados nas tarefas 5.0 e 6.0 e não repetidos aqui. A otimização de BUG-03 veio depois do E2E-D5, e o que a cobre são os testes TI-D1 e TI-D4.
- **Sem teste automatizado:** BUG-01 e BUG-02 estão em `pages/` e `ui/`, fora do gate de cobertura do projeto, então a regressão é o roteiro manual descrito na tabela.
- **Revisão de código:** o `/executar-review` não foi executado para esta entrega.

Ambiente encerrado: servidor da porta 4236 parado e navegador fechado; o Supabase local, que já estava ativo, não foi tocado.
