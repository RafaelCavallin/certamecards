# Relatório de revisão de código — Marca-texto com 3 cores

## Resumo
- Data: 2026-11-27
- Branch: des
- Status: APROVADO COM RESSALVAS

## Conformidade com regras
| Regra | Status | Observações |
|------|--------|-------------|
| `code-standards.md` — arquivos ≤ 100 linhas | OK | Maior arquivo de produção novo ou alterado: `anki-html.ts` (97). `markable-field.ts` ficou em 93 (`mark-editor.ts` e `watch-selection.ts` extraídos). Ver ressalva sobre testes. |
| `code-standards.md` — funções ≤ 30 linhas, ≤ 3 parâmetros | OK | Verificado com a AST do TypeScript em todos os `.ts` de produção alterados: nenhuma violação. No teste, o helper `rgb` de `anki-css-color.test.ts` tem 4 parâmetros (ressalva). |
| `code-standards.md` — sem comentários | OK (corrigido) | Removi 6 comentários que repetiam o nome (`addMark`, `removeMark`, `recolorHighlight`, `marksOf`, `trimRange`, `MarkEditor`). Ficam os que explicam o porquê (`splitByMarks`, `markAt`, `normalizeCardMarks`, `remapRanges`) e os de componente que já existiam. |
| `code-standards.md` — constantes nomeadas, sem segredos | OK | Faixas de matiz, saturação, luminosidade e alpha são constantes em `anki-css-color.ts`. |
| `javascript-typescript.md` — `const`, `===`, sem `any` | OK | Nenhum `any`, `var` nem `==`. Os `let` restantes são reatribuídos (cursores e acumuladores). |
| `tests.md` — todo código com teste | OK | 1.052 testes. Regras novas têm teste e as de compatibilidade (loose schema, precedência) foram conferidas por mutação na execução das tarefas. |
| Estrutura de pastas e dependências | OK | `domain/` sem `@angular/*`, `rxjs`, `state/`, `pages/` ou `ui/`. `ui/` não importa `pages/` nem abre o Dexie. Nomes em kebab-case sem sufixo. |
| Convenções de Angular | OK | Standalone, OnPush, `input()`/`output()`, `@if`/`@for`. Sem NgRx. |
| Estilo visual | OK | Cores só por token (`bg-highlight-*`, `ring-signal`, `text-text`), sem hex; `check:type-scale` limpo. Tokens novos nos dois temas, com teste de contraste e de daltonismo. |
| Regras de domínio | OK | Lacuna só na Frente (`normalizeCardMarks`, também na importação). Nenhum campo FSRS tocado. Limites de `card-limits.ts` inalterados. |
| `supabase/migrations/` | OK | Sem mudança de schema: `highlight` mora no `marks jsonb`. |

## Aderência à TechSpec
| Decisão Técnica | Implementado | Observações |
|-----------------|--------------|-------------|
| Lista `highlight` com `color`, opcional no tipo, sem upgrade do Dexie | SIM | `Marks.highlight?`; normalização nas fronteiras. |
| Compatibilidade para frente (`looseObject`, `remapMarks` genérico, spreads) | SIM | Cor e tipos desconhecidos preservados; cor desconhecida exibida como amarelo. |
| Texto do marca-texto sempre em `text` | SIM | `<mark class="… text-text">`. |
| Lacuna só com moldura (`ring`) | SIM | `CLOZE_FRAME` no formulário e na revisão. |
| `<mark>` na revisão | SIM | `marked-text.html`. |
| Teclado na barra (blur com `relatedTarget` dentro do host) | SIM | `onFocusOut` + `MarkEditor.refocus`. |
| Importação do Anki por faixa de matiz e precedência lacuna > marca-texto > destaque | SIM | `anki-css-color.ts`, `anki-marks.ts`, `anki-cloze.ts`. |
| Sem sobreposição | SIM | `splitByMarks` inalterado; a importação subtrai faixas antes de gravar. |
| Bolinhas de 44 px, `aria-label` com ação e cor, `min-h-11` na barra | SIM | `highlight-swatches`, `mark-actions`. |

## Tarefas verificadas
| Tarefa | Status | Observações |
|------|--------|-------------|
| 1.0 Modelo e integridade | COMPLETA | Subtarefas e testes marcados; arquivos presentes. |
| 2.0 Tokens e testes de cor | COMPLETA | `tokens.css`, `theme-light.css`, `theme-highlight.test.ts`. |
| 3.0 Sync, backup e fixtures | COMPLETA | `sync-rows-marks.ts` loose; testes de sync e backup. |
| 4.0 Exibição | COMPLETA | E2E-03 e E2E-04 com evidências. |
| 5.0 Edição | COMPLETA | E2E-01, E2E-02 e E2E-05 com evidências. |
| 6.0 Importação do Anki | COMPLETA | TU-20 a TU-25 e TI-07. |
| 7.0 Validação final | COMPLETA | E2E-06 a E2E-09 executados (E2E-07 com o `certamecards-dev` religado); TechSpec-base e PRD-base atualizados. |

Nenhuma subtarefa ou teste da entrega ficou desmarcado.

## Testes
- Total de testes: 1.052 em 145 arquivos
- Passando: 1.052
- Falhando: 0
- Cobertura: `src/app/domain/**` com 98,4% de linhas, 93,52% de ramos e 98,77% de funções (piso de 80%).
- `npm run lint` e `npm run check:type-scale`: sem violações. `npm run build`: ok, com o aviso de orçamento do bundle inicial (920 kB contra 500 kB), que já existia.
- Casos `E2E-*` não foram executados nesta revisão (ficam para o `/executar-qa`); os da entrega foram executados na tarefa 7.0.

## Problemas encontrados
| Severidade | Arquivo | Linha | Descrição | Sugestão |
|------------|---------|-------|-----------|----------|
| Baixa (corrigido) | `mark-editing.ts`, `text-marks.ts`, `text-marks-selection.ts`, `mark-editor.ts` | — | Comentários que só repetiam o nome da função, contra a regra 1 de `code-standards.md`. | Removidos. |
| Baixa (corrigido) | `mark-editing.test.ts`, `anki-html.test.ts` | — | Os dois arquivos passaram de 100 linhas ao receber os testes novos (118 e 145). | Suítes de `recolorHighlight` e de cor de fundo movidas para `mark-editing-recolor.test.ts` e `anki-html-background.test.ts` (o segundo entrou em `DOM_TESTS` no `vitest.config.ts`). Agora 96, 98, 27 e 49 linhas. |
| Média | `anki-dedupe.ts` | 11–17 | A chave de deduplicação ignora `highlight`, e a lacuna do Verso e o negrito sob um fundo colorido mudam com a nova precedência. Reimportar um baralho já importado, com um trecho em negrito e fundo ao mesmo tempo, gera um cartão duplicado. Em sentido contrário, dois cartões que só diferem na cor do marca-texto são tratados como iguais. A TechSpec não trata disso. | Decidir com o Rafael: incluir `highlight` na chave (e aceitar a duplicação dos baralhos antigos) ou manter a chave e documentar a limitação. Não corrigi porque muda o contrato de deduplicação. |
| Baixa | `anki-cloze.test.ts`, `card-draft.test.ts` | — | Passam de 100 linhas (113 e 122). O segundo já passava (108). `backup-manifest.test.ts` (170) e `cards.test.ts` (107) também, e não foram tocados. | Dividir por assunto quando alguém mexer neles de novo. |
| Baixa | `anki-css-color.test.ts` | 5 | O helper `rgb` tem 4 parâmetros (limite de 3). | Receber um objeto `{ r, g, b }`. |
| Baixa | `anki-html.ts` | 80–84 | Um `<mark style="background:white">` vira amarelo (cor neutra ignorada e `mark` sem cor cai no padrão). Um filho com fundo neutro dentro de um pai colorido mantém a cor do pai. Os dois casos seguem a regra “neutros são ignorados”, mas divergem do que o Anki desenharia. | Aceitável; registrar se aparecer em baralho real. |

## Pontos positivos
- Compatibilidade para frente tratada no domínio: marcas e cores desconhecidas atravessam normalização, remapeamento, edição, sync e backup sem perda.
- A cor vem de tokens com teste de contraste e de daltonismo (OKLab, matrizes protan e deutan) nos dois temas.
- Importação isolada em módulos pequenos (`anki-css-color`, `anki-runs`, `anki-marks`), com a precedência testada em notas básicas e de lacuna.
- O blur que perdia a seleção virou correção para as três ações da barra, usáveis por teclado.
- Medição de desempenho com 5.000 cartões: rolagem igual à do conjunto sem marcas e resposta de 27 ms em média.

## Recomendações
- Decidir a questão da chave de deduplicação antes de um uso real da importação com cores.
- Na barra de ações a 360 px (3 linhas, 135 px), avaliar no QA se o deslocamento do formulário incomoda.
- Validar o `box-decoration-break` num WebKit/iPhone, pendente do E2E-03.
- Validar o recarregamento sem rede no preview da `des` (o `ng serve` não tem service worker).

## Conclusão
A implementação segue a TechSpec e as regras do projeto. Lint, `check:type-scale`, 1.052 testes com 98,4% de cobertura no domínio e o build passam depois das correções desta revisão (comentários redundantes e dois testes grandes demais). Não há bloqueadores. A ressalva que precisa de decisão é a chave de deduplicação da importação do Anki. Veredito: **APROVADO COM RESSALVAS**.
