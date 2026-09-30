# Tarefa 7.0: “Estudar só…” — `study-tags`, `tag-filter-store`, Home e sessão

## Visão geral

Entrega o filtro da fila de hoje:
- **Lógica pura** (`domain/study-tags.ts`): parse, reconciliação e renomeação do mapa por baralho.
- **Store** (`state/tag-filter-store.ts`): guarda o filtro no `localStorage` (`certamecards.studyTags`), com try/catch.
- **Home**: “Estudar só…” num `<dialog>` que reusa o `tag-filter`, a faixa “Só: …” com “Limpar”, o número e a estimativa filtrados, e o estado vazio filtrado. O subcomponente fica em `pages/home/study-filter.{ts,html}`.
- **Sessão**: `review-session` monta a fila com o filtro.

<skills>
### Conformidade com skills

- `angular-developer`: `@Service` com signals, `<dialog>` nativo como no `deck-switcher`, `aria-live`.
- `agent-browser`: E2E-E3.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e as rules em `.agents/rules/`. Pontos relevantes:
- `state/` existe porque o filtro é compartilhado por Home e revisão.
- A lógica testável fica em `domain/study-tags.ts` (sem Angular) e o store só lê e grava o `localStorage` com try/catch, como o `deck-store`.
- Parse com `unknown` + narrowing, sem `any`.
- ≤ 100 linhas por arquivo.
- O indicador do cabeçalho (`DeckStore.totalDue`) não é tocado (RF49e).
- Cor de sinal para o filtro ligado, `text-on-signal` sobre `bg-signal`.
</rules>

<requirements>
- RF49, RF49a: “Estudar só…” com as etiquetas do baralho e a contagem de hoje; OU entre as escolhidas.
- RF49b: o número, a estimativa e a sessão refletem o filtro.
- RF49c: o filtro fica sempre visível, com “Limpar” de um toque (≥ 44 px).
- RF49d: por baralho, até limpar, sobrevive a recarregar; não sincroniza; com o armazenamento bloqueado, vale até fechar a página.
- RF49e: o cabeçalho e o seletor mostram o total.
- RF49f: estado vazio filtrado com o total sem filtro e “Limpar filtro”, sem sessão vazia.
- RF49g: uma etiqueta que deixa de existir no baralho sai do filtro; se era a única, o filtro é desligado.
</requirements>

## Subtarefas

- [ ] 7.1 Criar `domain/study-tags.ts`: `parseStudyTags`, `reconcileStudyTags`, `renameStudyTag` e `removeStudyTag`, com teste (TU-E7).
- [ ] 7.2 Criar `state/tag-filter-store.ts` (`@Service`): `keysFor`, `set`, `clear`, `reconcile`, `applyRename` e `applyDelete`, gravando só as chaves de baralhos vivos.
- [ ] 7.3 `review-session.ts`: `buildQueue(deck, { tagKeys: store.keysFor(deck.id) })`.
- [ ] 7.4 Criar `pages/home/study-filter.{ts,html}` (`<dialog>` com `tag-filter`, opções de `listDeckTags` + `tagQueueCounts`) e a faixa “Só: …” + “Limpar”.
- [ ] 7.5 `home.ts`/`home.html`: fila filtrada e fila sem filtro para `unfilteredSize`; `reconcile` com as etiquetas do baralho; os estados `today.filter` e `filtered-empty` de `homeView`; contagem anunciada por `aria-live`.
- [ ] 7.6 Rodar `npm run lint`, `npm run check:type-scale`, `npm run test:coverage` e `npm run build`. Executar o E2E-E3 e salvar as capturas em `evidences/`.

## Detalhes de implementação

Ver [techspec.md](techspec.md):
- “Principais interfaces”: blocos `domain/study-tags.ts` e `state/tag-filter-store.ts`.
- “Modelos de dados”: `StudyTagsByDeck` (com a degradação) e `HomeView`.
- “Principais decisões”: o filtro guarda chaves, não nomes.
- “Relacionamentos e fluxo de dados”.

## Critérios de aceitação relacionados

- CA-26
- CA-E7
- CA-E9
- CA-E10
- CA-E11
- CA-E12

## Testes da tarefa

### Testes de unidade

- [ ] TU-E7 — `parseStudyTags`, `reconcileStudyTags`, `renameStudyTag`, `removeStudyTag`

### Testes E2E

- [ ] E2E-E3 — “Estudar só…” na Home

## Arquivos relevantes

- `src/app/domain/study-tags.ts` + `.test.ts` (novos)
- `src/app/state/tag-filter-store.ts` (novo)
- `src/app/state/review-session.ts`
- `src/app/pages/home/home.ts`, `home.html`
- `src/app/pages/home/study-filter.ts`, `study-filter.html` (novos)
- `src/app/ui/tag-filter/*` (da tarefa 6.0)
- `src/app/state/deck-store.ts` (referência do padrão de `localStorage`)
