# Especificação técnica — Tema claro

> PRD: [prd.md](prd.md). TechSpec-base: [tasks/produto/techspec.md](../produto/techspec.md). Os tokens, a escala tipográfica e a decisão de ter as cores em variáveis CSS estão na base e não se repetem aqui. Os IDs de teste da base (TU-26, TU-27, E2E-17) foram mantidos. Os casos próprios usam o sufixo `T` (`TU-T*`, `TI-T*`, `E2E-T*`). O Lingo não tem tema claro (só o escuro). Por isso não há código a portar, e esta entrega é nova por inteiro.

## Resumo

O tema é **um atributo `data-theme` no `<html>`**. Os templates continuam usando as mesmas classes (`bg-ink`, `text-signal`…). Um bloco `:root[data-theme='light']` redefine as variáveis que o `@theme inline` já mapeia, e assim a troca é instantânea, só de CSS, sem re-render do Angular. Uma revisão em andamento não perde o cartão nem o estado de revelação (RF70d). A preferência (`dark` | `light` | `system`) fica no `localStorage`, na chave `certamecards.theme` que a base já reservou, com try/catch nas duas pontas. Qualquer falha cai no Escuro (RF70c). A preferência não passa por Dexie, Supabase nem sync.

Para não piscar (CA-38), um **script inline no `<head>` do `index.html`** resolve o tema e define `data-theme` e `meta[name=theme-color]` antes da primeira pintura. Com ele, o build de produção **desliga o `inlineCritical`**: hoje o Beasties embute só o CSS crítico, que perde o seletor `[data-theme='light']` porque nada casa com ele no build, e carrega o `styles.css` de forma assíncrona. É exatamente o quadro escuro que o CA-38 proíbe. Depois do bootstrap, o `ThemeStore` (root, signals) assume: lê a preferência, aplica, escuta `prefers-color-scheme` e grava as trocas feitas em Ajustes. A regra é pura em `domain/theme.ts`. A seção “Aparência” é um controle segmentado com três rádios em `pages/settings/settings-theme`.

A paleta clara da base foi conferida contra os critérios do PRD e precisou de quatro ajustes, todos com **tokens novos cujo valor no escuro reproduz exatamente o visual da Fase 1** (CA-T12):

1. `edge`: borda de campos e de botões secundários, com ≥ 3:1 (CA-T9).
2. `placeholder` e `placeholder-strong`: placeholders com ≥ 4,5:1 no claro.
3. `scrim`: o véu atrás de diálogos e do menu ☰ (RF72c).
4. `heat-0…3`: os níveis do heatmap (RF72b).

`hit` e `miss` foram escurecidos para que “Acertei”/“Errei” passem de 4,5:1 também no hover.

## Arquitetura do sistema

### Visão dos componentes

| Camada | Módulo | Novo/mod. | Papel |
| --- | --- | --- | --- |
| entrada | `src/index.html` | mod. | Script inline síncrono no `<head>`, antes do `<link>` do CSS: lê `certamecards.theme`, resolve com `matchMedia('(prefers-color-scheme: dark)')`, define `data-theme` e o `content` do `meta[name=theme-color]`. Tudo em try/catch; se falhar, nada é feito e o padrão é escuro. |
| entrada | `src/styles.css` | mod. | Tokens novos no `:root` (valores do escuro derivados dos atuais) e mapeamento no `@theme inline`; `@import` do bloco claro. |
| entrada | `src/styles/theme-light.css` | novo | Só `:root[data-theme='light'] { … }` com a paleta clara. Arquivo separado porque `styles.css` já tem 128 linhas. |
| build | `angular.json` | mod. | `production.optimization.styles.inlineCritical: false` (ver Principais decisões). |
| domain | `theme.ts` | novo | Tipos, `THEME_STORAGE_KEY`, `THEME_OPTIONS`, `parseThemePreference`, `resolveTheme`, `readThemePreference`, `writeThemePreference`, `browserStorage`. Sem `@angular/*`. |
| state | `theme-store.ts` | novo | `@Service` root: signals `preference` e `resolved`; `setPreference`; ouve `change` do `MediaQueryList`; aplica `data-theme` e `theme-color` (lido de `--ink` computado). Instanciado no construtor do `App`, como o `SyncStore`. |
| app | `app.ts` | mod. | `inject(ThemeStore)` no construtor. |
| pages | `settings/settings-theme.ts` + `.html` | novo | Seção “Aparência”: `<fieldset>` com `<legend>` e três `<label>` + `<input type="radio" name="theme">` com visual segmentado. |
| pages | `settings/settings.ts`, `settings.html` | mod. | Importa `SettingsTheme`; a seção entra logo depois de “Conta e sincronização”. |
| ui/pages | templates com `border-line` em `<input>`, `<textarea>`, `<select>`, botões e links com aparência de botão (~40 ocorrências em ~25 arquivos) | mod. | `border-line` → `border-edge` só nesses elementos. Divisórias (`border-t`/`border-b` de linhas e seções), painéis e diálogos continuam em `line`. |
| ui/pages | `cards.html`, `markable-field.html` / `tag-input.html`, `image-editor-item.html` | mod. | `placeholder:text-muted/40` → `placeholder:text-placeholder`; `placeholder:text-muted/60` → `placeholder:text-placeholder-strong`. |
| ui/pages | `confirm-dialog`, `card-edit-dialog`, `deck-switcher`, `mobile-nav`, `home/study-filter` | mod. | `backdrop:bg-ink/60` → `backdrop:bg-scrim`. O `image-viewer` continua com `backdrop:bg-viewer`. |
| ui | `heatmap/heatmap.ts` | mod. | Classes de intensidade `fill-line`/`fill-muted`/`fill-signal/50`/`fill-signal` → `fill-heat-0`…`fill-heat-3`. |
| ui | `bar-chart/bar-chart.html` | mod. | Barra comum `bg-line` → `bg-edge` (a destacada continua `bg-signal`). |
| docs | `AGENTS.md` (seção “Estilo visual”) | mod. | Registra `edge`, `placeholder(-strong)`, `scrim`, `heat-0…3` e a regra de quando usar cada um. |

Fora desta lista, nada muda. Ficam como estão: `viewer`/`on-viewer` (o visualizador de imagens é escuro nos dois temas), o manifesto, `text-ink` sobre `bg-miss` no botão de perigo do `confirm-dialog` (6,95:1 no claro, 6,81:1 no escuro) e `color-scheme`. Este último não é declarado hoje e continua sem declaração: declarar `dark` mudaria barras de rolagem e controles nativos do escuro (CA-T12), e `light` é o comportamento padrão.

### Fluxo de dados

```
index.html <head> ── localStorage + matchMedia ──► <html data-theme>, meta theme-color   (antes do CSS)
App() ─ inject(ThemeStore) ─ readThemePreference(browserStorage()) ─► preference (signal)
                              matchMedia change ─────────────────────► systemPrefersDark (signal)
                              resolved = resolveTheme(preference, systemPrefersDark) ─► apply(): data-theme + theme-color
SettingsTheme (rádio) ─ themeStore.setPreference(p) ─ writeThemePreference ─ apply()
CSS: :root[data-theme='light'] redefine --ink, --surface… ─► @theme inline ─► utilitários Tailwind
```

O `apply()` roda no construtor, em `setPreference` e no `change` da mídia, de forma imperativa. Não há `effect()`: o store fica instanciável com `new` nos testes, como o `AuthStore`. A troca não toca em nenhum outro signal, e por isso nenhuma página re-renderiza.

**Offline e sem conta**: nada aqui depende de rede, conta ou Supabase. O script inline vai dentro do `index.html` que o service worker já guarda. O `ThemeStore` não importa `auth`, `sync` nem `db`. `wipeLocalData` e `signOut` só mexem no Dexie e na sessão (conferido: nenhum `localStorage.clear`/`removeItem` no app), e por isso CA-T3 vale sem código extra.

## Design de implementação

### Principais interfaces

```ts
// domain/theme.ts
export type ThemePreference = 'dark' | 'light' | 'system';
export type ResolvedTheme = 'dark' | 'light';
export type ThemeStorage = Pick<Storage, 'getItem' | 'setItem'>;
export const THEME_STORAGE_KEY = 'certamecards.theme';
export const DEFAULT_THEME_PREFERENCE: ThemePreference = 'dark';
export const THEME_OPTIONS: readonly { value: ThemePreference; label: string }[];
export function parseThemePreference(raw: string | null): ThemePreference;
export function resolveTheme(preference: ThemePreference, systemPrefersDark: boolean): ResolvedTheme;
export function browserStorage(): ThemeStorage | null;               // acessar `localStorage` pode lançar
export function readThemePreference(storage: ThemeStorage | null): ThemePreference;
export function writeThemePreference(storage: ThemeStorage | null, preference: ThemePreference): boolean;
```

```ts
// state/theme-store.ts
@Service() export class ThemeStore {
  readonly preference: Signal<ThemePreference>;
  readonly resolved: Signal<ResolvedTheme>;
  setPreference(preference: ThemePreference): void;
}
```

```
index.html, script inline (≤ 10 linhas, ES5, sem dependências)
  try {
    p = localStorage.getItem('certamecards.theme')
    light = p === 'light' || (p === 'system' && !matchMedia('(prefers-color-scheme: dark)').matches)
    se light: html.dataset.theme = 'light'; meta[name=theme-color].content = '#F7F6FB'
  } catch {}   → sem atributo = escuro; o meta já nasce '#14142B'
```

### Modelos de dados

#### `ThemePreference` — preferência guardada no aparelho

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| chave `certamecards.theme` | `'dark' \| 'light' \| 'system'` | não | Ausente, inválida ou ilegível → `'dark'`. Nunca sincroniza. |

```text
localStorage["certamecards.theme"] = "system"
```

> **Degradação (RF70c):** `localStorage` inacessível (o getter lança `SecurityError`) ou `setItem` lançando (quota, modo privado). `browserStorage()` devolve `null`, a leitura dá `'dark'` e `writeThemePreference` devolve `false`. O signal guarda a escolha até a página fechar. Nenhum `console.error`, nenhuma mensagem.

#### `THEME_OPTIONS` — rótulos da seção Aparência

```text
[ { "value": "dark", "label": "Escuro" }, { "value": "light", "label": "Claro" }, { "value": "system", "label": "Seguir o sistema" } ]
```

#### Mapeamento preferência × sistema → tema aplicado

| `preference` | sistema escuro | sistema claro | Ouve `change`? |
| --- | --- | --- | --- |
| `dark` | `dark` | `dark` | não aplica |
| `light` | `light` | `light` | não aplica |
| `system` | `dark` | `light` | sim, em até 1 frame |

O listener fica registrado sempre. Fora de `system`, ele só atualiza `systemPrefersDark`, e o `resolved` não muda.

#### Tokens de cor — paleta final

O escuro é o atual, sem alteração. Os tokens novos têm no escuro valores **derivados** que reproduzem as classes que substituem. A coluna “Claro” substitui a tabela da base onde há divergência (marcadas com ✱). Os contrastes foram calculados (WCAG 2.x) sobre `ink` `#F7F6FB` / `surface` `#FFFFFF`.

| Token | Escuro (`:root`) | Claro | Contraste no claro | Uso |
| --- | --- | --- | --- | --- |
| `ink` | `#14142B` | `#F7F6FB` | — | Fundo, `theme-color` |
| `surface` | `#1F1F3D` | `#FFFFFF` | — | Painéis, diálogos, campos |
| `line` | `#32325C` | `#DCD9EC` | 1,3 / 1,4 (decorativo) | Divisórias, painéis |
| `text` | `#EDEBFF` | `#1C1B36` | 15,5 / 16,7 | |
| `muted` | `#9C9BC4` | `#5E5C82` | 5,9 / 6,3 | |
| `signal` | `#F4B740` | `#8C5B00` | 5,4 / 5,8 | Destaque, foco, ação |
| `on-signal` | `#14142B` | `#FFFFFF` | 5,8 sobre `signal` | |
| `hit` ✱ | `#7CE2C0` | `#076649` | 6,5 / 7,0; 5,6 sobre `hit/10`; 4,8 sobre `hit/20` | “Acertei” |
| `miss` ✱ | `#F2789B` | `#A31C46` | 7,0; 5,9 sobre `miss/10`; 4,9 sobre `miss/20`; `ink` sobre `miss` 7,0 | “Errei”, erros |
| `edge` (novo) | `var(--line)` | `#8A87AD` | 3,2 / 3,4 | Bordas de campos e botões secundários; barras da previsão |
| `placeholder` (novo) | `color-mix(in oklab, var(--muted) 40%, transparent)` | `#6E6C91` | 4,6 / 5,0 | Ex-`muted/40` |
| `placeholder-strong` (novo) | `color-mix(in oklab, var(--muted) 60%, transparent)` | `#6E6C91` | 4,6 / 5,0 | Ex-`muted/60` |
| `scrim` (novo) | `color-mix(in oklab, var(--ink) 60%, transparent)` | `color-mix(in oklab, #1C1B36 40%, transparent)` | `surface` sobre o véu: 2,6 | `::backdrop` |
| `heat-0` (novo) | `var(--line)` | `#DCD9EC` | 1,3 / 1,4 | Dia sem revisão |
| `heat-1` (novo) | `var(--muted)` | `#A9A6C8` | 2,2 / 2,3 | Intensidade baixa |
| `heat-2` (novo) | `color-mix(in oklab, var(--signal) 50%, transparent)` | `#B97A12` | 3,3 / 3,6 | Média |
| `heat-3` (novo) | `var(--signal)` | `#6E4700` | 7,6 / 8,2 | Alta |
| `viewer`, `on-viewer` | `#0B0B17`, `#F4F3FF` | sem mudança | — | Visualizador de imagem, sempre escuro |

Os níveis vizinhos do heatmap claro têm entre si 1,7 / 1,5 / 2,3, com a rampa monótona de lavanda para âmbar. No escuro é 4,5 / 1,9 / 2,8. O dia vazio sobre o fundo fica em 1,3–1,4, a mesma ordem do escuro (1,3–1,5).

O contraste não pode piorar, e estes pares derivados também precisam passar no claro: `text` sobre `signal/15` (lacuna revelada) 13,5. `signal` sobre `signal/10` (lacuna no formulário) 5,1. Foco `signal` sobre `ink`/`surface` 5,4/5,8 (≥ 3).

`text-ink` sobre `bg-miss` funciona nos dois temas porque `ink` inverte junto com `miss`. Fica como está, e o par entra no TU-T6.

## Pontos de integração

Não há serviço externo. Só APIs do navegador:

- `localStorage`: o próprio getter pode lançar. Todo acesso passa por `browserStorage()` dentro de try/catch.
- `window.matchMedia('(prefers-color-scheme: dark)')`, com `addEventListener('change')`. Navegadores sem `matchMedia` (só testes jsdom) → `systemPrefersDark = true`.
- `<meta name="theme-color">`: o `ThemeStore` atualiza o `content` com `getComputedStyle(documentElement).getPropertyValue('--ink')`, lido depois de trocar o atributo. Isso evita hex em `src/app/`, que o `check:type-scale` barra, e mantém uma só fonte da verdade. Só o script inline do `index.html` repete os dois hex, e o TU-T10 confere que eles batem com o CSS. A barra de status do app instalado no iOS não muda em tempo de execução (limitação do sistema, RF71a “onde o sistema permitir”).

## Abordagem de testes

Vitest em jsdom (`vitest.config.ts` já inclui `domain/**`, `state/**` e `scripts/**`). `matchMedia` é um fake em `src/test/` com `dispatch(matches)`. `localStorage` é o do jsdom ou um fake que lança. Helpers só de teste, em `src/test/`: `contrast.ts` (`contrastRatio`, `blendOver`) e `theme-tokens.ts`, que lê `styles.css` + `styles/theme-light.css` com `fs` e devolve o mapa de variáveis de cada tema, resolvendo `var()` e `color-mix(... N%, transparent)` como composição sobre o fundo. Cobertura: só `domain/theme.ts` conta no piso de 80%.

### Testes de unidade

| ID | Nome do caso de teste | Critérios de aceitação | Resultado esperado |
| --- | --- | --- | --- |
| TU-26 | `resolveTheme` nas 6 combinações (3 preferências × sistema escuro/claro) | CA-38, CA-T5, CA-T6 | Igual à tabela de mapeamento. |
| TU-T1 | `parseThemePreference` com `'dark'`, `'light'`, `'system'`, `null`, `''`, `'LIGHT'`, `'sepia'` | CA-T1 | Válidos passam. Todo o resto vira `'dark'`. |
| TU-T2 | `readThemePreference` com storage `null`, vazio, válido e com `getItem` que lança | CA-T1, CA-T4 | `'dark'` nos casos de falha, sem lançar. |
| TU-T3 | `writeThemePreference` com `setItem` ok, com `setItem` que lança e com storage `null` | CA-T4, CA-T13 | `true` / `false` / `false`. Nunca lança. Grava na chave `certamecards.theme`. |
| TU-T4 | `browserStorage` com o getter de `window.localStorage` lançando `SecurityError` | CA-T4 | `null`. |
| TU-27 | Contraste dos tokens de texto do claro (`text`, `muted`, `signal`, `hit`, `miss`) sobre `ink` e `surface` | CA-39 | Todos ≥ 4,5. |
| TU-T6 | Pares compostos do claro: `hit`/`miss` sobre `/10` e `/20` (sobre `ink`), `on-signal` sobre `signal`, `ink` sobre `miss`, `text` sobre `signal/15`, `signal` sobre `signal/10`, `placeholder(-strong)` sobre `ink`/`surface` | CA-39, CA-T8 | Todos ≥ 4,5. |
| TU-T7 | Não-texto do claro: `edge` e `signal` (anel de foco) sobre `ink` e `surface`; `edge` (barra) sobre `ink` | CA-T9, CA-T10 | Todos ≥ 3. |
| TU-T8 | Rampa do heatmap claro | CA-T10 | Vizinhos ≥ 1,5 entre si. `heat-0` ≥ 1,25 sobre `ink` e `surface`. |
| TU-T9 | O escuro não mudou: os valores resolvidos do `:root` batem com os da Fase 1, e cada token novo resolve igual à classe que substituiu (`edge`≡`line`, `scrim`≡`ink` 60%, `heat-2`≡`signal` 50%…) | CA-T12 | Igualdade exata. |
| TU-T10 | Script inline do `index.html` executado (`new Function`) com fakes de `localStorage`/`matchMedia`/`document` em 7 cenários: 3 preferências × sistema, inválido, storage que lança | CA-38, CA-T4, CA-T7 | `data-theme` e `theme-color` corretos. Nada lança. Os hex do script são iguais a `--ink` de cada tema no CSS. |
| TU-T11 | `angular.json` de produção | CA-38 | `optimization.styles.inlineCritical === false`. |

O TU-T9 é a rede de segurança para o “sem regressão” no nível dos tokens. O nível de pixels fica com o E2E-T12. Como os helpers resolvem `color-mix` da mesma forma nos dois lados da comparação, o teste não depende do motor de cor do navegador.

### Testes de integração

`state/theme-store.test.ts`, com o store criado por `new ThemeStore()` (como `auth-store.test.ts`) sobre o `document` do jsdom.

| ID | Nome do caso de teste | Critérios de aceitação | Resultado esperado |
| --- | --- | --- | --- |
| TI-T1 | Aparelho sem escolha | CA-T1 | `preference() === 'dark'`, `data-theme="dark"`, `theme-color` = `--ink` computado. |
| TI-T2 | `setPreference('light')` | CA-T2, CA-T7, CA-T13 | Atributo e meta trocam na mesma chamada. `localStorage` = `'light'`. Um store novo lê `'light'`. |
| TI-T3 | `system` + `dispatch(false)` do fake de mídia, e depois `dispatch(true)` | CA-T5, CA-T7 | `resolved` vai para `light` e volta para `dark` de forma síncrona. Atributo e meta acompanham. |
| TI-T4 | `dark` e `light` fixos + `dispatch` da mídia | CA-T6 | `resolved` e atributo não mudam. |
| TI-T5 | `localStorage` que lança em get e set | CA-T4 | Abre em `dark`. `setPreference('light')` aplica o claro. `console.error` não é chamado. |
| TI-T6 | `wipeLocalData()` com `certamecards.theme = 'light'` gravado | CA-T3 | A chave continua `'light'`. |

### Testes E2E

Roteiros executados à mão no `/executar-qa` com a skill `agent-browser`, com capturas em `tasks/prd-tema-claro/evidences/`. Para mudar o modo do sistema, use a emulação de `prefers-color-scheme` do navegador (CDP `Emulation.setEmulatedMedia`). Os roteiros com recarga offline (E2E-T13) e o de piscar (E2E-17) rodam contra o build de produção servido localmente (`npm run build` + servidor estático de `dist/certamecards/browser`), porque o `ng serve` não liga o service worker nem o `inlineCritical`.

| ID | Nome do caso de teste | Critérios de aceitação | Resultado esperado |
| --- | --- | --- | --- |
| E2E-T0 | **Antes de qualquer mudança**: capturar o escuro das 9 rotas, do seletor de baralhos, do menu ☰, do diálogo de confirmação, do diálogo de edição na revisão e do heatmap/previsão, a 360 px e a 1280 px | CA-T12 | Linha de base em `evidences/baseline-dark/`. |
| E2E-T1 | Perfil limpo → abrir o app → Ajustes | CA-T1 | Fundo escuro. “Escuro” marcado em Aparência. |
| E2E-T2 | Marcar “Claro” → percorrer as 9 rotas, o seletor, o menu ☰ e os dois diálogos | CA-T2, CA-T11 | Troca sem recarregar. Nenhum elemento sobra escuro (exceto o visualizador de imagem). Diálogos separados do fundo pelo véu. |
| E2E-17 | Com “Claro”, recarregar com CPU 4× mais lenta e rede “Fast 4G”, gravando filmstrip/screenshots por quadro; repetir com “Seguir o sistema” + sistema claro | CA-38 | Nenhum quadro com fundo escuro. |
| E2E-T4 | Bloquear o armazenamento do site (configuração de cookies/dados do site do Chromium para `localhost`) → abrir → escolher “Claro” → recarregar | CA-T4 | Abre escuro, sem erro no console. “Claro” vale até recarregar e depois volta ao escuro. |
| E2E-T5 | “Seguir o sistema” + emulação escura → revisão com a resposta revelada → emular claro | CA-T5, CA-T7 | Claro em até 1 s, no mesmo cartão e ainda revelado. `theme-color` = `#F7F6FB`. |
| E2E-T6 | “Escuro” e depois “Claro” fixos + alternar a emulação | CA-T6 | O tema não muda. |
| E2E-T7 | Nos três modos: ler `meta[name=theme-color]` ao abrir, depois de trocar em Ajustes e depois de mudar o sistema | CA-T7 | Sempre igual a `--ink` do tema em uso. |
| E2E-T8 | Claro: revisar um cartão com destaque e lacuna na Frente; revelar; conferir os botões | CA-T8 | Destaque em negrito âmbar-escuro. `_____` antes de revelar, fundo sutil depois. “Errei” rosa, “Acertei” verde. |
| E2E-T9 | Claro: navegar por Tab por Ajustes, Novo cartão e Cartões; medir com o DevTools o anel de foco, as bordas de campos e as dos botões secundários | CA-T9, CA-39 | Anel e bordas ≥ 3:1. Textos amostrados ≥ 4,5:1 (painel de contraste do DevTools). |
| E2E-T10 | Claro: Início e Progresso com histórico de intensidades variadas; previsão com cartões agendados | CA-T10 | Quatro níveis distinguíveis. Dia vazio visível. Barras visíveis. |
| E2E-T11 | Claro: abrir o diálogo de confirmação (excluir cartão) e o menu ☰ | CA-T11 | Véu escurece o fundo. Painel nitidamente destacado. |
| E2E-T12 | Escuro: repetir as capturas do E2E-T0 e comparar | CA-T12 | Sem diferença visual. |
| E2E-T13 | Build de produção, offline (DevTools), sem conta: alternar os três modos e recarregar a cada um | CA-T13 | Troca e persistência funcionam offline. |
| E2E-T14 | Supabase local: “Claro” no perfil A → sincronizar → sair → entrar; perfil B (outro navegador) em “Escuro” entra na mesma conta e sincroniza | CA-T3 | A continua “Claro”, B continua “Escuro”. |
| E2E-T15 | Aparência a 360 px e só por teclado: Tab entra no grupo, setas trocam a opção, foco visível, leitor de acessibilidade (árvore do DevTools) | RF70a, PRD (UI e acessibilidade) | Grupo de rádio com nome “Aparência”. Cada opção ≥ 44 px. “Seguir o sistema” quebra a linha sem cortar. Nenhum texto abaixo de `text-meta`. |

## Sequenciamento do desenvolvimento

### Ordem de construção

1. **Linha de base do escuro (E2E-T0)**: primeiro, porque depois que os tokens mudarem não há mais como capturar o “antes”.
2. **`domain/theme.ts` + TU-T1–T4, TU-26**: regra pura, sem dependências.
3. **Tokens**: `styles.css` (tokens novos no `:root` + `@theme inline`) e `styles/theme-light.css`, com os helpers `src/test/contrast.ts` e `theme-tokens.ts` e os testes TU-27, TU-T6–T9. Os testes de contraste guiam os valores.
4. **Troca de classes nos templates** (`edge`, `placeholder(-strong)`, `scrim`, `heat-*`, barra `bg-edge`): mecânica, validada por `check:type-scale`, `lint` e pelo TU-T9 (escuro idêntico).
5. **Primeira pintura**: script inline no `index.html`, `inlineCritical: false` no `angular.json`, TU-T10/T11.
6. **`state/theme-store.ts`** + `inject` no `App` + TI-T1–T6.
7. **`pages/settings/settings-theme`** e a inclusão em Ajustes.
8. **`AGENTS.md`**: tokens novos na seção “Estilo visual”.
9. **Validação**: `lint`, `check:type-scale`, `test:coverage`, `build`; depois os roteiros E2E (preview da `des` para os offline; Supabase local para E2E-T14).

### Dependências técnicas

- Nenhuma biblioteca nova, migration, RPC, Edge Function nem variável de ambiente.
- Tailwind v4 já instalado: os utilitários `bg-edge`, `fill-heat-2`, `backdrop:bg-scrim`, `placeholder:text-placeholder` nascem do `@theme inline`.
- `::backdrop` herdando variáveis do `:root`: o app já depende disso hoje (`backdrop:bg-ink/60` → `var(--ink)`), então não é um risco novo.

## Monitoramento e observabilidade

Não há telemetria no app, e esta entrega não acrescenta nenhuma. O tema não registra eventos. A falha de armazenamento é silenciosa por requisito (RF70c), sem log. A observação é feita pelos testes TU-T9/TU-T10/TU-T11 no CI e pelo E2E-17 no QA.

## Considerações técnicas

### Principais decisões

- **Atributo + variáveis CSS, não classes por tema nem `dark:` do Tailwind.** Já era a decisão da base: zero mudança nas classes de cor que só trocam de valor, e troca instantânea sem re-render. A variante `dark:` exigiria duplicar cerca de 500 classes.
- **Script inline no `<head>`** em vez de `provideAppInitializer`: o Angular só roda depois de baixar e avaliar o bundle. Antes disso, o fundo já foi pintado. O script tem poucas linhas, não tem dependências e repete a regra de `resolveTheme`. A duplicação é coberta pelo TU-T10, que executa o script real.
- **`inlineCritical: false` em produção.** Com o Beasties, o HTML leva um `<style>` crítico sem a regra `[data-theme='light']`, e o `styles.css` (43 KB) entra com `media="print"`, de forma assíncrona: o corpo seria pintado com `--ink` escuro até a folha chegar. Tornar a folha bloqueante custa um round-trip na primeira visita, que o service worker elimina nas seguintes. Isso está dentro da meta de ≤ 3 s em 4G. Alternativas descartadas:
  - Forçar a regra no CSS crítico com comentários `beasties:include`: o minificador remove os comentários antes do Beasties.
  - Duplicar a paleta clara num `<style>` inline: seria uma segunda fonte da verdade.
- **`theme-color` lido do CSS computado** no `ThemeStore`, para não haver hex em `src/app/` (barrado pelo `check:type-scale`).
- **Tokens novos com valor do escuro derivado** (`var(--line)`, `color-mix(... var(--muted) 40% ...)`), em vez de escurecer `line` globalmente ou mudar o escuro: decisão do Rafael. Bordas de controles ganham contraste sem pesar as divisórias. Placeholders passam de 4,5:1 só no claro. O escuro fica pixel a pixel igual.
- **`ThemeStore` sem `effect()`**: o `apply()` é imperativo nos três gatilhos. O store fica testável com `new` e a ordem das escritas no DOM é previsível.
- **Controle segmentado** na seção Aparência, decisão do Rafael. A implementação usa rádios nativos (`sr-only` dentro de `<label>`) e não `role="radiogroup"` montado à mão. Navegação por setas, nome acessível e estado vêm de graça. O visual usa `has-[:checked]:bg-signal has-[:checked]:text-on-signal`, com foco `has-[:focus-visible]:outline` no `<label>`. As três opções têm `flex-1` e `min-h-11`. “Seguir o sistema” pode quebrar em duas linhas a 360 px, sem abreviar o rótulo do PRD.
- **Sem transição na troca.** Uma transição global de cor custaria pintura em todas as telas. O PRD não pede animação.

### Riscos conhecidos

- **Elemento esquecido no escuro**: uma cor fora dos tokens ou um token usado no papel errado (ex.: `border-line` num campo). Mitigação: a varredura do E2E-T2 em todas as telas e o `check:type-scale`, que já barra hex em templates. O review confere a lista de `border-line` remanescentes em elementos interativos.
- **Regressão sutil no escuro pela troca de classes** (`bg-ink/60` → `bg-scrim`): o Tailwind gera `color-mix(in oklab, var(--color-ink) 60%, transparent)`, e o token reproduz a mesma expressão. O TU-T9 confere os tokens. O E2E-T12 confere os pixels.
- **Script inline e CSP futura**: hoje não há CSP (`vercel.json` só define cache). Se vier uma, o script vai precisar de hash `sha256-…`. Fica registrado.
- **Bloqueio de armazenamento no E2E-T4**: o Chromium bloqueia `localStorage` pela configuração de cookies do site. Se o `agent-browser` não expuser essa configuração, o fallback é injetar antes do carregamento um script que faz o getter de `localStorage` lançar (via CDP `Page.addScriptToEvaluateOnNewDocument`). O relatório registra qual dos dois foi usado.
- **Barra de status no iOS instalado** não acompanha a troca em tempo de execução. Isso é aceito pelo RF71a (“onde o sistema permitir”).

### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e as três rules (`code-standards.md`, `javascript-typescript.md`, `tests.md`).

- **Camadas:** `domain/theme.ts` é TS puro, sem `@angular/*` nem `rxjs`. `state/theme-store.ts` não usa RxJS: o listener de mídia é um `addEventListener` nativo. A página não acessa o `localStorage` direto e passa pelo store, que é estado compartilhado de verdade (o `App` e Ajustes). `ui/` não importa `pages/`.
- **Arquivos ≤ 100 linhas:** o bloco claro vai em `src/styles/theme-light.css`, porque `styles.css` já tem 128 linhas. Funções ≤ 30 linhas, ≤ 3 parâmetros, sem comentários, constantes nomeadas (`THEME_STORAGE_KEY`, `DARK_SCHEME_QUERY`), união de strings em vez de `enum`, exports nomeados, `function` nas funções principais.
- **Estilo visual:** cores sempre por token, nenhum hex em `src/app/`. Texto sobre `bg-signal` usa `text-on-signal` (incluindo o segmento marcado). Nenhum tamanho abaixo da escala: a seção usa `text-label` no `legend` e `text-meta` nas opções.
- **Testes:** todo código entra com teste. O piso de 80% vale em `domain/theme.ts`. O store fica coberto pelos TI-T*. Os helpers ficam em `src/test/`, importados só por `*.test.ts`. Sem Playwright, sem pasta `e2e/`.
- **Sem schema/sync:** nenhuma migration, nada em `sync-rows.ts`, nenhuma variável `NG_APP_*`.

### Conformidade com skills

- `angular-developer`: componente standalone OnPush, `inject()`, signals/`computed`, `@Service` root, `@for` no template, rádios nativos para acessibilidade. Nenhum desvio.
- `agent-browser`: executor dos roteiros `E2E-*`, inclusive emulação de `prefers-color-scheme` e modo offline.
- `supabase` e `vercel-cli`: não se aplicam. Não há banco, função nem variável de ambiente. O deploy segue o fluxo normal `des` → `prod`.

### Arquivos relevantes e dependentes

- Novos: `src/app/domain/theme.ts` (+ `.test.ts`), `src/app/state/theme-store.ts` (+ `.test.ts`), `src/app/pages/settings/settings-theme.ts` + `.html`, `src/styles/theme-light.css`, `src/test/contrast.ts`, `src/test/theme-tokens.ts`, `src/test/fake-match-media.ts`, `src/app/domain/theme-palette.test.ts`, `src/app/domain/theme-boot.test.ts`.
- Modificados:
  - Entrada e configuração: `src/index.html`, `src/styles.css`, `angular.json`, `src/app/app.ts`.
  - Ajustes: `src/app/pages/settings/settings.ts`, `settings.html`.
  - Gráficos: `src/app/ui/heatmap/heatmap.ts`, `src/app/ui/bar-chart/bar-chart.html`.
  - Véu dos diálogos: `src/app/ui/confirm-dialog/confirm-dialog.html`, `card-edit-dialog.html`, `deck-switcher.html`, `mobile-nav.html`, `src/app/pages/home/study-filter.html`.
  - Placeholders: `src/app/pages/cards/cards.html`, `src/app/ui/markable-field/markable-field.html`, `tag-input.html`, `image-gallery-editor/image-editor-item.html`.
  - Templates com `border-line` em controles: `account`, `backup`, `cards/card-row`, `difficult`, `home/difficult-shortcut`, `import/*`, `no-deck`, `reinforce-summary`, `settings*`, `tags/tag-row.ts`, `deck-switcher`, `card-form`, `mark-actions.ts`, `markable-field.ts` e os demais encontrados pela varredura.
  - Documentação: `AGENTS.md`.
- Dependentes, sem alteração: `public/manifest.webmanifest` (fixo, escuro), `ngsw-config.json` (já guarda o `index.html`), `scripts/check-type-scale.mjs`, `src/app/domain/local-data.ts` (TI-T6 garante que não toca na chave).
