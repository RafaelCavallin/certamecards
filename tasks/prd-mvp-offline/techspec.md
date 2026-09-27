# Especificação técnica — MVP offline

> PRD: [prd.md](prd.md). TechSpec-base: [tasks/produto/techspec.md](../produto/techspec.md) — arquitetura, modelos de dados, esquema Dexie, decisões e riscos estão lá; este documento recorta o que entra nesta entrega e não repete detalhes. IDs de teste (TU, TI, E2E) preservados da base. Referência de implementação: repositório **lingo**, branch `des` (commit `41d116b`).

## Resumo

Primeira entrega da Fase 1: fundação do projeto Angular 22, camada `domain/` offline portada do Lingo com os testes, e todas as telas do estudo sem conta. Nada fala com o Supabase; `src/environments/env.ts` é gerado com `null` e o app segue sem conta. Termina com o deploy de preview na branch `des`.

## Arquitetura do sistema

### Visão dos componentes

Recorte das tabelas “Camada `domain/`”, “Camada `state/`”, “Camada `pages/`” e “Camada `ui/`” da base.

| Camada | Entra nesta entrega | Fica para `prd-conta-sync` |
| --- | --- | --- |
| `domain/` | `db`, `dirty-tracking`, `decks`, `cards`, `card-limits`, `text-marks`, `scheduler`, `queue`, `stats`, `dates`, `card-search`, `home-summary`, `due-badge`, `type-scale` | `lww`, `sync`, `sync-pull`, `sync-push`, `sync-rows`, `auth`, `supabase` |
| `state/` | `live-query`, `deck-store`, `due-tick`, `review-session` | `auth-store`, `sync-store` |
| `pages/` | `home`, `review`, `cards`, `card-new`, `card-edit`, `progress`, `settings` (sem seção de conta), `no-deck` | `account`; seção de conta em `settings` |
| `ui/` | todos da tabela da base | — |
| `src/test/` | `setup.ts` (fake-indexeddb, Web Locks), `db-helpers.ts` | `fake-supabase.ts` |

Fundação (também desta entrega): `styles.css` com tokens em variáveis e `@theme inline`, escala tipográfica, token `on-signal`, fontes `@fontsource-variable/*`; `vitest.config.ts` do domínio; `scripts/write-env.mjs`; `scripts/check-type-scale.mjs`; `vercel.json`; `ngsw-config.json`; CI.

## Design de implementação

### Principais interfaces

As de `domain/cards.ts`, `domain/scheduler.ts` + `queue.ts`, `domain/text-marks.ts`, `state/live-query.ts` e `state/review-session.ts`, como na seção “Principais interfaces” da base. As de Fase 2 e `syncNow` não entram.

### Modelos de dados

`Deck`, `Card`, `CardMarks`/`Marks`/`Range`, `ReviewLog` como na base. `Card.tags` existe e é sempre `[]`.

**Esquema Dexie:** `db.version(1)` exatamente como na base, **incluindo** `settings` e `syncState`, ainda sem uso. Motivo: a entrega de sync não pode exigir uma `version(2)` só para criar tabelas que o schema final já prevê; a `version(2)` fica reservada para imagens (F17).

`dirty` é mantido pelos hooks desde já: cartões criados offline antes de existir conta sobem no primeiro push.

### Endpoints da API

Nenhum nesta entrega.

## Pontos de integração

- **Vercel** — como na base: rewrite SPA, `Cache-Control: no-cache` para `ngsw.json`/`ngsw-worker.js`. Sem variáveis `NG_APP_*` configuradas ainda; `write-env.mjs` grava `null`.
- **Service worker** — como na base, sem `dataGroups`. `SwUpdate.versionUpdates` → aviso “Nova versão — recarregar”.
- `navigator.storage.persist()` no boot (RF45).

## Abordagem de testes

Mesmo runner e mesma configuração da base. Piso de 80% em `src/app/domain/**` desde a primeira tarefa.

### Testes de unidade

| ID | Caso | Critérios |
| --- | --- | --- |
| TU-01 | `splitByMarks` com lacuna e destaque | CA-04, CA-05 |
| TU-02 | `remapRanges` ao inserir antes, depois e através | CA-07 |
| TU-03 | `trimRange` e `markAt` | CA-08 |
| TU-04 | `normalizeCardMarks` com chaves ausentes/nulas | CA-04 |
| TU-05 | `normalizeCardMarks` descarta lacunas de Verso e Notas | CA-06 |
| TU-06 | `buildQueue` com 30 novos e limite 10 | CA-12 |
| TU-07 | `buildQueue` respeita teto de não firmados | CA-12 |
| TU-08 | `answer` grava estado FSRS v5 (`learningSteps`) | CA-13 |
| TU-09 | `frontSizeClass` acima/abaixo de 280 caracteres | CA-23 |
| TU-10 | `searchCards` sem acento e sem caixa nas Notas | CA-15 |
| TU-11 | `computeStats` retenção 8/10 | CA-16 |
| TU-15 | `validateCardContent` nos limites 5000/5000/20000 | CA-01 |
| TU-17 | `homeView` / `studyButtonLabel` | CA-11 |

Resultado esperado de cada um: tabela “Testes de unidade” da base.

### Testes de integração

| ID | Caso | Critérios |
| --- | --- | --- |
| TI-01 | `createCard` + `updateCardContent` no Dexie real | CA-01, CA-03 |
| TI-02 | `answer` grava card e log na mesma transação | CA-13 |
| TI-03 | `ensureDefaultDeck` concorrente e após excluir o último | CA-09 |
| TI-04 | `deleteDeck` tombstona cartões e some da fila | CA-10 |

### Testes E2E

Roteiros com `agent-browser` contra `ng serve`, sem Supabase.

| ID | Caso | Critérios |
| --- | --- | --- |
| E2E-01 | Criar cartão com 3 parágrafos nas Notas, ocultar e destacar | CA-01, CA-02, CA-04, CA-05 |
| E2E-02 | Sessão de revisão completa por teclado | CA-13 |
| E2E-03 | Verso e Notas só oferecem destacar | CA-06 |
| E2E-04 | Editar cartão durante a revisão | CA-14 |
| E2E-05 | Criar, trocar e excluir baralho pelo seletor | CA-09, CA-10 |
| E2E-06 | Home recontando sozinha | CA-11 |
| E2E-07 | Offline sem conta (DevTools offline) | CA-17, CA-22 |
| E2E-10 | Tipografia a 360 px e ausência de áudio | CA-21, CA-23 |

CA-03, CA-07, CA-08, CA-12, CA-15 e CA-16 são cobertos pelos TU/TI acima e conferidos de passagem nos roteiros E2E-01, E2E-02 e E2E-05 (e na lista e no Progresso, com dados semeados).

## Sequenciamento do desenvolvimento

### Ordem de construção

Etapas 1 a 6 da base:

1. **Fundação** — `ng new`, Tailwind, PWA, tokens e escala, fontes, Vitest do domínio, `write-env.mjs`, `check-type-scale.mjs`, `vercel.json`, CI. Build limpo com Dexie e ts-fsrs antes de portar o domínio.
2. **Domínio offline** — módulos da tabela acima com TU-01–TU-11, TU-15, TU-17 e TI-01–TI-04.
3. **Estado + casca** — `live-query`, `deck-store`, `due-tick`, rotas e guards, `mobile-nav`, `deck-switcher`, `no-deck`.
4. **Cadastro** — `mark-backdrop`, `mark-actions`, `markable-field`, `card-form`, `card-new`, `card-edit`. Maior risco de UI: atacar cedo.
5. **Revisão e Home** — `marked-text`, `card-face`, `answer-bar`, `review-session`, `review` (com `<dialog>` de edição), `home`, `heatmap`, `due-badge`.
6. **Lista, Progresso e Ajustes** — `cards` (busca, virtualização, lote, `confirm-dialog`), `progress` (`bar-chart`), `settings` sem conta. Roteiro E2E completo e deploy de preview na `des`.

### Dependências técnicas

Node 22.22.3+ ou 24.15+, TypeScript 6; projeto Vercel com as branches `des` e `prod`. Nem Docker nem Supabase são necessários nesta entrega.

## Monitoramento e observabilidade

Só console (`console.error` para falha inesperada, nunca conteúdo de cartão) e, opcionalmente, Speed Insights da Vercel para a meta de primeira carga ≤ 3 s.

## Considerações técnicas

### Principais decisões

Todas as da base que tocam o offline: Angular 22 com signals e sem NgRx; domínio em TS puro; Dexie + `liveQuery` → signal; `marks` único; lacuna só na Frente; Notas em texto puro; escala tipográfica semântica; tokens em variáveis com `on-signal` já no MVP; edição da revisão em `<dialog>`; gráficos em SVG próprio; ts-fsrs v5. Mais:

- **Schema Dexie final já na v1**, com `settings` e `syncState`, pelo motivo em “Modelos de dados”.
- **`card-face` e `answer-bar` extraídos já agora**, porque a Fase 2 reusa os dois no reforço.

### Riscos conhecidos

Da base: seleção no textarea (maior risco), desalinhamento do overlay de marcas, autoaltura com Notas longas, compatibilidade do Angular 22/TS 6, atualização do service worker, limites de texto divergentes e evicção do IndexedDB no iOS.

### Conformidade com o AGENTS.md e as rules

Como na base.

### Conformidade com skills

`angular-developer` em `src/app/`, `vercel-cli` no deploy de preview, `agent-browser` nos roteiros E2E.

### Arquivos relevantes e dependentes

Lista da base, exceto `lww.ts`, `sync.ts`, `syncRows.ts`, `auth.ts`, `supabase.ts`, `fakeSupabase.ts`, `Account.tsx` e as migrations.
