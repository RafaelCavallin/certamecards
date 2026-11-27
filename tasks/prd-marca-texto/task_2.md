# Tarefa 2.0: domain — sincronização, backup e cartão antigo

## Visão geral

Garante que o marca-texto atravesse todas as fronteiras de dados sem perda. O schema Zod das marcas passa a aceitar `highlight` opcional e a preservar chaves desconhecidas (`z.looseObject`). Esse schema é usado pelo pull do sync e pela leitura do backup. O cartão gravado antes da F19 (sem `highlight`) passa a ser normalizado ao abrir o formulário e ao comparar com o salvo, para não contar como alterado.

<skills>
### Conformidade com skills

- `supabase`: só para confirmar que nada muda no banco. Marcas novas moram no `marks jsonb` e não exigem reemitir `sync_push`. Nenhum comando de banco nesta tarefa.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e as rules em `.agents/rules/`. Pontos relevantes:
- Sem migration e sem mexer em `sync_push` (seção “Fluxo de uma migration nova” do `AGENTS.md`: marcas de texto não precisam disso).
- Campos FSRS só são escritos pelo `scheduler`: salvar marcas nunca reagenda nem gera log (TI-01).
- O que vem de fora (linha remota, backup) é `unknown` validado por Zod, nunca `any`.
- Testes de integração com `fake-indexeddb`, `src/test/fake-supabase.ts` e `src/test/db-helpers.ts`, sem rede. Cada caso monta o próprio cenário.
- Prioridade 1 de `tests.md`: sync, parse/serialize de linhas e integridade de dados.
</rules>

<requirements>
- RF93: o marca-texto é salvo no aparelho, sincroniza com a última escrita vencendo por cartão e não reagenda.
- RF94: o backup inclui o marca-texto; backups anteriores continuam restauráveis.
- RF95: tipos e cores desconhecidos sobrevivem ao pull, à edição, ao push e ao backup.
- Sem regressão: um cartão anterior à F19 aberto e salvo sem mudanças não é alterado.
</requirements>

## Subtarefas

- [x] 2.1 Atualizar `src/app/domain/sync-rows-marks.ts`: `z.looseObject` no cartão e no campo, `highlight` opcional com `{ start, end, color: string }`.
- [x] 2.2 Conferir que `parseCardRow`/`toCardRow` (`sync-rows-card.ts`) e a leitura e escrita do backup (`backup-manifest-read.ts`, `backup-manifest-write.ts`) levam `marks` inteiro, sem filtrar chaves.
- [x] 2.3 Normalizar `card.marks` em `loadCardDraft` (`src/app/domain/card-draft.ts`) e em `pickContent` (`src/app/domain/card-save.ts`) antes da comparação.
- [x] 2.4 Acrescentar variantes com `highlight` e com tipo e cor desconhecidos a `src/test/card-fixtures.ts` e `src/test/backup-fixtures.ts`.
- [x] 2.5 Escrever TU-17 a TU-19 em `sync-rows.test.ts`, TU-26 em `card-draft.test.ts` e TI-01 a TI-06 nos testes de `cards`, sync e backup.
- [x] 2.6 Rodar `npm run lint`, `npm run test:coverage` e `npm run build`.

## Detalhes de implementação

Ver [techspec.md](techspec.md):
- “Modelos de dados”: `Marks` e as degradações de cartão antigo e de tipo ou cor desconhecidos.
- “Pontos de integração”: Supabase (versão antiga descarta a chave sem rejeitar a linha) e backup (formato v1 mantido).
- “Principais decisões”: `highlight` opcional sem upgrade do Dexie e compatibilidade para frente no domínio.
- “Monitoramento e observabilidade”: linha com marca desconhecida não pode mais ser rejeitada no pull.

## Critérios de aceitação relacionados

- CA-M9
- CA-M12
- CA-M13
- CA-M14
- CA-M15

## Testes da tarefa

### Testes de unidade

- [x] TU-17 — `parseCardRow` aceita `highlight` e chaves desconhecidas
- [x] TU-18 — `parseCardRow` aceita linha antiga sem `highlight`
- [x] TU-19 — `toCardRow` envia `highlight` e chaves desconhecidas
- [x] TU-26 — `loadCardDraft` de cartão antigo devolve marcas normalizadas e `hasDraftChanges` é falso sem edição

### Testes de integração

- [x] TI-01 — Salvar edição só com marca-texto grava as marcas sem tocar no FSRS nem gerar revisão
- [x] TI-02 — Salvar sem mudanças um cartão antigo (sem `highlight`) não altera `updatedAt`
- [x] TI-03 — Push e pull pelo fake Supabase levam o marca-texto de um aparelho a outro
- [x] TI-04 — Cartão puxado com tipo e cor desconhecidos, editado e reenviado, mantém ambos reposicionados
- [x] TI-05 — Backup e restauração preservam marca-texto nas três cores
- [x] TI-06 — Restaurar um backup sem `highlight` (fixture da F15) funciona e não marca nada

## Arquivos relevantes

- `src/app/domain/sync-rows-marks.ts`
- `src/app/domain/sync-rows-card.ts` e `sync-rows.test.ts`
- `src/app/domain/card-draft.ts` e `card-draft.test.ts`
- `src/app/domain/card-save.ts` e `cards.test.ts`
- `src/app/domain/backup-manifest-read.ts`, `backup-manifest-write.ts`, `backup-manifest.test.ts`, `backup-roundtrip.test.ts`
- `src/app/domain/sync-pull.ts`, `sync-push.ts` (só leitura, para os TI)
- `src/test/card-fixtures.ts`, `src/test/backup-fixtures.ts`, `src/test/fake-supabase.ts`, `src/test/db-helpers.ts`
