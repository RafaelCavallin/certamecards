# Tarefa 3.0: domain — sincronização das imagens

## Visão geral

Liga as imagens ao ciclo de sincronização existente, sem mudar schema nem `sync_push`. O `fake-supabase` ganha `storage` em memória, com falhas injetáveis. O pull ganha a quinta tabela, `card_images`, com LWW por linha e o `blobState` decidido no apply. O pull de um cartão excluído passa a tombstonar as imagens vivas dele. O envio roda depois de cartões e logs, em três fases: (1) upload dos arquivos, com 409 contando como sucesso; (2) `sync_push_images` em lotes, com CAS no `dirty`; (3) `remove()` em lote dos arquivos de imagens excluídas. As falhas ficam isoladas por imagem e o resultado da sincronização continua `ok`. A preparação de dados ao entrar na conta sai de `auth.ts` para `local-data.ts` e passa a incluir as imagens.

<skills>
### Conformidade com skills

- `supabase`: consumo do Storage (`upload` com `upsert: false`, `download`, `remove` em lote), RLS por pasta do usuário e a RPC `sync_push_images` já existente. Conferir na skill o formato dos erros do Storage (409 e “Duplicate”). Não há migration nesta tarefa.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e as rules em `.agents/rules/`. Pontos relevantes:
- Sem migration nova, sem editar a migration aplicada e sem reemitir `sync_push`: imagens têm tabela e RPC próprias (AGENTS, “Fluxo de uma migration nova”).
- Ordem cartões → logs → imagens (FK `card_images → cards`); metadado de imagem viva só depois do arquivo na nuvem.
- Atualizações feitas pela sincronização passam `dirty` explícito, porque o hook `updating` de `trackDirty` marcaria a linha.
- CAS por `updatedAt` com o `clearDirty` existente.
- `unknown` + zod nas linhas remotas e nos erros do Storage; `import type` para `SupabaseClient`; erros só em `console.warn` com id e fase, sem legenda.
- `auth.ts` ≤ 100 linhas: extrair `local-data.ts`.
- Testes com o `fake-supabase` (nunca rede real), prioridade máxima pela regra 3 de `tests.md` (sync).
</rules>

<requirements>
- RF77b: envio nas sincronizações existentes; falha de imagem tentada de novo depois, sem atrasar texto e revisões.
- RF77c (parte): imagens dos outros aparelhos chegam como metadados `remote`.
- RF77e: ordem, legenda e remoção por LWW; arquivo imutável.
- RF77g: juntar sobe as imagens locais; descartar e trocar de conta apagam as imagens do aparelho; cancelar não muda nada.
- RF78a: exclusão propagada aos outros aparelhos e arquivo apagado da nuvem, com nova tentativa silenciosa em caso de falha.
- Integridade (restrições do PRD): outro aparelho nunca vê metadado de arquivo ausente.
</requirements>

## Subtarefas

- [x] 3.1 `src/test/fake-supabase.ts`: `storage.from(bucket).upload/download/remove` em memória, com erros injetáveis por caminho (409, 403, rede) e registro das chamadas em ordem junto com as RPCs.
- [x] 3.2 `sync-rows-image.ts` (`parseCardImageRow`, `toCardImageRow`) e reexport em `sync-rows.ts`.
- [x] 3.3 `sync-pull-images.ts` (`applyCardImages`), `card_images` em `sync-pull.ts`/`sync-pull-page.ts`, e `applyCards` tombstonando as imagens dos cartões que chegaram excluídos (`sync-pull-apply.ts`).
- [x] 3.4 `image-storage.ts`: bucket, `imagePath` e `isDuplicateUpload`.
- [x] 3.5 `image-sync-push.ts`: `pushImages(client, userId)` em três fases, com 2 uploads simultâneos e lotes de 200. Se passar de 100 linhas, separar `image-sync-upload.ts`/`image-sync-remove.ts`.
- [x] 3.6 `sync.ts`: chamar `pushImages` depois de `pushDirty`, com a sessão vinculada; resultado `ok` mesmo com imagens falhando.
- [x] 3.7 `local-data.ts` extraído de `auth.ts`: `wipeLocalData`, `markAllDirty` (imagens com blob voltam a `local`) e `clearCursors` (com `cursor:card_images`).
- [x] 3.8 Escrever TU-I10, TU-I11, TI-15, TI-16, TI-I1–TI-I5, TI-I13 e TI-I14.

## Detalhes de implementação

Ver [techspec.md](techspec.md):
- “Visão dos componentes”: linhas `sync-rows-image.ts`, `sync-pull-images.ts`, `sync-pull*.ts`, `image-storage.ts`, `image-sync-push.ts`, `sync.ts`, `local-data.ts`.
- “Relacionamentos e fluxo de dados”: diagrama `syncNow`, tabela “Estados do arquivo”, parágrafos “Offline e sem conta” e “Sync, LWW e CAS”.
- “Modelos de dados”: “Mapeamento `card_images` ↔ `CardImage`”, `ImagePushResult`, “Parâmetros fixos” (Storage e Envio).
- “Endpoints da API”: `GET /rest/v1/card_images`, `POST …/sync_push_images`, upload e `DELETE` do Storage.
- “Pontos de integração”: lock da sincronização e idempotência.

## Critérios de aceitação relacionados

- CA-42
- CA-43
- CA-I16
- CA-I19
- CA-I20
- CA-I21

## Testes da tarefa

### Testes de unidade

- [x] TU-I10 — `parseCardImageRow`/`toCardImageRow`
- [x] TU-I11 — `isDuplicateUpload`

### Testes de integração

- [x] TI-15 — Push de imagem: upload → metadados → `uploaded`; `409` no reenvio
- [x] TI-16 — Tombstone de imagem e limpeza do arquivo com falha e nova tentativa
- [x] TI-I1 — Falha de upload de uma imagem não bloqueia as outras nem a sincronização
- [x] TI-I2 — CAS: legenda editada durante o envio continua suja
- [x] TI-I3 — Pull de imagem nova sem blob local
- [x] TI-I4 — Pull LWW de legenda e de tombstone
- [x] TI-I5 — Cartão chega excluído pelo pull → imagens vivas dele são tombstonadas
- [x] TI-I13 — Entrar na conta: juntar, descartar e trocar de conta
- [x] TI-I14 — Sem Supabase configurado, `syncNow` e o prefetch não tocam em imagens (a parte do prefetch é completada na tarefa 4)

## Arquivos relevantes

- `src/app/domain/{sync-rows-image,sync-pull-images,image-storage,image-sync-push,local-data}.ts` + `.test.ts` (novos)
- `src/app/domain/{sync,sync-pull,sync-pull-page,sync-pull-apply,sync-rows,auth}.ts` e testes (modificados)
- `src/test/fake-supabase.ts` (modificado)
- `src/app/domain/{lww,sync-push,sync-push-dirty}.ts` — só leitura (`wins`, `chunk`, `clearDirty`)
- `supabase/migrations/20261017000000_images_reminders.sql` — só leitura (RPC, bucket, políticas)

> **Ajustes feitos na implementação:**
> - O `fake-supabase` ficou com `storage` em `src/test/fake-storage.ts` (limite de 100 linhas), com log ordenado de chamadas (`calls`: `rpc:…`, `upload:…`, `download:…`, `remove:…`) e `rpc` assíncrono, necessário para simular a edição durante o envio (CAS).
> - O envio ganhou um arquivo por fase: `image-sync-upload`, `image-sync-metadata`, `image-sync-remove` e o orquestrador `image-sync-push`. `image-blob-state.ts` (novo) troca o `blobState` numa transação preservando o `dirty`.
> - `applyVersioned` passou a receber um objeto (`VersionedApply`) com um gancho `afterWrite`: é por ele que `applyCards` tombstona as imagens dos cartões que chegam excluídos, usando a data da exclusão do cartão como `deletedAt`/`updatedAt`, para que os dois aparelhos gerem a mesma versão (sem ping-pong).
> - `card_images` é puxada **depois** das outras quatro tabelas, não em paralelo.
> - Defeito encontrado no caminho, **só corrigido nas imagens**: o hook `trackDirty` marca como suja uma linha substituída por `bulkPut` quando `dirty` não muda no diff. Por isso, puxar uma edição remota de um **cartão** limpo o deixa `dirty: 1` e ele é reenviado sem necessidade (confirmado com uma sonda). Para as imagens, `applyCardImages` força `dirty: 0` depois do `put`. O caso dos cartões é anterior a esta entrega e não foi alterado.
> - `pushed` do `syncNow` agora soma as imagens cujos metadados subiram.
