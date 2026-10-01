# Tarefa 3.0: domain — catálogo, filtros e operações em lote

## Visão geral

Cria o restante da lógica de etiquetas usada pelas telas:
- **Catálogo** (`tag-catalog.ts`): etiquetas com contagem, globais e por baralho, e o autocompletar.
- **Filtro E da lista** (`tag-filter.ts`).
- **Orçamento de chips com “+N”** (`tag-chips.ts`).
- **Renomear, juntar e excluir em lote** (`tag-bulk.ts`), numa transação tudo-ou-nada.

<skills>
### Conformidade com skills

Nenhuma skill específica: é TS puro de `domain/` com Dexie.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e as rules em `.agents/rules/`. Pontos relevantes:
- `domain/` sem Angular.
- `tagKey` é a única comparação de etiquetas.
- Escrita em lote sempre por `normalizeTags`, numa só `db.transaction`. `updatedAt` = agora, e o `dirty` fica a cargo do hook `trackDirty`, sem gravação manual.
- Campos FSRS intocados e nenhum log criado.
- Objetos de parâmetro (`SuggestInput`, `TagRenameInput`).
- Arquivos ≤ 100 linhas cada.
- Teste junto; o lote é prioridade de integridade (regra 3 de `tests.md`).
</rules>

<requirements>
- RF46d: sugestões de todos os baralhos, por começo de palavra, sem caixa nem acento, ordenadas por uso, sem as que o cartão já tem.
- RF48a: filtro da lista com E, combinável com a busca.
- RF48c: chips com “+N” quando não cabem numa linha.
- RF50a: todas as etiquetas em ordem alfabética sem acento, com contagem de cartões vivos de baralhos vivos.
- RF50b: renomear no lugar; aviso e confirmação quando o nome novo junta com outra; troca só de caixa sem aviso.
- RF50c: excluir de todos os cartões, que continuam existindo.
- RF50d: tudo-ou-nada, sem mexer em agenda, histórico ou estatísticas.
- RF50e: os cartões alterados sobem na próxima sincronização.
</requirements>

## Subtarefas

- [x] 3.1 `tag-catalog.ts`: `summarizeTags` (grafia majoritária, contagem somada), `compareTagNames`, `listTagCatalog` (cartões vivos de baralhos vivos), `listDeckTags(deckId)` e `suggestTags(SuggestInput)`.
- [x] 3.2 `card-search.ts` passa a importar o padrão de diacríticos de `tags.ts` (sem mudar o comportamento; TU-10 continua verde).
- [x] 3.3 `tag-filter.ts`: `hasAllTags`, `hasAnyTag`, `filterCardsByTags` (E).
- [x] 3.4 `tag-chips.ts`: `visibleTagChips(tags, budget)` → `{ shown, hiddenCount }` e a constante `TAG_ROW_BUDGET`.
- [x] 3.5 `tag-bulk.ts`: `planTagRename` (puro: `rename`/`merge`/`invalid`), `renameTag` e `deleteTag` com `Collection.modify` numa transação. Nome inválido lança `Error` em PT-BR antes de abrir a transação.
- [x] 3.6 Escrever TU-19, TU-E3, TU-E4, TU-E6, TU-E9, TI-10, TI-E2, TI-E3, TI-E6 e a parte de push do TI-E5.

## Detalhes de implementação

Ver [techspec.md](techspec.md):
- “Principais interfaces”: blocos `tag-catalog`, `tag-filter` e `tag-bulk`.
- “Modelos de dados”: `TagSummary`, `SuggestInput`, `TagRenameInput`/`TagRenamePlan`/`TagBulkResult` e a nota sobre o CA-27.
- “Principais decisões”: catálogo em memória e grafia pela maioria.
- “Riscos conhecidos”: `Collection.modify` com mais de 1.000 cartões. Se ficar lento, usar `bulkPut` na mesma transação.

## Critérios de aceitação relacionados

- CA-24
- CA-25
- CA-27
- CA-E4
- CA-E6
- CA-E12
- CA-E13
- CA-E14
- CA-E16

## Testes da tarefa

### Testes de unidade

- [x] TU-19 — `filterCardsByTags` (E) combinado com `searchCards`
- [x] TU-E3 — `suggestTags`: começo de palavra, ordem por contagem, exclusão dos chips
- [x] TU-E4 — `summarizeTags`: contagem, grafia majoritária, ordem alfabética sem acento
- [x] TU-E6 — `planTagRename`: `rename`, só caixa, `merge` e `invalid`
- [x] TU-E9 — `visibleTagChips` com orçamento

### Testes de integração

- [x] TI-10 — `renameTag` juntando duas etiquetas
- [x] TI-E2 — `deleteTag` em dois baralhos
- [x] TI-E3 — `renameTag` com falha no meio
- [x] TI-E5 (parte do push) — os cartões renomeados vão no push com as `tags` novas
- [x] TI-E6 — `listTagCatalog` ignora cartões excluídos e baralhos excluídos

## Arquivos relevantes

- `src/app/domain/tag-catalog.ts` + `.test.ts` (novos)
- `src/app/domain/tag-filter.ts` + `.test.ts` (novos)
- `src/app/domain/tag-chips.ts` + `.test.ts` (novos)
- `src/app/domain/tag-bulk.ts` + `.test.ts` (novos)
- `src/app/domain/card-search.ts`
- `src/app/domain/tags.ts`
- `src/app/domain/sync-push.test.ts`
- `src/test/db-helpers.ts`, `src/test/fake-supabase.ts` (leitura)
