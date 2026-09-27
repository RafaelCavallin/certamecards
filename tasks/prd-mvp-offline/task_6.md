# Tarefa 6.0: Estado e casca

## Visão geral

A ponte `domain/` ↔ telas com signals e a casca navegável do app: rotas, guards, cabeçalho com seletor de baralhos e indicador de pendentes, menu mobile e a tela “Crie seu primeiro baralho”.

<skills>
### Conformidade com skills

- `angular-developer` — signals, `@Service`, rotas com guards funcionais, `<dialog>` nativo, acessibilidade.
- `agent-browser` — roteiro E2E-05 com captura em `tasks/prd-mvp-offline/evidences/`.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Lidos o `AGENTS.md` e todas as rules em `.agents/rules/`.

- Dexie vira signal só em `state/live-query.ts`.
- `pages/` e `ui/` acessam dados só por `state/`; `ui/` não importa `pages/`.
- `input()`, `output()`, `inject()`, `@if`/`@for`; sem NgRx.
- `localStorage` sempre com try/catch (`certamecards.activeDeck`).
- Escala tipográfica semântica e cores por token; `check:type-scale` verde.
- `state/`, `pages/` e `ui/` ficam fora do gate de cobertura; validação pelo E2E.
</rules>

<requirements>
- RF14: `ensureDefaultDeck` no boot.
- RF15: seletor lista baralhos com pendentes, troca o ativo, cria (nome inline), renomeia e exclui — sem sair da tela atual.
- RF16: excluir pede confirmação.
- RF17: sem baralho → rota `sem-baralho`; guards `requireDeck`/`requireNoDeck`.
- RF20: indicador no cabeçalho soma os pendentes de todos os baralhos.
- RF23: `due-tick` recalcula a cada 30 s.
- Mobile-first: menu ☰ abaixo de `md`, largura máxima ~42 rem, `safe-area-inset`, áreas de toque ≥ 44 px.
</requirements>

- [x] 6.1 `state/live-query.ts` (`liveQuerySignal`, cancelamento no `DestroyRef`)
- [x] 6.2 `state/deck-store.ts` e `state/due-tick.ts` — `queue.ts` (tarefa 4.0) ganhou `totalQueueCount`, que faltava para o indicador do cabeçalho (RF20)
- [x] 6.3 `app.routes.ts` com todas as rotas do MVP (páginas vazias onde ainda não existem), `loadComponent` em todas as rotas (inclusive `progresso`), guards `requireDeck`/`requireNoDeck`
- [x] 6.4 Casca `app.ts`/`.html`: cabeçalho (com seletor de baralho visível em toda largura, não só desktop — RF15 pede "a partir do cabeçalho"), navegação inline a partir de `md`, `ui/mobile-nav`, `ui/due-badge`
- [x] 6.5 `ui/deck-switcher` (+ `ui/deck-switcher/deck-row` para o contador por baralho) e `ui/confirm-dialog`
- [x] 6.6 `pages/no-deck`
- [x] 6.7 Roteiro E2E-05

## Detalhes de implementação

Ver `techspec.md` → “Visão dos componentes”; na base, tabelas “Camada `state/`”, “Camada `pages/`” (rotas e guards) e “Camada `ui/`”.

## Critérios de aceitação relacionados

- CA-09
- CA-10

## Testes da tarefa

### Testes E2E

- [x] E2E-05 — Criar, trocar e excluir baralho pelo seletor — PASSOU nas 4 etapas (baralho padrão no cabeçalho, seletor abre, criar "Constitucional" ativa sem navegar, excluir com confirmação volta a "Meus cartões"). Evidências em `tasks/prd-mvp-offline/evidences/e2e-05-*.png`; console e rede sem erros; menu mobile a 390 px conferido de bônus.

## Arquivos relevantes

- `src/app/state/live-query.ts`, `deck-store.ts`, `due-tick.ts`, `guards.ts`
- `src/app/app.ts`, `app.html`, `app.css`, `app.routes.ts`
- `src/app/ui/mobile-nav/`, `deck-switcher/` (+ `deck-row.ts`), `confirm-dialog/`, `due-badge/`
- `src/app/pages/no-deck/`
- Páginas placeholder criadas nesta tarefa para as rotas ainda não construídas: `pages/home/`, `review/`, `cards/`, `card-new/`, `card-edit/`, `progress/`, `settings/` — cada uma com um único texto indicando a tarefa que a preenche; as tarefas 7.0–9.0 substituem o conteúdo
- `src/app/domain/queue.ts` (adição de `totalQueueCount` + teste)
- Removido `src/app/app.spec.ts` (scaffold padrão do Angular): dependia do template de boas-vindas que a tarefa 1.0 já havia esvaziado, e este projeto valida `pages/`/`ui/`/`state/` por E2E manual, não por `ng test`/TestBed
- Lingo: `DeckContext`, `DeckSwitcher.tsx`, `MobileNav.tsx`, `NoDeck.tsx`
