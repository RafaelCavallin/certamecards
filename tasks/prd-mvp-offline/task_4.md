# Tarefa 4.0: Domínio — agendamento e fila

## Visão geral

Portar o agendador FSRS (ts-fsrs v5, avaliação binária) e a montagem da fila do dia, com a estimativa de minutos.

<skills>
### Conformidade com skills

Nenhuma: TypeScript puro em `src/app/domain/`. Consultar o Lingo (`src/services/scheduler.ts` + testes).
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Lidos o `AGENTS.md` e todas as rules em `.agents/rules/`.

- Só o `scheduler` escreve campos FSRS.
- `answer` grava card e log na mesma transação Dexie.
- Prioridade máxima de teste (`tests.md`, regra 3): agendamento é integridade de dados.
- Tempo controlado nos testes (`now` injetado ou timers falsos), nunca relógio real.
- `queue.ts` separado do `scheduler.ts` para caber em 100 linhas.
</rules>

<requirements>
- RF24: vencidos primeiro por data; novos intercalados, limitados por “novos por dia” e pelo teto de não firmados.
- RF26: “Errei”/“Acertei” reagendam pelo FSRS (retenção alvo do baralho, padrão 0,90) e gravam um log imutável.
- RF16: cartões de baralho excluído não entram na fila.
- RF19: estimativa em minutos a partir de `durationMs` dos logs.
</requirements>

## Subtarefas

- [x] 4.1 `dates.ts`: `iso`, `startOfToday`, `DAY`
- [x] 4.2 `scheduler.ts`: `answer` com ts-fsrs v5, `learningSteps`, cache de instância por `requestRetention`
- [x] 4.3 `queue.ts`: `buildQueue`, `interleave`, `countIntroducedToday`, `queueCount`, `estimateMinutes`

## Detalhes de implementação

Ver `techspec.md` → “Principais interfaces”; na base, “`Card`” (campos FSRS), “`ReviewLog`” e a decisão sobre ts-fsrs v5.

## Critérios de aceitação relacionados

- CA-10
- CA-12
- CA-13

## Testes da tarefa

### Testes de unidade

- [x] TU-06 — `buildQueue` com 30 novos e limite 10
- [x] TU-07 — `buildQueue` respeita teto de não firmados
- [x] TU-08 — `answer` Good/Again grava estado FSRS v5 (`learningSteps`)

### Testes de integração

- [x] TI-02 — `answer` grava card e log na mesma transação
- [x] TI-04 — `deleteDeck` tombstona cartões e some da fila

## Arquivos relevantes

- `src/app/domain/dates.ts`, `scheduler.ts`, `queue.ts` (+ `.test.ts`)
- Lingo: `src/services/scheduler.ts`, `scheduler.test.ts`
