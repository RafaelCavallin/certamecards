# Tarefa 4.0: ui e pages — edição e revisão sem falha silenciosa

## Visão geral

O modal de edição da revisão e a página `/cartoes/:id` passam a usar `loadCardDraftState` e mostram mensagem em `missing` e `failed`. O modal ganha o botão “Fechar” fora do formulário. A `ReviewSession` captura a falha de `answer` num signal `error`, exibido na revisão com `role="alert"`, sem avançar o cartão.

<skills>
### Conformidade com skills

- `angular-developer`: signals, controle de fluxo `@switch`/`@if`, `output()`.
- `agent-browser`: roteiros E2E desta tarefa no QA.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e as rules em `.agents/rules/`. Pontos relevantes:
- `ui/` e `pages/` só chamam `domain/` (`loadCardDraftState`, `saveCardEdit`) e `state/`.
- Erro em `text-miss`; mensagens em português; Esc continua fechando o modal.
- Arquivos ≤ 100 linhas (`card-edit-dialog.ts` está em 53).
</rules>

<requirements>
- RF81a, RF81b, RF81c: estados de leitura explícitos, com “Fechar” e Esc no modal e mensagem de falha na página.
- RF81d: resposta recusada mostra “Não foi possível registrar a resposta.” e não avança.
</requirements>

## Subtarefas

- [x] 4.1 Trocar o signal `draft` do `CardEditDialog` por um estado de leitura e acrescentar mensagens e botão “Fechar”.
- [x] 4.2 Usar `loadCardDraftState` em `src/app/pages/card-edit/card-edit.ts` e mostrar a falha em `card-edit.html`.
- [x] 4.3 Acrescentar `error` à `ReviewSession` e exibi-lo em `src/app/pages/review/review.html`.
- [x] 4.4 Rodar `lint`, `check:type-scale`, `test:coverage` e `build`; verificar no navegador o modal com cartão excluído.

## Detalhes de implementação

Ver [techspec.md](techspec.md): linhas `review-session.ts`, `card-edit-dialog/`, `card-edit/` e `review/review.html` da “Visão dos componentes”, “Relacionamentos e fluxo de dados” (itens 3 e 4) e a tabela “Textos”.

## Critérios de aceitação relacionados

- CA-P04
- CA-P05

## Testes da tarefa

### Testes E2E

- [x] E2E-P05 — Edição de cartão excluído
- [x] E2E-P06 — Resposta a cartão excluído

## Arquivos relevantes

- `src/app/ui/card-edit-dialog/card-edit-dialog.ts`, `card-edit-dialog.html`
- `src/app/pages/card-edit/card-edit.ts`, `card-edit.html`
- `src/app/state/review-session.ts`
- `src/app/pages/review/review.html`
