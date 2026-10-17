# Tarefa 4.0: domain e state — download sob demanda

## Visão geral

Traz para o aparelho os arquivos das imagens que chegaram só como metadados (`remote`). `image-download.ts` baixa as imagens que faltam de uma lista de cartões, 2 por vez e deduplicado por id. O blob é gravado e a imagem passa a `uploaded`, preservando `dirty`. Sem rede, sem conta ou sem sessão, a função não faz nada e nunca lança. `state/image-prefetch.ts` é o serviço raiz que a galeria e as sessões chamam: guarda o último pedido e o refaz quando a rede volta. As sessões de revisão e de reforço pedem o cartão atual e os 2 próximos da fila. A galeria (tarefa 6) só reage ao blob gravado pela `liveQuery`, e este serviço não expõe estado.

<skills>
### Conformidade com skills

- `angular-developer`: `@Service()` raiz com `inject()`, `DestroyRef` para soltar o listener de `online` e `effect` nas sessões.
- `supabase`: `storage.download` com a sessão vinculada.
</skills>

<rules>
### Conformidade com o AGENTS.md e as rules

Li o `AGENTS.md` e as rules em `.agents/rules/`. Pontos relevantes:
- A regra de download fica em `domain/`; `state/` só orquestra. O serviço existe porque o prefetch é compartilhado entre galeria, revisão e reforço (AGENTS: `state/` é para estado ou lógica compartilhada entre telas).
- O reforço continua sem gravar dados de estudo: o prefetch só grava blobs baixados, sem tocar em agendamento, logs ou estatísticas. A regra `no-restricted-imports` do reforço não pode ser violada: `reinforce-session.ts` importa só o `ImagePrefetch`, nunca o `db` nem módulos de escrita.
- Disparo em segundo plano explícito (`void`), `unknown` no `catch`, `console.warn` com id e fase.
- RxJS não entra: o `online` é ouvido com `addEventListener` + `DestroyRef`, como no `sync-store`.
</rules>

<requirements>
- RF77c: arquivo baixado quando o cartão é exibido (revisão, reforço ou edição) e, na revisão e no reforço, também para os 2 próximos; depois disso, disponível sem rede.
- RF77d: sem rede ou com falha, a imagem continua `remote` (placeholder) e é carregada sozinha quando a conexão volta, com o cartão na tela; nunca bloqueia revelar, responder ou avançar.
- RF77a: sem conta, nada é baixado nem anunciado.
</requirements>

## Subtarefas

- [x] 4.1 `image-download.ts`: `fetchMissingImages(cardIds)` com as guardas (online, cliente, conta vinculada, sessão igual), 2 downloads simultâneos, `Map` de promessas em andamento e gravação `new Blob([data], { type: mimeType })`.
- [x] 4.2 `state/image-prefetch.ts`: `request(cardIds)` (guarda o último pedido) e nova tentativa no `online`.
- [x] 4.3 `review-session.ts` e `reinforce-session.ts`: `effect` que pede o atual e os 2 próximos (`queue[index..index+2]` / `pending[0..2]`).
- [x] 4.4 Escrever TI-I6 e TI-I7 e completar a parte de prefetch do TI-I14.

## Detalhes de implementação

Ver [techspec.md](techspec.md):
- “Visão dos componentes”: linhas `image-download.ts`, `state/image-prefetch.ts`, `review-session.ts`/`reinforce-session.ts`.
- “Estados do arquivo”: linha `remote → uploaded`.
- “Endpoints da API”: `GET …/card-images/{user_id}/{image_id}` (download).
- “Pontos de integração”: `fetchMissingImages` fora do lock da sincronização, e por quê.
- “Principais decisões”: download sob demanda pelo cartão exibido + 2.

## Critérios de aceitação relacionados

- CA-42
- CA-I16
- CA-I17
- CA-I18

## Testes da tarefa

### Testes de integração

- [x] TI-I6 — `fetchMissingImages` baixa só o que falta e é deduplicado
- [x] TI-I7 — `fetchMissingImages` sem rede, sem conta ou com download falhando
- [x] TI-I14 — Sem Supabase configurado, `syncNow` e o prefetch não tocam em imagens (parte do prefetch)

### Testes E2E

Os roteiros que dependem desta tarefa (E2E-I6, E2E-18) rodam na tarefa 8, quando a galeria já existe.

## Arquivos relevantes

- `src/app/domain/image-download.ts` + `.test.ts` (novos)
- `src/app/state/image-prefetch.ts` (novo)
- `src/app/state/review-session.ts`, `reinforce-session.ts` (modificados)
- `src/app/domain/{auth,supabase,card-images,image-storage}.ts` — só leitura
- `src/app/state/sync-store.ts` — referência do padrão de `online` + `DestroyRef`
- `eslint.config.js` — conferir a regra `no-restricted-imports` do reforço

> **Ajustes feitos na implementação:**
> - `trackDirty` ganhou o parâmetro `localOnlyKeys`: mudar só `blobState` não torna a imagem suja. Sem isso, qualquer transição de estado (download, upload, limpeza) deixava `dirty: 1` quando o valor anterior era 0, porque o hook do Dexie só vê o diff. Com a correção, `setBlobState` virou um `update` simples (já não precisa da transação da tarefa 3). Tem teste próprio em `dirty-tracking.test.ts`.
> - `storeDownloadedImage` é exportada para ser testada: descarta o arquivo se a imagem foi excluída enquanto baixava.
> - Quando duas chamadas pedem a mesma imagem ao mesmo tempo, as duas compartilham o mesmo download e cada uma conta a imagem como baixada.
> - O `ImagePrefetch` refaz só o **último** pedido no `online` (o cartão na tela, como pede o RF77d). A galeria (tarefa 6) pede `[cardId]` e as sessões pedem o atual + 2 próximos.
> - Os `effect`s de prefetch das sessões não têm teste automatizado (`state/` fica fora do gate); são conferidos no E2E-I6 (tarefa 8).
