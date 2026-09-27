# Tarefa 7.0: Cadastro de cartões

## Visão geral

O formulário de cartão com o campo marcável (textarea + camada de trás com as marcas), a barra de ações de destaque/ocultação e as páginas de novo cartão (cadastro em série) e edição. É o maior risco técnico de UI da entrega: seleção no textarea e alinhamento do overlay.

<skills>
### Conformidade com skills

- `angular-developer` — `model()` para `value` e `marks`, `afterRenderEffect` para autoaltura, eventos de seleção, acessibilidade.
- `agent-browser` — parte de formulário dos roteiros E2E-01 e E2E-03, em largura de celular e de desktop.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Lidos o `AGENTS.md` e todas as rules em `.agents/rules/`.

- Lacuna só na Frente: `allowCloze` é `true` apenas no campo Frente.
- Editar texto nunca reagenda nem gera log (usa `updateCardContent`).
- Limites de `card-limits.ts` no `maxlength` e na validação do formulário.
- `.ts` e `.html` de cada componente ≤ 100 linhas cada; dividir em subcomponentes.
- Textos de leitura em `text-body`/`text-front`; nada abaixo da escala.
</rules>

<requirements>
- RF1–RF3: Frente, Verso e Notas com parágrafos; Notas com no mínimo 6 linhas e autoaltura, sem rolagem interna.
- RF4: criar mantém a tela, limpa os campos e devolve o foco à Frente; editar volta à tela anterior (`Location.back()`).
- RF5: editar não altera o agendamento.
- RF6: Frente oferece “Destacar seleção” e “Ocultar seleção”; Verso e Notas, só “Destacar seleção”.
- RF7: cursor dentro de marca → “Tirar destaque” / “Mostrar de novo”.
- RF8, RF9: seleção aparada; marcas acompanham a edição.
- RF10: sem seleção, linha de dica/resumo sem mudar a altura do formulário.
- Contador perto do limite de caracteres.
</requirements>

## Subtarefas

- [x] 7.1 `ui/mark-backdrop` (constante `BOX` compartilhada com o textarea)
- [x] 7.2 `ui/mark-actions` (`mousedown.preventDefault` para manter a seleção)
- [x] 7.3 `ui/markable-field` (`document:selectionchange` filtrado + `select`/`keyup`/`pointerup`; autoaltura após `document.fonts.ready`)
- [x] 7.4 `ui/card-form`
- [x] 7.5 `pages/card-new` e `pages/card-edit`
- [x] 7.6 Validar seleção cedo no Chrome Android e no Safari iOS (emulação do `agent-browser`) antes de seguir
- [x] 7.7 Parte de formulário dos roteiros E2E-01 e E2E-03; teste de autoaltura com 20.000 caracteres nas Notas

## Detalhes de implementação

Ver `techspec.md` → “Sequenciamento — etapa 4”; na base, tabela “Camada `ui/`” e “Riscos conhecidos” (seleção no textarea, overlay, autoaltura).

## Critérios de aceitação relacionados

- CA-01
- CA-02
- CA-03
- CA-06
- CA-07
- CA-08

## Testes da tarefa

A lógica de marcas já está coberta pelos TU-01 a TU-05 (tarefa 3.0) e a gravação pelo TI-01 (tarefa 2.0).

### Testes E2E

- [x] E2E-01 — Criar cartão com 3 parágrafos nas Notas, ocultar e destacar (formulário; a conferência na revisão fecha na tarefa 8.0)
- [x] E2E-03 — Verso e Notas só oferecem destacar (formulário; a conferência na revisão fecha na tarefa 8.0)

## Arquivos relevantes

- `src/app/ui/mark-backdrop/`, `mark-actions/`, `markable-field/`, `card-form/`
- `src/app/pages/card-new/`, `card-edit/`
- Lingo: `MarkableField.tsx`, `MarkBackdrop.tsx`, `MarkActions.tsx`, `CardForm.tsx`, `AddCard.tsx`, `EditCard.tsx`
