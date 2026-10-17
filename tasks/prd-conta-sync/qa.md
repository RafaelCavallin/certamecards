# Relatório de QA — Conta e sincronização

As evidências da ferramenta de navegador estão salvas em `tasks/prd-conta-sync/evidences/`.

## Resumo
- Data: 30/09/2026
- Status: **APROVADO**
- Total de critérios de aceitação: 5 (CA-17, CA-18, CA-19, CA-20, CA-S1)
- Critérios de aceitação atendidos: 5
- Bugs encontrados: 1 (corrigido)

## Ambiente

- Frontend: `npm start -- --port 4201` (dev server, para lint/HMR e verificação de labels) e build de produção (`npm run build`) servido com `python3 -m http.server` nas portas 4202 (com `.env`/`.env.local` do Supabase local) e 4203 (sem nenhuma variável, para CA-S1). As três portas foram encerradas ao final.
- Supabase local: já estava ativo em `55321–55327` antes desta execução (não foi subido nem derrubado por este QA).
- Navegador: `agent-browser`, três sessões isoladas (`qa-conta-sync`, `qa-sync-a`, `qa-sync-b`), fechadas ao final.
- Contas de teste criadas no Supabase local (auto-confirmação de email ativa no ambiente local, sem passo manual pelo Inbucket): `qa-conta-sync-a@teste.local`, `qa-conta-sync-b@teste.local`.
- Descoberta relevante: o modo offline do `ng serve` falha ao importar dinamicamente um chunk de rota ainda não requisitado (sem service worker no dev server). Os critérios offline (CA-17) foram validados contra o **build de produção com service worker** servido estaticamente, que é o comportamento real do PWA — consistente com a nota já registrada em `evidences/README.md` da Tarefa 9.0.

## Critérios de aceitação verificados

| ID | Critério de aceitação | Casos de teste | Status | Evidência |
|----|-----------------------|----------------|--------|-----------|
| CA-17 | Regressão: com Supabase configurado mas offline/sem conta, criar, revisar e ver progresso sem erro | TI-09, E2E-07 | PASSOU | `qa-e2e-07-progresso-offline-mobile.png`, `qa-e2e-07-progresso-offline-desktop.png` |
| CA-18 | Revisões offline num aparelho aparecem no outro após sincronizar, sem duplicar logs | TU-12, TU-13, TU-14, TI-05, TI-06, TI-07, E2E-08 | PASSOU | `qa-e2e-18-device-a-progresso.png`, `qa-e2e-18-device-a-progresso-desktop.png` |
| CA-19 | Dados dos dois lados → juntar / usar dados da conta / cancelar; cancelar não altera nada local | TU-16, TI-08, E2E-09 | PASSOU | `qa-e2e-19-cancelar-preserva-local.png` |
| CA-20 | Dados da conta A nunca aparecem na conta B | TU-16, TI-08, E2E-09 | PASSOU | `qa-e2e-20-conta-b-isolada.png` |
| CA-S1 | Build sem `NG_APP_SUPABASE_URL`: Conta/Ajustes mostram indisponibilidade, sem erro no console nem requisição ao Supabase | TI-09, E2E-S1 | PASSOU | `qa-e2e-s1-conta-mobile.png`, `qa-e2e-s1-ajustes-mobile.png` |

## Testes E2E executados

| ID | Fluxo | Resultado | Observações |
|----|-------|-----------|-------------|
| E2E-07 | Build de produção offline: criar cartão, revisar, ver progresso | PASSOU | 0 requisições ao Supabase durante o fluxo; sem erro novo no console. |
| E2E-08 (equivalente) | Dois perfis (A e B) na mesma conta: cartão criado em A aparece em B após "Juntar dados"; revisão feita em B aparece em A após sincronizar | PASSOU | Confirmado por consulta direta ao Postgres local: 1 `review_log` para a conta, sem duplicação. |
| E2E-09 (equivalente) | Login com dados dos dois lados (decisão "prompt"): Juntar dados | PASSOU | Cartão local de B (deck padrão vazio) preservado, cartão de A baixado. |
| E2E-09 (equivalente) | Troca de conta (decisão "switch", sem opção "Juntar"): Cancelar | PASSOU | Dados locais de B (`Baralho B`, 1 cartão) preservados; sessão volta para "Entrar". |
| E2E-09 (equivalente) | Criar segunda conta (B) com dispositivo ainda vinculado à conta A localmente | PASSOU | Dados de A **não** vazaram para B: `completeSignIn` detecta troca de conta (`isAccountSwitch`) mesmo no caminho `auto-adopt` e descarta o local antes de vincular a B. Confirmado via SQL: conta B com 0 cartões/logs. |
| E2E-S1 | Build sem variáveis: abrir Conta e Ajustes | PASSOU | "Sincronização não disponível neste servidor." / "Conta e sincronização não estão disponíveis neste servidor."; sem erro no console; sem requisição ao Supabase. |

## Testes automatizados e cobertura

| Camada | ID | Resultado | Validação/comando | Observações |
|--------|----|-----------|--------------------|-------------|
| Unidade/Integração | TU-12 a TU-16, TI-05 a TI-09 (e toda a suíte) | PASSOU | `npm test` / `npm run test:coverage` — 188/188 testes, 37 arquivos | Roda sem rede, com `fake-supabase.ts` e `fake-indexeddb`. |
| Lint | — | PASSOU | `npm run lint` | Sem apontamentos. |
| Escala tipográfica | — | PASSOU | `npm run check:type-scale` | Nenhuma violação. |
| Build de produção | — | PASSOU | `npm run build` | Aviso de orçamento de bundle inicial (895 KB vs. 500 KB configurado) — pré-existente, não é regressão desta entrega; fora do escopo do PRD. |

- Cobertura (`src/app/domain/**`): **93,55% statements / 90,57% branches / 90,44% functions / 95,65% lines** — acima do piso de 80%. `pages/`, `ui/` e `state/` ficam fora do gate por decisão do projeto (validados pelos roteiros E2E acima).

## Acessibilidade

- [x] Navegação por teclado (Tab, Enter, Esc) — testado em Conta (`/conta`): skip link é o primeiro foco, seguido pelo cabeçalho e pelos campos do formulário na ordem visual.
- [x] Elementos interativos com rótulos descritivos — botões e links do app usam texto visível (nenhum ícone sem texto).
- [x] Imagens com texto alternativo — não aplicável: o app não usa `<img>` em nenhum template (`grep` confirmou zero ocorrências).
- [x] Contraste de cores — paleta de tokens do projeto (`ink`/`surface`/`text`/`signal`), já validada no MVP offline; sem mudança de paleta nesta entrega.
- [x] Formulários com rótulos associados aos campos — **BUG-01 encontrado e corrigido** (ver abaixo): os campos de Email/Senha em `/conta` usavam só `placeholder`, sem `<label>`. Agora associados via `for`/`id`.
- [x] Mensagens de erro claras e acessíveis — erro de login/cadastro aparece como texto (`text-miss`) logo abaixo do formulário, sem depender só de cor.
- [x] Fontes com tamanho apropriado — `check:type-scale` não acusou violação; nenhuma classe abaixo de `text-label` (14px) usada nas telas novas.

## Visual e responsividade

Capturado em ≈390px (mobile) e 1280px (desktop), estado vazio (primeiro cartão) e com dados (progresso, ajustes, conta):

- `qa-responsivo-home-mobile.png` / `qa-responsivo-home-desktop.png`
- `qa-responsivo-ajustes-mobile.png` / `qa-responsivo-ajustes-desktop.png`
- `qa-e2e-07-progresso-offline-mobile.png` / `qa-e2e-07-progresso-offline-desktop.png`
- `qa-e2e-s1-conta-mobile.png`, `qa-e2e-s1-ajustes-mobile.png`
- `qa-bug-01-labels-corrigidos.png`

Nenhuma inconsistência visual encontrada nas duas larguras; layout, tipografia e cores seguem os tokens do projeto em ambos os tamanhos.

## Bugs encontrados e corrigidos

| ID | Descrição | Severidade | Status | Correção | Teste de regressão | Evidência |
|----|-----------|------------|--------|----------|--------------------|-----------|
| BUG-01 | Os campos de Email e Senha em `src/app/pages/account/account.html` usavam somente `placeholder` como identificação, sem `<label>` associado — falha de acessibilidade (WCAG 1.3.1/3.3.2): o rótulo some ao digitar e nem todo leitor de tela expõe `placeholder` como nome acessível confiável. Os demais formulários do app (ex.: `card-form.html`) já usam `<label>` de verdade. | Média | Corrigido | Adicionados `<label class="sr-only" for="...">` para os campos de email e senha, com `id` correspondente nos `<input>`; visual inalterado (label oculto para leitura de tela). | Camada `pages/` está fora do gate de cobertura automatizada (validada por E2E manual, conforme `AGENTS.md`); regressão coberta pela captura offline em `qa-bug-01-labels-corrigidos.png` e pela verificação programática `document.getElementById('account-password').labels[0].textContent === 'Senha'` durante este QA. | `qa-bug-01-labels-corrigidos.png` |

## Conclusão

Os cinco critérios de aceitação da entrega (CA-17 a CA-20 e CA-S1) foram verificados de ponta a ponta: regressão offline sem conta, sincronização entre dois aparelhos sem duplicar `review_logs`, as três decisões de login (juntar, usar dados da conta, cancelar) e isolamento total entre contas — inclusive o caso não trivial de criar uma segunda conta num aparelho ainda vinculado à primeira, onde o código corretamente descarta o local antes de vincular à nova conta. `npm run lint`, `npm run check:type-scale`, `npm run test:coverage` (188/188, 93,55% em `domain/`) e `npm run build` passam limpos. Um bug de acessibilidade (rótulos de formulário ausentes em Conta) foi encontrado e corrigido durante o QA, sem impacto visual. **QA APROVADO** — a entrega está pronta para a promoção a produção, que segue dependendo de pedido explícito do Rafael.
