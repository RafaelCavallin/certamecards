# Tarefa 2.0: domain — `theme.ts`

## Visão geral

Concentra a regra do tema em TS puro: os tipos `ThemePreference`/`ResolvedTheme`, a chave `certamecards.theme`, as opções com rótulos em português, a validação do valor guardado, a resolução preferência × sistema e o acesso ao `localStorage` que nunca lança. É a base do `ThemeStore` (6.0). O script inline (5.0) repete esta mesma regra.

<skills>
### Conformidade com skills

Nenhuma skill específica: é TS puro de `domain/`.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e as rules em `.agents/rules/`. Pontos relevantes:
- `domain/` sem `@angular/*` nem `rxjs`.
- União de strings em vez de `enum`. Exports nomeados. `function` nas funções principais. Constantes nomeadas (`THEME_STORAGE_KEY`, `DEFAULT_THEME_PREFERENCE`).
- O storage chega por parâmetro (`ThemeStorage | null`) para ser testável. O acesso ao `window.localStorage` fica isolado em `browserStorage()` com try/catch, porque o próprio getter pode lançar.
- Sem comentários. Arquivo ≤ 100 linhas, funções ≤ 30 linhas.
- Piso de 80% de cobertura em `src/app/domain/**`. Testes em AAA, sem disco nem rede.
</rules>

<requirements>
- RF70: três preferências, `dark` (padrão), `light` e `system`, valendo para o aparelho.
- RF70b: chave local `certamecards.theme`, fora do Dexie e do sync.
- RF70c: armazenamento indisponível ou valor inválido → `dark`, sem lançar.
- RF70d (regra): `system` segue `prefers-color-scheme`; `dark` e `light` ignoram o sistema.
</requirements>

## Subtarefas

- [x] 2.1 Criar `src/app/domain/theme.ts` com os tipos, as constantes e `THEME_OPTIONS` (“Escuro”, “Claro”, “Seguir o sistema”).
- [x] 2.2 Implementar `parseThemePreference` e `resolveTheme`.
- [x] 2.3 Implementar `browserStorage`, `readThemePreference` e `writeThemePreference` (devolve `boolean`, nunca lança).
- [x] 2.4 Escrever `src/app/domain/theme.test.ts` com TU-26 e TU-T1–T4.

## Detalhes de implementação

Ver [techspec.md](techspec.md):
- “Principais interfaces”: bloco `domain/theme.ts`.
- “Modelos de dados”: `ThemePreference` (com a degradação RF70c), `THEME_OPTIONS` e o mapeamento preferência × sistema.
- “Pontos de integração”: `localStorage`.

## Critérios de aceitação relacionados

- CA-T1
- CA-T4
- CA-T5
- CA-T6
- CA-T13

## Testes da tarefa

### Testes de unidade

- [x] TU-26 — `resolveTheme` nas 6 combinações
- [x] TU-T1 — `parseThemePreference` com valores válidos, nulos e inválidos
- [x] TU-T2 — `readThemePreference` com storage nulo, vazio, válido e com `getItem` que lança
- [x] TU-T3 — `writeThemePreference` com sucesso, com `setItem` que lança e com storage nulo
- [x] TU-T4 — `browserStorage` com o getter de `localStorage` lançando `SecurityError`

## Arquivos relevantes

- `src/app/domain/theme.ts` (novo)
- `src/app/domain/theme.test.ts` (novo)
