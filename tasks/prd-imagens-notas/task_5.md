# Tarefa 5.0: ui e pages — formulário e aviso de descarte

## Visão geral

Leva a galeria para o formulário do cartão, nas três entradas: criação, edição e diálogo de edição da revisão. `ui/image-thumb` mostra um `Blob | null` e cuida do object URL. `ui/image-gallery-editor` é a seção Imagens:
- botões “Adicionar imagem” e, no celular, “Tirar foto”;
- área de soltar;
- lista reordenável (`@angular/cdk/drag-drop`), com itens “Preparando imagem…”;
- avisos `aria-live`;
- itens com mover, remover e legenda.

O `card-form` passa a trabalhar com `CardDraft`. Ele também encaminha imagens coladas, bloqueia salvar enquanto há imagens sendo preparadas e ganha o aviso “Descartar alterações?”, que vale para texto, etiquetas e imagens. O aviso tem três entradas: `canDeactivate` nas rotas, `cancel` (Escape) no diálogo e `beforeunload`. As páginas salvam por `saveNewCard`/`saveCardEdit`. Ao fim desta tarefa, o fluxo de anexar funciona por completo sem conta.

<skills>
### Conformidade com skills

- `angular-developer`: `model()`/`output()`, `CanDeactivateFn` funcional, `HostListener('window:beforeunload')`, `DestroyRef` para revogar URLs, `@angular/cdk/drag-drop` com `cdkDropListOrientation="mixed"`, `<dialog>` nativo.
- `agent-browser`: roteiros E2E-I1–E2E-I4, com `upload` de arquivos e colagem simulada por `eval`.
- `impeccable` (opcional): revisão visual da seção Imagens em 360 px e no desktop.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e as rules em `.agents/rules/`. Pontos relevantes:
- `ui/` e `pages/` não abrem o Dexie: compressão por `compressImage`, gravação por `saveNewCard`/`saveCardEdit` e carga por `loadCardDraft`, todos de `domain/`. `ui/` não importa `pages/`.
- Componentes standalone, OnPush, `input()`/`model()`/`output()`, `inject()`, `@if`/`@for`.
- Arquivos ≤ 100 linhas, `.ts` e `.html` contados separados. O editor se divide em `image-gallery-editor` + `image-editor-item` e, se precisar, `image-add-bar`.
- Cores por token e escala `text-label`/`text-meta`/`text-body`; nada de `text-xs`, hex ou tamanhos arbitrários; `npm run check:type-scale`.
- Áreas de toque ≥ 44 px, rótulos acessíveis com a posição (“Mover a imagem 2 para a esquerda”), `aria-live` nos avisos e erro em `miss` sempre com texto.
- O UI fica fora do gate de cobertura: validação pelos E2E manuais. Toda regra nova vai para `domain/`, com teste (tarefas 1 e 2).
</rules>

<requirements>
- RF73a: “Adicionar imagem” com seleção múltipla (câmera entre as opções no celular) e “Tirar foto” direto na câmera traseira, só no celular.
- RF73b: colar imagem com o foco em qualquer ponto do formulário; texto continua colando texto; texto e imagem juntos → só o texto.
- RF73c: arrastar arquivos para a seção, no desktop.
- RF73d: limite de 6, botões indisponíveis, “6 de 6 imagens” e aviso dos que ficaram de fora.
- RF74a–RF74d: compressão com “Preparando imagem…”, campos editáveis, salvar bloqueado com “Aguardando N imagens” e mensagens de erro.
- RF76a–RF76f: ordenar (botões e arrasto), legendar com contador, remover sem confirmação, mudanças só ao salvar, aviso de descarte (texto incluído), criação em série limpa a galeria, editar não reagenda.
- RF75f (parte): o diálogo de edição da revisão inclui a galeria.
</requirements>

## Subtarefas

- [x] 5.1 `ui/image-thumb`: object URL criado e revogado (troca de blob e `destroy`), `decoding="async"`, quadrado `object-cover`, placeholder “Imagem disponível quando houver conexão” com `text-meta text-muted`.
- [x] 5.2 `ui/image-gallery-editor` (+ `image-editor-item`): inputs de arquivo e câmera (`pointer: coarse`), área de soltar, `cdkDropList`, itens em preparação, contador “N de 6 imagens”, avisos e `output` de pendências.
- [x] 5.3 `ui/confirm-dialog`: `ask(): Promise<boolean>` e `tone` (`danger`/`neutral`), mantendo os usos atuais.
- [x] 5.4 `ui/card-form`: `initial: CardDraft | null`, `onSubmit(draft)`, editor incluído, `(paste)` no host, salvar bloqueado com pendências, `hasChanges()`, `confirmDiscard()`, `beforeunload` e instantâneo atualizado depois de salvar (criação em série e edição não perguntam depois de salvar).
- [x] 5.5 `state/guards.ts` (`confirmLeave`, `LeaveAware`) e `app.routes.ts` (`canDeactivate` em `cartoes/novo` e `cartoes/:id`).
- [x] 5.6 `pages/card-new` e `pages/card-edit`: salvar por `card-save`, `canLeave()`; a edição carrega por `loadCardDraft` e pede ao `ImagePrefetch` as imagens do cartão.
- [x] 5.7 `ui/card-edit-dialog`: carrega por `loadCardDraft`, salva por `saveCardEdit` e intercepta `cancel` com `confirmDiscard()`.
- [x] 5.8 Executar E2E-I1–E2E-I4 com evidências em `evidences/`; `npm run lint` e `npm run check:type-scale`.

## Detalhes de implementação

Ver [techspec.md](techspec.md):
- “Visão dos componentes”: linhas `ui/image-thumb`, `ui/image-gallery-editor` (+ item), `ui/card-form`, `ui/card-edit-dialog`, `ui/confirm-dialog`, `pages/card-new`/`card-edit`, `state/guards.ts`, `app.routes.ts`.
- “Relacionamentos e fluxo de dados”: bloco “Formulário (card-form)”.
- “Principais interfaces”: bloco `state/image-prefetch.ts, state/guards.ts, ui/confirm-dialog`.
- “Modelos de dados”: `GalleryItem`.
- “Principais decisões”: rascunho em memória, reordenar com CDK, aviso de descarte criado nesta entrega.
- “Riscos conhecidos”: colar no celular, vazamento de object URLs, tamanho do editor.

## Critérios de aceitação relacionados

- CA-40
- CA-I1
- CA-I2
- CA-I3
- CA-I4
- CA-I5
- CA-I6
- CA-I7
- CA-I8
- CA-I9
- CA-I10
- CA-I11

## Testes da tarefa

### Testes E2E

- [x] E2E-I1 — Adicionar, limite e mensagens
- [x] E2E-I2 — Câmera no celular emulado
- [x] E2E-I3 — Orientação, metadados, dimensões e legibilidade (a parte da revisão ampliada é refeita na tarefa 6)
- [x] E2E-I4 — Organizar e descartar (a parte que confere a ordem na revisão é concluída na tarefa 6)

A regra desta tarefa já tem teste automatizado nas tarefas 1 e 2 (TU-I6–TU-I9, TU-I12, TI-I8–TI-I10). Se surgir lógica nova aqui, como a decisão de colar texto × imagem, ela vai para `domain/` com teste próprio.

## Arquivos relevantes

- `src/app/ui/image-thumb/*`, `src/app/ui/image-gallery-editor/*` (novos)
- `src/app/ui/{card-form,card-edit-dialog,confirm-dialog}/*` (modificados)
- `src/app/pages/{card-new,card-edit}/*` (modificados)
- `src/app/state/guards.ts`, `src/app/app.routes.ts` (modificados)
- `src/app/domain/{card-draft,card-save,gallery-draft,image-compress,image-labels}.ts` (tarefas 1 e 2); `src/app/state/image-prefetch.ts` (tarefa 4)
- `tasks/prd-imagens-notas/evidences/` (capturas)

> **Ajustes feitos na implementação:**
> - Helpers novos em `domain/` com teste: `gallery-item.ts` (`galleryItemFrom`) e `image-input.ts` (`pastedImages`: só imagem sem texto na área de transferência; `filesFromList`). `ImagePrefetch.request` passou a devolver `Promise<number>` (nunca rejeita), para a edição esperar o download das imagens antes de abrir o formulário.
> - `CardFormFields` ganhou `gallery`, `pending` e os contadores/`ready` (saíram de `card-form.ts`, que ficou com 99 linhas); `resetTexts()` virou `reset()`.
> - Detecção de celular para o botão “Tirar foto”: `(pointer: coarse), (hover: none)`. Só `pointer: coarse` não bastou na emulação do agent-browser (que não liga o toque, mas reporta `hover: none`), e continua falso em notebook com tela de toque.
> - **Defeito achado no E2E e corrigido:** depois de cancelar um “voltar” pelo guard, o Angular só substituía a entrada do histórico (`canceledNavigationResolution: 'replace'`), e o segundo “← Voltar” pulava a página anterior ao Cartões. `app.config.ts` agora usa `withRouterConfig({ canceledNavigationResolution: 'computed' })`. Isso vale para as duas rotas com guard de saída.
> - `card-edit` e `card-edit-dialog` esperam `ImagePrefetch.request([cardId])` antes de carregar o rascunho. Sem rede ou sem conta, a espera é imediata.
> - `confirm-dialog` ganhou `cancelLabel` e `tone` além do `ask()`.
> - Medições no desktop (Chrome headless): foto 12 MP típica 391 ms, esquema 264 ms, pior caso (ruído de 11,6 MB) 2,1 s. O critério de < 3 s num celular intermediário segue pendente de teste em aparelho real.
> - Evidências em `evidences/`: `e2e-i1-limite-6`, `e2e-i2-camera-iphone`, `e2e-i4-edicao-reordenada`, `e2e-i4-descartar`.
> - O agent-browser aceita `beforeunload` sozinho, então o aviso nativo ao recarregar/fechar a aba não foi exercitado visualmente; o `beforeunload` só chama `preventDefault()` com `hasChanges()` verdadeiro (coberto pela lógica de `hasDraftChanges`).
