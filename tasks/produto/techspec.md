# Especificação técnica — CertameCards

> PRD: [`tasks/produto/prd.md`](prd.md). Referência de implementação: repositório **lingo**, branch `des` (commit `41d116b`).
>
> TechSpec-base do produto: não é executada diretamente. Cada entrega recorta este documento na própria pasta — [prd-mvp-offline](../prd-mvp-offline/techspec.md) (etapas 1–6), [prd-conta-sync](../prd-conta-sync/techspec.md) (etapas 7–8) e, na Fase 2, uma pasta por fatia (ver “Divisão em entregas” no PRD). O módulo `lww` foi para a entrega de sincronização, a única que o usa.

## Resumo

O CertameCards é o Lingo com outro domínio e outro framework de UI. A estratégia é **portar, não reescrever**: toda a lógica de negócio do Lingo que não depende de React (Dexie + hooks de `dirty`, FSRS, fila do dia, marcas de texto, LWW, sincronização por pull/push, decisão de login, estatísticas) é copiada para uma camada `src/app/domain/` em TypeScript puro, com os testes Vitest que já existem adaptados aos novos campos. Só a camada de apresentação é nova, escrita em **Angular 22** (standalone, signals, zoneless, `OnPush` padrão, controle de fluxo `@if/@for`, Signal Forms quando fizer sentido). O backend é o mesmo desenho do Lingo: **Supabase** (Postgres + Auth + RLS + RPC `sync_push`), sem funções serverless — o CertameCards não precisa de `api/` porque não há TTS nem LLM.

As decisões que mudam em relação ao Lingo: cartão com `front`/`back`/`notes` e **um único `marks jsonb`** com as marcas dos três campos (lacuna só na Frente; destaque nos três); `learning_steps` do ts-fsrs v5; `request_retention` por baralho (coluna pronta, UI futura); roteamento pelo Angular Router em vez de `useState`; gráficos simples em SVG sem biblioteca; e uma **escala tipográfica semântica** no Tailwind v4 (`text-label`, `text-meta`, `text-body`, `text-front`…) que aplica os textos maiores exigidos pelo PRD sem espalhar tamanhos soltos pelos templates.

A **Fase 2** (PRD F11–F17) entra em fatias independentes sobre a mesma base: etiquetas e configurações do usuário já nascem no schema inicial (a RPC de sync não é reemitida); imagens ganham tabela, bucket do Storage e RPC próprios; o lembrete usa Web Push disparado por uma Edge Function agendada; importação do Anki e backup são portados do Lingo sem áudio; o tema claro redefine só os tokens de cor.

## Arquitetura do sistema

### Visão dos componentes

```
src/
├── index.html, main.ts, styles.css      Entrada, bootstrap, Tailwind v4 + tokens + fontes
├── environments/env.ts                   GERADO por scripts/write-env.mjs (não versionado)
└── app/
    ├── app.ts / app.config.ts / app.routes.ts   Casca, providers, rotas
    ├── domain/     TS puro — NUNCA importa @angular/* nem nada de state/pages/ui
    ├── state/      Serviços Angular (@Service) com signals: ponte domain ↔ telas
    ├── pages/      Uma pasta por rota (componente roteado)
    └── ui/         Componentes reutilizáveis entre páginas
src/test/          setup.ts (fake-indexeddb, Web Locks), fake-supabase.ts, db-helpers.ts
supabase/          migrations/, config.toml (portas 55321–55327)
scripts/           write-env.mjs, check-type-scale.mjs
```

**Regras de dependência** (equivalentes às do Lingo): `domain/` não importa Angular; `pages/` e `ui/` só acessam dados via `state/` (ou funções de `domain/` puras de formatação); `ui/` não importa `pages/`; `src/test/` só é importado por testes.

#### Camada `domain/` (portada do Lingo)

| Módulo | Origem no Lingo | Mudança |
| --- | --- | --- |
| `db.ts` | `services/db.ts` | Banco Dexie `certamecards`, versão 1 limpa (sem histórico de migrations); tipos `Deck`, `Card`, `CardMarks`, `ReviewLog`, `SyncState`; sem `audioBlobs`. |
| `dirty-tracking.ts` | `trackDirty` em `db.ts` | Idêntico — hooks `creating`/`updating` marcam `dirty`. |
| `decks.ts` | `ensureDefaultDeck`, `deleteDeck` + `DeckContext` | `ensureDefaultDeck` (“Meus cartões”), `createDeck`, `renameDeck`, `updateDeckRhythm`, `deleteDeck` (tombstone em cascata local). |
| `cards.ts` | `updateCard`, `deleteCard`, `liveCards` | `createCard`, `updateCardContent` (nunca toca FSRS), `deleteCards` (lote), `liveCards`. |
| `card-limits.ts` | — (novo) | `FRONT_MAX=5000`, `BACK_MAX=5000`, `NOTES_MAX=20000`, `DECK_NAME_MAX=80` — mesmos valores dos `check` do Postgres. |
| `text-marks.ts` | `components/textMarks.ts` | Copiado; ganha `CardMarks`, `EMPTY_CARD_MARKS`, `normalizeCardMarks` (que descarta qualquer lacuna fora da Frente). |
| `scheduler.ts` | `services/scheduler.ts` | ts-fsrs **v5**: grava `learningSteps`; instância FSRS por `requestRetention` (cache). |
| `queue.ts` | `buildQueue`/`interleave`/`countIntroducedToday` | Extraído para caber em 100 linhas; lógica idêntica. |
| `lww.ts` | `services/lww.ts` | Idêntico. |
| `sync.ts`, `sync-pull.ts`, `sync-push.ts` | `services/sync.ts` | Mesmo algoritmo (keyset em `synced_at`, overlap 5 s, CAS no `clearDirty`, cards antes de logs, `navigator.locks`); dividido por responsabilidade. Chave de lock `certamecards-sync`. |
| `sync-rows.ts` | `services/syncRows.ts` | Zod para as novas colunas (`front`, `back`, `notes`, `marks`, `learning_steps`, `request_retention`). |
| `auth.ts` | `services/auth.ts` | Idêntico (adoção, troca de conta, `decideOnSignIn`, `completeSignIn`); nome do baralho padrão muda. |
| `supabase.ts` | `services/supabase.ts` | Import dinâmico do SDK; lê `env.supabaseUrl`/`env.supabasePublishableKey`. |
| `stats.ts` | `services/stats.ts` | Idêntico; `iso()` passa a vir de `dates.ts` (no Lingo vinha de um componente — quebra de camada corrigida). |
| `dates.ts` | `iso` de `components/Heatmap.tsx` | `iso`, `startOfToday`, `DAY`. |
| `card-search.ts` | — (novo) | Busca sem acento e sem caixa em frente/verso/notas. |
| `home-summary.ts`, `due-badge.ts` | `components/homeSummary.ts`, `dueBadge.ts` | Copiados, textos trocados (“cartões” em vez de “frases”). |
| `type-scale.ts` | — (novo) | `frontSizeClass(text)` → `text-front` ou `text-front-long` (limite 280 caracteres). |

**Não portar**: `audio*`, `recorder`, `pronunciation`, `enrich`, `ankiImport`, `optimizer` + worker, `backup*`/`restore*`, `Waveform`, `VoiceCompare`, `usePhoneticLookup`, `useSpeechPreview`, `HintsEditor`.

#### Camada `state/` (nova, Angular)

| Serviço | Papel |
| --- | --- |
| `live-query.ts` | `liveQuerySignal(querier)` — `liveQuery` do Dexie → `toSignal`, com cancelamento no `DestroyRef`. Único ponto onde Dexie vira signal. |
| `deck-store.ts` | `decks`, `activeDeckId` (persistido em `localStorage` com try/catch), `deck` (computed), `totalDue`; delega escrita para `domain/decks.ts`. Substitui o `DeckContext`. |
| `auth-store.ts` | `session`, `phase` (`restoring`/`signed-out`/`signed-in`), `pendingDecision`, `signIn`, `signUp`, `signOut`, `resolveDecision(plan)`. Substitui o `AuthContext`. |
| `sync-store.ts` | `status`, `lastSyncAt`, `syncNow(reason)`; registra os gatilhos: boot, evento `online`, `NavigationEnd` para `/` (fim de sessão), login concluído. |
| `due-tick.ts` | Signal que incrementa a cada 30 s (recontagem da fila — RF23). |
| `review-session.ts` | Fornecido **na rota** `revisar` (não é root): fila, índice, `revealed`, `answering`, `done`, `answer(rating)`, `replaceCurrent(card)` após edição. |

#### Camada `pages/` (rotas)

| Rota | Página | Origem | Observação |
| --- | --- | --- | --- |
| `''` | `home/` | `Home.tsx`, `HomeToday`, `HomeOnboarding` | Guard `requireDeck`. |
| `revisar` | `review/` | `Review.tsx` sem áudio | Atalhos Espaço/1/2; editar abre `<dialog>` com `CardForm` (RF30). |
| `cartoes` | `cards/` | `Cards.tsx` | Busca com `card-search`, virtualização com `@angular/cdk/scrolling`. |
| `cartoes/novo` | `card-new/` | `AddCard.tsx` | Cadastro em série. |
| `cartoes/:id` | `card-edit/` | `EditCard.tsx` | Volta com `Location.back()`. |
| `progresso` | `progress/` | `Progress.tsx` | `loadComponent` (lazy); gráficos em SVG. |
| `ajustes` | `settings/` | `Settings.tsx` sem voz/velocidade | |
| `conta` | `account/` | `Account.tsx` | Decisão de login (juntar/descartar/cancelar). |
| `sem-baralho` | `no-deck/` | `NoDeck.tsx` | Guard `requireNoDeck`. |

#### Camada `ui/` (componentes)

| Componente | Origem | Notas |
| --- | --- | --- |
| `markable-field` | `MarkableField.tsx` | `allowCloze` (só `true` na Frente, como a tradução no Lingo); `model()` para `value` e `marks`; `minRows` (Notas = 6); autoaltura em `afterRenderEffect`; seleção lida por `selectionchange` (ver Riscos). |
| `mark-backdrop` | `MarkBackdrop.tsx` | Idêntico; só moldura/fundo/sublinhado, nunca muda métrica do texto. |
| `mark-actions` | `MarkActions.tsx` | Sem “transcrição fonética”; `mousedown.preventDefault` para manter a seleção. |
| `marked-text` | `MarkedText.tsx` | `hideCloze` como no Lingo; lacuna revelada ganha fundo sutil (`bg-signal/15`). |
| `card-form` | `CardForm.tsx` | Frente, Verso, Notas + contador perto do limite; sem geração por IA. |
| `heatmap`, `due-badge`, `skeleton`, `deck-switcher`, `mobile-nav` | Mesmos nomes | `deck-switcher` e `mobile-nav` usam `<dialog>` nativo (Escape e foco de graça). |
| `bar-chart` | `Progress.tsx` (Recharts) | SVG de 14 barras, sem dependência. |
| `confirm-dialog` | — | Confirmação de exclusão (baralho, lote de cartões). |
| `card-face`, `answer-bar` | Trechos de `Review.tsx` | Extraídos já no MVP: a Fase 2 reusa os dois na sessão de reforço. |

#### Fase 2 — componentes novos ou modificados

| Camada | Módulo | Origem | Papel |
| --- | --- | --- | --- |
| domain | `tags.ts` | novo | `normalizeTag` (apara, junta espaços), `tagKey` (minúsculas sem acento), `addTag` sem duplicar, `listTags` com contagem, `renameTag`/`deleteTag` em lote numa transação. |
| domain | `queue.ts` | modificado | `buildQueue(deck, { tags })`: filtra antes de aplicar os limites de novos. |
| domain | `difficulty.ts` | novo | `difficultyScore = 2 × lapses + erros em 30 dias`; `listDifficult(deckId)` com corte `DIFFICULT_THRESHOLD = 3`. |
| domain | `reinforce.ts` | novo | `buildReinforceQueue({ deckId, tags, limit: 30 })`. Nenhuma escrita. |
| domain | `settings.ts`, `goals.ts` | novo | Configurações `'me'` (LWW); `goalProgress(today, goal)`, `goalStreak(byDay, goal)`. |
| domain | `reminder-ics.ts` | novo | `buildDailyIcs({ minute, timeZone })` — `RRULE:FREQ=DAILY`, `VALARM` no horário. |
| domain | `anki-import.ts`, `anki-html.ts`, `anki-cloze.ts` | `services/ankiImport.ts` | Leitura do `.apkg` (idem Lingo) + `htmlToMarkedText` (quebras e negrito → destaque) + `expandCloze` (um cartão por cN) + etiquetas da nota. |
| domain | `backup-format.ts`, `backup-export.ts`, `backup-plan.ts`, `backup-apply.ts`, `backup-restore.ts` | `services/backup*.ts` | Sem áudio; formato `certamecards-backup` v1; pasta `images/` no zip. |
| domain | `images.ts`, `image-compress.ts`, `image-sync.ts` | novo | CRUD da galeria; `createImageBitmap` + canvas → WebP (qualidade decrescente até ≤ 1,5 MB); upload/download/limpeza. |
| domain | `theme.ts` | novo | `resolveTheme(pref, prefersDark)` puro. |
| state | `theme-store.ts`, `reminder-store.ts`, `tag-filter-store.ts` | novo | Tema do aparelho; `SwPush` + permissão + inscrição; etiquetas de “Estudar só…”. |
| pages | `difficult/` (`dificeis`), `reinforce/` (`reforco`), `import/` (`importar`), `tags/` (`ajustes/etiquetas`), `backup/` (`ajustes/backup`) | Lingo: `Import.tsx`, `Restore.tsx` | Ajustes ganha seções Aparência e Meta e lembrete. |
| ui | `tag-input`, `tag-filter`, `goal-progress`, `image-gallery-editor`, `image-viewer`, `anki-field-mapper`, `restore-preview` | Lingo: `AnkiNotePicker`, `Restore*` | `image-viewer` em `<dialog>` com zoom por `@panzoom/panzoom` (~4 KB). |
| Edge Function | `supabase/functions/send-reminders/` | novo | Deno; ver endpoint. |

#### Fluxo de dados

```
Template ─(signal)─ state/*Store ─(await)─ domain/* ─ Dexie (IndexedDB)
                         ▲                     │ hooks marcam dirty=1
                         └── liveQuerySignal ◄─┘
SyncStore.syncNow ─ domain/sync ─ pull (PostgREST, keyset) ─► apply LWW no Dexie
                                 └ push (RPC sync_push, cards → logs) ─► clearDirty (CAS)
```

Nenhuma tela espera a rede: toda escrita é local e síncrona do ponto de vista do usuário; a sincronização é oportunista.

## Design de implementação

### Principais interfaces

```ts
// domain/cards.ts
createCard(input: NewCardInput): Promise<Card>
updateCardContent(cardId: string, content: CardContent): Promise<void>
deleteCards(cardIds: string[]): Promise<void>
liveCards(deckId: string): Collection<Card, string>

interface CardContent { front: string; back: string; notes: string; marks: CardMarks }
interface NewCardInput extends CardContent { deckId: string }
```

```ts
// domain/scheduler.ts + queue.ts
answer(input: { card: Card; deck: Deck; rating: BinaryRating; durationMs: number }): Promise<void>
buildQueue(deck: Deck): Promise<Card[]>
queueCount(deck: Deck): Promise<number>
estimateMinutes(queueSize: number): Promise<number>
```

```ts
// domain/text-marks.ts (novo sobre o que já existe)
type CardField = 'front' | 'back' | 'notes'
type CardMarks = Record<CardField, Marks>
normalizeCardMarks(raw: Partial<CardMarks> | null | undefined): CardMarks
```

```ts
// state/live-query.ts
liveQuerySignal<T>(querier: () => Promise<T> | T): Signal<T | undefined>

// state/review-session.ts
queue: Signal<Card[] | null>; current: Signal<Card | undefined>
revealed: WritableSignal<boolean>; answering: Signal<boolean>; done: Signal<number>
answer(rating: BinaryRating): Promise<void>
replaceCurrent(card: Card): void
```

```ts
// Fase 2
buildQueue(deck: Deck, filter?: { tags: string[] }): Promise<Card[]>
listDifficult(deckId: string, now?: number): Promise<DifficultCard[]>
buildReinforceQueue(input: { deckId: string; tags: string[]; limit: number }): Promise<Card[]>
htmlToMarkedText(html: string): { text: string; emphasis: Range[] }
expandCloze(text: string): { text: string; cloze: Range[] }[]
addImage(input: { cardId: string; file: Blob }): Promise<CardImage>

// domain/sync.ts (contrato idêntico ao Lingo)
syncNow(reason: SyncReason): Promise<SyncOutcome>
type SyncReason = 'manual' | 'signin' | 'online' | 'boot' | 'session-end'
```

### Modelos de dados

#### `Deck` — baralho (Dexie, camelCase)

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `id` | `string` (uuid) | sim | Gerado no cliente (`crypto.randomUUID()`). |
| `name` | `string` | sim | 1–80 caracteres. |
| `newCardsPerDay` | `number` | sim | Padrão 20. |
| `youngLimit` | `number` | sim | Teto de cartões não firmados. Padrão 50. |
| `requestRetention` | `number` | sim | Padrão 0,90 (0,70–0,99). Sem UI na v1. |
| `fsrsParams` | `number[]` | não | Reservado para o otimizador futuro. |
| `paramsOptimizedAt` | `number` | não | Reservado. |
| `createdAt`, `updatedAt` | `number` (epoch ms) | sim | `updatedAt` é a versão do LWW. |
| `deletedAt` | `number` | sim | `0` = vivo. Nunca `undefined` (IndexedDB omite do índice). |
| `dirty` | `0 \| 1` | sim | Pendente de push. Mantido pelos hooks. |

```text
{ "id": "5b1e…", "name": "Constitucional", "newCardsPerDay": 20, "youngLimit": 50,
  "requestRetention": 0.9, "createdAt": 1790000000000, "updatedAt": 1790000000000,
  "deletedAt": 0, "dirty": 1 }
```

#### `Card` — cartão (Dexie, camelCase)

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `id`, `deckId` | `string` | sim | |
| `front` | `string` | sim | 1–5.000. Quebras de linha preservadas. |
| `back` | `string` | sim | 1–5.000. |
| `notes` | `string` | sim | 0–20.000; `''` quando vazio. |
| `marks` | `CardMarks` | sim | Lacunas (só Frente) e destaques (três campos). |
| `tags` | `string[]` | sim | Etiquetas (Fase 2); `[]` no MVP. Até 20, 1–40 caracteres. |
| `due`, `stability`, `difficulty`, `elapsedDays`, `scheduledDays`, `learningSteps`, `reps`, `lapses`, `state`, `lastReview?` | FSRS | sim | Só o `scheduler` escreve. |
| `createdAt`, `updatedAt`, `deletedAt`, `dirty` | | sim | Como em `Deck`. |

```text
{ "id": "c0a8…", "deckId": "5b1e…",
  "front": "O mandato do Presidente da República é de quatro anos e terá início em 5 de janeiro.",
  "back": "CF/88, art. 82 (redação da EC 111/2021).",
  "notes": "Antes da EC 111: posse em 1º de janeiro.\n\nPegadinha comum: trocar por 5 anos.",
  "marks": { "front": { "cloze": [{ "start": 42, "end": 48 }], "emphasis": [{ "start": 71, "end": 83 }] },
             "back": { "cloze": [], "emphasis": [] },
             "notes": { "cloze": [], "emphasis": [{ "start": 70, "end": 76 }] } },
  "tags": ["CESPE", "pegadinha"],
  "due": 1790086400000, "stability": 3.2, "difficulty": 5.1, "elapsedDays": 0, "scheduledDays": 3,
  "learningSteps": 0, "reps": 2, "lapses": 0, "state": 2, "lastReview": 1789827200000,
  "createdAt": 1789740800000, "updatedAt": 1789827200000, "deletedAt": 0, "dirty": 0 }
```

#### `CardMarks` / `Marks` / `Range` — marcas

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `front`, `back`, `notes` | `Marks` | sim (local) / não (remoto) | Chave ausente no remoto = sem marcas; `normalizeCardMarks` completa. |
| `Marks.cloze` | `Range[]` | sim | Trechos ocultos. |
| `Marks.emphasis` | `Range[]` | sim | Trechos destacados. |
| `Range.start`, `Range.end` | `number` | sim | Offsets de caractere (UTF-16, como `String.prototype.slice`), `start < end`, sem sobreposição. |

> **Semântica por campo:** só `front.cloze` existe — fica oculto até revelar a resposta e depois aparece com fundo sutil. `back.cloze` e `notes.cloze` são sempre `[]`: a UI não oferece “Ocultar” nesses campos e `normalizeCardMarks` descarta o que vier (import, pull, backup). `emphasis` vale nos três e é sempre visível.

#### `ReviewLog` — revisão (Dexie)

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `id`, `cardId`, `deckId` | `string` | sim | `deckId` denormalizado para estatística por baralho. |
| `rating` | `'again' \| 'good'` | sim | |
| `reviewedAt` | `number` | sim | |
| `stateBefore` | `State` (0–3) | sim | Conta novos introduzidos hoje. |
| `scheduledDays` | `number` | sim | |
| `durationMs` | `number` | sim | Base da estimativa de minutos. |
| `dirty` | `0 \| 1` | sim | Logs são imutáveis: limpeza sem CAS. |

#### `SyncState` — local, nunca sincronizado

Chaves: `boundUserId`, `cursor:settings`, `cursor:decks`, `cursor:cards`, `cursor:reviewLogs` (+ `cursor:cardImages` na Fase 2). Última sincronização em `localStorage` (`certamecards.lastSync`).

#### `UserSettings` — configurações sincronizadas (Fase 2, tabela desde o MVP)

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `id` | `'me'` | sim | Chave local fixa (uma linha por aparelho/conta). Não sobe: no servidor a chave é `user_id`. |
| `dailyGoal` | `number \| null` | sim | 10–500; `null` = meta desligada. |
| `reminderEnabled` | `boolean` | sim | |
| `reminderMinute` | `number` | sim | Minuto do dia (0–1439), padrão 1200 (20:00). |
| `timeZone` | `string` | sim | IANA, de `Intl.DateTimeFormat().resolvedOptions().timeZone`. |
| `updatedAt`, `dirty` | | sim | LWW como os demais. |

```text
{ "id": "me", "dailyGoal": 40, "reminderEnabled": true, "reminderMinute": 1200,
  "timeZone": "America/Sao_Paulo", "updatedAt": 1790000000000, "dirty": 1 }
```

Preferências **só do aparelho** (não sincronizam) ficam em `localStorage` com try/catch: `certamecards.theme` (`dark` \| `light` \| `system`), `certamecards.activeDeck`, `certamecards.studyTags`, `certamecards.lastBackupAt`.

#### `CardImage` — imagem das Notas (Fase 2)

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `id`, `cardId` | `string` | sim | |
| `position` | `number` | sim | 0–5, ordem na galeria. |
| `caption` | `string` | sim | 0–200; vira o `alt`. |
| `mimeType` | `'image/webp' \| 'image/jpeg' \| 'image/png'` | sim | WebP quando o navegador codifica; senão JPEG. |
| `width`, `height`, `byteSize` | `number` | sim | ≤ 2000 px por lado; ≤ 1.572.864 bytes. |
| `blobState` | `'local' \| 'uploaded' \| 'remote' \| 'pending-delete'` | sim | Só local: arquivo ainda não subiu / já subiu / existe só na nuvem / tombstone subiu e o arquivo deve ser apagado. |
| `createdAt`, `updatedAt`, `deletedAt`, `dirty` | | sim | |

O arquivo em si fica na tabela `imageBlobs` (`id → Blob`), separada dos metadados, como os `audioBlobs` do Lingo.

#### Esquema Dexie

```ts
db.version(1).stores({
  decks: 'id, name, createdAt, dirty, deletedAt',
  cards: 'id, deckId, due, state, createdAt, updatedAt, dirty, deletedAt, [deckId+deletedAt]',
  reviewLogs: 'id, cardId, deckId, reviewedAt, dirty',
  settings: 'id, dirty',
  syncState: 'key',
})
db.version(2).stores({                       // Fase 2 (F17)
  cardImages: 'id, cardId, dirty, deletedAt, blobState',
  imageBlobs: 'id',
})
```

#### Mapeamento local (Dexie) → remoto (Postgres)

| Origem (Dexie) | Destino (Postgres) |
| --- | --- |
| `deckId` | `deck_id` |
| `front` / `back` / `notes` | `front` / `back` / `notes` |
| `marks` | `marks` (jsonb) |
| `tags` | `tags` (`text[]`) |
| `settings['me']` | `user_settings` (`daily_goal`, `reminder_enabled`, `reminder_minute`, `time_zone`, `updated_at`) |
| `elapsedDays` / `scheduledDays` / `learningSteps` | `elapsed_days` / `scheduled_days` / `learning_steps` |
| `lastReview` (`undefined`) | `last_review` (`null`) |
| `newCardsPerDay` / `youngLimit` / `requestRetention` | `new_cards_per_day` / `young_limit` / `request_retention` |
| `fsrsParams` / `paramsOptimizedAt` (`undefined`) | `fsrs_params` / `params_optimized_at` (`null`) |
| `createdAt` / `updatedAt` / `deletedAt` | `created_at` / `updated_at` / `deleted_at` |
| `dirty` | — (nunca sobe) |
| — | `user_id` (preenchido pelo servidor com `auth.uid()`), `synced_at` (trigger) |

> **Degradação no pull:** linha que não passa no Zod de `sync-rows.ts` é descartada individualmente (não derruba a página). `marks` usa `.nullish()` em cada campo para tolerar chaves ausentes.

#### Esquema do banco (DDL)

Arquivos: `supabase/migrations/20261001000000_schema.sql` (MVP, já com `tags` e `user_settings`) e `20261101000000_images_reminders.sql` (Fase 2). Validados em Postgres 16 com `auth` e `storage` simulados: aplicação limpa das duas; defaults via `coalesce` no push; LWW em cards, configurações e imagens (versão velha perde, nova vence); log duplicado ignorado; `DELETE`/`UPDATE` em logs negados; `marks` não-objeto, 21 etiquetas e imagem GIF rejeitados; isolamento entre usuários pela FK composta e pela política do Storage; `anon` sem `EXECUTE` nas RPCs; `users_due_for_reminder` só para `service_role`, respeitando horário, janela, meta (39 → envia, 40 → não) e entrega do dia.

```sql
create table public.decks (
  id                  uuid    not null,
  user_id             uuid    not null default auth.uid() references auth.users(id) on delete cascade,
  name                text    not null check (char_length(name) between 1 and 80),
  new_cards_per_day   integer not null default 20 check (new_cards_per_day >= 0),
  young_limit         integer not null default 50 check (young_limit >= 0),
  request_retention   double precision not null default 0.9 check (request_retention between 0.7 and 0.99),
  fsrs_params         double precision[],
  params_optimized_at bigint,
  created_at          bigint  not null,
  updated_at          bigint  not null,
  deleted_at          bigint  not null default 0,
  synced_at           timestamptz not null default clock_timestamp(),
  primary key (user_id, id)
);

create table public.cards (
  id             uuid   not null,
  user_id        uuid   not null default auth.uid() references auth.users(id) on delete cascade,
  deck_id        uuid   not null,
  front          text   not null check (char_length(front) between 1 and 5000),
  back           text   not null check (char_length(back)  between 1 and 5000),
  notes          text   not null default '' check (char_length(notes) <= 20000),
  marks          jsonb  not null default '{}'::jsonb check (jsonb_typeof(marks) = 'object'),
  tags           text[] not null default '{}' check (cardinality(tags) <= 20),
  due            bigint not null,
  stability      double precision not null,
  difficulty     double precision not null,
  elapsed_days   double precision not null default 0,
  scheduled_days double precision not null,
  learning_steps integer not null default 0,
  reps           integer not null,
  lapses         integer not null,
  state          smallint not null check (state between 0 and 3),
  last_review    bigint,
  created_at     bigint not null,
  updated_at     bigint not null,
  deleted_at     bigint not null default 0,
  synced_at      timestamptz not null default clock_timestamp(),
  primary key (user_id, id),
  foreign key (user_id, deck_id) references public.decks (user_id, id) on delete cascade
);

create table public.review_logs (
  id             uuid   not null,
  user_id        uuid   not null default auth.uid() references auth.users(id) on delete cascade,
  card_id        uuid   not null,
  deck_id        uuid   not null,
  rating         text   not null check (rating in ('again', 'good')),
  reviewed_at    bigint not null,
  state_before   smallint not null check (state_before between 0 and 3),
  scheduled_days double precision not null,
  duration_ms    integer not null check (duration_ms >= 0),
  synced_at      timestamptz not null default clock_timestamp(),
  primary key (user_id, id),
  foreign key (user_id, card_id) references public.cards (user_id, id) on delete cascade,
  foreign key (user_id, deck_id) references public.decks (user_id, id) on delete cascade
);

create table public.user_settings (
  user_id          uuid     not null default auth.uid() primary key references auth.users(id) on delete cascade,
  daily_goal       integer  check (daily_goal between 10 and 500),
  reminder_enabled boolean  not null default false,
  reminder_minute  smallint not null default 1200 check (reminder_minute between 0 and 1439),
  time_zone        text     not null default 'America/Sao_Paulo',
  updated_at       bigint   not null,
  synced_at        timestamptz not null default clock_timestamp()
);

create index decks_pull_idx       on public.decks       (user_id, synced_at);
create index cards_pull_idx       on public.cards       (user_id, synced_at);
create index review_logs_pull_idx on public.review_logs (user_id, synced_at);
create index cards_deck_idx       on public.cards       (user_id, deck_id);
create index review_logs_card_idx on public.review_logs (user_id, card_id);
create index review_logs_deck_idx on public.review_logs (user_id, deck_id);
create index user_settings_pull_idx on public.user_settings (user_id, synced_at);
```

**Trigger, RLS e grants** (resumo — texto completo na migration):

| Objeto | Definição |
| --- | --- |
| `touch_synced_at()` | `before insert or update` em `decks`/`cards`/`user_settings`, `before insert` em `review_logs`; `synced_at := clock_timestamp()`. |
| RLS | Habilitada nas quatro tabelas; políticas `*_select_own`, `*_insert_own`, `*_update_own` (update com `using` **e** `with check`) comparando `(select auth.uid()) = user_id`. `review_logs` sem política de update. |
| Grants `authenticated` | `select, insert, update` em `decks`/`cards`/`user_settings`; `select, insert` em `review_logs`. Nenhum `delete`. |
| Grants `anon` | `revoke all` nas quatro tabelas e na RPC. |
| `sync_push(p_decks, p_cards, p_logs, p_settings)` | `security invoker`, `search_path = ''`; transação única settings → decks → cards → logs; settings com `on conflict (user_id)` e LWW; `on conflict (user_id, id) do update … where excluded.updated_at > t.updated_at`; `updated_at` limitado a agora + 1 h; `coalesce` para `notes`, `marks`, `tags`, `elapsed_days`, `learning_steps`, `deleted_at`, `request_retention`; logs `on conflict do nothing`. Retorna `{settings, decks, cards, logs}` com o número de linhas aplicadas. |

> **Regra de consistência:** os limites de `card-limits.ts` são os mesmos dos `check` do banco e são aplicados na UI (`maxlength` + validação do `CardForm`) e no `createCard`/`updateCardContent`. Uma linha inválida faria o chunk inteiro do push falhar e ficaria presa em `dirty: 1`.

#### Esquema do banco — Fase 2 (DDL)

```sql
create table public.card_images (
  id         uuid     not null,
  user_id    uuid     not null default auth.uid() references auth.users(id) on delete cascade,
  card_id    uuid     not null,
  position   smallint not null check (position between 0 and 5),
  caption    text     not null default '' check (char_length(caption) <= 200),
  mime_type  text     not null check (mime_type in ('image/webp', 'image/jpeg', 'image/png')),
  width      integer  not null check (width  between 1 and 2000),
  height     integer  not null check (height between 1 and 2000),
  byte_size  integer  not null check (byte_size between 1 and 1572864),
  created_at bigint   not null,
  updated_at bigint   not null,
  deleted_at bigint   not null default 0,
  synced_at  timestamptz not null default clock_timestamp(),
  primary key (user_id, id),
  foreign key (user_id, card_id) references public.cards (user_id, id) on delete cascade
);

create table public.push_subscriptions (
  user_id         uuid not null default auth.uid() references auth.users(id) on delete cascade,
  endpoint        text not null check (endpoint like 'https://%'),
  p256dh          text not null,
  auth_key        text not null,
  created_at      timestamptz not null default now(),
  last_success_at timestamptz,
  primary key (user_id, endpoint)
);

create table public.reminder_deliveries (
  user_id    uuid not null references auth.users(id) on delete cascade,
  local_date date not null,
  sent_at    timestamptz not null default now(),
  primary key (user_id, local_date)
);
```

| Objeto | Definição |
| --- | --- |
| `card_images` | Índices `(user_id, synced_at)` e `(user_id, card_id)`; trigger `touch_synced_at`; RLS select/insert/update do dono; sem delete. |
| `sync_push_images(p_images)` | Mesmo padrão da `sync_push` (invoker, LWW, clamp de relógio). Atualiza só `position`, `caption`, `updated_at`, `deleted_at` — o arquivo é imutável. |
| Bucket `card-images` | Privado, limite 1,5 MB, MIME webp/jpeg/png. Políticas em `storage.objects`: select/insert/delete quando `(storage.foldername(name))[1] = auth.uid()`. Caminho `{user_id}/{image_id}`. |
| `push_subscriptions` | RLS select/insert/**delete** do dono (não é dado de estudo; sair da conta remove a inscrição). |
| `reminder_deliveries` | Sem grant para `authenticated`; só `service_role`. |
| `users_due_for_reminder(p_now)` | `security definer`, só `service_role`. Retorna inscrições de quem tem lembrete ligado, está na janela `[reminder_minute, reminder_minute + 59]` no próprio fuso, não recebeu lembrete no dia local e tem menos revisões hoje do que a meta (sem meta: zero revisões). |

Agendamento (manual por ambiente, fora da migration porque usa segredos do Vault):

```sql
select cron.schedule('send-reminders', '*/15 * * * *', $$
  select net.http_post(
    url     := (select decrypted_secret from vault.decrypted_secrets where name = 'reminders_url'),
    headers := jsonb_build_object('Authorization', 'Bearer ' ||
               (select decrypted_secret from vault.decrypted_secrets where name = 'reminders_token')))
$$);
```

### Endpoints da API

Não há API própria. O cliente fala direto com o Supabase pelo SDK `@supabase/supabase-js`, sob RLS.

#### Visão geral

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/rest/v1/{decks\|cards\|review_logs}` | Pull incremental por keyset em `synced_at`. |
| `POST` | `/rest/v1/rpc/sync_push` | Push transacional com LWW no servidor. |
| `HEAD` | `/rest/v1/{tabela}?deleted_at=eq.0` | Contagem para a decisão de login (`count: 'exact', head: true`). |
| `GET` | `/rest/v1/{user_settings\|card_images}` | Pull incremental, mesmo keyset (Fase 2 para `card_images`). |
| `POST` | `/rest/v1/rpc/sync_push_images` | Push de metadados de imagem (Fase 2). |
| `POST`/`GET`/`DELETE` | `/storage/v1/object/card-images/{user_id}/{image_id}` | Upload, download e limpeza do arquivo (Fase 2). |
| `POST`/`DELETE` | `/rest/v1/push_subscriptions` | Inscrever/desinscrever o aparelho no lembrete (Fase 2). |
| `POST` | `/functions/v1/send-reminders` | Edge Function chamada só pelo `pg_cron` (Fase 2). |
| — | `/auth/v1/*` | Cadastro, login, sessão e logout via SDK. |

---

#### `GET /rest/v1/cards` (idem `decks`, `review_logs`)

**Parâmetros de consulta**

| Parâmetro | Tipo | Padrão | Regras |
| --- | --- | --- | --- |
| `select` | `string` | `*` | |
| `synced_at` | `gt.<timestamptz>` | `1970-01-01T00:00:00Z` | Cursor salvo − 5 s de overlap. |
| `order` | `string` | `synced_at.asc` | |
| `limit` | `number` | `500` | Página cheia → busca a próxima. |

**Respostas**

| Status | Corpo | Quando |
| --- | --- | --- |
| `200` | `CardRow[]` | Sucesso (pode ser `[]`). |
| `401` | erro PostgREST | Sessão expirada → `SyncOutcome.signed-out`. |
| rede | `TypeError` | Sem conexão → `SyncOutcome.offline`, sem mensagem de erro ao usuário. |

**Exemplo — sucesso**

```http
GET /rest/v1/cards?select=*&synced_at=gt.2026-10-01T12:00:00Z&order=synced_at.asc&limit=500
```

```text
[{ "id": "c0a8…", "user_id": "9f1c…", "deck_id": "5b1e…", "front": "O mandato…", "back": "CF/88, art. 82…",
   "notes": "Antes da EC 111…", "marks": { "front": { "cloze": [{ "start": 42, "end": 48 }], "emphasis": [] } },
   "due": 1790086400000, "stability": 3.2, "difficulty": 5.1, "elapsed_days": 0, "scheduled_days": 3,
   "learning_steps": 0, "reps": 2, "lapses": 0, "state": 2, "last_review": 1789827200000,
   "created_at": 1789740800000, "updated_at": 1789827200000, "deleted_at": 0,
   "synced_at": "2026-10-01T12:00:03.123456+00:00" }]
```

**Exemplo — nada novo**

```text
[]
```

> O cursor só avança na mesma transação Dexie que aplica a página: um crash replica a página, nunca a pula. O apply devolve apenas as linhas que venceram o LWW local, para “0 novidades” não virar “3 novidades” por causa do overlap.

---

#### `POST /rest/v1/rpc/sync_push`

**Corpo**

| Parâmetro | Tipo | Padrão | Regras |
| --- | --- | --- | --- |
| `p_decks` | `DeckRow[]` (sem `user_id`/`synced_at`) | `[]` | Enviados no primeiro chunk. |
| `p_cards` | `CardRow[]` | `[]` | Chunks de 200. |
| `p_logs` | `ReviewLogRow[]` | `[]` | Só depois de **todos** os chunks de cards confirmados (FK). |
| `p_settings` | `[SettingsRow]` (0 ou 1 item) | `[]` | Enviado no primeiro chunk, junto com os decks. |

**Respostas**

| Status | Corpo | Quando |
| --- | --- | --- |
| `200` | `{ "settings": n, "decks": n, "cards": n, "logs": n }` | Linhas aplicadas (perdedores do LWW não contam). |
| `400` | erro Postgres `23514`/`23503` | Violação de `check`/FK — chunk inteiro revertido, `dirty` permanece. |
| `401`/`42501` | `not authenticated` | Sem sessão. |

**Exemplo — sucesso**

```http
POST /rest/v1/rpc/sync_push
```

```text
{ "p_decks": [], "p_cards": [{ "id": "c0a8…", "deck_id": "5b1e…", "front": "…", "back": "…", "notes": "", "marks": {},
  "due": 1790086400000, "stability": 3.2, "difficulty": 5.1, "elapsed_days": 0, "scheduled_days": 3, "learning_steps": 0,
  "reps": 2, "lapses": 0, "state": 2, "last_review": 1789827200000, "created_at": 1789740800000,
  "updated_at": 1789827200000, "deleted_at": 0, "tags": ["CESPE"] }], "p_logs": [], "p_settings": [] }
```

```text
{ "settings": 0, "decks": 0, "cards": 1, "logs": 0 }
```

**Exemplo — versão mais velha que a do servidor**

```text
{ "settings": 0, "decks": 0, "cards": 0, "logs": 0 }
```

> Após `200`, o cliente limpa `dirty` com compare-and-swap em `updatedAt`: se o cartão foi respondido enquanto o push estava em trânsito, continua `dirty` e sobe no próximo ciclo.

---

#### Imagens — `POST /storage/v1/object/card-images/{user_id}/{image_id}` + `POST /rest/v1/rpc/sync_push_images` (Fase 2)

Ordem obrigatória por imagem, depois de todos os cards: (1) upload do arquivo com `upsert: false` — `409 Duplicate` conta como sucesso (reenvio idempotente); (2) `sync_push_images` com os metadados; (3) `blobState = 'uploaded'`. Tombstone: (1) `sync_push_images` com `deleted_at`; (2) `DELETE` do objeto; (3) `blobState = 'pending-delete'` até o `DELETE` responder `200`/`404`.

| Status | Corpo | Quando |
| --- | --- | --- |
| `200` | `{ "images": n }` | Metadados aplicados. |
| `413` | erro do Storage | Arquivo acima de 1,5 MB (não deve ocorrer: a compressão garante). |
| `403` | erro do Storage | Caminho fora da pasta do usuário. |

```text
{ "p_images": [{ "id": "e1f2…", "card_id": "c0a8…", "position": 0, "caption": "Mapa: controle de constitucionalidade",
  "mime_type": "image/webp", "width": 2000, "height": 1250, "byte_size": 412345,
  "created_at": 1790000000000, "updated_at": 1790000000000, "deleted_at": 0 }] }
```

> Download sob demanda: ao exibir um cartão (e para os 2 próximos da fila), imagens com `blobState = 'remote'` são baixadas por `storage.download` e gravadas em `imageBlobs`. Sem rede, a miniatura mostra “Imagem disponível quando houver conexão”.

---

#### `POST /functions/v1/send-reminders` (Fase 2)

Edge Function (Deno) chamada a cada 15 min pelo `pg_cron`. Autentica o chamador por um token próprio (Vault), usa a `service_role` para chamar `users_due_for_reminder(now())`, envia Web Push (VAPID) com o corpo abaixo, registra `reminder_deliveries` e apaga inscrições que responderem `404`/`410`.

| Status | Corpo | Quando |
| --- | --- | --- |
| `200` | `{ "sent": n, "expired": n }` | Execução concluída. |
| `401` | — | Token ausente/errado. |

```text
{ "notification": { "title": "CertameCards", "body": "Faltam 12 revisões para a meta de hoje.",
  "icon": "/icons/icon-192.png", "data": { "onActionClick": { "default": { "operation": "navigateLastFocusedOrOpen", "url": "/" } } } } }
```

> O corpo segue o formato que o `@angular/service-worker` exibe sozinho (`notification` + `onActionClick`), sem service worker customizado.

---

## Pontos de integração

- **Supabase Auth** — email e senha, confirmação por email nos ambientes com Supabase; preview sem conta (Inbucket em `localhost:55324` no local). O SDK é carregado por `import()` dinâmico: quem não usa conta não baixa o bundle.
- **Supabase PostgREST/RPC** — ver endpoints. Erros de rede viram `offline` silencioso; erros de servidor aparecem como texto curto na tela de Conta/Ajustes, nunca bloqueiam o estudo.
- **Vercel** — hospedagem estática do `dist/certamecards/browser`; `vercel.json` com rewrite SPA para `index.html` e `Cache-Control: no-cache` para `ngsw.json`/`ngsw-worker.js`. Variáveis `NG_APP_SUPABASE_URL` e `NG_APP_SUPABASE_PUBLISHABLE_KEY` só no escopo Production, apontando para o banco remoto `certamecards`; Development/Preview ficam sem elas. `scripts/write-env.mjs` roda no `prebuild`/`prestart` e grava `src/environments/env.ts`; sem as variáveis, grava `null` e o app segue sem conta (RF41).
- **Service worker** — `@angular/service-worker` (`ng add @angular/pwa`): `ngsw-config.json` com o app shell e fontes em `prefetch`; sem `dataGroups` para o Supabase (nunca cachear API). Na Fase 2, `SwPush.requestSubscription` com a chave VAPID pública (`NG_APP_VAPID_PUBLIC_KEY`).
- **Web Push (Fase 2)** — chaves VAPID geradas uma vez por ambiente; a privada só nos segredos da Edge Function. No iPhone, só funciona com o app instalado na tela de início (iOS 16.4+); a tela de lembrete explica isso e oferece o `.ics`.
- **Anki (Fase 2)** — `.apkg` lido no navegador com JSZip + sql.js (wasm fora do precache, baixado só por quem importa), como no Lingo.

## Abordagem de testes

Runner: **Vitest** (o padrão do Angular desde a v21). A camada `domain/` roda num `vitest.config.ts` próprio, em `jsdom`, com `fake-indexeddb`, o fake de Web Locks e o `fake-supabase.ts` portados do Lingo — sem TestBed, sem rede. O piso de 80% vale para `src/app/domain/**`. Componentes são validados pelo roteiro E2E manual, como no Lingo; testes de componente com `ng test` são bem-vindos mas não entram no gate. Proporção alvo 70/20/10.

### Testes de unidade

| ID | Nome do caso de teste | Critérios de aceitação | Resultado esperado |
|----|-----------------------|------------------------|--------------------|
| TU-01 | `splitByMarks` com lacuna e destaque no mesmo texto | CA-04, CA-05 | Segmentos na ordem, offsets originais preservados. |
| TU-02 | `remapRanges` ao inserir antes, depois e através da marca | CA-07 | Marca anda junto; marca atravessada é descartada. |
| TU-03 | `trimRange` e `markAt` (cursor na borda × dentro) | CA-08 | Espaços aparados; cursor na borda não pega a marca. |
| TU-04 | `normalizeCardMarks` com chaves ausentes/nulas | CA-04 | Sempre retorna os três campos com arrays vazios. |
| TU-05 | `normalizeCardMarks` descarta lacunas de Verso e Notas | CA-06 | `back.cloze` e `notes.cloze` sempre `[]`; destaques preservados. |
| TU-06 | `buildQueue` com 30 novos e limite 10 | CA-12 | ≤ 10 novos, intercalados entre vencidos. |
| TU-07 | `buildQueue` respeita teto de não firmados | CA-12 | Novos = min(sobra do teto, sobra do dia). |
| TU-08 | `answer` Good/Again grava estado FSRS v5 (`learningSteps`) | CA-13 | Campos FSRS atualizados, `updatedAt` = agora. |
| TU-09 | `frontSizeClass` acima/abaixo de 280 caracteres | CA-23 | `text-front-long` / `text-front`. |
| TU-10 | `searchCards` sem acento e sem caixa nas Notas | CA-15 | “prazo” encontra “PRAZO” e “prázo” só nas notas. |
| TU-11 | `computeStats` retenção 8/10 | CA-16 | `retention30 = 0.8`; dia no `byDay`. |
| TU-12 | `wins` LWW com empate de `updatedAt` | CA-18 | Desempate por id, determinístico. |
| TU-13 | `parseCardRow` com `marks` inválido e com chaves ausentes | CA-18 | Inválido → `null`; ausente → marcas vazias. |
| TU-14 | `toCardRow` / `parseCardRow` ida e volta | CA-18 | Objeto idêntico (exceto `dirty`). |
| TU-15 | `validateCardContent` nos limites 5000/5000/20000 | CA-01 | Aceita no limite, rejeita acima, rejeita frente vazia. |
| TU-16 | `decideOnSignIn` — matriz resume/auto-adopt/prompt/switch | CA-19, CA-20 | Decisão correta em cada combinação. |
| TU-17 | `homeView` / `studyButtonLabel` | CA-11 | Estados loading/onboarding/today. |
| TU-18 | `tagKey` / `addTag` com caixa e acento diferentes (Fase 2) | CA-24 | “pegadinha” não duplica “Pegadinha”. |
| TU-19 | Filtro de etiquetas com E lógico + busca | CA-25 | Só cartões com todas as etiquetas. |
| TU-20 | `buildQueue` com filtro de etiquetas | CA-26 | Fila com 12 de 40; limites de novos aplicados depois do filtro. |
| TU-21 | `difficultyScore` e corte em 3 | CA-28 | Pontuação 5 entra; 2 fica de fora. |
| TU-22 | `goalProgress` e `goalStreak` | CA-30 | “28 / 40”; dia marcado ao chegar em 40. |
| TU-23 | `buildDailyIcs` | CA-32 | `DTSTART` com `TZID`, `RRULE:FREQ=DAILY`, linhas ≤ 75 octetos, CRLF. |
| TU-24 | `htmlToMarkedText` com `<b>`, `<div>`, `<br>`, entidades | CA-33 | Parágrafos e destaque nos offsets certos. |
| TU-25 | `expandCloze` com c1/c2, dica e lacuna repetida | CA-34 | Um item por número; dica descartada; offsets válidos. |
| TU-26 | `resolveTheme` (`system` × `prefers-color-scheme`) | CA-38 | Tema resolvido correto nas 6 combinações. |
| TU-27 | Contraste dos tokens do tema claro lidos de `styles.css` | CA-39 | Todo par texto/fundo ≥ 4,5:1. |
| TU-28 | `fitWithin` (dimensões) e laço de qualidade da compressão | CA-40 | Lado maior ≤ 2000; para ao atingir ≤ 1,5 MB. |
| TU-29 | Validação do manifesto de backup (formato, versão, contagens) | CA-36 | Arquivo alheio ou versão futura → erro claro. |

### Testes de integração

| ID | Nome do caso de teste | Critérios de aceitação | Resultado esperado |
|----|-----------------------|------------------------|--------------------|
| TI-01 | `createCard` + `updateCardContent` no Dexie real | CA-01, CA-03 | Texto e marcas mudam; FSRS e `reps` intactos; nenhum log criado. |
| TI-02 | `answer` grava card e log na mesma transação | CA-13 | Um log por resposta; falha no log não altera o card. |
| TI-03 | `ensureDefaultDeck` concorrente e após excluir o último | CA-09 | Um único “Meus cartões”; nada recriado depois de excluir. |
| TI-04 | `deleteDeck` tombstona cartões e some da fila | CA-10 | `deletedAt > 0` em todos; `buildQueue` vazio. |
| TI-05 | push: cards antes de logs em chunks de 200 | CA-18 | Ordem de chamadas no fake; nenhum log antes do seu card. |
| TI-06 | push: CAS mantém `dirty` quando `updatedAt` mudou em trânsito | CA-18 | Registro editado continua `dirty: 1`. |
| TI-07 | pull: keyset com overlap é idempotente | CA-18 | Reprocessar página não duplica nem conta novidades. |
| TI-08 | `completeSignIn` discard/merge/cancel e troca de conta | CA-19, CA-20 | Wipe total na troca; cursores zerados; cancel não altera local. |
| TI-09 | `syncNow` sem config / sem sessão / offline | CA-17 | `disabled` / `signed-out` / `offline`, nunca exceção. |
| TI-10 | `renameTag` juntando duas etiquetas (Fase 2) | CA-27 | Todos os cartões atualizados numa transação, sem duplicata, `dirty: 1`. |
| TI-11 | Sessão de reforço completa | CA-29 | `due`, `reps`, `reviewLogs` inalterados. |
| TI-12 | Importação do Anki que falha no meio | CA-35 | Nenhum cartão da importação permanece. |
| TI-13 | Backup → restaurar “Substituir” em banco vazio | CA-36 | Baralhos, cartões, etiquetas, logs, configurações e imagens idênticos. |
| TI-14 | Restaurar “Mesclar” com edição mais nova local | CA-37 | Versão local mais nova mantida (LWW). |
| TI-15 | Push de imagem: upload → metadados → `uploaded`; `409` no reenvio | CA-42 | Ordem respeitada; reenvio idempotente; metadado nunca antes do arquivo. |
| TI-16 | Tombstone de imagem e limpeza do arquivo com falha e nova tentativa | CA-43 | `pending-delete` até o `DELETE` responder; depois removido. |
| TI-17 | Sync de `user_settings` (LWW, cursor próprio) | CA-30, CA-31 | Configuração mais nova vence entre aparelhos. |

### Testes E2E

Roteiros executados à mão com a skill `agent-browser` contra `ng serve` (e Supabase local para os de conta), com captura de tela como evidência. Não há Playwright no projeto.

| ID | Nome do caso de teste | Critérios de aceitação | Resultado esperado |
|----|-----------------------|------------------------|--------------------|
| E2E-01 | Criar cartão com 3 parágrafos nas Notas, ocultar e destacar | CA-01, CA-02, CA-04, CA-05 | Parágrafos preservados; formulário limpo após salvar. |
| E2E-02 | Sessão de revisão completa por teclado | CA-13 | Espaço/1/2 funcionam; tecla repetida não duplica. |
| E2E-03 | Verso e Notas só oferecem destacar | CA-06 | Nenhum “Ocultar seleção” fora da Frente; destaque aparece na revisão. |
| E2E-04 | Editar cartão durante a revisão | CA-14 | Volta ao mesmo cartão com texto novo. |
| E2E-05 | Criar, trocar e excluir baralho pelo seletor | CA-09, CA-10 | Ativo muda sem navegar; exclusão confirma e limpa fila. |
| E2E-06 | Home recontando sozinha | CA-11 | Número sobe em ≤ 60 s. |
| E2E-07 | Offline sem conta (DevTools offline) | CA-17, CA-22 | Tudo funciona; recarregar abre do service worker. |
| E2E-08 | Dois perfis de navegador na mesma conta | CA-18 | Revisões aparecem no outro sem duplicar. |
| E2E-09 | Login com dados dos dois lados | CA-19, CA-20 | Opções corretas; troca de conta nunca mistura. |
| E2E-10 | Inspeção de tipografia a 360 px e ausência de áudio | CA-21, CA-23 | Nenhum texto < limites; nenhum controle de áudio. |
| E2E-11 | Etiquetas: criar, autocompletar, filtrar lista, “Estudar só…” (Fase 2) | CA-24–CA-27 | Contagens e fila refletem o filtro. |
| E2E-12 | Difíceis → Reforçar → conferir agenda inalterada | CA-28, CA-29 | Lista correta; datas iguais depois do reforço. |
| E2E-13 | Meta e lembrete no Android (Chrome) e iPhone instalado, com horário próximo | CA-30, CA-31 | Notificação só sem meta batida; nenhuma depois de bater. Verificação da query com `psql` no Supabase local. |
| E2E-14 | `.ics` importado no Google Agenda e no calendário do iPhone | CA-32 | Evento diário no horário. |
| E2E-15 | Importar `.apkg` real com lacunas, negrito e etiquetas | CA-33–CA-35 | Cartões conforme o PRD. |
| E2E-16 | Exportar backup, restaurar em outro perfil (Substituir e Mesclar) | CA-36, CA-37 | Dados idênticos / edição recente mantida. |
| E2E-17 | Tema claro, escuro e sistema; recarregar | CA-38, CA-39 | Sem piscar; contraste verificado no DevTools. |
| E2E-18 | Colar foto grande, revisar, ampliar, sincronizar e excluir em dois aparelhos | CA-40–CA-43 | Tamanho, zoom, chegada e exclusão conforme o PRD. |

## Sequenciamento do desenvolvimento

### Ordem de construção

1. **Fundação (dia 1)** — `ng new certamecards --style=css --routing --ssr=false`, `ng add tailwindcss`, `ng add @angular/pwa`; `styles.css` com tokens e escala (ver Considerações); fontes `@fontsource-variable/*`; `vitest.config.ts` do domínio; `scripts/write-env.mjs`; `vercel.json`; CI (`lint`, `test:coverage`, `check:type-scale`, `build`). Primeiro porque tudo depende do visual e do gate.
2. **Domínio offline (dias 2–4)** — portar `db`, `dirty-tracking`, `decks`, `cards`, `card-limits`, `text-marks`, `scheduler`, `queue`, `stats`, `dates`, `card-search`, `type-scale`, `lww` com os testes TU/TI correspondentes. Sem UI ainda: é a parte mais valiosa e já tem teste pronto para adaptar.
3. **Estado + casca (dia 5)** — `live-query`, `deck-store`, `due-tick`, rotas e guards, `mobile-nav`, `deck-switcher`, `no-deck`.
4. **Cadastro (dias 6–7)** — `mark-backdrop`, `mark-actions`, `markable-field`, `card-form`, `card-new`, `card-edit`. Maior risco técnico de UI (seleção/overlay) — atacar cedo.
5. **Revisão e Home (dias 8–9)** — `marked-text` (3 modos), `review-session`, `review` (com diálogo de edição), `home`, `heatmap`, `due-badge`.
6. **Lista e Progresso (dia 10)** — `cards` (busca + virtualização + lote), `progress` (`bar-chart`), `settings`. **Fim do MVP offline** → deploy de preview.
7. **Conta e sync (dias 11–14)** — migration no Supabase local, `supabase`, `sync-rows`, `sync*`, `auth` + testes; `auth-store`, `sync-store`, `account`, seção de conta em Ajustes.
8. **QA e produção** — E2E de conta/sync no Supabase local e roteiros offline no preview, migration manual em produção, promoção para `prod`.

**Fase 2** — cada fatia vai sozinha para produção, nesta ordem:

9. **Tema claro (1–2 dias)** — só tokens e `theme-store`; fica barato porque o MVP já usa `text-on-signal` e tokens em variáveis.
10. **Etiquetas (3 dias)** — `tags`, `tag-input`, filtros, `ajustes/etiquetas`. Base para os itens seguintes.
11. **Difíceis e reforço (2 dias)** — reusa `card-face`/`answer-bar` e o filtro de etiquetas.
12. **Importação do Anki (3 dias)** — porta do Lingo + HTML/lacunas/etiquetas.
13. **Meta e lembrete (4 dias)** — meta (só cliente) primeiro; depois migration da Fase 2 (parte de push), Edge Function, VAPID, `pg_cron`, `.ics`.
14. **Imagens nas Notas (5 dias)** — migration da Fase 2 (parte de imagens), Dexie v2, compressão, galeria, visualizador, sync de arquivos.
15. **Backup e restauração (3 dias)** — por último, para já nascer cobrindo etiquetas, configurações e imagens.

### Dependências técnicas

- Node **22.22.3+** ou **24.15+** (exigência do Angular CLI 22) e TypeScript 6.
- Fase 2: extensões `pg_cron`, `pg_net` e Vault ligadas nos projetos Supabase; par de chaves VAPID por ambiente; Supabase CLI para `functions deploy`.
- Dois projetos Supabase (dev e prod), criados fora da integração da Vercel Marketplace para não sofrer injeção de credenciais nos três escopos (lição do Lingo).
- Docker para o Supabase local.
- Projeto Vercel com branches `des` (preview) e `prod` (produção).

## Monitoramento e observabilidade

Sem backend próprio, a observabilidade é do cliente e do Supabase:

- **Status de sync visível**: “Sincronizado há 2 min” / “Offline — seus dados estão no aparelho” / erro curto em Ajustes/Conta, alimentado pelo `SyncOutcome`.
- **Console**: `console.warn` para linha descartada no parse do pull (com id e tabela) e para chunk rejeitado no push (com código Postgres); `console.error` só para falha inesperada. Nada de dados de conteúdo do cartão nos logs.
- **Supabase**: logs de API/Postgres do dashboard para erros `23514`/`23503` (limites ou FK) e contagem de linhas por usuário.
- **Vercel**: Web Analytics/Speed Insights opcional para medir a meta de primeira carga ≤ 3 s.

## Considerações técnicas

### Principais decisões

- **Angular 22 com signals, zoneless e `OnPush` padrão, sem NgRx.** Os estados globais são pequenos (baralho ativo, sessão, sync); serviços com `signal`/`computed` resolvem com menos código que uma store. `@Service` (novo na v22) para os serviços root.
- **Domínio em TypeScript puro, fora do Angular.** É o que permite copiar ~1.500 linhas de domínio do Lingo, com ~2.200 linhas de teste, quase sem mudança e testar sem TestBed. Alternativa descartada: serviços Angular com Dexie injetado — acoplaria a regra de negócio ao framework e jogaria fora os testes.
- **Dexie mantido** (+ `liveQuery` → signal). Alternativas (localForage, IndexedDB cru) perderiam hooks, índices compostos e transações que o sync usa.
- **`marks` em um jsonb único** em vez de seis colunas `*_ranges`. No Lingo, cada campo novo de marca exigiu reemitir a RPC `sync_push` inteira; aqui um campo novo de marca não muda o schema. Custo: validação do formato fica no Zod do cliente (o banco só garante que é objeto).
- **Lacuna só na Frente, destaque nos três campos** (decisão do Rafael). Mesmo comportamento da tradução no Lingo (`allowCloze = false`); o `marks jsonb` mantém o formato uniforme e a normalização garante a regra em qualquer entrada (formulário, pull, import, backup).
- **Notas como texto puro com quebras de linha**, sem editor rico: o overlay de marcas (textarea + camada de trás) só funciona com texto puro, e é a mecânica que já está provada no Lingo.
- **Escala tipográfica semântica no Tailwind v4.** Tokens `--text-label` etc. no `@theme` geram utilitários `text-label`, `text-meta`… Os templates nunca usam `text-xs` nem `text-[Npx]`; o `check:type-scale` do CI barra regressões. Mapeamento a partir do Lingo:

| Uso | Lingo | CertameCards | Token |
| --- | --- | --- | --- |
| Rótulo mono (cabeçalho, pílula, legenda) | `text-[10px]`/`text-xs` (10–12 px) | 14 px, `tracking-wider` | `text-label` |
| Texto auxiliar, botões secundários, lista | `text-sm` (14 px) | 16 px | `text-meta` |
| Corpo e Notas | 16 px | 18 px, entrelinha 1,7 | `text-body` |
| Verso | `text-xl` (20 px) | 22 px / `sm:` 24 px | `text-back` |
| Frente | `text-3xl`/`sm:text-4xl` (30/36 px) | 24 px / `sm:` 30 px; longa: 20/24 px | `text-front`, `text-front-long` |
| Botões principais | `text-base`/`text-lg` | 18 px | `text-body` |
| Número de “Hoje” | `text-7xl`/`sm:text-8xl` | mantido | — |

  A frente fica **menor** que a frase do Lingo de propósito: frases do Lingo têm ~60 caracteres; dispositivos de lei chegam a 800+.

- **Tokens de cor e fontes idênticos ao Lingo**, preservando os nomes de classe (`bg-ink`, `text-signal`, `font-display`). As cores são variáveis CSS (`:root { --ink: #14142B }`) mapeadas com `@theme inline { --color-ink: var(--ink) }`, e há um token a mais desde o MVP: `on-signal` (texto sobre `bg-signal`, que no Lingo era `text-ink`). Assim o tema claro da Fase 2 é só outro bloco de variáveis em `[data-theme='light']`, sem tocar em template. O CSS global (foco âmbar, skeleton, `prefers-reduced-motion`) é copiado de `src/index.css`.
- **Paleta do tema claro (Fase 2)**, com contraste calculado (WCAG):

| Token | Escuro | Claro | Contraste no claro (sobre `ink` / `surface`) |
| --- | --- | --- | --- |
| `ink` (fundo) | `#14142B` | `#F7F6FB` | — |
| `surface` | `#1F1F3D` | `#FFFFFF` | — |
| `line` | `#32325C` | `#DCD9EC` | — |
| `text` | `#EDEBFF` | `#1C1B36` | 15,5 / 16,7 |
| `muted` | `#9C9BC4` | `#5E5C82` | 5,9 / 6,3 |
| `signal` | `#F4B740` | `#8C5B00` | 5,4 / 5,8 |
| `on-signal` | `#14142B` | `#FFFFFF` | 5,8 sobre `signal` |
| `hit` | `#7CE2C0` | `#0B7A5C` | 4,9 / 5,3 |
| `miss` | `#F2789B` | `#B4234F` | 5,9 / 6,4 |

  O tema é aplicado por um script inline de 5 linhas no `<head>` do `index.html` (lê `localStorage`, define `data-theme` e `meta[name=theme-color]`) antes de qualquer CSS — é o que evita o piscar do RF71.
- **Edição durante a revisão em `<dialog>`**, não em outra rota: mantém a fila e o índice sem precisar de store global da sessão.
- **Gráficos em SVG próprio** (14 barras + heatmap): Recharts não existe para Angular e uma lib de gráficos pesaria mais que a tela inteira.
- **ts-fsrs v5**, com `learning_steps` persistido. `elapsed_days` é mantido (ainda exigido pelo tipo na v5, depreciado para a v6).
- **Portas do Supabase local deslocadas em +1000 (55321–55327)** para rodar ao lado do Lingo sem `port is already allocated`.
- **Colunas reservadas** (`request_retention`, `fsrs_params`, `params_optimized_at`): evitam reemitir a RPC quando vierem a retenção ajustável e o otimizador.
- **Fase 2 no schema desde o início**: `cards.tags` e `user_settings` entram na migration do MVP (a RPC `sync_push` nasce com `p_settings`). Imagens e push ficam numa migration separada, com RPC própria, porque trazem Storage e dependências (`pg_cron`, VAPID) que o MVP não precisa.
- **Etiquetas como `text[]` no cartão**, não tabela própria: filtro em memória é instantâneo com 5.000 cartões e a sincronização não ganha outra tabela. Custo aceito: renomear uma etiqueta reescreve (e ressincroniza) todos os cartões que a usam.
- **Reforço não grava nada.** Revisar fora da hora distorceria o FSRS e a retenção medida; o valor do reforço é o autoteste.
- **Pontuação de dificuldade explicável** (lapsos + erros recentes) em vez da `difficulty` do FSRS, que é opaca para o usuário e não diz “errou 5 vezes”.
- **Lembrete decidido no servidor** (`users_due_for_reminder`), porque o `@angular/service-worker` exibe a notificação sem rodar código próprio — não daria para checar a meta no aparelho sem um service worker customizado. `.ics` cobre quem não tem conta ou push.
- **Imagens em galeria abaixo das Notas**, não no meio do texto: o campo com marcas é um `<textarea>` com camada de trás e só funciona com texto puro. Arquivo no Storage + metadados sincronizados por LWW, como os cartões.
- **Lacunas do Anki → um cartão por número** (c1, c2…), como o Anki faz; irmãos não são separados de dia na Fase 2.

### Riscos conhecidos

- **Seleção no textarea (maior risco).** O `onSelect` do React é sintético (combina `selectionchange`, `keyup`, `mouseup`); o evento `select` nativo **não** dispara ao mover o cursor. Mitigação: `markable-field` ouve `document:selectionchange` filtrando `document.activeElement === textarea`, mais `select`/`keyup`/`pointerup`. Validar cedo no Android e no iOS (E2E-01).
- **Desalinhamento do overlay de marcas** se a fonte da camada de trás e do textarea divergirem (carregamento de fonte, `letter-spacing`). Mitigação: mesmas classes em ambos (constante `BOX`), recalcular altura após `document.fonts.ready`.
- **Notas longas com autoaltura** podem causar reflow a cada tecla. Mitigação: `afterRenderEffect` com leitura/escrita separadas; teste com 20.000 caracteres.
- **Angular 22/TypeScript 6 recentes**: checar compatibilidade de tipos de Dexie, supabase-js e ts-fsrs no dia 1 (build limpo antes de portar o domínio).
- **Service worker do Angular** atualiza em segundo plano e pode servir versão antiga por uma sessão. Mitigação: `SwUpdate.versionUpdates` → aviso “Nova versão — recarregar”.
- **Limites de texto** divergentes entre cliente e banco travariam o push. Mitigação: constantes únicas em `card-limits.ts` + TU-15.
- **Evicção do IndexedDB no iOS** sem uso por semanas. Mitigação: `navigator.storage.persist()`, incentivo à conta; backup em arquivo na Fase 2 (F15).
- **Fase 2 — lembrete com revisões ainda não sincronizadas**: quem estudou offline pode receber um lembrete indevido. Mitigação: sincronizar também em `visibilitychange → hidden` (além do fim de sessão); texto neutro (“Ainda faltam revisões hoje?”).
- **Fase 2 — Web Push na Edge Function**: a biblioteca `web-push` usa APIs do Node; validar `npm:web-push` no runtime Deno do Supabase logo no início da fatia e, se falhar, usar `jsr:@negrel/webpush`. No iPhone só funciona instalado na tela de início.
- **Fase 2 — cota do Storage** no plano gratuito (1 GB ≈ 2.500 imagens de 400 KB). Mitigação: limites do RF73/RF74 e contador de uso em Ajustes.
- **Fase 2 — `.apkg` grandes** (sql.js carrega o banco inteiro na memória): testar com 20.000 notas no celular; se necessário, recomendar importar pelo computador.
- **Fase 2 — irmãos de lacuna no mesmo dia** (Anki c1/c2): o segundo cartão fica fácil por ter visto o primeiro. Aceito na Fase 2; resolver com `sibling_group` se incomodar no uso.
- **Fase 2 — zoom de imagem no iOS** disputa com o zoom da página. Mitigação: `touch-action: none` só dentro do visualizador.

### Conformidade com o AGENTS.md e as rules

Lidos o `AGENTS.md` do Lingo e as quatro rules (`code-standards`, `javascript-typescript`, `tests`, `folder-structure`). Aplicam-se ao CertameCards sem exceção: arquivos ≤ 100 linhas (em componente Angular, `.ts` e `.html` contam separados), funções ≤ 30 linhas, ≤ 3 parâmetros (objeto de parâmetros acima disso), sem comentários (exceto “porquê” impossível de expressar em código; SQL de migration pode documentar decisões), constantes nomeadas, `const`/`===`/nunca `any`, arrow em callbacks, ternário sem aninhamento, segredos fora do código, teste junto com todo código e piso de 80%. A rule de estrutura de pastas é reescrita para Angular (ver `AGENTS.md` do CertameCards). Commits sem linha de coautoria de modelo.

### Conformidade com skills

- `criar-prd` → `criar-techspec` → `criar-tasks` → `executar-task` → `executar-review` → `executar-qa`: copiar do Lingo trocando as menções a React/`src/services` pelo mapa deste documento.
- `supabase`: migrations, RLS, RPC.
- `vercel-cli`: deploy, variáveis por escopo.
- `agent-browser`: roteiros E2E.
- **Desvio**: `vercel-react-best-practices` e `vercel-composition-patterns` não se aplicam; instalar uma skill de boas práticas de Angular pelo `find-skills` e registrá-la na tabela do `AGENTS.md`.

### Arquivos relevantes e dependentes

Origem (lingo, `des`) → destino (certamecards):

- `src/services/db.ts` → `src/app/domain/db.ts`, `dirty-tracking.ts`, `decks.ts`, `cards.ts`
- `src/services/scheduler.ts` → `src/app/domain/scheduler.ts`, `queue.ts`
- `src/components/textMarks.ts` (+ `.test.ts`) → `src/app/domain/text-marks.ts`
- `src/services/lww.ts`, `sync.ts`, `syncRows.ts`, `auth.ts`, `supabase.ts`, `stats.ts` (+ testes) → `src/app/domain/`
- `src/components/homeSummary.ts`, `dueBadge.ts`, `pendingIndicator.ts` → `src/app/domain/`
- `src/test/setup.ts`, `fakeSupabase.ts`, `dbHelpers.ts` → `src/test/`
- `src/components/MarkableField.tsx`, `MarkBackdrop.tsx`, `MarkActions.tsx`, `MarkedText.tsx`, `CardForm.tsx` → `src/app/ui/…`
- `src/screens/*.tsx` → `src/app/pages/…` (ver tabela de rotas)
- `src/index.css`, `tailwind.config.js` → `src/styles.css` (`@theme`)
- `supabase/migrations/*.sql` → `supabase/migrations/20261001000000_schema.sql` (consolidada)
- `.agents/rules/*`, `.agents/skills/criar-*`/`executar-*` → `.agents/` (adaptados)
- `AGENTS.md` → `AGENTS.md` (reescrito)
- Fase 2: `src/services/ankiImport.ts`, `components/AnkiNotePicker.tsx`, `screens/Import.tsx` → `domain/anki-*.ts`, `ui/anki-field-mapper`, `pages/import/`; `src/services/backup*.ts`, `screens/Restore.tsx`, `components/Restore*.tsx`, `BackupSection.tsx` → `domain/backup-*.ts`, `pages/backup/`, `ui/restore-preview` (sem `backupAudio*`)
- Fase 2: `supabase/migrations/20261101000000_images_reminders.sql`, `supabase/functions/send-reminders/index.ts` (novos)
