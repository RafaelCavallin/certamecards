# Relatório de revisão de código — Proteção dos dados locais

## Resumo
- Data: 2026-10-18
- Branch: des (mudanças ainda não commitadas)
- Status: APROVADO COM RESSALVAS

## Conformidade com regras
| Regra | Status | Observações |
|------|--------|-------------|
| `code-standards.md` — arquivos ≤ 100 linhas | OK | O maior arquivo novo é `storage-alert.html`, com 62 linhas; `app.html` tem 74, `settings.html` 55 e `review-session.ts` 82. |
| `code-standards.md` — funções ≤ 30 linhas, guardas, ≤ 3 parâmetros | OK | `answer` ficou menor com a extração de `scheduledFields`; `watchConnectionClosed` tem 12 linhas. |
| `code-standards.md` — sem comentários, constantes nomeadas | OK | Nenhum comentário novo. Chaves e mensagens são constantes (`STORE_CREATED_KEY`, `STORE_LOST_KEY`, `CARD_NOT_FOUND_MESSAGE`, `ANSWER_FAILED_MESSAGE`). |
| `javascript-typescript.md` | OK | Sem `any`; uniões de strings (`PersistenceState`, `DraftLoadState`); `import type` quando é só tipo; `catch (error: unknown)`; `void` nas promessas intencionais. |
| `tests.md` — teste junto do código | OK | Domínio novo coberto por TU-P01–P07 e TI-P01–P06. O bug do `scheduler` tem TI-P04, que falharia sem a guarda (o `update` devolvia 0 e o log era gravado). O teste de inicialização do `App` cobre `StorageHealth` e o pedido de persistência. |
| Estrutura de pastas e dependências | OK | `store-marker`, `storage-loss` e `storage-persistence` estão em `domain/`, sem Angular. `store-marker` não importa `db`, o que evita ciclo com `db.ts`. `ui/storage-alert` só lê `state/`; `pages/` chamam `domain/` só para leitura e escrita pontual. Nomes em kebab-case sem sufixo. |
| Convenções de Angular | OK | Standalone, OnPush, `inject()`, `@Service()`, signals, `@switch`/`@if`/`@let`; sem RxJS novo. |
| Estilo visual | OK | Só tokens (`text-miss`, `text-hit`, `border-edge`, `backdrop:bg-scrim`, `text-on-signal` sobre `bg-signal`); escala `text-label`/`text-meta`/`text-body`; `check:type-scale` sem violações. |
| Regras de domínio | OK | Campos FSRS continuam escritos só pelo `scheduler`; nenhuma regra de marcas ou limites foi tocada. |
| `supabase/migrations/` | N/A | Sem mudança de schema, de RPC ou de sincronização. |

## Aderência à TechSpec
| Decisão Técnica | Implementado | Observações |
|-----------------|--------------|-------------|
| Gancho `db.on('populate')` + marcadores no `localStorage` | SIM | `db.ts` chama `recordStoreCreated(browserStorage(), Date.now())`. |
| `initStoreMarker` depois de `db.open()` | SIM | Rodado por `StorageHealth` na abertura. |
| `watchConnectionClosed` com fechamento definitivo em microtarefa e chamada única | SIM | Coberto por TI-P03, inclusive a rejeição com `DatabaseClosedError`. |
| `StorageHealth` relê `pendingStoreLoss` ao fechar a conexão | NÃO (desvio aceito) | O explicativo não aparece enquanto o bloqueante está aberto, e o único caminho é recarregar, quando a perda é lida de novo. Reler ali não muda o que a tela mostra. |
| `storage-alert` com dois `<dialog>`, sem saída por Esc | SIM, com ajuste | No Chrome, o `cancel` de um diálogo aberto sem gesto do usuário não pode ser cancelado. Além do `preventDefault`, o evento `close` reabre o diálogo enquanto a condição vale (`syncDialogs`). Verificado no navegador. |
| `storage-persistence.ts` com três estados e `StoragePersistence` | SIM | Pedido feito na abertura, ao fim da importação e pelo botão em Ajustes. |
| `loadCardDraftState` no domínio, usado no modal e na página | SIM | — |
| `scheduler` recusa cartão inexistente dentro da transação | SIM | — |
| `ReviewSession.error` exibido com `role="alert"` | SIM | — |
| Linha de backup no resumo da importação | SIM | Condição: sem sessão e estado diferente de `persisted`. |
| Seção “Armazenamento” antes do Backup, com âncora | SIM | `section#armazenamento`, alvo do link do aviso explicativo. |

## Tarefas verificadas
| Tarefa | Status | Observações |
|------|--------|-------------|
| 1.0 domain: detecção da perda | COMPLETA | Subtarefas, TU-P01–P05, TU-P07 e TI-P01–P03 presentes. `storage-loss.test.ts` entrou na lista `DOM_TESTS` do `vitest.config.ts` (usa `localStorage`). |
| 2.0 domain: persistência, estado da edição e resposta | COMPLETA | TU-P06 e TI-P04–P06 presentes. TI-P05 reaproveita o teste existente de agendamento, agora com o ID. |
| 3.0 state e ui: avisos de perda | COMPLETA | E2E-P01–P04, P09 e P10 ficam para o QA. |
| 4.0 edição e revisão sem falha silenciosa | COMPLETA | E2E-P05 e P06 ficam para o QA. |
| 5.0 proteção do armazenamento | COMPLETA | E2E-P07 e P08 ficam para o QA. |

## Testes
- Total de testes: 842
- Passando: 842
- Falhando: 0
- Cobertura: 98,33% statements, 92,77% branches, 98,65% functions, 99,03% lines em `src/app/domain/**` (piso 80%)
- `npm run lint`: todos os arquivos passam. `npm run check:type-scale`: nenhuma violação. `npm run build`: concluído.

## Problemas encontrados
| Severidade | Arquivo | Linha | Descrição | Sugestão |
|------------|---------|-------|-----------|----------|
| Média (corrigido) | `src/app/state/storage-health.ts` | 30 | Se `db.open()` falhasse (IndexedDB indisponível), o `try/finally` atualizava o estado, mas deixava a rejeição escapar como *unhandled rejection*. | Corrigido: `catch` com `console.error`, e a leitura da perda pendente roda depois. |
| Baixa | `src/app/ui/storage-alert/storage-alert.html` | — | O `(cancel)` com `preventDefault` não basta no Chrome sem gesto do usuário. | Já tratado com `(close)="syncDialogs()"`; o QA confirma em E2E-P01/P02. |
| Baixa | `src/app/domain/storage-loss.ts` | 11 | O fechamento definitivo depende da ordem interna do Dexie 4.4.6 (`close` dispara antes de `autoOpen` ser redefinido). | Coberto por TI-P03, que quebra se uma atualização do Dexie mudar isso. Revisar ao atualizar o Dexie. |

## Pontos positivos
- A detecção não exige tabela nova nem mudança de schema ou sincronização, e distingue despejo (localStorage preservado) de limpeza total.
- O banco fica bloqueado depois de perder a conexão, o que elimina a gravação silenciosa num banco vazio que causou o incidente.
- As regras ficaram no domínio, testáveis e dentro da cobertura; a UI só reage a signals.
- O bug do `scheduler` (log órfão) tem teste de regressão.

## Recomendações
- Executar no QA os roteiros E2E-P09 (atualização em outra aba) e E2E-P10 (com conta, Supabase local), que não foram exercitados durante a implementação.
- Ao atualizar o Dexie, rodar `storage-loss.test.ts` antes de tudo.

## Conclusão
A implementação segue as regras do projeto e a TechSpec, com um desvio pequeno e justificado (não reler a perda pendente no `close`). O único defeito encontrado, a rejeição não tratada em `StorageHealth`, foi corrigido e revalidado. Lint, escala tipográfica, testes com cobertura e build passam. Aprovado com ressalvas até o QA validar os roteiros E2E, em especial P09 e P10.
