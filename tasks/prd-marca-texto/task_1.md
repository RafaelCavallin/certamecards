# Tarefa 1.0: domain — modelo do marca-texto e compatibilidade para frente

## Visão geral

Cria o terceiro tipo de marca (`highlight`, com cor) e torna as funções de marcas tolerantes ao que não conhecem: a normalização preserva tipos e cores de versões futuras, o reposicionamento ao editar o texto cobre o marca-texto e as listas desconhecidas, e criar, trocar a cor e tirar uma marca nunca descartam chaves desconhecidas. Leva também para `domain/` o resumo e a dica da barra de ações, que hoje vivem em `ui/mark-actions`. É a base de todas as outras tarefas.

<skills>
### Conformidade com skills

Nenhuma skill específica: é TS puro de `domain/`.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e as rules em `.agents/rules/`. Pontos relevantes:
- `domain/` sem `@angular/*` nem `rxjs`.
- Regra de domínio: lacuna só na Frente. `normalizeCardMarks` continua esvaziando `cloze` de Verso e Notas.
- União de strings (`HighlightColor`, `MarkKind`) em vez de `enum`, `import type` para tipos e nunca `any`: o que vem cru é `unknown` e é estreitado.
- Funções ≤ 30 linhas, ≤ 3 parâmetros (o `MarkRequest` evita o quarto em `addMark`), arquivos ≤ 100 linhas. Se `text-marks.ts` passar de 100, `trimRange` e `markAt` vão para `text-marks-selection.ts`.
- Dados imutáveis: toda função devolve um objeto novo com `{ ...marks, … }`.
- Sem comentários. Constantes nomeadas. Textos de usuário em português.
- Todo código entra com teste, com o piso de 80% em `src/app/domain/**` e testes em AAA.
</rules>

<requirements>
- RF84: três cores (amarelo, verde e rosa) disponíveis nos três campos.
- RF85: seleção aparada, uma marca por trecho, reposicionamento e descarte ao editar.
- RF86: trocar a cor do mesmo trecho e tirar só aquela marca.
- RF87: resumo com marca-textos e dica que cita a nova ação.
- RF95: tipos e cores de marca desconhecidos são preservados e reposicionados ao editar.
</requirements>

## Subtarefas

- [x] 1.1 Criar `src/app/domain/highlight-colors.ts` com `HighlightColor`, `HIGHLIGHT_COLORS`, `HIGHLIGHT_COLOR_NAMES`, `isHighlightColor` e `displayHighlightColor`.
- [x] 1.2 Atualizar `src/app/domain/text-marks.ts`: `HighlightRange`, `Marks.highlight?`, `MarkKind`, `Mark` como união discriminada, `Segment.color`, `marksOf(marks)`, `splitByMarks` com a cor e `EMPTY_CARD_MARKS` com `highlight: []`. Ajustar quem chama `marksOf` (`ui/marked-text`, `ui/markable-field`) só o bastante para compilar; o comportamento novo dessas telas fica nas tarefas 4.0 e 5.0.
- [x] 1.3 Atualizar `src/app/domain/text-marks-normalize.ts` para preencher `highlight`, filtrar itens malformados e preservar chaves desconhecidas no campo e no cartão.
- [x] 1.4 Tornar `remapRanges` genérico em `src/app/domain/text-marks-remap.ts`, preservando as propriedades do trecho, e estender `remapMarks` a `highlight` e a listas desconhecidas com forma de trecho.
- [x] 1.5 Substituir `addMarkRange`/`removeMarkRange` em `src/app/domain/mark-editing.ts` por `addMark`, `removeMark` e `recolorHighlight`, com `MarkRequest`.
- [x] 1.6 Criar `src/app/domain/mark-summary.ts` com `summarizeMarks` e `markHint`, movidos de `ui/mark-actions/mark-actions.ts` e estendidos ao marca-texto.
- [x] 1.7 Atualizar os testes existentes (`text-marks.test.ts`, `text-marks-normalize.test.ts`, `text-marks-remap.test.ts`, `mark-editing.test.ts`) e criar `highlight-colors.test.ts` e `mark-summary.test.ts` com TU-01 a TU-16.
- [x] 1.8 Rodar `npm run lint`, `npm run test:coverage` e `npm run build`.

## Detalhes de implementação

Ver [techspec.md](techspec.md):
- “Principais interfaces”: blocos `domain/highlight-colors.ts`, `domain/text-marks.ts` e `domain/mark-editing.ts e domain/mark-summary.ts`, além dos “Contratos de comportamento”.
- “Modelos de dados”: `Marks`, `HighlightRange` (com as degradações de cartão antigo e de tipo ou cor desconhecidos) e `MarkRequest`.
- “Principais decisões”: uma lista `highlight` com `color`, `highlight` opcional sem upgrade do Dexie, compatibilidade para frente no domínio.

## Critérios de aceitação relacionados

- CA-M1
- CA-M2
- CA-M3
- CA-M4
- CA-M5
- CA-M6
- CA-M9
- CA-M15

## Testes da tarefa

### Testes de unidade

- [x] TU-01 — `normalizeCardMarks` preenche `highlight: []` quando a chave falta
- [x] TU-02 — `normalizeCardMarks` preserva tipos desconhecidos no campo e no cartão
- [x] TU-03 — `normalizeCardMarks` mantém marca-texto nos três campos e esvazia lacuna fora da Frente
- [x] TU-04 — `normalizeMarks` preserva cor desconhecida e descarta item malformado
- [x] TU-05 — `displayHighlightColor` devolve a cor conhecida e `yellow` para a desconhecida
- [x] TU-06 — `marksOf` junta os três tipos ordenados e aceita `highlight` ausente
- [x] TU-07 — `splitByMarks` produz segmento `highlight` com a cor de exibição e ignora marca sobreposta
- [x] TU-08 — `markAt` encontra o marca-texto sob o cursor e sob uma seleção que o toca
- [x] TU-09 — `addMark` com `highlight` acrescenta trecho com cor, ordenado, preservando chaves desconhecidas
- [x] TU-10 — `recolorHighlight` troca só a cor do trecho indicado
- [x] TU-11 — `removeMark` remove só o marca-texto indicado
- [x] TU-12 — `remapRanges` desloca o trecho depois da edição preservando `color`
- [x] TU-13 — `remapMarks` descarta marca-texto atravessado pela edição
- [x] TU-14 — `remapMarks` reposiciona lista desconhecida com `start`/`end` e mantém outros valores intactos
- [x] TU-15 — `summarizeMarks` monta “1 lacuna, 2 destaques e 3 marca-textos” e o singular
- [x] TU-16 — `markHint` cita ocultar só quando há lacuna

## Arquivos relevantes

- `src/app/domain/highlight-colors.ts` (novo) e `highlight-colors.test.ts` (novo)
- `src/app/domain/mark-summary.ts` (novo) e `mark-summary.test.ts` (novo)
- `src/app/domain/text-marks.ts` e `text-marks.test.ts`
- `src/app/domain/text-marks-normalize.ts` e `text-marks-normalize.test.ts`
- `src/app/domain/text-marks-remap.ts` e `text-marks-remap.test.ts`
- `src/app/domain/mark-editing.ts` e `mark-editing.test.ts`
- `src/app/ui/mark-actions/mark-actions.ts` (deixa de ter `summarizeMarks`)
- `src/app/ui/marked-text/marked-text.ts`, `src/app/ui/markable-field/markable-field.ts` (só a nova assinatura de `marksOf`)
