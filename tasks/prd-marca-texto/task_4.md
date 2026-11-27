# Tarefa 4.0: ui/pages — exibição do marca-texto e lacuna com moldura

## Visão geral

Faz o marca-texto aparecer em todas as telas e troca o visual da lacuna. O formulário (`mark-backdrop`) pinta o fundo colorido sem alterar a métrica do texto. A lacuna vira moldura âmbar sem fundo, no formulário e na revisão. Na revisão e nas listas (`marked-text`), o trecho vira `<mark>` com fundo e o texto na cor principal. O cartão (`card-face`) e as quatro listas passam a entregar o marca-texto ao `marked-text`. A barra de edição fica para a tarefa 5.0.

<skills>
### Conformidade com skills

- `angular-developer`: componentes standalone `OnPush`, `input()` com valor padrão e controle de fluxo `@if`/`@for` no template.
- `agent-browser`: E2E-03 e E2E-04, com capturas em `tasks/prd-marca-texto/evidences/`.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e as rules em `.agents/rules/`. Pontos relevantes:
- `ui/` não importa `pages/` nem abre o Dexie. Os dados chegam por `input()`.
- Cores só por token (`bg-highlight-*`, `ring-signal`, `text-text`), sem hex e sem `dark:`. Escala tipográfica intacta: `npm run check:type-scale`.
- As classes ficam literais em `ui/mark-styles/mark-styles.ts` para o Tailwind detectá-las. Nenhuma classe de marca tem `padding`, `margin`, `border` ou peso/tamanho de fonte.
- `.ts` e `.html` de componente contam separados no limite de 100 linhas. Sem comentários.
- UI fora do gate de cobertura: validada pelos roteiros E2E. A lógica testável já está em `domain/` (tarefa 1.0).
</rules>

<requirements>
- RF88: no formulário, o marca-texto aparece como fundo sem deslocar o texto, o cursor nem a seleção.
- RF89: marca-texto sempre visível, com o texto em peso normal e na cor principal, na revisão (inclusive a Frente antes de revelar), no reforço e no seu resumo, na lista de cartões, em Difíceis e na prévia da importação.
- RF90: destaque inalterado.
- RF91: cores próprias no tema claro (tokens da tarefa 3.0).
- RF92: lacuna como moldura âmbar sem preenchimento no formulário e revelada; fechada continua `_____`.
- RF99: trecho exposto às tecnologias assistivas como texto marcado (`<mark>`).
</requirements>

## Subtarefas

- [x] 4.1 Criar `src/app/ui/mark-styles/mark-styles.ts` com `HIGHLIGHT_FILL`, `CLOZE_FRAME` e as classes do formulário e da revisão.
- [x] 4.2 Atualizar `src/app/ui/mark-backdrop/mark-backdrop.ts`/`.html`: lacuna só com moldura e marca-texto com fundo pela cor do segmento.
- [x] 4.3 Atualizar `src/app/ui/marked-text/marked-text.ts`/`.html`: `input` `highlight` (padrão `[]`), `<mark>` com fundo e `text-text`, lacuna revelada com moldura.
- [x] 4.4 Passar `[highlight]` em `src/app/ui/card-face/card-face.html` (três campos), `pages/cards/card-row.html`, `pages/difficult/difficult-row.html`, `pages/import/import-preview.html` e `pages/reinforce/reinforce-summary.html`.
- [x] 4.5 Rodar `npm run lint`, `npm run check:type-scale` e `npm run build`.
- [x] 4.6 Executar E2E-03 e E2E-04 com `agent-browser`, usando cartões com marca-texto criados no Dexie pelo console de desenvolvimento ou por backup, porque a barra só chega na 5.0. Salvar as capturas em `evidences/`.

## Detalhes de implementação

Ver [techspec.md](techspec.md):
- “Modelos de dados”: “Classes de exibição (`ui/mark-styles/mark-styles.ts`)”, com a nota sobre métrica e `box-decoration-clone`.
- “Principais interfaces”: `ui/marked-text`.
- “Principais decisões”: lacuna só com moldura, `<mark>` na revisão e texto sempre em `text`.
- “Riscos conhecidos”: desalinhamento no formulário e `box-decoration-break` no Safari.

## Critérios de aceitação relacionados

- CA-47
- CA-M7
- CA-M8
- CA-M9
- CA-M10
- CA-M11
- CA-M18

## Testes da tarefa

### Testes E2E

- [x] E2E-03 — Revisão, reforço e listas
- [x] E2E-04 — Tema claro e daltonismo

## Arquivos relevantes

- `src/app/ui/mark-styles/mark-styles.ts` (novo)
- `src/app/ui/mark-backdrop/mark-backdrop.ts`, `mark-backdrop.html`
- `src/app/ui/marked-text/marked-text.ts`, `marked-text.html`
- `src/app/ui/card-face/card-face.html`
- `src/app/pages/cards/card-row.html`
- `src/app/pages/difficult/difficult-row.html`
- `src/app/pages/import/import-preview.html`
- `src/app/pages/reinforce/reinforce-summary.html`
