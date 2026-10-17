# Tarefa 1.0: domain — leitura do pacote

## Visão geral

Abre um `.apkg`/`.colpkg` e devolve uma `AnkiCollection`: tipos de nota (com o tipo `normal`/`cloze`/`image-occlusion`), campos, notas com HTML cru, etiquetas cruas e o baralho de origem de cada nota. `anki-package.ts` abre o ZIP com `fflate`, escolhe a coleção pela prioridade `anki21b` → `anki21` → `anki2` e descompacta o formato novo com `fzstd`. `anki-reader.ts` carrega o `sql.js` (memoizado só no sucesso) e orquestra a leitura. Os módulos de esquema leem o Anki moderno (tabelas + protobuf de `config`) e o legado (JSON em `col`). É o maior risco técnico da entrega, por isso vem primeiro. Inclui o montador de pacotes em memória para os testes e a fixture `anki21b` embutida em base64.

<skills>
### Conformidade com skills

Nenhuma skill específica: é TS puro de `domain/`.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e as rules em `.agents/rules/`. Pontos relevantes:
- `domain/` sem `@angular/*` nem `rxjs`. `fflate`, `fzstd` e `sql.js` são carregados por `import()` dinâmico a partir de `anki-reader.ts`, para ficarem fora do bundle inicial.
- Dados do SQLite e do JSON legado tratados como `unknown` + narrowing, nunca `any`.
- Erros esperados como `AnkiImportError` com `code`, nunca string solta.
- Nenhuma consulta com `ORDER BY`/`GROUP BY`/`WHERE`/`JOIN` em colunas `COLLATE unicase`.
- Comentário só na exceção legítima: o leitor de varint do protobuf.
- Testes sem disco nem rede: pacotes montados em memória e a fixture `anki21b` em base64. O `sql.js` carrega o wasm de `node_modules` via `locateWasm`.
- Arquivos ≤ 100 linhas e funções ≤ 30 linhas: por isso os esquemas moderno e legado ficam em módulos separados.
</rules>

<requirements>
- RF60a: aceitar `.apkg` e `.colpkg` nos formatos `anki2`, `anki21` e `anki21b`, sem o usuário mudar opções de exportação.
- RF60b: arquivo que não é do Anki, corrompido ou sem notas gera `not-anki` ou `no-notes`, sem gravar nada.
- RF60c (suporte): a coleção traz notas, baralhos de origem e tipos de nota para o resumo.
- RF60i (suporte): oclusão de imagem identificada pelo `originalStockKind` 6.
- RF60p (suporte): falha ao carregar o wasm vira `reader-unavailable`, e uma nova tentativa é possível.
</requirements>

## Subtarefas

- [x] 1.1 Instalar `fflate`, `fzstd`, `sql.js` e `@types/sql.js` (dev).
- [x] 1.2 Criar `anki-errors.ts`: `AnkiImportError`, códigos e `ankiErrorMessage`.
- [x] 1.3 Criar `anki-package.ts`: `unpackAnkiPackage` com filtro de entradas, prioridade de coleção e zstd.
- [x] 1.4 Criar `anki-notetype-config.ts`: leitor mínimo de protobuf (campos 1 e 9).
- [x] 1.5 Criar `anki-schema-modern.ts`, `anki-schema-legacy.ts` e `anki-collection.ts` (`readCollection`: notas, baralho por nota por `odid || did`, descarte de notas vazias).
- [x] 1.6 Criar `anki-reader.ts`: `prepareAnkiReader(locateWasm?)` e `readAnkiFile(file, reader)`.
- [x] 1.7 Criar `src/test/anki-builder.ts` (coleções `anki2`/`anki21` em memória) e `scripts/make-anki21b-fixture.mjs`. Gerar a fixture `src/test/anki-fixtures.ts` com os tipos Básico, Omissão de Palavras e Oclusão de Imagem e 2 baralhos.
- [x] 1.8 Escrever TU-A1, TU-A2, TI-A5 e TI-A8.

## Detalhes de implementação

Ver [techspec.md](techspec.md):
- “Resumo” (camadas 1 e 2) e “Principais interfaces”: bloco `domain/anki-package.ts · anki-reader.ts` e `anki-notetype-config.ts`.
- “Regras dos contratos”: os quatro primeiros itens (prioridade das entradas, `finally`, collation `unicase`).
- “Modelos de dados”: `AnkiCollection` (com a degradação sem `col.decks`), `AnkiImportError` e “Parâmetros fixos”.
- “Pontos de integração”: formato do Anki e rede só para o `.wasm`.
- “Abordagem de testes”: parágrafo de abertura (montador, fixture base64, `locateWasm`).

## Critérios de aceitação relacionados

- CA-A1
- CA-A2
- CA-A6
- CA-A17

## Testes da tarefa

### Testes de unidade

- [x] TU-A1 — `unpackAnkiPackage` escolhe a coleção certa
- [x] TU-A2 — `readNotetypeConfig`

### Testes de integração

- [x] TI-A5 — pacote no formato novo (`anki21b`)
- [x] TI-A8 — `prepareAnkiReader` indisponível e nova tentativa

## Arquivos relevantes

- `src/app/domain/anki-{errors,package,notetype-config,schema-modern,schema-legacy,collection,reader}.ts` + `.test.ts` (novos)
- `src/test/anki-builder.ts`, `src/test/anki-fixtures.ts` (novos)
- `scripts/make-anki21b-fixture.mjs` (novo)
- `package.json`, `package-lock.json` (modificados)
- Referência: `~/Desktop/lingo/src/services/ankiImport.ts` e `.test.ts`
