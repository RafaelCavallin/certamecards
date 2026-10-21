# Tarefa 3.0: state e ui — avisos de perda

## Visão geral

Leva a detecção da tarefa 1 para a tela. `StorageHealth` (`@Service()` root) inicializa o marcador, lê a perda pendente e observa o fechamento da conexão. `ui/storage-alert` mostra o aviso bloqueante (só “Recarregar”, sem Esc) e o aviso explicativo (variante com e sem conta, links e “Entendi”). O `App` injeta `StorageHealth` e inclui `<app-storage-alert />`.

<skills>
### Conformidade com skills

- `angular-developer`: `@Service()`, signals, `inject()`, `effect` para `showModal()`, `<dialog>` com `(cancel)`.
- `agent-browser`: roteiros E2E desta tarefa no QA.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e as rules em `.agents/rules/`. Pontos relevantes:
- `ui/storage-alert` não abre o Dexie: recebe tudo de `state/`.
- `app.html` continua ≤ 100 linhas; o diálogo vive no componente novo.
- Cores por token (`backdrop:bg-scrim`, `text-on-signal` sobre `bg-signal`, `border-edge`), escala `text-body`/`text-meta`/`text-label`; áreas de toque ≥ 44 px; foco inicial no botão principal.
- `npm run lint` e `npm run check:type-scale` verdes.
</rules>

<requirements>
- RF79a, RF79b, RF79c: aviso bloqueante sem saída além de “Recarregar”.
- RF80a, RF80b, RF80c, RF80e: aviso explicativo com recuperação e prevenção, variante com conta, dispensável.
</requirements>

## Subtarefas

- [x] 3.1 Criar `src/app/state/storage-health.ts` (`connectionLost`, `lostAt`, `dismissLoss`, `reload`).
- [x] 3.2 Criar `src/app/ui/storage-alert/storage-alert.ts` e `.html` com os dois `<dialog>` e os textos da TechSpec.
- [x] 3.3 Injetar `StorageHealth` em `src/app/app.ts` e incluir `<app-storage-alert />` em `src/app/app.html`.
- [x] 3.4 Rodar `lint`, `check:type-scale`, `test:coverage` e `build`; verificar no navegador o fluxo de perda antes de fechar a tarefa.

## Detalhes de implementação

Ver [techspec.md](techspec.md): linhas `storage-health.ts`, `storage-alert/` e `app` da “Visão dos componentes”, “Relacionamentos e fluxo de dados” (itens 1 e 2) e a tabela “Textos”.

## Critérios de aceitação relacionados

- CA-44
- CA-45
- CA-P01
- CA-P02
- CA-P03
- CA-P08

## Testes da tarefa

### Testes E2E

- [x] E2E-P01 — Perda em uso na revisão
- [x] E2E-P02 — Aviso explicativo e dispensa
- [x] E2E-P03 — Primeiro uso e limpeza total
- [x] E2E-P04 — Instalação anterior à entrega
- [x] E2E-P09 — Atualização em outra aba
- [x] E2E-P10 — Aviso com conta

## Arquivos relevantes

- `src/app/state/storage-health.ts` (novo)
- `src/app/ui/storage-alert/storage-alert.ts`, `storage-alert.html` (novos)
- `src/app/app.ts`, `src/app/app.html`
- `src/app/state/auth-store.ts`
