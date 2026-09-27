# Tarefa 8.0: Revisão e Home

## Visão geral

A sessão de revisão (Frente → revelar → Errei/Acertei, com teclado e edição em diálogo) e a Home com o número de hoje, a estimativa, o heatmap e o onboarding de baralho vazio.

<skills>
### Conformidade com skills

- `angular-developer` — `review-session` fornecido na rota, atalhos de teclado, `<dialog>`, `aria-live`.
- `agent-browser` — roteiros E2E-02, E2E-04, E2E-06 e fechamento de E2E-01 e E2E-03.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Lidos o `AGENTS.md` e todas as rules em `.agents/rules/`.

- `review-session` não é root: é provido na rota `revisar`.
- `card-face` e `answer-bar` são componentes de `ui/` desde já (reuso no reforço da Fase 2).
- Destaque em negrito na cor de sinal; lacuna revelada com `bg-signal/15`; texto sobre `bg-signal` usa `text-on-signal`.
- Frente usa `frontSizeClass` (`text-front`/`text-front-long`); Verso `text-back`; Notas `text-body`.
</rules>

<requirements>
- RF11–RF13: destaque sempre visível; lacuna `_____` na Frente até revelar; Verso e Notas inteiros ao revelar.
- RF19, RF21–RF23: número de hoje, estimativa, botão “Estudar”, heatmap com atalho para Progresso, onboarding “Criar primeiro cartão”, recontagem sem recarregar.
- RF24: fila de `buildQueue`.
- RF25–RF27: Espaço revela; 1 = Errei; 2 ou Espaço = Acertei; resposta em andamento bloqueia outra.
- RF28, RF29: cabeçalho “← Sair”, “n / total”, barra de progresso; fim de sessão com contagem e “Voltar ao início”.
- RF30: editar o cartão atual em `<dialog>` e voltar a ele com o texto corrigido (`replaceCurrent`).
- Resposta a um cartão em < 150 ms.
</requirements>

## Subtarefas

- [x] 8.1 `ui/marked-text` (três modos: edição, frente oculta, revelado)
- [x] 8.2 `ui/card-face` e `ui/answer-bar`
- [x] 8.3 `state/review-session.ts`
- [x] 8.4 `pages/review` com atalhos e diálogo de edição (reusa `card-form`)
- [x] 8.5 `ui/heatmap` e `pages/home` (hoje, onboarding, skeleton)
- [x] 8.6 Roteiros E2E-02, E2E-04, E2E-06; fechar E2E-01 e E2E-03 na revisão

## Detalhes de implementação

Ver `techspec.md` → “Sequenciamento — etapa 5”; na base, “`state/review-session.ts`” em “Principais interfaces”, tabelas “Camada `state/`”, “Camada `ui/`” e a decisão “Edição durante a revisão em `<dialog>`”.

## Critérios de aceitação relacionados

- CA-04
- CA-05
- CA-06
- CA-11
- CA-12
- CA-13
- CA-14

## Testes da tarefa

A fila e o agendamento já estão cobertos pelos TU-06 a TU-08 e TI-02 (tarefa 4.0); a Home pelo TU-17 (tarefa 5.0).

### Testes E2E

- [x] E2E-01 — Criar cartão com 3 parágrafos nas Notas, ocultar e destacar (conferência na revisão)
- [x] E2E-02 — Sessão de revisão completa por teclado
- [x] E2E-03 — Verso e Notas só oferecem destacar (destaque na revisão)
- [x] E2E-04 — Editar cartão durante a revisão
- [x] E2E-06 — Home recontando sozinha

## Arquivos relevantes

- `src/app/ui/marked-text/`, `card-face/`, `answer-bar/`, `heatmap/`
- `src/app/state/review-session.ts`
- `src/app/pages/review/`, `home/`
- Lingo: `MarkedText.tsx`, `Review.tsx`, `Home.tsx`, `HomeToday`, `HomeOnboarding`, `Heatmap.tsx`
