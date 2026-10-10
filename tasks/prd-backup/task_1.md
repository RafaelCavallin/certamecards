# Tarefa 1.0: domain — formato, validação e zip

## Visão geral

Define o contrato do arquivo de backup e tudo o que lê e escreve esse contrato, sem tocar no Dexie. `backup-format.ts` traz as constantes e os tipos (`BackupContent`, `ParsedBackup`, `BackupPreview`, `RestorePlan`, `RestoreProgress`, `RestoreReport`). `backup-errors.ts` traz o `BackupError` com os códigos e as mensagens em português. `backup-manifest-write.ts` serializa o conteúdo com os `to*Row` da sincronização; `backup-manifest-read.ts` valida o envelope por Zod e cada registro pelos `parse*Row` (com `synced_at` sintético), e `backup-validate.ts` aplica limites, regras de imagem e integridade referencial dentro do arquivo, contando os descartes. `backup-zip.ts` gera o zip em streaming com o `fflate` (`ZipDeflate` no manifesto, `ZipPassThrough` nas imagens) e lê o manifesto e as imagens com `unzip` filtrado. `src/test/backup-fixtures.ts` monta conteúdos e zips em memória para esta e as próximas tarefas.

<skills>
### Conformidade com skills

Nenhuma skill específica: é TS puro de `domain/`.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e as rules em `.agents/rules/`. Pontos relevantes:
- `domain/` sem `@angular/*` nem `rxjs`; `src/test/backup-fixtures.ts` só importado por `*.test.ts`.
- Manifesto lido como `unknown` e validado por Zod; nunca `any`.
- Reuso dos `to*Row`/`parse*Row` de `sync-rows*.ts` sem alterá-los; a normalização de marcas (lacuna só na Frente) e de etiquetas vem deles.
- Limites de `card-limits.ts` (`validateCardContent`, `IMAGE_*`), nunca números soltos.
- Arquivos ≤ 100 linhas: manifesto dividido em escrita, leitura e validação; funções ≤ 30 linhas; códigos de erro como união de strings.
</rules>

<requirements>
- RF66c, RF66d: o manifesto leva decks e cards (vivos e excluídos), revisões, settings e imagens com `path`; não leva estado de sincronização nem preferências do aparelho.
- RF67b: formato alheio ou zip ilegível → `not-backup`; versão maior → `newer-version`.
- RF67c: registros soltos inválidos descartados e contados; lacunas fora da Frente removidas; etiquetas normalizadas; regras de imagem de F17.
- Integridade: cartão sem baralho, revisão sem cartão ou baralho e imagem sem cartão vivo ou sem entrada no zip são descartados.
</requirements>

## Subtarefas

- [x] 1.1 Criar `backup-format.ts` (constantes, `imageEntryPath`, tipos) e `backup-errors.ts` (`BackupError`, `backupErrorMessage`).
- [x] 1.2 Criar `backup-manifest-write.ts` (`toManifest`).
- [x] 1.3 Criar `backup-manifest-read.ts` (`parseManifest`: envelope, versão, `parse*Row` por registro) e `backup-validate.ts` (limites, imagens, referências, contagem de descartes).
- [x] 1.4 Criar `backup-zip.ts` (`zipBackup` em streaming com progresso por arquivo, `unzipManifest`, `unzipImages`).
- [x] 1.5 Criar `src/test/backup-fixtures.ts` (conteúdo com cards vivos e excluídos, revisões, settings e imagens; zips válidos, malformados e de versão futura).
- [x] 1.6 Escrever TU-29 e TU-B1 a TU-B5.

## Detalhes de implementação

Ver [techspec.md](techspec.md):
- “Visão dos componentes”: linhas de `backup-format`, `backup-errors`, `backup-manifest-write`, `backup-manifest-read`, `backup-validate` e `backup-zip`.
- “Principais interfaces”: bloco `domain/backup-manifest-*.ts · backup-zip.ts`.
- “Regras dos contratos”: item de `parseManifest`.
- “Modelos de dados”: `BackupManifest`, `BackupError` e “Parâmetros fixos” (compressão).

## Critérios de aceitação relacionados

- CA-36
- CA-B2
- CA-B4
- CA-B5

## Testes da tarefa

### Testes de unidade

- [x] TU-29 — Validação do manifesto de backup (formato, versão, contagens)
- [x] TU-B1 — `parseManifest` descarta registros soltos inválidos e segue
- [x] TU-B2 — `parseManifest` remove lacuna fora da Frente
- [x] TU-B3 — `backup-validate` descarta órfãos de referência
- [x] TU-B4 — `backup-validate` aplica as regras de imagem de F17
- [x] TU-B5 — `toManifest` → `parseManifest` é ida e volta exata

## Arquivos relevantes

- `src/app/domain/backup-{format,errors,manifest-write,manifest-read,validate,zip}.ts` + `.test.ts` (novos)
- `src/test/backup-fixtures.ts` (novo)
- `src/app/domain/sync-rows*.ts`, `card-limits.ts`, `lww.ts` — só leitura
