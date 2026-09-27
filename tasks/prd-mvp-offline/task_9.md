# Tarefa 9.0: Lista, Progresso e Ajustes

## Visão geral

A lista de cartões do baralho ativo com busca, virtualização e exclusão em lote; a tela de Progresso com estatísticas, heatmap, previsão de 14 dias e ajuste de ritmo; e a tela de Ajustes sem a seção de conta.

<skills>
### Conformidade com skills

- `angular-developer` — `@angular/cdk/scrolling`, `loadComponent`, gráficos em SVG próprio.
- `agent-browser` — roteiro de lista e Progresso com 5.000 cartões semeados.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Lidos o `AGENTS.md` e todas as rules em `.agents/rules/`.

- `progresso` carregada com `loadComponent`.
- Gráficos em SVG próprio, sem biblioteca.
- Ajustes sem controles de voz, velocidade, gravação ou fonética (RF43).
- A seção de conta é da entrega `prd-conta-sync`; aqui não aparece.
</rules>

<requirements>
- RF31: busca por texto em Frente, Verso e Notas; contagem; editar e excluir por item.
- RF32: seleção múltipla com exclusão em lote e confirmação.
- RF33: lista incremental, fluida com 5.000 cartões.
- RF34: retenção de 30 dias, sequência, total de revisões, heatmap, previsão de 14 dias, maturidade.
- RF35: seção “Ritmo” edita “novos por dia” e teto de não firmados (`updateDeckRhythm`).
- RF42 (parcial): nome do baralho ativo e versão do app.
- RF43: nenhum ajuste de áudio ou fonética.
</requirements>

## Subtarefas

- [x] 9.1 `pages/cards` (busca com `searchCards`, virtualização, seleção múltipla, `confirm-dialog`)
- [x] 9.2 `ui/bar-chart` e `pages/progress` (reusa `heatmap`; seção “Ritmo”)
- [x] 9.3 `pages/settings` (nome do baralho, versão)
- [x] 9.4 Semeador de 5.000 cartões para o roteiro (script de desenvolvimento, fora do bundle)
- [x] 9.5 Roteiro de lista e Progresso: busca nas Notas, rolagem, lote, retenção 8/10 no Progresso

## Detalhes de implementação

Ver `techspec.md` → “Sequenciamento — etapa 6”; na base, tabelas “Camada `pages/`” e “Camada `ui/`” e a decisão “Gráficos em SVG próprio”.

## Critérios de aceitação relacionados

- CA-15
- CA-16
- CA-21

## Testes da tarefa

A busca e as estatísticas já estão cobertas pelos TU-10 e TU-11 (tarefa 5.0).

### Testes E2E

- [x] Roteiro de lista e Progresso com 5.000 cartões semeados (conferência de CA-15 e CA-16; sem ID próprio na TechSpec)

## Arquivos relevantes

- `src/app/pages/cards/`, `progress/`, `settings/`
- `src/app/ui/bar-chart/`
- Lingo: `Cards.tsx`, `Progress.tsx`, `Settings.tsx`
