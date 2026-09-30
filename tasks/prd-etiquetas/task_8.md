# Tarefa 8.0: pages — Ajustes → Etiquetas

## Visão geral

Cria a rota `ajustes/etiquetas`. A tela lista todas as etiquetas de todos os baralhos com a contagem (`listTagCatalog` via `liveQuerySignal`) e o estado vazio. Cada item fica em `tag-row.{ts,html}`, com “Renomear” no próprio item, aviso e confirmação de junção (`planTagRename`), e “Excluir” com confirmação (`confirm-dialog`). Depois de renomear ou excluir, o `tag-filter-store` é atualizado (`applyRename`/`applyDelete`). Ajustes ganha o link “Etiquetas”.

<skills>
### Conformidade com skills

- `angular-developer`: rota com `loadComponent` + `requireDeck`, signals, edição inline acessível.
- `agent-browser`: E2E-E4.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e as rules em `.agents/rules/`. Pontos relevantes:
- Escrita pontual: a página chama `renameTag`/`deleteTag` de `domain/` direto, sem store intermediário.
- Leitura reativa por `liveQuerySignal`.
- Mensagens de erro na tela e `console.error` com o erro original, sem dados do cartão.
- Nome de arquivo em kebab-case, rota em português (`ajustes/etiquetas`).
- ≤ 100 linhas por arquivo.
- Escala tipográfica e tokens; área de toque ≥ 44 px.
</rules>

<requirements>
- RF50, RF50a: lista alfabética sem acento, com a contagem e o estado vazio que explica onde criar etiquetas.
- RF50b: renomear no item, com as validações de RF46b; junção com aviso “Juntar com ‘X’? N cartões passam a usar ‘X’”; troca só de caixa sem aviso.
- RF50c: excluir com a confirmação e a contagem.
- RF50d: tudo-ou-nada; falha → aviso na tela.
- RF50e: sincronização pelo fluxo normal.
- RF49g: o filtro “Estudar só…” acompanha a renomeação e a exclusão feitas aqui.
</requirements>

## Subtarefas

- [ ] 8.1 Adicionar a rota `ajustes/etiquetas` em `app.routes.ts` (`loadComponent`, `requireDeck`).
- [ ] 8.2 Criar `pages/tags/tags.{ts,html}`: catálogo reativo, lista, estado vazio e `confirm-dialog` para excluir e juntar.
- [ ] 8.3 Criar `pages/tags/tag-row.{ts,html}`: exibição, modo de edição (Enter salva, Escape cancela), mensagem de `invalid`, pedido de confirmação quando o plano é `merge`.
- [ ] 8.4 Após o sucesso: `tagFilterStore.applyRename(fromKey, toKey)` ou `applyDelete(key)`. Em falha: “Não foi possível renomear a etiqueta.” / “Não foi possível excluir a etiqueta.”
- [ ] 8.5 Adicionar o link “Etiquetas” em `settings.html`.
- [ ] 8.6 Rodar `npm run lint`, `npm run check:type-scale` e `npm run build`. Executar o E2E-E4 (inclusive excluir em 1.000 cartões em < 2 s) e salvar as capturas em `evidences/`.

## Detalhes de implementação

Ver [techspec.md](techspec.md):
- “Modelos de dados”: `TagRenamePlan`, com a nota sobre o CA-27.
- “Principais interfaces”: bloco `tag-bulk`.
- “Monitoramento e observabilidade”: mensagens de falha.
- “Riscos conhecidos”: `Collection.modify` com mais de 1.000 cartões.

## Critérios de aceitação relacionados

- CA-27
- CA-E12
- CA-E13

## Testes da tarefa

### Testes E2E

- [ ] E2E-E4 — Ajustes → Etiquetas: renomear, juntar, excluir

A lógica já está coberta pelos TU-E6, TI-10, TI-E2 e TI-E3 (tarefa 3.0) e pelo TU-E7 (tarefa 7.0).

## Arquivos relevantes

- `src/app/app.routes.ts`
- `src/app/pages/tags/tags.ts`, `tags.html` (novos)
- `src/app/pages/tags/tag-row.ts`, `tag-row.html` (novos)
- `src/app/pages/settings/settings.html`
- `src/app/ui/confirm-dialog/*` (reuso)
- `src/app/state/tag-filter-store.ts` (da tarefa 7.0)
