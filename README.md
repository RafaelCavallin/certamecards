# CertameCards

Aplicativo de **revisão por repetição espaçada para concursos públicos**. Você transforma o que estuda — artigos de lei seca, súmulas, conceitos, prazos, pegadinhas de banca — em cartões de **Frente / Verso / Notas**, destaca as palavras-chave e esconde o que precisa lembrar. Roda 100% no navegador, funciona offline e é instalável como PWA.

O agendamento das revisões é calculado pelo FSRS, um algoritmo de memória moderno, e não por intervalos fixos. A resposta é binária (*Errei* ou *Acertei*) e a tela de revisão foi feita para textos longos: tipografia maior, sem distrações.

> Status: em construção. Fase 1 (MVP) em andamento; requisitos em [tasks/produto/prd.md](tasks/produto/prd.md) e arquitetura em [tasks/produto/techspec.md](tasks/produto/techspec.md).

## Principais recursos

### Fase 1 — MVP

- **Cartões Frente / Verso / Notas** — texto puro com parágrafos; Notas longas (até 20.000 caracteres) que crescem sem barra de rolagem.
- **Destacar e ocultar** — selecione um trecho e destaque-o (“**salvo**”, “**vedado**”) ou, na Frente, oculte-o como lacuna (“o prazo é de _____ dias”). Destaques aparecem sempre; lacunas só existem na Frente.
- **Agendamento com FSRS** (`ts-fsrs` v5) e fila do dia com limite de novos por dia e teto de cartões ainda não firmados.
- **Revisão pelo teclado** — `espaço` revela e acerta, `1` errou, `2` acertou; dá para editar o cartão no meio da sessão.
- **Baralhos** criados na hora pelo seletor do cabeçalho, sem cadastro de matérias.
- **Lista de cartões** com busca em frente, verso e notas, edição e exclusão em lote, fluida com milhares de cartões.
- **Progresso** — retenção de 30 dias, sequência de dias, previsão de vencimentos, maturidade e heatmap de constância.
- **Offline-first** — cartões e histórico ficam no navegador (Dexie/IndexedDB); a revisão inteira funciona sem rede.
- **Conta opcional** (email e senha) — sincroniza baralhos, cartões e histórico entre aparelhos via Supabase (Postgres + RLS), com última escrita vencendo por linha. Sem conta, o app funciona por completo no aparelho.

### Fase 2

Etiquetas por banca e tema · cartões difíceis e sessão de reforço (fora da agenda) · meta diária e lembrete por notificação · importação de baralhos do Anki (`.apkg`) · backup e restauração em `.zip` · tema claro · imagens nas Notas.

## Como rodar

```bash
npm install
npm start            # http://localhost:4200
```

Roda **sem nenhuma variável de ambiente**: tudo funciona no aparelho e a área de conta avisa que a sincronização não está disponível.

Para conta e sincronização com um Supabase local (requer Docker):

```bash
npx supabase start   # aplica supabase/migrations/
npx supabase status  # mostra URL e publishable key
```

Preencha `.env.local` com `NG_APP_SUPABASE_URL=http://127.0.0.1:55321` e `NG_APP_SUPABASE_PUBLISHABLE_KEY=<chave local>`. O `scripts/write-env.mjs` gera `src/environments/env.ts` antes do `start` e do `build`.

### Scripts

| Comando | O que faz |
| --- | --- |
| `npm start` | Servidor de desenvolvimento (`ng serve`) |
| `npm run build` | Build de produção, com type-check |
| `npm test` | Testes Vitest da camada de domínio |
| `npm run test:coverage` | Testes com piso de 80% de cobertura em `src/app/domain/**` |
| `npm run lint` | ESLint (`angular-eslint`) |
| `npm run check:type-scale` | Barra tamanhos de texto fora da escala tipográfica |

## Stack

- **Angular 22** — standalone, signals, zoneless, `OnPush`
- **Tailwind CSS v4** com tokens de cor e escala tipográfica semântica; fontes auto-hospedadas via `@fontsource-variable` (Bricolage Grotesque, Inter, JetBrains Mono)
- **Dexie** (IndexedDB) para persistência local
- **ts-fsrs** para o agendamento
- **Supabase** (Postgres, Auth, RLS, RPC `sync_push`) para conta e sincronização
- **@angular/service-worker** para instalação e uso offline
- **Vitest** + `fake-indexeddb` para os testes do domínio
- Hospedagem estática na **Vercel**; gráficos em SVG, sem biblioteca

## Estrutura

```
src/app/
  domain/    TypeScript puro: Dexie, FSRS, fila, marcas, sync, auth, estatísticas
  state/     Serviços Angular com signals (baralho ativo, sessão, sincronização)
  pages/     Uma pasta por rota: home, review, cards, card-new, card-edit, progress, settings, account
  ui/        Componentes reutilizados: markable-field, marked-text, card-form, heatmap, deck-switcher
supabase/
  migrations/  Schema, RLS e as RPCs de sincronização
tasks/         PRD, TechSpec, tarefas e relatórios de review e QA
```

Instruções para agentes de código estão em [AGENTS.md](AGENTS.md).
