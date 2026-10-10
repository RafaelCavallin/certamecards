# Relatório de QA — Tema claro

As evidências da ferramenta de navegador estão salvas em `tasks/prd-tema-claro/evidences/` (as desta execução, em [evidences/qa/](evidences/qa/README.md)).

## Resumo
- Data: 2026-10-07
- Status: APROVADO
- Total de critérios de aceitação: 15 (CA-38, CA-39 e CA-T1 a CA-T13)
- Critérios de aceitação atendidos: 15
- Bugs encontrados: 0 novos nesta execução (2 encontrados e corrigidos antes do QA, na tarefa 8.0, e reconfirmados aqui)

Ambiente: `npm start -- --port 4233` (dev), build de produção em `localhost:4283` (E2E-17 e E2E-T13), Supabase local para o CA-T3. O Supabase já estava no ar (não foi iniciado por esta execução) e foi mantido. Uma conta de teste foi criada pela UI e removida ao final (o banco voltou a 2074 cartões e 9 usuários).

## Critérios de aceitação verificados
| ID | Critério de aceitação | Casos de teste | Status | Evidência |
|----|-----------------------|----------------|--------|-----------|
| CA-38 | Com “Claro”, recarregar não mostra nenhum quadro com fundo escuro | TU-26, TU-T10, TU-T11, E2E-17 | PASSOU | `evidences/qa/e2e-17/`: 14/14 quadros claros (preferência `light`) e 13/13 (sistema claro); controle escuro 12/12 escuros. CPU 4× e Fast 4G. |
| CA-39 | No claro, todos os textos ≥ 4,5:1 | TU-27, TU-T6, E2E-T9 | PASSOU | `evidences/qa/contraste/`: axe 0 violações; auditoria própria 0 textos < 4,5:1 (390 e 1280 px) |
| CA-T1 | Sem escolha prévia: abre no Escuro, “Escuro” marcado | TU-T1, TU-T2, TI-T1, E2E-T1 | PASSOU | `evidences/qa/fluxo/t1-escuro-1280.png` |
| CA-T2 | Marcar “Claro”: troca na hora, sem recarregar, e as outras telas vêm claras | TI-T2, E2E-T2 | PASSOU | `evidences/qa/fluxo/t2-claro-1280.png`; navegação pelo app por 7 telas com `window.__marker` preservado e `bg` `rgb(247, 246, 251)` em todas; 32 capturas em `evidences/qa/claro/` |
| CA-T3 | Sincronizar, sair e entrar não muda o tema; outro aparelho mantém o dele | TI-T6, E2E-T14 | PASSOU | `evidences/qa/sync/`: A permaneceu `light` em 5 etapas, B permaneceu `dark` com os 24 cartões sincronizados; 0 colunas de tema no schema |
| CA-T4 | Armazenamento bloqueado: abre no Escuro, sem erro; “Claro” vale até a página fechar | TU-T2–T4, TI-T5, E2E-T4 | PASSOU | `evidences/qa/t4/resultado.json`: `dark` ao abrir, `light` ao escolher e ao navegar, `dark` ao recarregar, 0 erros de console |
| CA-T5 | “Seguir o sistema” muda em ≤ 1 s no meio da revisão, no mesmo cartão | TU-26, TI-T3, E2E-T5 | PASSOU | `evidences/qa/sistema/`: 7 ms, sem recarregar, mesmo cartão, resposta ainda revelada |
| CA-T6 | Com Escuro ou Claro fixos, o sistema mudando não altera o tema | TI-T4, E2E-T6 | PASSOU | `evidences/qa/sistema/resultado.json` (`T6`) |
| CA-T7 | A cor da barra do navegador acompanha o tema nos 3 modos | TU-T10, TI-T2, TI-T3, E2E-T7 | PASSOU | `evidences/qa/sistema/resultado.json` (`T7`): 14 de 14 pontos com `theme-color` = `--ink` |
| CA-T8 | Claro: destaque em negrito legível, lacuna `_____`, lacuna revelada com fundo sutil, “Errei”/“Acertei” nas cores de erro e acerto | TU-T6, E2E-T8 | PASSOU | `evidences/qa/fluxo/t8-oculta-390.png`, `t8-revelada-390.png`: destaque 600 em `#8c5b00`; fundo `signal` a 15%; `miss` `#a31c46`, `hit` `#076649` |
| CA-T9 | Claro: anel de foco, bordas de campos e de botões secundários ≥ 3:1 | TU-T7, E2E-T9 | PASSOU | `evidences/qa/contraste/`: 0 de 178 bordas `edge` abaixo de 3:1 (390 e 1280 px); anel de 2 px em `signal` (5,4:1 / 5,8:1) presente em todos os focáveis (`evidences/qa/teclado/`) |
| CA-T10 | Claro: níveis do heatmap distinguíveis e barras da previsão visíveis | TU-T8, E2E-T10 | PASSOU | `evidences/qa/fluxo/t10-progresso-390.png`: 4 níveis `#dcd9ec`/`#a9a6c8`/`#b97a12`/`#6e4700` e 14 barras (13 `edge` e 1 `signal`) |
| CA-T11 | Claro: o diálogo de confirmação se distingue da tela atrás | E2E-T11 | PASSOU | `evidences/qa/fluxo/t11-confirmacao-390.png`: painel branco contra o fundo sob o véu, 2,63:1 |
| CA-T12 | No Escuro, todas as telas iguais às da Fase 1 | TU-T9, E2E-T12 | PASSOU | `evidences/qa/escuro/` contra `baseline-dark/`: 25 de 32 idênticas, e as 7 restantes explicadas abaixo. `ajustes` sem a seção Aparência é idêntico à linha de base nas duas larguras (`evidences/qa/ajustes-sem-aparencia/`) |
| CA-T13 | Offline e sem conta: os 3 modos funcionam e persistem ao recarregar | TU-T3, TI-T2, E2E-T13 | PASSOU | `evidences/qa/offline/resultado.txt`: 3 modos com a rede cortada e 2 com o servidor encerrado |

### As 7 capturas do escuro que não são idênticas (CA-T12)
| Captura | Diferença | Explicação |
|---|---|---|
| `ajustes-360`, `ajustes-1280` | tamanho maior | Ganharam a seção Aparência (a funcionalidade). Com a seção escondida por CSS, as duas ficam **idênticas** à linha de base. |
| `progresso-360`, `progresso-1280` | altura de algumas barras da previsão | O seed usa vencimentos relativos a “agora” e a baseline foi tirada ~3 h antes, então cartões mudaram de dia. O conjunto de cores é idêntico (0 cores exclusivas de cada lado). |
| `foco-botao-360` | 287 px | O script de captura não esperava a transição de 150 ms do `outline-color`. Já documentado em `after-dark/README.md`. |
| `menu-hamburguer-360`, `revisao-revelada-360` | 1 px cada | Anti-aliasing do texto, na mesma posição das comparações anteriores. |

## Testes E2E executados
| ID | Fluxo | Resultado | Observações |
|----|-------|-----------|-------------|
| E2E-T0 / T12 | Escuro contra a linha de base | PASSOU | Ver tabela acima. |
| E2E-T1 | Perfil limpo abre escuro | PASSOU | |
| E2E-T2 | Trocar para Claro no app e navegar | PASSOU | 7 telas pelo app sem recarregar; as demais pelas 32 capturas. |
| E2E-17 | Recarregar com CPU/rede limitadas | PASSOU | Build de produção; 3 cenários. |
| E2E-T4 | Armazenamento bloqueado | PASSOU | Plano B da TechSpec (getter de `localStorage` lançando via CDP). |
| E2E-T5 | Sistema mudando na revisão | PASSOU | 7 ms. |
| E2E-T6 | Modos fixos ignoram o sistema | PASSOU | |
| E2E-T7 | `theme-color` nos 3 modos | PASSOU | 14 pontos. |
| E2E-T8 | Destaque, lacuna e botões | PASSOU | |
| E2E-T9 | Foco, bordas e textos | PASSOU | axe + auditoria própria + Tab real. |
| E2E-T10 | Heatmap e previsão | PASSOU | |
| E2E-T11 | Diálogo e menu ☰ no claro | PASSOU | Também o seletor, “Estudar só…” e a edição na revisão. |
| E2E-T13 | Offline sem conta | PASSOU | Service worker registrado à mão no navegador de teste (ver observações). |
| E2E-T14 | Conta e sync, dois aparelhos | PASSOU | |
| E2E-T15 | Aparência a 360 px e por teclado | PASSOU | Executado na tarefa 7.0 (`evidences/aparencia/`); reconfirmado aqui pelo Tab real (o grupo de rádio entra na ordem de foco) e pelos 44 px de altura. |

## Testes automatizados e cobertura
| Camada | ID | Resultado | Validação/comando | Observações |
|--------|----|-----------|-------------------|------------|
| Unidade | TU-26, TU-T1–T4 | PASSOU | `npm run test:coverage` | `theme.test.ts`, 23 casos |
| Unidade | TU-27, TU-T6–T9 | PASSOU | idem | `theme-palette.test.ts`, 44 casos, lê os CSS reais |
| Unidade | TU-T10, TU-T11 | PASSOU | idem | `theme-boot.test.ts`, executa o script do `index.html` |
| Unidade | (regressão do BUG-01) | PASSOU | idem | `sync-storage.test.ts`, 11 casos |
| Integração | TI-T1–T6 | PASSOU | idem | `theme-store.test.ts`, 8 casos |
| Integração | (App inicializa o tema) | PASSOU | idem | `sync-startup.test.ts`, 2 casos |
| Lint | — | PASSOU | `npm run lint` | |
| Escala tipográfica | — | PASSOU | `npm run check:type-scale` | |
| Build | — | PASSOU | `npm run build` | Só o aviso de orçamento do bundle inicial, anterior a esta entrega. |

- Total: 776 testes em 108 arquivos, todos passando (101 deles são os desta entrega).
- Cobertura: 98,19% de linhas, 92,35% de ramos, 98,45% de funções em `src/app/domain/**` (piso: 80%). `pages/`, `ui/` e `state/` ficam fora do gate por decisão do projeto e foram validados pelos roteiros E2E.

## Acessibilidade
Verificado em 12 telas (Início, Cartões, Novo cartão, Editar cartão, Progresso, Ajustes, Conta, Difíceis, Etiquetas, Backup, Importar, Revisão) mais 5 overlays, em claro 390 e 1280 px e escuro 390 px (`evidences/qa/teclado/`, `evidences/qa/contraste/`).
- [x] Navegação por teclado (Tab, Enter, Esc): todo elemento focável tem indicador de foco visível; os 5 overlays abrem com `Enter`, mantêm o foco dentro e fecham com `Esc`; as setas trocam a opção em Aparência.
- [x] Elementos interativos com rótulos descritivos: nenhum botão ou link sem nome.
- [x] Imagens com `alt`: nenhuma imagem sem o atributo.
- [x] Contraste: textos ≥ 4,5:1 (axe 0 violações e auditoria própria 0 falhas) e bordas de controles ≥ 3:1 no claro.
- [x] Formulários: o grupo Aparência é `<fieldset>`/`<legend>` com rádios rotulados. Ver observação sobre a busca.
- [x] Mensagens de erro: o erro de exclusão do único baralho é legível no claro (`seletor-baralhos-erro-*`).
- [x] Fontes: nenhum texto abaixo de 13 px.

Observações da Fase 1, sem relação com o tema (idênticas nos dois temas, não bloqueiam este QA):
- Início, Novo cartão, Editar cartão e Revisão não têm `h1`.
- A busca de Cartões não tem `<label>` (o nome acessível vem do placeholder, e o axe aceita).
- Os botões `EDITAR`/`EXCLUIR` da lista têm menos de 44 px de altura. As opções de Aparência atendem os 44 px que o PRD pede para elas.
- O axe a 390 px não cobre o menu ☰ (o roteiro só o abre a 360 px); o menu foi coberto pelo teclado a 390 px e pelo axe a 360 px na tarefa 8.0.

## Visual e responsividade
Capturas em 390 px e 1280 px, nos dois temas, com os estados vazio (“Nenhum baralho”, “Novo cartão” em branco), com dados e de erro, mais diálogos e menu (`evidences/qa/claro/`, `evidences/qa/escuro/`). Nenhuma inconsistência de tema: nada ficou escuro no claro, hierarquia, fontes e espaçamento são os mesmos nos dois temas, e o escuro é idêntico ao da Fase 1. O controle de Aparência a 390 px quebra “Seguir o sistema” em duas linhas sem estourar.

## Bugs encontrados e corrigidos
Nenhum bug novo nesta execução. Os dois abaixo foram encontrados na tarefa 8.0 e reconfirmados corrigidos no QA (junto com um terceiro item de teste).

| ID | Descrição | Severidade | Status | Correção | Teste de regressão | Evidência |
|----|-----------|------------|--------|----------|--------------------|-----------|
| BUG-01 | Com o armazenamento bloqueado o app não inicializava: o `SyncStore` lia/gravava `certamecards.lastSync` direto no `localStorage` e o construtor lançava `SecurityError` | Alta | Corrigido | `domain/local-storage.ts` e `domain/sync-storage.ts`, usados pelo `SyncStore` | `sync-storage.test.ts` (falha sem a correção: `readLastSyncAt` com `getItem` que lança) e E2E-T4 | `evidences/qa/t4/`, `evidences/armazenamento-bloqueado/` |
| BUG-02 | Borda dobrada nos campos de marcações no claro (box interno do espelho e do `<textarea>` também em `border-edge`) | Baixa | Corrigido | Box interno voltou para `border-line`; a borda de 3:1 ficou no contêiner | Sem teste automatizável (é visual); coberto pelo TU-T9 (escuro idêntico) e pela captura de Novo/Editar cartão | `evidences/qa/claro/novo-cartao-390.png` |
| (ajuste) | `sync-startup.test.ts` quebrou quando o `App` passou a injetar o `ThemeStore` | Baixa | Corrigido | O teste fornece o store e confere a inicialização | O próprio teste | `sync-startup.test.ts` |

## Conclusão
Os 15 critérios de aceitação estão atendidos, cada um com evidência no navegador e casos de teste associados. Lint, escala tipográfica, 776 testes (cobertura de `domain/` em 98%) e build passam. Nesta execução não surgiu nenhum defeito novo, e o tema escuro permanece idêntico ao da Fase 1 (a única diferença visível em Ajustes é a seção Aparência, comprovada ao escondê-la).

Ressalvas de ambiente, sem impacto na aprovação:
- O registro automático do service worker não apareceu em 45 s no navegador de teste, então o E2E-T13 registrou o mesmo `ngsw-worker.js` à mão. Vale investigar à parte, pois afeta o uso offline em geral.
- O aviso de orçamento do bundle inicial (900 kB contra 500 kB) é anterior a esta entrega.
- As observações de acessibilidade da Fase 1 listadas acima ficam como recomendação para outra entrega.
