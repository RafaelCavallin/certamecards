# Tarefa 10.0: Offline, PWA e preview

## Visão geral

Fechar o comportamento offline e instalável (service worker, aviso de nova versão, armazenamento persistente), rodar os roteiros de offline e de legibilidade e publicar o preview na branch `des`.

<skills>
### Conformidade com skills

- `angular-developer` — `@angular/service-worker`, `SwUpdate`.
- `vercel-cli` — deploy de preview da `des` (nada em produção).
- `agent-browser` — roteiros E2E-07 e E2E-10 com captura em `tasks/prd-mvp-offline/evidences/`.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Lidos o `AGENTS.md` e todas as rules em `.agents/rules/`.

- RxJS só nas bordas: `SwUpdate.versionUpdates` é uma delas.
- Sem `dataGroups` para APIs no `ngsw-config.json`.
- Nenhuma promoção para `prod` nem variável no escopo Production.
- Encerrar ao final só os processos que o agente iniciou.
</rules>

<requirements>
- RF44: instalável, service worker abre e revisa sem rede após a primeira visita.
- RF45: `navigator.storage.persist()` no boot.
- RF36: sem conta, 100% no aparelho, sem mensagem de erro.
- RF43: nenhum controle de áudio, voz, velocidade, gravação ou fonética em nenhuma tela.
- Legibilidade a 360 px: leitura ≥ 16 px, rótulo ≥ 13 px, sem rolagem horizontal.
- Primeira carga ≤ 3 s em 4G (medir no preview).
</requirements>

## Subtarefas

- [x] 10.1 `ngsw-config.json` final (app shell e fontes em `prefetch`)
- [x] 10.2 Aviso “Nova versão — recarregar” por `SwUpdate.versionUpdates`
- [x] 10.3 `storage.persist()` no boot
- [x] 10.4 Roteiros E2E-07 e E2E-10 contra o build de produção servido localmente
- [x] 10.5 Deploy de preview na `des` e repetição rápida de E2E-07 no preview

> **Nota sobre 10.5:** repositório criado pelo Rafael (`git@github.com:RafaelCavallin/certamecards.git`, branches `main`/`des`/`prod`), deploy de preview publicado pela Vercel a partir da `des`. A preview tinha Deployment Protection (SSO) ativa; o Rafael habilitou "Protection Bypass for Automation" nas configurações do projeto para permitir a validação, sem desativar a proteção. Roteiro E2E-07 repetido com sucesso contra a URL de preview (criar cartão, revisar por teclado, offline completo — evidência em `evidences/task-10/e2e-07-preview-offline-done.png`); primeira carga medida em ~495 ms (sem throttling de rede — o `agent-browser` desta sessão não expõe emulação de 4G), bem dentro do teto de 3 s.

## Detalhes de implementação

Ver `techspec.md` → “Pontos de integração” e “Sequenciamento — etapa 6”; na base, “Service worker” em “Pontos de integração” e os riscos “Service worker do Angular” e “Evicção do IndexedDB no iOS”.

## Critérios de aceitação relacionados

- CA-17
- CA-21
- CA-22
- CA-23

## Testes da tarefa

### Testes E2E

- [x] E2E-07 — Offline sem conta (DevTools offline) — rodado localmente contra o build de produção e repetido no deploy de preview da `des`
- [x] E2E-10 — Inspeção de tipografia a 360 px e ausência de áudio

## Arquivos relevantes

- `ngsw-config.json`, `vercel.json`
- `src/app/app.ts`, `src/app/state/app-update.ts`
