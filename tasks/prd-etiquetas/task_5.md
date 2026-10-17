# Tarefa 5.0: ui — campo Etiquetas no formulário

## Visão geral

Cria o componente `tag-input` (combobox com chips e autocompletar, que lê o catálogo global por `liveQuerySignal`) e o coloca no `card-form` depois das Notas. Para o `card-form.ts` caber em 100 linhas, o estado dos campos vai para `card-form-fields.ts`. No cadastro em série, as etiquetas continuam preenchidas e só os textos e as marcas são limpos. A edição (página e diálogo da revisão) carrega as etiquetas do cartão.

<skills>
### Conformidade com skills

- `angular-developer`: componente standalone com `model<string[]>()`, signals, OnPush, `@for`/`@if`, ARIA de combobox.
- `agent-browser`: E2E-E1.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e as rules em `.agents/rules/`. Pontos relevantes:
- `ui/` não abre o Dexie: o catálogo vem de `listTagCatalog` via `liveQuerySignal`, e a lógica (adicionar, sugerir) é das funções de `domain/tags.ts` e `tag-catalog.ts`.
- `ui/` não importa `pages/`.
- `.ts` e `.html` ≤ 100 linhas cada.
- Tipografia só da escala (`text-label`/`text-meta`/`text-body`), cores por token, `text-on-signal` sobre `bg-signal`.
- Área de toque ≥ 44 px no botão de remover.
- `npm run lint` e `npm run check:type-scale`.
- A UI não entra no gate de cobertura e é validada pelo E2E.
</rules>

<requirements>
- RF46a: Enter ou vírgula confirma; chip com botão de remover; Backspace com o campo vazio remove o último; colar várias etiquetas cria todas.
- RF46b, RF46c: mensagens de limite de 40 caracteres e de 20 etiquetas; o campo para de aceitar no 20º chip.
- RF46d: autocompletar navegável por setas, Enter escolhe e Escape fecha.
- RF47a: a grafia existente prevalece.
- RF47c: editar etiquetas não reagenda.
- Premissa do fluxo 1 do PRD: as etiquetas persistem entre cartões no cadastro em série.
- Acessibilidade: padrão de combobox com listbox, remover com rótulo “Remover etiqueta X”.
</requirements>

## Subtarefas

- [x] 5.1 Criar `ui/tag-input/tag-input.{ts,html}`: `tags = model<string[]>()`, texto em digitação, sugestões (`suggestTags`), adicionar por `addTagInput` com a mensagem do primeiro `rejected`, teclado (Enter, vírgula, Backspace, setas, Escape) e ARIA (`role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`, `role="listbox"`/`option`).
- [x] 5.2 Extrair o estado de `card-form.ts` para `card-form-fields.ts` (sinais dos campos, `loadInitial`, `buildContent`, `resetFields`) e acrescentar `tags`. `resetFields` não limpa `tags`.
- [x] 5.3 Adicionar o campo Etiquetas ao `card-form.html`, depois das Notas, com rótulo no padrão dos outros campos.
- [x] 5.4 Conferir que `card-edit` e o diálogo de edição da revisão mostram as etiquetas do cartão e que salvar atualiza o cartão atual (chamadores ajustados na tarefa 2.0).
- [x] 5.5 Rodar `npm run lint`, `npm run check:type-scale` e `npm run build`. Executar o E2E-E1 com `agent-browser` e salvar as capturas em `evidences/`.

## Detalhes de implementação

Ver [techspec.md](techspec.md): a tabela “Visão dos componentes” (linhas `tag-input` e `card-form`), “Principais interfaces” (assinatura de `ui/tag-input`), `TagInputResult` em “Modelos de dados” e “Riscos conhecidos” (combobox acessível feito à mão e o tamanho de `card-form.ts`).

## Critérios de aceitação relacionados

- CA-24
- CA-E1
- CA-E2
- CA-E3
- CA-E4
- CA-E5

## Testes da tarefa

### Testes E2E

- [x] E2E-E1 — campo de etiquetas no formulário

A lógica do campo já está coberta pelos TU-18, TU-E1, TU-E2 e TU-E3 (tarefas 1.0 e 3.0).

## Arquivos relevantes

- `src/app/ui/tag-input/tag-input.ts`, `tag-input.html` (novos)
- `src/app/ui/card-form/card-form.ts`, `card-form.html`
- `src/app/ui/card-form/card-form-fields.ts` (novo)
- `src/app/pages/card-edit/card-edit.ts`
- `src/app/pages/review/review.ts`, `review.html`
- `src/app/state/live-query.ts` (leitura)
