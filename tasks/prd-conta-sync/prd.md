# Documento de Requisitos do Produto (PRD) — Conta e sincronização

> Entrega 2 de 2 da Fase 1. Documento-mãe: [tasks/produto/prd.md](../produto/prd.md) — visão, identidade visual, restrições e fora do escopo valem aqui sem repetição. Os IDs (US, RF, CA) são os do documento-mãe, preservados para rastreabilidade. Depende de [prd-mvp-offline](../prd-mvp-offline/prd.md) concluído e validado no preview.

## Visão geral

Conta opcional por email e senha e sincronização por linha entre aparelhos, como no Lingo. O app continua funcionando por completo sem conta; a nuvem é uma camada oportunista sobre os dados locais que o MVP offline já grava. Termina com a Fase 1 em produção: migration aplicada no banco remoto `certamecards` e promoção da `des` para `prod`, somente após pedido explícito do Rafael.

## Objetivos

- Conta e sincronização prontas em até 1 semana após o MVP offline.
- Zero perda de revisão ou cartão entre aparelhos em uso normal (LWW por linha, logs imutáveis).
- Quem não usa conta não baixa o SDK do Supabase (import dinâmico).
- Nenhum erro de rede ou servidor bloqueia o estudo.

## Histórias de usuário

- **US8** (parte da sincronização): estudar sem internet e ter tudo sincronizado depois entre celular e computador.
- **US10** (parte da conta): ao criar conta depois de usar só no aparelho, decidir o que acontece com os dados locais.

## Principais funcionalidades

Os requisitos abaixo estão descritos por inteiro no documento-mãe.

| Funcionalidade | Requisitos | Observação |
| --- | --- | --- |
| F8. Conta e sincronização | RF37–RF41 | RF36 (sem conta, 100% no aparelho) já entregue e agora vira regressão. |
| F9. Ajustes | RF42 **parcial** | Seção de conta: entrar/sair, última sincronização, “Sincronizar agora”. |

## Critérios de aceitação

Texto completo no documento-mãe.

| Critério | Requisitos | Resumo |
| --- | --- | --- |
| CA-18 | RF37, RF38 | Revisões offline num aparelho aparecem no outro após sincronizar, sem duplicar logs. |
| CA-19 | RF39 | Dados dos dois lados → juntar / descartar / cancelar; “cancelar” não altera nada local. |
| CA-20 | RF40 | Dados da conta A nunca aparecem na conta B. |
| CA-17 | RF36 | **Regressão:** com Supabase configurado mas sem conta ou sem rede, criar, revisar e ver progresso sem erro. |

Critério próprio desta entrega, derivado do RF41:

- **CA-S1** (RF41): Dado um build sem `NG_APP_SUPABASE_URL`, quando o usuário abre Conta ou Ajustes, então vê que a sincronização não está disponível, sem erro no console e sem requisição ao Supabase.

## Experiência do usuário

Igual ao documento-mãe. Fluxos novos:

1. *Primeira conta*: Ajustes → Entrar → cadastro por email → confirmação → dados locais sobem sozinhos (lado remoto vazio não é conflito).
2. *Segundo aparelho*: Entrar com a mesma conta → dados baixam; se o aparelho já tinha cartões, escolher juntar, descartar ou cancelar.
3. *Status*: Ajustes mostra “Sincronizado há 2 min”, “Offline — seus dados estão no aparelho” ou um erro curto; nunca um bloqueio.

## Restrições técnicas de alto nível

As do documento-mãe, em especial: Supabase (Postgres + Auth + RLS + RPC), isolamento por usuário no banco, nenhuma chave secreta no bundle, ambientes isolados (Supabase local no desenvolvimento / preview sem sincronização / banco remoto `certamecards` só em produção), sincronização paginada em 500 linhas.

## Fora do escopo

- Tudo o que o documento-mãe exclui.
- Uso das colunas de Fase 2 já presentes no schema (`cards.tags`, `user_settings`): elas sincronizam, mas nenhuma tela as edita.
- Imagens, push e a migration da Fase 2.
- Login social, recuperação de senha além do padrão do Supabase Auth, exclusão de conta.
