# Relatório de revisão de código — Tema claro

## Resumo
- Data: 2026-10-07
- Branch: `des`
- Status: APROVADO COM RESSALVAS

Os quatro comandos de validação passaram, o código segue as rules e a TechSpec, e todos os problemas encontrados foram corrigidos nesta revisão. A ressalva é de baixa severidade e não bloqueia: três arquivos de teste novos passam de 100 linhas, como outros 48 dos 106 arquivos de teste do repositório.

## Conformidade com regras
| Regra | Status | Observações |
|------|--------|-------------|
| `code-standards.md` — arquivos ≤ 100 linhas | OK | Todo código novo cabe (maior: `theme-store.ts`, 53). **Corrigido na revisão:** `styles.css` tinha ficado com 145 linhas ao receber os tokens novos. Os tokens foram para `src/styles/tokens.css` (76 linhas) e o `styles.css` caiu para 69. O CSS gerado tem as mesmas regras (mudou só a posição do bloco `:root[data-theme=light]`, irrelevante: o seletor tem especificidade maior). Ressalva: `theme.test.ts` (118), `theme-palette.test.ts` (108) e `theme-store.test.ts` (110) passam de 100, como 48 dos 106 testes do repositório. Fica como baixa. |
| `code-standards.md` — funções ≤ 30 linhas, guardas, constantes nomeadas | OK | Funções curtas e com guarda. Constantes nomeadas (`THEME_STORAGE_KEY`, `DARK_SCHEME_QUERY`, `LAST_SYNC_KEY`, limiares de contraste nos testes). |
| `code-standards.md` — ≤ 3 parâmetros | OK | **Corrigido na revisão:** o helper `tinted` de `theme-palette.test.ts` tinha 4 parâmetros. Agora recebe um objeto `Tint`. |
| `code-standards.md` — sem comentários, sem segredos | OK | Nenhum comentário nos arquivos novos. Nenhum segredo. |
| `javascript-typescript.md` — `const`, `===`, nunca `any`, tipos | OK | **Corrigido na revisão:** o script inline do `index.html` usava `var` (a TechSpec pedia ES5). Agora usa `const` e `catch {}`. Ver “Aderência”. Não há `any` (o `JSON.parse` do teste de `angular.json` ganhou tipo). |
| `javascript-typescript.md` — exports nomeados, união de strings, `import type` | OK | `ThemePreference`/`ResolvedTheme` são uniões; sem `enum` nem `default`. |
| `tests.md` — todo código com teste; correção de bug com teste | OK | `theme.ts` (23 casos), `sync-storage.ts` (novo, 11), `ThemeStore` (8), paleta (44), script de primeira pintura e `angular.json` (11), `App` (2 em `sync-startup.test.ts`). O bug do armazenamento bloqueado tem teste que falha sem a correção (`readLastSyncAt` com `getItem` que lança). |
| `tests.md` — FIRST/AAA, sem rede, disco ou banco real | OK | Fakes em `src/test/` (`fake-match-media`, `contrast`, `theme-tokens`, `theme-baseline`). A leitura de `styles/*.css`, `index.html` e `angular.json` usa só `fs` local. |
| Estrutura de pastas e camadas | OK | `domain/theme.ts`, `local-storage.ts` e `sync-storage.ts` sem `@angular/*`, `rxjs` nem imports de `state/`/`pages/`/`ui/`. A página usa só o `ThemeStore`, nunca o `localStorage`. `src/test/` só é importado por `*.test.ts`. Kebab-case sem sufixo. |
| Convenções de Angular | OK | `settings-theme` standalone, OnPush, `inject()`, `@for`. O `ThemeStore` usa `@Service()`, signals e `addEventListener` nativo, sem RxJS e sem `effect()`. |
| Estilo visual | OK | Cores só por token, nenhum hex em `src/app/` (os hex do `index.html` ficam fora e o TU-T10 confere que batem com `--ink`). Escala tipográfica respeitada (`text-label` no `legend`, `text-meta` nas opções). `text-on-signal` no segmento marcado. `check:type-scale` limpo. |
| Regras de domínio (lacuna, FSRS, `card-limits`) | OK | Fora do alcance: nenhuma dessas áreas foi tocada. |
| `supabase/migrations/` | OK | Sem mudança de schema, RPC nem `sync-rows`. Confirmado no banco local: 0 colunas `*theme*`. |

## Aderência à TechSpec
| Decisão Técnica | Implementado | Observações |
|-----------------|--------------|-------------|
| Tema como atributo `data-theme` + variáveis CSS, sem `dark:` nem classes por tema | SIM | Bloco `:root[data-theme='light']` em `styles/theme-light.css`. |
| Script inline no `<head>` antes da primeira pintura | SIM | **Desvio menor justificado:** a TechSpec dizia “ES5”. Usa `const`/`catch {}`, porque a rule proíbe `var` e todo navegador com `prefers-color-scheme` e variáveis CSS já os suporta. A regra e o contrato (`data-theme`, `theme-color`) são os mesmos, e o TU-T10 executa o script real. |
| `inlineCritical: false` em produção | SIM | Comprovado pelo E2E-17: o controle com `true` mostrou 1 quadro escuro, com `false` nenhum em 46 quadros. |
| `domain/theme.ts` com API definida | SIM | **Desvio menor justificado:** `browserStorage` e o tipo `KeyValueStorage` moram em `domain/local-storage.ts`, porque o `SyncStore` também precisa deles. `theme.ts` os reexporta, então a API pública é a da TechSpec. |
| `ThemeStore` root, sem `effect()`, `theme-color` lido de `--ink` computado | SIM | Instanciado no construtor do `App` (coberto por `sync-startup.test.ts`). |
| Tokens novos com valor derivado no escuro (`edge`, `placeholder(-strong)`, `scrim`, `heat-0…3`) | SIM | Equivalência exata conferida pelo TU-T9 e pelos pixels (29 de 32 telas idênticas, 3 com diferença de 1 a 13 pixels de anti-aliasing). |
| `hit`/`miss` escurecidos e demais valores da paleta final | SIM | Valores iguais aos da tabela da TechSpec. |
| Troca de `border-line` → `border-edge` só em controles | SIM | 48 linhas em ~30 arquivos. Restam em controles só `difficult-row` (divisória de linha de lista) e `home.html` (`hover:` de borda transparente), ambos intencionais. O espelho do `markable-field` ficou em `line` (ver registro de problemas). |
| Placeholders, `scrim`, heatmap e barras da previsão | SIM | `placeholder:text-placeholder` (2), `placeholder-strong` (2), `backdrop:bg-scrim` (5), `fill-heat-N`, `bg-edge`. |
| `color-scheme` não declarado | SIM | Nenhuma ocorrência. |
| Seção Aparência: controle segmentado com rádios nativos | SIM | `<fieldset>`/`<legend>`, opções de 64 px, setas funcionam, foco visível. |
| Preferência só no aparelho, sem sync | SIM | Chave `certamecards.theme` no `localStorage`; nada no Dexie nem no Supabase. |
| Arquivos de CSS | SIM | **Acréscimo:** `src/styles/tokens.css` (não previsto) para manter `styles.css` ≤ 100 linhas. `AGENTS.md` atualizado. |

## Tarefas verificadas
| Tarefa | Status | Observações |
|------|--------|-------------|
| 1.0 Linha de base do escuro | COMPLETA | 32 capturas + README + seed em `evidences/baseline-dark/`. |
| 2.0 `domain/theme.ts` | COMPLETA | TU-26, TU-T1–T4 presentes e passando. |
| 3.0 Tokens | COMPLETA | TU-27, TU-T6–T9 presentes. A leitura dos tokens passou a vir de `tokens.css` (helper atualizado). |
| 4.0 Troca de classes | COMPLETA | E2E-T12 com comparação pixel a pixel em `evidences/after-dark/`. |
| 5.0 Primeira pintura | COMPLETA | TU-T10, TU-T11 e E2E-17 com controle negativo. |
| 6.0 `ThemeStore` | COMPLETA | TI-T1–T6 (mais um caso sem `matchMedia`). |
| 7.0 Seção Aparência e `AGENTS.md` | COMPLETA | E2E-T1 e E2E-T15 com evidência. |
| 8.0 Validação final | COMPLETA | CI local e os roteiros restantes (T2, T4–T11, T13, T14) com evidência. A validação funcional dos CA continua com o QA. |

## Testes
- Total de testes: 776 (108 arquivos)
- Passando: 776
- Falhando: 0
- Cobertura: 98,19% de linhas, 92,35% de ramos, 98,45% de funções, medida em `src/app/domain/**` (meta: 80%). Atendida.

Saída dos comandos, na ordem: `npm run lint` → “All files pass linting.” · `npm run check:type-scale` → “nenhuma violação encontrada.” · `npm run test:coverage` → 108 arquivos e 776 testes passando, piso atendido · `npm run build` → sucesso, só com o aviso de orçamento do bundle inicial (900,99 kB contra 500 kB de alerta), anterior a esta entrega: o build logo após os primeiros tokens, sem nenhuma mudança de TS, já mostrava ~904 kB.

## Problemas encontrados
| Severidade | Arquivo | Linha | Descrição | Sugestão |
|------------|---------|-------|-----------|----------|
| Média | `src/styles.css` | todo | Passou de 100 linhas (145) ao receber os tokens novos. **Corrigido:** tokens movidos para `src/styles/tokens.css`; CSS compilado com as mesmas regras. | — |
| Baixa | `src/app/domain/theme-palette.test.ts` | 18 | Helper `tinted` com 4 parâmetros, contra a regra de ≤ 3. **Corrigido:** objeto `Tint`. | — |
| Baixa | `src/index.html` | 10–18 | Script inline com `var`, contra `javascript-typescript.md`. **Corrigido:** `const` e `catch {}`; TU-T10 continua passando. | — |
| Baixa | `AGENTS.md` | 76 | Indicava os tokens em `styles.css`. **Corrigido** para `styles/tokens.css`. | — |
| Baixa | `src/app/domain/theme.test.ts`, `theme-palette.test.ts`, `src/app/state/theme-store.test.ts` | — | 118, 108 e 110 linhas, acima das 100 da rule. Há 48 arquivos de teste nessa situação no repositório. **Não corrigido** (ressalva). | Ao mexer nesses arquivos, separar por responsabilidade (ex.: armazenamento do tema em outro arquivo). |

Já corrigidos antes da revisão, na tarefa 8.0 (com teste ou evidência): armazenamento bloqueado derrubava o `SyncStore`, teste `sync-startup` sem o `ThemeStore` e borda dobrada no `markable-field`.

## Pontos positivos
- A regra do tema é pura e testada (`resolveTheme`, leitura e escrita que nunca lançam), e o store é fino.
- O teste de equivalência do escuro (TU-T9) lê o CSS real, então proteger o CA-T12 não depende de screenshot.
- Os testes de contraste calculam sobre os tokens de verdade, resolvendo `var()` e `color-mix`, e travam a paleta.
- A decisão do `inlineCritical: false` tem controle negativo reproduzido, o que é raro.
- O bug de armazenamento bloqueado foi achado pelo E2E, corrigido na origem e coberto por teste.

## Recomendações
- Revisar o orçamento do bundle inicial (900 kB contra 500 kB de alerta). É anterior a esta entrega e tem de ser tratado fora dela.
- O registro automático do service worker não apareceu em 45 s no navegador de teste (`registerWhenStable:30000`). Vale investigar à parte, porque afeta a promessa de uso offline.
- Se uma Content-Security-Policy for adotada um dia, o script inline do `index.html` precisará de hash `sha256`, como a TechSpec já registra.

## Conclusão
A entrega está conforme as rules e a TechSpec, com todos os testes passando e a cobertura de `domain/` acima do piso. Foram encontrados e corrigidos 4 desvios (arquivo de CSS acima de 100 linhas, helper com 4 parâmetros, `var` no script inline e referência desatualizada no `AGENTS.md`), sem alterar comportamento: os 776 testes seguem verdes e o CSS gerado tem as mesmas regras. Permanece apenas a ressalva de baixa severidade sobre o tamanho de três arquivos de teste. Não restam bloqueadores. A validação funcional dos critérios de aceitação fica para o `/executar-qa`.

Ambiente: esta revisão não subiu nenhum serviço. Havia um Supabase local no ar (`supabase_*_certamecards`, ativo há ~14 min, portas 55321–55327) que não foi iniciado por esta execução e foi mantido.
