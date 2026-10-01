# Tarefa 7.0: Validação final

## Visão geral

Fecha a entrega. Primeiro roda a sequência completa do CI. Depois executa os três roteiros que precisam de ambiente especial: sincronização com o Supabase local (E2E-A5), offline e preparo do leitor no build de produção servido localmente, com service worker ativo (E2E-A6), e volume, tempo e legibilidade a 360 px (E2E-A7). Por fim, confere no preview da `des` que o `.wasm` é servido como `application/wasm`. Corrige o que os roteiros encontrarem, cada correção com o teste que a prova.

<skills>
### Conformidade com skills

- `agent-browser`: roteiros E2E-A5, E2E-A6 e E2E-A7, com emulação de offline, rede lenta, CPU lenta e largura de 360 px, e capturas em `tasks/prd-importacao-anki/evidences/`.
- `supabase`: subir o Supabase local (`npx supabase start`, portas 55321–55327) para o E2E-A5. Sem migration nem RPC novos.
- `vercel-cli`: só leitura do deploy de preview da `des`, para conferir o tipo MIME do `.wasm`. Nenhuma variável de ambiente nova, nenhuma promoção para produção.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e as rules em `.agents/rules/`. Pontos relevantes:
- Comandos obrigatórios: `npm run lint`, `npm run check:type-scale`, `npm run test:coverage` (piso de 80% em `src/app/domain/**`) e `npm run build`.
- Subir o app numa porta livre em 4200–4299 (conferir com `ss -ltn`), registrar o que subiu e encerrar só os processos iniciados. Se o `supabase start` acusar porta ocupada, `npx supabase stop --project-id <id>` (nunca `--no-backup`) e avisar.
- Desenvolvimento nunca fala com o banco de produção. Promover para a `prod` só a pedido do Rafael.
- Bug encontrado entra com um teste que falha antes da correção.
</rules>

<requirements>
- Objetivos do PRD: velocidade (10.000 notas < 30 s no desktop, 5.000 < 30 s no celular), compatibilidade e atomicidade.
- RF60p: comportamento sem rede antes e depois do primeiro uso, com o service worker real.
- US15e: cartões importados aparecem no outro aparelho da mesma conta, sem duplicar.
- Legibilidade: 360 px sem rolagem horizontal e escala tipográfica do produto.
</requirements>

## Subtarefas

- [x] 7.1 Rodar `npm run lint`, `npm run check:type-scale`, `npm run test:coverage` e `npm run build`, todos verdes.
- [x] 7.2 E2E-A5 com o Supabase local (dois perfis do navegador na mesma conta).
- [x] 7.3 E2E-A6 contra o build de produção servido localmente (perfil novo, offline antes de abrir `/importar`, religar a rede, rede lenta cortada no meio).
- [x] 7.4 E2E-A7: 10.000 notas no desktop e 5.000 com o celular emulado (CPU 4× lenta), medidas no painel Performance; 360 px em todos os passos.
- [ ] 7.5 Conferir no preview da `des` que `/sqljs/sql-wasm-browser.wasm` responde com `Content-Type: application/wasm`, e não com o `index.html` do `rewrites`.
- [x] 7.6 Registrar as evidências e encerrar os processos iniciados.

## Detalhes de implementação

Ver [techspec.md](techspec.md):
- “Testes E2E”: parágrafo de abertura e linhas de E2E-A5, E2E-A6 e E2E-A7.
- “Dependências técnicas”: deploy e o tipo MIME do `.wasm` na Vercel.
- “Riscos conhecidos”: memória com pacotes grandes e custo do `DOMParser` (as medições do E2E-A7 decidem se é preciso mitigar).
- “Monitoramento e observabilidade”.

## Critérios de aceitação relacionados

- CA-A17
- CA-A18
- CA-A19
- CA-A20

## Testes da tarefa

### Testes E2E

- [x] E2E-A5 — sincronização dos importados (Supabase local)
- [x] E2E-A6 — offline e preparo do leitor (build de produção)
- [x] E2E-A7 — volume e legibilidade

## Arquivos relevantes

- `tasks/prd-importacao-anki/evidences/` (capturas e medições)
- `ngsw-config.json`, `angular.json`, `vercel.json` (conferência)
- `src/app/domain/anki-*.ts`, `src/app/state/anki-*.ts`, `src/app/pages/import/*` (correções, se houver)
