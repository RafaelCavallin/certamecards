# Tarefa 7.0: pages — Ajustes

## Visão geral

Mostra em Ajustes o uso das imagens e o envio pendente. Um subcomponente da página, `pages/settings/settings-images`, exibe a linha “Imagens”: “34 imagens · 12,3 MB”, e com sessão também “de 1 GB”. Na seção Conta e sincronização, ao lado da última sincronização, aparece “N imagens aguardando envio” quando houver. As duas leituras são reativas por `liveQuerySignal` sobre `imageUsage` e `pendingUploadCount`, já testadas na tarefa 2, e mudam na hora quando cartões são excluídos ou imagens sobem.

<skills>
### Conformidade com skills

- `angular-developer`: subcomponente de página, `liveQuerySignal`, `computed` com o estado da sessão do `AuthStore`.
- `agent-browser`: conferência na tarefa 8 (E2E-I6, E2E-I7).
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e as rules em `.agents/rules/`. Pontos relevantes:
- `pages/` lê por `liveQuerySignal` sobre funções de `domain/`, sem abrir o Dexie.
- Subcomponente em `pages/settings/` (e não em `ui/`): só Ajustes o usa (AGENTS: `ui/` é para duas páginas ou mais).
- Textos vindos de `image-labels.ts` (tarefa 2, TU-I12); números pt-BR.
- `settings.html` e `settings.ts` continuam ≤ 100 linhas cada; escala `text-label`/`text-meta`; `npm run check:type-scale`.
- Sem conta: nenhuma menção a envio ou nuvem (RF77a).
</rules>

<requirements>
- RF74e: linha Imagens com contagem e tamanho das imagens vivas de cartões vivos, de todos os baralhos; com conta, total da conta e o limite de referência “de 1 GB”; só informativa.
- RF77f: “N imagens aguardando envio” junto da última sincronização, só com sessão e quando N > 0.
- RF77a: sem conta, nenhum texto de envio.
</requirements>

## Subtarefas

- [x] 7.1 `pages/settings/settings-images.ts/.html`: seção “Imagens” com `imageUsageLabel`.
- [x] 7.2 `pages/settings/settings.ts/.html`: incluir a seção e a linha de pendentes (`pendingUploadsLabel`) no bloco de sessão.
- [x] 7.3 Conferir no navegador, sem conta: contador e ausência de qualquer texto de envio. A conferência com conta (pendentes e “de 1 GB”) fica na tarefa 8.

## Detalhes de implementação

Ver [techspec.md](techspec.md):
- “Visão dos componentes”: linha `pages/settings/settings-images.ts/.html`.
- “Modelos de dados”: `ImageUsage` (exemplo de texto com e sem sessão).
- “Monitoramento e observabilidade”: o contador e os pendentes como sinais visíveis.

## Critérios de aceitação relacionados

- CA-I19
- CA-I22
- CA-I23

## Testes da tarefa

A regra (contagem, pendentes e textos) já está coberta por TU-I12 e TI-I12 na tarefa 2. A tela é validada pelos roteiros da tarefa 8:

### Testes E2E

- [x] E2E-I6 — parte “3 imagens aguardando envio” (executado na tarefa 8)
- [x] E2E-I7 — parte do contador (executado na tarefa 8)

## Arquivos relevantes

- `src/app/pages/settings/settings-images.{ts,html}` (novos)
- `src/app/pages/settings/settings.{ts,html}` (modificados)
- `src/app/domain/{card-images,image-labels}.ts` (tarefa 2), `src/app/state/{live-query,auth-store}.ts` — só leitura

> **Ajustes feitos na implementação:**
> - O estado da conta vem do `AuthStore.session()` (não de `phase`): a linha mostra “de 1 GB” só com sessão ativa.
> - Sem conta, conferido no navegador: “23 imagens · 541 KB” (igual ao total do IndexedDB, 554.352 bytes) e nenhuma menção a envio ou nuvem. A linha “N imagens aguardando envio” e o “de 1 GB” com conta são verificados na tarefa 8 (E2E-I6 e E2E-I7), com o Supabase local.
> - Evidência: `evidences/e2e-i7-ajustes-sem-conta.png`.
