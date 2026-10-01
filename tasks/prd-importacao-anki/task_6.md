# Tarefa 6.0: pages — tela `/importar` e entradas de navegação

## Visão geral

Monta a tela de importação sobre o serviço da página (tarefa 5). `import.ts/.html` é a moldura, com “Passo N de 4”, “Voltar”, a mensagem de erro e o `@switch` por passo. Cada passo é um subcomponente:
- `import-file`: área de soltar com botão acessível, aviso acima de 300 MB e estado do leitor (RF60p).
- `import-decks`: baralhos de origem, com “Marcar todos”/“Desmarcar todos” e contagens.
- `import-fields`, com um `import-notetype` por tipo: seletores, “Não importar este tipo” e tipo não suportado travado.
- `import-preview`: 3 cartões por tipo, renderizados com `ui/card-face` e marcados como prévia.
- `import-target`: destino existente ou novo, aviso de histórico e mídia, pulados por motivo, duplicados e o botão “Importar N cartões em X”.
- `import-progress`: barra com `role="progressbar"`, `aria-live` a cada 25% e “Cancelar”.
- `import-summary`: criados, duplicados, pulados por motivo, etiquetas descartadas, “Ir para o início” e “Ver cartões”.

Ajustes ganha a seção “Importar do Anki” e “Sem baralho” ganha o link, os dois para `/importar`.

<skills>
### Conformidade com skills

- `angular-developer`: componentes standalone OnPush, `input()`/`output()`, `@if`/`@for`/`@switch`, `inject()`, `<input type="file">` e `<select>` nativos, acessibilidade (rótulos, `role="progressbar"`, `aria-live`).
- `agent-browser`: roteiros E2E-15 e E2E-A1 a E2E-A4, com `upload` de arquivo e capturas em `tasks/prd-importacao-anki/evidences/`.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e as rules em `.agents/rules/`. Pontos relevantes:
- `pages/` não abre o Dexie nem o `sql.js`: tudo passa por `AnkiImportSession`/`AnkiReaderStatus`.
- O mapeador fica em `pages/import/import-notetype`, não em `ui/` (só esta página usa; desvio registrado na TechSpec).
- `.ts` e `.html` ≤ 100 linhas cada; por isso, um subcomponente por passo.
- Escala tipográfica `text-label`/`text-meta`/`text-body`/`text-front`; cores só por token; `text-on-signal` sobre `bg-signal`; nada abaixo de 13 px (`npm run check:type-scale`).
- Áreas de toque ≥ 44 px; avisos com texto, sem depender de cor; números no formato brasileiro (“1.230”).
- UI validada pelos E2E manuais; sem Playwright.
</rules>

<requirements>
- RF60a–RF60c: escolha ou arraste de arquivo, “Lendo o arquivo…”, mensagens de erro e resumo do arquivo.
- RF60d, RF60e: passo de origem (pulado com um só baralho) com contagens e avanço bloqueado sem seleção.
- RF60f–RF60j: mapeamento por tipo, sugestão, lacuna fixa, tipo excluído ou não suportado, aviso de campo repetido.
- RF60k: prévia dos 3 primeiros cartões por tipo, atualizada ao mudar o mapeamento.
- RF60l–RF60n: destino existente (ativo pré-selecionado) ou novo com nome sugerido; sem baralho, só “Novo baralho”; botão com o que vai acontecer.
- RF60o: entrada “Importar do Anki” em Ajustes.
- RF60p: mensagem de conexão, “Tentar de novo” e escolha de arquivo indisponível enquanto o leitor não está pronto.
- RF64b: aviso único de que histórico e mídia não são importados.
- RF65a, RF65c–RF65e: barra e “Cancelar”, pulados e duplicados antes de importar, resumo final com `aria-live` e baralho de destino ativo.
</requirements>

## Subtarefas

- [x] 6.1 Criar `pages/import/import.ts/.html` (moldura, passo, voltar, erro, `providers` dos dois serviços).
- [x] 6.2 Criar `import-file` (arquivo, arraste, aviso de tamanho, estado do leitor) e `import-decks`.
- [x] 6.3 Criar `import-fields`, `import-notetype` e `import-preview`.
- [x] 6.4 Criar `import-target`, `import-progress` e `import-summary`.
- [x] 6.5 Adicionar a seção em `settings.html` e o link em `no-deck.html`.
- [x] 6.6 Executar E2E-15 e E2E-A1 a E2E-A4 com `agent-browser` e salvar as evidências.

## Detalhes de implementação

Ver [techspec.md](techspec.md):
- “Visão dos componentes” (linhas de `pages/` e a nota sobre `ui/anki-field-mapper`) e o diagrama de “Relacionamentos e fluxo de dados”.
- “Modelos de dados”: `FieldMapping`, `SkipReason` (textos de tela), `AnkiImportError` (mensagens), `ImportOutcome` e “Parâmetros fixos” (`LARGE_FILE_BYTES`, `PREVIEW_SIZE`).
- “Testes E2E”: parágrafo de abertura (arquivos usados, `upload`, pacotes sintéticos).
- PRD, “Experiência do usuário”: fluxos e UI/acessibilidade.

## Critérios de aceitação relacionados

- CA-33
- CA-34
- CA-35
- CA-A1
- CA-A2
- CA-A3
- CA-A4
- CA-A6
- CA-A7
- CA-A12
- CA-A14
- CA-A15
- CA-A16

## Testes da tarefa

### Testes E2E

- [x] E2E-15 — importar `.apkg` com lacunas, negrito e etiquetas
- [x] E2E-A1 — pacotes reais do autor
- [x] E2E-A2 — passos de origem, campos e prévia
- [x] E2E-A3 — destino, duplicatas, cancelamento e resumo
- [x] E2E-A4 — começar pelo Anki, sem baralho

## Arquivos relevantes

- `src/app/pages/import/{import,import-file,import-decks,import-fields,import-notetype,import-preview,import-target,import-progress,import-summary}.{ts,html}` (novos)
- `src/app/pages/settings/settings.html`, `src/app/pages/no-deck/no-deck.html` (modificados)
- `src/app/state/anki-{reader-status,import-session}.ts` (tarefa 5)
- `src/app/ui/card-face/*`, `src/app/ui/tag-chips/*` — só leitura
- Referência: `~/Desktop/lingo/src/screens/Import.tsx`, `src/components/{AnkiNotePicker,ImportTarget}.tsx`
- `tasks/prd-importacao-anki/evidences/` (capturas)
