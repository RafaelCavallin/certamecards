# Especificação técnica — Marca-texto

> PRD: [`tasks/prd-marca-texto/prd.md`](prd.md) (F19, RF84–RF99, CA-47, CA-48, CA-M1–CA-M19). TechSpec-base: [`tasks/produto/techspec.md`](../produto/techspec.md). Não há equivalente no Lingo (`src/components/textMarks.ts` só tem `cloze` e `emphasis`): a lógica de marca-texto é nova e estende a de marcas portada de lá.

## Resumo

O marca-texto entra como um **terceiro tipo de marca** (`highlight`) dentro do `marks jsonb` que já existe. Cada trecho guarda a sua cor (`{ start, end, color }`). Assim, nada muda no banco, na RPC `sync_push`, no formato do backup nem no esquema do Dexie. A regra de uma marca por trecho (RF8) continua, então o fatiamento do texto (`splitByMarks`) mantém o algoritmo de hoje e só passa a carregar a cor do segmento. No formulário, o fundo colorido é pintado pela mesma camada que fica atrás do `<textarea>` (`mark-backdrop`). Um fundo não altera a métrica do texto, então não há risco de desalinhamento. Na revisão, o trecho vira um `<mark>` com fundo colorido. A lacuna passa a ser uma moldura (`ring`) âmbar sem preenchimento nas duas camadas.

O trabalho maior está em três pontos. O primeiro é a **compatibilidade para frente** (RF95): o parse das linhas (`sync-rows-marks.ts`, usado também pelo backup) e o `normalizeCardMarks` passam a preservar tipos de marca e cores desconhecidos, e o reposicionamento ao editar (`remapMarks`) passa a cobrir também essas listas. O segundo são os **tokens de cor**: três cores sólidas por tema, com contraste, distinção entre si e distinção em simulação de protanopia e deuteranopia verificados por teste automatizado. O terceiro é a **importação do Anki**: a cor de fundo vira marca-texto pela faixa de matiz, com a precedência lacuna > marca-texto > destaque. A barra de ações ganha três bolinhas de cor e passa a funcionar pelo teclado: a seleção não se perde quando o foco vai do campo para a barra.

## Arquitetura do sistema

### Visão dos componentes

Nenhum componente novo de `state/` nem de `pages/`. Componentes novos ou modificados:

| Camada | Módulo | Novo/modificado | Papel |
| --- | --- | --- | --- |
| domain | `highlight-colors.ts` | novo | `HighlightColor`, `HIGHLIGHT_COLORS`, `HIGHLIGHT_COLOR_NAMES` (rótulos em PT), `displayHighlightColor(color)` (cor desconhecida → `yellow`). |
| domain | `text-marks.ts` | modificado | `Marks.highlight?`, `HighlightRange`, `MarkKind` com `'highlight'`, `Mark` como união discriminada, `marksOf(marks)`, `Segment.color`. |
| domain | `text-marks-normalize.ts` | modificado | Preenche `highlight: []`, preserva chaves desconhecidas no campo e no cartão, mantém o descarte de `cloze` fora da Frente. |
| domain | `text-marks-remap.ts` | modificado | `remapRanges` genérico (preserva `color` e outras propriedades). `remapMarks` cobre `highlight` e listas desconhecidas com forma de trecho. |
| domain | `mark-editing.ts` | modificado | `addMark(marks, request, range)`, `removeMark`, `recolorHighlight`, todos preservando chaves desconhecidas. |
| domain | `mark-summary.ts` | novo | `summarizeMarks(marks)` e `markHint(allowCloze)`, que saem de `ui/mark-actions` para serem testados (RF87). |
| domain | `sync-rows-marks.ts` | modificado | Zod com `z.looseObject`: `highlight` opcional e chaves desconhecidas preservadas, no pull e no backup (RF93–RF95). |
| domain | `card-draft.ts`, `card-save.ts` | modificado | Normalizam as marcas do cartão salvo antes de abrir o formulário e antes de comparar (cartão antigo sem `highlight` não conta como alterado). |
| domain | `anki-css-color.ts` | novo | `parseCssColor(value)` (hex, `rgb()`/`rgba()`, nomes comuns, `transparent`) e `nearestHighlight(rgba)` por faixa de matiz (RF96). |
| domain | `anki-html.ts` | modificado | `childContext` lê `background-color`/`background` do `style` e herda a cor para os filhos. |
| domain | `anki-char-stream.ts` + `anki-runs.ts` (novo) | modificado/novo | `StyledChar.highlight`, `ParsedField.highlight`. `runsOf`/`isFilled` vão para `anki-runs.ts` para o arquivo ficar ≤ 100 linhas. |
| domain | `anki-ranges.ts` | modificado | `subtractRanges<T extends Range>` preserva a cor dos pedaços. |
| domain | `anki-marks.ts` | novo | `resolveFieldMarks(parsed)` aplica a precedência lacuna > marca-texto > destaque (RF97). É usado por `anki-draft.ts` e `anki-cloze.ts`. |
| ui | `mark-styles/mark-styles.ts` | novo | Classes Tailwind literais: `HIGHLIGHT_FILL: Record<HighlightColor, string>`, `CLOZE_FRAME`. Compartilhado por backdrop, texto marcado e bolinhas. |
| ui | `highlight-swatches` | novo | Três botões de cor (ou dois, sem a atual), 44 px, nome acessível e `mousedown.preventDefault`. |
| ui | `mark-actions` | modificado | Inclui as bolinhas e “Tirar marca-texto”. Emite `MarkRequest` e `recolor`. Usa `mark-summary`. Altura fixa `min-h-11` nos três estados. |
| ui | `markable-field` (+ `field-selection.ts`) | modificado | `allMarks` com highlight, `addMark(request)`, `recolorMark(color)`. O blur preserva a seleção quando o foco vai para a barra. O ouvinte de `selectionchange` sai para `watchSelectionChange`. |
| ui | `mark-backdrop` | modificado | Fundo do marca-texto e lacuna só com moldura. |
| ui | `marked-text` | modificado | Novo `input` `highlight`. Renderiza `<mark>` com fundo e texto `text-text`. Lacuna revelada com moldura. |
| ui/pages | `card-face`, `cards/card-row`, `difficult/difficult-row`, `import/import-preview`, `reinforce/reinforce-summary` | modificado | Passam `[highlight]` ao `app-marked-text` (RF89). |
| estilos | `src/styles/tokens.css`, `src/styles/theme-light.css` | modificado | Tokens `highlight-yellow`, `highlight-green` e `highlight-pink` nos dois temas, mapeados em `@theme inline`. |
| teste | `src/test/color-vision.ts` | novo | OKLab, ΔE e simulação de protanopia e deuteranopia (Machado 2009, severidade 1). Usado só por `*.test.ts`. |

**Fluxo de dados** (sem mudança de forma):

```
markable-field ─(model marks)─ card-form ─► domain/card-save ─ normalizeCardContent ─► Dexie (marks.highlight)
                                                                   │ hook dirty=1
Dexie ─ liveQuerySignal ─► card-face/card-row… ─► marked-text ─ marksOf/splitByMarks ─► <mark>
sync push: toCardRow(marks inteiro) ─► sync_push (jsonb como veio)      pull/backup: parseCardRow ─ zod loose ─ normalize
anki: htmlToMarkedText (cor de fundo) ─► resolveFieldMarks / expandCloze ─► drafts ─► import
```

**Offline e sem conta**: tudo é local (Dexie). Marcar, trocar a cor e tirar são edições de conteúdo comuns: passam por `saveCardEdit`/`saveNewCard`, marcam `dirty=1` pelo hook e sobem no próximo push. A última escrita vence por cartão, comparando o `updated_at`. Nenhum campo FSRS é tocado (RF93, RF5). Sem Supabase configurado, nada muda: o push não roda e o marca-texto fica no aparelho.

## Design de implementação

### Principais interfaces

```ts
// domain/highlight-colors.ts
export type HighlightColor = 'yellow' | 'green' | 'pink';
export const HIGHLIGHT_COLORS: readonly HighlightColor[];          // ordem dos botões
export const HIGHLIGHT_COLOR_NAMES: Record<HighlightColor, string>; // 'amarelo' | 'verde' | 'rosa'
export function displayHighlightColor(color: string): HighlightColor;
export function isHighlightColor(color: string): color is HighlightColor;
```

```ts
// domain/text-marks.ts (trechos que mudam)
export interface HighlightRange extends Range { color: string }
export interface Marks { cloze: Range[]; emphasis: Range[]; highlight?: HighlightRange[] }
export type MarkKind = 'cloze' | 'emphasis' | 'highlight';
export type Mark = (Range & { kind: 'cloze' | 'emphasis' }) | (HighlightRange & { kind: 'highlight' });
export interface Segment { text: string; start: number; kind: MarkKind | null; color: HighlightColor | null }
export function marksOf(marks: Partial<Marks>): Mark[];
```

```ts
// domain/mark-editing.ts e domain/mark-summary.ts
export type MarkRequest = { kind: 'cloze' } | { kind: 'emphasis' } | { kind: 'highlight'; color: HighlightColor };
export function addMark(marks: Marks, request: MarkRequest, range: Range): Marks;
export function removeMark(marks: Marks, mark: Mark): Marks;
export function recolorHighlight(marks: Marks, mark: Mark, color: HighlightColor): Marks;
export function summarizeMarks(marks: Marks): string;     // '1 lacuna, 2 destaques e 3 marca-textos'
export function markHint(allowCloze: boolean): string;
```

```ts
// domain/anki-css-color.ts e domain/anki-marks.ts
export function parseCssColor(value: string): Rgba | null;
export function nearestHighlight(color: Rgba): HighlightColor | null;   // null = fundo neutro, ignorado
export function resolveFieldMarks(parsed: ParsedField): Marks;           // sem lacuna (campos básicos)
```

```text
ui/highlight-swatches   inputs: exclude: HighlightColor | null, mode: 'mark' | 'recolor'   output: pick: HighlightColor
ui/mark-actions         inputs: marks, allowCloze, hasSelection, markedMark: Mark | null
                        outputs: add: MarkRequest, recolor: HighlightColor, remove: void
ui/marked-text          inputs: text, cloze, emphasis, highlight (novo, default []), hideCloze
```

**Contratos de comportamento**:

- `marksOf` mantém a ordenação por `start` de hoje e aceita `highlight` ausente (cartão antigo vindo direto do Dexie).
- `splitByMarks` não muda o algoritmo: uma marca que começa dentro de outra continua ignorada. `Segment.color` é `displayHighlightColor(mark.color)` para `highlight` e `null` para os demais.
- `removeMark` filtra pelo `start` na lista do tipo, como `removeMarkRange` faz hoje. `recolorHighlight` troca só a `color` do trecho com aquele `start`. Os dois devolvem `{ ...marks, … }`, para chaves desconhecidas sobreviverem.
- `normalizeMarks(raw)` devolve `{ ...raw, cloze, emphasis, highlight }`, com `highlight` filtrado para itens que tenham `start`/`end` numéricos e `color` string. A cor desconhecida fica como veio. `normalizeCardMarks` devolve `{ ...raw, front, back, notes }`.
- `remapMarks(before, after, marks)` reposiciona `cloze`, `emphasis` e `highlight` e, para qualquer outra chave cujo valor seja uma lista de objetos com `start`/`end` numéricos, aplica o mesmo `remapRanges`. Outros valores ficam intactos.
- `markable-field.onBlur(event: FocusEvent)`: se `event.relatedTarget` estiver dentro do host do componente (a barra), a seleção pendente é mantida. Depois de `add`, `recolor` ou `remove`, o foco volta ao `<textarea>` com o cursor no fim do trecho (`setSelectionRange(end, end)`).

### Modelos de dados

#### `Marks` — marcas de um campo (Dexie, remoto em `cards.marks`, backup)

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `cloze` | `Range[]` | sim | Lacunas. Só na Frente; `normalizeCardMarks` esvazia em Verso e Notas. |
| `emphasis` | `Range[]` | sim | Destaques. |
| `highlight` | `HighlightRange[]` | não | Marca-textos. Ausente nos cartões gravados antes da F19; `normalizeMarks` sempre preenche com `[]`. |
| *outras chaves* | `unknown` | não | Tipos de marca de versões futuras: preservados como vieram (RF95). |

#### `HighlightRange` — um trecho com marca-texto

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `start`, `end` | `number` | sim | Offsets UTF-16 como os de `Range`, `start < end`, sem sobrepor nenhuma outra marca do campo. |
| `color` | `string` | sim | `'yellow'`, `'green'` ou `'pink'`. Outro valor (versão futura) é preservado e exibido como amarelo. |

```text
{
  "front": {
    "cloze": [{ "start": 19, "end": 25 }],
    "emphasis": [],
    "highlight": [{ "start": 0, "end": 11, "color": "pink" }]
  },
  "back": { "cloze": [], "emphasis": [{ "start": 4, "end": 10 }], "highlight": [{ "start": 30, "end": 52, "color": "green" }] },
  "notes": { "cloze": [], "emphasis": [], "highlight": [] }
}
```

> **Cartão gravado antes da F19 (Dexie e remoto):** a chave `highlight` não existe. Leitura direta para exibição usa `marksOf` (que trata a ausência como `[]`). Formulário, comparação e pull passam por `normalizeMarks`. Não há upgrade de versão do Dexie: reescrever todos os cartões dispararia o hook de `dirty` e faria cada aparelho reenviar o baralho inteiro.

```text
{ "front": { "cloze": [], "emphasis": [{ "start": 4, "end": 10 }] }, "back": { "cloze": [], "emphasis": [] }, "notes": { "cloze": [], "emphasis": [] } }
```

> **Tipo ou cor desconhecidos (versão futura):** preservados no Dexie e reenviados no push. A cor `"blue"` aparece em amarelo e continua `"blue"` depois de editar o texto.

```text
{ "front": { "cloze": [], "emphasis": [], "highlight": [{ "start": 0, "end": 5, "color": "blue" }], "strike": [{ "start": 8, "end": 12 }] }, "back": {…}, "notes": {…} }
```

#### `MarkRequest` — ação pedida pela barra

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `kind` | `'cloze' \| 'emphasis' \| 'highlight'` | sim | Tipo da marca a criar. `cloze` só é emitido com `allowCloze`. |
| `color` | `HighlightColor` | só em `highlight` | Cor tocada. |

```text
{ "kind": "highlight", "color": "green" }
```

#### Tokens de cor do marca-texto (`src/styles/tokens.css` e `theme-light.css`)

Cores sólidas (não translúcidas), para o contraste ser o mesmo no formulário (`bg-surface`) e na revisão (`bg-ink`) e poder ser calculado por teste. O texto dentro do marca-texto usa sempre `text`, inclusive nas Notas, que fora dele são `muted` (decisão do Rafael na TechSpec: com `muted`, as cores do tema escuro teriam de ser quase pretas).

| Token | Escuro | Claro | `text` sobre (esc./claro) |
| --- | --- | --- | --- |
| `highlight-yellow` | `#655902` | `#f5cd4f` | 6,0 / 10,9 |
| `highlight-green` | `#124a2a` | `#a3f5c4` | 8,8 / 13,0 |
| `highlight-pink` | `#773473` | `#f2a6e0` | 7,1 / 9,0 |

Distância entre as cores (ΔE em OKLab, menor par), calculada na exploração: escuro 0,126 normal / 0,086 protanopia / 0,113 deuteranopia; claro 0,149 / 0,139 / 0,116. Distância de cada cor até `ink` e `surface` ≥ 0,13. A moldura da lacuna (`signal`) tem ≥ 5,4:1 sobre `ink` e `surface` nos dois temas. Os valores podem ser ajustados no QA visual, desde que os testes TU-27 a TU-29 continuem verdes.

```text
:root                    { --highlight-yellow: #655902; --highlight-green: #124a2a; --highlight-pink: #773473; }
:root[data-theme='light'] { --highlight-yellow: #f5cd4f; --highlight-green: #a3f5c4; --highlight-pink: #f2a6e0; }
@theme inline            { --color-highlight-yellow: var(--highlight-yellow); … }
```

#### Classes de exibição (`ui/mark-styles/mark-styles.ts`)

| Marca | Formulário (`mark-backdrop`) | Revisão e listas (`marked-text`) |
| --- | --- | --- |
| Lacuna | `rounded ring-1 ring-inset ring-signal box-decoration-clone` (sem fundo) | fechada: `_____`; revelada: a mesma moldura |
| Destaque | sublinhado âmbar (inalterado) | `<strong class="font-semibold text-signal">` (inalterado) |
| Marca-texto | `rounded-sm box-decoration-clone bg-highlight-{cor}` | `<mark class="rounded-sm box-decoration-clone bg-highlight-{cor} text-text">` |

> Nenhuma classe de marca pode ter `padding`, `margin`, `border` ou peso/tamanho de fonte: no formulário a camada de trás precisa ter a mesma métrica do `<textarea>`. `ring` é `box-shadow`, não ocupa espaço. `box-decoration-clone` faz o fundo e a moldura fecharem em cada linha quando o trecho quebra. As strings ficam literais em `mark-styles.ts` para o Tailwind detectá-las.

#### Mapeamento cor de fundo do Anki → `HighlightColor` (`nearestHighlight`)

Converte para HSL e decide pela ordem abaixo (RF96):

| Condição | Resultado |
| --- | --- |
| `alpha < 0.1`, `transparent`, `inherit`, `initial`, valor inválido | `null` (ignorado) |
| saturação < 0,25, luminosidade > 0,94 ou < 0,12 (branco, preto, cinza) | `null` (ignorado) |
| matiz em [20°, 75°) | `yellow` |
| matiz em [75°, 190°) | `green` |
| matiz ≥ 290° ou < 20° | `pink` |
| matiz em [190°, 290°) (azul, roxo) | `yellow` |

Origens aceitas no `style` do elemento (qualquer tag, inclusive `<span>`, `<font>`, `<mark>`): `background-color: …` e a cor dentro de `background: …`. A tag `<mark>` sem `style` vira `yellow`. A cor é herdada pelos filhos até outro elemento redefinir; `background-color: transparent` num filho não apaga a cor do pai, porque o fundo do pai continua visível na tela.

#### Precedência na importação (`resolveFieldMarks` e `expandCloze`)

| Campo | `cloze` | `highlight` | `emphasis` |
| --- | --- | --- | --- |
| Básico (Frente/Verso/Notas) | `[]` | `parsed.highlight` | `parsed.emphasis − highlight` |
| Lacuna — Frente do cartão cN | trechos de cN | `highlight − ocultos` | `emphasis − ocultos − highlight` |
| Lacuna — Verso do cartão cN | `[]` | `highlight − ocultos` | `união(emphasis − highlight, ocultos)` |

`−` é `subtractRanges` (preservando a cor dos pedaços) seguido de `trimmedRanges`. O resultado nunca tem sobreposição, então respeita RF85.

### Endpoints da API

Não aplicável: nenhum endpoint novo nem alterado. `GET /rest/v1/cards` e `POST /rest/v1/rpc/sync_push` (TechSpec-base) transportam `marks` como `jsonb` sem olhar o conteúdo. A coluna tem só `check (jsonb_typeof(marks) = 'object')`. Pela regra do `AGENTS.md`, marcas novas moram no `marks jsonb` e não exigem reemitir `sync_push`.

## Pontos de integração

- **Supabase**: nenhuma mudança. Uma versão antiga do app que faça pull de um cartão com `highlight` não rejeita a linha: o `z.object` dela descarta a chave desconhecida em silêncio. A perda só acontece se aquele aparelho editar o cartão (risco aceito no PRD).
- **Backup** (`backup-manifest-read.ts`/`backup-manifest-write.ts`): reusa `parseCardRow`/`toCardRow`, então herda o schema `loose` sem mudança própria. O formato continua `certamecards-backup` v1, porque a chave nova é opcional e backups antigos continuam válidos.
- **Anki** (`.apkg`): só o HTML dos campos muda de interpretação. Nenhuma dependência nova.

## Abordagem de testes

Vitest com `fake-indexeddb`, `src/test/fake-supabase.ts` e `src/test/db-helpers.ts`. Nada de rede ou disco. A cobertura de 80% é medida em `src/app/domain/**`. Os casos UI são roteiros `E2E-*` executados com a skill `agent-browser` no `/executar-qa`, com capturas em `tasks/prd-marca-texto/evidences/`.

### Testes de unidade

| ID | Nome do caso de teste | Critérios de aceitação | Resultado esperado |
|----|-----------------------|------------------------|--------------------|
| TU-01 | `normalizeCardMarks` preenche `highlight: []` quando a chave falta | CA-M9 | Os três campos saem com `highlight: []` e as demais marcas iguais. |
| TU-02 | `normalizeCardMarks` preserva tipos desconhecidos no campo e no cartão | CA-M15 | `front.strike` e uma chave de cartão desconhecida continuam com o mesmo valor. |
| TU-03 | `normalizeCardMarks` mantém marca-texto nos três campos e esvazia lacuna fora da Frente | CA-M1, CA-M2 | `back.highlight` intacto, `back.cloze` = `[]`. |
| TU-04 | `normalizeMarks` preserva cor desconhecida e descarta item malformado | CA-M15 | `color: 'blue'` fica; item sem `end` sai. |
| TU-05 | `displayHighlightColor` devolve a cor conhecida e `yellow` para a desconhecida | CA-M15 | `'green'`→`'green'`, `'blue'`→`'yellow'`. |
| TU-06 | `marksOf` junta os três tipos ordenados e aceita `highlight` ausente | CA-M1, CA-M9 | Lista ordenada por `start`, com `kind` e `color`. |
| TU-07 | `splitByMarks` produz segmento `highlight` com a cor de exibição e ignora marca sobreposta | CA-M3, CA-M7 | Segmento com `kind: 'highlight'`, `color: 'pink'`; marca sobreposta ignorada. |
| TU-08 | `markAt` encontra o marca-texto sob o cursor e sob uma seleção que o toca | CA-M3, CA-M5 | Devolve o `Mark` com `kind: 'highlight'` e a cor. |
| TU-09 | `addMark` com `highlight` acrescenta trecho com cor, ordenado, preservando chaves desconhecidas | CA-M1 | `highlight` ordenado; `strike` intacto. |
| TU-10 | `recolorHighlight` troca só a cor do trecho indicado | CA-M5 | Mesmo `start`/`end`, cor nova; outros trechos iguais. |
| TU-11 | `removeMark` remove só o marca-texto indicado | CA-M5 | Os outros marca-textos e destaques continuam. |
| TU-12 | `remapRanges` desloca o trecho depois da edição preservando `color` | CA-M4 | `{ start+Δ, end+Δ, color }`. |
| TU-13 | `remapMarks` descarta marca-texto atravessado pela edição | CA-M4 | Apagar “quinze” remove o trecho rosa. |
| TU-14 | `remapMarks` reposiciona lista desconhecida com `start`/`end` e mantém outros valores intactos | CA-M15 | `strike` deslocado; chave com valor não-lista igual. |
| TU-15 | `summarizeMarks` monta “1 lacuna, 2 destaques e 3 marca-textos” e o singular | CA-M6 | Texto exato nos dois casos; vazio sem marcas. |
| TU-16 | `markHint` cita ocultar só quando há lacuna | CA-M6 | “… ocultar, destacar ou marcar” / “… destacar ou marcar”. |
| TU-17 | `parseCardRow` aceita `highlight` e chaves desconhecidas | CA-M13, CA-M15 | `row.marks` com `highlight` e `strike` preservados. |
| TU-18 | `parseCardRow` aceita linha antiga sem `highlight` | CA-M9 | Linha válida, `highlight: []` nos três campos. |
| TU-19 | `toCardRow` envia `highlight` e chaves desconhecidas | CA-M13, CA-M15 | `marks` igual ao local. |
| TU-20 | `parseCssColor` lê hex curto/longo, `rgb()`/`rgba()`, nomes e `transparent` | CA-M16 | RGBA correto; valor inválido → `null`. |
| TU-21 | `nearestHighlight` segue as faixas de matiz e ignora neutros | CA-M16 | Amarelado→yellow, esverdeado→green, rosado→pink, azul→yellow, branco/preto/cinza/transparente→`null`. |
| TU-22 | `htmlToMarkedText` converte `background-color` e `background` em marca-texto, herdando para os filhos | CA-M16 | `ParsedField.highlight` com os trechos e cores. |
| TU-23 | `resolveFieldMarks` deixa só o marca-texto num trecho em negrito com fundo verde | CA-M16 | `highlight` verde, `emphasis` sem esse trecho. |
| TU-24 | `expandCloze` mantém a lacuna com fundo colorido como lacuna na Frente e destaque no Verso | CA-M16 | Frente: `cloze` com o trecho, `highlight` sem ele. |
| TU-25 | `subtractRanges` preserva a cor dos pedaços | CA-M16 | Pedaços com a cor original. |
| TU-26 | `loadCardDraft` de cartão antigo devolve marcas normalizadas e `hasDraftChanges` é falso sem edição | CA-M9 | `highlight: []`; sem alterações. |
| TU-27 | Texto (`text`) sobre cada cor do marca-texto tem ≥ 4,5:1 nos dois temas | CA-48, CA-M10 | Seis razões ≥ 4,5. |
| TU-28 | Moldura da lacuna (`signal`) tem ≥ 3:1 sobre `ink` e `surface` nos dois temas | CA-48, CA-M10 | Quatro razões ≥ 3. |
| TU-29 | As três cores se distinguem entre si (ΔE OKLab ≥ 0,08) em visão normal, protanopia e deuteranopia, e de `ink`/`surface` (ΔE ≥ 0,12), nos dois temas | CA-M11 | Todos os pares acima dos limites. |

Estratégia:

- Prioridade (regra 3 de `tests.md`): primeiro integridade de dados (TU-01 a TU-04, TU-12 a TU-14, TU-17 a TU-19), depois edição (TU-08 a TU-11), importação e, por último, rótulos.
- TU-27 a TU-29 vão num arquivo novo `src/app/domain/theme-highlight.test.ts`, que lê os tokens por `src/test/theme-tokens.ts` e usa `src/test/contrast.ts` e o novo `src/test/color-vision.ts`. Os dois testes de `theme-palette.test.ts` que medem a lacuna com fundo (`signal` a 15% e a 10% sobre `surface`) são removidos, porque a lacuna não tem mais fundo. O TU-28 os substitui.
- Sem mocks além dos fakes já existentes: tudo aqui é função pura ou Dexie em memória.

### Testes de integração

| ID | Nome do caso de teste | Critérios de aceitação | Resultado esperado |
|----|-----------------------|------------------------|--------------------|
| TI-01 | Salvar edição só com marca-texto grava as marcas sem tocar no FSRS nem gerar revisão | CA-M12 | `marks.front.highlight` gravado; `due`, `stability`, `state` iguais; 0 `reviewLogs`; `dirty = 1`. |
| TI-02 | Salvar sem mudanças um cartão antigo (sem `highlight`) não altera `updatedAt` | CA-M9 | `updatedAt` e `dirty` iguais aos de antes. |
| TI-03 | Push e pull pelo fake Supabase levam o marca-texto de um aparelho a outro | CA-M13 | Depois de limpar o Dexie e puxar, o cartão volta com o mesmo `highlight`. |
| TI-04 | Cartão puxado com tipo e cor desconhecidos, editado e reenviado, mantém ambos reposicionados | CA-M15 | O push contém `strike` deslocado e `color: 'blue'`. |
| TI-05 | Backup e restauração preservam marca-texto nas três cores | CA-M14 | Cartões restaurados com `marks` iguais. |
| TI-06 | Restaurar um backup sem `highlight` (fixture da F15) funciona e não marca nada | CA-M14 | Restauração ok; `highlight: []`. |
| TI-07 | Importar um `.apkg` (`src/test/anki-builder.ts`) com fundos coloridos cria cartões com marca-texto | CA-M16 | Cores e precedência como no mapeamento; cartões existentes intactos. |

Dados: `card-fixtures.ts`, `backup-fixtures.ts` e `anki-builder.ts` ganham variantes com `highlight`. Sem `beforeAll` compartilhado: cada caso semeia o próprio cenário (`resetDb`).

### Testes E2E

Roteiros executados à mão com `agent-browser` contra `npm start -- --port <porta livre 4200–4299>`. Os roteiros com conta usam o `certamecards-dev` e um usuário `qa-<AAAAMMDD-HHMM>@example.com` criado pelo cadastro do app.

| ID | Nome do caso de teste | Critérios de aceitação | Resultado esperado |
|----|-----------------------|------------------------|--------------------|
| E2E-01 | Marcar, trocar e tirar no formulário | CA-47, CA-M1, CA-M2, CA-M3, CA-M5, CA-M6 | Novo cartão → seleciona um trecho em cada campo → amarelo/verde/rosa com um toque; a barra da Frente mostra Ocultar, Destacar e 3 cores, e a do Verso não mostra Ocultar; o cursor no verde mostra amarelo, rosa e “Tirar marca-texto”; a troca e a remoção funcionam; o resumo mostra a contagem; a altura da barra não muda entre os estados em largura ≥ 640 px (abaixo disso as ações quebram linha ao selecionar). |
| E2E-02 | Edição de texto ao redor | CA-M4 | Digitar antes de um trecho rosa mantém o fundo alinhado ao texto (captura com zoom); apagar a palavra remove a marca. |
| E2E-03 | Revisão, reforço e listas | CA-47, CA-M7, CA-M8, CA-M9 | A Frente mostra o marca-texto antes de revelar e o Verso e as Notas depois; o texto marcado fica em peso normal e cor principal; a lacuna revelada é só moldura; um cartão antigo aparece como antes, salvo a moldura; o marca-texto aparece na lista de cartões, em Difíceis, no reforço e no resumo do reforço. |
| E2E-04 | Tema claro e daltonismo | CA-48, CA-M10, CA-M11 | Capturas nos dois temas de um cartão com as três cores e uma lacuna revelada; as mesmas capturas com a emulação de visão do DevTools (`Emulation.setEmulatedVisionDeficiency`: `protanopia`, `deuteranopia`) mostram as três cores distinguíveis. |
| E2E-05 | Teclado e leitor de tela | CA-M17, CA-M18 | Selecionar com Shift+setas → Tab chega às bolinhas sem perder a seleção → Enter aplica → o foco volta ao campo; a árvore de acessibilidade mostra os botões com “Marcar em verde” e o trecho na revisão com papel `mark`; cada bolinha mede ≥ 44 × 44 px. |
| E2E-06 | Offline e sem conta | CA-M12 | Com a rede desligada e sem conta: marcar, trocar e tirar; recarregar mantém tudo; a próxima revisão do cartão (lista/detalhe) não muda. |
| E2E-07 | Sincronização entre dois aparelhos | CA-M13 | Dois contextos do navegador com a mesma conta: A marca de verde e sincroniza, B sincroniza e mostra o mesmo trecho em verde. |
| E2E-08 | Backup e importação do Anki | CA-M14, CA-M16 | Backup → limpar dados → restaurar mantém as cores; importar um `.apkg` com fundos amarelado, esverdeado, rosado, azul, branco e transparente, negrito com fundo verde e lacuna com fundo mostra na prévia e nos cartões o resultado do CA-M16. |
| E2E-09 | Desempenho com 5.000 cartões | CA-M19 | Restaurar um backup gerado com 5.000 cartões com marca-texto; rolar a lista sem travar e medir (Performance do DevTools) a resposta de um cartão na revisão em ≤ 150 ms. |

O `.apkg` do E2E-08 e o backup do E2E-09 são gerados por um script descartável fora do repositório (scratchpad do agente), a partir de `src/test/anki-builder.ts` e `src/test/backup-fixtures.ts`. O QA registra como foram gerados.

## Sequenciamento do desenvolvimento

### Ordem de construção

1. **Modelo e integridade** — `highlight-colors.ts`, tipos em `text-marks.ts`, `text-marks-normalize.ts`, `sync-rows-marks.ts` (loose), `text-marks-remap.ts`, `mark-editing.ts`, `mark-summary.ts`, `card-draft.ts`/`card-save.ts` com TU-01 a TU-19, TU-26, TI-01 a TI-06. Vem primeiro porque o RF95 e o cartão antigo são o maior risco de perda de dados, e o resto depende dos tipos.
2. **Tokens e testes de cor** — `tokens.css`, `theme-light.css`, `src/test/color-vision.ts`, `theme-highlight.test.ts` (TU-27 a TU-29) e a remoção dos dois testes de lacuna com fundo. Isso fixa as cores antes da UI.
3. **Exibição** — `mark-styles.ts`, `mark-backdrop`, `marked-text` (com `<mark>` e a moldura), `card-face` e as quatro listas. Já dá para ver os cartões existentes e a lacuna nova.
4. **Edição** — `highlight-swatches`, `mark-actions`, `markable-field` (incluindo o blur e o foco para o teclado). É o maior risco de UI, porque mexe na seleção do `<textarea>`.
5. **Importação do Anki** — `anki-css-color.ts`, `anki-html.ts`, `anki-char-stream.ts`/`anki-runs.ts`, `anki-ranges.ts`, `anki-marks.ts`, `anki-cloze.ts`, `anki-draft.ts`, com TU-20 a TU-25 e TI-07. É independente das etapas 3 e 4 e pode ir em paralelo depois da 1.
6. **Validação** — `lint`, `check:type-scale`, `test:coverage`, `build`; depois o `/executar-qa` com E2E-01 a E2E-09.

### Dependências técnicas

- Nenhuma dependência nova de pacote, infraestrutura ou serviço.
- Zod 4 (`z.looseObject`), Dexie 4 e Tailwind 4 (`box-decoration-clone`, `ring-inset`), já instalados.
- `certamecards-dev` acessível para o E2E-07. Sem migration a aplicar.

## Monitoramento e observabilidade

Sem backend novo. O monitoramento continua o do cliente:

- `parseCardRow` já devolve `null` e registra a linha rejeitada no pull. Com o schema `loose`, uma linha com marca desconhecida **não** deve mais ser rejeitada; o QA confirma que o console fica limpo no E2E-07.
- Nenhum evento novo. Erros de importação seguem o resumo da importação, que já conta os cartões pulados e o motivo.

## Considerações técnicas

### Principais decisões

- **Uma lista `highlight` com `color` em vez de três tipos** (`highlightYellow`…): troca de cor vira atualização de um campo, a contagem do resumo é direta, e uma quarta cor futura não cria um tipo novo.
- **`highlight` opcional no tipo, sem upgrade do Dexie**: um `upgrade()` que reescrevesse as marcas de todos os cartões passaria pelo hook de `dirty` e faria todos os aparelhos reenviarem o baralho inteiro. O tipo opcional obriga o compilador a tratar a ausência, e a normalização acontece nas fronteiras que já existem (formulário, comparação, pull, backup).
- **Compatibilidade para frente no domínio, não no banco** (RF95): `z.looseObject` + `normalizeMarks` com spread + `remapMarks` genérico. A cor desconhecida é preservada e exibida em amarelo, por decisão do Rafael. A alternativa de converter para amarelo foi descartada por perder a cor original ao editar.
- **Cores sólidas por token** em vez de `signal/15`-style translúcido: o contraste fica igual sobre `ink` e `surface`, o teste mede o valor exato e o tema claro troca só a variável.
- **Texto do marca-texto sempre em `text`**: com `muted` nas Notas do tema escuro, o contraste AA exigiria fundos quase pretos e as três cores ficariam indistinguíveis. Decisão do Rafael. O PRD (RF89 e CA-M7) foi ajustado na mesma entrega.
- **Lacuna só com moldura** (`ring` = `box-shadow`): não ocupa espaço, então mantém a métrica no formulário e se distingue do fundo amarelo.
- **`<mark>` na revisão**: dá o papel `mark` às tecnologias assistivas sem texto escondido extra, que entraria na leitura do cartão.
- **Teclado na barra**: o blur com `relatedTarget` dentro do componente mantém a seleção. Hoje o blur limpa a seleção sempre, então nem “Destacar seleção” funciona por Tab. A correção vale para as três ações.
- **Importação por faixa de matiz** em vez de distância a uma cor de referência: as cores do Anki variam muito (`#ffff00`, `rgb(255, 255, 127)`, `#fff2cc`), e a matiz é estável entre elas. Os limites ficam em constantes nomeadas.
- **Sem sobreposição** (PRD): `splitByMarks` não muda de algoritmo. Isso evita refazer o fatiamento, que todas as telas usam.

### Riscos conhecidos

- **Versão anterior instalada descarta o marca-texto ao editar** (risco aceito no PRD). Mitigação: o aviso de nova versão (`AppUpdate`). Nada mais a fazer no cliente antigo.
- **Desalinhamento no formulário**: só aconteceria se alguma classe de marca alterasse a métrica. Mitigação: a regra “sem padding/margin/border/peso” em `mark-styles.ts`, revisada no `/executar-review`, e a captura com zoom do E2E-02.
- **`box-decoration-break` no Safari**: precisa do prefixo `-webkit-`, que o Tailwind 4 já emite. Validar num iPhone, ou no WebKit do `agent-browser` se disponível, no E2E-03.
- **Leitores de tela tratam `<mark>` de jeitos diferentes**: NVDA e JAWS só anunciam com configuração. O CA-M18 é verificado pelo papel na árvore de acessibilidade. Se o QA achar necessário, uma melhoria futura seria anunciar a cor.
- **Faixas de matiz da importação** podem classificar mal tons limítrofes (laranja-avermelhado, verde-azulado). Mitigação: constantes nomeadas, TU-21 com valores de borda e a prévia da importação, que mostra o resultado antes de importar.
- **Limite de 100 linhas**: `markable-field.ts` (99), `text-marks.ts` (87), `anki-char-stream.ts` (86) e `anki-html.ts` (85) crescem. As extrações previstas são `watchSelectionChange`, `highlight-colors.ts`, `anki-runs.ts` e `anki-css-color.ts`. Se `text-marks.ts` passar de 100, `trimRange` e `markAt` vão para `text-marks-selection.ts`.
- **Paleta**: os valores propostos podem precisar de ajuste estético no QA. Os testes TU-27 a TU-29 definem o limite do que pode mudar.

### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e as três rules (`code-standards.md`, `javascript-typescript.md` e `tests.md`). O que vale aqui:

- `domain/` continua TS puro. `highlight-colors.ts`, `mark-summary.ts`, `anki-css-color.ts` e `anki-marks.ts` não importam `@angular/*` nem `rxjs`. `ui/` não abre o Dexie: a escrita passa por `card-save.ts`, como hoje.
- `ui/` não importa `pages/`. `mark-styles.ts` fica em `ui/` e é usado só por `ui/`.
- `src/test/color-vision.ts` é importado só por `*.test.ts`.
- **Regra de domínio**: lacuna só na Frente (o `normalizeCardMarks` mantém o descarte). Campos FSRS não são tocados (TI-01). Reforço não escreve nada (nenhuma escrita nova no reforço).
- **Estilo**: cores só por token (`bg-highlight-*`, `ring-signal`), nada de hex em template. Tokens novos nos dois temas com teste de contraste em `src/app/domain/` (`theme-highlight.test.ts`, ao lado de `theme-palette.test.ts`). Escala tipográfica inalterada (`check:type-scale`). Nada de `dark:`.
- **Banco**: sem migration e sem reemitir `sync_push`, conforme o `AGENTS.md` (“novas marcas de texto não precisam disso: moram no `marks jsonb`”).
- **Código**: arquivos ≤ 100 linhas (extrações listadas nos riscos), funções ≤ 30 linhas, ≤ 3 parâmetros (`addMark` tem 3; o `MarkRequest` evita o quarto), sem comentários, constantes nomeadas para as faixas de matiz e os limites de ΔE, união de strings em vez de `enum` (`HighlightColor`), `import type` para tipos, nunca `any` (o loose do Zod é lido como `unknown` e estreitado).
- **Testes**: todo código entra com teste, com o piso de 80% em `domain/**` e AAA. A UI é coberta pelos E2E manuais, sem Playwright.

### Conformidade com skills

- `angular-developer`: componentes standalone `OnPush`, `input()`/`output()`, `@for`/`@if`, `host` para o contêiner do blur e ARIA nos botões de cor. Nenhum desvio.
- `agent-browser`: E2E-01 a E2E-09, incluindo a emulação de deficiência de visão pelo CDP no E2E-04.
- `supabase`: consultada só para confirmar que não há mudança de schema, RLS ou RPC. Nenhum comando de banco nesta entrega.
- `impeccable`: opcional, para o polimento visual das bolinhas e da paleta no QA. Não é obrigatória.
- `vercel-cli`: não se aplica, porque não há variável de ambiente nova.

### Arquivos relevantes e dependentes

- **Domínio**: `src/app/domain/text-marks.ts`, `text-marks-normalize.ts`, `text-marks-remap.ts`, `mark-editing.ts`, `card-content.ts`, `card-draft.ts`, `card-save.ts`, `sync-rows-marks.ts`, `sync-rows-card.ts`, `backup-manifest-read.ts`, `backup-manifest-write.ts`, `anki-html.ts`, `anki-char-stream.ts`, `anki-ranges.ts`, `anki-cloze.ts`, `anki-draft.ts`. Novos: `highlight-colors.ts`, `mark-summary.ts`, `anki-css-color.ts`, `anki-runs.ts`, `anki-marks.ts`, `theme-highlight.test.ts`.
- **Testes existentes a atualizar**: `text-marks.test.ts`, `text-marks-normalize.test.ts`, `text-marks-remap.test.ts`, `mark-editing.test.ts`, `sync-rows.test.ts`, `card-draft.test.ts`, `cards.test.ts`, `anki-html.test.ts`, `anki-cloze.test.ts`, `anki-convert.test.ts`, `backup-manifest.test.ts`, `backup-roundtrip.test.ts`, `theme-palette.test.ts`.
- **Helpers de teste**: `src/test/contrast.ts`, `theme-tokens.ts`, `card-fixtures.ts`, `backup-fixtures.ts`, `anki-builder.ts`. Novo: `src/test/color-vision.ts`.
- **UI**: `src/app/ui/markable-field/markable-field.ts`, `.html`, `field-selection.ts`, `src/app/ui/mark-actions/mark-actions.ts`, `.html`, `src/app/ui/mark-backdrop/mark-backdrop.ts`, `.html`, `src/app/ui/marked-text/marked-text.ts`, `.html`, `src/app/ui/card-face/card-face.html`, `src/app/ui/card-form/card-form-fields.ts` (`EMPTY_MARKS` com `highlight: []`). Novos: `src/app/ui/highlight-swatches/`, `src/app/ui/mark-styles/mark-styles.ts`.
- **Páginas**: `src/app/pages/cards/card-row.html`, `difficult/difficult-row.html`, `import/import-preview.html`, `reinforce/reinforce-summary.html`.
- **Estilos**: `src/styles/tokens.css`, `src/styles/theme-light.css`.
- **Documentos**: `tasks/prd-marca-texto/prd.md`, `tasks/produto/prd.md` (RF89 e CA-M7 com a cor do texto).
