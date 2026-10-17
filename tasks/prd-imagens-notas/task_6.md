# Tarefa 6.0: ui — galeria e visualizador na revisão e no reforço

## Visão geral

Mostra as imagens onde o concurseiro estuda. `ui/image-gallery` lê a galeria do cartão por `liveQueryFor`. Ela aparece no `card-face` só depois de revelar, com as miniaturas em espaço reservado, e pede ao `ImagePrefetch` o cartão exibido. Como o reforço usa o mesmo `card-face`, ganha a galeria sem mudança própria. `ui/image-viewer` é o diálogo em tela cheia, com `@panzoom/panzoom` carregado por `import()` dinâmico:
- botões Anterior, Próxima, Ampliar, Reduzir e Fechar;
- legenda e posição “2 / 4”;
- teclas, toque duplo e deslize, decididos pelo `viewer-input.ts` puro;
- foco devolvido à miniatura de origem.

Os atalhos da revisão (Espaço, 1, 2) ficam suspensos enquanto houver `dialog[open]`. O fundo do visualizador ganha os tokens fixos `--viewer`/`--on-viewer`.

<skills>
### Conformidade com skills

- `angular-developer`: `<dialog>` com foco preso e devolvido, `import()` dinâmico, `liveQueryFor` a partir de `input()`, `DestroyRef` para a instância do panzoom.
- `agent-browser`: roteiro E2E-I5, inclusive medição no painel Performance.
- `impeccable` (opcional): revisão visual da galeria e do visualizador, `prefers-reduced-motion`.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e as rules em `.agents/rules/`. Pontos relevantes:
- Leitura reativa só por `state/live-query.ts` (`liveQueryFor`); `ui/` não abre o Dexie diretamente e não importa `pages/`.
- O reforço continua sem gravar nada: a galeria só lê, e o prefetch grava apenas blobs baixados (RF53).
- Cores por token: `viewer`/`on-viewer` novos em `src/styles.css`, mapeados em `@theme inline` e não redefinidos no tema claro; nada de hex nem `bg-black` em template.
- Escala tipográfica do produto; `npm run check:type-scale`.
- A regra de teclas e deslize fica em `domain/viewer-input.ts`, com teste; o componente só a aplica.
- O panzoom fica fora do bundle inicial: conferir no `npm run build`.
</rules>

<requirements>
- RF75a: galeria só depois de revelar, abaixo das Notas (ou do Verso), na ordem salva, com espaço reservado.
- RF75b, RF75c: visualizador em tela cheia, zoom por pinça, roda, toque duplo e botões até 5×, arrasto com zoom, deslize sem zoom, ←/→, +/−, Escape e foco devolvido.
- RF75d: atalhos da revisão inativos com o visualizador aberto; a revisão volta ao estado anterior.
- RF75e: reforço com a mesma galeria, sem gravar nada.
- RF75f: a galeria reflete a edição feita durante a revisão.
- RF77d: placeholder para imagem não baixada, sem bloquear a revisão.
- Acessibilidade: alt = legenda ou “Imagem N de M do cartão”, foco preso, `prefers-reduced-motion`, rolagem da página travada com o diálogo aberto.
</requirements>

## Subtarefas

- [x] 6.1 `domain/viewer-input.ts`: `viewerKeyAction`, `swipeDirection` e `clampIndex`, com TU-I13.
- [x] 6.2 Dependência `@panzoom/panzoom@^4.6` e `ui/image-viewer` (palco com `touch-action: none`, botões desabilitados nas pontas, legenda, posição anunciada).
- [x] 6.3 `ui/image-gallery`: `liveQueryFor(cardId, galleryImages)`, grade de `image-thumb`, `ImagePrefetch.request([cardId])` e abertura do visualizador.
- [x] 6.4 `ui/card-face`: `<app-image-gallery [cardId]>` dentro do bloco `revealed()`.
- [x] 6.5 `pages/review/review.ts`: ignorar teclas quando há `dialog[open]` (cobre também o diálogo de edição).
- [x] 6.6 `src/styles.css`: tokens `--viewer`/`--on-viewer` e `html:has(dialog[open]) { overflow: hidden }`.
- [x] 6.7 Executar E2E-I5 e concluir as partes de revisão de E2E-I3 e E2E-I4, com evidências; `npm run build` para conferir o bundle inicial.

## Detalhes de implementação

Ver [techspec.md](techspec.md):
- “Visão dos componentes”: linhas `viewer-input.ts`, `ui/image-gallery`, `ui/image-viewer`, `ui/card-face`, `pages/review/review.ts`, `src/styles.css`, `deps`.
- “Relacionamentos e fluxo de dados”: bloco “Revisão / reforço”.
- “Modelos de dados”: “Parâmetros fixos” (Visualizador).
- “Principais decisões”: atalhos suspensos por `dialog[open]`, `@panzoom/panzoom`, miniatura = o próprio arquivo, fundo por token fixo.
- “Riscos conhecidos”: pinça × zoom da página no iOS.

## Critérios de aceitação relacionados

- CA-41
- CA-I6
- CA-I9
- CA-I12
- CA-I13
- CA-I14
- CA-I15
- CA-I17
- CA-I24

## Testes da tarefa

### Testes de unidade

- [x] TU-I13 — `viewerKeyAction` e `swipeDirection`

### Testes E2E

- [x] E2E-I5 — Revisão, reforço e visualizador
- [x] E2E-I3 — parte da legibilidade no visualizador ampliado em 360 px
- [x] E2E-I4 — parte que confere a ordem, o alt e a legenda na revisão

## Arquivos relevantes

- `src/app/domain/viewer-input.ts` + `.test.ts` (novos)
- `src/app/ui/image-gallery/*`, `src/app/ui/image-viewer/*` (novos)
- `src/app/ui/card-face/*`, `src/app/pages/review/review.ts`, `src/styles.css` (modificados)
- `package.json`/`package-lock.json` (`@panzoom/panzoom`)
- `src/app/ui/image-thumb/*` (tarefa 5), `src/app/state/{live-query,image-prefetch}.ts`, `src/app/domain/{card-images,image-labels}.ts` — só leitura
- `src/app/pages/reinforce/*` — só leitura (usa `card-face`)

> **Ajustes feitos na implementação:**
> - `viewer-input.ts` ganhou `isZoomed` (limiar 1,01) e `isDoubleTap`. O E2E achou que, depois de um `reset`, o panzoom deixa a escala em `1.0000000467`: comparar `> 1` fazia o toque duplo achar que a imagem já estava ampliada e “reduzir” em vez de ampliar. O botão Reduzir e o deslize usam o mesmo limiar.
> - `modalIsOpen()` (em `review-keys.ts`, com teste) substitui `editDialog().isOpen()` na revisão **e** no reforço: qualquer `dialog[open]` (visualizador, edição ou aviso de descarte) suspende Espaço, 1 e 2.
> - Os gestos saíram para `ui/image-viewer/viewer-gestures.ts` (limite de 100 linhas). O `keydown` do visualizador é um `HostListener` do componente porque o lint de acessibilidade não aceita `(keydown)` num `<dialog>`.
> - `ui/image-thumb` ganhou `framed` (sem borda dentro do visualizador). A miniatura de uma imagem ainda não baixada fica desabilitada e mostra “Imagem disponível quando houver conexão”.
> - A galeria só pede o download (`ImagePrefetch`) quando há uma imagem sem arquivo, para não sobrescrever o pedido “atual + 2 próximos” da sessão.
> - Com o foco em “Fechar”, o Espaço ativa o botão e fecha o visualizador (comportamento nativo de botão); ele não responde ao cartão. `2` e `1` com o visualizador aberto não fazem nada.
> - Medições no desktop: abrir o visualizador 3–13 ms; responder e ver o próximo, 12–54 ms com cartões de 3 a 6 imagens (meta < 150 ms e < 300 ms).
> - Reforço verificado contra o IndexedDB: cartão, logs (5 → 5) e imagens idênticos antes e depois da sessão.
> - O panzoom ficou num chunk lazy de 3,39 kB; o `initial` do bundle não o inclui.
> - Evidências: `e2e-i3-esquema-zoom-360`, `e2e-i5-revisao-revelada`, `e2e-i5-visualizador`, `e2e-i5-reforco`.
