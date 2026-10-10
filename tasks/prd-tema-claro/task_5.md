# Tarefa 5.0: Primeira pintura — script inline e CSS bloqueante

## Visão geral

Garante que o tema escolhido aparece já no primeiro quadro, sem nenhum fundo escuro antes do conteúdo:

- um script inline e síncrono no `<head>` do `index.html` lê `certamecards.theme`, resolve com `matchMedia` e define `data-theme` e `meta[name=theme-color]`;
- o build de produção passa a usar `inlineCritical: false`. Sem isso, o Beasties carrega o `styles.css` de forma assíncrona e o CSS crítico embutido não traz a regra `[data-theme='light']`.

<skills>
### Conformidade com skills

- `angular-developer` (CLI tooling): opção `optimization.styles.inlineCritical` do `@angular/build:application`.
- `agent-browser`: E2E-17 (filmstrip da recarga).
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e as rules em `.agents/rules/`. Pontos relevantes:
- O script repete a regra de `resolveTheme` (2.0). A duplicação é aceita pela TechSpec e coberta pelo TU-T10, que executa o script real do `index.html`.
- O script fica em try/catch e não registra nada no console (RF70c).
- Os hex `#14142B` e `#F7F6FB` ficam só no `index.html`, fora de `src/app/`. O TU-T10 confere que batem com `--ink` do CSS.
- O teste mora em `src/app/domain/theme-boot.test.ts` e lê arquivos do repositório com `fs`, sem rede.
- `ng serve` não reproduz o comportamento de produção. O E2E-17 roda contra `npm run build` servido de forma estática.
</rules>

<requirements>
- RF71 / CA-38: tema aplicado antes da primeira pintura.
- RF71a / CA-T7: `theme-color` correto já ao abrir.
- RF70c / CA-T4: armazenamento inacessível → escuro, sem erro.
- Restrição do PRD: a aplicação do tema não pode atrasar de forma perceptível a primeira pintura (meta ≤ 3 s em 4G).
</requirements>

## Subtarefas

- [x] 5.1 Adicionar o script inline ao `<head>` de `src/index.html`, antes do `<link>` de estilos e depois do `meta[name=theme-color]`.
- [x] 5.2 Em `angular.json`, configuração `production`, definir `optimization` com `styles.inlineCritical: false`, mantendo minificação de scripts e estilos.
- [x] 5.3 Escrever `src/app/domain/theme-boot.test.ts` com TU-T10 (7 cenários + hex contra o CSS) e TU-T11.
- [x] 5.4 `npm run build` e conferir no `dist/certamecards/browser/index.html` que não há `media="print"` no stylesheet e que o script continua presente.
- [x] 5.5 Executar o E2E-17. Como o `ThemeStore` ainda não existe, a preferência é gravada no `localStorage` pelo DevTools. Salvar a filmstrip em `evidences/`.

## Detalhes de implementação

Ver [techspec.md](techspec.md):
- “Principais interfaces”: bloco do script inline.
- “Principais decisões”: script inline e `inlineCritical: false`, com as alternativas descartadas.
- “Riscos conhecidos”: script inline e CSP futura.

## Critérios de aceitação relacionados

- CA-38
- CA-T4
- CA-T7

## Testes da tarefa

### Testes de unidade

- [x] TU-T10 — Script inline do `index.html` nos 7 cenários; hex iguais a `--ink` de cada tema
- [x] TU-T11 — `angular.json` de produção com `inlineCritical === false`

### Testes E2E

- [x] E2E-17 — Recarregar com “Claro” (e com “Seguir o sistema” + sistema claro) com CPU e rede limitadas, sem quadro escuro

## Arquivos relevantes

- `src/index.html` (modificado)
- `angular.json` (modificado)
- `src/app/domain/theme-boot.test.ts` (novo)
