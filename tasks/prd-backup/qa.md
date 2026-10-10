# Relatório de QA — Backup e restauração

As evidências estão em `tasks/prd-backup/evidences/` (arquivos `qa-*`).

## Resumo
- Data: 2026-10-02
- Status: BLOQUEADO (QA parcial: parte dos roteiros E2E não foi executada no navegador, ver abaixo)
- Total de critérios de aceitação: 18 (CA-36, CA-37, CA-B1 a CA-B16)
- Critérios atendidos com verificação no navegador: 7 (CA-B1, CA-B4, CA-B7 sem o download automático, CA-B10 parcial, CA-B14, CA-B16 e CA-37 por Mesclar)
- Critérios cobertos só por teste automatizado: CA-36, CA-B2, CA-B3, CA-B5, CA-B6, CA-B8, CA-B9, CA-B11, CA-B12, CA-B13
- Bugs encontrados: 0

Ambiente: `npm start -- --port 4231`, sem Supabase, sem conta. O servidor foi encerrado e a porta liberada. Não subi o Supabase local.

## Critérios de aceitação verificados
| ID | Critério | Casos de teste | Status | Evidência |
|----|----------|----------------|--------|-----------|
| CA-36 | Substituir deixa os dados idênticos aos da origem | TI-13, TU-B5, E2E-16 | PASSOU (automatizado); navegador parcial | qa-replace-done-360.png |
| CA-37 | Mesclar mantém a edição mais recente | TI-14, E2E-16 | PASSOU | qa-merge-done-360.png |
| CA-B1 | Exportar gera o zip e a prévia mostra as contagens | TI-B1, TU-B11, E2E-B1 | PASSOU (1 baralho, 3 cartões; sem 50 cartões, 300 revisões e 4 imagens) | qa-backup-360.png, qa-b1-exported-360.png |
| CA-B2 | Trocar de celular preserva agenda, meta, tema e baralho ativo | TI-13, TI-B8, E2E-B2 | NÃO EXECUTADO no navegador; passou nos testes | — |
| CA-B3 | Imagem só na nuvem fica de fora, com aviso | TI-B2, TU-B13 | NÃO EXECUTADO no navegador; passou nos testes | — |
| CA-B4 | `.zip` alheio e versão maior mostram a mensagem certa | TU-29, TI-B11, E2E-B3 | PASSOU | qa-b3-alien-360.png, qa-b3-v2-360.png |
| CA-B5 | Itens inválidos são descartados na prévia | TU-B1, TU-B2, TU-B4 | PASSOU (automatizado) | — |
| CA-B6 | Mesclar depois de estudar não duplica nem desfaz | TI-B3, E2E-B4 | PASSOU (automatizado) | — |
| CA-B7 | Substituir exclui órfãos, avisa e preserva histórico | TI-B4, E2E-B5 | PASSOU: o cartão fora do arquivo foi excluído e a confirmação apareceu. O download automático não foi observado. | qa-replace-confirm-360.png, qa-replace-done-360.png |
| CA-B8 | Falha no backup automático impede a substituição | TU-B14, E2E-B5 | NÃO EXECUTADO no navegador | — |
| CA-B9 | Backup de outra conta pede confirmação | TU-B9, TI-B11, E2E-B6 | NÃO EXECUTADO (exige Supabase) | — |
| CA-B10 | Recarregar no meio da restauração não deixa resíduo | TI-B6, TI-B7, E2E-B7 | PASSOU (automatizado); E2E não executado | — |
| CA-B11 | Baralho ativo vira o primeiro do arquivo | TI-B8, E2E-B2 | PASSOU (automatizado) | — |
| CA-B12 | Offline e sem conta, sem erro | E2E-B8 | Fluxos sem conta passaram no navegador; rede desligada não testada | — |
| CA-B13 | Dois aparelhos sincronizam depois de Substituir | TI-B5, TI-B9, E2E-B9 | NÃO EXECUTADO (exige Supabase) | — |
| CA-B14 | Aviso de 30 dias | TU-B10, E2E-B10 | PASSOU: com 31 dias aparece; com 29 não aparece; some depois de baixar o backup. Com conta não testado. | qa-b10-31dias-360.png |
| CA-B15 | Desempenho com 5.000 cartões e 20.000 revisões | E2E-B11 | NÃO EXECUTADO | — |
| CA-B16 | Legibilidade em 360 px | E2E-B12 | PASSOU: sem rolagem horizontal (360/360 e 1280/1280) e nenhum texto abaixo de 13 px | qa-preview-360.png, qa-backup-1280.png |

## Testes E2E executados
| ID | Fluxo | Resultado | Observações |
|----|-------|-----------|-------------|
| E2E-16 | Exportar, depois Mesclar e Substituir | PASSOU (mesmo perfil, não outro perfil) | O Substituir excluiu o cartão novo; o resumo informou "1 baralho ou cartão do aparelho foi excluído". |
| E2E-B1 | Exportar | PASSOU | "Último backup: hoje". O arquivo tem `backup.json`, `format` correto e versão 1. O nome `certamecards-backup-AAAA-MM-DD.zip` não foi conferido no navegador (a ferramenta renomeia o download); está coberto por TU-B11. |
| E2E-B3 | Arquivos errados | PASSOU | As duas mensagens saíram como o PRD pede. |
| E2E-B4 | Mesclar depois de estudar | PASSOU parcial | Só criação de cartão; revisões e exclusão estão em TI-B3. |
| E2E-B5 | Substituir | PASSOU parcial | O download bloqueado não foi testado. |
| E2E-B10 | Aviso de 30 dias | PASSOU | O caso com conta não foi testado. |
| E2E-B12 | Legibilidade | PASSOU parcial | Larguras 360 e 1280, sem rolagem horizontal; teclado só até o primeiro Tab; contraste e `aria-live` não foram conferidos. |
| E2E-B2, B6, B7, B8, B9, B11 | — | NÃO EXECUTADO | B6 e B9 exigem Supabase local; B2, B7 e B11 exigem perfil novo, backup grande e CPU limitada. |

## Testes automatizados e cobertura
| Camada | ID | Resultado | Validação/comando | Observações |
|--------|----|-----------|-------------------|-------------|
| Unidade/Integração | TU-29, TU-B1–B14, TI-13, TI-14, TI-B1–B11 | PASSOU | `npm run test:coverage` | 676 testes em 103 arquivos |
| Lint | — | PASSOU | `npm run lint` | — |
| Escala tipográfica | — | PASSOU | `npm run check:type-scale` | — |
| Build | — | PASSOU | `npm run build` | Aviso: bundle inicial de 902 kB, acima do orçamento de 500 kB (herdado, ver codereview.md) |

- Cobertura: 98,16% de linhas em `src/app/domain/**` (meta: 80%). Os quatro comandos foram rodados na revisão de código de hoje, não de novo neste QA.

## Acessibilidade
- Teclado: só confirmei o primeiro Tab, que cai no link "Pular para o conteúdo". Não percorri Tab, Enter e Esc em todo o fluxo.
- Rótulos: botões, rádios e o seletor de arquivo têm nome acessível no snapshot. A mensagem de erro aparece em `alert`.
- Tamanho de fonte: nenhum elemento abaixo de 13 px em 1280 px.
- Não verificados: contraste, foco visível em todo o fluxo, barra de progresso e `aria-live` durante a restauração.

## Bugs encontrados e corrigidos
Nenhum bug encontrado nos fluxos executados.

Observação de UX, sem registrar como bug: depois de uma restauração concluída, a tela só oferece "Ir para o início". Para restaurar outro arquivo é preciso recarregar a página.

## Conclusão
Os fluxos de exportar, Mesclar, Substituir, arquivos inválidos, aviso de 30 dias e legibilidade passaram no navegador sem bugs. O QA fica BLOQUEADO, e não APROVADO, porque nem todos os critérios foram verificados: não rodei os roteiros com Supabase (E2E-B6, E2E-B9), desempenho (E2E-B11), recarregar no meio (E2E-B7), perfil novo (E2E-B2) e rede desligada (E2E-B8). Esses critérios têm cobertura automatizada passando, mas isso não substitui o roteiro de QA. O restante exige a sua decisão: subir o Supabase local e fazer a passada de desempenho.
