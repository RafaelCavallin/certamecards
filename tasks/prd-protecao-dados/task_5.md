# Tarefa 5.0: state e pages — proteção do armazenamento

## Visão geral

`StoragePersistence` (`@Service()` root) guarda o estado da persistência e o método `request()`, chamado na abertura (no lugar de `persistStorage()` do `App`), ao concluir uma importação (`AnkiImportRun.write`) e pelo botão “Proteger meus dados” da nova seção Ajustes → Armazenamento. O resumo da importação recomenda backup quando não há conta nem proteção.

<skills>
### Conformidade com skills

- `angular-developer`: `@Service()`, signals, `computed`, `RouterLink`.
- `agent-browser`: roteiros E2E desta tarefa no QA.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e as rules em `.agents/rules/`. Pontos relevantes:
- `pages/settings/settings-storage` segue o padrão das outras seções (rótulo mono, `text-meta`, botão `border-edge`).
- `settings.html` (51 linhas) e `import-summary.html` continuam ≤ 100 linhas.
- Negativa do navegador não vira mensagem de erro.
</rules>

<requirements>
- RF82a: pedido de persistência na abertura, ao fim da importação e por botão.
- RF82b, RF82c: seção “Armazenamento” com os três estados e as orientações.
- RF83: linha de backup no resumo da importação sem conta e sem proteção.
</requirements>

## Subtarefas

- [x] 5.1 Criar `src/app/state/storage-persistence-store.ts` e trocar `persistStorage()` em `src/app/app.ts` por `request()`.
- [x] 5.2 Chamar `request()` em `AnkiImportRun.write` depois do sucesso.
- [x] 5.3 Criar `src/app/pages/settings/settings-storage.ts` e `.html` e incluir a seção em `settings.html`/`settings.ts`, antes do Backup.
- [x] 5.4 Acrescentar a linha de backup em `import-summary` (sem sessão e estado diferente de `persisted`).
- [x] 5.5 Rodar `lint`, `check:type-scale`, `test:coverage` e `build`; verificar no navegador Ajustes → Armazenamento e o resumo da importação.

## Detalhes de implementação

Ver [techspec.md](techspec.md): linhas `storage-persistence-store.ts`, `anki-import-run.ts`, `settings-storage`, `import-summary` e `app` da “Visão dos componentes”, “Relacionamentos e fluxo de dados” (item 5) e a tabela “Textos”; textos de Ajustes no RF82b do [prd.md](prd.md).

## Critérios de aceitação relacionados

- CA-46
- CA-P06
- CA-P07

## Testes da tarefa

### Testes E2E

- [x] E2E-P07 — Ajustes → Armazenamento
- [x] E2E-P08 — Resumo da importação

## Arquivos relevantes

- `src/app/state/storage-persistence-store.ts` (novo)
- `src/app/pages/settings/settings-storage.ts`, `settings-storage.html` (novos)
- `src/app/pages/settings/settings.html`, `settings.ts`
- `src/app/state/anki-import-run.ts`
- `src/app/pages/import/import-summary.ts`, `import-summary.html`
- `src/app/app.ts`
