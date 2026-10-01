# Tarefa 5.0: pages — reforço

## Visão geral

Entrega a sessão de reforço em `/reforco`. `state/reinforce-session.ts` (escopo da página) carrega os difíceis com o filtro da URL, sorteia, guarda o `ReinforceState` e os `Card`, zera `revealed` dentro de `answer` e poda os cartões excluídos por `liveQueryFor(deckId, liveCardIds)`. A página usa `session-shell`, `card-face`, `answer-bar` e `card-edit-dialog`, com a faixa fixa “Reforço — não mexe na sua agenda”, a indicação “de novo” e o contador acertados / total. O resumo (`reinforce-summary`) mostra o placar pela primeira resposta, os errados com edição e os botões de volta. Fecha com a regra `no-restricted-imports` no ESLint, que impede os arquivos do reforço de importar o caminho de escrita.

<skills>
### Conformidade com skills

- `angular-developer`: serviço com escopo de componente (`providers`), `input()` de query param, `HostListener` de teclado, `aria-live`, título de rota.
- `agent-browser`: execução dos E2E-D3, E2E-D4 e E2E-12.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e as rules em `.agents/rules/`. Pontos relevantes:
- Regra de domínio inegociável: o reforço não escreve nada. `reinforce-session.ts` e `pages/reinforce/**` não importam `scheduler`, `db` (exceto tipos), `cards`, `decks`, `tag-bulk` nem `sync*`. A regra de lint torna isso verificável no CI. A edição de texto entra só pelo `ui/card-edit-dialog`.
- `state/` com escopo de página, e não `@Service` raiz: a sessão não é compartilhada entre páginas.
- A faixa usa tokens de cor e texto visível (não só cor); a escala tipográfica vale para “de novo” (`text-label`).
- Cada `.ts`/`.html` ≤ 100 linhas (daí o `reinforce-summary`).
- Nunca usar `eslint-disable` para contornar a nova regra.
</rules>

<requirements>
- RF52e, RF52f, RF52g, RF52h: sessão de até 30, embaralhada, com a interface da revisão, “Errei” voltando no fim com “de novo” e o contador acertados / total.
- RF53a: faixa fixa “Reforço — não mexe na sua agenda”, cabeçalho diferenciado e título “Reforço”.
- RF53b, RF53c: nada é gravado; a fila de hoje, a Home e o indicador não mudam.
- RF53d: “← Sair” sem confirmação, volta a `/dificeis` com o mesmo filtro; recarregar monta uma sessão nova sem erro.
- RF53e: cartão excluído é pulado e sai do total.
- RF54a, RF54b, RF54c, RF54d: placar pela primeira resposta, errados com contagem e “Editar” (volta ao mesmo resumo), “Voltar para Difíceis” e “Voltar ao início”, resumo anunciado.
- RF52c: o filtro sobrevive a ir e voltar do reforço.
</requirements>

## Subtarefas

- [x] 5.1 Criar `state/reinforce-session.ts`: `start(deckId, tagKeys)`, `current`, `again`, `progress`, `revealed`, `summary`, `reveal()`, `answer(rating)` síncrono com `revealed` zerado na mesma chamada, `replaceCard(card)`, poda com `dropMissing` a partir de `liveQueryFor(deckId, liveCardIds)`.
- [x] 5.2 Rota `reforco` em `app.routes.ts` (`requireDeck`, `title: 'Reforço'`, `loadComponent`).
- [x] 5.3 Criar `pages/reinforce/reinforce.{ts,html}`: `etiquetas = input<string>()`, `providers: [ReinforceSession]`, `session-shell` com a faixa no slot `[banner]`, `card-face`, “de novo”, `answer-bar`, teclado por `reviewKeyAction` (ignorando teclas com o diálogo aberto), `card-edit-dialog` → `replaceCard`, estado “Nenhum cartão difícil para reforçar”, “← Sair” → `/dificeis?etiquetas=…`.
- [x] 5.4 Criar `pages/reinforce/reinforce-summary.{ts,html}`: “Acertou de primeira: X de Y”, lista de errados com contagem e “Editar”, “Voltar para Difíceis” (principal) e “Voltar ao início”, `aria-live`.
- [x] 5.5 Acrescentar o bloco `@typescript-eslint/no-restricted-imports` em `eslint.config.js` para `src/app/domain/reinforce.ts`, `src/app/state/reinforce-session.ts` e `src/app/pages/reinforce/**/*.ts`, e confirmar que ele falha com um import proibido de teste (sem deixá-lo no código).
- [x] 5.6 `npm run lint`, `npm run check:type-scale`, `npm test` e `npm run build` verdes; executar E2E-D3, E2E-D4, E2E-12 e o trecho de E2E-D2 que depende do reforço, com evidências.

## Detalhes de implementação

Ver [techspec.md](techspec.md):
- “Principais interfaces”: `state/reinforce-session.ts` e as “Regras dos contratos” (`revealed` zerado dentro de `answer`).
- “Modelos de dados”: `ReinforceState` (variante “Sessão vazia”), `ReinforceSummary`, “Contrato de rota — `?etiquetas=`” e “Regra de lint — reforço sem escrita”.
- “Principais decisões”: “Somente leitura garantido duas vezes” e “`revealed` zerado dentro de `answer`”.

## Critérios de aceitação relacionados

- CA-29
- CA-D6
- CA-D8
- CA-D9
- CA-D10
- CA-D11
- CA-D13
- CA-D14
- CA-D15
- CA-D16

## Testes da tarefa

A regra da sessão foi testada na tarefa 2.0 (TU-D7–TU-D11, TI-11, TI-D5). Aqui a validação é de UI e da trava de lint.

### Testes E2E

- [x] E2E-D3 — sessão de reforço
- [x] E2E-D4 — resumo do reforço
- [x] E2E-12 — Difíceis → Reforçar → conferir agenda inalterada
- [x] E2E-D2 — filtro por etiqueta (trecho “sobrevive a ir e voltar do reforço”)

## Arquivos relevantes

- `src/app/state/reinforce-session.ts` (novo)
- `src/app/pages/reinforce/reinforce.{ts,html}`, `reinforce-summary.{ts,html}` (novos)
- `src/app/app.routes.ts`
- `eslint.config.js`
- `src/app/domain/reinforce.ts`, `review-keys.ts`, `tag-param.ts` (da tarefa 2.0), `difficulty-data.ts` (da tarefa 1.0)
- `src/app/state/live-query.ts` (`liveQueryFor`, da tarefa 4.0)
- `src/app/ui/session-shell/`, `src/app/ui/card-edit-dialog/` (da tarefa 3.0), `src/app/ui/card-face/`, `src/app/ui/answer-bar/` — só leitura
