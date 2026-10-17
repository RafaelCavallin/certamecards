# Relatório de revisão de código — Imagens nas Notas

## Resumo
- Data: 2026-10-01
- Branch: des
- Status: APROVADO COM RESSALVAS

## Conformidade com regras
| Regra | Status | Observações |
|------|--------|-------------|
| code-standards.md (tamanho, guardas, constantes, segredos) | OK | Nenhum arquivo novo ou alterado em `src/` passa de 100 linhas (`.ts` e `.html` contados separados). Sem segredos. |
| code-standards.md (sem comentários) | OK | Dois JSDoc novos sem “porquê” (`guards.ts`, `card-form.ts`) foram removidos na revisão. Restam só comentários que explicam workaround (`dirty-tracking.ts`, `src/test/setup.ts`). |
| javascript-typescript.md | OK | Nenhum `any`, `var`, `==` ou `!=` nos arquivos alterados. |
| tests.md | OK | Todo módulo novo de `domain/` tem `.test.ts`. |
| Estrutura de pastas e dependências | OK | `domain/` sem `@angular/*` nem `rxjs`. `pages/` e `ui/` só importam tipos de `domain/db`. Nenhum `liveQuery()` fora de `state/live-query.ts`. |
| Convenções de Angular | OK | Standalone, `@if`/`@for`, `input()`/`output()`/`model()`. |
| Estilo visual | OK | `check:type-scale` sem violações. Sem hex nem `text-xs` em templates. |
| Regras de domínio | OK | Lacuna só na Frente, FSRS só no `scheduler`, limites em `card-limits.ts`. |
| Migrations | OK | Nenhuma migration alterada ou criada. Nenhuma coluna nova em `cards`/`decks`/`user_settings`. |

## Aderência à TechSpec
| Decisão Técnica | Implementado | Observações |
|-----------------|--------------|-------------|
| Metadados e arquivo em tabelas separadas (`db-types`, Dexie v2) | SIM | |
| Rascunho em memória e uma transação ao salvar (`gallery-draft`, `card-draft`, `card-save`) | SIM | |
| Compressão em `image-codec`/`image-compress` | SIM | |
| Envio em três fases e tombstone por cartão excluído | SIM | `sync-pull-images`, `image-sync-push`, `local-data` |
| Download sob demanda e `ImagePrefetch` | SIM | |
| Visualizador com `@panzoom/panzoom` e `viewer-input` puro | SIM | `panzoom` só em `image-viewer.ts`, via `import()` dinâmico |
| Reordenação com `@angular/cdk/drag-drop` | SIM | |
| Aviso “Descartar alterações?” (`confirmLeave`, `canLeave`) | SIM | |
| Contador e pendências em Ajustes | SIM | |

## Tarefas verificadas
| Tarefa | Status | Observações |
|------|--------|-------------|
| 1.0 a 7.0 | COMPLETA | Código e testes presentes. |
| 8.0 Validação final | COMPLETA | Os quatro comandos de validação passaram. Os roteiros E2E ficam com o `/executar-qa`. |

## Testes
- Total de testes: 584 (90 arquivos)
- Passando: 584
- Falhando: 0
- Cobertura de `src/app/domain/**`: 97,58% de instruções, 91,81% de ramos, 97,28% de funções e 98,36% de linhas (piso de 80% atendido)
- `npm run lint`: sem erros. Reexecutado depois da remoção dos comentários.
- `npm run check:type-scale`: sem violações.
- `npm run build`: sucesso, com o aviso abaixo.

## Problemas encontrados
| Severidade | Arquivo | Linha | Descrição | Sugestão |
|------------|---------|-------|-----------|----------|
| Baixa | `angular.json` (orçamento inicial) | 44 | O build avisa que o bundle inicial tem 914 kB, acima do orçamento de 500 kB (o erro só vem em 1 MB). Não verifiquei o tamanho antes desta entrega, então não sei quanto dele vem das imagens. | Conferir se o `main` (593 kB) ganhou código do editor de imagens e, se sim, carregá-lo sob demanda. |
| Baixa | `src/app/ui/card-form/card-form.ts`, `src/app/state/guards.ts` | — | Dois JSDoc novos violavam “sem comentários”. | Corrigido. |

## Pontos positivos
- Camadas respeitadas: o `panzoom` e o canvas ficam isolados, e o Dexie só é aberto em `domain/`.
- Cobertura alta nos módulos novos de `domain/`.
- Compressão e recodificação removem EXIF/GPS.
- Falhas de imagem não abortam a sincronização de texto.

## Recomendações
- Executar os roteiros E2E-18 e E2E-I6 a E2E-I9 no `/executar-qa`.
- Acompanhar o tamanho do bundle inicial.

## Conclusão
Os testes passam, a cobertura está acima do piso e o código segue as rules e a TechSpec. Os únicos achados foram dois comentários, já removidos, e o aviso de orçamento do bundle, que não bloqueia. Veredito: **APROVADO COM RESSALVAS**.
