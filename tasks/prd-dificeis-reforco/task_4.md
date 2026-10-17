# Tarefa 4.0: pages — tela Difíceis

## Visão geral

Entrega a tela `/dificeis` e as entradas para ela. Inclui a infraestrutura que ela exige: `liveQueryFor` em `state/live-query.ts` (consulta viva que reage à troca de baralho), `withComponentInputBinding()` no router (para ler `?etiquetas=` como `input()`), a lista única de navegação `nav-items.ts` com “Difíceis” entre “Cartões” e “Progresso”, e o atalho “N cartões difíceis · Reforçar” na Home. A tela mostra o critério, a contagem, o filtro OU por etiqueta guardado na URL, a lista com legenda e chips, o estado vazio, a edição em diálogo e o botão “Reforçar N”, que leva a `/reforco` (a rota nasce na tarefa 5.0).

<skills>
### Conformidade com skills

- `angular-developer`: `withComponentInputBinding` e `input()` para query params, `toObservable`/`toSignal` + `switchMap` em `liveQueryFor`, `router.navigate` com `replaceUrl`, OnPush, `aria-live`.
- `agent-browser`: execução dos E2E-D1 e E2E-D2.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e as rules em `.agents/rules/`. Pontos relevantes:
- `liveQuery()` continua chamado só em `state/live-query.ts`; RxJS só nessa borda. Atualizar no AGENTS.md a linha que cita `liveQuerySignal` como único ponto (passa a citar o arquivo) e registrar `withComponentInputBinding()` em “Convenções de Angular”.
- `pages/` não abre o Dexie: leitura por `liveQueryFor(deckId, listDifficult)` / `countDifficult`; escrita só pelo `card-edit-dialog`.
- `home.ts` está com 98 linhas: o atalho entra como subcomponente (`home/difficult-shortcut`), e `home.ts` só ganha o import.
- Cada `.ts`/`.html` ≤ 100 linhas (daí o `difficult-row`).
- Cores por token; o atalho e o item do menu não usam a cor de sinal; áreas de toque ≥ 44 px; escala tipográfica.
</rules>

<requirements>
- RF51d, RF51e, RF51f, RF51g, RF51h: lista com legenda e chips, critério sempre visível, edição sem sair da tela, atualização sem recarregar, estado vazio sem “Reforçar”.
- RF51i: “Difíceis” no menu lateral e no ☰.
- RF51j: atalho na Home quando há ao menos um difícil, nos estados `today` e `filtered-empty`.
- RF52a, RF52b, RF52c, RF52d: filtro OU com contagens, chips removíveis e “Limpar”, “Reforçar N” refletindo o filtro, filtro na URL (menu limpa, troca de baralho limpa, independente do “Estudar só…”), mensagem quando o filtro zera a lista.
</requirements>

## Subtarefas

- [x] 4.1 Acrescentar `liveQueryFor(source, querier)` em `state/live-query.ts`.
- [x] 4.2 `app.config.ts`: `provideRouter(routes, withComponentInputBinding())`. Conferir que nenhuma rota existente tem `input()` homônimo de parâmetro.
- [x] 4.3 Extrair `ui/mobile-nav/nav-items.ts` (`NAV_ITEMS` com “Difíceis”) e usá-lo em `app.ts` e `mobile-nav.ts`.
- [x] 4.4 Rota `dificeis` em `app.routes.ts` (`requireDeck`, `title: 'Difíceis'`, `loadComponent`).
- [x] 4.5 Criar `pages/difficult/difficult.{ts,html}`: `etiquetas = input<string>()`, `parseTagParam`, `difficultTagOptions` + `filterDifficultByTags`, `ui/tag-filter`, navegação com `replaceUrl`, limpeza do parâmetro na troca de baralho, critério (`text-meta`), contagem com `aria-live`, estado vazio, mensagem de filtro vazio, “Reforçar N” → `/reforco?etiquetas=…`.
- [x] 4.6 Criar `pages/difficult/difficult-row.{ts,html}`: começo da Frente com lacunas ocultas, `difficultyCaption`, `ui/tag-chips`; tocar abre o `card-edit-dialog`.
- [x] 4.7 Criar `pages/home/difficult-shortcut.{ts,html}` com `liveQueryFor(deckId, countDifficult)` e incluir nos estados `today` e `filtered-empty` de `home.html`.
- [x] 4.8 Atualizar o AGENTS.md (linha do `liveQuery` e nota sobre `withComponentInputBinding`).
- [x] 4.9 `npm run lint`, `npm run check:type-scale`, `npm test` e `npm run build` verdes; executar E2E-D1 e E2E-D2 com evidências.

## Detalhes de implementação

Ver [techspec.md](techspec.md):
- “Visão dos componentes” e “Relacionamentos e fluxo de dados”: linhas de `/dificeis`, `home ─ difficult-shortcut`.
- “Principais interfaces”: `state/live-query.ts (acréscimo)`.
- “Modelos de dados”: “Contrato de rota — `?etiquetas=`” e as regras de navegação.
- “Principais decisões”: “Filtro na query string”, “`withComponentInputBinding()`”, “`liveQueryFor` em `live-query.ts`”, “Atalho da Home como subcomponente”.
- “Riscos conhecidos”: “Janela de 30 dias com a tela aberta”, “Recalcular a cada escrita”, “`withComponentInputBinding()` global”.

## Critérios de aceitação relacionados

- CA-28
- CA-D2
- CA-D3
- CA-D4
- CA-D5
- CA-D6
- CA-D7
- CA-D19
- CA-D20

## Testes da tarefa

A regra desta tela foi testada na tarefa 1.0 (TU-21, TU-D1–TU-D5, TI-D1–TI-D3) e o parâmetro de URL na tarefa 2.0 (TU-D6). Aqui a validação é de UI.

### Testes E2E

- [x] E2E-D1 — tela Difíceis: ordem, legenda, vazio, edição e atualização viva
- [x] E2E-D2 — filtro por etiqueta (a parte “sobrevive a ir e voltar do reforço” é reexecutada na tarefa 5.0, quando `/reforco` existir)

## Arquivos relevantes

- `src/app/state/live-query.ts`
- `src/app/app.config.ts`, `src/app/app.routes.ts`, `src/app/app.ts`
- `src/app/ui/mobile-nav/nav-items.ts` (novo), `src/app/ui/mobile-nav/mobile-nav.ts`
- `src/app/pages/difficult/difficult.{ts,html}`, `difficult-row.{ts,html}` (novos)
- `src/app/pages/home/difficult-shortcut.{ts,html}` (novos), `src/app/pages/home/home.{ts,html}`
- `src/app/ui/card-edit-dialog/` (da tarefa 3.0), `src/app/ui/tag-filter/`, `src/app/ui/tag-chips/`, `src/app/ui/marked-text/` — só leitura
- `src/app/domain/difficulty.ts`, `difficulty-data.ts`, `days-ago.ts` (da tarefa 1.0), `tag-param.ts` (da tarefa 2.0)
- `AGENTS.md`
