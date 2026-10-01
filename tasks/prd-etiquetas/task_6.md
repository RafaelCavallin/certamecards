# Tarefa 6.0: ui/pages — filtro e chips na lista de Cartões

## Visão geral

A lista de Cartões ganha:
- o controle “Etiquetas” (`ui/tag-filter`, reusado depois pela Home), com as etiquetas do baralho ativo e a contagem de cada uma;
- os chips escolhidos acima da lista, com “Limpar”;
- as etiquetas de cada item em `ui/tag-chips`, com “+N”.

A linha vai para `pages/cards/card-row.{ts,html}` para `cards.ts` caber em 100 linhas.

<skills>
### Conformidade com skills

- `angular-developer`: `model()` de chaves no `tag-filter`, `@for`, virtual scroll do CDK já em uso.
- `agent-browser`: E2E-E2.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e as rules em `.agents/rules/`. Pontos relevantes:
- Filtro e orçamento de chips vêm de `domain/` (`filterCardsByTags`, `visibleTagChips`, `summarizeTags`), e a página só compõe.
- `ui/` não importa `pages/`.
- ≤ 100 linhas por `.ts`/`.html`.
- Escala tipográfica e tokens.
- Grupo de escolha múltipla com estado anunciado e contagem em `aria-live`.
</rules>

<requirements>
- RF48, RF48a: filtro E combinável com a busca, com as etiquetas do baralho ativo e as contagens.
- RF48b: chips escolhidos visíveis com “Limpar”; a contagem reflete busca e filtro.
- RF48c: chips em cada item, com “+N”.
- RF48d: o filtro é limpo ao trocar de baralho; seleção múltipla e exclusão em lote agem sobre o resultado filtrado.
- Desempenho: resposta < 150 ms com 5.000 cartões.
- Sem rolagem horizontal a 360 px.
</requirements>

## Subtarefas

- [x] 6.1 Criar `ui/tag-filter/tag-filter.{ts,html}`: `options` (`key`, `name`, `count`), `selected = model<string[]>()`, `label`; chips alternáveis com `aria-pressed` ou checkbox, área de toque ≥ 44 px.
- [x] 6.2 Criar `ui/tag-chips/tag-chips.{ts,html}`: exibição com `visibleTagChips` e “+N” (texto completo acessível).
- [x] 6.3 Extrair a linha da lista para `pages/cards/card-row.{ts,html}` com os chips. Ajustar `ROW_SIZE` para a nova altura fixa.
- [x] 6.4 Em `cards.ts`: `selectedTags` limpo quando o baralho muda; `filtered = searchCards(filterCardsByTags(...))`; opções vindas de `summarizeTags(cards)`; chips escolhidos + “Limpar”; mensagem de vazio que considera o filtro.
- [x] 6.5 Rodar `npm run lint`, `npm run check:type-scale` e `npm run build`. Executar o E2E-E2 (semeando 5.000 cartões pelo `eval`) e salvar as capturas em `evidences/`.

## Detalhes de implementação

Ver [techspec.md](techspec.md): a tabela “Visão dos componentes” (linhas `tag-filter`, `tag-chips` e `pages/cards`), “Principais interfaces” (assinaturas de `ui/tag-filter` e `ui/tag-chips`), “Riscos conhecidos” (linha virtualizada de altura fixa) e “Testes E2E” (como semear o IndexedDB).

## Critérios de aceitação relacionados

- CA-25
- CA-E6
- CA-E16

## Testes da tarefa

### Testes E2E

- [x] E2E-E2 — lista com 5.000 cartões: filtro + busca

A lógica já está coberta pelos TU-19, TU-E4 e TU-E9 (tarefa 3.0).

## Arquivos relevantes

- `src/app/ui/tag-filter/tag-filter.ts`, `tag-filter.html` (novos)
- `src/app/ui/tag-chips/tag-chips.ts`, `tag-chips.html` (novos)
- `src/app/pages/cards/cards.ts`, `cards.html`
- `src/app/pages/cards/card-row.ts`, `card-row.html` (novos)
