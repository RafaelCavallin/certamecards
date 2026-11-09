# AGENTS.md

Guia rápido para qualquer agente/LLM trabalhando no **CertameCards** — app de revisão por repetição espaçada para concursos públicos, PWA offline-first, frontend **Angular 22**, backend **Supabase**. Visão de produto em [README.md](README.md); requisitos em [tasks/produto/prd.md](tasks/produto/prd.md); arquitetura em [tasks/produto/techspec.md](tasks/produto/techspec.md).

Este projeto é um porte deliberado do **Lingo** (`github.com/RafaelCavallin/lingo`, branch `des`). Antes de escrever lógica nova, procure a equivalente no Lingo: quase toda regra de negócio já existe lá, testada. O que **não** existe aqui: áudio/TTS, velocidade de voz, gravação, fonética, geração por IA, cadastro de matérias. Importação do Anki e backup em arquivo voltam na **Fase 2** (portados do Lingo, sem áudio).

## Regras

- [.agents/rules/code-standards.md](.agents/rules/code-standards.md) — arquivos ≤ 100 linhas (em componente Angular, `.ts` e `.html` contam separados), funções ≤ 30 linhas, ≤ 3 parâmetros, guardas, constantes nomeadas, sem comentários, segredos fora do código.
- [.agents/rules/javascript-typescript.md](.agents/rules/javascript-typescript.md) — `const`, `===`, nunca `any`, tipos explícitos em contratos, `function` nas funções principais e arrow em callbacks, ternário sem aninhamento.
- [.agents/rules/tests.md](.agents/rules/tests.md) — **todo código entra com teste**, piso de 80% em `src/app/domain/**`, FIRST, AAA.
- Estrutura de pastas: seção abaixo (substitui o `folder-structure.md` do Lingo).

As três primeiras são copiadas do Lingo; onde elas citam React, leia “componente Angular”; onde citam `src/services/`, leia `src/app/domain/`.

## Estrutura de pastas

```
src/
├── index.html, main.ts, styles.css   Entrada, bootstrap, Tailwind v4 + tokens (@theme) + fontes
├── environments/env.ts                GERADO por scripts/write-env.mjs — nunca editar nem versionar
├── app/
│   ├── app.ts, app.config.ts, app.routes.ts
│   ├── domain/    TS puro: Dexie, FSRS, fila, marcas, sync, auth, stats — sem @angular/*
│   ├── state/     Serviços Angular com signals (deck-store, auth-store, sync-store, live-query…)
│   ├── pages/     Uma pasta por rota: home, review, cards, decks, card-new, card-edit, progress, settings, account, no-deck
│   └── ui/        Componentes reutilizados: markable-field, marked-text, card-form, heatmap, deck-switcher…
└── test/          setup.ts (fake-indexeddb, Web Locks), fake-supabase.ts, db-helpers.ts
supabase/migrations/   Fonte da verdade do banco (tabelas, RLS, RPCs sync_push e sync_push_images)
supabase/functions/    Edge Functions (Fase 2: send-reminders, Deno)
scripts/               write-env.mjs, check-type-scale.mjs
tasks/produto/         PRD e TechSpec-base do produto inteiro — referência, não entra na esteira
tasks/prd-<slug>/      Uma pasta por entrega: prd.md, techspec.md, tasks.md, task_N.md, codereview.md, qa.md, evidences/
```

### Regras de dependência (quebrar = recusar a mudança)

- `domain/` **nunca** importa `@angular/*`, `rxjs`, nem nada de `state/`, `pages/`, `ui/`.
- `pages/` e `ui/` **nunca** abrem o Dexie (`db`) nem chamam o Supabase diretamente — sempre por uma função de `domain/`. Dentro dessa regra, dois padrões convivem: leitura reativa usa `state/live-query.ts#liveQuerySignal` (ou `liveQueryFor`, quando a consulta depende de um signal, como o baralho ativo) (direto do componente ou por trás de um serviço de `state/`); escrita pontual (criar, editar, excluir) chama a função de `domain/` direto do componente, sem precisar de um serviço de `state/` no meio. `state/` existe para estado **compartilhado entre páginas** (baralho ativo, contagem de pendentes no cabeçalho) — não é um intermediário obrigatório para toda leitura ou escrita.
- `ui/` não importa `pages/`. Precisa de algo da página? Recebe por `input()`.
- `src/test/` só é importado por arquivos `*.test.ts`.
- Dexie vira signal em um único lugar: as funções `liveQuerySignal` e `liveQueryFor` de `state/live-query.ts` — nenhum outro arquivo chama `liveQuery()` do Dexie diretamente.

### Regras de domínio que não se negociam

- **Lacuna (ocultar) só existe na Frente.** Verso e Notas aceitam apenas destaque. `normalizeCardMarks` descarta lacunas fora da Frente em qualquer entrada (formulário, pull, import, backup).
- Campos FSRS só são escritos pelo `scheduler`. Editar texto nunca reagenda nem gera log.
- Sessão de **reforço** (Fase 2) não escreve nada: nem agenda, nem log, nem estatística.
- Limites de texto, etiquetas e imagens vêm de `domain/card-limits.ts`, espelhando os `check` do banco.

### Onde colocar cada coisa nova

| O que você está escrevendo | Onde vai |
| --- | --- |
| Uma rota inteira | `src/app/pages/<nome>/<nome>.ts` + `.html` |
| UI usada por duas páginas ou mais | `src/app/ui/<nome>/<nome>.ts` + `.html` |
| Regra de negócio, consulta ou escrita no banco | `src/app/domain/<nome>.ts` |
| Função pura de apoio à UI (formatação, estado de revelação) | `src/app/domain/<nome>.ts` — para ser testável e contar na cobertura |
| Estado compartilhado entre páginas | `src/app/state/<nome>-store.ts` |
| Teste | ao lado do arquivo, `<nome>.test.ts` |
| Mudança de schema | migration **nova** em `supabase/migrations/` |

Nomes de arquivo em kebab-case sem sufixo (`home.ts`, não `home.component.ts`), seguindo o guia de estilo atual do Angular.

## Convenções de Angular

- Componentes standalone, `ChangeDetectionStrategy.OnPush` (padrão na v22), zoneless.
- `input()`, `output()`, `model()`, `signal`, `computed`; `inject()` em vez de construtor; `@Service` para serviços root.
- Controle de fluxo `@if`/`@for`/`@switch` nos templates; nunca `*ngIf`/`*ngFor`.
- Rotas com `loadComponent` para `progress`; guards funcionais `requireDeck`/`requireNoDeck`.
- Parâmetros de query chegam à página por `input()` com o mesmo nome (`withComponentInputBinding()` ligado em `app.config.ts`); não crie `input()` homônimo de um parâmetro de rota sem querer lê-lo.
- Sem NgRx. RxJS só nas bordas: `state/live-query.ts`, eventos do `Router` no `sync-store` e `SwUpdate`.

## Estilo visual

Os tokens são os do Lingo, declarados em `src/styles/tokens.css` (importado por `src/styles.css`) como variáveis CSS mapeadas por `@theme inline` (o tema claro da Fase 2 só troca as variáveis em `[data-theme='light']`): cores `ink #14142B`, `surface #1F1F3D`, `line #32325C`, `text #EDEBFF`, `muted #9C9BC4`, `signal #F4B740`, `hit #7CE2C0`, `miss #F2789B`; fontes Bricolage Grotesque (`font-display`), Inter (`font-body`), JetBrains Mono (`font-mono`), auto-hospedadas via `@fontsource-variable`.

Texto sobre `bg-signal` usa **`text-on-signal`**, nunca `text-ink` (no tema claro `ink` é o fundo claro). Cores sempre por token — nada de hex em template.

O tema claro vive em `src/styles/theme-light.css` (`:root[data-theme='light']`, importado por `styles.css`); o escuro é o `:root`. O tema é um atributo `data-theme` no `<html>`, aplicado antes da primeira pintura pelo script inline do `index.html` e depois pelo `ThemeStore`. Além dos tokens acima, há tokens que existem para o contraste do tema claro — no escuro eles valem exatamente o que valiam as classes que substituíram:

| Token | Use em | Nunca em |
| --- | --- | --- |
| `edge` (`border-edge`, `bg-edge`) | borda de campos, botões e links com cara de botão; barras comuns da previsão | divisórias, painéis e diálogos (esses ficam em `line`) |
| `placeholder`, `placeholder-strong` (`placeholder:text-placeholder`) | texto de placeholder (antes `muted/40` e `muted/60`) | texto real |
| `scrim` (`backdrop:bg-scrim`) | véu atrás de `<dialog>` e do menu ☰ (antes `bg-ink/60`) | `image-viewer`, que usa `viewer` |
| `heat-0…3` (`fill-heat-N`) | níveis do heatmap, do vazio ao mais intenso | qualquer outro gráfico |

Não declare `color-scheme` e não use `dark:` do Tailwind: o tema muda só pelas variáveis. Todo token novo precisa de valor nos dois temas e de teste de contraste em `src/app/domain/theme-palette.test.ts`.

**Tipografia maior que no Lingo** — use sempre a escala semântica:

| Classe | Tamanho | Uso |
| --- | --- | --- |
| `text-label` | 14 px | rótulos mono, cabeçalhos de tela, pílulas |
| `text-meta` | 16 px | texto auxiliar, botões secundários, itens de lista |
| `text-body` | 18 px | corpo, Notas, botões principais |
| `text-back` | 22 → 24 px | Verso |
| `text-front` / `text-front-long` | 24 → 30 px / 20 → 24 px | Frente (longa = > 280 caracteres) |

**Proibido** nos templates: `text-xs`, `text-[Npx]`/`text-[Nrem]`, qualquer tamanho abaixo de 13 px e cores em hex. `npm run check:type-scale` falha se encontrar.

## Onde cada coisa roda (portas)

| Serviço | Porta | Como sobe |
| --- | --- | --- |
| Frontend (`ng serve`) | `4200` | `npm start` |
| Supabase de desenvolvimento | remoto (`https://<ref-dev>.supabase.co`) | nada a subir — projeto hospedado `certamecards-dev` |

O Supabase **não roda mais em Docker** neste projeto: desenvolvimento usa o projeto hospedado `certamecards-dev`. O `supabase/config.toml` (portas `55321…`) só vale para quem voltar a subir a stack local, e o que ele configura de auth **não** é aplicado ao projeto remoto. Não há funções serverless (`api/`) neste projeto.

## Como rodar

```bash
npm install
npm start            # http://localhost:4200 — app completo, offline, sem conta
```

Sem nenhuma variável de ambiente o app funciona por completo; a área de conta mostra que a sincronização não está disponível.

### Com conta e sincronização (Supabase de desenvolvimento)

O `.env.local` (fora do git) aponta para o projeto `certamecards-dev`:

```
NG_APP_SUPABASE_URL=https://<ref-dev>.supabase.co
NG_APP_SUPABASE_PUBLISHABLE_KEY=<publishable key do certamecards-dev>
SUPABASE_DEV_DB_URL=postgresql://postgres:<senha>@db.<ref-dev>.supabase.co:5432/postgres
```

O `prestart`/`prebuild` roda `scripts/write-env.mjs`, que gera `src/environments/env.ts` a partir do ambiente (prioridade: variáveis do processo > `.env.local` > `.env`). Ele só exporta as chaves `NG_APP_SUPABASE_*`; `SUPABASE_DEV_DB_URL` fica fora do bundle e serve apenas à CLI. A conexão direta `db.<ref>` é só IPv6 — sem IPv6, use a URL do **Session pooler** (botão *Connect* do painel). Nunca imprima nem copie essa URL para fora do `.env.local`.

Configuração do `certamecards-dev` feita à mão no painel (espelha o `config.toml`): **Confirm email desligado** (o cadastro entra direto) e **Site URL** `http://localhost:4200`.

Para rodar um comando da CLI contra o dev sem expor a senha:

```bash
DEV_DB_URL="$(grep '^SUPABASE_DEV_DB_URL=' .env.local | cut -d= -f2-)"
```

## Isolamento entre desenvolvimento e produção

Desenvolvimento **nunca** fala com o banco de produção.

| Ambiente | Banco | Quem usa |
| --- | --- | --- |
| Local | projeto hospedado `certamecards-dev` | `npm start` via `.env.local` |
| Preview | nenhum banco; sincronização indisponível | deploys da branch `des` (escopo Preview da Vercel) |
| Produção | projeto hospedado `certamecards` | só a branch **`prod`** (escopo Production) |

- `prod` é produção, `des` é desenvolvimento; `main` não dispara deploy de produção. Os fluxos offline são validados no preview da `des`; conta e sincronização são validadas contra o `certamecards-dev` antes da promoção.
- Comandos de banco da CLI usam sempre `--remote=<url>` com a URL explícita. `--remote` **sem valor** e `--linked` miram o projeto "linkado" — nunca use. (`--db-url` está obsoleto desde a CLI v3 e sai na v4.)
- Antes de qualquer comando da CLI com `--remote=<url>` ou `--project-ref`, confira que o `<ref>` é o do `certamecards-dev` (o mesmo de `NG_APP_SUPABASE_URL` no `.env.local`). Se for o de produção, pare.
- O `certamecards-dev` é compartilhado entre sessões e guarda dados de teste; trate-o como um banco de verdade, não como algo descartável.
- O banco remoto `certamecards` é exclusivo da produção. Não configure `NG_APP_SUPABASE_URL` nem `NG_APP_SUPABASE_PUBLISHABLE_KEY` nos escopos Preview/Development da Vercel. Evite integração Marketplace que injete credenciais em todos os escopos.
- Nunca `npx vercel env pull` sem argumento (sobrescreve `.env.local`). Use `npx vercel env pull .env.vercel-prod.bak`.
- No escopo Production, só `NG_APP_SUPABASE_URL`, `NG_APP_SUPABASE_PUBLISHABLE_KEY` e (Fase 2) `NG_APP_VAPID_PUBLIC_KEY` vão para o bundle. **Nunca** `SUPABASE_SECRET_KEY`/`SERVICE_ROLE_KEY` com prefixo `NG_APP_`.

### Fluxo de uma migration nova

1. Desenvolvimento: revise com `npx supabase db push --remote="$DEV_DB_URL" --dry-run`, aplique com o mesmo comando sem `--dry-run` e valide o banco e os fluxos de conta/sync contra o `certamecards-dev`. Antes do push a migration pode ser editada à vontade; **depois de aplicada no dev, correção é migration nova**. Recriar o dev do zero (`npx supabase db reset --remote="$DEV_DB_URL"`, que apaga todos os dados dele) só com pedido do Rafael.
2. Preview: validar os fluxos offline sem variáveis do Supabase.
3. Produção: só com pedido explícito do Rafael, aplicar por `npx supabase db push --remote="postgresql://postgres:<senha>@db.<ref-prod>.supabase.co:5432/postgres"`, antes do deploy que depende dela. Nunca usar `--linked` nem `--remote` sem valor.

Toda coluna nova em `cards`/`decks`/`user_settings` exige **reemitir `sync_push` inteira** na mesma migration (lista do insert, select e `on conflict`) e atualizar `domain/sync-rows.ts` — sem isso o campo é descartado em silêncio a cada push. Novas marcas de texto **não** precisam disso: moram no `marks jsonb`. `cards.tags` e `user_settings` (Fase 2) já estão na migration inicial; imagens e push têm migration e RPC próprias.

### Edge Functions e agendamento (Fase 2)

```bash
npx supabase functions deploy send-reminders --project-ref <ref-dev>   # desenvolvimento
npx supabase functions deploy send-reminders --project-ref <ref-prod>  # só com pedido explícito do Rafael
```

`functions serve` depende da stack em Docker e não é mais o fluxo do projeto: a função é testada no `certamecards-dev`. Segredos da função (`VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `REMINDERS_TOKEN`) vão com `npx supabase secrets set --project-ref <ref>` no projeto certo — nunca no repositório. O `cron.schedule` do lembrete é aplicado à mão em cada ambiente (usa segredos do Vault); o SQL está na techspec.

## Comandos de validação

Os únicos comandos de validação do projeto:

| Comando | O que faz | Quando é obrigatório |
| --- | --- | --- |
| `npm run lint` | ESLint (`angular-eslint`) | toda alteração em `src/` |
| `npm test` | Vitest da camada `domain/`, uma vez | durante o desenvolvimento |
| `npm run test:coverage` | idem + piso de 80% em `src/app/domain/**` | antes de fechar tarefa, review ou QA |
| `npm run check:type-scale` | barra tamanhos de texto abaixo da escala | toda alteração em `.html`/`.ts` de UI |
| `npm run build` | `ng build` de produção (type-check incluso) | antes de fechar tarefa, review ou QA |

O CI (`.github/workflows/ci.yml`) roda `lint`, `check:type-scale`, `test:coverage` e `build`.

**UI fora do gate de cobertura**: `pages/`, `ui/` e `state/` são validados pelos roteiros `E2E-*` da techspec, executados à mão com a skill `agent-browser` contra o app rodando, com captura de tela em `tasks/prd-<slug>/evidences/`. Não há Playwright nem pasta `e2e/` — não crie sem alinhar com o Rafael.

## Skills

Esteira do projeto (copiada do Lingo e adaptada): `/criar-prd` → `/criar-techspec` → `/criar-tasks` → `/executar-task` → `/executar-review` → `/executar-qa`. Artefatos em `tasks/prd-<slug>/`, uma pasta por entrega; a tabela “Divisão em entregas” de [tasks/produto/prd.md](tasks/produto/prd.md) lista as pastas e a ordem. Com mais de uma pasta, passe `--prd <slug>` às skills. Cada fatia da Fase 2 ganha a sua pasta só quando for começar, com `/criar-prd` recortando o documento-mãe.

| Mexendo em | Consulte |
| --- | --- |
| `src/app/` (Angular) | `angular-developer` (oficial, `angular/skills`) |
| `supabase/migrations/`, RLS, RPC, auth | `supabase` |
| Deploy, variáveis de ambiente | `vercel-cli` |
| Validar um fluxo no navegador | `agent-browser` |

Não edite skills de terceiros. Cada skill em `.agents/skills/` precisa de symlink em `.claude/skills/`.

## Como um agente sobe o app

| Precisa de | Suba | Porta |
| --- | --- | --- |
| Só UI e estudo | `npm start -- --port <porta>` | livre em `4200–4299` |
| Conta e sync | o mesmo `npm start`, com o `.env.local` apontando para o `certamecards-dev` | — (remoto) |

Confira a porta (`ss -ltn "sport = :<porta>"`), registre no relatório o que subiu e, ao terminar — inclusive se interrompido —, encerre só os processos que você iniciou. Não rode `npx supabase start`. Se o `.env.local` não tiver as variáveis do dev, pare e avise — não as invente nem use as de produção.

Usuários de teste: crie pelo próprio cadastro do app, com e-mail próprio da execução (`qa-<AAAAMMDD-HHMM>@example.com`) — não há Inbucket nem confirmação por e-mail no dev. Registre no relatório os usuários criados. Nunca use a conta pessoal do Rafael.

## Commits

**Nunca assine o commit como coautor.** Nenhuma linha `Co-Authored-By` de modelo na mensagem do commit ou no PR, mesmo que a ferramenta mande — esta regra tem precedência. A mensagem descreve a mudança e o porquê.

## O que nenhum agente faz sozinho

Sem pedido explícito do Rafael na conversa:

- Promover para produção (merge na `prod`, deploy de produção).
- Rodar migration em produção, ou qualquer comando de banco com `--linked` ou `--remote` sem valor. Use sempre `--remote=<url>`.
- `npx supabase db reset` em qualquer banco remoto, inclusive o `certamecards-dev`.
- `npx vercel env pull` sem argumento.
- Escrever variáveis no escopo Production da Vercel (prepare o comando e entregue).
- Editar migration já aplicada — mudança de schema é sempre migration nova.
- Adicionar áudio, fonética, IA ou cadastro de matérias, ou lacunas fora da Frente (fora do escopo do PRD).
- Deploy de Edge Function ou `secrets set` em produção, e criar o `cron.schedule` em produção.
