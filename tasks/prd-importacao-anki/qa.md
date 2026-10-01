# Relatório de QA — Importação do Anki

As evidências da ferramenta de navegador estão em `tasks/prd-importacao-anki/evidences/`. Os tempos e a primeira passada de roteiros estão em `evidences/medicoes.md`; as capturas desta execução têm o prefixo `qa-`.

## Resumo
- Data: 2026-10-01
- Status: **APROVADO**
- Total de critérios de aceitação: 23 (CA-33 a CA-35 e CA-A1 a CA-A20)
- Critérios de aceitação atendidos: 23
- Bugs encontrados: 1 (corrigido, com teste de regressão)

Ambiente desta execução:
- `npm start -- --port 4220`, com a conta habilitada (o `.env.local` aponta para o Supabase local `127.0.0.1:55321`). Serviu os critérios de fluxo, o teclado e a sincronização.
- Build de produção servido em `localhost:4221` (`http-server`), com service worker, para o critério offline e para os tempos de importação.
- Navegador headless (agent-browser), a 390 px, 360 px e 1280 px.
- O Supabase local já estava no ar antes do QA e **não** foi parado. O servidor de desenvolvimento, o servidor de produção e o auxiliar de emulação de CPU foram encerrados, e as portas 4220 e 4221 estão livres.
- Pacotes usados: os dois reais do autor (“Pacote Regular Flashcards - TI.colpkg”, “Inglês (Curso).apkg”) e sintéticos gerados no scratchpad (`direito`, `qa-conteudo`, `qa-seed`, `corrompido`, `volume-5000`, `volume-10000`, `sync-1000`). Os sintéticos não são versionados.
- Conta de teste criada no Supabase local: `qa-anki-<timestamp>@teste.local`.

## Critérios de aceitação verificados
| ID | Critério de aceitação | Casos de teste | Status | Evidência |
|----|-----------------------|----------------|--------|-----------|
| CA-33 | `<b>vedado</b>` vira destaque; dois `<div>` viram dois parágrafos | TU-A3, TU-A4, E2E-15 | PASSOU | Cartão gravado: destaque `["vedado"]` e Verso com 2 linhas. `e2e15-revisao-verso-paragrafos.png` |
| CA-34 | Lacunas c1/c2 geram 2 cartões com as duas etiquetas | TU-A6, TU-A9, TI-A4, E2E-15 | PASSOU | Dois cartões, lacunas `União` e `privativamente`, etiquetas `cespe`, `constitucional`. `e2e15-lacuna-revelada.png` |
| CA-35 | Falha no meio não deixa nada | TI-12, TI-A1, E2E-A3 | PASSOU | Cancelar em 2.500/10.000 e recarregar em 2.000/10.000: 0 cartões e 0 baralhos novos. `qa-390-7-progresso.png` |
| CA-A1 | Os dois pacotes reais abrem sem reexportar | TU-A1, TI-A5, E2E-A1 | PASSOU | TI: 1.404 notas · 13 baralhos · 1 tipo. Inglês: 1.952 notas · 1 baralho. `a1-ti-colpkg-origem.png`, `qa-390-11-pacote-real-ingles.png` |
| CA-A2 | Arquivo que não é do Anki: mensagem e nada gravado | TU-A1, E2E-15 | PASSOU | “Este arquivo não parece ser um baralho do Anki.” (`role=alert`), 0 cartões. `qa-390-erro.png`, `e2e15-arquivo-corrompido.png` |
| CA-A3 | Desmarcar um baralho de origem atualiza contagens | TU-A13, E2E-A2 | PASSOU | “4 notas selecionadas · 4 cartões”. `a2-passo2-origem.png` |
| CA-A4 | Mapeamento por tipo, sugerido e independente | TU-A10, TI-A4, E2E-A2 | PASSOU | Básico `Frente/Verso/Nenhum` e Questão `Enunciado/Gabarito/Comentário`; trocar o Verso da Questão não mexeu no Básico. `qa-390-9-mapeamento-troca.png` |
| CA-A5 | Lacuna: Frente com `_____`, Verso revelado, Extra nas Notas | TU-A6, TI-A4 | PASSOU | Cartões `A União legisla privativamente` com Notas `Art. 22, CF`; prévia `Compete à _____ legislar…` |
| CA-A6 | Oclusão de imagem desmarcada, com aviso e resumo | TU-A2, TI-A5, E2E-A2 | PASSOU | Checkbox desabilitado e desmarcado, com o motivo; “1 nota não será importada: Tipo não suportado”. `qa-390-4-destino.png`, `qa-390-5-resumo.png` |
| CA-A7 | Prévia atualiza ao trocar o mapeamento | E2E-A2 | PASSOU | Prévia da Questão passou de `120 dias` a `• Decadencial • Lei 12.016` sem recarregar |
| CA-A8 | Lista vira itens com marcador; entidades decodificadas | TU-A3 | PASSOU | Verso `• Legalidade\n• Impessoalidade` e Frente `A & B` gravados |
| CA-A9 | Destaque e lacuna juntos, sem sobreposição | TU-A7 | PASSOU | Frente: destaque `salvo`, lacuna `disposição em contrário`, nenhum destaque dentro dela; Verso: ambos destacados |
| CA-A10 | `[sound:]` e `<img>` removidos; nota só com imagem é pulada | TU-A5, TU-A11 | PASSOU | Frente `texto` sem resto; “1 nota não importada: Frente ou Verso vazio”. `qa-resumo-conteudo.png` |
| CA-A11 | Etiqueta adota a grafia existente; `leech` descartada | TU-A9, TI-A6 | PASSOU | `cespe Direito_Constitucional leech` virou `CESPE`, `Direito Constitucional`; “1 etiqueta descartada” |
| CA-A12 | Reimportar no mesmo baralho cria 0 | TU-A12, TI-A2, E2E-A3 | PASSOU | “Importar 0 cartões em direito” (desabilitado) e “5 cartões já existem neste baralho…”. `qa-390-6-reimportar-zero.png` |
| CA-A13 | Texto acima do limite é pulado | TU-A11 | PASSOU | Frente de 6.000 caracteres: “1 nota não importada: Texto acima do limite”; as demais entraram |
| CA-A14 | Cancelar e recarregar não deixam baralho nem cartões | TI-12, TI-A1, E2E-A3 | PASSOU | Cartões e baralhos idênticos antes e depois, nos dois casos; nova importação grava 5.000 uma vez só |
| CA-A15 | Resumo correto; baralho ativo; Home respeita “novos por dia” | TI-A3, E2E-A3 | PASSOU | Resumo “5.000 cartões importados em Constitucional”; Home com 20 cartões para revisar. `qa-390-8-home-ritmo.png` |
| CA-A16 | Sem baralho: só “Novo baralho”, Home no fim | E2E-A4 | PASSOU | Único destino “Novo baralho”; Home com 5 cartões. `qa-390-10-sem-baralho.png` |
| CA-A17 | Offline: mensagem na 1ª vez; importa depois do cache | TI-A8, E2E-A6 | PASSOU | Sem rede e sem cache: mensagem, botão “Tentar de novo” e escolha desabilitada; com a rede de volta, libera sozinha; sem servidor e sem rede, importou 5 cartões. `qa-390-12-offline-primeira-vez.png`, `qa-390-13-rede-volta-libera.png`, `qa-390-14-offline-importa.png` |
| CA-A18 | 1.000 cartões chegam ao outro aparelho, sem duplicar | TI-A7, E2E-A5 | PASSOU | Perfil B: 1.000 cartões, 1.000 ids únicos, destaque e etiquetas íntegros, 0 `dirty`; segundo sync em A não duplicou. `qa-sync-perfil-b.png` |
| CA-A19 | 10.000 notas (desktop) e 5.000 (celular) em < 30 s | E2E-A7 | PASSOU | Desktop 10.000: gravação 2,05 s. Celular emulado (CPU 4×): arquivo→resumo 7,3 s, gravação 1,9 s. `qa-1280-resumo-10000.png`, `qa-390-15-progresso-cpu4x.png` |
| CA-A20 | 360 px sem rolagem horizontal; escala tipográfica | E2E-A7 | PASSOU | `scrollWidth === innerWidth` e menor texto 14 px em todos os passos (arquivo, erro, origem, campos, destino, progresso e resumo). `qa-360-*.png` |

## Testes E2E executados
| ID | Fluxo | Resultado | Observações |
|----|-------|-----------|-------------|
| E2E-15 | Importar `.apkg` com lacunas, negrito e etiquetas | PASSOU | Também na versão atual, pelos cartões gravados |
| E2E-A1 | Pacotes reais do autor | PASSOU | Ver CA-A1 |
| E2E-A2 | Origem, campos e prévia | PASSOU | Ver CA-A3, CA-A4, CA-A6 e CA-A7 |
| E2E-A3 | Destino, duplicatas, cancelamento e resumo | PASSOU | Ver CA-A12, CA-A14 e CA-A15 |
| E2E-A4 | Começar pelo Anki, sem baralho | PASSOU | Ver CA-A16 |
| E2E-A5 | Sincronização entre dois perfis (Supabase local) | PASSOU | Ver CA-A18 |
| E2E-A6 | Offline e preparo do leitor (build de produção) | PASSOU | Ver CA-A17 |
| E2E-A7 | Volume e legibilidade | PASSOU | Ver CA-A19 e CA-A20 |

## Testes automatizados e cobertura
| Camada | ID | Resultado | Validação/comando | Observações |
|--------|----|-----------|-------------------|------------|
| Unidade | TU-A1 a TU-A14 | PASSOU | `npm run test:coverage` | Mais o teste de regressão do BUG-01 (`anki-steps.test.ts`) |
| Integração | TI-12, TI-A1 a TI-A8 | PASSOU | `npm run test:coverage` | Atomicidade e cancelamento com lotes pequenos (`chunkSize`) |
| Lint | — | PASSOU | `npm run lint` | |
| Escala tipográfica | — | PASSOU | `npm run check:type-scale` | Nenhuma violação |
| Build | — | PASSOU | `npm run build` | Aviso de orçamento do bundle inicial (905,7 kB) já existia antes da entrega (902,5 kB) |

- Total: 436 testes passando, 0 falhando (71 arquivos).
- Cobertura de `src/app/domain/**`: 96,99% de instruções, 90,31% de ramos, 96,51% de funções e 97,92% de linhas (piso de 80%: atendido). `pages/`, `ui/` e `state/` estão fora do gate por decisão do projeto e foram validados pelos roteiros acima.

## Acessibilidade
- [x] **Navegação por teclado (Tab, Espaço, Enter)**: percorri os passos de origem, campos e destino. A ordem é lógica (Voltar, Marcar/Desmarcar todos, caixas, Continuar). Espaço marca e desmarca as caixas, setas trocam o campo do `<select>` e os radios, Enter aciona Continuar, e “Cancelar” funciona só pelo teclado.
- [x] **Foco ao trocar de passo**: era um defeito (BUG-01) e foi corrigido. O foco vai para o título do novo passo, e no progresso o `Tab` seguinte cai em “Cancelar”.
- [x] **Foco visível**: contorno âmbar na área de escolher arquivo (corrigido na revisão).
- [x] **Rótulos descritivos**: todo botão, caixa, rádio e `<select>` tem nome acessível (rótulo, `aria-label` ou texto).
- [x] **Formulários**: `<select>` com `<label for>`, campo de nome do novo baralho com rótulo, lista de baralhos de origem com caixas rotuladas.
- [x] **Mensagens de erro**: arquivo inválido com `role="alert"`; estado “precisa de conexão” com `role="status"`; resumo final e contagens com `aria-live="polite"`; barra com `role="progressbar"`, valores e rótulo; marcos de 25% em texto só para leitor de tela.
- [x] **Imagens com `alt`**: não se aplica, a tela não tem imagens.
- [x] **Contraste**: calculado a partir dos tokens, todos acima de 4,5:1 sobre o fundo em que aparecem (texto 15,4; muted 6,8 sobre ink e 6,0 sobre surface; sinal 10,0; acerto 11,6; erro 6,8; texto sobre sinal 10,0).
- [x] **Tamanho das fontes**: menor texto 14 px (`text-label`) em todos os passos; áreas de toque com altura mínima de 44 px.
- [ ] **Leitor de tela real**: não testei com NVDA, VoiceOver ou TalkBack. Verifiquei a semântica e o `aria-live` pelo DOM, não pela fala.

## Bugs encontrados e corrigidos
| ID | Descrição | Severidade | Status | Correção | Teste de regressão | Evidência |
|----|-----------|------------|--------|----------|--------------------|-----------|
| BUG-01 | Ao trocar de passo, o foco caía no `body`, porque o botão que o tinha saía da tela. Quem usa teclado ou leitor de tela perdia o contexto a cada passo. | Média | Corrigido | `import.ts` move o foco para o elemento `[data-step-focus]` do novo passo (título ou rótulo do progresso) com `afterRenderEffect`; a decisão de mover vem de `movesFocus()` em `domain/anki-steps.ts`. | `anki-steps.test.ts` → “move o foco só quando a tela muda, nunca na primeira exibição” (falha sem `movesFocus`). A parte do DOM foi verificada no navegador; o projeto não tem teste de componente. | Foco registrado em cada passo, descrito em “Acessibilidade” |

Defeitos achados antes do QA (na implementação e no review) já estão em `evidences/medicoes.md` e em `codereview.md`: o aviso de arquivo grande que nunca aparecia, o resumo do arquivo ausente com um só baralho, as linhas do Verso coladas na revisão (RF2), a concordância e a frase sobre duplicatas.

## Conclusão
Todos os 23 critérios de aceitação foram verificados em navegador, na versão atual, e estão atendidos. O QA achou um defeito de acessibilidade (BUG-01), corrigido na causa raiz e coberto por teste no que o projeto consegue testar. Lint, type-scale, 436 testes (96,99% de cobertura no domínio) e build passam depois da correção. **APROVADO.**

Limites desta verificação, para não superestimar o resultado:
- A queda de rede **no meio** do download do wasm não foi reproduzida no navegador (o emulador de rede do agent-browser não alcança as buscas do service worker). O caso está nos testes de unidade (`reader-unavailable`, falha não memoizada), e a falta de rede **antes** do download foi verificada no navegador.
- A emulação de celular é de largura e de CPU (4× mais lenta) no Chrome headless, não um aparelho real. A memória de um celular de verdade com pacotes grandes não foi medida.
- Acessibilidade foi checada por teclado, DOM e contraste calculado, sem leitor de tela real.
- A correção do BUG-01 e os arquivos que o review alterou ainda não estão commitados.
