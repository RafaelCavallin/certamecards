# Tarefa 6.0: domain — importação do Anki com marca-texto

## Visão geral

Na importação do `.apkg`, trechos com cor de fundo passam a virar marca-texto da cor mais próxima, por faixa de matiz. Fundos neutros (branco, preto, cinza, transparente) são ignorados, e azul e roxo viram amarelo. Quando o trecho tem mais de uma marca no Anki, vale a precedência lacuna > marca-texto > destaque, tanto em notas básicas quanto em notas de lacuna. Cartões já importados não mudam.

<skills>
### Conformidade com skills

Nenhuma skill específica: é TS puro de `domain/`.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e as rules em `.agents/rules/`. Pontos relevantes:
- `domain/` sem `@angular/*` nem `rxjs`. O `DOMParser` já é usado em `anki-html.ts` (jsdom nos testes).
- Regra de domínio: lacuna só na Frente. Em notas de lacuna, o Verso continua mostrando a lacuna como destaque, e o `normalizeCardMarks` segue como rede de segurança.
- Arquivos perto do limite: `anki-char-stream.ts` (86) e `anki-html.ts` (85). `runsOf`/`isFilled` vão para `anki-runs.ts`, e a leitura de cor CSS fica em `anki-css-color.ts`.
- Constantes nomeadas para as faixas de matiz e os limites de saturação, luminosidade e alpha. Expressão regular complexa pode ter o comentário do “porquê” (regra 1 de `code-standards.md`).
- Funções ≤ 30 linhas, ≤ 3 parâmetros. Testes em AAA. `src/test/anki-builder.ts` monta o `.apkg` do TI-07 sem disco.
</rules>

<requirements>
- RF96: cor de fundo vira marca-texto da cor mais próxima; fundos neutros são ignorados; colorido distante das três vira amarelo.
- RF97: uma marca por trecho na ordem lacuna > marca-texto > destaque; cartões já importados não são alterados.
- RF85: o resultado da importação nunca tem marcas sobrepostas.
</requirements>

## Subtarefas

- [x] 6.1 Criar `src/app/domain/anki-css-color.ts` com `parseCssColor` (hex curto e longo, `rgb()`/`rgba()`, nomes comuns, `transparent`) e `nearestHighlight` pelas faixas da TechSpec.
- [x] 6.2 Extrair `runsOf` e `isFilled` de `anki-char-stream.ts` para `src/app/domain/anki-runs.ts`. Acrescentar `StyledChar.highlight` e `ParsedField.highlight`, com uma corrida por cor.
- [x] 6.3 Atualizar `childContext` em `src/app/domain/anki-html.ts` para ler `background-color`/`background` do `style` e tratar `<mark>` sem estilo como amarelo, com herança para os filhos.
- [x] 6.4 Tornar `subtractRanges` genérico em `src/app/domain/anki-ranges.ts`, preservando a cor dos pedaços.
- [x] 6.5 Criar `src/app/domain/anki-marks.ts` com `resolveFieldMarks` e usá-lo em `anki-draft.ts`. Aplicar a precedência em `expandCloze` (`anki-cloze.ts`).
- [x] 6.6 Estender `src/test/anki-builder.ts` com campos de HTML colorido. Escrever TU-20 a TU-25 (`anki-css-color.test.ts`, `anki-html.test.ts`, `anki-cloze.test.ts`, `anki-marks.test.ts`, `anki-ranges.test.ts`) e TI-07 (`anki-import-flow.test.ts` ou `anki-convert.test.ts`).
- [x] 6.7 Rodar `npm run lint`, `npm run test:coverage` e `npm run build`.

## Detalhes de implementação

Ver [techspec.md](techspec.md):
- “Principais interfaces”: bloco `domain/anki-css-color.ts e domain/anki-marks.ts`.
- “Modelos de dados”: “Mapeamento cor de fundo do Anki → `HighlightColor`” e “Precedência na importação”.
- “Principais decisões”: importação por faixa de matiz.
- “Riscos conhecidos”: tons limítrofes.

## Critérios de aceitação relacionados

- CA-M16

## Testes da tarefa

### Testes de unidade

- [x] TU-20 — `parseCssColor` lê hex curto/longo, `rgb()`/`rgba()`, nomes e `transparent`
- [x] TU-21 — `nearestHighlight` segue as faixas de matiz e ignora neutros
- [x] TU-22 — `htmlToMarkedText` converte `background-color` e `background` em marca-texto, herdando para os filhos
- [x] TU-23 — `resolveFieldMarks` deixa só o marca-texto num trecho em negrito com fundo verde
- [x] TU-24 — `expandCloze` mantém a lacuna com fundo colorido como lacuna na Frente e destaque no Verso
- [x] TU-25 — `subtractRanges` preserva a cor dos pedaços

### Testes de integração

- [x] TI-07 — Importar um `.apkg` (`src/test/anki-builder.ts`) com fundos coloridos cria cartões com marca-texto

## Arquivos relevantes

- `src/app/domain/anki-css-color.ts` (novo) e `anki-css-color.test.ts` (novo)
- `src/app/domain/anki-runs.ts` (novo)
- `src/app/domain/anki-marks.ts` (novo) e `anki-marks.test.ts` (novo)
- `src/app/domain/anki-char-stream.ts`
- `src/app/domain/anki-html.ts` e `anki-html.test.ts`
- `src/app/domain/anki-ranges.ts`
- `src/app/domain/anki-cloze.ts` e `anki-cloze.test.ts`
- `src/app/domain/anki-draft.ts`
- `src/app/domain/anki-convert.test.ts`, `anki-import-flow.test.ts`
- `src/test/anki-builder.ts`
