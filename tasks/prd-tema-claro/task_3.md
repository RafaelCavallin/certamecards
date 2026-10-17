# Tarefa 3.0: Tokens — paleta clara e tokens novos

## Visão geral

Cria a paleta do tema claro e os tokens novos (`edge`, `placeholder`, `placeholder-strong`, `scrim`, `heat-0…3`). No escuro, cada token novo tem um valor **derivado** que reproduz exatamente a classe que vai substituir. `hit` e `miss` ganham os valores claros ajustados.

Os testes de contraste leem o CSS real e guiam os valores. Os helpers ficam em `src/test/`. Esta tarefa ainda não troca nenhuma classe nos templates (4.0) e não liga o atributo (5.0/6.0). O claro só pode ser visto forçando `data-theme="light"` no DevTools.

<skills>
### Conformidade com skills

- `angular-developer` (styling / Tailwind CSS): tokens via `@theme inline` no Tailwind v4.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e as rules em `.agents/rules/`. Pontos relevantes:
- Cores sempre por token. Os hex existem só nos arquivos de CSS de tokens, nunca em `src/app/`.
- `styles.css` já tem 128 linhas. O bloco claro vai em `src/styles/theme-light.css`, importado por `styles.css` logo após as fontes.
- Os helpers de teste (`contrast.ts`, `theme-tokens.ts`) ficam em `src/test/` e são importados só por `*.test.ts`.
- Os testes leem arquivos do próprio repositório com `fs` (sem rede). AAA, um comportamento por teste.
- Valores do escuro inalterados (CA-T12).
</rules>

<requirements>
- RF72: mesma hierarquia visual e contraste AA no claro; sinal escurecido para servir de texto sobre fundo claro.
- RF72a: âmbar para sinal e destaque, verde para acerto, rosa para erro, nos dois temas.
- RF72b: níveis do heatmap distinguíveis entre si e do fundo; barras da previsão visíveis.
- RF72c: véu (`scrim`) que separa diálogos e menu ☰ do conteúdo.
- CA-T9: `edge` e anel de foco com ≥ 3:1 no claro.
</requirements>

## Subtarefas

- [x] 3.1 Em `src/styles.css`, acrescentar ao `:root` os tokens novos com os valores derivados do escuro e mapeá-los no `@theme inline` (`--color-edge`, `--color-placeholder`, `--color-placeholder-strong`, `--color-scrim`, `--color-heat-0`…`--color-heat-3`).
- [x] 3.2 Criar `src/styles/theme-light.css` com `:root[data-theme='light'] { … }` e a paleta clara final, e importá-lo em `styles.css`.
- [x] 3.3 Criar `src/test/contrast.ts` (`contrastRatio`, `blendOver`) e `src/test/theme-tokens.ts`. Este último lê os dois CSS e devolve as variáveis resolvidas de cada tema, tratando `var()` e `color-mix(... N%, transparent)` como composição sobre o fundo.
- [x] 3.4 Escrever `src/app/domain/theme-palette.test.ts` com TU-27 e TU-T6–T9.
- [x] 3.5 Conferir que `npm run build` passa e que os utilitários novos são gerados (`bg-edge`, `fill-heat-2`, `backdrop:bg-scrim`, `placeholder:text-placeholder`).

## Detalhes de implementação

Ver [techspec.md](techspec.md):
- “Modelos de dados”: “Tokens de cor — paleta final”, incluindo os pares derivados que também precisam passar.
- “Visão dos componentes”: linhas `styles.css` e `styles/theme-light.css`.
- “Abordagem de testes”: parágrafo de abertura (helpers e resolução de `color-mix`).
- “Principais decisões”: tokens novos com valor do escuro derivado.

## Critérios de aceitação relacionados

- CA-39
- CA-T8
- CA-T9
- CA-T10
- CA-T12

## Testes da tarefa

### Testes de unidade

- [x] TU-27 — Contraste dos tokens de texto do claro sobre `ink` e `surface`
- [x] TU-T6 — Pares compostos do claro (`hit`/`miss` em `/10` e `/20`, `on-signal`, `ink` sobre `miss`, lacuna revelada, lacuna no formulário, placeholders)
- [x] TU-T7 — Não-texto do claro: `edge` e anel de foco ≥ 3:1
- [x] TU-T8 — Rampa do heatmap claro
- [x] TU-T9 — O escuro não mudou: tokens da Fase 1 e equivalência dos tokens novos

## Arquivos relevantes

- `src/styles.css` (modificado)
- `src/styles/theme-light.css` (novo)
- `src/test/contrast.ts`, `src/test/theme-tokens.ts` (novos)
- `src/app/domain/theme-palette.test.ts` (novo)
