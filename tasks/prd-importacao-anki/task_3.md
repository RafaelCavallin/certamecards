# Tarefa 3.0: domain — mapeamento, seleção e plano

## Visão geral

Liga a coleção lida (tarefa 1) à conversão (tarefa 2) e produz o plano da importação. `anki-mapping.ts` classifica cada tipo de nota (`basic`/`cloze`/`unsupported`) e sugere o mapeamento para Frente, Verso e Notas (nome vence posição, PT/EN). `anki-selection.ts` calcula as contagens dos passos de origem e de campos (notas por baralho, tipos presentes, cartões previstos com lacunas contando um por número) e o nome sugerido do baralho. `anki-convert.ts` converte cada nota em rascunhos ou num motivo de pulo, aplicando os limites de `card-limits`, e converte o conjunto em lotes de 500 que cedem a vez à UI, com `AbortSignal` e progresso. O resultado é o `ConversionResult` (rascunhos, pulados por motivo, etiquetas descartadas). Gera também a prévia das 3 primeiras notas de cada tipo.

<skills>
### Conformidade com skills

Nenhuma skill específica: é TS puro de `domain/`.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e as rules em `.agents/rules/`. Pontos relevantes:
- `domain/` sem `@angular/*` nem `rxjs`.
- No máximo 3 parâmetros: `ConvertInput`, `ConvertContext` e `SelectionInput` como objetos nomeados.
- `convertNote` devolve `SkipReason` em vez de lançar erro; `convertNotes` cede a vez (`setTimeout(0)`) só fora de transação.
- Limites de `FRONT_MAX`, `BACK_MAX` e `NOTES_MAX` sobre o texto aparado, como `validateCardContent`.
- União de strings (`SkipReason`, `NotetypeClass`) em vez de `enum`; constantes `CONVERT_CHUNK_SIZE` e `PREVIEW_SIZE`.
- Testes com relógio e dados controlados; o TI-A6 usa o Dexie real (`fake-indexeddb`) para o catálogo de etiquetas.
</rules>

<requirements>
- RF60d, RF60e: notas por baralho de origem com hierarquia; contagens de notas e de cartões previstos atualizadas pela seleção.
- RF60f, RF60g: mapeamento por tipo de nota, com sugestão por nome (PT/EN) e, na falta, por posição.
- RF60h: tipos de lacuna com mapeamento fixo (campo de texto → Frente/Verso, Extra → Notas).
- RF60i: oclusão de imagem como `unsupported`, desmarcada e travada; tipos desmarcados pelo usuário não contam como pulados.
- RF60k (suporte): prévia das 3 primeiras notas de cada tipo, na ordem do arquivo, depois do filtro e do mapeamento.
- RF60l (suporte): nome sugerido do baralho a partir do último nível de origem ou do nome do arquivo.
- RF65c: pulos por `empty-side`, `too-long`, `no-cloze` e `unsupported-type`, contados antes de importar.
</requirements>

## Subtarefas

- [x] 3.1 Criar `anki-mapping.ts`: `classifyNotetype` e `suggestMapping` (tabela de nomes reconhecidos, nome já usado não é reaproveitado).
- [x] 3.2 Criar `anki-selection.ts`: `summarizeSourceDecks`, `notetypesInSelection`, `countPlannedCards` e `suggestDeckName`.
- [x] 3.3 Criar `anki-convert.ts`: `convertNote` (básico e lacuna, Notas “Nenhum”, limites, motivos), `convertNotes` (lotes, `yieldToUi`, `signal`, `onProgress`) e a prévia por tipo.
- [x] 3.4 Escrever TU-A10, TU-A11, TU-A13 e TI-A6.

## Detalhes de implementação

Ver [techspec.md](techspec.md):
- “Principais interfaces”: blocos `domain/anki-mapping.ts · anki-selection.ts · anki-tags.ts` e `domain/anki-convert.ts`.
- “Regras dos contratos”: itens de `convertNote` e `convertNotes`.
- “Modelos de dados”: `FieldMapping` e `NotetypeClass` (tabela de sugestão), `CardDraft`, `ConversionResult` e `SkipReason`, “Parâmetros fixos”.

## Critérios de aceitação relacionados

- CA-A3
- CA-A4
- CA-A6
- CA-A7
- CA-A10
- CA-A11
- CA-A13

## Testes da tarefa

### Testes de unidade

- [x] TU-A10 — `classifyNotetype` e `suggestMapping`
- [x] TU-A11 — `convertNote`: limites e motivos de pulo
- [x] TU-A13 — `summarizeSourceDecks`, `countPlannedCards` e `suggestDeckName`

### Testes de integração

- [x] TI-A6 — grafia do catálogo vem do Dexie

## Arquivos relevantes

- `src/app/domain/anki-{mapping,selection,convert}.ts` + `.test.ts` (novos)
- `src/app/domain/anki-{html,cloze,tags}.ts` (tarefa 2), `anki-collection.ts` (tarefa 1)
- `src/app/domain/card-limits.ts`, `tag-catalog.ts` (`listTagCatalog`), `text-marks.ts` (`EMPTY_CARD_MARKS`) — só leitura
