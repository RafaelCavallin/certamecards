# Tarefa 7.0: pages — seção “Aparência” em Ajustes

## Visão geral

Acrescenta a seção “Aparência” em Ajustes, logo depois de “Conta e sincronização”. É um controle segmentado de três rádios nativos (“Escuro”, “Claro”, “Seguir o sistema”), ligado ao `ThemeStore`. É o único lugar em que o tema é trocado. A tarefa também documenta no `AGENTS.md` os tokens novos e quando usar cada um.

<skills>
### Conformidade com skills

- `angular-developer`: componente standalone OnPush, `inject()`, `@for`, acessibilidade de formulário (rádios nativos em `<fieldset>`/`<legend>`).
- `agent-browser`: E2E-T1 e E2E-T15.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e as rules em `.agents/rules/`. Pontos relevantes:
- O componente fica em `pages/settings/settings-theme.ts` + `.html`, porque só Ajustes o usa (mesmo padrão de `settings-images` e `settings-backup`). Fala com o tema só pelo `ThemeStore`, nunca com o `localStorage`.
- Escala tipográfica: `text-label` no `<legend>`, `text-meta` nas opções. Nenhum tamanho abaixo da escala.
- Segmento marcado com `bg-signal` + `text-on-signal`. Contorno do grupo com `border-edge`. Foco visível no `<label>`.
- Áreas de toque ≥ 44 px (`min-h-11`). “Seguir o sistema” pode quebrar linha a 360 px, sem abreviar.
- Texto de usuário em português; código em inglês. `.ts` e `.html` ≤ 100 linhas cada.
</rules>

<requirements>
- RF70 / RF70a: três opções como escolha única, com a atual marcada; troca na hora; sem atalho no cabeçalho nem no menu ☰.
- PRD, “UI e acessibilidade”: grupo com rótulo acessível, navegável por teclado, foco visível, toque ≥ 44 px, só cores mudam entre os temas.
</requirements>

## Subtarefas

- [x] 7.1 Criar `src/app/pages/settings/settings-theme.ts` + `.html`:
  - `<fieldset>` com `<legend>` “Aparência”;
  - `@for` sobre `THEME_OPTIONS`;
  - `<label>` com `<input type="radio" class="sr-only">`, `[checked]` a partir de `preference()` e `(change)` chamando `setPreference`.
- [x] 7.2 Incluir `<app-settings-theme />` em `settings.html` (nova `<section>` com `border-t border-line`) e o import em `settings.ts`.
- [x] 7.3 Atualizar a seção “Estilo visual” do `AGENTS.md`:
  - os tokens `edge`, `placeholder`/`placeholder-strong`, `scrim` e `heat-0…3`, e a regra de uso de cada um;
  - o bloco claro em `src/styles/theme-light.css`.
- [x] 7.4 `lint`, `check:type-scale` e `build`.
- [x] 7.5 Executar E2E-T1 e E2E-T15 e salvar as evidências.

## Detalhes de implementação

Ver [techspec.md](techspec.md):
- “Visão dos componentes”: linhas `settings-theme` e `settings`.
- “Modelos de dados”: `THEME_OPTIONS`.
- “Principais decisões”: controle segmentado com rádios nativos.

## Critérios de aceitação relacionados

- CA-T1
- CA-T2

## Testes da tarefa

### Testes E2E

- [x] E2E-T1 — Perfil limpo abre no escuro com “Escuro” marcado
- [x] E2E-T15 — Aparência a 360 px e só por teclado: grupo de rádio, setas, foco, ≥ 44 px

## Arquivos relevantes

- `src/app/pages/settings/settings-theme.ts`, `settings-theme.html` (novos)
- `src/app/pages/settings/settings.ts`, `settings.html` (modificados)
- `AGENTS.md` (modificado)
