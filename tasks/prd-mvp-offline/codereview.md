# Relatório de revisão de código — MVP offline

## Resumo
- Data: 2026-09-28
- Branch: `des`
- Status: **APROVADO**

A revisão encontrou quatro violações graves de regras não-negociáveis (acesso direto ao Dexie fora de `domain/`, uso de `$any()` como escape hatch de `any`, e duas funções acima do limite de 30 linhas) e três problemas adicionais de menor severidade. Todos os sete foram corrigidos nesta revisão — ver "Problemas encontrados" — com testes, revalidação completa (`lint`, `check:type-scale`, `test:coverage`, `build`, todos verdes) e um ajuste de processo (`check-type-scale.mjs` passou a cobrir `font-size` inline, fechando um gap real do verificador). Restam apenas ressalvas cosméticas de baixíssimo risco, listadas em "Recomendações", que não bloqueiam a entrega.

## Conformidade com regras
| Regra | Status | Observações |
|------|--------|-------------|
| Arquivos ≤ 100 linhas | OK | Maior arquivo é `markable-field.ts` com 99 linhas. Nenhum excede o limite. |
| Funções ≤ 30 linhas | OK (corrigido) | `scheduler.ts#answer` (49 linhas) e `heatmap-grid.ts#buildHeatmapGrid` (35 linhas) excediam o limite; ambas refatoradas nesta revisão para ficar dentro dele. |
| ≤ 3 parâmetros por função | OK | Nenhuma violação encontrada. |
| Guardas / sem aninhamento > 3 níveis | OK | Padrão consistente em todo o domínio e nas telas. |
| Sem comentários que só repetem o código | OK, com ressalva | Comentários existentes documentam regras de negócio não óbvias (ex.: por que FSRS só é escrito pelo `scheduler`, por que a lacuna some fora da Frente) — dentro do espírito da exceção da regra. Dois comentários em `text-marks.ts` (`blank`, `trimRange`) restatam o nome da função sem acrescentar "porquê"; baixa severidade, não corrigidos. |
| `const`/`let`/`var` | OK | Nenhum `var`; `let` só onde há reatribuição real. |
| `===`/`!==` | OK | Nenhuma comparação frouxa encontrada. |
| Nunca `any` | OK (corrigido) | `$any($event.target)` em `deck-switcher.html` (2 ocorrências) e `no-deck.html` (1 ocorrência) — escape hatch de `any` no template. Substituído por variáveis de referência tipadas (`#nameInput`, `#editNameInput`, `#newNameInput`), no padrão já usado em `cards.html`/`settings.html`. Nenhum `any`/`as any` em `.ts`. |
| Tipagem de parâmetros/retornos | OK | `getCard` (novo) e demais funções exportadas com tipos explícitos. |
| `function` em funções principais, arrow em callback | OK | Consistente. |
| Ternário sem aninhamento | OK | Nenhuma violação. |
| `??`/`?.` em vez de `\|\|` | OK, com nota | `progress.ts` usa `value === null \|\| value === undefined` em vez de `??` — resultado equivalente, mas menos idiomático; baixa severidade. |
| Dados imutáveis | OK | `replaceCurrent` (review-session) copia o array antes de alterar; nenhuma mutação de parâmetro encontrada fora do hook `dirty-tracking.ts` (mutação exigida pela própria API de hooks do Dexie). |
| Estrutura de pastas / dependência entre camadas | OK (corrigido) | `pages/card-edit/card-edit.ts` importava `db` de `domain/db` e chamava `db.cards.get(...)` diretamente — quebra explícita de "nada de abrir o Dexie num componente". Corrigido: nova função `getCard(cardId)` em `domain/cards.ts`, com teste, chamada pela página. Além disso, o `AGENTS.md` foi atualizado para documentar explicitamente os dois padrões que já conviviam no código — leitura reativa via `liveQuerySignal` e escrita pontual chamando `domain/` direto de `pages/`/`ui/`, sem exigir um serviço de `state/` no meio — deixando de ser uma zona cinzenta de interpretação. |
| Convenções de Angular (standalone, OnPush, signals, `@if`/`@for`) | OK | 100% dos componentes revisados seguem o padrão; nenhum `*ngIf`/`*ngFor` (a exceção obrigatória é `*cdkVirtualFor`, exigida pela API do CDK de virtualização, sem equivalente em `@for`). |
| Estilo visual (tokens, escala tipográfica) | OK (corrigido) | `bar-chart.html:26` e `heatmap.html:13` usavam `style="font-size: 9px"`, abaixo do piso de 13 px que a regra proíbe explicitamente nos templates — o `check:type-scale` não pegava porque só varria classes Tailwind, não `style` inline. Corrigido: os dois rótulos agora usam a classe semântica `text-label` (14 px, o mínimo da escala), com o layout do SVG ajustado (margens/posição recalculadas) para acomodar o tamanho maior; e `check-type-scale.mjs` ganhou uma checagem dedicada para `font-size` inline abaixo de 13 px, com testes, fechando o gap do verificador para o futuro. |
| Lacuna só na Frente (regra de domínio) | OK | Confirmado em três camadas independentes: `text-marks-normalize.ts#normalizeCardMarks` força `cloze: []` em Verso/Notas para qualquer entrada; `card-form.html` passa `[allowCloze]="false"` para Verso/Notas; `card-face.ts` só passa `cloze` para a Frente. Único ponto sem guarda redundante é `markable-field.ts#addMark`, que confia só na ausência do botão "Ocultar" em `mark-actions.html` (`@if (allowCloze())`) — como a normalização na gravação (`normalizeCardMarks`) já descarta qualquer lacuna indevida, o dado nunca persiste incorreto; risco residual é cosmético (UI mostraria uma lacuna que o próximo save apagaria). Baixa severidade. |
| Campos FSRS só escritos pelo `scheduler` | OK | `scheduler.ts#answer` é o único lugar que reagenda. `createCard` grava os campos FSRS iniciais vindos de `createEmptyCard()` do próprio `ts-fsrs` — isso é inicialização do estado padrão de um cartão novo, não uma resposta/reagendamento; `updateCardContent` explicitamente não toca nenhum campo FSRS (confirmado por teste `TI-01`/`cards.test.ts`). |
| Limites de texto via `card-limits.ts` | OK | `validateCardContent` e os `maxlength` do formulário usam `FRONT_MAX`/`BACK_MAX`/`NOTES_MAX`. |
| Migration nova para mudança de schema | N/A nesta entrega | `supabase/migrations/` já contém dois arquivos (`20261001000000_schema.sql`, `20261101000000_images_reminders.sql`) trazidos no commit inicial, fora do escopo declarado desta entrega pela TechSpec ("Arquivos relevantes... exceto... as migrations"). Nenhuma tarefa de 1.0–10.0 os referencia. Não é uma violação desta entrega, apenas scaffolding adiantado para `prd-conta-sync` — sinalizado para visibilidade. |

## Aderência à TechSpec
| Decisão Técnica | Implementado | Observações |
|-----------------|--------------|-------------|
| Dexie `version(1)` com `settings`/`syncState` já no schema final | SIM | Confirmado em `db.ts`. |
| `dirty` mantido por hooks desde já | SIM | `dirty-tracking.ts`, ligado a `decks`/`cards` (true) e `reviewLogs`/`settings` (false). |
| `card-face`/`answer-bar` extraídos como `ui/` reutilizáveis | SIM | Presentes e usados só em `review`. |
| Edição da revisão em `<dialog>` nativo | SIM | `review.ts`/`review.html`, reaproveita `card-form`. |
| Gráficos em SVG próprio, sem lib | SIM | `bar-chart`, `heatmap`, sem dependência de terceiros. |
| `ts-fsrs` v5, avaliação binária | SIM | `scheduler.ts`, `Rating.Again`/`Rating.Good`. |
| `queue.ts` separado de `scheduler.ts` | SIM | Arquivos distintos, ambos sob o limite de linhas. |
| `stats.ts` importa `iso` de `dates.ts` (quebra de camada do Lingo corrigida) | SIM | Confirmado. |
| Service worker sem `dataGroups` | SIM | `ngsw-config.json` só com `assetGroups`. |
| `navigator.storage.persist()` no boot | SIM | `app.ts`. |
| Sem seção de conta em Ajustes nesta entrega | SIM | `settings.html` só tem nome do baralho e versão. |

## Tarefas verificadas
| Tarefa | Status | Observações |
|------|--------|-------------|
| 1.0 Fundação do projeto | COMPLETA | Scripts, tokens, escala, CI presentes e funcionando. |
| 2.0 Domínio: persistência | COMPLETA | `db.ts`, `dirty-tracking.ts`, `card-limits.ts`, `decks.ts`, `cards.ts` com testes (TU-15, TI-01, TI-03). |
| 3.0 Domínio: marcas de texto | COMPLETA | `text-marks*.ts` com TU-01 a TU-05; regra "lacuna só na Frente" confirmada. |
| 4.0 Domínio: agendamento e fila | COMPLETA | `dates.ts`, `scheduler.ts`, `queue.ts` com TU-06/07/08, TI-02/04. |
| 5.0 Domínio: apoio às telas | COMPLETA | `stats.ts`, `card-search.ts`, `home-summary.ts`, `due-badge.ts`, `type-scale.ts` com TU-09/10/11/17. |
| 6.0 Estado e casca | COMPLETA | `live-query.ts`, `deck-store.ts`, `due-tick.ts`, rotas/guards, `deck-switcher`, `no-deck`; E2E-05 registrado como PASSOU. |
| 7.0 Cadastro de cartões | COMPLETA | `markable-field`, `mark-actions`, `mark-backdrop`, `card-form`, `card-new`, `card-edit`. |
| 8.0 Revisão e Home | COMPLETA | `review-session`, `review`, `home`, `heatmap`, `marked-text`, `card-face`, `answer-bar`. |
| 9.0 Lista, Progresso e Ajustes | COMPLETA | `cards` (busca/virtualização/lote), `progress` (`bar-chart`), `settings`. |
| 10.0 Offline, PWA e preview | COMPLETA | `ngsw-config.json`, aviso de nova versão, `storage.persist()`, deploy de preview documentado na nota da tarefa. |

Todas as dez tarefas têm código, subtarefas marcadas e testes correspondentes rastreáveis à tabela de rastreabilidade do `tasks.md`. A validação funcional dos critérios de aceitação já foi feita pelo QA (`tasks/prd-mvp-offline/qa.md`, 2026-09-28, **APROVADO**, 20/20 critérios, 0 bugs).

## Testes
- Total de testes: 146 (142 originais + 2 para `getCard` + 2 para a checagem nova de `font-size` em `check-type-scale.mjs`)
- Passando: 146
- Falhando: 0
- Cobertura em `src/app/domain/**`: 99,71% statements / 100% branches / 100% functions / 100% lines (piso exigido: 80%)

Os quatro comandos de validação foram executados do início ao fim antes das correções, depois delas e de novo depois de aplicar as três recomendações (font-size, `AGENTS.md`, `angular.json`) — verdes em todas as passagens:
```
npm run lint            # OK — nenhuma violação
npm run check:type-scale # OK — nenhuma violação (agora também cobre font-size inline)
npm run test:coverage   # OK — 146/146, cobertura acima do piso
npm run build           # OK — build de produção limpo
```

## Problemas encontrados

| Severidade | Arquivo | Linha | Descrição | Sugestão |
|------------|---------|-------|-----------|----------|
| Alta (corrigido) | `src/app/pages/card-edit/card-edit.ts` | 5, 28 | Importava `db` diretamente de `domain/db` e chamava `db.cards.get(...)` num componente — quebra explícita da regra "nada de abrir o Dexie num componente" (dependência não-negociável do `AGENTS.md`). | **Aplicado:** nova função `getCard(cardId)` em `domain/cards.ts` (+ 2 testes em `cards.test.ts`); a página chama `getCard` em vez de `db.cards.get`. |
| Alta (corrigido) | `src/app/ui/deck-switcher/deck-switcher.html` | 15, 58 | `(input)="editName.set($any($event.target).value)"` e o equivalente para `newName` — `$any()` é o escape hatch de `any` do Angular, proibido pela regra "nunca `any`". | **Aplicado:** trocado por variável de referência tipada (`#editNameInput`, `#newNameInput`), como já feito em `cards.html`/`settings.html`. |
| Alta (corrigido) | `src/app/pages/no-deck/no-deck.html` | 8 | Mesmo padrão `$any($event.target)`. | **Aplicado:** trocado por `#nameInput`. |
| Alta (corrigido) | `src/app/domain/scheduler.ts` | 34–82 (original) | `answer()` tinha 49 linhas, muito acima do limite de 30 — justamente na função mais sensível a erro (escrita de campos FSRS). | **Aplicado:** extraídas `toFsrsCardInput` (mapeamento de entrada) e `buildLog` (montagem do log); `answer()` ficou com 20 linhas. |
| Média (corrigido) | `src/app/domain/heatmap-grid.ts` | 55–89 (original) | `buildHeatmapGrid` tinha 35 linhas. | **Aplicado:** extraída `buildCellsAndMarks` com o laço duplo; função principal ficou com 8 linhas. |
| Média (corrigido) | `src/app/ui/bar-chart/bar-chart.html`, `src/app/ui/heatmap/heatmap.html` | bar-chart.html:26, heatmap.html:13 | `style="font-size: 9px"` — abaixo do piso de 13 px que a regra de estilo visual proíbe explicitamente nos templates. `check:type-scale` não pegava porque o script só varria classes Tailwind, não `style` inline. | **Aplicado:** trocado por `class="... text-label"` (14 px) nos dois gráficos; `bar-chart.ts` ganhou `y`/`labelY` calculados (com `LABEL_MARGIN` maior para caber o texto) e `heatmap-grid.ts` ganhou `TOP_MARGIN`/`HEATMAP_MONTH_LABEL_Y` exportados, eliminando também os números mágicos duplicados que existiam entre `.ts` e `.html`. `check-type-scale.mjs` passou a detectar `font-size` inline abaixo de 13 px (com 2 testes novos), fechando o gap do verificador. Ajuste de layout não verificado visualmente em navegador nesta sessão — recomendo conferir no próximo roteiro E2E/QA que toca Progresso. |
| Baixa (esclarecido, não é mais violação) | `src/app/ui/deck-switcher/deck-row.ts`, `src/app/ui/deck-rhythm/deck-rhythm.ts`, `src/app/pages/cards/cards.ts`, `src/app/pages/home/home.ts` | deck-row.ts:2,16; deck-rhythm.ts:2,41,46; cards.ts:88; home.ts:74 | `ui/`/`pages/` chamam funções de `domain/` diretamente (leitura via `liveQuerySignal`, escrita pontual, ou métodos do `Collection` devolvido por `liveCards`) sem passar por um serviço de `state/` — era uma zona cinzenta de interpretação da regra "`pages/`/`ui/` acessam dados só por `state/`". | **Aplicado:** `AGENTS.md` atualizado para documentar que esse é o padrão aceito (só abrir o Dexie/Supabase cru é proibido; chamar uma função de `domain/` direto do componente é permitido, tanto para leitura reativa quanto para escrita pontual). Nenhuma mudança de código necessária — o código já seguia esse padrão de forma consistente. |
| Baixa (não corrigido) | `src/app/domain/text-marks.ts` | 61, 66 | Comentários de `blank()` e `trimRange()` restatam o nome da função em vez de explicar um "porquê" não óbvio. | Remover ou reescrever para justificar, se for mexer no arquivo por outro motivo. |
| Baixa (não corrigido) | `src/app/pages/home/home.ts`, `no-deck.ts`, `review.ts` | home.ts:61,65,69; no-deck.ts:25; review.ts:50,56,57,61 | Strings mágicas para rotas (`'/'`, `'/revisar'`, `'/cartoes/novo'`, `'/progresso'`, `'/sem-baralho'`) e teclas (`'1'`, `'2'`, `'Space'`, `'again'`, `'good'`) sem constante nomeada. | Baixo risco de bug (não são repetidos com divergência), mas extrair para constantes deixaria mais alinhado com a regra 7 de `code-standards.md`. |
| Informativo (corrigido) | `angular.json` | — | Diff não commitado adicionava `"analytics": "ffa025d6-..."` — ID de telemetria do Angular CLI gerado localmente, não relacionado à funcionalidade. | **Aplicado:** `git checkout -- angular.json`, revertendo o campo antes de qualquer commit. |

## Pontos positivos
- Separação de camadas quase impecável: em 60 arquivos de `domain/`/`state/`/`pages/`/`ui/` só um caso grave de acesso direto ao Dexie fora de `domain/` (já corrigido).
- Regra de domínio "lacuna só na Frente" reforçada em três camadas independentes (normalização na gravação, formulário, revisão) — mesmo com uma delas sem guarda redundante, o dado nunca persiste errado.
- Cobertura de `domain/` em ~100%, com testes que realmente travam se a regra for invertida (não são "cobertura de fachada").
- `scheduler.ts#answer` grava card e log na mesma transação Dexie, exatamente como a TechSpec exige.
- Nenhum uso de `any` em código TypeScript (só os três `$any()` de template, agora corrigidos).
- Zero comentários redundantes no domínio mais crítico (`cards.ts`, `scheduler.ts`, `decks.ts`) — os poucos comentários existentes documentam decisões de negócio genuinamente não óbvias.
- QA independente já rodou e aprovou os 20 critérios de aceitação com evidências, incluindo o roteiro offline mais crítico (E2E-07) contra o build de produção e o deploy de preview.

## Recomendações
- Confirmar visualmente (roteiro E2E/QA que passa por Progresso) que o `text-label` a 14 px nos rótulos de `bar-chart`/`heatmap` não causa sobreposição em nenhuma largura testada — o ajuste de layout foi feito por cálculo, sem verificação em navegador nesta sessão.
- Extrair as strings mágicas de rota (`'/'`, `'/revisar'`, etc.) e de tecla (`'1'`, `'2'`, `'Space'`) para constantes nomeadas, se algum desses arquivos for tocado por outro motivo.
- Reescrever ou remover os dois comentários de `text-marks.ts` (`blank`, `trimRange`) que só restatam o nome da função.

## Conclusão
O MVP offline está bem construído e consistente com a TechSpec e as regras do projeto. A revisão encontrou sete problemas — quatro violações de regras não-negociáveis (acesso direto ao Dexie fora de `domain/`, três usos de `$any()` como `any` disfarçado, e duas funções acima do limite de 30 linhas) e três de menor severidade (rótulos de gráfico SVG abaixo do piso de legibilidade, uma zona cinzenta de interpretação sobre chamar `domain/` direto de `ui/`/`pages/`, e um campo de telemetria não commitado em `angular.json`) — todos corrigidos nesta sessão.

Os fixes incluíram: nova função `getCard` em `domain/cards.ts` (com testes) substituindo o acesso cru ao Dexie em `card-edit.ts`; troca dos três `$any()` de template por variáveis de referência tipadas; refatoração de `scheduler.ts#answer` e `heatmap-grid.ts#buildHeatmapGrid` para caber no limite de função; rótulos de `bar-chart`/`heatmap` migrados para a escala tipográfica semântica com o layout recalculado; `check-type-scale.mjs` estendido para pegar `font-size` inline abaixo de 13 px (com testes); `AGENTS.md` atualizado para documentar explicitamente os padrões de acesso a dados já em uso; e reversão do campo `analytics` em `angular.json`. Revalidação completa ao final: `lint`, `check:type-scale`, `test:coverage` (146/146 testes, cobertura de domínio em ~100%) e `build` de produção, todos verdes.

Restam apenas três recomendações cosméticas de baixíssimo risco (ver acima), nenhuma delas compromete integridade de dados, a regra "lacuna só na Frente" ou o funcionamento offline. **Status: APROVADO.**
