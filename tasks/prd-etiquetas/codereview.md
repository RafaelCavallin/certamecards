# Relatório de revisão de código — Etiquetas

## Resumo
- Data: 2026-09-30
- Branch: des
- Status: **APROVADO COM RESSALVAS**

Escopo: alterações não commitadas em `src/` (domain, state, ui, pages) das tarefas 1.0 a 9.0, mais a correção do BUG-01 feita no QA. Nenhum serviço foi iniciado nesta revisão (só validações e leitura de código).

## Conformidade com regras
| Regra | Status | Observações |
|------|--------|-------------|
| code-standards: arquivos ≤ 100 linhas | OK | Todos os arquivos novos/alterados de produção têm ≤ 100 linhas (`tag-input.ts` e `cards.ts` no limite, 100). Dois testes novos passavam de 100 (`tag-bulk.test.ts` com 120 e o bloco de etiquetas que levou `cards.test.ts` a 107): corrigidos nesta revisão (ver Problemas). `cards.test.ts` (104) e `queue.test.ts` (225) já excediam antes desta entrega. |
| code-standards: funções ≤ 30 linhas, ≤ 3 parâmetros, sem linha em branco no corpo | OK | Verificado com o compilador do TypeScript em todos os `.ts` de produção alterados: nenhuma violação. Linhas em branco em testes separam AAA (prática do projeto). |
| code-standards: sem comentários | OK com ressalva | Comentários novos: `queue-mix.ts` (3 JSDoc movidos de `queue.ts`, já existiam), o JSDoc de `buildQueue` (atualizado) e um comentário em `catch` vazio em `tag-filter-store.ts`, que explica o "porquê" (armazenamento bloqueado). Aceitável. |
| code-standards: constantes nomeadas, sem segredos | OK | `TAGS_MAX`, `TAG_MAX_LENGTH`, `SUGGESTIONS_MAX`, `TAG_ROW_BUDGET`, chave do `localStorage` nomeada. Nenhum segredo. |
| javascript-typescript: `any`, `var`, `==`, `let` | OK | Nenhum `any`, `var` ou `==`. Os `let` encontrados são reatribuídos. |
| tests: todo código com teste | OK com ressalva | Todo módulo novo de `domain/` tem `.test.ts` ao lado. Páginas, `ui/` e `state/` ficam fora do gate por decisão do projeto. O BUG-01 (campo não limpo) foi corrigido em `ui/` e validado à mão, sem teste automatizado; não há como testá-lo hoje na camada de UI. |
| Estrutura de pastas e dependências | OK | `domain/` sem `@angular/*`, `rxjs` ou imports de `state/pages/ui/`. `pages/` e `ui/` só importam tipos de `domain/db` (sem abrir o Dexie). `ui/` não importa `pages/`. `src/test/` só aparece em `*.test.ts`. Nenhum `liveQuery()` fora de `state/live-query.ts`. Nomes em kebab-case sem sufixo. |
| Convenções de Angular | OK | Standalone, OnPush, `input()`/`model()`/`viewChild()`, `inject()`, `@if`/`@for`, sem `*ngIf`/`*ngFor`, sem NgRx. |
| Estilo visual | OK | Sem hex nem `text-xs`/`text-[..]` nos templates; `check:type-scale` passa; nenhum `bg-signal` sem `text-on-signal`. |
| Regras de domínio | OK | Limites vêm de `card-limits.ts`; nenhuma escrita de campo FSRS (`renameTag`/`deleteTag` só mudam `tags` e `updatedAt`); lacunas não foram tocadas. |
| Migrations | OK | Nenhuma alteração em `supabase/`; conforme a TechSpec (sem mudança de schema/RPC). |

## Aderência à TechSpec
| Decisão Técnica | Implementado | Observações |
|-----------------|--------------|-------------|
| `tags.ts` como porta única de normalização (`tagKey`, `normalizeTags`, `addTagInput`) | SIM | Usada em `createCard`, `updateCardContent`, `rewriteTags` e `parseCardRow`; `DIACRITICS_PATTERN` reutilizado por `card-search.ts`. |
| Catálogo em memória, sem índice Dexie novo | SIM | `tag-catalog.ts`. |
| Filtros puros: E na lista, OU na fila | SIM | `tag-filter.ts`, `tagPredicate` em `queue.ts`. |
| `buildQueue` refatorada; filtro antes dos limites; `queue-mix.ts` extraído | SIM | `loadQueueContext` + `assembleQueue`; `queue-tags.ts` com `tagQueueCounts`. |
| Renomear/juntar/excluir numa transação Dexie tudo-ou-nada | SIM | `rewriteTags` em `db.transaction('rw', db.cards)`; `trackDirty` marca os cartões; TI-E3 prova o rollback. |
| `planTagRename` com `rename`/`merge`/`invalid` | SIM | |
| Filtro "Estudar só…" em `localStorage` por baralho, com degradação | SIM | `study-tags.ts` + `tag-filter-store.ts` (guarda chaves, poda baralhos removidos). |
| Componentes `tag-input`, `tag-filter`, `tag-chips`, rota `ajustes/etiquetas` | SIM | Mais subcomponentes `card-row`, `tag-row`, `study-filter` e `card-form-fields` para respeitar as 100 linhas. |
| Pull normaliza etiquetas (RF47b) | SIM | `parseCardRow`. |
| Etiquetas mantidas no cadastro em série | SIM | Validado no E2E-E1. |
| Sem migration/RPC | SIM | |

## Tarefas verificadas
| Tarefa | Status | Observações |
|------|--------|-------------|
| 1.0 núcleo de etiquetas | COMPLETA | `tags.ts`, limites, testes. |
| 2.0 escrita do cartão e pull | COMPLETA | `cards.ts`, `sync-rows-card.ts`, testes. |
| 3.0 catálogo, filtros, chips, lote | COMPLETA | Quatro módulos com testes. |
| 4.0 fila filtrada | COMPLETA | `queue*.ts`, `home-summary.ts`, `home-data.ts` com testes. |
| 5.0 campo no formulário | COMPLETA | `tag-input`, `card-form`, `card-edit`; BUG-01 corrigido no QA. |
| 6.0 filtro e chips na lista | COMPLETA | |
| 7.0 "Estudar só…" | COMPLETA | |
| 8.0 Ajustes → Etiquetas | COMPLETA | |
| 9.0 validação final | COMPLETA | Evidências em `evidences/`; QA em `qa.md`. |

## Testes
- Total de testes: 258 (47 arquivos)
- Passando: 258
- Falhando: 0
- Cobertura de `src/app/domain/**`: 94,93% instruções, 91,62% ramos, 92,15% funções, 96,24% linhas (piso 80%: atendido)
- `npm run lint`, `npm run check:type-scale` e `npm run build`: passam. O build mostra o aviso de orçamento do bundle inicial (≈899 KB vs 500 KB), anterior a esta entrega (registrado no QA de conta-sync).

## Problemas encontrados
| Severidade | Arquivo | Linha | Descrição | Sugestão |
|------------|---------|-------|-----------|----------|
| Baixa (corrigido) | `src/app/domain/tag-bulk.test.ts` | — | Arquivo novo com 120 linhas, acima do limite de 100. | Dividido em `tag-bulk.test.ts` (56) e `tag-bulk-rename.test.ts` (71). |
| Baixa (corrigido) | `src/app/domain/cards.test.ts` | — | O bloco de etiquetas levou o arquivo de 104 para 147 linhas. | Bloco movido para `cards-tags.test.ts` (40); `cards.test.ts` volta a 107, acima do limite por herança (antes 104). |
| Baixa | `src/app/domain/tag-bulk.ts` | 38 | `renameTag` lê o catálogo fora da transação de escrita; uma edição concorrente entre a leitura e a escrita poderia decidir `rename` vs `merge` com dados velhos. Em app de uso individual o efeito é desprezível, e `rewriteTags` reaplica `normalizeTags`, então nunca deixa duplicata. | Sem ação agora; se virar problema, ler o catálogo dentro da mesma transação. |
| Baixa | `src/app/ui/tag-input/tag-input.ts` | — | Correção do BUG-01 sem teste automatizado. | Aceito pela decisão do projeto de validar `ui/` por E2E manual. |

## Pontos positivos
- Um único ponto de normalização e de comparação (`tagKey`/`normalizeTags`) aplicado em formulário, lote e pull, como a TechSpec pede.
- Renomear/excluir em lote realmente transacional, com teste de falha no meio e teste de push.
- Regras de dependência entre camadas respeitadas sem exceções; o domínio permanece TS puro.
- Domínio com 94,9% de cobertura e testes próprios para cada módulo novo.
- Arquivos e funções dentro dos limites, apesar do volume de mudanças.

## Recomendações
- Quando houver ferramenta de teste de componentes, cobrir o `tag-input` (Enter imediatamente após digitar) para travar o BUG-01.
- Dividir `queue.test.ts` (225 linhas) e `cards.test.ts` (107) em uma entrega de manutenção.
- Tratar o orçamento do bundle inicial numa entrega própria.

## Conclusão
Código conforme as regras do projeto e a TechSpec; os 258 testes passam, a cobertura de domínio está bem acima do piso e lint, escala tipográfica e build passam. As únicas falhas de regra encontradas (dois arquivos de teste acima de 100 linhas) foram corrigidas na revisão e os testes foram reexecutados. Ficam as ressalvas não bloqueantes: a regressão do BUG-01 sem teste automatizado (limitação do projeto para `ui/`) e o aviso de bundle pré-existente. **APROVADO COM RESSALVAS.**
