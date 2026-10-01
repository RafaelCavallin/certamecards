# Tarefa 2.0: domain — conversão do conteúdo

## Visão geral

Transforma o HTML de um campo do Anki em texto puro com marcas, e as etiquetas cruas da nota em etiquetas do CertameCards. `anki-html.ts` percorre a árvore do `DOMParser` e produz `ParsedField` (texto, destaques e lacunas com offsets no texto final). `anki-cloze.ts` troca `{{cN::…}}` bem formados por elementos sentinela antes do parse, remove as chaves dos malformados e aninhados e expande a nota em um par Frente/Verso por número. `anki-tags.ts` aplica as regras de etiqueta (separação por espaço, `_` → espaço, internas descartadas, limites, grafia do catálogo).

<skills>
### Conformidade com skills

Nenhuma skill específica: é TS puro de `domain/`.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e as rules em `.agents/rules/`. Pontos relevantes:
- `domain/` sem `@angular/*`. O `DOMParser` é API do navegador, disponível no jsdom do Vitest.
- `htmlToMarkedText` nunca lança erro. Os intervalos saem ordenados, sem sobreposição e aparados (RF8).
- Lacuna só na Frente: `expandCloze` nunca produz lacuna no Verso.
- Etiquetas sempre por `normalizeTags`/`tagKey` de `tags.ts`, sem uma segunda regra de equivalência.
- Comentário permitido só na regex de lacuna.
- `anki-html.ts` deve ficar ≤ 100 linhas; se passar, separar as regras de bloco em `anki-html-blocks.ts`.
- Constante nomeada `ANKI_INTERNAL_TAGS`.
</rules>

<requirements>
- RF61a: `<br>`, fim de `<div>`/`<p>`/títulos/`<tr>` e `<li>` viram quebra; no máximo uma linha em branco; “• ” nos itens; “ | ” entre células; entidades decodificadas; espaços colapsados e pontas aparadas.
- RF61b: `<b>`, `<strong>`, `<u>` e os estilos equivalentes viram destaque aparado; destaques encostados se fundem; itálico, cor e fonte viram texto normal.
- RF61c: `[sound:…]`, `<img>`, `<audio>`, `<video>`, `<script>` e `<style>` são removidos; fórmulas ficam literais.
- RF62a: um cartão por número de lacuna, todas as ocorrências do número ocultas, demais lacunas em texto, dica descartada.
- RF62b: Verso = texto inteiro revelado com a resposta do número destacada.
- RF62c: na Frente, a lacuna prevalece sobre o destaque; no Verso, a resposta se une aos destaques.
- RF62d: lacunas malformadas ou aninhadas viram texto sem chaves; nota sem lacuna válida é pulada.
- RF63a: etiquetas da nota para todos os cartões, `_` → espaço, hierarquia literal, grafia do catálogo, sem repetição.
- RF63b: `leech`/`marked` e etiquetas com mais de 40 caracteres descartadas; até 20 por nota; contagem das descartadas.
- RF63c: o baralho de origem não vira etiqueta.
</requirements>

## Subtarefas

- [x] 2.1 Criar `anki-html.ts`: `htmlToMarkedText` (blocos, listas, tabelas, entidades, mídia, destaque por tag e por `style`, aparar e fundir intervalos).
- [x] 2.2 Criar `anki-cloze.ts`: `markClozes` (sentinela `<anki-cloze data-n>`, malformados e aninhados sem chaves) e `expandCloze` (Frente e Verso por número, recorte do destaque na Frente).
- [x] 2.3 Criar `anki-tags.ts`: `importTags(raw, catalog)` → `{ tags, dropped }`.
- [x] 2.4 Escrever TU-A3 a TU-A9.

## Detalhes de implementação

Ver [techspec.md](techspec.md):
- “Principais interfaces”: blocos `domain/anki-html.ts · anki-cloze.ts` e `anki-tags.ts`.
- “Regras dos contratos”: itens de `htmlToMarkedText` e de `expandCloze`.
- “Modelos de dados”: `ParsedField` (tabela de regras de conversão e exemplo) e “Parâmetros fixos” (`ANKI_INTERNAL_TAGS`).
- “Principais decisões”: “`DOMParser` com lacunas como elementos sentinela”.
- “Riscos conhecidos”: lacunas aninhadas e tamanho de `anki-html.ts`.

## Critérios de aceitação relacionados

- CA-33
- CA-34
- CA-A5
- CA-A8
- CA-A9
- CA-A10
- CA-A11

## Testes da tarefa

### Testes de unidade

- [x] TU-A3 — `htmlToMarkedText`: quebras, parágrafos, listas e tabelas
- [x] TU-A4 — `htmlToMarkedText`: destaques
- [x] TU-A5 — `htmlToMarkedText`: mídia e som removidos
- [x] TU-A6 — `markClozes` + `expandCloze`: um cartão por número
- [x] TU-A7 — lacuna e destaque juntos
- [x] TU-A8 — lacunas malformadas e aninhadas
- [x] TU-A9 — `importTags`

## Arquivos relevantes

- `src/app/domain/anki-{html,cloze,tags}.ts` + `.test.ts` (novos)
- `src/app/domain/text-marks.ts` (`Range`, `trimRange`), `tags.ts` (`normalizeTags`, `tagKey`), `card-limits.ts` (`TAGS_MAX`, `TAG_MAX_LENGTH`) — só leitura
