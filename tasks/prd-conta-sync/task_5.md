# Tarefa 5.0: domain — `auth.ts`

## Visão geral

Porta `src/services/auth.ts` do Lingo: decide o que fazer com os dados locais ao entrar numa conta (`decideOnSignIn`: resume/auto-adopt/prompt/switch) e executa a decisão (`completeSignIn`: juntar/descartar/cancelar, com wipe total e zeragem de cursores na troca de conta). Depende da Tarefa 2.0 (`supabase.ts`) para a sessão e das tabelas Dexie já existentes do MVP offline.

<skills>
### Conformidade com skills

`supabase` — Auth (cadastro, login, sessão, `auth.uid()`), `HEAD` de contagem para a decisão de login.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Lido o `AGENTS.md` e as rules em `.agents/rules/`. `domain/` é TS puro. Nunca aninhar mais de 3 if/else — `decideOnSignIn` é o exemplo canônico de guardas + caminho feliz reto em `code-standards.md`, item 4. Dados da conta A nunca aparecem na conta B (CA-20): a troca de conta precisa de wipe total, não de merge parcial.
</rules>

<requirements>
- RF39: dados dos dois lados (local e remoto) → juntar / descartar / cancelar; "cancelar" não altera nada local.
- RF40: dados da conta A nunca aparecem na conta B.
- CA-19, CA-20.
</requirements>

## Subtarefas

- [ ] 5.1 Criar `src/app/domain/auth.ts` com `decideOnSignIn(local, remote)`: guardas para os quatro casos (sem dado nenhum → resume; só remoto → auto-adopt/pull; só local → auto-adopt/push; os dois → prompt).
- [ ] 5.2 Implementar `completeSignIn(plan)`: `discard` (descarta local, baixa remoto), `merge` (mantém os dois, LWW resolve conflitos por id), `cancel` (não toca no Dexie).
- [ ] 5.3 Implementar a troca de conta: ao detectar `user_id` remoto diferente do último vinculado (`syncState.boundUserId`), fazer wipe total do Dexie local antes de aplicar o pull e zerar todos os cursores.
- [ ] 5.4 Escrever TU-16 e TI-08.

## Detalhes de implementação

Ver TechSpec-base, "Camada `domain/`" (`auth.ts`: "adoção, troca de conta, `decideOnSignIn`, `completeSignIn`"). Ver TechSpec da entrega, "Principais interfaces" (`auth-store` com `pendingDecision`, `resolveDecision(plan)`) e "Experiência do usuário" (fluxo "Segundo aparelho").

## Critérios de aceitação relacionados

- CA-19
- CA-20

## Testes da tarefa

### Testes de unidade

- [ ] TU-16 — `decideOnSignIn` — matriz resume/auto-adopt/prompt/switch

### Testes de integração

- [ ] TI-08 — `completeSignIn` discard/merge/cancel e troca de conta

## Arquivos relevantes

- `src/app/domain/auth.ts` (novo)
- `src/app/domain/auth.test.ts` (novo)
