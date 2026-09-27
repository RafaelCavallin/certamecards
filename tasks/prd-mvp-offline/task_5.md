# Tarefa 5.0: Domínio — apoio às telas

## Visão geral

Funções puras e consultas que as telas usam: estatísticas do Progresso, busca de cartões, resumo da Home, indicador de pendentes e classe de tamanho da Frente. Ficam em `domain/` para serem testáveis e contarem na cobertura.

<skills>
### Conformidade com skills

Nenhuma: TypeScript puro em `src/app/domain/`. Consultar o Lingo (`stats.ts`, `homeSummary.ts`, `dueBadge.ts`).
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Lidos o `AGENTS.md` e todas as rules em `.agents/rules/`.

- `stats.ts` importa `iso` de `dates.ts` (no Lingo vinha de um componente — quebra de camada corrigida).
- Textos de usuário em português (“cartões”, não “frases”); código em inglês.
</rules>

<requirements>
- RF19, RF20, RF22, RF23: estado da Home (carregando / onboarding / hoje), rótulo do botão e contagem total de pendentes.
- RF31: busca sem acento e sem caixa em Frente, Verso e Notas.
- RF34: retenção de 30 dias, sequência, total, heatmap, previsão de 14 dias e maturidade.
- Legibilidade: Frente acima de 280 caracteres usa `text-front-long`.
</requirements>

## Subtarefas

- [x] 5.1 `stats.ts` (`computeStats`, previsão, maturidade) — `currentStreak` extraído para `stats-streak.ts` (caber em 100 linhas); maturidade com os três baldes do RF34 (`new`, `learning`, `mature`)
- [x] 5.2 `card-search.ts` (`searchCards`)
- [x] 5.3 `home-summary.ts` (`homeView`, `studyButtonLabel`) e `due-badge.ts`
- [x] 5.4 `type-scale.ts` (`frontSizeClass`)

## Detalhes de implementação

Ver `techspec.md` → “Visão dos componentes” (linha `domain/`); na base, tabela “Camada `domain/`”.

## Critérios de aceitação relacionados

- CA-11
- CA-15
- CA-16
- CA-23

## Testes da tarefa

### Testes de unidade

- [x] TU-09 — `frontSizeClass` acima/abaixo de 280 caracteres
- [x] TU-10 — `searchCards` sem acento e sem caixa nas Notas
- [x] TU-11 — `computeStats` retenção 8/10
- [x] TU-17 — `homeView` / `studyButtonLabel`
- [x] `dueBadgeView` (sem ID na TechSpec, mas é código da subtarefa 5.3 e entra com teste pela regra 1 de `tests.md`)
- [x] `currentStreak` (sem ID próprio; parte do contrato de `computeStats`/RF34)

## Arquivos relevantes

- `src/app/domain/stats.ts`, `stats-streak.ts`, `card-search.ts`, `home-summary.ts`, `due-badge.ts`, `type-scale.ts` (+ `.test.ts` de cada)
- Lingo: `src/services/stats.ts`, `src/components/homeSummary.ts`, `dueBadge.ts`

`pendingIndicator.ts` do Lingo (antipiscada de skeleton) não foi portado nesta tarefa — nenhuma página desta entrega pediu esse comportamento; entra se alguma tarefa de UI (6.0–9.0) precisar.
