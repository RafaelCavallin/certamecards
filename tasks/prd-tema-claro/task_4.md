# Tarefa 4.0: Troca de classes nos templates

## Visão geral

Aplica os tokens novos onde eles têm função:

- `border-line` vira `border-edge` em `<input>`, `<textarea>`, `<select>`, botões e links com aparência de botão;
- `placeholder:text-muted/40` e `/60` viram `placeholder:text-placeholder` e `placeholder:text-placeholder-strong`;
- `backdrop:bg-ink/60` vira `backdrop:bg-scrim`;
- as intensidades do heatmap viram `fill-heat-0…3`;
- a barra comum da previsão vira `bg-edge`.

Divisórias, painéis e diálogos continuam em `line`. A troca é mecânica e não pode mudar nenhum pixel do escuro. A tarefa fecha com a comparação contra a linha de base da 1.0.

<skills>
### Conformidade com skills

- `angular-developer` (styling / Tailwind CSS): só troca de utilitários nos templates.
- `agent-browser`: comparação com a linha de base (E2E-T12).
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e as rules em `.agents/rules/`. Pontos relevantes:
- Cores sempre por token, nada de hex em template. `npm run check:type-scale` e `npm run lint` obrigatórios.
- Texto sobre `bg-signal` continua `text-on-signal`. `text-ink` sobre `bg-miss` no `confirm-dialog` fica como está (decisão da TechSpec).
- O `image-viewer` mantém `backdrop:bg-viewer`.
- Nenhuma mudança de tamanho, espaçamento ou disposição: só classes de cor.
</rules>

<requirements>
- CA-T9 (suporte): bordas de campos e de botões secundários com o token `edge`.
- RF72b: heatmap e barras da previsão com tokens próprios.
- RF72c: véu `scrim` nos diálogos e no menu ☰.
- CA-T12: escuro idêntico ao da Fase 1.
</requirements>

## Subtarefas

- [x] 4.1 Varrer `border-line` em `src/app/**/*.html` e `*.ts`. Trocar para `border-edge` só nos elementos interativos (campos, botões, links-botão, `hover:border-line` dos mesmos) e registrar a lista final no relatório.
- [x] 4.2 Trocar os placeholders em `cards.html`, `markable-field.html` (`/40` → `placeholder`), `tag-input.html` e `image-editor-item.html` (`/60` → `placeholder-strong`).
- [x] 4.3 Trocar `backdrop:bg-ink/60` → `backdrop:bg-scrim` em `confirm-dialog`, `card-edit-dialog`, `deck-switcher`, `mobile-nav` e `home/study-filter`.
- [x] 4.4 Trocar as classes de intensidade em `heatmap.ts` (`fill-heat-0…3`) e a barra comum em `bar-chart.html` (`bg-edge`).
- [x] 4.5 Rodar `lint`, `check:type-scale`, `test` (TU-T9 verde) e `build`.
- [x] 4.6 Executar o E2E-T12 contra a linha de base da 1.0. Salvar as capturas em `evidences/after-dark/` e registrar as diferenças (esperado: nenhuma).

## Detalhes de implementação

Ver [techspec.md](techspec.md):
- “Visão dos componentes”: linhas `ui/pages` e o parágrafo “Fora desta lista, nada muda”.
- “Riscos conhecidos”: elemento esquecido e regressão sutil no escuro.

## Critérios de aceitação relacionados

- CA-T9
- CA-T10
- CA-T11
- CA-T12

## Testes da tarefa

### Testes de unidade

- [x] TU-T9 — O escuro não mudou (continua verde após a troca)

### Testes E2E

- [x] E2E-T12 — Escuro comparado com a linha de base do E2E-T0

## Arquivos relevantes

- Templates de `src/app/pages/**` e `src/app/ui/**` com `border-line` em controles (lista final no relatório)
- `src/app/pages/cards/cards.html`, `src/app/ui/markable-field/markable-field.html`, `src/app/ui/tag-input/tag-input.html`, `src/app/ui/image-gallery-editor/image-editor-item.html`
- `src/app/ui/confirm-dialog/confirm-dialog.html`, `src/app/ui/card-edit-dialog/card-edit-dialog.html`, `src/app/ui/deck-switcher/deck-switcher.html`, `src/app/ui/mobile-nav/mobile-nav.html`, `src/app/pages/home/study-filter.html`
- `src/app/ui/heatmap/heatmap.ts`, `src/app/ui/bar-chart/bar-chart.html`
- `tasks/prd-tema-claro/evidences/after-dark/` (novo)
