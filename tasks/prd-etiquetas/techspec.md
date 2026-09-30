# Especificação técnica — Etiquetas

> PRD: [prd.md](prd.md). TechSpec-base: [tasks/produto/techspec.md](../produto/techspec.md). O modelo `Card`, o mapeamento Dexie → Postgres, a DDL (`cards.tags text[]`, `cardinality ≤ 20`), a RPC `sync_push` e as decisões gerais estão lá. Este documento recorta o que entra nesta entrega e não repete esses detalhes. Os IDs de teste da base (TU-18, TU-19, TU-20, TI-10, E2E-11) foram mantidos. Os casos próprios usam o sufixo `E` (`TU-E*`, `TI-E*`, `E2E-E*`). O Lingo não tem etiquetas, então toda a lógica é nova e segue o estilo de `card-search.ts` e `queue.ts`.

## Resumo

As etiquetas moram no campo `tags: string[]` do cartão, que já existe no Dexie, no Postgres e na RPC de sync. Esta entrega não muda schema, migration nem RPC. Todo o comportamento é cliente. Um módulo puro (`domain/tags.ts`) normaliza as etiquetas e compara pela chave `tagKey` (minúsculas, sem acento, espaços colapsados), e é aplicado em todas as entradas: formulário, escrita no Dexie, renomear/juntar e pull. O catálogo (etiquetas com contagem) é calculado em memória a partir dos cartões vivos, sem índice novo. Os filtros (E na lista, OU na fila) são funções puras sobre `Card[]`. Renomear, juntar e excluir fazem um `modify` numa única transação Dexie, que é tudo-ou-nada, e o hook `trackDirty` marca os cartões para o push.

A fila ganha um filtro opcional. `buildQueue` é refatorada em “carregar o contexto do dia” + “montar a fila com um predicado”, para que o filtro seja aplicado **antes** do limite de novos (RF49b) e para que a contagem por etiqueta da Home (`tagQueueCounts`) saia de uma única leitura. O filtro “Estudar só…” é uma preferência do aparelho, por baralho, guardada em `localStorage` (`certamecards.studyTags`) por um store novo, `tag-filter-store`. A parte testável (parse, reconciliação, renomeação) fica em `domain/study-tags.ts`. Na UI entram três componentes reutilizáveis (`tag-input`, `tag-filter`, `tag-chips`), a rota `ajustes/etiquetas` e mudanças em `card-form`, `cards`, `home`, `review` e `settings`.

## Arquitetura do sistema

### Visão dos componentes

| Camada | Módulo | Novo/mod. | Papel |
| --- | --- | --- | --- |
| domain | `card-limits.ts` | mod. | `TAGS_MAX = 20`, `TAG_MAX_LENGTH = 40`. `validateCardContent` passa a checar `tags.length ≤ 20`. |
| domain | `tags.ts` | novo | `normalizeTag`, `tagKey`, `splitTagInput`, `normalizeTags` (dedup pela chave, a primeira vence, descarta inválidas, corta em 20), `addTagInput` (resultado discriminado para o campo). |
| domain | `tag-catalog.ts` | novo | `summarizeTags(cards)` → `TagSummary[]`; `listTagCatalog()` (todos os baralhos vivos); `listDeckTags(deckId)`; `suggestTags`; `compareTagNames` (ordem alfabética sem acento). |
| domain | `tag-filter.ts` | novo | `hasAllTags`, `hasAnyTag`, `filterCardsByTags` (E, para a lista). |
| domain | `tag-chips.ts` | novo | `visibleTagChips(tags, budget)` → `{ shown, hiddenCount }` para o “+N” da lista (RF48c). |
| domain | `tag-bulk.ts` | novo | `planTagRename` (puro: `rename` / `merge` / `invalid`), `renameTag`, `deleteTag`, numa transação. |
| domain | `study-tags.ts` | novo | Puro: `parseStudyTags`, `reconcileStudyTags`, `renameStudyTag`, `removeStudyTag` sobre `StudyTagsByDeck`. |
| domain | `queue.ts` | mod. | `buildQueue(deck, filter?)` com OU entre etiquetas; extrai `loadQueueContext` + `assembleQueue`. |
| domain | `queue-mix.ts` | novo (extraído) | `isYoung`, `interleave`, `countIntroducedToday` saem de `queue.ts` para ele caber em 100 linhas. |
| domain | `queue-tags.ts` | novo | `tagQueueCounts(deck, tagKeys)`: quantos cartões cada etiqueta teria na fila de hoje, lendo os cartões uma vez. |
| domain | `home-summary.ts` | mod. | `homeView` ganha o estado `filtered-empty` e os campos do filtro (RF49c, RF49f). |
| domain | `cards.ts` | mod. | `CardContent.tags`; `createCard`/`updateCardContent` normalizam. `updateCardContent` devolve o conteúdo normalizado. |
| domain | `sync-rows-card.ts` | mod. | `parseCardRow` aplica `normalizeTags` (RF47b no pull). |
| state | `tag-filter-store.ts` | novo | `@Service`: filtro “Estudar só…” por baralho, com `localStorage` e try/catch. |
| state | `review-session.ts` | mod. | Monta a fila com o filtro do baralho ativo. |
| ui | `tag-input/` | novo | Combobox de chips com autocompletar; `model<string[]>`; lê o catálogo por `liveQuerySignal`. |
| ui | `tag-filter/` | novo | Grupo de escolha múltipla (chips com contagem), `model<string[]>` de chaves. Usado pela lista e pela Home. |
| ui | `tag-chips/` | novo | Chips só de exibição, com “+N”. Usado pela lista. |
| ui | `card-form/` | mod. | Campo Etiquetas depois das Notas. As etiquetas **não** são limpas no cadastro em série. Os campos vão para `card-form-fields.ts` para respeitar as 100 linhas. |
| pages | `cards/` | mod. | Filtro por etiqueta + busca; chips em cada item; a linha vai para `card-row.ts`. |
| pages | `home/` | mod. | “Estudar só…”, filtro visível e “Limpar”, estado vazio filtrado; subcomponente `study-filter.ts`. |
| pages | `tags/` | novo | Rota `ajustes/etiquetas`: lista, renomear/juntar, excluir; subcomponente `tag-row.ts`. |
| pages | `settings/`, `card-edit/`, `review/` | mod. | Link “Etiquetas”; `initial` com `tags`; edição na revisão usa o conteúdo normalizado. |
| app | `app.routes.ts` | mod. | Rota `ajustes/etiquetas` com `requireDeck`. |

### Relacionamentos e fluxo de dados

```
card-form ─ tag-input ─(liveQuerySignal)─ listTagCatalog ─┐
    └─ onSubmit ─ createCard/updateCardContent ─ normalizeTags ─ Dexie (hook: dirty=1)
cards ─ liveCards + filterCardsByTags(E) + searchCards ─ card-row ─ tag-chips
home ─ tag-filter-store.keysFor(deck) ─ buildQueue(deck, {tagKeys}) (OU) + tagQueueCounts
review-session ─ tag-filter-store ─ buildQueue(deck, {tagKeys})
tags page ─(liveQuerySignal) listTagCatalog ─ planTagRename ─ renameTag/deleteTag (1 transação)
                                          └─ tag-filter-store.applyRename/applyDelete
sync pull ─ parseCardRow ─ normalizeTags ─ apply LWW (sem mudança)
```

**Offline e sem conta**: nada aqui depende de rede. Etiquetas são gravadas com o cartão no Dexie. O push e o pull já existentes levam o campo sem mudança de contrato. O filtro “Estudar só…” nunca sai do aparelho. Com o armazenamento bloqueado, o store segue só em memória.

**Sync, LWW e CAS**: `renameTag`/`deleteTag` gravam `updatedAt = agora` em cada cartão afetado, e o hook `trackDirty` marca `dirty: 1`. O push leva esses cartões como qualquer edição. Se um cartão for editado durante o push, o CAS de `clearDirty` o mantém sujo, como hoje. Nenhum log é criado, então a ordem cards → logs não muda. No pull, `normalizeTags` roda dentro do parse. Um cartão remoto “sujo” (equivalentes duplicadas, etiqueta vazia ou com mais de 40 caracteres) é gravado já limpo com `dirty: 0` e sem reenvio. A versão remota só é corrigida na próxima edição do cartão. É o comportamento de `normalizeCardMarks` e foi aceito.

## Design de implementação

### Principais interfaces

```ts
// domain/tags.ts
normalizeTag(raw: string): string                  // apara + colapsa espaços
tagKey(tag: string): string                        // NFD sem diacríticos, minúsculas, normalizada
splitTagInput(raw: string): string[]               // quebra por vírgula e quebra de linha
normalizeTags(tags: readonly string[]): string[]   // dedup por chave, 1–40, no máx. 20
addTagInput(input: TagInputRequest): TagInputResult

// domain/tag-catalog.ts
summarizeTags(cards: readonly Card[]): TagSummary[]
listTagCatalog(): Promise<TagSummary[]>            // cartões vivos de baralhos vivos
listDeckTags(deckId: string): Promise<TagSummary[]>
suggestTags(input: SuggestInput): TagSummary[]     // começo de palavra, por contagem desc.

// domain/tag-filter.ts
filterCardsByTags(cards: readonly Card[], keys: readonly string[]): Card[]  // E
hasAnyTag(card: Card, keys: ReadonlySet<string>): boolean                   // OU
```

```ts
// domain/tag-bulk.ts
planTagRename(catalog: readonly TagSummary[], input: TagRenameInput): TagRenamePlan
renameTag(input: TagRenameInput): Promise<TagBulkResult>
deleteTag(key: string): Promise<TagBulkResult>

// domain/queue.ts / queue-tags.ts
buildQueue(deck: Deck, filter?: QueueFilter): Promise<Card[]>
tagQueueCounts(deck: Deck, keys: readonly string[]): Promise<Map<string, number>>

// domain/study-tags.ts
parseStudyTags(raw: string | null): StudyTagsByDeck
reconcileStudyTags(keys: readonly string[], existing: ReadonlySet<string>): string[]
renameStudyTag(map: StudyTagsByDeck, fromKey: string, toKey: string): StudyTagsByDeck
removeStudyTag(map: StudyTagsByDeck, key: string): StudyTagsByDeck
```

```ts
// state/tag-filter-store.ts (@Service)
keysFor(deckId: string): string[]           // lido de um signal interno — reativo
set(deckId: string, keys: string[]): void
clear(deckId: string): void
reconcile(deckId: string, existing: ReadonlySet<string>): void
applyRename(fromKey: string, toKey: string): void
applyDelete(key: string): void

// ui/tag-input: tags = model<string[]>(); label = input('Etiquetas')
// ui/tag-filter: options = input.required<TagOption[]>(); selected = model<string[]>(); label = input.required<string>()
// ui/tag-chips: tags = input.required<string[]>(); budget = input(TAG_ROW_BUDGET)
```

Regras dos contratos:

- `tagKey` é a única comparação de etiquetas no código. Usa a mesma remoção de diacríticos de `card-search.ts`, e a constante vai para `tags.ts` e é reusada pelos dois.
- `normalizeTags` é idempotente e é a única porta de escrita: `createCard`, `updateCardContent`, `renameTag`, `deleteTag` e `parseCardRow` passam por ela. As entregas de importação e de backup vão reusá-la.
- `addTagInput` não lança erro: devolve um resultado discriminado para o campo mostrar a mensagem (RF46b, RF46c, RF47a).
- `buildQueue` sem filtro, ou com `tagKeys` vazio, se comporta exatamente como hoje (os testes TU-06 e TU-07 continuam valendo sem mudança).
- `renameTag` e `deleteTag` rodam em `db.transaction('rw', db.cards, …)` com `Collection.modify`. Qualquer exceção aborta a transação inteira (RF50d). Nome inválido lança `Error` com mensagem em PT-BR antes de abrir a transação.
- `tag-filter-store` guarda **chaves** (`tagKey`), não nomes. A troca só de maiúsculas ou acentos não mexe no filtro, e o nome exibido vem sempre do catálogo do baralho.

### Modelos de dados

Sem mudança de schema no Dexie (`version(1)`) nem no Postgres. O campo `Card.tags` já existe (base: “`Card`”). Não há índice `*tags`: o filtro em memória sobre 5.000 cartões é suficiente (decisão da base), e a entrega de imagens é quem abre a `version(2)`.

#### `Card.tags` — invariantes após esta entrega

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `tags` | `string[]` | sim | 0–20 itens; cada item com 1–40 caracteres, sem espaços nas pontas nem repetidos; nenhum par com a mesma `tagKey`; a ordem é a de inserção. |

```text
{ "id": "c1", "deckId": "d1", "front": "…", "tags": ["CESPE", "Art. 37", "pegadinha"], "updatedAt": 1790000000000, "dirty": 1 }
```

#### `CardContent` — conteúdo editável (modificado)

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `front`, `back`, `notes`, `marks` | — | sim | Como hoje. |
| `tags` | `string[]` | sim | Etiquetas como o formulário as tem; a escrita normaliza. |

```text
{ "front": "O prazo é de 30 dias", "back": "Art. 37, § 5º", "notes": "", "marks": { "front": { "cloze": [], "emphasis": [] }, "back": { "cloze": [], "emphasis": [] }, "notes": { "cloze": [], "emphasis": [] } }, "tags": ["CESPE", "Art. 37"] }
```

#### `TagSummary` — item do catálogo

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `key` | `string` | sim | `tagKey` da etiqueta. |
| `name` | `string` | sim | Grafia exibida: a usada por mais cartões; no empate, a menor em `localeCompare('pt-BR')`. |
| `count` | `number` | sim | Cartões vivos (de baralhos vivos) que a usam. |

```text
[ { "key": "cespe", "name": "CESPE", "count": 128 }, { "key": "art. 37", "name": "Art. 37", "count": 5 } ]
```

#### `TagInputRequest` / `TagInputResult` — adicionar pelo campo

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `raw` | `string` | sim | O que o usuário digitou ou colou. |
| `current` | `string[]` | sim | Chips já no cartão. |
| `catalog` | `TagSummary[]` | sim | Para usar a grafia existente (RF47a). |

```text
{ "kind": "added", "tags": ["CESPE", "Art. 37", "pegadinha"], "rejected": [] }
```

> **Rejeições:** o resultado sempre traz a lista final. `rejected` explica o que ficou de fora, e o campo mostra a primeira mensagem: `too-long` → “Etiquetas têm até 40 caracteres.”; `limit` → “Limite de 20 etiquetas”. Duplicadas e vazias somem em silêncio. Colar 3 etiquetas com 19 chips adiciona 1 e rejeita 2 com `limit`.

```text
{ "kind": "added", "tags": ["…20 etiquetas…"], "rejected": [{ "tag": "FGV", "reason": "limit" }] }
```

#### `SuggestInput` — autocompletar

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `catalog` | `TagSummary[]` | sim | Catálogo global (todos os baralhos). |
| `query` | `string` | sim | Texto em digitação; vazio → nenhuma sugestão. |
| `exclude` | `string[]` | sim | Chips do cartão (comparados por chave). |
| `limit` | `number` | não | Padrão `SUGGESTIONS_MAX = 8`. |

> **Casamento:** a `tagKey` da consulta precisa ser prefixo de alguma palavra da `tagKey` da etiqueta. As palavras são separadas por espaço ou pontuação, então “37” casa com “art. 37” e “art” também. A ordem é por `count` decrescente, com desempate por `compareTagNames`.

#### `TagRenameInput` / `TagRenamePlan` / `TagBulkResult`

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `fromKey` | `string` | sim | Etiqueta de origem. |
| `newName` | `string` | sim | Nome digitado. |

```text
{ "kind": "merge", "fromKey": "cebraspe", "target": { "key": "cespe", "name": "CESPE", "count": 128 }, "affected": 4 }
```

> **Variantes:** `rename` quando a chave nova não existe ou é a mesma da origem (troca só de maiúsculas ou acentos, sem aviso). `merge` quando a chave nova é de outra etiqueta: a UI pede confirmação com `affected` e o nome do alvo. `invalid` quando o nome normalizado fica vazio ou passa de 40 caracteres. Em qualquer variante, cada cartão afetado troca todas as grafias da origem pelo nome final e passa por `normalizeTags`, então nenhum cartão fica com duplicata.
>
> **CA-27 (“Cespe” → “CESPE” com “CESPE” existente):** as duas grafias têm a mesma `tagKey`, então o catálogo já as mostra como uma entrada só (grafia majoritária, contagem somada), e renomeá-la é um `rename` de caixa. Como o `rename` reescreve todas as grafias da chave, um cartão vindo do pull com “Cespe” e “CESPE” sai com uma só “CESPE”. Juntar chaves diferentes (“Cebraspe” → “CESPE”) é o caso `merge`.

```text
{ "kind": "invalid", "reason": "too-long" }
{ "updated": 4 }
```

#### `StudyTagsByDeck` — filtro “Estudar só…” (`localStorage`)

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `<deckId>` | `string[]` | não | Chaves escolhidas para aquele baralho. Ausente ou `[]` = sem filtro. |

```text
certamecards.studyTags = { "d1": ["cespe", "fgv"], "d7": ["art. 37"] }
```

> **Degradação:** JSON inválido, formato inesperado ou `localStorage` inacessível → `{}` (sem filtro), sem exceção. Uma escrita que falha mantém o filtro só em memória até a página fechar (RF49d). Baralhos excluídos deixam entradas órfãs, que são inofensivas e são podadas na próxima gravação (`set`/`clear` gravam só as chaves de baralhos vivos).

#### `QueueFilter` e `HomeView` (modificados)

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `QueueFilter.tagKeys` | `string[]` | sim | OU entre as chaves; vazio = sem filtro. |
| `HomeView.today.filter` | `{ names: string[]; unfilteredSize: number } \| null` | sim | `null` sem filtro. |
| `HomeView.filtered-empty` | `{ names: string[]; unfilteredSize: number }` | — | Filtro ligado com 0 cartões na fila filtrada (RF49f). O botão “Estudar” não aparece. |

```text
{ "kind": "today", "queueSize": 12, "minutes": 3, "filter": { "names": ["CESPE"], "unfilteredSize": 40 } }
{ "kind": "filtered-empty", "filter": { "names": ["FGV"], "unfilteredSize": 40 } }
```

#### Mapeamento remoto → local (pull, modificado)

| Origem (`cards` no PostgREST) | Destino (Dexie) |
| --- | --- |
| `tags` (`text[]`, `null` ou ausente) | `normalizeTags(tags ?? [])` |

### Endpoints da API

Não se aplica. Nenhum endpoint novo nem alterado: `GET /rest/v1/cards` e `POST /rest/v1/rpc/sync_push` já transportam `tags` (base: “`POST /rest/v1/rpc/sync_push`”).

## Pontos de integração

Nenhuma integração externa nova. Supabase: sem mudança. O push de um cartão com mais de 20 etiquetas seria rejeitado pelo `check` e travaria o lote, mas `normalizeTags` torna isso impossível em toda escrita local. Sem migration nesta entrega, por decisão do Rafael: o cliente garante o limite de 1–40 caracteres, e o banco segue checando só o limite de 20 por cartão.

## Abordagem de testes

Vitest com `fake-indexeddb`, `src/test/db-helpers.ts` (`resetDb` no `afterEach`) e `src/test/fake-supabase.ts`. Relógio fixo com `vi.useFakeTimers` + `vi.setSystemTime` nos testes de fila. Nenhuma rede. Piso de 80% em `src/app/domain/**`. Todos os módulos novos de `domain/` entram com teste no mesmo commit.

### Testes de unidade

| ID | Nome do caso de teste | Critérios de aceitação | Resultado esperado |
|----|-----------------------|------------------------|--------------------|
| TU-18 | `tagKey` e `addTagInput` com caixa e acento diferentes | CA-24, CA-E3 | “pegadinha” com “Pegadinha” nos chips não muda a lista; “cespe” com “CESPE” no catálogo vira o chip “CESPE”. |
| TU-19 | `filterCardsByTags` (E) combinado com `searchCards` | CA-25, CA-E6 | Com “CESPE” + “Art. 37”, só os cartões com as duas; a busca por texto restringe o resultado do filtro, e a ordem de aplicação não muda o resultado. |
| TU-20 | `buildQueue` com filtro de etiquetas (OU) e limites depois do filtro | CA-26, CA-E7 | 40 na fila, 12 com “CESPE” → 12; “CESPE, FGV” com 5/4/2 → 11; com 30 novos filtrados e limite 10 → ≤ 10 novos. |
| TU-E1 | `normalizeTag` e `splitTagInput` com espaços, vírgulas vazias e quebras de linha | CA-E1 | “ CESPE ,  Art.   37 , , pegadinha” → `["CESPE", "Art. 37", "pegadinha"]`. |
| TU-E2 | `addTagInput` nos limites 20 e 40 | CA-E2 | 21ª rejeitada com `limit`; 41 caracteres rejeitada com `too-long`; 40 caracteres aceita; colar 3 com 19 chips adiciona 1. |
| TU-E3 | `suggestTags`: começo de palavra, ordem por contagem, exclusão dos chips | CA-24, CA-E4 | “art” → “Art. 5º” (12) antes de “Art. 37” (5); “37” → só “Art. 37”; “peg” → “Pegadinha”; etiqueta já no cartão não aparece; consulta vazia → `[]`. |
| TU-E4 | `summarizeTags`: contagem, grafia majoritária, ordem alfabética sem acento | RF50a, CA-E3 | “Cespe” em 1 cartão e “CESPE” em 3 → uma entrada “CESPE”, 4; “Álcool” antes de “Banca”. |
| TU-E5 | `normalizeTags`: idempotência, primeira grafia vence, descarte e corte | RF47b, CA-E14 | `["CESPE","cespe"," ","x".repeat(41)]` → `["CESPE"]`; 25 válidas → 20 primeiras; aplicar duas vezes dá o mesmo resultado. |
| TU-E6 | `planTagRename`: `rename`, só caixa, `merge` e `invalid` | CA-27, CA-E12 | “Cespe”→“CESPE” (mesma chave): `rename`; “Cebraspe”→“cespe” com “CESPE” existente: `merge` com alvo “CESPE” e `affected`; nome vazio ou com 41: `invalid`. |
| TU-E7 | `parseStudyTags`, `reconcileStudyTags`, `renameStudyTag`, `removeStudyTag` | CA-E9, CA-E12 | JSON inválido → `{}`; chave inexistente sai; renomear troca em todos os baralhos sem duplicar; remover a única deixa `[]`. |
| TU-E8 | `homeView` com filtro: `today.filter` e `filtered-empty` | CA-E10, CA-E11 | Filtro com 0 → `filtered-empty` com `unfilteredSize`; sem filtro → `filter: null`; `total === undefined` continua `loading`. |
| TU-E9 | `visibleTagChips` com orçamento | CA-E16 | Mostra as etiquetas que cabem no orçamento e `hiddenCount` correto; sem etiquetas → nada. |
| TU-E10 | `parseCardRow` normaliza `tags` | CA-E14 | `null` → `[]`; equivalentes → uma; `dirty: 0` preservado; `toCardRow` ida e volta intacta para etiquetas válidas. |
| TU-E11 | `tagQueueCounts` igual a `buildQueue` com uma etiqueta | RF49a, CA-E7 | Para cada chave, o número é igual a `buildQueue(deck, { tagKeys: [chave] }).length`, inclusive com o limite de novos esgotado. |
| TU-E12 | `validateCardContent` com 21 etiquetas | CA-E2 | Inválido, com mensagem “Limite de 20 etiquetas”. |

Prioridade (regra 3 de `tests.md`): primeiro a integridade (`normalizeTags`, `renameTag`/`deleteTag` e o parse do pull), depois a fila filtrada, depois catálogo, sugestões e formatação.

### Testes de integração

| ID | Nome do caso de teste | Critérios de aceitação | Resultado esperado |
|----|-----------------------|------------------------|--------------------|
| TI-10 | `renameTag` juntando duas etiquetas | CA-27 | Numa transação: com cartões que têm “Cespe”, “CESPE” ou as duas (semeados direto no Dexie, como viriam do pull), renomear para “CESPE” deixa todos com uma única “CESPE”; “Cebraspe”→“CESPE” junta sem duplicar em quem tinha as duas; `dirty: 1`, `updatedAt` = agora; retorno `{ updated }` correto. |
| TI-E1 | `createCard` + `updateCardContent` com etiquetas no Dexie real | CA-E3, CA-E5 | Etiquetas gravadas normalizadas; `due`, `reps`, `state` intactos; nenhum `reviewLog` criado; o retorno de `updateCardContent` é o conteúdo normalizado. |
| TI-E2 | `deleteTag` em dois baralhos | CA-E13 | A etiqueta some de todos os cartões vivos; os cartões continuam vivos; campos FSRS iguais; cartões tombstonados não são tocados. |
| TI-E3 | `renameTag` com falha no meio | RF50d | Um hook `updating` que lança no 3º cartão aborta a transação: nenhum cartão alterado, promessa rejeitada. |
| TI-E4 | Fila filtrada consome o limite de novos do dia | CA-E8 | Limite 10, 30 novos “CESPE”: responder 10 com filtro e depois `buildQueue` sem filtro → nenhum novo. |
| TI-E5 | Etiquetas no push e no pull com `fake-supabase` | CA-E14 | `renameTag` → o push envia os cartões com `tags` novas; o pull de uma linha com `["Cespe","CESPE"]` grava `["Cespe"]` com `dirty: 0`. |
| TI-E6 | `listTagCatalog` ignora cartões excluídos e baralhos excluídos | RF50a | A contagem só considera cartões vivos de baralhos vivos. |

### Testes E2E

Roteiros executados à mão com a skill `agent-browser` contra `npm start -- --port <porta livre>` (e `npx supabase start` só para o E2E-E5), com capturas em `tasks/prd-etiquetas/evidences/`. Sem Playwright nem pasta `e2e/`. Para os volumes (5.000 cartões, 1.000 com a mesma etiqueta), o roteiro semeia o IndexedDB `certamecards` pelo `eval` do navegador com a API nativa do IndexedDB (`indexedDB.open('certamecards')` → `cards.put` em lote), com o mesmo formato de `Card`, e recarrega a página.

| ID | Nome do caso de teste | Critérios de aceitação | Resultado esperado |
|----|-----------------------|------------------------|--------------------|
| E2E-11 | Jornada completa: criar com etiquetas, autocompletar, filtrar a lista, “Estudar só…”, renomear em Ajustes | CA-24–CA-27 | Contagens e fila refletem o filtro; a junção não deixa duplicata. |
| E2E-E1 | Campo de etiquetas no formulário | CA-E1, CA-E2, CA-E3, CA-E4, CA-E5 | Colar gera 3 chips; Backspace no vazio remove o último; 20/40 com mensagem; setas + Enter escolhem sugestão, Escape fecha; o leitor de acessibilidade anuncia combobox e listbox; o cadastro em série mantém as etiquetas e limpa os textos; editar etiquetas de um cartão revisado não muda “próxima revisão”. |
| E2E-E2 | Lista com 5.000 cartões: filtro + busca | CA-25, CA-E6, CA-E16 | Aplicar ou retirar etiqueta atualiza a lista e a contagem sem travar (painel Performance: nenhuma tarefa > 150 ms); a rolagem fica fluida; os chips com “+N” não estouram a 360 px; trocar de baralho limpa o filtro. |
| E2E-E3 | “Estudar só…” na Home | CA-26, CA-E7, CA-E9, CA-E10, CA-E11 | O número e a estimativa mudam; “Só: …” + “Limpar” visíveis; o cabeçalho continua com o total; recarregar mantém o filtro; trocar de baralho e voltar restaura; uma etiqueta sem cartões hoje mostra o estado vazio sem “Estudar”; a sessão só apresenta os filtrados. |
| E2E-E4 | Ajustes → Etiquetas: renomear, juntar, excluir | CA-27, CA-E12, CA-E13 | Juntar pede confirmação com a contagem; renomear “Cespe”→“CESPE” com o filtro ligado mantém a Home com “Só: CESPE”; excluir remove de todos e desliga o filtro; excluir “pegadinha” em 1.000 cartões termina em < 2 s. |
| E2E-E5 | Dois perfis na mesma conta (Supabase local) | CA-E14 | Renomear em A + sincronizar; após sincronizar B, só “CESPE” em Ajustes → Etiquetas e nos cartões de B. |
| E2E-E6 | Offline sem conta e a 360 px | CA-E15, CA-E16 | Com o DevTools offline: criar, filtrar, “Estudar só…” e renomear sem erro; tudo persiste depois de recarregar; etiqueta de 40 caracteres sem espaço não gera rolagem horizontal; `npm run check:type-scale` verde. |

## Sequenciamento do desenvolvimento

### Ordem de construção

1. **Núcleo de etiquetas** — `card-limits` (constantes), `tags.ts` + TU-18, TU-E1, TU-E2, TU-E5 e TU-E12. Tudo depende da normalização.
2. **Escrita e pull** — `cards.ts` (`CardContent.tags`, normalização, retorno de `updateCardContent`), `sync-rows-card.ts` + TI-E1, TU-E10 e TI-E5 (parte do pull). Fecha a integridade antes de haver UI.
3. **Catálogo, filtros e lote** — `tag-catalog`, `tag-filter`, `tag-chips`, `tag-bulk` + TU-19, TU-E3, TU-E4, TU-E6, TU-E9, TI-10, TI-E2, TI-E3, TI-E6 e TI-E5 (parte do push).
4. **Fila filtrada** — extrair `queue-mix.ts`, refatorar `buildQueue` (`loadQueueContext` + `assembleQueue`), `queue-tags.ts`, `home-summary.ts` + TU-20, TU-E11, TU-E8 e TI-E4. TU-06/TU-07 precisam continuar verdes sem mudança.
5. **Formulário** — `ui/tag-input`, `card-form` (+ `card-form-fields.ts`), `card-edit`, `review` (edição) → E2E-E1.
6. **Lista** — `ui/tag-filter`, `ui/tag-chips`, `pages/cards` (+ `card-row.ts`) → E2E-E2.
7. **Home e sessão** — `domain/study-tags.ts` + TU-E7, `state/tag-filter-store.ts`, `pages/home` (+ `study-filter.ts`), `review-session` → E2E-E3.
8. **Ajustes → Etiquetas** — `pages/tags` (+ `tag-row.ts`), rota, link em `settings` → E2E-E4.
9. **Validação** — `npm run lint`, `npm run check:type-scale`, `npm run test:coverage`, `npm run build`; E2E-11, E2E-E5 (Supabase local) e E2E-E6.

### Dependências técnicas

- Fase 1 concluída (MVP offline e conta/sync), com `cards.tags` e a `sync_push` já aplicadas nos bancos local e de produção pela migration `20261001000000_schema.sql`.
- Nenhuma dependência npm nova (o combobox e os chips são feitos à mão, com Tailwind e tokens).
- Supabase local (Docker) só para o E2E-E5.
- Deploy: sem migration, a entrega vai para produção só com a promoção da `des` para a `prod`, a pedido do Rafael.

## Monitoramento e observabilidade

Sem backend novo. As etiquetas não criam métrica nem log de servidor.

- Falhas de `renameTag`/`deleteTag` aparecem para o usuário na própria tela (“Não foi possível renomear a etiqueta.”) e vão para `console.error` com o erro original, sem dados do cartão.
- Leituras e escritas de `localStorage` no `tag-filter-store` falham em silêncio (try/catch), como `deck-store`: sem log, porque em navegação privada isso é esperado.
- A meta de adoção do PRD (≥ 50% dos cartões com etiqueta) é conferida à mão com uma consulta no banco de produção (`select avg((cardinality(tags) > 0)::int) from cards where deleted_at = 0`), sem telemetria no app.

## Considerações técnicas

### Principais decisões

- **Sem migration.** Decisão do Rafael: o cliente garante 1–40 caracteres (`normalizeTags` em toda escrita e no pull). Uma checagem no banco só travaria o push de um lote inteiro por um cartão, e custaria um passo manual em produção.
- **Chave de comparação única (`tagKey`)**, a mesma normalização da busca, em vez de guardar as etiquetas já em minúsculas. O usuário escolhe a grafia (“CESPE”, “Art. 37”) e a comparação ignora caixa e acento.
- **Catálogo calculado em memória**, sem índice Dexie `*tags`. Com 5.000 cartões, ler e agregar custa dezenas de ms. Um índice multiEntry exigiria a `version(2)` (reservada para imagens) e não resolveria a comparação sem caixa e sem acento.
- **Filtro da lista com E e da fila com OU** (decisão de produto do PRD). A base previa E também na fila, mas nada estava implementado. A linha TU-20 da TechSpec-base foi atualizada.
- **Filtro antes do limite de novos.** `buildQueue` passa a receber um predicado. A alternativa (filtrar a fila já limitada) mostraria menos novos do que o baralho permite e quebraria CA-26.
- **`tagQueueCounts` numa leitura só**, calculando vencidos e novos por etiqueta com o mesmo `room` do dia, em vez de chamar `buildQueue` uma vez por etiqueta (até 200 leituras). TU-E11 prova que os dois resultados são iguais.
- **O filtro guarda chaves, não nomes.** Renomear só a caixa não mexe no filtro. Renomeação e exclusão feitas neste aparelho atualizam o filtro na hora (`applyRename`/`applyDelete`). As que chegam pela sincronização são resolvidas por `reconcile` quando a Home carrega as etiquetas do baralho: a etiqueta sai do filtro (RF49g aceita esse comportamento para renomeações de outro aparelho).
- **Grafia exibida pela maioria.** Quando o catálogo encontra grafias diferentes da mesma chave (só é possível via pull de dados antigos), mostra a mais usada. Ajustes → Etiquetas resolve com um renomear.
- **Etiquetas mantidas no cadastro em série.** O `card-form` limpa os textos e as marcas, mas não `tags`, quando `initial` é `null`.
- **Descartada: tabela `tags` própria**, pelos motivos da base (outra tabela no sync, joins, custo maior que o de reescrever os cartões ao renomear).

### Riscos conhecidos

- **Renomear em lote com conflito entre aparelhos**: se B editar um cartão antes de receber a renomeação de A, a versão mais nova vence (LWW) e a grafia antiga pode voltar naquele cartão. É o comportamento aceito no RF50e. Mitigação: o catálogo mostra a etiqueta velha com a contagem, e basta renomear de novo.
- **Linha virtualizada de altura fixa** (`cdk-virtual-scroll`, `ROW_SIZE`): os chips precisam caber numa linha de altura conhecida. Mitigação: uma linha só de chips, com `overflow-hidden`, mais `visibleTagChips` com um orçamento de caracteres (TU-E9). Validar no E2E-E2 a 360 px com etiquetas de 40 caracteres.
- **Tamanho de arquivos**: `card-form.ts` (98), `cards.ts` (90), `home.ts` (83) e `queue.ts` (88) já estão perto do limite de 100 linhas. As extrações `card-form-fields.ts`, `card-row.ts`, `study-filter.ts` e `queue-mix.ts` fazem parte do escopo, não são opcionais.
- **Combobox acessível feito à mão**: é o ponto de UI com mais detalhes (foco, `aria-activedescendant`, teclado no Android). Mitigação: seguir o padrão APG “Combobox with listbox popup” e validar no E2E-E1 com teclado e com o toque no celular.
- **`Collection.modify` com 1.000+ cartões**: a meta é < 2 s. Se o `modify` com hook ficar lento no fake ou no navegador, a alternativa é `bulkPut` dos cartões alterados na mesma transação. Medir no E2E-E4.
- **Refatoração de `buildQueue`**: é a regra mais crítica da revisão diária. Mitigação: TU-06 e TU-07 inalterados como rede de segurança, mais TU-E11.

### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e todas as rules de `.agents/rules/` (`code-standards.md`, `javascript-typescript.md`, `tests.md`).

- **Camadas**: todo `domain/` novo é TS puro (sem `@angular/*` nem `rxjs`). `pages/` e `ui/` não abrem o Dexie. Leituras reativas usam `liveQuerySignal` direto no componente (`tag-input`, `pages/tags`). Escritas (`renameTag`, `deleteTag`, `createCard`) são chamadas direto do componente. `tag-filter-store` só existe porque o filtro é compartilhado por Home e revisão. `ui/` não importa `pages/`.
- **Regras de domínio**: editar etiquetas não reagenda nem gera log (RF47c, TI-E1). Os campos FSRS continuam exclusivos do `scheduler`. Os limites vêm de `card-limits.ts`, alinhados ao `check (cardinality(tags) <= 20)` do banco.
- **Schema e sync**: sem coluna nova, então `sync_push` não é reemitida e `sync-rows` só ganha a normalização no parse.
- **Código**: arquivos ≤ 100 linhas (daí as extrações listadas), funções ≤ 30 linhas, ≤ 3 parâmetros (objetos `TagInputRequest`, `SuggestInput`, `TagRenameInput`), constantes nomeadas (`TAGS_MAX`, `TAG_MAX_LENGTH`, `SUGGESTIONS_MAX`, `TAG_ROW_BUDGET`, `STUDY_TAGS_KEY`), sem `any` (o parse do `localStorage` usa `unknown` + narrowing), `function` nas funções de topo e arrow nos callbacks.
- **UI**: controle de fluxo `@if`/`@for`, `input()`/`model()`/`signal`, `inject()`, OnPush; cores por token, escala `text-label`/`text-meta`/`text-body`; `npm run check:type-scale` no CI.
- **Testes**: todo módulo novo com teste, AAA, relógio fixo, fakes do repositório, piso de 80% em `domain/`. UI validada pelos E2E manuais com `agent-browser`.

### Conformidade com skills

- `angular-developer`: componentes standalone com signals, `model()` nos campos de chips e filtro, combobox com ARIA e `<dialog>` nativo no “Estudar só…”, seguindo o que o projeto já faz no `deck-switcher`.
- `agent-browser`: execução dos roteiros E2E-11 e E2E-E1 a E2E-E6.
- `supabase`: consultada só para confirmar que nada muda (sem migration, RLS ou RPC). A única interação é o E2E-E5 no Supabase local.
- `vercel-cli`: não se aplica (sem variável de ambiente nova).

Nenhum desvio.

### Arquivos relevantes e dependentes

- Novos: `src/app/domain/{tags,tag-catalog,tag-filter,tag-chips,tag-bulk,study-tags,queue-mix,queue-tags}.ts` e os respectivos `.test.ts`; `src/app/state/tag-filter-store.ts`; `src/app/ui/{tag-input,tag-filter,tag-chips}/*`; `src/app/ui/card-form/card-form-fields.ts`; `src/app/pages/tags/{tags,tag-row}.{ts,html}`; `src/app/pages/cards/card-row.{ts,html}`; `src/app/pages/home/study-filter.{ts,html}`.
- Modificados: `src/app/domain/{card-limits,cards,queue,home-summary,sync-rows-card,card-search}.ts` (`card-search` passa a importar o padrão de diacríticos de `tags.ts`) e os respectivos testes; `src/app/state/review-session.ts`; `src/app/ui/card-form/card-form.{ts,html}`; `src/app/pages/{cards,home,card-edit,review,settings}/*`; `src/app/app.routes.ts`.
- Só leitura (contrato inalterado): `src/app/domain/db.ts`, `dirty-tracking.ts`, `sync-push*.ts`, `sync-pull*.ts`, `supabase/migrations/20261001000000_schema.sql`, `src/test/{db-helpers,fake-supabase}.ts`.
- Documentos: [tasks/produto/techspec.md](../produto/techspec.md) (linha TU-20 atualizada para OU).
