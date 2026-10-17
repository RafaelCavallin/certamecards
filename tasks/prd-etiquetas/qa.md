# Relatório de QA — Etiquetas

As evidências da ferramenta de navegador estão em `tasks/prd-etiquetas/evidences/`.

## Resumo
- Data: 2026-09-30
- Status: **APROVADO**
- Total de critérios de aceitação: 20 (CA-24 a CA-27 e CA-E1 a CA-E16)
- Critérios de aceitação atendidos: 20
- Bugs encontrados: 1 (corrigido)

Ambiente desta execução: `npm start -- --port 4261` (sem conta, sem Supabase), navegador headless (agent-browser), 390 px e 1280 px. Os roteiros E2E-11, E2E-E1 a E2E-E6 foram executados na tarefa 9.0 (portas 4251/4252 e Supabase local para o E2E-E5); a tela de QA reaproveitou essas evidências e refez uma passada de regressão, acessibilidade e responsividade. Serviço encerrado ao fim (porta 4261 livre). O Supabase local não foi iniciado por esta execução.

## Critérios de aceitação verificados
| ID | Critério de aceitação | Casos de teste | Status | Evidência |
|----|-----------------------|----------------|--------|-----------|
| CA-24 | Equivalência sem caixa/acento e sugestão por prefixo | TU-18, TU-E3, E2E-11, E2E-E1 | PASSOU | e2e-11-01-autocompletar.png, e2e-e1-03-sugestoes.png |
| CA-25 | Lista com filtro E de etiquetas | TU-19, E2E-11, E2E-E2 | PASSOU | e2e-11-02-lista-filtrada.png |
| CA-26 | "Estudar só: CESPE" restringe número e sessão | TU-20, E2E-11, E2E-E3 | PASSOU | e2e-11-03-estudar-so.png, e2e-e3-02-filtro-ligado.png |
| CA-27 | Renomear juntando, sem duplicata | TU-E6, TI-10, E2E-11, E2E-E4 | PASSOU | e2e-11-04-juntar.png, e2e-e4-03-juntar.png |
| CA-E1 | Colar gera exatamente três chips | TU-E1, E2E-E1 | PASSOU | e2e-e1-01-colar-tres-chips.png |
| CA-E2 | Limites de 20 etiquetas e de 40 caracteres | TU-E2, TU-E12, E2E-E1 | PASSOU | e2e-e1-04-limite-40.png, e2e-e1-05-limite-20.png |
| CA-E3 | "cespe" vira o chip "CESPE" e Ajustes mostra uma só | TU-18, TU-E4, TI-E1, E2E-11 | PASSOU | e2e-11-01-autocompletar.png |
| CA-E4 | Sugestões ordenadas por contagem | TU-E3, E2E-E1 | PASSOU | e2e-e1-03-sugestoes.png |
| CA-E5 | Editar etiquetas não reagenda nem gera log | TI-E1 | PASSOU | sem evidência visual (teste de integração) |
| CA-E6 | 5.000 cartões, filtro + busca | TU-19, E2E-E2 | PASSOU | e2e-e2-01-lista-5000.png (maior tarefa longa 101 ms) |
| CA-E7 | Filtro OU: 5 + 4 + 2 = 11 | TU-20, TU-E11, E2E-E3 | PASSOU | e2e-e3-02-filtro-ligado.png |
| CA-E8 | Limite de novos consumido com filtro | TU-20, TI-E4 | PASSOU | sem evidência visual (teste de integração) |
| CA-E9 | Filtro persiste ao recarregar e é por baralho | TU-E7, E2E-E3 | PASSOU | e2e-e3-02-filtro-ligado.png, qa-1280-estudar-so.png |
| CA-E10 | Cabeçalho mostra o total sem filtro | TU-E8, E2E-E3 | PASSOU | e2e-e3-02-filtro-ligado.png |
| CA-E11 | Estado vazio filtrado sem sessão vazia | TU-E8, E2E-E3 | PASSOU | e2e-e3-03-estado-vazio-filtrado.png |
| CA-E12 | Filtro acompanha renomear/excluir | TU-E6, TU-E7, E2E-E4 | PASSOU | e2e-e4-05-home-sem-filtro.png |
| CA-E13 | Excluir em 30+ cartões sem mexer em agenda | TI-E2, TI-E3, E2E-E4 | PASSOU | e2e-e4-04-excluir.png (1.000 cartões em 383 ms) |
| CA-E14 | Renomear em A aparece em B após sync | TU-E5, TU-E10, TI-E5, E2E-E5 | PASSOU | e2e-e5-01…03 |
| CA-E15 | Offline e sem conta, persiste ao recarregar | E2E-E6 | PASSOU | e2e-e6-01…05 |
| CA-E16 | 360 px sem rolagem horizontal, escala tipográfica | TU-E9, E2E-E2, E2E-E6 | PASSOU | e2e-e2-02-360px-filtro-chips.png, e2e-e6-0x, qa-390-*.png |

## Testes E2E executados
| ID | Fluxo | Resultado | Observações |
|----|-------|-----------|-------------|
| E2E-11 | Jornada completa sem conta | PASSOU | e2e-11-e5-e6.md |
| E2E-E1 | Campo de etiquetas | PASSOU | Bug de texto colado corrigido na tarefa 5.0; BUG-01 achado nesta QA |
| E2E-E2 | Lista com 5.000 cartões | PASSOU | Não exercitado: limpar filtro ao trocar de baralho; rolagem só por tarefas longas |
| E2E-E3 | "Estudar só…" | PASSOU | Não exercitado: `localStorage` bloqueado (coberto por TU-E7) |
| E2E-E4 | Ajustes → Etiquetas | PASSOU | Falha no meio do lote coberta por TI-E3 |
| E2E-E5 | Dois perfis, Supabase local | PASSOU | Só o perfil de navegador; sem aparelhos físicos |
| E2E-E6 | Offline a 360 px | PASSOU | Defeito de overflow da faixa "Só: …" corrigido na 9.0 |

## Testes automatizados e cobertura
| Camada | ID | Resultado | Validação/comando | Observações |
|--------|----|-----------|-------------------|------------|
| Lint | — | PASSOU | `npm run lint` | sem erros |
| Escala tipográfica | — | PASSOU | `npm run check:type-scale` | sem violações |
| Unidade/Integração | TU-18…20, TU-E1…E12, TI-10, TI-E1…E6 | PASSOU | `npm run test:coverage` | 45 arquivos, 258 testes |
| Build | — | PASSOU | `npm run build` | aviso de orçamento do bundle inicial (≈899 KB vs 500 KB), pré-existente (já registrado no QA de conta-sync) |

- Cobertura de `src/app/domain/**`: 94,93% de instruções, 91,62% de ramos, 92,15% de funções, 96,24% de linhas (meta 80%: atendida). Os arquivos de etiquetas (`tags`, `tag-bulk`, `tag-catalog`, `tag-filter`, `queue-tags`…) ficam em 100% de instruções.

## Acessibilidade
Verificado com a árvore de acessibilidade e `eval` no navegador (nas telas Novo cartão, Cartões, Home e Ajustes → Etiquetas):
- [x] Teclado: Tab, Enter (confirma), Backspace no vazio remove o último chip, setas navegam as sugestões, Escape fecha o diálogo "Estudar só…" e as sugestões.
- [x] Rótulos: combobox "ETIQUETAS", botões "Remover etiqueta X", grupo "Etiquetas" com botões `aria-pressed`, diálogo "Estudar só" com botão "fechar".
- [x] Formulários: campo Etiquetas com `label` associado.
- [x] Mensagens de limite exibidas pelo campo (E2E-E1); contagem da lista em `role=status`/`aria-live=polite`.
- [x] Área de toque: opções de filtro com 44 px de altura.
- [x] Fontes: `check:type-scale` sem violações; chips usam a escala semântica.
- [x] Contraste: tokens do produto (texto `muted` sobre `ink`, sinal com `text-on-signal`); conferido visualmente, sem medição numérica com ferramenta.
- [x] Imagens: a funcionalidade não adiciona imagens.
- Não verificado: leitor de tela real e toque em aparelho físico.

## Responsividade e visual
Capturas `qa-390-*.png` e `qa-1280-*.png` (Home, Cartões, Ajustes → Etiquetas, Novo cartão, "Estudar só…"). `scrollWidth` igual à largura da janela em todas (390 e 1280): sem rolagem horizontal. Estados vazio e com dados cobertos por E2E-E3/E4 e pelas capturas de 360 px da tarefa 9.0.
- Observação (não é defeito do PRD): a 390 px, a lista de Cartões trunca cada chip a poucas letras ("C…", "A…") quando o cartão tem 3 etiquetas, por causa do orçamento de "+N". Atende RF48c ("cabem e +N"), mas reduz a leitura; fica como sugestão de melhoria.

## Bugs encontrados e corrigidos
| ID | Descrição | Severidade | Status | Correção | Teste de regressão | Evidência |
|----|-----------|------------|--------|----------|--------------------|-----------|
| BUG-01 | No campo Etiquetas, digitar e teclar Enter no mesmo quadro (antes de o Angular renderizar) criava o chip, mas o texto ficava no `<input>`; a próxima digitação virava "FGVpeg" e gerou a etiqueta "FGVpegadinha". O binding `[value]` não reescrevia o DOM porque o sinal voltava ao valor já vinculado (`''`). | Média | Corrigido | `add()` em `src/app/ui/tag-input/tag-input.ts` limpa o `value` do `<input>` direto (via `viewChild`), cobrindo Enter, colar, sugestão e blur; Backspace passou a reutilizar `remove()`. Arquivo segue em 100 linhas. | `ui/` fica fora do gate de cobertura (AGENTS.md); regressão validada no navegador: digitar "FGV" + Enter + "peg" deixa o campo com "peg" (antes "FGVpeg"), Backspace remove o chip. Lint e build passam. | fluxo reexecutado no navegador (sem captura) |

## Conclusão
Os 20 critérios de aceitação (CA-24 a CA-27 e CA-E1 a CA-E16) estão atendidos, com lint, escala tipográfica, 258 testes, cobertura de domínio de 94,93% e build de produção passando. Um defeito de interface foi encontrado e corrigido na causa raiz. **Ressalvas conhecidas**: a regressão do BUG-01 foi validada à mão, não por teste automatizado (a camada de UI não tem teste automatizado neste projeto); não houve teste em leitor de tela nem em aparelho físico; o aviso de orçamento do bundle é anterior a esta entrega.
