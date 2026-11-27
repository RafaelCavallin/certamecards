# Tarefa 3.0: Tokens — `highlight-*` nos dois temas e testes de cor

## Visão geral

Declara as três cores do marca-texto como tokens sólidos nos dois temas e prova por teste que elas cumprem o PRD: contraste do texto sobre cada cor, contraste da moldura da lacuna e distinção entre as cores e o fundo, também em simulação de protanopia e deuteranopia. Remove os dois testes que mediam a lacuna com fundo, que deixa de existir. Documenta os tokens novos no `AGENTS.md`.

<skills>
### Conformidade com skills

- `impeccable` (opcional): apoio se for preciso ajustar o tom das cores. Qualquer ajuste precisa manter TU-27 a TU-29 verdes.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e as rules em `.agents/rules/`. Pontos relevantes:
- “Estilo visual”: todo token novo precisa de valor nos dois temas e de teste de contraste. Cores sempre por token, sem hex em template e sem `dark:`.
- O tema escuro da Fase 1 continua idêntico: o teste `tema escuro inalterado` de `theme-palette.test.ts` segue verde.
- `src/test/color-vision.ts` é helper de teste: só é importado por `*.test.ts`.
- Constantes nomeadas para os limites (`TEXT_MIN`, `NON_TEXT_MIN`, `HIGHLIGHT_PAIR_MIN_DELTA`, `HIGHLIGHT_BACKDROP_MIN_DELTA`). Arquivos de teste também ≤ 100 linhas.
</rules>

<requirements>
- RF91: versões próprias das três cores no tema claro, com a mesma leitura.
- RF92: a moldura da lacuna atinge ≥ 3:1 sobre o fundo nos dois temas.
- Objetivos do PRD: texto ≥ 4,5:1 sobre cada cor e cores distinguíveis entre si e do fundo, inclusive em protanopia e deuteranopia.
</requirements>

## Subtarefas

- [x] 3.1 Declarar `--highlight-yellow`, `--highlight-green` e `--highlight-pink` no `:root` de `src/styles/tokens.css` e mapear `--color-highlight-*` em `@theme inline`.
- [x] 3.2 Declarar os valores claros em `src/styles/theme-light.css`.
- [x] 3.3 Criar `src/test/color-vision.ts` com OKLab, ΔE e as matrizes de Machado (2009) para protanopia e deuteranopia.
- [x] 3.4 Criar `src/app/domain/theme-highlight.test.ts` com TU-27 a TU-29.
- [x] 3.5 Remover de `src/app/domain/theme-palette.test.ts` os testes “text sobre a lacuna revelada” e “signal sobre a lacuna no formulário”.
- [x] 3.6 Acrescentar `highlight-yellow`/`-green`/`-pink` à tabela de tokens do `AGENTS.md` (use em: fundo do marca-texto; nunca em: outros fundos nem texto).
- [x] 3.7 Rodar `npm run lint`, `npm run test:coverage` e `npm run build`.

## Detalhes de implementação

Ver [techspec.md](techspec.md):
- “Modelos de dados”: “Tokens de cor do marca-texto”, com os valores, os contrastes e as distâncias ΔE calculados.
- “Abordagem de testes”: estratégia de TU-27 a TU-29 e a remoção dos dois testes antigos.
- “Principais decisões”: cores sólidas por token e texto sempre em `text` dentro do marca-texto.

## Critérios de aceitação relacionados

- CA-48
- CA-M10
- CA-M11

## Testes da tarefa

### Testes de unidade

- [x] TU-27 — Texto (`text`) sobre cada cor do marca-texto tem ≥ 4,5:1 nos dois temas
- [x] TU-28 — Moldura da lacuna (`signal`) tem ≥ 3:1 sobre `ink` e `surface` nos dois temas
- [x] TU-29 — As três cores se distinguem entre si (ΔE OKLab ≥ 0,08) em visão normal, protanopia e deuteranopia, e de `ink`/`surface` (ΔE ≥ 0,12), nos dois temas

## Arquivos relevantes

- `src/styles/tokens.css`
- `src/styles/theme-light.css`
- `src/test/color-vision.ts` (novo)
- `src/test/contrast.ts`, `src/test/theme-tokens.ts`
- `src/app/domain/theme-highlight.test.ts` (novo)
- `src/app/domain/theme-palette.test.ts`
- `AGENTS.md`
