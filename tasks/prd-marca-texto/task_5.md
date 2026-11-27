# Tarefa 5.0: ui — edição: bolinhas de cor, barra de ações e campo marcável com teclado

## Visão geral

Leva o marca-texto ao formulário. A barra de ações ganha três bolinhas de cor ao selecionar um trecho. Com o cursor dentro de um marca-texto, mostra as outras duas cores e “Tirar marca-texto”. A altura da barra fica fixa nos três estados em telas com 640 px ou mais; em telas mais estreitas, as ações quebram linha ao selecionar. O campo marcável passa a criar, trocar a cor e tirar o marca-texto e deixa de perder a seleção quando o foco vai do campo para a barra. Isso também corrige o uso de “Destacar seleção” e “Ocultar seleção” pelo teclado.

<skills>
### Conformidade com skills

- `angular-developer`: componentes standalone `OnPush`, `input()`/`output()`, `host` para identificar o contêiner no blur, ARIA (`aria-label`) e foco visível nos botões.
- `agent-browser`: E2E-01, E2E-02 e E2E-05, com capturas em `tasks/prd-marca-texto/evidences/`.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e as rules em `.agents/rules/`. Pontos relevantes:
- `ui/` não abre o Dexie: as marcas sobem pelo `model()` do campo até o `card-form`, que salva por `domain/card-save.ts`, como hoje.
- `ui/` não importa `pages/`.
- `markable-field.ts` já tem 99 linhas: o ouvinte de `selectionchange` sai para `watchSelectionChange` (em `field-selection.ts` ou em arquivo próprio) antes de entrar o código novo. `.ts` e `.html` contam separados.
- Funções ≤ 30 linhas, sem comentários, textos de usuário em português, cores só por token e escala tipográfica intacta (`check:type-scale`).
- A lógica de texto (resumo, dica, edição de marcas) é de `domain/` (tarefa 1.0). Aqui só se liga a UI.
</rules>

<requirements>
- RF84: três botões de cor na barra ao selecionar, nos três campos; um toque aplica.
- RF85: uma seleção que toca uma marca mostra as ações dessa marca.
- RF86: com o cursor dentro de um marca-texto, as outras duas cores trocam a cor e “Tirar marca-texto” remove só aquela marca.
- RF87: resumo e dica vindos de `domain/mark-summary.ts`; altura da barra fixa (`min-h-11`) nos três estados em telas ≥ 640 px; abaixo disso as ações quebram linha.
- RF98: cada bolinha tem nome acessível com ação e cor, funciona pelo teclado, tem foco visível e área de toque ≥ 44 px.
</requirements>

## Subtarefas

- [x] 5.1 Criar `src/app/ui/highlight-swatches/` (`.ts` e `.html`): `exclude`, `mode` (`'mark' | 'recolor'`), saída `pick`, `aria-label` (“Marcar em verde”, “Trocar para rosa”), 44 × 44 px e `mousedown.preventDefault`.
- [x] 5.2 Atualizar `src/app/ui/mark-actions/` (`.ts` e `.html`): `markedMark` no lugar de `markedKind`, saídas `add: MarkRequest` e `recolor`, “Tirar marca-texto”, bolinhas nos dois estados, `summarizeMarks`/`markHint` do domínio e `min-h-11`.
- [x] 5.3 Atualizar `src/app/ui/markable-field/` (`.ts`, `.html` e `field-selection.ts`): `allMarks` com highlight, `addMark(request)`, `recolorMark(color)`, `removeMark` pela nova API, blur que mantém a seleção quando `relatedTarget` está dentro do host e foco de volta ao `<textarea>` depois da ação. Extrair `watchSelectionChange`.
- [x] 5.4 Atualizar `EMPTY_MARKS` em `src/app/ui/card-form/card-form-fields.ts` com `highlight: []`.
- [x] 5.5 Rodar `npm run lint`, `npm run check:type-scale` e `npm run build`.
- [x] 5.6 Executar E2E-01, E2E-02 e E2E-05 com `agent-browser` e salvar as capturas em `evidences/`.

## Detalhes de implementação

Ver [techspec.md](techspec.md):
- “Principais interfaces”: `ui/highlight-swatches` e `ui/mark-actions`, e os “Contratos de comportamento” do `markable-field.onBlur`.
- “Modelos de dados”: `MarkRequest`.
- “Principais decisões”: teclado na barra.
- “Riscos conhecidos”: limite de 100 linhas em `markable-field.ts`.

## Critérios de aceitação relacionados

- CA-47
- CA-M1
- CA-M2
- CA-M3
- CA-M4
- CA-M5
- CA-M6
- CA-M17

## Testes da tarefa

### Testes E2E

- [x] E2E-01 — Marcar, trocar e tirar no formulário
- [x] E2E-02 — Edição de texto ao redor
- [x] E2E-05 — Teclado e leitor de tela

## Arquivos relevantes

- `src/app/ui/highlight-swatches/highlight-swatches.ts`, `highlight-swatches.html` (novos)
- `src/app/ui/mark-actions/mark-actions.ts`, `mark-actions.html`
- `src/app/ui/markable-field/markable-field.ts`, `markable-field.html`, `field-selection.ts`
- `src/app/ui/card-form/card-form-fields.ts`
- `src/app/domain/mark-editing.ts`, `mark-summary.ts` (consumidos, da tarefa 1.0)
