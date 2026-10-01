# Relatório de revisão de código — Importação do Anki

## Resumo
- Data: 2026-10-01
- Branch: des (commits `4abd211` e `399e217`, mais as correções desta revisão, ainda sem commit)
- Status: APROVADO COM RESSALVAS

A revisão achou um defeito real de comportamento, mais três desvios menores. Os quatro foram corrigidos e revalidados. As ressalvas que restam não bloqueiam e estão em "Recomendações".

## Conformidade com regras
| Regra | Status | Observações |
|------|--------|-------------|
| `code-standards.md` — arquivos ≤ 100 linhas | OK | Conferido com `max-lines`: todo arquivo de produção fica abaixo de 100. Um arquivo de teste tinha 116 linhas (`anki-import.test.ts`); foi dividido em dois. Outros testes do repositório passam de 100 (ex.: `queue.test.ts`, 226), então a regra vale na prática só para o código de produção. |
| `code-standards.md` — funções ≤ 30 linhas, ≤ 3 parâmetros, aninhamento ≤ 3 | OK | `max-lines-per-function`, `max-params` e `max-depth` não acusaram nada em produção. Os avisos que aparecem são só os blocos `describe` dos testes, padrão do repositório. |
| `code-standards.md` — sem linha em branco dentro de função, constantes nomeadas, sem segredo | OK | Varredura sem ocorrências. Constantes: `CONVERT_CHUNK_SIZE`, `INSERT_CHUNK_SIZE`, `LARGE_FILE_BYTES`, `ANKI_INTERNAL_TAGS` etc. |
| `code-standards.md` — nunca inserir comentários | OK | Os comentários que restam estão nas exceções da regra: regex de abertura de lacuna, banco-isca do `anki2` (defeito de terceiros) e memoização da falha do `sql.js` (defeito de terceiros). O de `anki-notetype-config.ts` documenta um formato externo sem especificação; é o mais discutível (ver Recomendações). |
| `javascript-typescript.md` | OK | Sem `any`, `var`, `==`, ternário aninhado, `export default` nem `eslint-disable`. Dados do SQLite e do JSON legado entram como `unknown` e são validados (zod no esquema legado). `let` só onde há reatribuição. Erros como `AnkiImportError`. |
| `tests.md` — todo código novo com teste | OK | Todo módulo novo de `domain/` tem teste no mesmo commit. `state/` e `pages/` ficam fora do gate, por decisão do projeto. |
| `tests.md` — bug corrigido com teste que falha antes | OK com ressalva | O `whitespace-pre-wrap` em `ui/card-face` (RF2) não tem teste automatizado, porque é template fora do gate. Foi validado no navegador (E2E-15). |
| Estrutura de pastas e dependências | OK | `domain/` sem `@angular/*` nem `rxjs`; `pages/` e `state/` não abrem o Dexie nem o `sql.js`; `ui/` não importa `pages/`; `src/test/` só é importado por testes; nenhum `liveQuery` novo; arquivos em kebab-case sem sufixo. |
| Convenções de Angular | OK | Standalone, OnPush, `input()`, `inject()`, `@if`/`@for`/`@switch`, rota com `loadComponent` e `title`, serviços com escopo de página como o `ReinforceSession`. |
| Estilo visual | OK | Só tokens de cor, escala `text-label`/`text-meta`/`text-body`/`text-front`, `text-on-signal` sobre `bg-signal`. `check:type-scale` passa. |
| Regras de domínio | OK | Lacuna só na Frente (`newCardRecord` reaplica `normalizeCardMarks`; testado). Campos FSRS vêm só da inicialização do `ts-fsrs`. Limites vêm de `card-limits.ts`. Etiquetas por `normalizeTags`/`tagKey`. |
| `supabase/migrations/` | OK (não se aplica) | Sem migration, sem coluna nova, sem mudança em `sync_push` nem em `sync-rows`. |

## Aderência à TechSpec
| Decisão Técnica | Implementado | Observações |
|-----------------|--------------|-------------|
| Leitura no navegador: `fflate` + `fzstd` + `sql.js`, coleção `anki21b` → `anki21` → `anki2` | SIM | Ordem corrigida em relação ao Lingo (banco-isca). Provado com os dois pacotes reais. |
| Duas versões de esquema (moderno com protobuf, legado em JSON) e sem consulta com collation `unicase` | SIM | A fixture `anki21b` gerada tem a collation, então uma consulta descuidada falharia nos testes. |
| Conversão por `DOMParser` com lacunas como elementos sentinela | SIM | Saída em texto interpolado, nunca `innerHTML`; o parser não carrega imagens nem executa script. |
| Gravação numa única transação Dexie, com baralho novo dentro dela | SIM | Falha, cancelamento e recarga não deixam nada (TI-12, TI-A1 e E2E-A3). |
| Deduplicação por conteúdo, relida dentro da transação | SIM | |
| `createdAt = now + índice` preserva a ordem do arquivo na fila | SIM | TI-A3. |
| Só o `.wasm` fora do precache (grupo lazy); leitor fora do bundle inicial | SIM, com desvio | O leitor está num chunk lazy porque a rota `/importar` é lazy (conferido no build), não por `import()` dinâmico em `anki-reader.ts` como a TechSpec descrevia. O resultado é o mesmo; o bundle inicial cresceu 3,2 kB. |
| `prepareAnkiReader(locateWasm)` | SIM, com desvio | A assinatura virou `prepareAnkiReader(loadWasm)`: o app baixa e valida o wasm e o entrega como `wasmBinary`, porque o `sql.js` memoiza a falha. Já registrado na TechSpec. |
| Estado em serviços com escopo de página; um subcomponente por passo | SIM | `anki-import-run.ts` foi acrescentado para separar a gravação (registrado na TechSpec). |
| `ui/anki-field-mapper` | NÃO (justificado) | Virou `pages/import/import-notetype`, porque só uma página o usa. Registrado na TechSpec. |

## Tarefas verificadas
| Tarefa | Status | Observações |
|------|--------|-------------|
| 1.0 domain: leitura do pacote | COMPLETA | Código, fixtures e os 4 casos (TU-A1, TU-A2, TI-A5, TI-A8) presentes. |
| 2.0 domain: conversão do conteúdo | COMPLETA | TU-A3 a TU-A9 presentes. |
| 3.0 domain: mapeamento, seleção e plano | COMPLETA | TU-A10, TU-A11, TU-A13, TI-A6 presentes. |
| 4.0 domain: gravação atômica | COMPLETA | TU-A12, TU-A14, TI-12, TI-A1 a TI-A4, TI-A7 presentes. Os volumes dos testes foram reduzidos e registrados na TechSpec. |
| 5.0 build e state | COMPLETA | `.wasm` no `angular.json` e grupo lazy no `ngsw-config.json`; os serviços cumprem o RF60p. |
| 6.0 pages: tela `/importar` | COMPLETA | Sete subcomponentes e as duas entradas de navegação. |
| 7.0 Validação final | COMPLETA | E2E-A5, E2E-A6, E2E-A7 e o tipo do wasm no preview, com evidências em `evidences/medicoes.md`. |

## Testes
- Total de testes: 435 (71 arquivos)
- Passando: 435
- Falhando: 0
- Cobertura: 96,98% de instruções, 90,29% de ramos, 96,5% de funções e 97,91% de linhas em `src/app/domain/**` (meta 80%: atendida)
- `npm run lint`: passa. `npm run check:type-scale`: sem violação. `npm run build`: passa; o aviso de orçamento do bundle inicial (905,73 kB) já existia antes da entrega (902,5 kB).
- Casos E2E não são executados nesta etapa; ficam para o `/executar-qa`.

## Problemas encontrados
| Severidade | Arquivo | Linha | Descrição | Sugestão |
|------------|---------|-------|-----------|----------|
| Média (corrigido) | `pages/import/import.html` | 25-33 | Cada `@case` do `@switch` é uma view própria. Ao passar de `file` para `reading` (e de `fields` para `preparing`), o componente era destruído e recriado. A flag `largeFile` do `ImportFile` se perdia junto, então o aviso "Arquivo grande" (acima de 300 MB) nunca aparecia. | Corrigido: `stageOf()` em `domain/anki-steps.ts` agrupa o passo transitório com a tela, e o `@switch` usa o grupo. Teste unitário acrescentado. Validado no navegador com um arquivo de 301 MB: o aviso aparece durante a leitura. Não reproduzi o defeito antes da correção; a causa é por construção. |
| Baixa (corrigido) | `pages/import/import-fields.html` | 1 | Com um só baralho de origem o passo de origem é pulado, e o resumo do arquivo (notas, baralhos, tipos de nota) do RF60c não aparecia. | Corrigido com `fileSummary()` em `anki-import-text.ts` (com teste), mostrado também no passo de campos. |
| Baixa (corrigido) | `pages/import/import-file.html` | 16 | A área de escolher arquivo não mostrava foco, porque o `<input>` é `sr-only`. O PRD pede foco visível em âmbar. | Corrigido com `focus-within:ring-2 focus-within:ring-signal`. Validado no navegador. |
| Baixa (corrigido) | `domain/anki-import.test.ts` | — | Arquivo de teste com 116 linhas. | Dividido em `anki-import.test.ts` (64) e `anki-import-dedupe.test.ts` (75). |
| Baixa | `domain/anki-package.ts`, `anki-reader.ts` | — | O ZIP é descompactado em memória sem limite de tamanho. Um arquivo malicioso poderia pedir muita memória. | Aceito: o arquivo é escolhido pelo próprio usuário e fica só no aparelho, e o risco de memória já consta na TechSpec com o aviso acima de 300 MB. Se virar problema, ler só a entrada da coleção com `File.slice`. |
| Baixa | `domain/anki-reader.ts` | 9 | O wasm é buscado em `/sqljs/…`, um caminho absoluto. Se o app for hospedado sob um subcaminho, quebra. | Sem ação: o app é servido na raiz (Vercel). Usar `document.baseURI` se isso mudar. |

## Pontos positivos
- A garantia de tudo-ou-nada vem do próprio banco (uma transação), não de código de compensação, e foi provada em três níveis: unidade, integração e navegador (cancelar e recarregar no meio de 10.000 notas).
- A conversão é pura e testável, e a regra "lacuna só na Frente" é reaplicada na entrada de dados, não só confiada à conversão.
- Os testes usam um arquivo `anki21b` real em miniatura (com a collation `unicase`) e os dois pacotes do usuário foram abertos, o que pegou o bug do banco-isca que o leitor do Lingo tem.
- O leitor ficou fora do bundle inicial, e o peso real (o wasm) só é baixado por quem importa.
- Os textos com plural e com regra (duplicatas, pulados) foram para `domain/` com teste, em vez de ficarem em templates.

## Recomendações
- Reduzir o comentário de `anki-notetype-config.ts` ao essencial, ou transformá-lo em constantes de nome mais explícito: a regra proíbe comentários fora de regex e de defeito de terceiros, e ele é o único que documenta só um formato.
- Registrar a página `import` na lista de páginas do `AGENTS.md` (hoje ela não cita `difficult`, `reinforce` nem `import`).
- Se um dia a leitura de pacotes grandes no celular falhar por memória, é o ponto a otimizar primeiro (ver linha de memória acima).
- Um teste automatizado de componente para `card-face` cobriria o `whitespace-pre-wrap`, mas hoje não existe infraestrutura de teste de componente neste projeto; manter a verificação no roteiro do QA (CA-01).

## Conclusão
A implementação segue as regras do projeto e a TechSpec. Os desvios restantes são pequenos e já estão registrados na TechSpec. A revisão achou e corrigiu um defeito real (o aviso de arquivo grande nunca aparecia) e três pontos menores. Lint, type-scale, 435 testes (cobertura de 96,98% no domínio) e build passam depois das correções. **APROVADO COM RESSALVAS**: as ressalvas são recomendações não bloqueantes. As correções desta revisão ainda não foram commitadas.
