# Relatório de revisão de código — Difíceis e reforço

## Resumo
- Data: 2026-10-01
- Branch: des
- Status: APROVADO COM RESSALVAS

## Conformidade com regras
| Regra | Status | Observações |
|------|--------|-------------|
| code-standards.md (arquivos ≤ 100 linhas, funções ≤ 30, ≤ 3 parâmetros, constantes nomeadas) | OK | Maior arquivo da entrega: `difficulty.ts` (91). Todos os `.ts` e `.html` novos ficam abaixo de 100. Constantes em `difficulty.ts` e `reinforce.ts`. |
| code-standards.md (sem comentários) | NOK (baixa) | `state/live-query.ts` tem JSDoc em `liveQueryFor`. O de `liveQuerySignal` já existia. |
| javascript-typescript.md | OK | Nenhum `any` nem `==`. `let` só em contador de laço e em estado de `effect` (`difficult.ts`, `reinforce.ts`). |
| tests.md | OK | Todo módulo novo de `domain/` tem `.test.ts`, incluindo `reinforce-readonly.test.ts` (TI-11). |
| Estrutura de pastas e dependências | OK | `domain/` sem Angular/rxjs. `liveQuery()` só em `state/live-query.ts`. `ui/` não importa `pages/`. |
| Convenções de Angular | OK | Standalone, `inject()`, `input()`/`output()`, `@if`/`@for`, `ReinforceSession` com escopo de página, `withComponentInputBinding()` ligado. |
| Estilo visual | OK | `check:type-scale` sem violações. |
| Regras de domínio | OK | O reforço não escreve nada: não importa `scheduler`, `db` (exceto tipos) nem módulos de escrita, e há regra de lint para isso. A edição de texto passa só por `updateCardContent`. |
| Migrations e sync | OK | Sem schema, migration, RPC nem mudança em `sync-rows`. |

## Aderência à TechSpec
| Decisão Técnica | Implementado | Observações |
|-----------------|--------------|-------------|
| Módulos de `domain/` (`difficulty`, `difficulty-data`, `days-ago`, `tag-param`, `reinforce`, `review-keys`) | SIM | Contratos conforme a TechSpec. |
| Leitura em duas fases, `equals` em transação | SIM | Conforme a decisão medida na TechSpec. |
| `liveQueryFor` em `live-query.ts` | SIM | `toObservable` + `switchMap`, `undefined` durante o carregamento. |
| Máquina de estados imutável | SIM | `answerReinforce` e `dropMissing` não alteram a entrada. |
| `revealed` zerado dentro de `answer` | SIM | Trava a resposta dupla. |
| Rotas `/dificeis` e `/reforco`, menu, atalho da Home | SIM | Rotas com `requireDeck`. |
| Regra de lint do reforço | SIM | Bloco `no-restricted-imports` em `eslint.config.js`. |
| `AGENTS.md` atualizado (`liveQueryFor`) | SIM | Linhas 39 e 42. |

## Tarefas verificadas
| Tarefa | Status | Observações |
|------|--------|-------------|
| 1.0 Regra de dificuldade | COMPLETA | Código e testes presentes. |
| 2.0 Sessão pura | COMPLETA | Código e testes presentes, incluindo TI-11. |
| 3.0 Refatoração da revisão | COMPLETA | `review.ts` com 64 linhas e `review.html` com 38. |
| 4.0 Tela Difíceis | COMPLETA | Página, linha, atalho da Home e rota. |
| 5.0 Reforço | COMPLETA | Página, resumo, sessão e lint. |
| 6.0 Validação final | COMPLETA | `qa.md` e `evidences/` existem. Os E2E não foram reexecutados nesta revisão. |

## Testes
- `npm run lint`: passou.
- `npm run check:type-scale`: sem violações.
- `npm run test:coverage`: 54 arquivos, 309 testes. Passando: 309. Falhando: 0.
- Cobertura: 96,65% de linhas em `domain/**`, acima do piso de 80%.
- `npm run build`: passou, com um aviso de orçamento.

## Problemas encontrados
| Severidade | Arquivo | Linha | Descrição | Sugestão |
|------------|---------|-------|-----------|----------|
| Baixa | src/app/state/live-query.ts | 14-17 | JSDoc novo contraria a regra "sem comentários". | Remover o comentário, o nome já diz o que a função faz. |
| Baixa | angular.json (build) | — | O build avisa que o bundle inicial excede o orçamento de 500 kB (902 kB). Não verifiquei se o aviso já existia antes desta entrega. | Confirmar a origem do aviso. Se vier desta entrega, usar `loadComponent` em `difficult` e `reinforce`. |

## Pontos positivos
- A garantia de "não grava nada" tem duas camadas: lint e teste de integração com retrato do banco.
- O domínio é puro e bem coberto, com `now` e `random` injetáveis.
- A refatoração da revisão extraiu `session-shell`, `card-edit-dialog` e `review-keys` e deixou `review.*` menor.
- Nenhum arquivo ultrapassa 100 linhas.

## Recomendações
- Corrigir os dois itens de severidade baixa acima, sem urgência.
- Rodar o `/executar-qa` antes da promoção para a `prod`.

## Conclusão
Os quatro comandos de validação passaram, a cobertura está acima do piso e a implementação segue a TechSpec sem desvios. Os dois problemas encontrados são de severidade baixa e não bloqueiam. Veredito: **APROVADO COM RESSALVAS**.
