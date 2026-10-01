# Tarefa 4.0: domain — gravação atômica

## Visão geral

Grava os rascunhos no Dexie numa **única transação** `rw` (`decks`, `cards`), que é o que garante o tudo-ou-nada inclusive quando a página é recarregada no meio. Extrai de `cards.ts` o construtor puro `newCardRecord(input, now)` e, de `decks.ts`, o `newDeckRecord`, para que a importação use exatamente a mesma inicialização do cadastro manual. `anki-dedupe.ts` define a chave de conteúdo (Frente, Verso e marcas das duas) e descarta duplicatas contra o baralho de destino e dentro da própria importação. `anki-import.ts` expõe `existingContentKeys` (para a prévia da contagem) e `importDrafts`, que cria o baralho novo dentro da transação, relê as chaves de conteúdo, grava em lotes de 500 com `createdAt = now + índice` e checa o `AbortSignal` entre os lotes. Esta tarefa fecha o primeiro fluxo ponta a ponta do domínio (TI-A4).

<skills>
### Conformidade com skills

Nenhuma skill específica: é TS puro de `domain/` + Dexie.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e as rules em `.agents/rules/`. Pontos relevantes:
- Campos FSRS só da inicialização do `ts-fsrs` em `newCardRecord`; nada do histórico do Anki (RF64).
- `normalizeCardMarks` e `normalizeTags` reaplicados em `newCardRecord`: lacuna só na Frente, mesmo que a conversão erre.
- Contrato de `createCard` inalterado; os testes de `cards.test.ts` e `decks.test.ts` continuam verdes.
- Dentro da transação, só esperar operações do Dexie (nada de `setTimeout`), senão a transação confirma sozinha.
- Sem schema novo, sem migration, sem reemitir `sync_push`: cartões e baralho nascem `dirty: 1` pelo `trackDirty`.
- Prioridade 1 de `tests.md` (integridade de dados): atomicidade, cancelamento e deduplicação provados antes de existir tela.
- Constante `INSERT_CHUNK_SIZE`; `ImportInput` como objeto.
</rules>

<requirements>
- RF64a: cartões novos do FSRS, sem histórico, na ordem do arquivo dentro da fila (respeitando “novos por dia” e o teto de não firmados); irmãos de lacuna não separados de dia.
- RF65a (suporte): `onProgress` por lote e cancelamento por `AbortSignal`.
- RF65b: tudo-ou-nada, incluindo o baralho novo; repetir depois de uma falha não duplica.
- RF65d: cartão com Frente, Verso e marcas iguais a um cartão vivo do destino ou da mesma importação não é criado.
- RF65e (suporte): `ImportOutcome` com baralho, criados e duplicados.
</requirements>

## Subtarefas

- [x] 4.1 Extrair `newCardRecord(input, now)` em `cards.ts` (usado por `createCard`) e exportar `newDeckRecord` em `decks.ts`.
- [x] 4.2 Criar `anki-dedupe.ts`: `contentKey` e `dropDuplicates`.
- [x] 4.3 Criar `anki-import.ts`: `existingContentKeys` e `importDrafts` (transação única, baralho novo dentro dela, dedupe relido, lotes, `signal`, `createdAt` crescente).
- [x] 4.4 Escrever TU-A12, TU-A14, TI-12, TI-A1, TI-A2, TI-A3, TI-A4 e TI-A7.

## Detalhes de implementação

Ver [techspec.md](techspec.md):
- “Resumo” (segundo parágrafo) e “Sync, LWW e CAS”.
- “Principais interfaces”: bloco `domain/anki-convert.ts · anki-dedupe.ts` e `domain/anki-import.ts · cards.ts`.
- “Regras dos contratos”: itens de `importDrafts`, `newDeckRecord` e `newCardRecord`.
- “Modelos de dados”: `ImportInput`, `ImportTarget` e `ImportOutcome` (com a degradação “tudo duplicado”), `AnkiImportError` (`cancelled` e erro genérico).
- “Principais decisões”: “Uma transação Dexie para a importação inteira”, “Deduplicação por conteúdo”, “`createdAt = now + índice`” e “`newCardRecord`/`newDeckRecord` extraídos”.

## Critérios de aceitação relacionados

- CA-33
- CA-34
- CA-35
- CA-A4
- CA-A12
- CA-A14
- CA-A15
- CA-A18

## Testes da tarefa

### Testes de unidade

- [x] TU-A12 — `contentKey` e `dropDuplicates`
- [x] TU-A14 — `newCardRecord`

### Testes de integração

- [x] TI-12 — importação que falha no meio não deixa nada
- [x] TI-A1 — cancelar entre lotes desfaz tudo
- [x] TI-A2 — reimportar no mesmo baralho cria zero
- [x] TI-A3 — ordem e ritmo dos novos
- [x] TI-A4 — pacote real ponta a ponta no esquema legado
- [x] TI-A7 — cartões importados sobem no push

## Arquivos relevantes

- `src/app/domain/anki-{dedupe,import}.ts` + `.test.ts` (novos)
- `src/app/domain/cards.ts`, `decks.ts` + testes (modificados)
- `src/app/domain/db.ts`, `queue.ts` (`buildQueue`, no TI-A3), `sync.ts` (no TI-A7) — só leitura
- `src/test/db-helpers.ts`, `src/test/fake-supabase.ts`, `src/test/anki-builder.ts`
- Referência: `~/Desktop/lingo/src/services/db.ts#insertCardsInChunks` (substituído pela transação única)
