# Relatório de QA — MVP offline

As evidências da ferramenta de navegador estão salvas em `tasks/prd-mvp-offline/evidences/` (prefixo `qa-*` desta execução; `e2e-05-*` e as pastas `task-7` a `task-10` vêm das validações feitas durante a implementação das tarefas).

## Resumo
- Data: 2026-09-28
- Status: **APROVADO**
- Total de critérios de aceitação: 20 (CA-01 a CA-17, CA-21 a CA-23)
- Critérios de aceitação atendidos: 20
- Bugs encontrados: 0

## Critérios de aceitação verificados

| ID | Critério de aceitação | Casos de teste | Status | Evidência |
|----|-----------------------|----------------|--------|-----------|
| CA-01 | Três parágrafos nas Notas preservados; sem rolagem interna | TU-15, TI-01, E2E-01 | PASSOU | `qa-e2e01-01-preenchido.png` |
| CA-02 | Após salvar, campos vazios e foco na Frente | E2E-01 | PASSOU | verificado via `eval` (activeElement = textarea Frente) |
| CA-03 | Editar o Verso não muda próxima revisão nem nº de revisões | TI-01 (unidade/integração; `updateCardContent` não toca campos FSRS) | PASSOU | `npm run test:coverage` |
| CA-04 | Lacuna `_____` antes de revelar; fundo sutil depois | TU-01, TU-04, E2E-01, E2E-02 | PASSOU | `qa-e2e01-02-lacuna.png`, `qa-e2e02-01-lacuna-revisao.png`, `qa-e2e02-02-revelado.png` |
| CA-05 | Destaque visível antes e depois de revelar | TU-01, E2E-01, E2E-02 | PASSOU | `qa-e2e01-03-destaque.png`, `qa-e2e02-02-revelado.png` |
| CA-06 | Verso e Notas só oferecem "Destacar seleção" | TU-05, E2E-01, E2E-03 | PASSOU | `qa-e2e01-04-todos-marcados.png` (snapshot confirma ausência do botão "Ocultar" no Verso/Notas) |
| CA-07 | Lacuna acompanha a edição; some ao apagar a palavra | TU-02 | PASSOU | `npm run test:coverage` |
| CA-08 | "Tirar destaque" remove só aquela marca | TU-03 | PASSOU | `npm run test:coverage` |
| CA-09 | "Meus cartões" na primeira abertura; nada recriado ao excluir o último | TI-03, E2E-05 | PASSOU | `qa-01-home-vazia.png`, `qa-e2e05-04-nao-exclui-ultimo.png` (mensagem "Não é possível excluir o único baralho") |
| CA-10 | Criar baralho pelo seletor ativa sem navegar; excluir limpa lista e fila | TI-04, E2E-05 | PASSOU | `qa-e2e05-01-novo-baralho-ativo.png`, `qa-e2e05-03-apos-exclusao.png` |
| CA-11 | Número de hoje sobe em ≤ 60 s sem recarregar | TU-17, E2E-06 | PASSOU | Home foi de "Nada vencido agora" para "2 cartões para revisar" sem reload após criar cartões |
| CA-12 | Máximo de 10 novos intercalados com "novos por dia" = 10 | TU-06, TU-07 | PASSOU | `npm run test:coverage` (conferido de passagem no E2E-02/05 com `interleave`) |
| CA-13 | Espaço / 1 / 2; tecla repetida registra uma só revisão | TU-08, E2E-02 | PASSOU | Sessão com 2 cartões: 3 pressões de "1" no card revelado geraram só 1 revisão (`answeringSignal` bloqueia reentrância) |
| CA-14 | Editar durante a revisão volta ao mesmo cartão corrigido | E2E-04 | PASSOU | `qa-e2e04-01-editando.png`, `qa-e2e04-02-corrigido.png` |
| CA-15 | Busca nas Notas com 5.000 cartões e rolagem fluida | TU-10, roteiro de lista (tarefa 9.0) | PASSOU | Busca por "detalhe importante" filtrou corretamente (`qa-cards-busca-notas.png`); rolagem com 5.000 cartões já validada em `evidences/task-9/cards-list-5000.png` |
| CA-16 | 8 acertos em 10 → retenção 80% e dia no heatmap | TU-11, Progresso | PASSOU | Progresso mostrou 75% de retenção em 4 revisões (3 acertos/1 erro) batendo com o histórico real (`qa-progress-view.png`); fórmula validada por TU-11 |
| CA-17 | Sem rede e sem conta: criar, revisar e ver progresso sem erro | E2E-07 | PASSOU | `qa-e2e07-01-offline-onboarding.png`, `qa-e2e07-02-offline-review-done.png`; console sem erros de rede |
| CA-21 | Nenhum controle de áudio, voz, velocidade, gravação ou fonética | E2E-10, inspeção de todas as telas | PASSOU | `qa-settings-view.png` e demais telas — nenhum controle desse tipo em nenhuma página |
| CA-22 | Após a primeira visita, recarregar offline abre a Home e permite revisar | E2E-07 | PASSOU | Build de produção servido localmente, service worker ativado, reload 100% offline abriu a Home |
| CA-23 | A 360 px: leitura ≥ 16 px, rótulo ≥ 13 px, sem rolagem horizontal | E2E-10, `check:type-scale` | PASSOU | `qa-360-card-new.png`, `qa-360-review-long-front.png`; `scrollWidth === clientWidth` a 360 px; tamanhos computados só 14/16/18/20/24 px |

## Testes E2E executados

| ID | Fluxo | Resultado | Observações |
|----|-------|-----------|-------------|
| E2E-01 | Criar cartão com 3 parágrafos nas Notas, ocultar e destacar | PASSOU | Lacuna e destaque na Frente, destaque no Verso e nas Notas, contador "1 lacuna e 1 destaque" |
| E2E-02 | Sessão de revisão completa por teclado | PASSOU | Espaço revela, "1"/"2" respondem, tecla repetida não duplica revisão, fim de sessão com contagem correta |
| E2E-03 | Verso e Notas só oferecem destacar | PASSOU | Confirmado no formulário (E2E-01) e na revisão (destaques em cor de sinal no Verso/Notas revelados) |
| E2E-04 | Editar cartão durante a revisão | PASSOU | `<dialog>` abre, salva e volta ao mesmo cartão com o texto corrigido, sem perder a posição na fila |
| E2E-05 | Criar, trocar e excluir baralho pelo seletor | PASSOU | Criação ativa sem navegar; exclusão limpa a lista; exclusão do único baralho é bloqueada com aviso |
| E2E-06 | Home recontando sozinha | PASSOU | Contador subiu de "Nada vencido agora" para "2 cartões para revisar" após criar cartões, sem reload |
| E2E-07 | Offline sem conta (DevTools offline) | PASSOU | Build de produção servido localmente (porta 4210), SW ativo, reload 100% offline, criar+revisar+progresso sem erro |
| E2E-10 | Tipografia a 360 px e ausência de áudio | PASSOU | Sem rolagem horizontal, Frente longa usa escala menor, nenhum controle de áudio em nenhuma tela |

## Testes automatizados e cobertura

| Camada | ID | Resultado | Validação/comando | Observações |
|--------|----|-----------|-------------------|------------|
| Unidade/Integração | TU-01 a TU-11, TU-15, TU-17, TI-01 a TI-04 | PASSOU | `npm run test:coverage` | 142 testes em 22 arquivos, todos verdes |
| Lint | — | PASSOU | `npm run lint` | Sem violações |
| Escala tipográfica | — | PASSOU | `npm run check:type-scale` | Nenhuma violação |
| Build de produção | — | PASSOU | `npm run build` | Build limpo, `ngsw-config.json` aplicado |

- Cobertura: **99.7% statements / 100% branches / 100% functions / 100% lines** em `src/app/domain/**` (piso exigido: 80%). Único arquivo com desvio é `queue.ts` (98.11% statements), acima do piso.
- `pages/`, `ui/` e `state/` ficam fora do gate de cobertura por decisão do projeto — validados pelos roteiros E2E acima (passo 3) e pelas checagens de acessibilidade/responsividade (passos 5 e 6).

## Acessibilidade

Auditoria automática (`agent-browser a11y --tags wcag2a,wcag2aa`, engine axe-core 4.12.1) em todas as telas principais: **0 violações** em Home, Novo cartão, Revisão, Cartões, Progresso e Ajustes.

- [x] Navegação por teclado (Tab, Enter, Esc) — Tab percorre skip link → nav → conteúdo na ordem correta; Enter ativa links focados; Esc fecha o drawer mobile.
- [x] Elementos interativos com rótulos descritivos — botões de ação (checkbox "Selecionar cartão", "Editar cartão", "Excluir cartão", "Renomear baralho" etc.) têm `aria-label`/texto acessível, confirmado nos snapshots de acessibilidade do `agent-browser`.
- [x] Imagens com texto alternativo (`alt`) apropriado — não há elementos `<img>` no app (UI só com texto e SVG); não aplicável.
- [x] Contraste de cores adequado — sem violações de contraste no axe-core (regra `color-contrast` incluída em wcag2aa).
- [x] Formulários com rótulos associados aos campos — Frente/Verso/Notas, busca e campos de Ajustes/Progresso têm `aria-label` (confirmado nos snapshots, ex.: "Buscar por Frente, Verso ou Notas").
- [x] Mensagens de erro claras e acessíveis — mensagem "Não é possível excluir o único baralho. Crie outro antes." é clara e em português.
- [x] Fontes com tamanho apropriado — nenhum tamanho computado abaixo de 13 px em nenhuma tela testada (mínimo observado: 14 px).

## Visual e responsividade

Capturado em 390 px (mobile) e 1280 px (desktop), cobrindo estado vazio, com dados e confirmação/erro:

- Home vazia (onboarding) e com dados — `qa-01-home-vazia.png`, `evidences/task-8/home-today.png`, `qa-mobile-390-home.png`
- Menu mobile (drawer) — `qa-mobile-390-drawer.png`
- Formulário de cartão a 360 px, com Frente curta e longa (> 280 caracteres) — `qa-360-card-new.png`, `qa-360-card-long-front-form.png`, `qa-360-review-long-front.png`
- Lista de cartões: busca, seleção em lote e confirmação — `qa-cards-busca-notas.png`, `qa-cards-bulk-confirm.png`
- Progresso e Ajustes — `qa-progress-view.png`, `qa-settings-view.png`
- Baralhos: criação, ativação e bloqueio de exclusão do único baralho — `qa-e2e05-01-novo-baralho-ativo.png`, `qa-e2e05-03-apos-exclusao.png`, `qa-e2e05-04-nao-exclui-ultimo.png`

Nenhuma inconsistência visual encontrada; nenhuma rolagem horizontal em nenhuma largura testada.

## Bugs encontrados e corrigidos

Nenhum bug encontrado durante esta execução de QA. Não foi necessária nenhuma correção.

## Conclusão

O MVP offline do CertameCards atende integralmente aos 20 critérios de aceitação da entrega. Os quatro comandos de validação do projeto (`lint`, `check:type-scale`, `test:coverage`, `build`) passam limpos, com cobertura de domínio em praticamente 100%. Todos os roteiros E2E da TechSpec (E2E-01 a E2E-07, E2E-10) foram executados manualmente com a skill `agent-browser` e passaram, incluindo o cenário mais crítico — uso 100% offline, sem conta, com o build de produção e o service worker ativos. A auditoria de acessibilidade (axe-core) não encontrou violações em nenhuma tela, e a inspeção manual de teclado, rótulos e tipografia confirmou conformidade com as regras do projeto. **QA APROVADO** — a entrega está pronta para o deploy de preview/produção já realizado na tarefa 10.0, sem pendências.
