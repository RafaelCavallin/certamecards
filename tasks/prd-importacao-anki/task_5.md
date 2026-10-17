# Tarefa 5.0: build e state — `.wasm` lazy, rota e serviços da página

## Visão geral

Prepara a infraestrutura da tela. No build, o `angular.json` copia o `sql-wasm.wasm` para `/sqljs/`, e o `ngsw-config.json` ganha o grupo lazy `anki-reader`, para o service worker guardar o wasm só depois que alguém abrir a importação. A rota `/importar` entra sem guarda de baralho, para atender a quem tem baralho e a quem não tem. Em `state/` ficam dois serviços com escopo na página. `anki-reader-status.ts` implementa o RF60p: preparo em segundo plano, estado `needs-network`, “Tentar de novo” e nova tentativa automática no evento `online`. `anki-import-session.ts` guarda o passo, a coleção, os baralhos marcados, o mapeamento, o plano, o destino, o progresso e o `AbortController`, e preserva as escolhas ao voltar de passo.

<skills>
### Conformidade com skills

- `angular-developer`: rota com `loadComponent` e `title`, serviços `@Injectable()` com escopo de componente (`providers`), `signal`/`computed`, `DestroyRef` para soltar o listener de `online`, `assets` no `angular.json` e `assetGroups` do `@angular/service-worker`.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e as rules em `.agents/rules/`. Pontos relevantes:
- `state/` só chama `domain/`; nenhum serviço abre o Dexie ou o `sql.js` diretamente.
- Serviços com escopo na página (não `@Service` root): sair de `/importar` descarta o estado.
- Sem RxJS nos serviços; `liveQuery` não é usado.
- O bundle inicial não pode crescer: o leitor só entra por `import()` dinâmico. Conferir no `npm run build` (budget `initial` inalterado).
- `state/` está fora do gate de cobertura; o comportamento é validado pelos E2E da tarefa 6 e pelo E2E-A6 da tarefa 7.
- Arquivos ≤ 100 linhas: se `anki-import-session.ts` passar, separar a transição de passos num módulo puro de `domain/` com teste.
</rules>

<requirements>
- RF60p: preparo do leitor ao abrir a tela; sem rede ou com falha no download, estado `needs-network`, escolha de arquivo indisponível e nova tentativa automática quando a conexão volta.
- RF60m (suporte): a rota atende também a quem não tem baralho.
- RF65a, RF65b (suporte): cancelamento pelo `AbortController`; depois de uma falha, volta ao passo do destino com a mensagem.
- RF65e (suporte): depois do commit, `DeckStore.switchDeck` para o baralho de destino.
- Restrição do PRD “Peso do app”: wasm fora do precache obrigatório (o desvio do JS do leitor no prefetch está registrado na TechSpec).
</requirements>

## Subtarefas

- [x] 5.1 `angular.json`: asset do `sql-wasm.wasm` → `/sqljs/`. `ngsw-config.json`: `assetGroup` `anki-reader` lazy.
- [x] 5.2 `app.routes.ts`: rota `importar` com `title: 'Importar do Anki'` e `loadComponent` de `pages/import/import` (a página pode nascer vazia aqui, para a rota compilar).
- [x] 5.3 Criar `state/anki-reader-status.ts`: `status`, `reader`, `retry()` e o listener de `online` com `DestroyRef`.
- [x] 5.4 Criar `state/anki-import-session.ts`: passos, leitura, seleção, mapeamento, conversão, destino, `run()`/`cancel()`/`back()` e erro.
- [x] 5.5 Rodar `npm run build` e conferir que o `.wasm` está em `dist/…/browser/sqljs/`, que o `ngsw.json` o lista no grupo lazy e que o bundle inicial não cresceu.

## Detalhes de implementação

Ver [techspec.md](techspec.md):
- “Offline e sem conta” (em “Relacionamentos e fluxo de dados”).
- “Principais interfaces”: blocos `state/anki-reader-status.ts` e `state/anki-import-session.ts`.
- “Modelos de dados”: “Build e service worker” e `AnkiImportError` (`reader-unavailable`, `cancelled`).
- “Principais decisões”: “Só o `.wasm` fora do precache”, “Rota `/importar` sem guarda de baralho” e “Estado em serviço de escopo da página”.

## Critérios de aceitação relacionados

- CA-A14
- CA-A15
- CA-A16
- CA-A17

## Testes da tarefa

Esta tarefa não tem casos próprios na TechSpec: `state/` e o build ficam fora do gate de cobertura. Ela é verificada pela subtarefa 5.5 e pelos roteiros E2E-A3, E2E-A4 (tarefa 6) e E2E-A6 (tarefa 7). A lógica testável já está coberta nas tarefas 1 a 4 (TI-A8 cobre a falha e a nova tentativa do leitor).

## Arquivos relevantes

- `src/app/state/anki-reader-status.ts`, `src/app/state/anki-import-session.ts` (novos)
- `src/app/app.routes.ts`, `angular.json`, `ngsw-config.json` (modificados)
- `src/app/domain/anki-*.ts` (tarefas 1 a 4), `src/app/state/deck-store.ts` (`switchDeck`, `decks`) — só leitura
