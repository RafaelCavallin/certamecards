# Documento de Requisitos do Produto (PRD) — MVP offline

> Entrega 1 de 2 da Fase 1. Documento-mãe: [tasks/produto/prd.md](../produto/prd.md) — visão, identidade visual, restrições e fora do escopo valem aqui sem repetição. Os IDs (US, RF, CA) são os do documento-mãe, preservados para rastreabilidade. A entrega seguinte é [prd-conta-sync](../prd-conta-sync/prd.md).

## Visão geral

O app completo **só no aparelho**: criar cartões com Frente / Verso / Notas, destacar e ocultar trechos, organizar em baralhos, revisar com FSRS, ver a lista e o progresso, instalar como PWA e estudar sem rede. Não há conta nem sincronização nesta entrega; o app roda sem nenhuma variável de ambiente.

Termina com o deploy de preview na branch `des`, usável no dia a dia antes de a conta existir.

## Objetivos

- MVP utilizável (criar cartão → revisar → progresso, offline) em até 2 semanas de trabalho.
- Responder um cartão e ver o próximo em < 150 ms, sem rede.
- Nenhum texto de leitura abaixo de 16 px nem rótulo abaixo de 13 px; Frente de até 1.500 caracteres legível a 360 px sem rolagem horizontal.
- Cobertura ≥ 80% em `src/app/domain/**`; `lint`, `check:type-scale`, `test:coverage` e `build` verdes no CI desde o primeiro commit.
- O banco local (Dexie v1) nasce no formato final da Fase 1 — com `settings` e `syncState` — para a entrega de sync não precisar migrá-lo.

## Histórias de usuário

US1, US2, US3, US4, US5, US6, US7, US9 e US11 do documento-mãe, mais a primeira metade da US10 (“usar o app por completo só no aparelho”). US8 entra só na parte offline (“estudar sem internet”); a sincronização entre aparelhos é da entrega seguinte.

## Principais funcionalidades

Os requisitos abaixo estão descritos por inteiro no documento-mãe.

| Funcionalidade | Requisitos | Observação |
| --- | --- | --- |
| F1. Cartão Frente / Verso / Notas | RF1–RF5 | |
| F2. Destacar e ocultar trechos | RF6–RF13 | Lacuna só na Frente. |
| F3. Baralhos | RF14–RF18 | |
| F4. Início (Hoje) | RF19–RF23 | |
| F5. Sessão de revisão | RF24–RF30 | |
| F6. Lista de cartões | RF31–RF33 | |
| F7. Progresso | RF34–RF35 | |
| F8. Conta e sincronização | **RF36** apenas | O app funciona 100% no aparelho sem conta. RF37–RF41 ficam para `prd-conta-sync`. |
| F9. Ajustes | RF42 **parcial**, RF43 | Nome do baralho ativo e versão do app. A seção de conta (entrar/sair, última sincronização, “Sincronizar agora”) fica para `prd-conta-sync`. |
| F10. PWA | RF44–RF45 | |

## Critérios de aceitação

Texto completo no documento-mãe.

| Critério | Requisitos | Resumo |
| --- | --- | --- |
| CA-01 | RF1–RF3 | Três parágrafos nas Notas preservados; sem rolagem interna. |
| CA-02 | RF4 | Após salvar, campos vazios e foco na Frente. |
| CA-03 | RF5 | Editar o Verso não muda próxima revisão nem número de revisões. |
| CA-04 | RF6, RF12 | Lacuna `_____` antes de revelar; fundo sutil depois. |
| CA-05 | RF6, RF11 | Destaque visível antes e depois de revelar. |
| CA-06 | RF6, RF13 | Verso e Notas só oferecem “Destacar seleção”. |
| CA-07 | RF9 | Lacuna acompanha a edição; some ao apagar a palavra. |
| CA-08 | RF7 | “Tirar destaque” remove só aquela marca. |
| CA-09 | RF14, RF17 | “Meus cartões” na primeira abertura; nada recriado após excluir o último. |
| CA-10 | RF15, RF16 | Criar baralho pelo seletor ativa sem navegar; excluir limpa lista e fila. |
| CA-11 | RF19, RF23 | Número de hoje sobe em ≤ 60 s sem recarregar. |
| CA-12 | RF24 | Máximo de 10 novos intercalados com “novos por dia” = 10. |
| CA-13 | RF25–RF27 | Espaço / 1 / 2; tecla repetida registra uma só revisão. |
| CA-14 | RF30 | Editar durante a revisão volta ao mesmo cartão corrigido. |
| CA-15 | RF31, RF33 | Busca nas Notas com 5.000 cartões e rolagem fluida. |
| CA-16 | RF34 | 8 acertos em 10 → retenção 80% e dia no heatmap. |
| CA-17 | RF36 | Sem rede e sem conta: criar, revisar e ver progresso sem erro. |
| CA-21 | RF43 | Nenhum controle de áudio, voz, velocidade, gravação ou fonética. |
| CA-22 | RF44 | Depois da primeira visita, recarregar offline abre a Home e permite revisar. |
| CA-23 | Legibilidade | A 360 px: leitura ≥ 16 px, rótulo ≥ 13 px, sem rolagem horizontal. |

## Experiência do usuário

Igual ao documento-mãe (perfil, identidade visual, escala tipográfica, acessibilidade, mobile-first). Fluxos cobertos: 1 (cadastro em série), 2 (revisão diária), 3 (correção) e 4 (organização).

Sem Supabase no build, a tela de Ajustes não mostra seção de conta nesta entrega; ela entra com `prd-conta-sync`.

## Restrições técnicas de alto nível

As do documento-mãe, exceto as de backend, que não se aplicam a esta entrega: nenhuma chamada de rede além dos arquivos estáticos e do service worker.

## Fora do escopo

- Tudo o que o documento-mãe exclui.
- Conta, login, sincronização e a migration do Supabase (`prd-conta-sync`).
- Toda a Fase 2 (F11–F17).
