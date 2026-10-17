# Tarefa 2.0: domain — exportação e entrega

## Visão geral

Gera o arquivo a partir do aparelho e o entrega ao usuário. `backup-records.ts` lê do Dexie decks e cards (vivos e excluídos), revisões, settings e as imagens vivas de cartões vivos com arquivo local, e conta as que não têm arquivo; também expõe `hasStudyData`. `backup-images.ts` baixa antes, só com sessão e rede, as imagens que estão apenas na nuvem, reusando `fetchMissingImages`, sem nunca lançar. `backup-export.ts` orquestra a exportação com progresso em três fases e nomeia o arquivo pela data local. `backup-estimate.ts` estima o tamanho. `file-delivery.ts` escolhe entre compartilhar (iPhone instalado) e baixar, e trata o cancelamento como falha. `backup-labels.ts` reúne os textos com plural e formato brasileiro, inclusive `confirmationFor` (port de `restoreConfirm.ts`).

<skills>
### Conformidade com skills

Nenhuma skill específica: é TS puro de `domain/`.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e as rules em `.agents/rules/`. Pontos relevantes:
- `domain/` sem `@angular/*` nem `rxjs`; APIs do navegador (`navigator`, `URL`, `Blob`, `matchMedia`) permitidas, como em `image-download.ts`.
- Sem rede nos testes: `fake-supabase.ts` para o Storage, stubs para `navigator.share`/`canShare`, `matchMedia` e `URL.createObjectURL`.
- Falha de download de imagem vira contagem (`missingImages`), nunca erro.
- Textos de usuário em português com `Intl` pt-BR; código em inglês; constantes nomeadas.
</rules>

<requirements>
- RF66a: tamanho estimado e data do último backup (rótulos).
- RF66b: `certamecards-backup-AAAA-MM-DD.zip`; compartilhamento no iPhone instalado, download nos demais.
- RF66c, RF66d: conteúdo exportado conforme a tarefa 1.
- RF66e: imagens só na nuvem baixadas antes com sessão e rede; sem rede, contadas e deixadas de fora.
- RF66f: progresso; falha não atualiza a data do último backup (a atualização fica na tarefa 4).
- RF66g: `nothing-to-save` sem cartão nem baralho vivo.
- RF67h, RF67j (textos): avisos de Substituir e de outra conta em `confirmationFor`.
</requirements>

## Subtarefas

- [x] 2.1 Criar `backup-records.ts` (`collectBackupContent`, `hasStudyData`) e `backup-images.ts` (`downloadMissingForBackup`).
- [x] 2.2 Criar `backup-export.ts` (`createBackup` com fases de progresso, `backupFileName`) e `backup-estimate.ts`.
- [x] 2.3 Criar `file-delivery.ts` (`chooseDelivery`, `deliverFile`).
- [x] 2.4 Criar `backup-labels.ts` (último backup, imagens ausentes, tamanhos, contagens da prévia e do resumo, `confirmationFor`).
- [x] 2.5 Escrever TU-B9, TU-B11 a TU-B14, TI-B1 e TI-B2.

## Detalhes de implementação

Ver [techspec.md](techspec.md):
- “Visão dos componentes”: linhas de `backup-records`, `backup-images`, `backup-export`, `backup-estimate`, `file-delivery` e `backup-labels`.
- “Principais interfaces”: bloco `domain/backup-export.ts · backup-estimate.ts · file-delivery.ts`.
- “Regras dos contratos”: itens de `collectBackupContent`, `createBackup` e `deliverFile`.
- “Modelos de dados”: `ExportResult`, `BackupError`.
- “Pontos de integração”: Supabase Storage e Web Share API.

## Critérios de aceitação relacionados

- CA-B1
- CA-B3
- CA-B7
- CA-B8
- CA-B9
- CA-B14

## Testes da tarefa

### Testes de unidade

- [x] TU-B9 — `confirmationFor` monta os avisos por plano e conta
- [x] TU-B11 — `backupFileName` usa a data local
- [x] TU-B12 — `chooseDelivery` escolhe compartilhar só no app instalado com suporte
- [x] TU-B13 — Rótulos de backup em português
- [x] TU-B14 — `deliverFile` trata cancelamento do compartilhamento

### Testes de integração

- [x] TI-B1 — `createBackup` lê do Dexie e gera zip legível
- [x] TI-B2 — Exportação com imagem só na nuvem

## Arquivos relevantes

- `src/app/domain/backup-{records,images,export,estimate,labels}.ts`, `file-delivery.ts` + `.test.ts` (novos)
- `src/app/domain/backup-{format,errors,manifest-write,zip}.ts` (tarefa 1)
- `src/app/domain/image-download.ts` (`fetchMissingImages`), `card-images.ts`, `auth.ts` (`getBoundUserId`) — só leitura
- `src/test/backup-fixtures.ts`, `db-helpers.ts`, `fake-supabase.ts`
