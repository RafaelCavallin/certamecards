# Relatório de QA — Proteção dos dados locais

As evidências da ferramenta de navegador estão em [`evidences/`](evidences/).

## Resumo
- Data: 2026-10-18
- Status: APROVADO
- Total de critérios de aceitação: 11 (CA-44, CA-45, CA-46, CA-P01–CA-P08)
- Critérios de aceitação atendidos: 11
- Bugs encontrados: 2 (ambos corrigidos antes desta rodada; nenhum novo no QA)
- Ambiente:
  - `npm start -- --port 4231` (frontend, iniciado por esta execução).
  - Supabase local do projeto nas portas 55321–55327, já no ar antes desta execução e não derrubado.
  - Navegador da skill `agent-browser` com perfil limpo (sessão `certame-qa`).
  - Usuário de teste local `qa-protecao-<timestamp>@example.com` (confirmação de e-mail desligada no `supabase/config.toml` local).
- Simulação do despejo: `indexedDB.deleteDatabase('certamecards')` com o app aberto. Apaga o banco e preserva o `localStorage`, como o despejo por falta de espaço do Chrome no incidente de produção.

## Critérios de aceitação verificados
| ID | Critério de aceitação | Casos de teste | Status | Evidência |
|----|-----------------------|----------------|--------|-----------|
| CA-44 | Perda com a revisão aberta: aviso só com “Recarregar” e nenhuma revisão gravada depois | TI-P03, E2E-P01 | PASSOU | [e2e-p01-bloqueante.png](evidences/e2e-p01-bloqueante.png) |
| CA-45 | Explicativo depois da perda; não volta depois de dispensado; não aparece no primeiro uso nem depois de limpeza total | TU-P01, TU-P02, TU-P04, TI-P01, E2E-P02, E2E-P03 | PASSOU | [e2e-p02-explicativo.png](evidences/e2e-p02-explicativo.png), [e2e-p03-primeiro-uso.png](evidences/e2e-p03-primeiro-uso.png), [e2e-p03-limpeza-total.png](evidences/e2e-p03-limpeza-total.png) |
| CA-46 | Ajustes → Armazenamento mostra o estado e o botão | TU-P06, E2E-P07 | PASSOU | [e2e-p07-armazenamento-390.png](evidences/e2e-p07-armazenamento-390.png), [e2e-p07-armazenamento-1280.png](evidences/e2e-p07-armazenamento-1280.png) |
| CA-P01 | Esc e clique fora não fecham o bloqueante; a página fica inerte | E2E-P01 | PASSOU | [e2e-p01-bloqueante.png](evidences/e2e-p01-bloqueante.png) |
| CA-P02 | Instalação anterior à entrega não vê aviso | TU-P03, TI-P02, E2E-P04 | PASSOU | [e2e-p04-instalacao-antiga.png](evidences/e2e-p04-instalacao-antiga.png) |
| CA-P03 | Com conta, o explicativo cita a recuperação pela conta | E2E-P10 | PASSOU | [e2e-p10-aviso-com-conta.png](evidences/e2e-p10-aviso-com-conta.png) |
| CA-P04 | Editar cartão excluído: “Cartão não encontrado.”, fecha por botão e Esc | TI-P06, E2E-P05 | PASSOU | [e2e-p05-editar-excluido.png](evidences/e2e-p05-editar-excluido.png) |
| CA-P05 | Responder cartão excluído: mensagem, sem avançar, sem revisão gravada | TI-P04, E2E-P06 | PASSOU | [e2e-p06-resposta-excluido.png](evidences/e2e-p06-resposta-excluido.png) |
| CA-P06 | Negativa do navegador mantém “Não protegido” sem erro | TU-P06, E2E-P07 | PASSOU | [e2e-p07-armazenamento-390.png](evidences/e2e-p07-armazenamento-390.png) |
| CA-P07 | Resumo da importação sem conta recomenda backup | E2E-P08 | PASSOU | [e2e-p08-resumo-390.png](evidences/e2e-p08-resumo-390.png), [e2e-p08-resumo-1280.png](evidences/e2e-p08-resumo-1280.png) |
| CA-P08 | Atualização em outra aba: bloqueante; depois do recarregar, dados intactos e sem explicativo | E2E-P09 | PASSOU | [e2e-p09-outra-aba.png](evidences/e2e-p09-outra-aba.png) |

## Testes E2E executados
| ID | Fluxo | Resultado | Observações |
|----|-------|-----------|-------------|
| E2E-P01 | Importar → `/revisar` → apagar o banco | PASSOU | Bloqueante em < 1 s. Dois Esc e um clique no fundo não o fecham. A árvore de acessibilidade só expõe o título e “Recarregar”. |
| E2E-P02 | “Recarregar” → explicativo → “Entendi” → recarregar | PASSOU | Explicativo sem conta com links Backup, Importar do Anki e Armazenamento. Depois do “Entendi” e de um novo recarregar, nenhum diálogo. |
| E2E-P03 | Primeiro uso; depois `localStorage.clear()` + apagar o banco + recarregar | PASSOU | Nenhum aviso nos dois casos; marcador criado no primeiro uso; “Meus cartões” recriado. |
| E2E-P04 | Remover só o marcador e recarregar | PASSOU | Nenhum aviso; marcador recriado; dados intactos. |
| E2E-P05 | Excluir o cartão atual por fora → “Editar cartão” | PASSOU | “Cartão não encontrado.”, foco inicial em “Fechar”. Fecha com Enter no botão e com Esc. |
| E2E-P06 | Mesma exclusão → Espaço → 2 | PASSOU | “Não foi possível registrar a resposta.”, posição mantida em 1/20, `reviewLogs` com 0 registros. |
| E2E-P07 | `/ajustes` → Armazenamento → “Proteger meus dados” | PASSOU | No Chromium headless o pedido é negado. A seção segue “Não protegido”, sem alerta, com as orientações. Sem rolagem horizontal em 390 px. |
| E2E-P08 | Importar sem conta → resumo | PASSOU | Linha “Sem conta, estes cartões só existem neste navegador. Faça um backup.”, com link para `/ajustes/backup`, em 390 e 1280 px. |
| E2E-P09 | Aba B abre `certamecards` na versão 21 → aba A | PASSOU | A aba A mostra o bloqueante. Depois de recarregar, a revisão abre com os cartões (o Dexie 4 abre a versão instalada 21 sem `VersionError`) e sem explicativo. O risco registrado na TechSpec não se confirmou. |
| E2E-P10 | Criar conta local → sincronizar → apagar o banco → recarregar | PASSOU | Explicativo com “Você está conectado: o que estava sincronizado volta pela sua conta.” e links Conta e Armazenamento. Depois do “Entendi”, os 35 cartões voltaram pela sincronização. |

## Testes automatizados e cobertura
| Camada | ID | Resultado | Validação/comando | Observações |
|--------|----|-----------|-------------------|------------|
| Unidade | TU-P01–TU-P05, TU-P07 | PASSOU | `npm run test:coverage` | `store-marker.test.ts` |
| Unidade | TU-P06 | PASSOU | `npm run test:coverage` | `storage-persistence.test.ts` |
| Integração | TI-P01–TI-P03 | PASSOU | `npm run test:coverage` | `storage-loss.test.ts` (projeto `dom`) |
| Integração | TI-P04, TI-P05 | PASSOU | `npm run test:coverage` | `scheduler.test.ts` |
| Integração | TI-P06 | PASSOU | `npm run test:coverage` | `card-draft.test.ts` |
| Regressão de inicialização | — | PASSOU | `npm run test:coverage` | `sync-startup.test.ts` cobre `StorageHealth` e o pedido de persistência na abertura. |

- `npm run lint`: todos os arquivos passam.
- `npm run check:type-scale`: nenhuma violação.
- `npm run test:coverage`: 117 arquivos, 842 testes, todos passando.
- `npm run build`: concluído.
- Cobertura em `src/app/domain/**`: 98,33% statements, 92,77% branches, 98,65% functions, 99,03% lines (piso 80%). `pages/`, `ui/` e `state/` estão fora do gate e foram validados pelos roteiros acima.

## Acessibilidade
- [x] Teclado:
  - O bloqueante recebe o foco em “Recarregar”.
  - O explicativo recebe o foco em “Entendi” e o Tab percorre os links.
  - O modal de edição recebe o foco em “Fechar”; Enter e Esc fecham.
  - Esc não fecha os avisos de perda, como pede o PRD.
- [x] Rótulos: os diálogos usam `aria-labelledby` (`storage-blocking-title`, `storage-lost-title`); botões e links têm texto descritivo.
- [x] Imagens: nenhuma imagem nova.
- [x] Contraste: só tokens (`text-muted`, `text-miss`, `text-hit`, `text-on-signal`), já cobertos pelos testes de contraste dos dois temas. Verificado visualmente no tema claro em 390 px ([a11y-explicativo-claro-390.png](evidences/a11y-explicativo-claro-390.png), [a11y-bloqueante-claro-390.png](evidences/a11y-bloqueante-claro-390.png)).
- [x] Formulários: o único botão novo (“Proteger meus dados”) não tem campo associado.
- [x] Mensagens de erro: `role="alert"` nas mensagens da edição e da revisão; “Carregando…” com `aria-live="polite"`.
- [x] Tamanhos: `text-label`/`text-meta`/`text-body`, nada abaixo de 13 px (`check:type-scale` verde); áreas de toque com `min-h-11`.

## Bugs encontrados e corrigidos
| ID | Descrição | Severidade | Status | Correção | Teste de regressão | Evidência |
|----|-----------|------------|--------|----------|--------------------|-----------|
| BUG-01 | No Chrome, o Esc fechava o aviso bloqueante: o `cancel` de um `<dialog>` aberto sem gesto do usuário não pode ser cancelado (achado na verificação da tarefa 3). | Alta | Corrigido | `(close)="syncDialogs()"` reabre os diálogos enquanto a condição vale, além do `preventDefault` no `cancel`. | E2E-P01 (UI fora do gate de cobertura; roteiro repetido nesta rodada). | [e2e-p01-bloqueante.png](evidences/e2e-p01-bloqueante.png) |
| BUG-02 | `StorageHealth` deixava escapar uma rejeição não tratada se o `db.open()` falhasse (achado na revisão de código). | Média | Corrigido | `catch` com `console.error` e leitura da perda pendente depois. | Coberto indiretamente por `sync-startup.test.ts`; o caminho de falha do IndexedDB não é reproduzível no navegador de QA. | [codereview.md](codereview.md) |

**Observação, não é defeito:** depois do bloqueio, consultas reativas que ainda rodam registram `DatabaseClosedError` no console (o `ErrorHandler` do Angular). É o efeito esperado do bloqueio deliberado do banco (RF79c), com a página inerte até recarregar. Nada é gravado e a tela continua mostrando só o aviso.

## Conclusão
Os 11 critérios de aceitação foram verificados no navegador e passaram, com evidência em 390 e 1280 px e nos dois temas. Os testes automatizados da TechSpec passam, com a cobertura do domínio bem acima do piso. Lint, escala tipográfica e build estão verdes. O cenário do incidente de produção, banco despejado com o app aberto, agora gera o aviso bloqueante, impede gravações num banco vazio e explica a perda no carregamento seguinte. Com conta, os dados voltam pela sincronização. **QA aprovado.**
