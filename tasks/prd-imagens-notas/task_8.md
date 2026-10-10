# Tarefa 8.0: Validação final

## Visão geral

Fecha a entrega com o CI local e os roteiros E2E que exigem o conjunto inteiro:
- dois aparelhos com o Supabase local;
- build de produção offline e sem conta;
- legibilidade e acessibilidade em 360 px.

Confere que o bundle inicial não cresceu com o panzoom. Também confere os limites no celular real, se ainda não tiver sido feito na tarefa 1. Defeitos encontrados aqui são corrigidos com um teste que falha antes da correção (regra 1 de `tests.md`).

<skills>
### Conformidade com skills

- `agent-browser`: E2E-18 e E2E-I6–E2E-I9, com dois perfis de navegador, emulação de offline, dispositivo e cota, `eval` no IndexedDB e capturas.
- `supabase`: subir o Supabase local (`npx supabase start`, portas 55321–55327), conferir os objetos do bucket `card-images` pelo Studio (55323). Nada em produção.
- `vercel-cli`: não se aplica (nenhuma variável nova); a promoção para a `prod` só a pedido do Rafael.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e as rules em `.agents/rules/`. Pontos relevantes:
- Comandos de validação do projeto: `npm run lint`, `npm run check:type-scale`, `npm run test:coverage` (piso de 80% em `src/app/domain/**`) e `npm run build`.
- “Como um agente sobe o app”: porta livre em 4200–4299 conferida com `ss -ltn`, registro do que subiu, e encerramento só dos processos iniciados pelo agente. Supabase local com as portas fixas; se houver conflito, `npx supabase stop --project-id <id>` sem `--no-backup`, avisando.
- Desenvolvimento nunca fala com o banco de produção: os E2E com conta usam só o Supabase local.
- Sem Playwright nem pasta `e2e/`; evidências em `tasks/prd-imagens-notas/evidences/`.
</rules>

<requirements>
- Todos os critérios CA-40–CA-43 e CA-I1–CA-I25 verificados por teste automatizado (tarefas 1–4) ou roteiro E2E (tarefas 5, 6 e esta).
- CI verde: lint, type-scale, cobertura ≥ 80% em `domain/` e build.
- Bundle `initial` inalterado em relação à `des` antes da entrega.
</requirements>

## Subtarefas

- [x] 8.1 Rodar `npm run lint`, `npm run check:type-scale`, `npm run test:coverage` e `npm run build`; comparar o tamanho do `initial` com o build da `des` antes da entrega.
- [x] 8.2 E2E-18 e E2E-I6 com o Supabase local e dois perfis (A e B), incluindo a parte de pendentes da tarefa 7.
- [x] 8.3 E2E-I7: juntar/descartar, exclusão de baralho com limpeza do bucket e contador, incluindo a parte da tarefa 7.
- [x] 8.4 E2E-I8 no build de produção servido localmente, sem `env` do Supabase, offline e com cota reduzida.
- [x] 8.5 E2E-I9: 360 px, teclado, áreas de toque, foco preso e `prefers-reduced-motion`.
- [x] 8.6 Registrar no `tasks.md` e na tarefa os ajustes feitos na implementação, como nas entregas anteriores, e encerrar os processos iniciados.

## Detalhes de implementação

Ver [techspec.md](techspec.md):
- “Testes E2E”: parágrafo de preparação (perfis, imagens geradas, colagem por `eval`) e as linhas E2E-18, E2E-I6–E2E-I9.
- “Sequenciamento do desenvolvimento”: etapa 8 e “Dependências técnicas” (Supabase local, celular real, deploy só a pedido).
- “Riscos conhecidos”: 409 do Storage conferido contra o Supabase local.

## Critérios de aceitação relacionados

- CA-40
- CA-41
- CA-42
- CA-43
- CA-I8
- CA-I16
- CA-I17
- CA-I18
- CA-I19
- CA-I20
- CA-I21
- CA-I22
- CA-I23
- CA-I25

## Testes da tarefa

### Testes E2E

- [x] E2E-18 — Colar foto grande, revisar, ampliar, sincronizar e excluir em dois aparelhos
- [x] E2E-I6 — Dois aparelhos, offline e envio pendente (Supabase local)
- [x] E2E-I7 — Conta, exclusões e contador (Supabase local)
- [x] E2E-I8 — Sem conta, sem rede, build de produção
- [x] E2E-I9 — Legibilidade e acessibilidade

## Arquivos relevantes

- `tasks/prd-imagens-notas/evidences/` (capturas)
- `tasks/prd-imagens-notas/tasks.md` e `task_*.md` (registro dos ajustes)
- `supabase/config.toml` — só leitura (portas locais)
- `ngsw-config.json`, `angular.json` — só leitura (prefetch de `/*.js`, budget)

> **Resultado da validação final:**
> - CI local verde: `lint`, `check:type-scale`, 584 testes, cobertura de `domain/` em 97,6% (instruções), 91,8% (ramos), 97,3% (funções) e `build`.
> - **Bundle inicial: 905,62 kB → 914,15 kB (+8,5 kB; +3,5 kB comprimido)**, medido contra o commit atual num worktree temporário. O critério “inalterado” não foi atendido por esse valor: o aumento é o código de sincronização de imagens importado pelo `sync-store`. O panzoom, o único acréscimo grande, ficou num chunk lazy de 3,39 kB. O aviso de orçamento de 500 kB já existia (405 kB de excesso antes da entrega).
> - E2E-18, E2E-I6 e E2E-I7 foram executados com o Supabase local e quatro perfis de navegador (A, B, C, D) contra a mesma conta: envio e download, pendentes offline, placeholders, prefetch ao religar, legenda concorrente (a mais recente vence), exclusão de cartão e de baralho (arquivos somem da nuvem: 9 → 6 → 6 depois do baralho), juntar (nuvem 6 → 8) e descartar.
> - E2E-I8 contra um build de produção sem Supabase (env gerado com `null`, em diretório temporário), com service worker ativo e rede cortada: abrir, criar, revisar, ampliar (panzoom do cache) e excluir, sem nenhuma mensagem de erro ou de nuvem. Cota estourada simulada com `QuotaExceededError` em `imageBlobs`: mensagem exata, texto e imagens mantidos no formulário, nada gravado.
> - E2E-I9: 360 px sem rolagem horizontal no formulário, na revisão e no visualizador; rolagem da página travada com o diálogo aberto; o `.focus()` fora do diálogo é recusado (modal de verdade).
> - Defeitos encontrados e corrigidos nesta tarefa, todos com a correção conferida no navegador: (1) o `ImagePrefetch` refazia só o último pedido ao religar, e os 2 próximos cartões ficavam sem arquivo (agora guarda um pedido por origem, com teste); (2) em 360 px as setas de mover encolhiam para 28 px e a legenda tinha 42 px de altura (agora ≥ 44 px).
> - Limitações do ambiente de teste: o servidor de desenvolvimento não tem service worker e regenera os nomes dos chunks, então navegar para uma rota ainda não carregada com a rede cortada falha (não acontece no build de produção). `prefers-reduced-motion` não foi exercitado porque o visualizador e a galeria não têm animação nem transição.
> - Dados de teste ficaram no Supabase local: a conta `e2e-imgs-1790898247@example.test` (senha `senha-e2e-123`) com cartões e imagens. Nada foi tocado em produção.
> - Evidências em `evidences/` (capturas de tela de todos os roteiros). Imagens de teste e builds temporários ficaram no scratchpad.
> - Pendente (não automatizável aqui): testar compressão, orientação e a pinça do visualizador num Android e num iPhone reais, e o tempo de preparo de uma foto de 12 MP num celular intermediário (< 3 s).
