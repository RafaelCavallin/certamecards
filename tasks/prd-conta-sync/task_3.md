# Tarefa 3.0: domain — `lww.ts` e `sync-rows.ts`

## Visão geral

Porta `src/services/lww.ts` (idêntico ao Lingo) e `src/services/syncRows.ts` do Lingo, adaptado às novas colunas de `cards` (`front`, `back`, `notes`, `marks`, `learning_steps`, `request_retention`, `tags`). `lww.ts` decide quem vence entre duas versões da mesma linha; `sync-rows.ts` converte entre o formato Dexie (camelCase) e o formato remoto (snake_case), com Zod para tolerar linhas inválidas ou com chaves ausentes sem derrubar a página inteira.

<skills>
### Conformidade com skills

`supabase` — formato das linhas do PostgREST usado como referência de contrato.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Lido o `AGENTS.md` e as rules em `.agents/rules/`. `domain/` é TS puro, sem `@angular/*`/`rxjs`. Arquivos ≤ 100 linhas — `sync-rows.ts` cobre várias tabelas (decks, cards, review_logs, user_settings); se passar de 100 linhas, dividir por tabela mantendo o nome-base (`sync-rows.ts` + módulos irmãos), como a regra de código-padrões exemplifica para `syncPush`. Funções ≤ 30 linhas, ≤ 3 parâmetros, constantes nomeadas para os offsets/limites do Zod.
</rules>

<requirements>
- RF37, RF38 (revisões offline aparecem no outro aparelho após sincronizar, sem duplicar).
- Mapeamento local → remoto da TechSpec-base (tabela "Mapeamento local (Dexie) → remoto (Postgres)").
</requirements>

## Subtarefas

- [x] 3.1 Criar `src/app/domain/lww.ts` com a função `wins(local, remote)` (ou equivalente), desempate determinístico por `id` em caso de `updatedAt` igual.
- [x] 3.2 Criar `src/app/domain/sync-rows.ts` com `toCardRow`/`parseCardRow` (e equivalentes para `Deck`, `ReviewLog`, `UserSettings`), usando Zod com `.nullish()` nos campos que podem faltar no remoto.
- [x] 3.3 Garantir que `parseCardRow` descarta individualmente (retorna `null`) uma linha com `marks` inválido, sem lançar exceção.
- [x] 3.4 Escrever TU-12, TU-13, TU-14.

## Detalhes de implementação

Ver TechSpec-base, "Camada `domain/`" (`lww.ts`, `sync-rows.ts`), "Mapeamento local (Dexie) → remoto (Postgres)" e a nota "Degradação no pull". Ver TechSpec da entrega, "Modelos de dados".

## Critérios de aceitação relacionados

- CA-18

## Testes da tarefa

### Testes de unidade

- [x] TU-12 — `wins` LWW com empate de `updatedAt`
- [x] TU-13 — `parseCardRow` com `marks` inválido e com chaves ausentes
- [x] TU-14 — `toCardRow` / `parseCardRow` ida e volta

## Arquivos relevantes

- `src/app/domain/lww.ts` (novo)
- `src/app/domain/lww.test.ts` (novo)
- `src/app/domain/sync-rows.ts` (novo — barrel; passou de 100 linhas com as 4 tabelas, dividido em `sync-rows-types.ts`, `sync-rows-marks.ts`, `sync-rows-deck.ts`, `sync-rows-card.ts`, `sync-rows-log.ts`, `sync-rows-settings.ts`, conforme code-standards.md item 2)
- `src/app/domain/sync-rows.test.ts`, `sync-rows-extra.test.ts` (novos)
