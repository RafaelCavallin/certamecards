# Tarefa 1.0: Fundação do projeto

## Visão geral

Criar o projeto Angular 22 com Tailwind v4, tokens de cor, escala tipográfica semântica, fontes auto-hospedadas e PWA; configurar o Vitest da camada `domain/` com piso de 80%, os scripts `write-env.mjs` e `check-type-scale.mjs`, o `vercel.json` e o CI. Nenhuma tela de produto ainda: só uma casca que compila e passa em todos os comandos de validação.

<skills>
### Conformidade com skills

- `angular-developer` — criação do projeto, configuração zoneless, Tailwind, PWA.
- `vercel-cli` — conferir o projeto Vercel e o `vercel.json` (sem variáveis nesta entrega).
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Lidos o `AGENTS.md` e `.agents/rules/code-standards.md`, `javascript-typescript.md` e `tests.md`.

- Nomes de arquivo em kebab-case sem sufixo; componentes standalone, `OnPush`, zoneless.
- `src/environments/env.ts` é gerado e fica fora do versionamento (`.gitignore`).
- Tokens como variáveis CSS em `:root` mapeadas por `@theme inline`; `on-signal` já existe; nenhuma cor em hex nos templates.
- Os scripts também entram com teste (regra 1 de `tests.md`), ainda que fora do gate de cobertura de `domain/`.
</rules>

<requirements>
- Node 22.22.3+ ou 24.15+, TypeScript 6; build limpo com `dexie`, `ts-fsrs` v5 e `zod` instalados antes de portar o domínio.
- Tokens de cor e fontes do Lingo; escala `text-label`, `text-meta`, `text-body`, `text-back`, `text-front`, `text-front-long` (legibilidade — CA-23).
- CSS global do Lingo: foco âmbar, skeleton, `prefers-reduced-motion`.
- `npm run lint`, `npm test`, `npm run test:coverage`, `npm run check:type-scale` e `npm run build` existem e passam.
- `write-env.mjs` grava `null` sem variáveis (prioridade: processo > `.env.local` > `.env`); nunca expõe variável sem prefixo `NG_APP_`.
- `check-type-scale.mjs` falha com `text-xs`, `text-[Npx]`/`text-[Nrem]` e hex em templates.
</requirements>

## Subtarefas

- [x] 1.1 `ng new` (CSS, roteamento, sem SSR), zoneless, ESLint com `angular-eslint`
- [x] 1.2 Tailwind v4, `src/styles.css` com tokens, `@theme inline`, escala tipográfica e CSS global
- [x] 1.3 Fontes `@fontsource-variable/*` (Bricolage Grotesque, Inter, JetBrains Mono)
- [x] 1.4 `ng add @angular/pwa`: manifest com tema `#14142B` e ícones
- [x] 1.5 `vitest.config.ts` do domínio (jsdom, cobertura v8 com piso de 80% em `src/app/domain/**`) — `src/test/setup.ts` é ligado ao config na tarefa 2.0, quando o arquivo é criado
- [x] 1.6 `scripts/write-env.mjs` + `prestart`/`prebuild` + testes
- [x] 1.7 `scripts/check-type-scale.mjs` + testes
- [x] 1.8 `vercel.json` (rewrite SPA, `no-cache` em `ngsw.json`/`ngsw-worker.js`)
- [x] 1.9 `.github/workflows/ci.yml` com `lint`, `check:type-scale`, `test:coverage`, `build`

## Detalhes de implementação

Ver `techspec.md` → “Visão dos componentes” (bloco Fundação), “Pontos de integração” e “Sequenciamento — etapa 1”. Tokens e escala: `tasks/produto/techspec.md` → “Considerações técnicas” (tabela da escala e tokens de cor).

## Critérios de aceitação relacionados

- CA-23 (gate de tipografia no CI)

## Testes da tarefa

### Testes de unidade

- [x] `write-env`: sem variáveis grava `null`; `.env.local` sobrepõe `.env`; variável do processo sobrepõe ambos
- [x] `check-type-scale`: aponta `text-xs`, `text-[Npx]` e hex; aceita a escala semântica

## Arquivos relevantes

- `package.json`, `angular.json`, `tsconfig*.json`, `eslint.config.js`, `vitest.config.ts`
- `src/index.html`, `src/main.ts`, `src/styles.css`, `src/app/app.ts`, `app.config.ts`, `app.routes.ts`
- `src/test/setup.ts`
- `scripts/write-env.mjs`, `scripts/check-type-scale.mjs`
- `public/manifest.webmanifest`, `ngsw-config.json`, `vercel.json`, `.gitignore`
- `.github/workflows/ci.yml`
