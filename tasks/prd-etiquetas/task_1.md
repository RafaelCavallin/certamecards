# Tarefa 1.0: domain — núcleo de etiquetas (`tags.ts` e limites)

## Visão geral

Cria o módulo puro que define o que é uma etiqueta válida e quando duas são a mesma: `normalizeTag`, `tagKey`, `splitTagInput`, `normalizeTags` e `addTagInput`. Acrescenta `TAGS_MAX`/`TAG_MAX_LENGTH` a `card-limits.ts` e a checagem de 20 etiquetas em `validateCardContent`. Todas as outras tarefas dependem desta: é a única porta de normalização e comparação.

<skills>
### Conformidade com skills

Nenhuma skill específica: é TS puro de `domain/`, sem Angular nem Supabase.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e as rules em `.agents/rules/`. Pontos relevantes:
- `domain/` sem `@angular/*` nem `rxjs`.
- Limites vêm de `card-limits.ts` e espelham o banco (`cardinality(tags) <= 20`).
- Arquivo ≤ 100 linhas e funções ≤ 30 linhas.
- Objeto de parâmetro em `addTagInput` (`TagInputRequest`), para não passar de 3 parâmetros.
- Constantes nomeadas e resultado discriminado em vez de exceção.
- Sem `any`.
- Teste junto, em AAA.
</rules>

<requirements>
- RF46: até 20 etiquetas de 1 a 40 caracteres.
- RF46a: colar texto separado por vírgula cria várias etiquetas.
- RF46b: aparar as pontas e colapsar espaços internos; vazia é ignorada; acima de 40 é rejeitada com explicação.
- RF46c: limite de 20 com a mensagem “Limite de 20 etiquetas”.
- RF47, RF47a, RF47b: comparação sem caixa e sem acento; usar a grafia existente no catálogo; nenhum cartão com equivalentes duplicadas, em qualquer entrada.
</requirements>

## Subtarefas

- [x] 1.1 Adicionar `TAGS_MAX = 20` e `TAG_MAX_LENGTH = 40` a `card-limits.ts`. Estender `validateCardContent` para rejeitar mais de 20 etiquetas, com a mensagem “Limite de 20 etiquetas” (o tipo de entrada ganha `tags`).
- [x] 1.2 Criar `tags.ts` com a constante de diacríticos (depois reusada por `card-search.ts` na tarefa 3.0), `normalizeTag`, `tagKey` e `splitTagInput`.
- [x] 1.3 Implementar `normalizeTags`: idempotente, deduplica pela chave (a primeira grafia vence), descarta vazias e com mais de 40 caracteres, corta em 20.
- [x] 1.4 Implementar `addTagInput(TagInputRequest) → TagInputResult`: grafia do catálogo (RF47a), `rejected` com `too-long`/`limit`, duplicadas e vazias em silêncio.
- [x] 1.5 Escrever os testes TU-18, TU-E1, TU-E2, TU-E5 e TU-E12.

## Detalhes de implementação

Ver [techspec.md](techspec.md): “Principais interfaces” (bloco `domain/tags.ts`), “Regras dos contratos” e, em “Modelos de dados”, os tipos `Card.tags`, `TagInputRequest` e `TagInputResult`. `TagSummary` só é usado aqui como tipo de entrada (o catálogo é da tarefa 3.0): declare a interface em `tags.ts` ou num arquivo de tipos e reexporte.

## Critérios de aceitação relacionados

- CA-24
- CA-E1
- CA-E2
- CA-E3

## Testes da tarefa

### Testes de unidade

- [x] TU-18 — `tagKey` e `addTagInput` com caixa e acento diferentes
- [x] TU-E1 — `normalizeTag` e `splitTagInput` com espaços, vírgulas vazias e quebras de linha
- [x] TU-E2 — `addTagInput` nos limites 20 e 40
- [x] TU-E5 — `normalizeTags`: idempotência, primeira grafia vence, descarte e corte
- [x] TU-E12 — `validateCardContent` com 21 etiquetas

## Arquivos relevantes

- `src/app/domain/tags.ts` (novo)
- `src/app/domain/tags.test.ts` (novo)
- `src/app/domain/card-limits.ts`
- `src/app/domain/card-limits.test.ts`
