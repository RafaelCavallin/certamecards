# Especificação técnica — Proteção dos dados locais

> PRD: [prd.md](prd.md). TechSpec-base: [tasks/produto/techspec.md](../produto/techspec.md). O modelo de dados, o Dexie `version(2)`, a sincronização e o fluxo de conta estão lá e não mudam aqui. Os casos de teste desta entrega usam o sufixo `P` (`TU-P*`, `TI-P*`, `E2E-P*`). O Lingo só tem o `navigator.storage.persist()` na abertura (`src/App.tsx`), igual ao [app.ts](../../src/app/app.ts) de hoje; não há lógica de detecção a portar.

## Resumo

A perda é detectada por dois sinais do próprio Dexie, sem tabela nova.

**Perda em uso (RF79).** No Dexie 4.4.6, quando o navegador fecha a conexão (`IDBDatabase` `close`, disparado quando os dados do site são apagados) ou outra aba pede `versionchange`, o Dexie chama `close({ disableAutoOpen: false })`. A próxima consulta reabre um banco, vazio se ele foi apagado, sem erro (`node_modules/dexie/dist/dexie.mjs`, `idbdb.onclose` ~4578 e o `versionchange` padrão ~5942). O evento `db.on('close')` dispara nesses casos, e o app nunca fecha o banco por conta própria. Ao recebê-lo, o domínio fecha o banco de vez com `close({ disableAutoOpen: true })`, numa microtarefa, para que nada mais seja gravado num banco recriado (RF79c). O estado de `state/` abre o aviso bloqueante.

**Perda entre visitas (RF80).** O evento `db.on('populate')` só dispara quando o banco é **criado**. Um gancho registrado em [db.ts](../../src/app/domain/db.ts) compara com um marcador no `localStorage` (`certamecards.storeCreatedAt`). Se o marcador já existia, o banco foi recriado num navegador que já tinha dados, e o gancho grava `certamecards.storeLostAt`. O despejo por falta de espaço apaga só o armazenamento gerenciado por quota (IndexedDB, Cache Storage, service worker) e preserva o `localStorage`, como verificado no perfil do Chrome do incidente. Uma limpeza total apaga o marcador junto e não gera aviso (RF80d). Na abertura, instalações anteriores ganham o marcador sem aviso, e o aviso explicativo aparece enquanto `storeLostAt` estiver preenchido.

**Restante.**
- A edição passa a ter um estado de carregamento explícito, calculado no domínio: carregando, pronto, não encontrado ou falhou (RF81).
- O `scheduler` recusa responder um cartão inexistente (RF81d).
- A persistência vira um módulo de domínio com três estados e um serviço em `state/`, chamado na abertura, ao fim da importação e por botão em Ajustes (RF82, RF83).

## Arquitetura do sistema

### Visão dos componentes

| Camada | Módulo | Novo/mod. | Papel |
| --- | --- | --- | --- |
| domain | `store-marker.ts` | novo | Funções puras sobre `KeyValueStorage` (de [local-storage.ts](../../src/app/domain/local-storage.ts)): `recordStoreCreated(storage, now)`, `ensureStoreMarker(storage, now)`, `pendingStoreLoss(storage)`, `dismissStoreLoss(storage)`. Não importa `db`, o que evita o ciclo com `db.ts`. |
| domain | `db.ts` | mod. | Registra `db.on('populate', …)`, que chama `recordStoreCreated(browserStorage(), Date.now())`, ao lado dos `trackDirty`. |
| domain | `storage-loss.ts` | novo | `initStoreMarker(storage)`: `await db.open()`, depois `ensureStoreMarker`. `watchConnectionClosed(onClosed)`: assina `db.on('close')`; no primeiro `close`, agenda `db.close({ disableAutoOpen: true })` numa microtarefa e chama `onClosed` uma única vez; devolve a função que cancela a assinatura. |
| domain | `storage-persistence.ts` | novo | `PersistenceState`, `browserPersistenceManager()`, `readPersistence(manager)` e `requestPersistence(manager)`, que tratam API ausente e exceções. |
| domain | `card-draft.ts` | mod. | `loadCardDraftState(cardId)` → `DraftLoadState` (`ready` / `missing` / `failed`), com `try/catch` em volta de `loadCardDraft`. |
| domain | `scheduler.ts` | mod. | `answer` lança `Error('Cartão não encontrado.')` quando `db.cards.update` devolve `0`, antes de `reviewLogs.add`; a transação desfaz tudo. |
| state | `storage-health.ts` | novo | `@Service()` root com os signals `connectionLost` e `lostAt`. Na construção: `initStoreMarker`, leitura de `pendingStoreLoss`, `watchConnectionClosed`. Métodos `dismissLoss()` e `reload()`. Ao fechar a conexão, relê `pendingStoreLoss` para o caso de o Dexie já ter recriado o banco. |
| state | `storage-persistence-store.ts` | novo | `@Service()` root com o signal `state` (`PersistenceState \| undefined`) e `request()`. |
| state | `anki-import-run.ts` | mod. | Em `write()`, depois do sucesso, `void this.persistence.request()`. |
| state | `review-session.ts` | mod. | Signal `error` (`string \| null`). `answer` captura a falha e grava a mensagem “Não foi possível registrar a resposta.”; responder com sucesso ou trocar de cartão limpa o erro. |
| ui | `storage-alert/` (`.ts` + `.html`) | novo | Dois `<dialog>`: o bloqueante e o explicativo. Abertos por `effect` a partir de `StorageHealth`; o texto do explicativo varia com `AuthStore.session()`. |
| ui | `card-edit-dialog/` | mod. | Signal `load: DraftLoadState \| { status: 'loading' }`. Mensagens para `missing`/`failed` e botão “Fechar” fora do formulário quando o estado não é `ready`. |
| pages | `card-edit/` | mod. | Usa `loadCardDraftState`; mostra “Não foi possível abrir o cartão.” em `failed`. |
| pages | `review/review.html` | mod. | `<p role="alert">` com `session.error()`, acima da barra de respostas. |
| pages | `settings/settings-storage` (`.ts` + `.html`) | novo | Seção “Armazenamento” (RF82b, RF82c), antes do Backup em `settings.html`. |
| pages | `import/import-summary` | mod. | Linha de backup quando não há sessão e o estado não é `persisted` (RF83). |
| app | `app.ts`, `app.html` | mod. | `persistStorage()` dá lugar a `inject(StoragePersistence).request()`; `inject(StorageHealth)`; `<app-storage-alert />` ao lado do aviso de nova versão. |

### Relacionamentos e fluxo de dados

1. **Abertura.**
   - O módulo `db.ts` registra o gancho `populate` ao ser avaliado, antes de qualquer consulta.
   - O `App` injeta `StorageHealth`, que chama `initStoreMarker`. O `db.open()` dentro dele garante que o `populate` já rodou: se o banco era novo e havia marcador, `storeLostAt` foi gravado.
   - `StorageHealth` lê `pendingStoreLoss` e, se houver perda, `lostAt` é preenchido e o `storage-alert` abre o explicativo.
2. **Perda em uso.**
   - O navegador fecha a conexão e o Dexie dispara `close`.
   - `watchConnectionClosed` bloqueia a reabertura e avisa `StorageHealth`, que põe `connectionLost` em `true`.
   - O `storage-alert` abre o bloqueante com `showModal()`, e a página fica inerte.
   - “Recarregar” chama `location.reload()`. No novo carregamento o banco é criado de novo (se foi apagado), o `populate` grava a perda, e o fluxo 1 mostra o explicativo.
   - Se foi só uma atualização de versão em outra aba, o banco existe, o `populate` não dispara e nenhum aviso aparece (CA-P08).
3. **Edição.**
   - O modal e a página chamam `loadCardDraftState` depois do `prefetch` (que já engole as próprias falhas).
   - `missing` e `failed` encerram o carregamento com mensagem.
4. **Resposta.**
   - O `scheduler` lança para cartão inexistente, e a transação Dexie desfaz o `update`.
   - `ReviewSession.answer` captura, grava `error` e não avança `index` nem `done`.
5. **Persistência.**
   - `StoragePersistence.request()` faz `persisted()` e, se for `false`, `persist()`; o resultado vai para `state`.
   - Ajustes lê `state` e o botão chama `request()`.
   - A importação chama `request()` ao concluir, e o resumo lê `state` junto com `AuthStore.session()`.

**Offline e sem conta:** nada aqui usa rede. Com conta, a recuperação é a já existente. Depois de uma perda, o banco novo não tem `boundUserId`, e o `AuthStore.restore` encontra a sessão ainda guardada no `localStorage`; o `decideOnSignIn` vê só o baralho semeado e adota a conta (`auto-adopt: adopt`), e a sincronização traz os dados. Nenhuma linha sincronizável nova é escrita por esta entrega; LWW, `dirty` e a ordem do push não mudam.

## Design de implementação

### Principais interfaces

```ts
// domain/store-marker.ts
export function recordStoreCreated(storage: KeyValueStorage | null, now: number): void;
export function ensureStoreMarker(storage: KeyValueStorage | null, now: number): void;
export function pendingStoreLoss(storage: KeyValueStorage | null): number | null;
export function dismissStoreLoss(storage: KeyValueStorage | null): void;

// domain/storage-loss.ts
export function initStoreMarker(storage: KeyValueStorage | null): Promise<void>;
export function watchConnectionClosed(onClosed: () => void): () => void;

// domain/storage-persistence.ts
export function browserPersistenceManager(): PersistenceManager | undefined;
export function readPersistence(manager: PersistenceManager | undefined): Promise<PersistenceState>;
export function requestPersistence(manager: PersistenceManager | undefined): Promise<PersistenceState>;

// domain/card-draft.ts
export function loadCardDraftState(cardId: string): Promise<DraftLoadState>;
```

```text
StorageHealth (state)       connectionLost: Signal<boolean>, lostAt: Signal<number | null>, dismissLoss(), reload()
StoragePersistence (state)  state: Signal<PersistenceState | undefined>, request(): Promise<void>
ReviewSession (state, mod.) error: Signal<string | null>
```

### Modelos de dados

#### Marcadores no `localStorage`

| Chave | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `certamecards.storeCreatedAt` | `string` (epoch ms) | não | Data da criação do banco local que este navegador conhece. Gravada pelo `populate` ou, em instalações antigas, por `ensureStoreMarker`. |
| `certamecards.storeLostAt` | `string` (epoch ms) ou `''` | não | Data em que o banco foi recriado com o marcador presente, ou seja, uma perda. `''` ou ausente: nenhuma perda pendente. O tipo `KeyValueStorage` só tem `getItem`/`setItem`, por isso dispensar grava `''`. |

```text
{
  "certamecards.storeCreatedAt": "1792330496000",
  "certamecards.storeLostAt": "1792330496000"
}
```

> **Regras de `recordStoreCreated`:** se `storeCreatedAt` tem valor, grava `storeLostAt = now`; sempre grava `storeCreatedAt = now`. Storage `null` (modo restrito, cota cheia, testes em Node): não faz nada. Todo acesso fica em `try/catch`, como em [deck-store.ts](../../src/app/state/deck-store.ts).

> **`pendingStoreLoss`:** `Number(valor)` quando é um inteiro positivo; senão, `null`.

#### `PersistenceState` e `PersistenceManager`

| Valor | Quando |
| --- | --- |
| `'persisted'` | `persisted()` ou `persist()` devolveu `true`. |
| `'best-effort'` | A API existe e devolveu `false`, ou lançou exceção. |
| `'unsupported'` | `navigator.storage` não tem `persist`/`persisted`. |

```text
PersistenceManager = Pick<StorageManager, 'persist' | 'persisted'>
```

#### `DraftLoadState`

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `status` | `'ready' \| 'missing' \| 'failed'` | sim | Resultado da leitura. |
| `draft` | `CardDraft` | só em `ready` | Rascunho carregado. |

```text
{ "status": "ready", "draft": { "content": { "front": "…", "back": "…", "notes": "", "marks": { … }, "tags": [] }, "gallery": [] } }
{ "status": "missing" }
```

> Os componentes acrescentam `{ status: 'loading' }` como estado inicial; ele não sai do domínio.

#### Textos

| Onde | Texto |
| --- | --- |
| Aviso bloqueante | Título “Os dados ficaram inacessíveis”. “O CertameCards perdeu o acesso aos dados deste navegador. Recarregue a página para continuar.” Botão “Recarregar”. |
| Aviso explicativo | Título “Os dados deste aparelho foram apagados”. “O navegador apagou o que o CertameCards guardava aqui. Isso costuma acontecer quando falta espaço no aparelho e o armazenamento do site não está protegido.” |
| Explicativo, sem conta | “Para recuperar, restaure um backup ou importe seus baralhos de novo.” Links: Backup, Importar do Anki, Armazenamento. |
| Explicativo, com conta | “Você está conectado: o que estava sincronizado volta pela sua conta.” Links: Conta, Armazenamento. |
| Explicativo, botão | “Entendi”. |
| Modal de edição | “Cartão não encontrado.” / “Não foi possível abrir o cartão.” Botão “Fechar”. |
| Revisão | “Não foi possível registrar a resposta.” |
| Ajustes → Armazenamento | Ver RF82b do PRD; botão “Proteger meus dados”. |
| Resumo da importação | “Sem conta, estes cartões só existem neste navegador.” Link “Faça um backup”. |

### Endpoints da API

Não se aplica: nenhuma rota, RPC ou tabela do Supabase muda.

## Pontos de integração

- **Dexie 4.4.6**: eventos `populate` e `close` e `close({ disableAutoOpen })`; a versão está fixada pelo `package-lock`. Uma atualização do Dexie exige reler esse comportamento (risco abaixo).
- **StorageManager** (`navigator.storage.persist`/`persisted`): Chrome concede ou nega sem perguntar, por heurística; Firefox pode perguntar; Safari pode conceder só a app instalado. Toda falha cai em `best-effort`.
- **AuthStore**: lido pelo `storage-alert` e pelo resumo da importação, sem mudança.

## Abordagem de testes

### Testes de unidade

| ID | Nome do caso de teste | Critérios de aceitação | Resultado esperado |
|----|-----------------------|------------------------|--------------------|
| TU-P01 | `recordStoreCreated` sem marcador | CA-45 | Grava `storeCreatedAt`; `pendingStoreLoss` continua `null`. |
| TU-P02 | `recordStoreCreated` com marcador | CA-45 | Grava `storeLostAt = now` e renova o marcador. |
| TU-P03 | `ensureStoreMarker` não sobrescreve | CA-P02 | Com marcador existente, o valor não muda; sem marcador, grava e não gera perda. |
| TU-P04 | `dismissStoreLoss` | CA-45 | Depois de dispensar, `pendingStoreLoss` devolve `null`. |
| TU-P05 | Storage indisponível | — | Com `null` ou com `getItem`/`setItem` lançando, nenhuma função lança. |
| TU-P06 | `readPersistence` e `requestPersistence` | CA-46, CA-P06 | Manager ausente → `unsupported`; `persisted()` `true` → `persisted` sem chamar `persist`; `persist()` `true`/`false` → `persisted`/`best-effort`; exceção → `best-effort`. |
| TU-P07 | `pendingStoreLoss` com valor inválido | — | `''`, texto não numérico ou `0` → `null`. |

### Testes de integração

| ID | Nome do caso de teste | Critérios de aceitação | Resultado esperado |
|----|-----------------------|------------------------|--------------------|
| TI-P01 | Banco recriado com marcador | CA-45 | Com `storeCreatedAt` no `localStorage`, `db.delete()` seguido de `db.open()` dispara o `populate` e deixa uma perda pendente. |
| TI-P02 | `initStoreMarker` num banco existente | CA-P02 | Com o banco aberto e sem marcador, grava o marcador e não registra perda. |
| TI-P03 | `watchConnectionClosed` | CA-44 | `db.close({ disableAutoOpen: false })` chama `onClosed` uma única vez e uma consulta seguinte rejeita com `DatabaseClosedError`. Depois do cancelamento, novos `close` não chamam o callback. `afterEach` reabre o banco. |
| TI-P04 | `answer` em cartão inexistente | CA-P05 | Lança “Cartão não encontrado.” e `reviewLogs` continua vazio. |
| TI-P05 | `answer` em cartão existente | — | Regressão: atualiza o agendamento e grava um log. |
| TI-P06 | `loadCardDraftState` | CA-P04 | Cartão existente → `ready` com o rascunho; id inexistente → `missing`; leitura que lança (tabela fechada) → `failed`. |

Os testes rodam no Vitest com `fake-indexeddb` e `resetDb` de [db-helpers.ts](../../src/test/db-helpers.ts). Os que dependem de `localStorage` rodam no ambiente jsdom; os de `store-marker` usam um `KeyValueStorage` em memória.

### Testes E2E

Executados à mão no `/executar-qa` com a skill `agent-browser`, contra `npm start -- --port <42xx>`, com capturas em `evidences/`.

| ID | Nome do caso de teste | Critérios de aceitação | Resultado esperado |
|----|-----------------------|------------------------|--------------------|
| E2E-P01 | Perda em uso na revisão | CA-44, CA-P01 | Ver roteiro. |
| E2E-P02 | Aviso explicativo e dispensa | CA-45 | Ver roteiro. |
| E2E-P03 | Primeiro uso e limpeza total | CA-45 | Nenhum aviso. |
| E2E-P04 | Instalação anterior à entrega | CA-P02 | Nenhum aviso; marcador criado. |
| E2E-P05 | Edição de cartão excluído | CA-P04 | “Cartão não encontrado.”; fecha por botão e Esc. |
| E2E-P06 | Resposta a cartão excluído | CA-P05 | Mensagem; posição não avança. |
| E2E-P07 | Ajustes → Armazenamento | CA-46, CA-P06 | Estado e botão. |
| E2E-P08 | Resumo da importação | CA-P07 | Linha de backup sem conta. |
| E2E-P09 | Atualização em outra aba | CA-P08 | Bloqueante; depois do recarregar, dados intactos e sem explicativo. |
| E2E-P10 | Aviso com conta | CA-P03 | Texto com a conta, com Supabase local. |

**Roteiros:**
1. **E2E-P01**: importar o `Português.apkg` → `/revisar` → `eval` com `indexedDB.deleteDatabase('certamecards')`. Esperado:
   - O aviso bloqueante aparece.
   - Esc não o fecha.
   - Clicar em “Acertei” atrás dele não tem efeito (página inerte).
   - Captura de tela.
2. **E2E-P02**: continuando o P01, “Recarregar” → o aviso explicativo aparece com os links → “Entendi” → `reload` → nenhum aviso.
3. **E2E-P03**: `eval` com `localStorage.clear()` e `indexedDB.deleteDatabase('certamecards')` → `reload` → nenhum aviso, com “Meus cartões” criado.
4. **E2E-P04**:
   - `eval` com `localStorage.removeItem('certamecards.storeCreatedAt')` → `reload`.
   - Nenhum aviso.
   - `eval` mostra o marcador presente.
5. **E2E-P05**:
   - Em `/revisar`, `eval` remove o cartão atual com `indexedDB.open('certamecards')` → `transaction('cards','readwrite').objectStore('cards').delete(<id>)`.
   - Tocar “Editar cartão”: aparece “Cartão não encontrado.”.
   - “Fechar” funciona; reabrir e fechar com Esc também.
6. **E2E-P06**: mesma remoção → “Mostrar resposta” → “Acertei” → aparece “Não foi possível registrar a resposta.”, e a posição continua a mesma.
7. **E2E-P07**: `/ajustes` → seção “Armazenamento” mostra o estado (no Chromium headless, em geral “Não protegido”) → “Proteger meus dados” → o estado é exibido de novo, sem erro.
8. **E2E-P08**: sem conta, importar o `.apkg` → no resumo aparece a linha de backup com link para `/ajustes/backup`.
9. **E2E-P09**:
   - Com `/revisar` aberto na aba A, abrir a aba B e rodar `eval` com `indexedDB.open('certamecards', <versão atual + 1>)`, com `onupgradeneeded` vazio, e fechar.
   - A aba A mostra o bloqueante.
   - Fechar a aba B, recarregar a A: os cartões continuam e o explicativo não aparece.
   - A versão atual do IndexedDB é a do Dexie vezes 10 (`version(2)` → 20); confirmar com `indexedDB.databases()`.
10. **E2E-P10**: com `npx supabase start`, entrar numa conta, sincronizar, `eval` com `indexedDB.deleteDatabase('certamecards')` → “Recarregar” → o explicativo mostra a variante com conta, e os cartões voltam depois da sincronização.

## Sequenciamento do desenvolvimento

### Ordem de construção

1. **Domínio da perda**: `store-marker.ts`, o gancho em `db.ts` e `storage-loss.ts`, com TU-P01–P05, TU-P07 e TI-P01–P03. É a base de tudo e o maior risco técnico (comportamento do Dexie).
2. **Domínio de persistência, edição e resposta**: `storage-persistence.ts`, `loadCardDraftState` e o `scheduler`, com TU-P06 e TI-P04–P06.
3. **Avisos**: `StorageHealth`, `storage-alert` e as mudanças em `app.ts`/`app.html`.
4. **Edição e revisão**: `card-edit-dialog`, `card-edit` e o erro da `ReviewSession` na revisão.
5. **Proteção**: `StoragePersistence`, `settings-storage`, a chamada em `AnkiImportRun` e a linha no resumo da importação.
6. **QA**: E2E-P01–P10.

### Dependências técnicas

- Nenhuma infraestrutura nova. O E2E-P10 precisa do Supabase local (`npx supabase start`); os demais rodam sem variáveis de ambiente.

## Monitoramento e observabilidade

Não há telemetria no projeto. Ficam dois `console.warn`, que aparecem nos relatos de QA e no console do usuário: “Conexão com o banco local encerrada pelo navegador.” no `close`, e “Banco local recriado: os dados anteriores deste navegador foram apagados.” quando o `populate` registra perda. A falha de resposta já aparece na tela; a exceção original vai para `console.error` na `ReviewSession`, como faz a importação.

## Considerações técnicas

### Principais decisões

- **`populate` + marcador no `localStorage`, em vez de uma linha no `syncState`.** Uma linha no banco some em `wipeLocalData` (descartar dados ou trocar de conta) e geraria falso positivo. O `populate` só dispara na criação real do banco e pega também a recriação no meio da sessão. **Descartado**: guardar no `syncState`; comparar contagem de cartões, que não distingue perda de exclusão feita pelo usuário.
- **Fechar o banco de vez depois do `close`.** Sem isso, o Dexie reabre um banco vazio e respostas e sincronizações seguintes gravam nele (o que aconteceu no incidente). A reabertura volta a ser permitida só no recarregar. O fechamento roda numa microtarefa, porque o próprio Dexie redefine `autoOpen` depois de disparar o evento.
- **Aviso bloqueante sem saída além de “Recarregar”.** Depois de perder a conexão, nenhuma tela é confiável; recarregar é o único estado consistente. No caso de atualização em outra aba, recarregar também é o certo.
- **Pedir persistência na abertura, ao fim da importação e por botão.** No Chrome o pedido não pergunta nada, e a decisão muda com o engajamento, então repetir aumenta a chance de ser concedido. A importação é o momento em que o usuário acaba de ganhar muitos dados. **Descartado**: pedir a cada resposta (ruído e, no Firefox, prompts repetidos).
- **`loadCardDraftState` no domínio.** Mantém a regra testável e conta na cobertura; o modal e a página compartilham o mesmo resultado.

### Riscos conhecidos

- **Comportamento interno do Dexie** (`close` e `populate`): coberto por TI-P01 e TI-P03, que quebram se uma atualização mudar a semântica.
- **Navegadores que apagam o `localStorage` junto** (Safari ITP, limpeza total): não há aviso. É aceito no PRD e é o comportamento desejado para a limpeza feita pelo usuário.
- **Falso positivo no bloqueante**: o Dexie também fecha e reabre por um workaround de `InvalidStateError` do Chrome (`PR1398`, ~1190). Com esta entrega, isso mostra o bloqueante; recarregar resolve, e nada se perde. É raro.
- **E2E-P09**: abrir o banco numa versão maior pode impedir o Dexie `version(2)` de abrir depois (`VersionError`). Se isso acontecer no QA, o roteiro passa a verificar só o aviso bloqueante e apaga o banco depois, registrando a limitação.
- **Testes com `close`/`delete`** compartilham o banco do processo do Vitest; cada teste reabre o banco no `afterEach` para não contaminar os outros.

### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e as rules `code-standards.md`, `javascript-typescript.md` e `tests.md`.
- `domain/` continua sem `@angular/*` e sem `rxjs`; o único contato com o Dexie é em `domain/`.
- `pages/` e `ui/` falam com o banco só por funções de `domain/` ou por serviços de `state/`; `ui/storage-alert` recebe tudo de `state/`.
- Arquivos com até 100 linhas (`.ts` e `.html` contados separados), funções com até 30, até 3 parâmetros, sem comentários, `function` nas principais e arrow nos callbacks, união de strings em vez de `enum`, código em inglês e textos em português.
- Cores só por token (`text-miss` para erro, `border-edge` nos botões, `backdrop:bg-scrim` nos diálogos), escala `text-meta`/`text-body`/`text-label`, sem `dark:`.
- Todo código entra com teste; o piso de 80% em `domain/` é mantido.
- Nenhuma migration, coluna ou mudança em `sync_push`.

### Conformidade com skills

- `angular-developer`: signals, `inject()`, `@Service()`, `input()`/`output()`, controle de fluxo `@if`, `effect` para abrir os `<dialog>`.
- `agent-browser`: roteiros E2E-P01–P10 no `/executar-qa`.
- `supabase`: só para subir o ambiente local do E2E-P10; nenhum schema muda.
- Sem desvios.

### Arquivos relevantes e dependentes

- Novos:
  - `src/app/domain/store-marker.ts`, `storage-loss.ts` e `storage-persistence.ts`, com seus `.test.ts`.
  - `src/app/state/storage-health.ts` e `storage-persistence-store.ts`.
  - `src/app/ui/storage-alert/storage-alert.ts` e `.html`.
  - `src/app/pages/settings/settings-storage.ts` e `.html`.
- Modificados:
  - `src/app/domain/db.ts`.
  - `src/app/domain/card-draft.ts`, com `card-draft.test.ts`.
  - `src/app/domain/scheduler.ts`, com `scheduler.test.ts`.
  - `src/app/state/review-session.ts` e `anki-import-run.ts`.
  - `src/app/ui/card-edit-dialog/*`.
  - `src/app/pages/card-edit/*` e `review/review.html`.
  - `src/app/pages/settings/settings.html` e `settings.ts`.
  - `src/app/pages/import/import-summary.*`.
  - `src/app/app.ts` e `app.html`.
- Dependentes (sem mudança):
  - `src/app/domain/local-storage.ts`, `auth.ts` e `local-data.ts`.
  - `src/app/state/auth-store.ts` e `image-prefetch.ts`.
  - `node_modules/dexie/dist/dexie.mjs` (comportamento de referência).
