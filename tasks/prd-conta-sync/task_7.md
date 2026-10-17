# Tarefa 7.0: pages — `account` (rota `conta`)

## Visão geral

Porta `Account.tsx` do Lingo para `src/app/pages/account/`: cadastro por email/senha, login, aviso de confirmação por email, e a tela de decisão quando há dados dos dois lados (juntar / descartar / cancelar). Depende da Tarefa 6.0 (`auth-store`).

<skills>
### Conformidade com skills

`angular-developer` — componente standalone, `OnPush`, `input()`/`model()`, controle de fluxo `@if`/`@switch`.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Lido o `AGENTS.md` e as rules em `.agents/rules/`. `pages/` nunca abre o Dexie nem chama o Supabase diretamente — toda escrita/leitura passa por `auth-store`. Arquivo `.ts` e `.html` ≤ 100 linhas cada (contam separado). Tipografia pela escala semântica (`text-label`/`text-meta`/`text-body`), nunca `text-xs` nem hex — `npm run check:type-scale` precisa passar. Texto sobre `bg-signal` usa `text-on-signal`.
</rules>

<requirements>
- RF39: decisão de login com três opções, "cancelar" não altera nada local.
- CA-19: opções corretas (juntar/descartar/cancelar); cancelar não altera nada local.
- CA-20: troca de conta nunca mistura dados.
- Experiência do usuário da entrega, fluxos "Primeira conta" e "Segundo aparelho".
</requirements>

## Subtarefas

- [x] 7.1 Criar a rota `conta` (`loadComponent` ou direta, conforme padrão das demais rotas) com formulário de entrar/cadastrar (email + senha), usando `auth-store.signIn`/`signUp`.
- [x] 7.2 Exibir aviso de confirmação por email após cadastro (Inbucket no local).
- [x] 7.3 Exibir a tela de decisão quando `auth-store.pendingDecision` estiver presente, com as três opções e chamando `resolveDecision(plan)`.
- [x] 7.4 Tratar erro de rede/servidor como texto curto na tela, nunca bloqueando a navegação.

## Detalhes de implementação

Ver TechSpec-base, "Camada `pages/`" (rota `conta` → `Account.tsx`) e "Pontos de integração" (mensagens de erro curtas, nunca bloqueio). Ver TechSpec da entrega, "Experiência do usuário".

## Critérios de aceitação relacionados

- CA-19
- CA-20

## Testes da tarefa

`pages/` fora do gate de cobertura — validada pelo roteiro E2E da Tarefa 9.0 (E2E-09).

### Testes E2E (validados na Tarefa 9.0)

- [x] E2E-09 — Login com dados dos dois lados

## Arquivos relevantes

- `src/app/pages/account/account.ts` (novo)
- `src/app/pages/account/account.html` (novo)
- `src/app/app.routes.ts` (rota `conta`)
