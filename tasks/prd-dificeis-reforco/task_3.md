# Tarefa 3.0: ui — refatoração da revisão

## Visão geral

Extrai da revisão as peças que o reforço vai compartilhar, sem mudar o comportamento da revisão: a moldura da sessão (`ui/session-shell`: “← Sair”, “n / total”, barra fina, área rolável e rodapé fixo, com slots `[banner]`, conteúdo e `[footer]`), o diálogo de edição (`ui/card-edit-dialog`: `open(card)`, chama `updateCardContent` e emite o `Card` atualizado) e o tratamento de teclas, que passa a usar `reviewKeyAction`. A regressão é verificada pelo E2E-D7 antes de seguir para as telas novas.

<skills>
### Conformidade com skills

- `angular-developer`: content projection com slots nomeados (`ng-content select`), `input()`/`output()`, `<dialog>` nativo com `viewChild`, OnPush.
- `agent-browser`: execução do E2E-D7.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e as rules em `.agents/rules/`. Pontos relevantes:
- `ui/` não importa `pages/`. O `card-edit-dialog` chama `updateCardContent` direto (escrita pontual permitida em `ui/`), sem passar por `state/`.
- Editar texto não reagenda nem gera log (RF5): o diálogo usa o mesmo `updateCardContent` de hoje.
- `.ts` e `.html` ≤ 100 linhas cada; `review.ts`/`review.html` devem diminuir.
- Cores por token e escala tipográfica (`npm run check:type-scale`); `@if`/`@for`.
- Sem teste automatizado de UI: `state/`, `pages/` e `ui/` ficam fora do gate e são validados por E2E.
</rules>

<requirements>
- RF52f (suporte): a sessão de reforço usa a mesma interface, teclas e edição da revisão.
- RF25–RF28, RF30: a revisão continua igual (teclas, contador, barra, edição do cartão atual, fim de sessão).
- RF51f, RF54b (suporte): o diálogo é reaproveitado pela lista Difíceis e pelo resumo do reforço.
</requirements>

## Subtarefas

- [x] 3.1 Criar `ui/session-shell/` com `position`, `progress` e `exit`, e os slots `[banner]`, conteúdo e `[footer]`, reproduzindo o layout atual de `review.html` (altura `100dvh`, `safe-area-inset-bottom`).
- [x] 3.2 Criar `ui/card-edit-dialog/` com `open(card)` e `saved = output<Card>()`, movendo o `<dialog>` + `card-form` e o `saveEdit` de `review.ts`.
- [x] 3.3 Refatorar `pages/review/` para usar `session-shell`, `card-edit-dialog` e `reviewKeyAction` (mantendo o `preventDefault` do Espaço e a guarda “diálogo aberto ignora teclas”).
- [x] 3.4 `npm run lint`, `npm run check:type-scale`, `npm test` e `npm run build` verdes.
- [x] 3.5 Executar o E2E-D7 com evidências em `tasks/prd-dificeis-reforco/evidences/`.

## Detalhes de implementação

Ver [techspec.md](techspec.md):
- “Visão dos componentes”: linhas `session-shell/`, `card-edit-dialog/` e `pages/review/`.
- “Principais interfaces”: comentários `ui/session-shell` e `ui/card-edit-dialog`.
- “Modelos de dados”: `ReviewKeyAction`.
- “Principais decisões”: “Edição em diálogo” e “Extração de `session-shell` e `review-keys`”.
- “Riscos conhecidos”: “Refatoração da revisão”.

## Critérios de aceitação relacionados

- CA-13
- CA-14
- CA-D10
- CA-D16

## Testes da tarefa

### Testes E2E

- [x] E2E-D7 — regressão da revisão depois da refatoração

## Arquivos relevantes

- `src/app/ui/session-shell/session-shell.{ts,html}` (novos)
- `src/app/ui/card-edit-dialog/card-edit-dialog.{ts,html}` (novos)
- `src/app/pages/review/review.{ts,html}`
- `src/app/domain/review-keys.ts` (da tarefa 2.0)
- `src/app/ui/card-form/`, `src/app/ui/card-face/`, `src/app/ui/answer-bar/`, `src/app/state/review-session.ts`, `src/app/domain/cards.ts` — só leitura
