# Tarefa 4.0: state e rota — `backup-store`, `backup-session` e `/ajustes/backup`

## Visão geral

Liga o domínio à interface. `state/backup-store.ts` (`@Service()` root) guarda a data do último backup em `localStorage['certamecards.lastBackupAt']`, com try/catch, como signal lido por Ajustes e pela tela de backup. `state/backup-session.ts` (`@Injectable()` com escopo da página) conduz a exportação (gerar, entregar, marcar a data, aviso de imagens ausentes, erro) e os passos da restauração (`pick` → `reading` → `preview` → `confirm` → `restoring` → `done`). Na Substituição com `hasStudyData()`, gera e entrega o backup automático antes de restaurar e para se ele falhar; depois de restaurar com sessão, chama `SyncStore.syncNow('manual')`. A rota `ajustes/backup` entra em `app.routes.ts` com `requireDeck` e `loadComponent` (a página vem na tarefa 5; aqui basta o componente-moldura mínimo para a rota compilar).

<skills>
### Conformidade com skills

- `angular-developer`: `@Service()`/`@Injectable()` com `providers` da página, `signal`/`computed`, `inject()`, rota com `loadComponent`.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e as rules em `.agents/rules/`. Pontos relevantes:
- `state/` chama só funções de `domain/`; não abre o Dexie diretamente.
- Estado compartilhado entre páginas (`lastBackupAt`) em `state/`; estado da tela com escopo da página.
- `localStorage` com try/catch, como `deck-store.ts` e `tag-filter-store.ts`.
- `state/` fica fora do gate de cobertura e é validado pelos roteiros E2E; testes de unidade só se houver lógica pura nova, que deve morar em `domain/`.
- Arquivos ≤ 100 linhas: se `backup-session.ts` passar, separar exportação e restauração em dois serviços de escopo da página.
</rules>

<requirements>
- RF66f: estados de exportação (“Gerando o backup…”, “Backup baixado”, erro) e atualização da data só em sucesso.
- RF66e: aviso de imagens ausentes vindo de `ExportResult.missingImages`.
- RF67a: nada é gravado até a confirmação.
- RF67f, RF67h, RF67j: confirmação só quando `confirmationFor` devolve avisos.
- RF67i: backup automático antes de Substituir, só com `hasStudyData()`; falhou → não substitui.
- RF67k, RF67l: progresso; falha volta à prévia com a mensagem.
- RF68b: `syncNow` depois de restaurar com sessão.
- RF66h: rota `/ajustes/backup`.
</requirements>

## Subtarefas

- [x] 4.1 Criar `state/backup-store.ts` (`lastBackupAt`, `markBackedUp`).
- [x] 4.2 Criar `state/backup-session.ts` (exportação, passos da restauração, backup automático, sync ao final, `back()`).
- [x] 4.3 Adicionar a rota `ajustes/backup` (`title: 'Backup'`, `requireDeck`) em `app.routes.ts`, com o componente-moldura de `pages/backup/backup.ts`.
- [x] 4.4 Rodar `npm run lint` e `npm run build`.

## Detalhes de implementação

Ver [techspec.md](techspec.md):
- “Visão dos componentes”: linhas de `backup-store`, `backup-session` e `app.routes.ts`.
- “Principais interfaces”: blocos `state/backup-store.ts` e `state/backup-session.ts`.
- “Relacionamentos e fluxo de dados”.
- “Principais decisões”: backup automático só com `hasStudyData` e página própria.

## Critérios de aceitação relacionados

- CA-B1
- CA-B7
- CA-B8
- CA-B9
- CA-B13
- CA-B14

## Testes da tarefa

### Testes E2E

Validados nos roteiros da tarefa 6 (E2E-B1, E2E-B5, E2E-B6, E2E-B9, E2E-B10). Sem testes automatizados novos: a lógica pura está em `domain/` (tarefas 2 e 3).

## Arquivos relevantes

- `src/app/state/backup-store.ts`, `src/app/state/backup-session.ts` (novos)
- `src/app/app.routes.ts` (mod.)
- `src/app/pages/backup/backup.ts` (moldura, completada na tarefa 5)
- `src/app/state/sync-store.ts`, `auth-store.ts`, `deck-store.ts` — só leitura
