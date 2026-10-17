# Tarefa 5.0: pages — tela `/ajustes/backup` e aviso em Ajustes

## Visão geral

Monta a tela de backup e restauração e a entrada em Ajustes. `pages/backup/` tem a moldura (`backup.ts/.html`, com `providers: [BackupSession]`) e um subcomponente por parte: `backup-export` (o que o arquivo leva, recomendação, tamanho estimado, último backup, “Baixar backup”, progresso, aviso de imagens ausentes, sucesso e erro), `backup-pick` (“Escolher arquivo de backup”), `backup-preview` (data e contagens, descartes, rádio Mesclar/Substituir, aviso de outra conta), `backup-confirm` (avisos e botão destrutivo em `miss`), `backup-progress` (`role="progressbar"`, `aria-live` nos marcos) e `backup-summary` (resumo anunciado e “Ir para o início”). Em Ajustes, a seção “Backup” com o link e, quando `shouldSuggestBackup` for verdadeiro, a linha discreta de aviso com “Fazer backup”.

<skills>
### Conformidade com skills

- `angular-developer`: componentes standalone, `OnPush`, `input()`/`output()`, `@if`/`@for`, `liveQuerySignal` para os fatos do aviso.
- `agent-browser`: conferência visual rápida da tela durante o desenvolvimento.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e as rules em `.agents/rules/`. Pontos relevantes:
- `pages/` não abre o Dexie: leitura por `liveQuerySignal(backupReminderFacts)` e `estimateBackupSize`, escrita via `BackupSession`.
- Escala tipográfica semântica (`text-label`, `text-meta`, `text-body`), cores por token, `text-on-signal` sobre `bg-signal`; nada de `text-xs`, `text-[Npx]` ou hex.
- Erro em `miss` e sucesso em `hit`, sempre com texto; consequência de Substituir dita em texto.
- `.ts` e `.html` ≤ 100 linhas cada; `settings.ts/.html` perto do limite — se passar, extrair a seção para `pages/settings/settings-backup`.
- Áreas de toque ≥ 44 px; rádios nativos com rótulo; foco visível.
</rules>

<requirements>
- RF66a, RF66b, RF66e, RF66f, RF66g: seção de exportação.
- RF66h: entrada “Backup” em Ajustes.
- RF67a, RF67b, RF67c, RF67d: escolha de arquivo, mensagens de erro, prévia com descartes.
- RF67e, RF67f, RF67g, RF67h, RF67i, RF67j: escolha do plano e confirmações.
- RF67k, RF67m: progresso e resumo anunciados.
- RF69a, RF69b: aviso discreto em Ajustes, sem modal nem botão de dispensar.
- Textos em pt-BR com datas e números brasileiros (via `backup-labels.ts`).
</requirements>

## Subtarefas

- [x] 5.1 Completar `pages/backup/backup.ts/.html` (moldura, título, “Voltar” entre passos até a confirmação).
- [x] 5.2 Criar `backup-export`.
- [x] 5.3 Criar `backup-pick`, `backup-preview` e `backup-confirm`.
- [x] 5.4 Criar `backup-progress` e `backup-summary`.
- [x] 5.5 Adicionar a seção “Backup” e o aviso de RF69 em `settings.html/.ts`.
- [x] 5.6 Rodar `npm run lint`, `npm run check:type-scale` e `npm run build`; conferir a tela em 360 px com `agent-browser`.

## Detalhes de implementação

Ver [techspec.md](techspec.md):
- “Visão dos componentes”: linhas de `pages/backup/` e `settings`.
- “Modelos de dados”: `BackupPreview`, `RestoreReport`, `BackupError` (mensagens) e “Parâmetros fixos” (marcos do `aria-live`).
- PRD, seção “Experiência do usuário” (UI e acessibilidade) e os textos de RF67h, RF67j e RF69a.

## Critérios de aceitação relacionados

- CA-B1
- CA-B3
- CA-B4
- CA-B5
- CA-B7
- CA-B9
- CA-B11
- CA-B14
- CA-B16

## Testes da tarefa

### Testes E2E

Validados nos roteiros da tarefa 6 (E2E-B1 a E2E-B5, E2E-B10, E2E-B12). A UI fica fora do gate de cobertura.

## Arquivos relevantes

- `src/app/pages/backup/backup{,-export,-pick,-preview,-confirm,-progress,-summary}.ts` + `.html` (novos)
- `src/app/pages/settings/settings.html`, `settings.ts` (mod.)
- `src/app/state/backup-session.ts`, `backup-store.ts` (tarefa 4)
- `src/app/domain/backup-labels.ts`, `backup-reminder.ts`, `backup-estimate.ts` (tarefas 2 e 3)
