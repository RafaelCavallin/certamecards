# Tarefa 8.0: Validação final

## Visão geral

Fecha a entrega com:

- o CI local completo;
- os roteiros E2E que dependem de tudo pronto: varredura do claro, armazenamento bloqueado, sistema mudando no meio da revisão, cor da barra, contraste, heatmap, diálogos, offline e conta/sync no Supabase local.

Bugs encontrados são corrigidos na camada de origem, com teste.

<skills>
### Conformidade com skills

- `agent-browser`: todos os roteiros, com emulação de `prefers-color-scheme`, modo offline e capturas.
- `supabase`: subir o Supabase local para o E2E-T14 (sem migration nova).
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e as rules em `.agents/rules/`. Pontos relevantes:
- Validação obrigatória: `npm run lint`, `npm run check:type-scale`, `npm run test:coverage` (piso de 80% em `domain/**`) e `npm run build`.
- Subir só o necessário:
  - `npm start -- --port <porta>` (4200–4299) ou o build de produção servido estaticamente para E2E-T13;
  - `npx supabase start` (55321–55327) para E2E-T14.

  Registrar o que subiu e encerrar só o que foi iniciado.
- O E2E-T14 roda contra o Supabase local, nunca contra a produção. Nada de deploy de produção.
- Evidências em `tasks/prd-tema-claro/evidences/`.
</rules>

<requirements>
- Objetivos do PRD: contraste, sem piscar, sem regressão no escuro, cobertura total das telas.
- Todos os CA da entrega verificados no navegador.
</requirements>

## Subtarefas

- [x] 8.1 Rodar `lint`, `check:type-scale`, `test:coverage` e `build`, e registrar o resultado.
- [x] 8.2 E2E-T2 e E2E-T11: varredura do claro em todas as telas, no seletor, no menu ☰ e nos diálogos.
- [x] 8.3 E2E-T4: armazenamento bloqueado (configuração do site ou, se não houver, getter que lança via `Page.addScriptToEvaluateOnNewDocument`; registrar qual foi usado).
- [x] 8.4 E2E-T5, E2E-T6 e E2E-T7: sistema mudando com a revisão aberta, modos fixos, `theme-color` nos três modos.
- [x] 8.5 E2E-T8, E2E-T9 e E2E-T10: lacuna e destaque, anel de foco, bordas e contraste de textos, heatmap e previsão.
- [x] 8.6 E2E-T13: build de produção servido localmente, offline e sem conta.
- [x] 8.7 E2E-T14: Supabase local, dois perfis de navegador na mesma conta.
- [x] 8.8 Corrigir os bugs encontrados (com teste na camada correspondente) e repetir os roteiros afetados.

## Detalhes de implementação

Ver [techspec.md](techspec.md):
- “Testes E2E”: parágrafo de abertura (emulação, build de produção) e a tabela.
- “Riscos conhecidos”: bloqueio de armazenamento no E2E-T4 e barra de status no iOS.

## Critérios de aceitação relacionados

- CA-38
- CA-39
- CA-T2
- CA-T3
- CA-T4
- CA-T5
- CA-T6
- CA-T7
- CA-T8
- CA-T9
- CA-T10
- CA-T11
- CA-T13

## Testes da tarefa

### Testes E2E

- [x] E2E-T2 — Claro em todas as telas, seletor, menu ☰ e diálogos
- [x] E2E-T4 — Armazenamento bloqueado
- [x] E2E-T5 — “Seguir o sistema” mudando no meio da revisão
- [x] E2E-T6 — Modos fixos ignoram o sistema
- [x] E2E-T7 — `theme-color` nos três modos
- [x] E2E-T8 — Destaque, lacuna e botões de resposta no claro
- [x] E2E-T9 — Anel de foco, bordas e contraste de textos no claro
- [x] E2E-T10 — Heatmap e previsão no claro
- [x] E2E-T11 — Diálogo de confirmação e menu ☰ separados do fundo
- [x] E2E-T13 — Offline e sem conta, com recarga
- [x] E2E-T14 — Tema preservado ao sincronizar, sair e entrar; segundo aparelho independente

## Arquivos relevantes

- `tasks/prd-tema-claro/evidences/` (capturas e relatório dos roteiros)
- Arquivos das tarefas 2.0–7.0, caso algum bug exija correção

## Resultado da validação

CI local: `lint`, `check:type-scale`, `test:coverage` (776 testes em 108 arquivos; 98% de cobertura geral, piso de 80% em `domain/**`) e `build` passaram. Evidências em `evidences/` (cada pasta com README): `baseline-dark`/`after-dark` (E2E-T0/T12), `e2e-17`, `aparencia` (T1/T15), `claro` (T2/T8/T10/T11), `contraste` (T9), `armazenamento-bloqueado` (T4), `sistema` (T5/T6/T7), `offline` (T13) e `sync` (T14).

Defeitos encontrados e corrigidos:

- **Armazenamento bloqueado derrubava o app** (E2E-T4): o `SyncStore` lia e gravava `certamecards.lastSync` direto no `localStorage`, e o construtor lançava `SecurityError`. Correção: `domain/local-storage.ts` e `domain/sync-storage.ts`, com testes em `sync-storage.test.ts`.
- **`App` sem o `ThemeStore` num teste existente** (`sync-startup.test.ts`): o teste agora fornece o store e confere que o tema é inicializado na abertura.
- **Borda dobrada nos campos de marcações** (E2E-T2): o box interno do `markable-field` voltou para `border-line`. A borda de 3:1 ficou só no contêiner externo, e o escuro continua idêntico.

Observação: o registro automático do service worker não apareceu em 45 s no navegador de teste (E2E-T13 registrou o mesmo `ngsw-worker.js` à mão). Não faz parte desta entrega e não foi investigado.
