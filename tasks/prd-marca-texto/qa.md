# Relatório de QA — Marca-texto com 3 cores

As evidências da ferramenta de navegador estão em `tasks/prd-marca-texto/evidences/` (arquivos `qa-*.png` desta rodada e `e2e0*.png` da tarefa 7.0).

## Resumo
- Data: 2026-11-27
- Status: APROVADO (com a decisão registrada abaixo sobre a altura da barra no celular)
- Total de critérios de aceitação: 21 (CA-47, CA-48 e CA-M1 a CA-M19)
- Critérios de aceitação atendidos: 21
- Bugs encontrados: 2 (1 corrigido com teste de regressão, 1 resolvido por decisão do Rafael com ajuste do PRD)

## Ambiente
- App: `npm start -- --port 4252` (pid 99306), sem variáveis do Supabase. Navegador: `agent-browser`, sessão `qa-mt`, banco local novo (IndexedDB da origem da porta 4252). Viewports de 1280, 768, 640, 600, 520, 430, 390 e 360 px.
- Conta e sincronização: E2E-07 rodou na tarefa 7.0 contra o `certamecards-dev`, com o usuário `qa-20261127-0826@example.com`, na porta 4251. Nesta rodada nenhum usuário novo foi criado.
- Dados de teste: cartões semeados no IndexedDB por script do scratchpad (`seed.js`), o `.apkg` e os backups gerados pelos scripts descartáveis `gen.mjs`.
- Ao final, o servidor da 4252 foi encerrado, o navegador fechado e a porta liberada.

## Critérios de aceitação verificados
| ID | Critério de aceitação | Casos de teste | Status | Evidência |
|----|-----------------------|----------------|--------|-----------|
| CA-47 | Três cores com um toque; a Frente mostra o marca-texto antes de revelar | TU-03, E2E-01, E2E-03 | PASSOU | `qa-02-tres-campos-1280.png`, `qa-05-revisao-frente-1280.png` |
| CA-48 | Contraste do texto e da moldura da lacuna nos dois temas; amarelo distinguível da lacuna | TU-27, TU-28, E2E-04 | PASSOU | `qa-13-dark-normal-1280.png`, `qa-13-light-normal-1280.png` |
| CA-M1 | Um toque em amarelo, verde e rosa em Frente, Verso e Notas | TU-03, TU-09, E2E-01 | PASSOU | `qa-02-tres-campos-1280.png` (rosa na Frente, verde no Verso, amarelo nas Notas) |
| CA-M2 | Barra da Frente: Ocultar, Destacar e 3 cores; Verso e Notas: sem Ocultar | TU-16, E2E-01 | PASSOU | `qa-01-frente-selecao-1280.png` (a árvore de acessibilidade do Verso não tem “Ocultar”) |
| CA-M3 | Seleção que toca um marca-texto mostra as ações dele e não deixa aplicar segunda marca | TU-07, TU-08, E2E-01 | PASSOU | Seleção “prazo … dias” sobre “quinze” mostrou só “Trocar para …” e “Tirar marca-texto” |
| CA-M4 | Digitar antes mantém o fundo alinhado; apagar a palavra remove a marca | TU-12, TU-13, E2E-02 | PASSOU | `qa-03-digitando-antes-1280.png` |
| CA-M5 | Cursor no marca-texto: trocar e tirar só aquela marca | TU-10, TU-11, E2E-01 | PASSOU | Troca para verde e remoção de “delta” mantiveram as outras marcas (resumo passou de 3 para 2 marca-textos) |
| CA-M6 | Resumo exato e altura da barra igual com e sem seleção | TU-15, TU-16, E2E-01 | PASSOU (≥ 600 px) | `qa-04-resumo-1280.png`; texto “1 lacuna, 2 destaques e 3 marca-textos · toque na marca para desfazer”, 44 px nos dois estados. Em celular, ver BUG-02 |
| CA-M7 | Revisão: Frente antes de revelar, Verso e Notas depois, peso normal e cor principal | E2E-03 | PASSOU | `qa-05-revisao-frente-1280.png`, `qa-06-revisao-revelada-1280.png`; oito `<mark>` com `font-weight: 400` e cor `rgb(237, 235, 255)` (`text`) |
| CA-M8 | Marca-texto na lista, em Difíceis, no reforço e no resumo do reforço | E2E-03 | PASSOU | `qa-10-lista-cartoes-1280.png`, `qa-10-lista-dificeis-1280.png`, `qa-11-reforco-frente-1280.png`, `qa-12-reforco-resumo-1280.png` |
| CA-M9 | Cartão antigo: destaque como antes; lacuna `______` e depois moldura sem fundo; formulário com moldura | TU-01, TU-02, TI-02, E2E-03 | PASSOU | `qa-07-cartao-antigo-frente-1280.png`, `qa-08-cartao-antigo-revelado-1280.png`, `qa-09-form-cartao-antigo-1280.png` (classes `ring-1 ring-signal`, sem `bg-`); abrir o formulário não mudou `dirty` |
| CA-M10 | Contraste ≥ 4,5:1 do texto e ≥ 3:1 da moldura nos dois temas | TU-27, TU-28, E2E-04 | PASSOU | `qa-13-light-normal-1280.png`; `getComputedStyle` no tema claro: fundos `rgb(242, 166, 224)`, `rgb(245, 205, 79)`, `rgb(163, 245, 196)` com texto `rgb(28, 27, 54)` |
| CA-M11 | Três cores distinguíveis nos dois temas, em protanopia e deuteranopia | TU-29, E2E-04 | PASSOU | `qa-13-dark-protan-1280.png`, `qa-13-dark-deutan-1280.png`, `qa-13-light-protan-1280.png`, `qa-13-light-deutan-1280.png` (filtro SVG com as matrizes de Machado; a CLI não tem a emulação nativa do DevTools) |
| CA-M12 | Offline e sem conta: marcar, trocar e tirar; persiste; próxima revisão não muda | TI-01, E2E-06 | PASSOU | `qa-21-offline-tirado-1280.png`; `navigator.onLine === false`, `due`, `reps` e `state` iguais nos três passos, `dirty = 1`, marca presente depois de recarregar |
| CA-M13 | Mesma conta em dois aparelhos: o verde de A aparece em B | TU-17, TU-19, TI-03, E2E-07 | PASSOU | `e2e07-a-marcado-verde.png`, `e2e07-b-lista-sincronizada.png` (tarefa 7.0, `certamecards-dev`), console limpo |
| CA-M14 | Backup, apagar e restaurar mantêm cores e posições; backup antigo restaura | TI-05, TI-06, E2E-08 | PASSOU | `qa-15-restauracao-1280.png`; comparação campo a campo: os dois cartões com marca-texto idênticos; o cartão antigo ganhou só `highlight: []` |
| CA-M15 | Marca desconhecida sobrevive à edição e volta no sync e no backup | TU-02, TU-04, TU-14, TI-04, E2E-01 | PASSOU (após BUG-01) | `qa-18-marca-desconhecida-1280.png`; `strike` deslocado de 0–5 para 6–11, `color: 'blue'` mantida e deslocada, chave `futuro` mantida |
| CA-M16 | Importação do Anki: cores e precedência na prévia e nos cartões | TU-20 a TU-25, TI-07, E2E-08 | PASSOU | `qa-16-importacao-previa-1280.png`, `qa-17-importacao-concluida-1280.png`; gravado: amarelo 0–9, verde, rosa, amarelo (azul), branco e transparente sem marca, “vedado” só verde, lacuna com fundo vira lacuna na Frente e destaque no Verso |
| CA-M17 | Teclado: seleciona, Tab chega às três cores, Enter aplica; nome acessível; ≥ 44 px | E2E-05 | PASSOU | `qa-14-foco-bolinha-verde-1280.png`; Shift+setas → Tab (Ocultar, Destacar, amarelo, verde, rosa) → Shift+Tab → Enter aplicou verde em “teclado”, foco voltou ao campo; botões 44 × 44 px, contorno de foco de 2 px |
| CA-M18 | Leitor de tela indica o trecho marcado na revisão | E2E-05 | PASSOU | A árvore de acessibilidade da revisão lista os `mark` (3 antes de revelar, 8 depois) |
| CA-M19 | 5.000 cartões com marca-texto: lista fluida e resposta ≤ 150 ms | E2E-09 | PASSOU | `qa-19-lista-5000-1280.png`, `qa-20-revisao-5000-1280.png`; resposta média de 29,3 ms e máxima de 34,4 ms (7 amostras); lista com 15.000 `<mark>` a 48 ms/quadro, o mesmo de 44–50 ms/quadro do mesmo conjunto sem marcas |

## Testes E2E executados
| ID | Fluxo | Resultado | Observações |
|----|-------|-----------|-------------|
| E2E-01 | Marcar, trocar e tirar no formulário | PASSOU | 1280 px. Resumo e altura conferidos. |
| E2E-02 | Edição de texto ao redor | PASSOU | Alinhamento conferido na captura; apagar “quinze” removeu a marca. |
| E2E-03 | Revisão, reforço e listas | PASSOU | Os três campos, o cartão antigo, a lista, Difíceis, o reforço e o resumo. |
| E2E-04 | Tema claro e daltonismo | PASSOU | Seis capturas (dois temas × normal, protanopia, deuteranopia). |
| E2E-05 | Teclado e leitor de tela | PASSOU | Ver CA-M17 e CA-M18. |
| E2E-06 | Offline e sem conta | PASSOU | Recarregar sem rede não foi testado: o `ng serve` não tem service worker (validar no preview da `des`). O recarregamento foi feito online. |
| E2E-07 | Sincronização entre dois aparelhos | PASSOU | Executado na tarefa 7.0 (porta 4251, `certamecards-dev`). Só o sentido A → B. |
| E2E-08 | Backup e importação do Anki | PASSOU | Restauração e importação repetidas nesta rodada. |
| E2E-09 | Desempenho com 5.000 cartões | PASSOU | Ver CA-M19. O restore "Substituir" deixa 6 cartões apagados (tombstones) além dos 5.000: o IndexedDB contava 5.006. |

## Testes automatizados e cobertura
| Camada | ID | Resultado | Validação/comando | Observações |
|--------|----|-----------|-------------------|------------|
| Unidade | TU-01 a TU-29 | PASSOU | `npm run test:coverage` | Todos os casos da TechSpec têm teste. |
| Integração | TI-01 a TI-07 | PASSOU | `npm run test:coverage` | Mais o teste de regressão do BUG-01. |
| Lint | — | PASSOU | `npm run lint` | Sem violações. |
| Escala tipográfica | — | PASSOU | `npm run check:type-scale` | Sem violações. |
| Build | — | PASSOU | `npm run build` | Aviso de orçamento do bundle inicial que já existia (920 kB contra 500 kB). |

- Total de testes: 1.053 em 145 arquivos, todos passando.
- Cobertura de `src/app/domain/**`: 98,4% de linhas, 93,52% de ramos, 98,77% de funções (piso de 80%). `pages/`, `ui/` e `state/` estão fora do gate e foram validados pelos fluxos E2E acima.

## Acessibilidade
- [x] Navegação por teclado: Tab percorre Ocultar, Destacar e as três cores sem perder a seleção; Enter aplica; o foco volta ao campo. Esc não se aplica (a barra não abre diálogo).
- [x] Rótulos descritivos: “Marcar em amarelo/verde/rosa” e “Trocar para …” em cada bolinha; “TIRAR MARCA-TEXTO”; cada campo tem rótulo (“FRENTE”, “VERSO”, “NOTAS”) e a dica ou o resumo como descrição.
- [x] Imagens: a funcionalidade não adiciona imagens.
- [x] Contraste: TU-27 e TU-28 medem o texto (≥ 4,5:1) e a moldura (≥ 3:1) nos dois temas; conferido nas cores calculadas do tema claro.
- [x] Formulários com rótulos associados: os três campos têm nome acessível.
- [x] Mensagens de erro: a funcionalidade não adiciona mensagens de erro.
- [x] Tamanho de fonte: menor texto das telas revisadas a 390 px é 14 px; `check:type-scale` passa.
- [x] Semântica: o trecho marcado na revisão usa `<mark>` (papel `mark`).
- [x] Área de toque: bolinhas de 44 × 44 px.

## Visual e responsividade
- 1280 px: formulário, revisão, listas e importação capturados nos dois temas; sem inconsistências.
- 390 px: `qa-22-form-selecao-390.png`, `qa-23-revisao-frente-390.png`, `qa-24-revisao-revelada-390.png`, `qa-25-lista-390.png`. Sem rolagem horizontal. Ver BUG-02 sobre a barra.
- Estados: vazio (cartão novo), com dados (cartões e 5.000), erro (não se aplica à entrega).

## Bugs encontrados e corrigidos
| ID | Descrição | Severidade | Status | Correção | Teste de regressão | Evidência |
|----|-----------|------------|--------|----------|--------------------|-----------|
| BUG-01 | Editar o texto de um cartão pelo formulário descartava chaves de marcas de nível de cartão que esta versão não conhece (ex.: `futuro`). O formulário só carrega as marcas de Frente, Verso e Notas e salva só elas. As chaves dentro de cada campo (`strike`, cor `blue`) já eram preservadas. Contra o CA-M15 e a TU-02 da TechSpec (“no campo e no cartão”). | Média | Corrigido | `keepUnknownMarks` em [card-save.ts](src/app/domain/card-save.ts): ao salvar, as marcas do cartão existente são mescladas com as do formulário e normalizadas, e a comparação de “mudou?” usa o resultado. | `card-save-marks.test.ts`: “mantém a chave de marcas desconhecida do cartão quando o formulário devolve só os três campos” (falha sem a correção, passa com ela) | `qa-18-marca-desconhecida-1280.png`; refeito no navegador depois da correção, com `futuro: {x: 1}` presente |
| BUG-02 | A altura da barra de marcação muda ao selecionar em celular: 44 → 90 px na Frente a 390–430 px e no Verso a 360 px, e 44 → 135 px na Frente a 360 px. As duas pílulas e as três bolinhas de 44 px não cabem em uma linha. A partir de 600 px fica em 44 px. Contra o CA-M6/RF87 como estavam escritos. | Média | Resolvido por decisão do Rafael | Opção “Ajustar o PRD”: CA-M6, RF87, a tarefa 5.0 e o E2E-01 passam a valer a partir de 640 px; abaixo disso as ações quebram linha ao selecionar. Sem mudança de código. | Não se aplica (sem mudança de código); medido em 360, 390, 430, 520, 600, 640, 700, 768 e 1280 px | `qa-22-form-selecao-390.png` |

## Observações (não bloqueiam)
- Recarregar sem rede só se valida no preview da `des` (service worker).
- A lista de cartões renderiza todas as linhas (pré-existente): ~45–50 ms/quadro com 5.000 cartões no build de desenvolvimento, com ou sem marca-texto.
- A deduplicação da importação do Anki ignora o marca-texto (ressalva do `codereview.md`, ainda sem decisão).
- Os 10 erros no console desta sessão (`DatabaseClosedError`, `DexieError`) vieram de apagar o IndexedDB com o app aberto para simular a restauração, e de recarregar com a rede desligada. Nenhum aparece em fluxo normal.
- A emulação de visão usou um filtro SVG com as matrizes de Machado, não a emulação nativa do DevTools, que a CLI não expõe.

## Conclusão
Os 21 critérios de aceitação foram verificados e atendidos. O QA achou duas falhas: uma perda de dados de compatibilidade, corrigida na causa com teste de regressão, e uma divergência entre o CA-M6 e o comportamento em celular, resolvida com o ajuste do PRD que o Rafael escolheu. Lint, `check:type-scale`, 1.053 testes com 98,4% de cobertura no domínio e o build passam. Veredito: **APROVADO**.
