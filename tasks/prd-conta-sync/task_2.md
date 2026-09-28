# Tarefa 2.0: domain — `supabase.ts` (cliente por import dinâmico)

## Visão geral

Porta `src/services/supabase.ts` do Lingo: um único ponto que cria o `SupabaseClient` a partir de `env.supabaseUrl`/`env.supabasePublishableKey`, carregando `@supabase/supabase-js` por `import()` dinâmico para que quem não usa conta não baixe o SDK (RF41, CA-S1). Toda chamada ao Supabase no domínio passa por este módulo.

<skills>
### Conformidade com skills

`supabase` — uso do SDK `@supabase/supabase-js`, convenções de client-side auth.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Lido o `AGENTS.md` e as rules em `.agents/rules/`. `domain/` nunca importa `@angular/*` nem `rxjs` (regra de dependência do AGENTS.md) — este módulo é TS puro. Sem comentários exceto "porquê" não-óbvio (o próprio import dinâmico já é auto-explicativo pelo nome da função). Segredos fora do código: só `NG_APP_SUPABASE_URL`/`NG_APP_SUPABASE_PUBLISHABLE_KEY` (públicas por design) são lidas de `environments/env.ts`.
</rules>

<requirements>
- RF41: sem `NG_APP_SUPABASE_URL` configurado, o app funciona 100% sem conta, sem baixar o SDK e sem requisição ao Supabase.
- CA-S1: build sem as variáveis → Conta/Ajustes mostram que a sincronização não está disponível, sem erro no console e sem requisição ao Supabase.
</requirements>

## Subtarefas

- [ ] 2.1 Criar `src/app/domain/supabase.ts` com uma função que retorna o cliente memorizado (singleton), criado só na primeira chamada, via `import('@supabase/supabase-js')`.
- [ ] 2.2 Tratar a ausência de `env.supabaseUrl`/`env.supabasePublishableKey`: a função retorna algo que sinalize "indisponível" (ex.: `null`) sem lançar exceção e sem importar o SDK.
- [ ] 2.3 Escrever os testes unitários cobrindo os dois ramos (configurado / não configurado).

## Detalhes de implementação

Ver TechSpec-base, "Camada `domain/`" (linha `supabase.ts`) e "Pontos de integração" ("O SDK é carregado por `import()` dinâmico"). Ver TechSpec da entrega, "Endpoints da API" (`/auth/v1/*` via SDK).

## Critérios de aceitação relacionados

- CA-S1

## Testes da tarefa

### Testes de unidade

- [ ] Cliente não é criado (e SDK não é importado) quando `env.supabaseUrl`/`env.supabasePublishableKey` estão ausentes.
- [ ] Cliente é criado uma única vez e reaproveitado em chamadas subsequentes quando as variáveis estão presentes.

## Arquivos relevantes

- `src/app/domain/supabase.ts` (novo)
- `src/app/domain/supabase.test.ts` (novo)
- `src/environments/env.ts` (leitura, gerado por `scripts/write-env.mjs`)
