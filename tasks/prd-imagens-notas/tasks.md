# Resumo das tarefas de implementação de Imagens nas Notas

## Tarefas

- [x] 1.0 domain: base local e compressão — `db-types`, Dexie `version(2)`, limites, `Blob` do Node nos testes, `image-errors`, `image-resize`, `image-codec` e `image-compress`
- [x] 2.0 domain: rascunho, salvar e excluir — `gallery-draft`, `card-draft`, `card-save`, `card-images`, exclusão em `cards`/`decks` e `image-labels`
- [x] 3.0 domain: sincronização das imagens — pull de `card_images`, envio em três fases, tombstone por cartão excluído e `local-data`
- [x] 4.0 domain e state: download sob demanda — `image-download`, `ImagePrefetch` e prefetch nas sessões de revisão e reforço
- [x] 5.0 ui e pages: formulário — `image-thumb`, `image-gallery-editor`, `card-form` e aviso “Descartar alterações?”
- [x] 6.0 ui: galeria e visualizador na revisão e no reforço — `viewer-input`, `image-viewer` (panzoom), `image-gallery` e atalhos suspensos
- [x] 7.0 pages: Ajustes — contador de imagens e “N imagens aguardando envio”
- [x] 8.0 Validação final — CI local e os roteiros E2E-18, E2E-I6, E2E-I7, E2E-I8 e E2E-I9
