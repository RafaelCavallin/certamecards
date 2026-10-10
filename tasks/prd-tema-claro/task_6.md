# Tarefa 6.0: state — `ThemeStore`

## Visão geral

Serviço root com signals que assume o tema depois do bootstrap:

- lê a preferência com `readThemePreference(browserStorage())`;
- expõe `preference` e `resolved`;
- grava as trocas com `setPreference`;
- ouve `change` de `prefers-color-scheme`;
- aplica `data-theme` e `theme-color`. A cor da barra é lida de `--ink` computado, para não ter hex em `src/app/`.

O `App` instancia o store no construtor, como faz com o `SyncStore`. O store não tem `effect()`: o `apply()` é imperativo, e assim o store pode ser criado com `new` nos testes.

<skills>
### Conformidade com skills

- `angular-developer`: `@Service` root, `signal`/`computed`, `inject()`.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e as rules em `.agents/rules/`. Pontos relevantes:
- `state/` sem RxJS. O listener de mídia é um `addEventListener` nativo.
- O store não importa `auth`, `sync` nem `db`: o tema é independente de conta e sincronização (RF70b).
- Sem `matchMedia` (jsdom), considerar `systemPrefersDark = true`.
- O fake de `matchMedia` fica em `src/test/fake-match-media.ts`, importado só por testes.
- Arquivo ≤ 100 linhas, funções ≤ 30 linhas, sem comentários.
- `state/` fica fora do piso de cobertura, mas entra com testes de integração (regra 1 de `tests.md`).
</rules>

<requirements>
- RF70a: a troca vale na hora, sem recarregar.
- RF70b: não sincroniza; sair da conta ou limpar os dados locais não muda o tema.
- RF70c: falha de armazenamento → escuro; a escolha vale até a página fechar.
- RF70d: em `system`, acompanha o sistema na hora, sem interromper a tela atual.
- RF71a: `theme-color` acompanha todas as trocas.
</requirements>

## Subtarefas

- [x] 6.1 Criar `src/test/fake-match-media.ts` (`MediaQueryList` falso com `dispatch(matches)`).
- [x] 6.2 Criar `src/app/state/theme-store.ts`: signals, `setPreference`, listener de mídia e `apply()` (atributo + meta).
- [x] 6.3 Em `src/app/app.ts`, `inject(ThemeStore)` no construtor.
- [x] 6.4 Escrever `src/app/state/theme-store.test.ts` com TI-T1–T6.
- [x] 6.5 `lint`, `test` e `build`.

## Detalhes de implementação

Ver [techspec.md](techspec.md):
- “Principais interfaces”: bloco `state/theme-store.ts`.
- “Fluxo de dados”, incluindo o parágrafo “Offline e sem conta”.
- “Pontos de integração”: `matchMedia` e `theme-color`.
- “Principais decisões”: `ThemeStore` sem `effect()` e `theme-color` lido do CSS computado.

## Critérios de aceitação relacionados

- CA-T1
- CA-T2
- CA-T3
- CA-T4
- CA-T5
- CA-T6
- CA-T7
- CA-T13

## Testes da tarefa

### Testes de integração

- [x] TI-T1 — Aparelho sem escolha abre em `dark`
- [x] TI-T2 — `setPreference('light')` aplica, grava e persiste
- [x] TI-T3 — `system` acompanha o `change` da mídia nos dois sentidos
- [x] TI-T4 — `dark`/`light` fixos ignoram o `change` da mídia
- [x] TI-T5 — `localStorage` que lança: abre escuro, troca em memória, sem `console.error`
- [x] TI-T6 — `wipeLocalData()` preserva `certamecards.theme`

## Arquivos relevantes

- `src/app/state/theme-store.ts` (novo)
- `src/app/state/theme-store.test.ts` (novo)
- `src/test/fake-match-media.ts` (novo)
- `src/app/app.ts` (modificado)
- Referência: `src/app/state/auth-store.test.ts` (padrão `new Store()`), `src/app/domain/local-data.ts`
