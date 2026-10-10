# Tarefa 3.0: domain — plano, aplicação atômica e restauração

## Visão geral

Grava o backup no aparelho. `backup-plan.ts` porta `selectWinners` e `selectOrphans` do Lingo e acrescenta `selectBlobFills`. `backup-apply.ts` abre **uma única transação** sobre `decks`, `cards`, `reviewLogs`, `settings`, `cardImages` e `imageBlobs` e aplica, em lotes de 500 com progresso: baralho padrão intocado → decks → cards → settings → imagens e arquivos → revisões (união por id) → tombstones de órfãos (Substituir). `backup-apply-rows.ts` e `backup-apply-images.ts` são os passos. Mesclar grava só vencedores do LWW com o `updatedAt` do arquivo; Substituir grava tudo com `updatedAt = now`; tudo fica `dirty: 1` e as imagens `blobState: 'local'`. `backup-restore.ts` lê o arquivo para a prévia (sem gravar, com `accountMismatch`) e restaura, montando os `Blob` antes da transação; `QuotaExceededError` vira `storage-full`. `backup-reminder.ts` traz a regra pura do aviso de 30 dias e os fatos que ela consome.

<skills>
### Conformidade com skills

- `supabase`: só para conferir que nada muda no banco e que a ordem do push (cards antes de logs) e o `409` de imagem existente continuam valendo com o que a restauração deixa `dirty`.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e as rules em `.agents/rules/`. Pontos relevantes:
- Integridade em primeiro lugar (tests.md, regra 3): LWW, tombstones, atomicidade e `dirty` cobertos por TI com Dexie real.
- Nada que não seja do Dexie é aguardado dentro da transação; `onProgress` síncrono.
- Campos FSRS gravados como vêm do arquivo: a restauração não chama o `scheduler` nem gera revisão.
- Revisões imutáveis: só `bulkAdd` das ausentes.
- Reuso de `wins` (`lww.ts`), `tombstoneImages`/`tombstoneImagesOfCards` (`card-images.ts`), `getBoundUserId` e `DEFAULT_DECK_NAME`.
- Arquivos ≤ 100 linhas e funções ≤ 30 linhas: aplicação dividida em três módulos; entradas como objetos nomeados (`ApplyInput`, `RestoreInput`, `ReminderInput`).
</rules>

<requirements>
- RF67d: prévia com data, contagens de vivos, tamanho das imagens, descartes e `accountMismatch`, sem gravar.
- RF67e: Mesclar por LWW com desempate da sincronização; revisões unidas; nada apagado; exclusão local mais nova mantida.
- RF67g: Substituir grava o arquivo por cima, exclui por tombstone os órfãos (decks, cards, imagens) e une revisões.
- RF67l: tudo-ou-nada, inclusive imagens; falha de cota → `storage-full`.
- RF67m (dados): `RestoreReport` com aplicados, mantidos, removidos e descartados.
- RF68b (dados): linhas `dirty: 1`, imagens `local`, Substituir com `updatedAt = now`.
- Baralho padrão vazio removido quando o arquivo traz baralhos.
- RF69a: `shouldSuggestBackup` e `backupReminderFacts`.
</requirements>

## Subtarefas

- [x] 3.1 Criar `backup-plan.ts` (`selectWinners`, `selectOrphans`, `selectBlobFills`).
- [x] 3.2 Criar `backup-apply-rows.ts` (`applyRows`, `addMissingLogs`, `tombstoneOrphans`, `dropUntouchedDefaultDeck`).
- [x] 3.3 Criar `backup-apply-images.ts` (`applyImages` com preenchimento de arquivo de imagem `remote`).
- [x] 3.4 Criar `backup-apply.ts` (transação única, ordem dos passos, lotes de 500, `storage-full`).
- [x] 3.5 Criar `backup-restore.ts` (`readBackup`, `restoreBackup`).
- [x] 3.6 Criar `backup-reminder.ts` (`shouldSuggestBackup`, `backupReminderFacts`).
- [x] 3.7 Escrever TU-B6 a TU-B8, TU-B10, TI-13, TI-14, TI-B3 a TI-B11.

## Detalhes de implementação

Ver [techspec.md](techspec.md):
- “Resumo” (segundo parágrafo) e “Sync, LWW e CAS”.
- “Visão dos componentes”: linhas de `backup-plan`, `backup-apply`, `backup-apply-rows`, `backup-apply-images`, `backup-restore` e `backup-reminder`.
- “Principais interfaces”: blocos `domain/backup-restore.ts` e `domain/backup-plan.ts · backup-apply.ts`.
- “Regras dos contratos”: itens de `readBackup`, `restoreBackup`, `applyBackup`, `dropUntouchedDefaultDeck` e `shouldSuggestBackup`.
- “Modelos de dados”: `BackupPreview`, `RestoreInput`/`RestoreProgress`/`RestoreReport` e “Parâmetros fixos”.

## Critérios de aceitação relacionados

- CA-36
- CA-37
- CA-B6
- CA-B7
- CA-B9
- CA-B10
- CA-B11
- CA-B13
- CA-B14

## Testes da tarefa

### Testes de unidade

- [x] TU-B6 — `selectWinners` aplica LWW com desempate por id
- [x] TU-B7 — `selectOrphans` lista só os locais ausentes do arquivo
- [x] TU-B8 — `selectBlobFills` escolhe imagens locais sem arquivo
- [x] TU-B10 — `shouldSuggestBackup` nos limites

### Testes de integração

- [x] TI-13 — Backup → restaurar “Substituir” em banco vazio
- [x] TI-14 — Restaurar “Mesclar” com edição mais nova local
- [x] TI-B3 — Mesclar depois de estudar
- [x] TI-B4 — Substituir exclui órfãos e preserva histórico
- [x] TI-B5 — Substituir carimba `updatedAt` e marca `dirty`
- [x] TI-B6 — Falha no meio não deixa nada
- [x] TI-B7 — Falta de espaço vira `storage-full`
- [x] TI-B8 — Baralho padrão intocado some na restauração
- [x] TI-B9 — Restauração com conta e push
- [x] TI-B10 — Preenchimento de arquivo de imagem `remote`
- [x] TI-B11 — `readBackup` não grava nada

## Arquivos relevantes

- `src/app/domain/backup-{plan,apply,apply-rows,apply-images,restore,reminder}.ts` + `.test.ts` (novos)
- `src/app/domain/backup-{format,errors,manifest-read,validate,zip,export}.ts` (tarefas 1 e 2)
- `src/app/domain/lww.ts`, `card-images.ts`, `auth.ts`, `decks.ts`, `db.ts`, `sync.ts`, `sync-push.ts`, `image-sync-push.ts` — só leitura
- `src/test/backup-fixtures.ts`, `db-helpers.ts`, `fake-supabase.ts`
