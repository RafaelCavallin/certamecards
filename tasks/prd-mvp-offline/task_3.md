# Tarefa 3.0: Domínio — marcas de texto

## Visão geral

Portar `textMarks.ts` do Lingo com os testes e acrescentar `CardMarks`, `EMPTY_CARD_MARKS` e `normalizeCardMarks`, que garante a regra “lacuna só na Frente” para qualquer entrada.

<skills>
### Conformidade com skills

Nenhuma: TypeScript puro em `src/app/domain/`. Consultar o Lingo (`src/components/textMarks.ts` + teste).
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Lidos o `AGENTS.md` e todas as rules em `.agents/rules/`.

- Regra de domínio inegociável: `normalizeCardMarks` descarta lacunas de Verso e Notas em qualquer entrada.
- Offsets em UTF-16 (`String.prototype.slice`), `start < end`, sem sobreposição.
- Dados imutáveis; funções puras; arquivo ≤ 100 linhas (dividir se o port passar disso).
</rules>

<requirements>
- RF6: lacuna só na Frente; destaque nos três campos.
- RF7: identificar a marca sob o cursor (`markAt`).
- RF8: seleção aparada nas pontas; marcas não se sobrepõem.
- RF9: remapear marcas após edição; descartar marca atravessada.
- RF11–RF13: segmentação do texto em trechos normais, destacados e ocultos para a revisão.
</requirements>

## Subtarefas

- [x] 3.1 Portar `splitByMarks`, `remapRanges`, `trimRange`, `markAt` e auxiliares com os testes do Lingo — dividido em `text-marks.ts` (tipos, `marksOf`, `splitByMarks`, `blank`, `trimRange`, `markAt`) e `text-marks-remap.ts` (`remapRanges`, `remapMarks`) para caber em 100 linhas cada
- [x] 3.2 `CardField`, `CardMarks`, `EMPTY_CARD_MARKS` — já existiam como stub da tarefa 2.0, mantidos em `text-marks.ts`
- [x] 3.3 `normalizeCardMarks` (chaves ausentes/nulas e descarte de lacunas fora da Frente) — em `text-marks-normalize.ts`
- [x] 3.4 Ligar `normalizeCardMarks` em `createCard`/`updateCardContent` (tarefa 2.0)

## Detalhes de implementação

Ver `techspec.md` → “Principais interfaces”; na base, “`CardMarks` / `Marks` / `Range`” e a nota “Semântica por campo”.

## Critérios de aceitação relacionados

- CA-04
- CA-05
- CA-06
- CA-07
- CA-08

## Testes da tarefa

### Testes de unidade

- [x] TU-01 — `splitByMarks` com lacuna e destaque no mesmo texto
- [x] TU-02 — `remapRanges` ao inserir antes, depois e através da marca
- [x] TU-03 — `trimRange` e `markAt` (cursor na borda × dentro)
- [x] TU-04 — `normalizeCardMarks` com chaves ausentes/nulas
- [x] TU-05 — `normalizeCardMarks` descarta lacunas de Verso e Notas

## Arquivos relevantes

- `src/app/domain/text-marks.ts` (+ `.test.ts`) — tipos, `marksOf`, `splitByMarks`, `blank`, `trimRange`, `markAt`
- `src/app/domain/text-marks-remap.ts` (+ `.test.ts`) — `remapRanges`, `remapMarks`
- `src/app/domain/text-marks-normalize.ts` (+ `.test.ts`) — `normalizeCardMarks`
- `src/app/domain/cards.ts`
- Lingo: `src/components/textMarks.ts`, `textMarks.test.ts`
