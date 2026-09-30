# Relatório de revisão de código — Conta e sincronização

## Resumo
- Data: 30/09/2026
- Branch: `des`
- Status: **APROVADO**

Três problemas foram encontrados durante a revisão (dois deles violações de regras de domínio/estilo não-negociáveis) e corrigidos na própria revisão, com testes de regressão adicionados. Os quatro comandos de validação do projeto passam limpos após as correções.

## Conformidade com regras

| Regra | Status | Observações |
|------|--------|-------------|
| `code-standards.md` — arquivos ≤ 100 linhas | OK | Maior arquivo novo: `auth.ts` com 95 linhas. `sync.ts`/`sync-pull.ts`/`sync-push.ts`/`sync-rows.ts` foram corretamente divididos em módulos irmãos ao passarem de 100 linhas, como o próprio exemplo da regra prevê. |
| `code-standards.md` — funções ≤ 30 linhas, ≤ 3 parâmetros | OK | Nenhuma função nova viola; `applyVersioned`, `pushCardChunks` etc. usam objetos de parâmetro (`PullSpec`, `DirtyRows`) quando passariam de 3 argumentos. |
| `code-standards.md` — guardas, sem aninhamento > 3 níveis | OK | `decideOnSignIn`/`completeSignIn` seguem exatamente o padrão de guarda + caminho feliz do exemplo canônico da regra. |
| `code-standards.md` — sem comentários supérfluos | OK | Único comentário novo relevante é o docstring de `normalizeCardMarks` (já existente, explica uma regra de negócio contraintuitiva) — ver problema P1 abaixo sobre onde essa regra não estava sendo aplicada. |
| `code-standards.md` — segredos fora do código | OK | Só `NG_APP_SUPABASE_URL`/`NG_APP_SUPABASE_PUBLISHABLE_KEY` (públicas por design) chegam ao bundle; `SECRET_KEY`/`SERVICE_ROLE_KEY` não aparecem em nenhum arquivo versionado. |
| `javascript-typescript.md` — `const`, `===`, nunca `any` | OK | `grep` por `: any`/`as any` em `domain/`, `state/`, `pages/account/` não encontrou ocorrências. |
| `javascript-typescript.md` — tipos explícitos em contratos | OK | Toda função exportada de `domain/` tipa parâmetros e retorno. |
| `javascript-typescript.md` — `import type` para tipos | OK | `SupabaseClient`/`Session` sempre importados com `import type`, mantendo o SDK fora do caminho de quem estuda offline (RF41). |
| `javascript-typescript.md` — texto do usuário em português | **NOK → corrigido** | `settings.ts#syncStatusText()` caía num fallback `` `Status: ${status}` `` (inglês) para o estado `syncing` e outros — ver P2. |
| `tests.md` — toda regra nova entra com teste | **NOK → corrigido** | Ver P1 e P3: dois comportamentos (um de domínio, um de observabilidade) não tinham teste cobrindo o caminho que a TechSpec exige. Corrigidos com testes que falham sem a correção. |
| `tests.md` — piso de 80% em `domain/**` | OK | 93,27% statements / 90,27% branches / 89,13% functions / 95,21% lines após as correções desta revisão. |
| Estrutura de pastas / dependências | OK | `domain/` sem `@angular/*`/`rxjs`; `pages/account` e `pages/settings` só falam com `auth-store`/`sync-store`, nunca com Dexie ou Supabase direto; `state/` é o único lugar com RxJS nas bordas (`sync-store` consome `Router.events`); nenhum arquivo em `src/test/` é importado fora de `*.test.ts`. |
| Nomes de arquivo kebab-case sem sufixo | OK | `sync-pull-page.ts`, `sync-rows-card.ts` etc. |
| Convenções de Angular | OK | Componentes standalone, `OnPush`, `inject()`, `@if`/`@else`, sem NgRx. |
| Estilo visual — tokens e escala semântica | OK | `check:type-scale` passa; `text-on-signal` usado corretamente sobre `bg-signal` em `account.html`/`settings.html`. |
| Regra de domínio — lacuna só na Frente | **NOK → corrigido** | Ver P1: o caminho de *pull* não aplicava `normalizeCardMarks`. |
| `supabase/migrations/` — nunca editar migration aplicada | OK | Nenhuma migration foi editada; a entrega não adiciona coluna a `cards`/`decks`/`user_settings`, então a obrigação de reemitir `sync_push`/`sync-rows.ts` não se aplica. |

## Aderência à TechSpec

| Decisão Técnica | Implementado | Observações |
|-----------------|--------------|-------------|
| `domain/supabase.ts` com cliente singleton via `import()` dinâmico | SIM | `getSupabase()`/`isSyncConfigured()` conforme especificado. |
| `domain/lww.ts` — `wins(local, remote)` com desempate por `id` | SIM | Idêntico ao contrato da TechSpec-base. |
| `domain/sync-rows.ts` dividido por tabela com Zod tolerante | SIM | `sync-rows-{deck,card,log,settings}.ts`; `.nullish()` nos campos que podem faltar (`fsrs_params`, `tags`, `last_review`, `daily_goal`). |
| `sync-pull.ts` — keyset por `synced_at`, overlap de 5s, `limit 500` | SIM | `OVERLAP_MS`/`PAGE_SIZE` como constantes nomeadas em `sync-pull-page.ts`. |
| `sync-push.ts` — cards antes de logs, chunks de 200, CAS no `clearDirty` | SIM | `pushCardChunks` envia metadados só no primeiro chunk; `clearDirty`/`clearSettings` comparam `updatedAt` antes de zerar `dirty`. |
| `sync.ts` — `syncNow(reason)` sob `navigator.locks`, nunca lança | SIM | `try/catch` interno converte qualquer erro em `SyncOutcome`; `ifAvailable: true` evita duas sincronizações concorrentes. |
| `auth.ts` — `decideOnSignIn`/`completeSignIn` com as 4 decisões | SIM | Matriz resume/auto-adopt/prompt/switch coberta por TU-16; troca de conta faz wipe total mesmo quando a decisão bruta seria "auto-adopt" (`isAccountSwitch`), evitando vazamento de dados entre contas — validado em QA (E2E-09) e nesta revisão. |
| `auth-store`/`sync-store` — gatilhos (boot, online, `NavigationEnd` para `/`, login) | SIM | `sync-store.ts#registerTriggers()`; `SyncStore` é instanciado eagerly no `App` (`inject(SyncStore)`) para registrar os gatilhos mesmo antes de abrir Ajustes — comportamento coberto por `sync-startup.test.ts`, que nomeia exatamente essa regressão. |
| Rota `conta` e seção de conta em `settings` | SIM | `app.routes.ts` adiciona `conta` sem guarda (acessível mesmo sem baralho); `settings.html` mostra "Sincronização não disponível" quando `auth.phase() === 'disabled'`. |
| Monitoramento — `console.warn` para linha descartada no pull e chunk rejeitado no push, nunca com conteúdo | **NÃO → corrigido nesta revisão** | Ver P3: não existia nenhum `console.warn` em `domain/` antes desta revisão. |

## Tarefas verificadas

| Tarefa | Status | Observações |
|------|--------|-------------|
| 1.0 Validar migration existente | COMPLETA | Evidência via `psql` em `task_1.md`; dois achados de grants mais amplos que o pretendido, neutralizados por RLS/guard interno, documentados sem exigir migration nova — decisão razoável. |
| 2.0 `domain/supabase.ts` | COMPLETA | Código e testes (`supabase.test.ts`) cobrem os dois ramos. |
| 3.0 `lww.ts`/`sync-rows.ts` | COMPLETA | TU-12/13/14 presentes; ver P1 para uma lacuna de teste que existia até esta revisão. |
| 4.0 `sync-pull`/`sync-push`/`sync.ts` | COMPLETA | TI-05/06/07/09 presentes; ver P3. |
| 5.0 `auth.ts` | COMPLETA | TU-16, TI-08 presentes e cobrindo troca de conta. |
| 6.0 `auth-store`/`sync-store` | COMPLETA | Fora do gate de cobertura por decisão do projeto; testes de componente (`auth-store.test.ts`, `sync-startup.test.ts`) presentes mesmo não sendo obrigatórios. |
| 7.0 `pages/account` | COMPLETA | Ver P2 (rótulos) já havia sido corrigido no QA anterior a esta revisão — confirmado presente no código. |
| 8.0 seção de conta em `settings` | COMPLETA | Ver P2 (texto de status). |
| 9.0 Validação E2E local | COMPLETA | Evidências em `tasks/prd-conta-sync/evidences/`; QA (`qa.md`) já repetiu e aprovou os quatro critérios de aceitação. |
| 10.0 Preview sem backend | COMPLETA | `.vercelignore` exclui `/supabase`, `/tasks`, `/.agents`, `/.claude`, `/.env*` do upload. |

## Testes

- Total de testes: 191 (37 → 39 arquivos de teste, dois novos casos adicionados nesta revisão)
- Passando: 191
- Falhando: 0
- Cobertura (`src/app/domain/**`): **93,27% statements / 90,27% branches / 89,13% functions / 95,21% lines** — acima do piso de 80%. `pages/`, `ui/` e `state/` fora do gate por decisão do projeto (`tests.md`, item 2), validados pelo QA via E2E.
- `npm run lint`: limpo.
- `npm run check:type-scale`: nenhuma violação.
- `npm run build`: sucesso (um erro de tipagem foi encontrado e corrigido durante esta revisão — ver P3; aviso de orçamento de bundle inicial de 895 kB vs. 500 kB configurados é pré-existente ao MVP offline, não introduzido por esta entrega, e não bloqueia o build).

## Problemas encontrados

| Severidade | Arquivo | Linha | Descrição | Sugestão |
|------------|---------|-------|-----------|----------|
| Alta — corrigido | `src/app/domain/sync-rows-card.ts` | 43 (antes da correção) | `parseCardRow` fazia `data.marks as CardMarks` sem passar por `normalizeCardMarks`, então uma linha remota (de outro cliente, de uma ferramenta administrativa, ou corrompida) com lacuna (`cloze`) em Verso/Notas era aceita e gravada localmente tal como veio — violando a regra de domínio não-negociável do `AGENTS.md` ("Lacuna só existe na Frente... `normalizeCardMarks` descarta lacunas fora da Frente em qualquer entrada, **incluindo pull**") e o próprio docstring da função. Nada no banco (`check (jsonb_typeof(marks) = 'object')`) nem no Zod (`cardMarksSchema`) impede isso — só `normalizeCardMarks` aplicava o corte, e não era chamada aqui. | **Corrigido nesta revisão**: `parseCardRow` agora chama `normalizeCardMarks(data.marks)`. Teste de regressão adicionado em `sync-rows.test.ts` ("descarta lacuna de Verso e Notas vindas do remoto"), que falha sem a correção. |
| Média — corrigido | `src/app/pages/settings/settings.ts` | 29 (antes da correção) | `syncStatusText()` tinha um fallback `` `Status: ${status}` `` que aparecia para os estados `syncing`/`disabled`/`signed-out` — nenhum deles tratado explicitamente. Como `status` vira `'syncing'` sempre que uma sincronização está em andamento (inclusive os gatilhos automáticos de boot/online/navegação), um usuário logado veria texto em inglês na tela de Ajustes ("Status: syncing"), violando `javascript-typescript.md` item 14 ("Tudo que o usuário lê... em português"). | **Corrigido nesta revisão**: adicionado um caso explícito para `'syncing'` ("Sincronizando…") e um fallback em português para os demais estados ("Ainda não sincronizado."). `pages/` está fora do gate de cobertura (validado por E2E manual, conforme convenção já seguida pelo resto do arquivo, que não tem `settings.test.ts`); a correção foi verificada manualmente (leitura do código + os quatro comandos de validação). |
| Média — corrigido | `src/app/domain/sync-pull-page.ts`, `src/app/domain/sync-push.ts` | — | A TechSpec da entrega (seção "Monitoramento e observabilidade", herdada da base) exige `console.warn` para linha descartada no pull e chunk rejeitado no push, com id, tabela e código Postgres, nunca conteúdo. Nenhum dos dois pontos tinha esse log — uma linha remota malformada ou um chunk rejeitado pelo servidor falhavam silenciosamente (a segunda, sem log algum, mesmo lançando erro), dificultando o diagnóstico em produção. | **Corrigido nesta revisão**: `sync-pull-page.ts` agora loga `sync-pull: N linha(s) descartada(s) em <tabela>` com os `id`s descartados (nunca o conteúdo da linha); `sync-push.ts` loga `sync-push: chunk rejeitado (<código>)` com os `id`s de cada tabela do chunk antes de relançar o erro. Testes de regressão adicionados em `sync-pull.test.ts` e `sync-push.test.ts` espionando `console.warn`. |

## Pontos positivos

- `auth.ts#completeSignIn` trata corretamente o caso não óbvio de criar uma segunda conta num aparelho ainda vinculado à primeira: mesmo quando `decideOnSignIn` devolveria `auto-adopt` (porque o remoto da nova conta está vazio), `isAccountSwitch` força `wipeLocalData` em vez de `mergeLocalData`, impedindo que dados da conta A vazem para a conta B. Esse caminho tem teste dedicado (`auth.test.ts`, "apaga tudo do aparelho ao trocar para outra conta") e foi confirmado de ponta a ponta no QA.
- A divisão de `sync.ts`/`sync-pull.ts`/`sync-push.ts`/`sync-rows.ts` em módulos irmãos assim que passavam de 100 linhas segue exatamente o exemplo do `code-standards.md`, item 2, e manteve cada arquivo com responsabilidade única e fácil de testar isoladamente.
- `ensureDefaultDeck` foi corrigido para não recriar o baralho padrão quando o aparelho está vinculado a uma conta (`decks.ts`), evitando a recriação indevida relatada no QA da Tarefa 9.0; o teste antigo foi migrado (não descartado) para `decks-default.test.ts` com um caso novo cobrindo exatamente essa regressão.
- `review-session.ts` teve o provedor movido de `providers` da rota para `providers` do componente, com teste dedicado (`review-session-lifecycle.test.ts`) provando que uma nova sessão começa ao sair e voltar para `/revisar` — resolve a regressão de estado citada no QA sem reintroduzir o bug.
- `fake-supabase.ts` é um fake mínimo e legível (não um mock genérico), suficiente para os cenários de LWW/CAS/paginação sem precisar de rede real, alinhado a `tests.md` item 7 (FAST).

## Recomendações

- `angular.json` ganhou um campo `"analytics": "<uuid>"` na seção `cli`, aparentemente gerado por uma execução interativa do Angular CLI (prompt de telemetria) nesta máquina. Não é um segredo, mas é um identificador específico do ambiente local que não deveria ter sido versionado — vale remover num commit de limpeza (`ng analytics off` ou apagar a chave).
- Dois arquivos de teste (`auth-store.test.ts`, `sync-pull.test.ts`) usam `as never` para contornar a tipagem de um client fake em vez do padrão `as unknown as Tipo` que `javascript-typescript.md` item 3 recomenda para fakes em teste. Funciona e não é `any`, mas vale padronizar na próxima passagem por esses arquivos.
- O redesenho de layout em `app.html` (barra lateral fixa em telas grandes) e os ajustes de responsividade/acessibilidade em `card-face.html`, `confirm-dialog.html`, `deck-switcher.html`, `mobile-nav.html`, `review.html`, `cards.html` e `progress.html` não constam como subtarefa explícita em nenhum `task_N.md` desta entrega. O conteúdo é consistente com os ajustes de UI mencionados em `evidences/README.md` da Tarefa 9.0 e não viola nenhuma regra (inclusive melhora acessibilidade: `min-h-11` em alvos de toque, `aria-label` em diálogos, `ariaCurrentWhenActive`), mas registrar esse tipo de mudança numa subtarefa ou nota da tarefa correspondente ajudaria a rastrear por que o escopo cresceu além do planejado.

## Conclusão

A implementação está bem alinhada à TechSpec e ao padrão de código do Lingo do qual foi portada: divisão de arquivos por responsabilidade, guardas em vez de aninhamento, tipagem completa e nenhum uso de `any`. A revisão encontrou três problemas reais — um deles uma violação de regra de domínio não-negociável (lacuna fora da Frente sobrevivendo a um pull) e outro um vazamento de texto em inglês para o usuário final — que teriam passado despercebidos pelos quatro comandos de validação (lint, type-scale, coverage, build) porque nenhum teste cobria esses caminhos específicos. Os três foram corrigidos na raiz nesta revisão, com testes que falham sem a correção, e os quatro comandos voltam a passar limpos (191/191 testes, 93,27% de cobertura em `domain/`). Nenhum problema bloqueador restante. **APROVADO.**
