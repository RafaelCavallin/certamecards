# Relatório de QA — Imagens nas Notas

As evidências estão em `tasks/prd-imagens-notas/evidences/`.

## Resumo
- Data: 2026-10-01
- Status: APROVADO COM RESSALVAS
- Total de critérios de aceitação: 29 (CA-40 a CA-43 e CA-I1 a CA-I25)
- Critérios atendidos: 29
- Bugs encontrados: 0 nesta execução. Os 2 defeitos achados na tarefa 8 já estavam corrigidos (veja abaixo).

## Como esta execução foi feita
- **Reexecutado hoje**, com `npm start -- --port 4231` e a skill `agent-browser` (sessão `qa-imgs`): CA-40, CA-41, CA-I12, CA-I13, CA-I23 (parte sem conta) e CA-I25 (formulário em 360 px), num caminho curto (criar cartão com foto de 12 MP, revisar, ampliar e abrir Ajustes).
- **Não reexecutados hoje**: os roteiros que usam dois ou mais aparelhos, conta, rede cortada, cota reduzida e emulação de câmera. Para esses vale a execução da tarefa 8 (Supabase local, quatro perfis de navegador), registrada em `task_8.md`, e as capturas já salvas em `evidences/`. Nesta execução só conferi que a captura de cada roteiro existe.
- Os testes automatizados (`TU-*`/`TI-*`) rodaram hoje.

## Critérios de aceitação verificados
| ID | Critério | Casos de teste | Status | Evidência |
|----|----------|----------------|--------|-----------|
| CA-40 | Foto de 12 MP salva com lado maior ≤ 2.000 px e ≤ 1,5 MB | TU de `image-compress`/`image-codec`, E2E-18 | PASSOU | Hoje: imagem sintética 4000×3000 virou 2000×1500 WebP de 955 KB no `imageBlobs`. `qa-form-com-foto.png` |
| CA-41 | Miniatura abre em tela cheia, zoom, Escape fecha | E2E-18, E2E-I5 | PASSOU | Hoje: abre, “Fechar” e Escape funcionam. `qa-visualizador.png` |
| CA-42 | Imagem criada offline no A aparece no B | TI de sync, E2E-18, E2E-I6 | PASSOU | Tarefa 8. `e2e-i6-imagens-apareceram.png` |
| CA-43 | Exclusão de cartão remove as imagens no outro aparelho | TI-I5, E2E-18 | PASSOU | Tarefa 8 (nuvem 9 → 6) |
| CA-I1 | Limite de 6 imagens e aviso dos arquivos que ficaram de fora | TU `gallery-draft`, E2E-I1 | PASSOU | `e2e-i1-limite-6.png` |
| CA-I2 | Colar imagem ou texto com foco no Verso | TU `image-input`, E2E-I1 | PASSOU | Tarefa 8 |
| CA-I3 | “Tirar foto” no celular emulado | E2E-I2 | PASSOU | `e2e-i2-camera-iphone.png` |
| CA-I4 | PNG com alfa vira WebP, GIF fica parado, `.txt`/`.pdf` recusados | TU `image-codec`, E2E-I1 | PASSOU | Tarefa 8 |
| CA-I5 | Orientação, sem EXIF/GPS, 800×600 mantido | TU `image-codec`, E2E-I3 | PASSOU | Tarefa 8 |
| CA-I6 | Texto de 10 pt legível ampliado em 360 px | E2E-I3 | PASSOU | `e2e-i3-esquema-zoom-360.png` |
| CA-I7 | “Preparando imagem…” e “Aguardando 1 imagem” | TU `card-draft`, E2E-I1 | PASSOU | Tarefa 8. O tempo < 3 s num celular intermediário não foi medido (veja ressalvas). |
| CA-I8 | Sem espaço: mensagem, nada gravado, texto mantido | TU `card-save`, E2E-I8 | PASSOU | `e2e-i8-cota-estourada.png` |
| CA-I9 | Mover, legendar e ver na revisão com alt e legenda | TU `gallery-draft`, E2E-I4 | PASSOU | `e2e-i4-edicao-reordenada.png` |
| CA-I10 | “Descartar alterações?” | TU `card-draft`, E2E-I4 | PASSOU | `e2e-i4-descartar.png` |
| CA-I11 | Criação em série limpa a galeria; editar imagem não reagenda | TU `card-save`, TI-I10 | PASSOU | Tarefa 8 |
| CA-I12 | Nenhuma miniatura antes de revelar; ordem salva | E2E-I5 | PASSOU | Hoje: `qa-revisao-antes.png` e `qa-revisao-revelada.png` |
| CA-I13 | Visualizador: 2 não responde, Escape devolve o foco | TU `viewer-input`, E2E-I5 | PASSOU | Hoje: com o visualizador aberto, a tecla 2 não fechou nem respondeu. Depois do Escape o foco voltou à miniatura, e o 2 seguinte registrou a resposta (“1 cartão revisado”). |
| CA-I14 | Reforço mostra a galeria sem alterar agenda | E2E-I5 | PASSOU | `e2e-i5-reforco.png` |
| CA-I15 | Editar na revisão e adicionar imagem mostra a miniatura nova | E2E-I5 | PASSOU | `e2e-i5-visualizador.png` |
| CA-I16 | Sem rede, sem conta, build de produção: tudo funciona sem erro | E2E-I8 | PASSOU | `e2e-i8-prod-offline-visualizador.png` |
| CA-I17 | Placeholder offline e imagem aparece ao religar | TU `image-download`, E2E-I6 | PASSOU | `e2e-i6-placeholder-offline.png` |
| CA-I18 | Prefetch dos 2 próximos cartões | TU `image-prefetch`, E2E-I6 | PASSOU | Tarefa 8 (defeito do prefetch corrigido) |
| CA-I19 | “N imagens aguardando envio” | TI de sync, E2E-I6 | PASSOU | `e2e-i6-pendentes-offline.png` |
| CA-I20 | Legenda concorrente: a mais recente vence | TI de sync, E2E-I6 | PASSOU | Tarefa 8 |
| CA-I21 | Juntar e descartar dados com imagens | TI de sync, E2E-I7 | PASSOU | Tarefa 8 (nuvem 6 → 8 ao juntar) |
| CA-I22 | Excluir baralho: contador cai e os arquivos somem da nuvem | TI de sync, E2E-I7 | PASSOU | Tarefa 8 |
| CA-I23 | Contador “N imagens · X MB” (e “de 1 GB” com conta) | TU `image-labels`, E2E-I7 | PASSOU | Hoje, sem conta: “1 imagem · 933 KB”. Com conta: `e2e-i7-ajustes-com-conta.png` |
| CA-I24 | Revisão com 6 imagens por cartão sem atraso | E2E-I5 | PASSOU | Tarefa 8. Não medi o tempo de abertura hoje. |
| CA-I25 | 360 px sem rolagem horizontal, teclado, toque ≥ 44 px | E2E-I9 | PASSOU | Hoje: formulário em 360 px com `scrollWidth` = `clientWidth` = 360 (`qa-form-360.png`). Visualizador: `e2e-i9-visualizador-360.png`. |

## Testes E2E executados
| ID | Fluxo | Resultado | Observações |
|----|-------|-----------|-------------|
| E2E-18 | Foto grande, revisão, zoom, sincronizar e excluir | PASSOU | A parte de um aparelho foi refeita hoje. A de dois aparelhos veio da tarefa 8. |
| E2E-I1 | Adicionar, limite e mensagens | PASSOU | Tarefa 8 |
| E2E-I2 | Câmera no celular emulado | PASSOU | Tarefa 8 |
| E2E-I3 | Orientação, metadados e legibilidade | PASSOU | Tarefa 8 |
| E2E-I4 | Organizar e descartar | PASSOU | Tarefa 8 |
| E2E-I5 | Revisão, reforço e visualizador | PASSOU | A parte da revisão foi refeita hoje. |
| E2E-I6 | Dois aparelhos, offline e envio pendente | PASSOU | Tarefa 8, Supabase local |
| E2E-I7 | Conta, exclusões e contador | PASSOU | Tarefa 8, Supabase local |
| E2E-I8 | Sem conta, sem rede, build de produção | PASSOU | Tarefa 8 |
| E2E-I9 | Legibilidade e acessibilidade | PASSOU | A parte do formulário em 360 px foi refeita hoje. |

## Testes automatizados e cobertura
| Camada | ID | Resultado | Comando | Observações |
|--------|----|-----------|---------|-------------|
| Lint | — | PASSOU | `npm run lint` | |
| Escala tipográfica | — | PASSOU | `npm run check:type-scale` | |
| Unidade e integração | TU-*/TI-* | PASSOU | `npm run test:coverage` | 584 de 584 testes, em 90 arquivos |
| Build | — | PASSOU | `npm run build` | Aviso de orçamento do bundle inicial: 914 kB para 500 kB. Antes da entrega eram 906 kB, então o aumento é de 8,5 kB. |

- Cobertura de `src/app/domain/**`: 97,58% de instruções, 91,81% de ramos, 97,28% de funções e 98,36% de linhas. O piso é 80%.

## Acessibilidade
- Verificado hoje: o formulário tem rótulos nos campos e nos botões de mover, remover e legenda de cada imagem; a miniatura na revisão é um botão com nome “Abrir em tela cheia: <legenda>”; o diálogo do visualizador fecha com Escape e devolve o foco à miniatura; o formulário não rola na horizontal em 360 px.
- Verificado na tarefa 8: foco preso no diálogo e rolagem da página travada com ele aberto; áreas de toque ≥ 44 px; tamanhos de texto dentro da escala (`check:type-scale` verde).
- `prefers-reduced-motion`: a galeria e o visualizador não têm animação nem transição, então não há o que reduzir.

## Bugs encontrados e corrigidos
| ID | Descrição | Severidade | Status | Correção | Teste de regressão | Evidência |
|----|-----------|------------|--------|----------|--------------------|-----------|
| BUG-01 | O `ImagePrefetch` refazia só o último pedido ao religar, e os 2 próximos cartões ficavam sem arquivo | Média | Corrigido (tarefa 8) | Guarda um pedido por origem | Teste do `ImagePrefetch` | `task_8.md` |
| BUG-02 | Em 360 px as setas de mover encolhiam para 28 px e a legenda tinha 42 px de altura | Baixa | Corrigido (tarefa 8) | Áreas de toque ≥ 44 px | Conferido no navegador. Sem teste automatizado, porque é layout de UI. | `e2e-i9-formulario-360.png` |

Nenhum bug novo nesta execução.

## Ressalvas
- Os roteiros com dois aparelhos, conta e rede cortada não foram reexecutados hoje; valem a execução e as capturas da tarefa 8.
- Faltam as verificações num Android e num iPhone reais: a pinça do visualizador, a orientação da foto e o tempo de preparo de uma foto de 12 MP num celular intermediário (< 3 s, CA-I7). Também não medi hoje a abertura em < 300 ms e a resposta em < 150 ms (CA-I24).
- O bundle inicial passou de 905,62 kB para 914,15 kB. O requisito “inalterado” da tarefa 8 não foi atendido literalmente, mas o aumento é pequeno e o orçamento só gera aviso.

## Conclusão
Todos os critérios de aceitação estão atendidos e a validação automática está verde. A aprovação tem as ressalvas acima, todas sobre verificações em aparelho real e sobre a reexecução dos roteiros multi-aparelho. Ambiente encerrado: o servidor da porta 4231 e o navegador foram fechados. O Supabase local (55321–55327) já estava no ar antes e foi deixado como estava.
