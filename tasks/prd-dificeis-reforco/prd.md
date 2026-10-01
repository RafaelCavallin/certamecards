# Documento de Requisitos do Produto (PRD) — Difíceis e reforço

> Entrega da Fase 2 (F12). Documento-mãe: [tasks/produto/prd.md](../produto/prd.md). A visão, a identidade visual, as restrições e o que fica fora do escopo valem aqui sem ser repetidos. Os IDs (US, RF, CA) são os do documento-mãe, mantidos para rastreabilidade. Os critérios próprios desta entrega usam o prefixo `CA-D`. Depende da Fase 1 ([prd-mvp-offline](../prd-mvp-offline/prd.md) e [prd-conta-sync](../prd-conta-sync/prd.md)) e de [prd-etiquetas](../prd-etiquetas/prd.md), concluídas: o reforço filtra por etiqueta e reaproveita a tela de revisão.

## Visão geral

O FSRS decide quando cada cartão volta, e faz isso bem para a memória de longo prazo. Só que o concurseiro sabe que alguns cartões são o seu calcanhar de Aquiles: o prazo que ele sempre troca, a exceção que a banca adora. Hoje não há como ver esses cartões juntos nem praticá-los antes da hora. Revisar fora da agenda pela fila normal distorceria o agendamento e a retenção medida no Progresso.

Esta entrega acrescenta a tela **Difíceis**, que lista os cartões do baralho ativo que o usuário mais erra, com uma pontuação explicável (“errou 5 vezes · último erro há 2 dias”), e a sessão de **Reforço**, que pratica até 30 deles na mesma interface da revisão, **sem gravar nada**: nem agenda, nem histórico, nem estatística. O valor está no autoteste dirigido aos pontos fracos, especialmente na semana da prova, combinado com o filtro por etiqueta. Tudo funciona sem rede e sem conta.

## Objetivos

- Entrega em até 2 dias de trabalho, conforme o sequenciamento da TechSpec-mãe.
- **Agenda intacta**: zero alteração em data da próxima revisão, campos do FSRS, histórico de revisões, retenção, heatmap, sequência de dias e contagem de hoje depois de qualquer sessão de reforço (CA-29). Medido por comparação antes/depois em teste automatizado.
- **Pontuação correta**: a lista de Difíceis bate com a regra de RF51 (2 × lapsos + erros nos últimos 30 dias, a partir de 3) em 100% dos casos de teste, inclusive nos limites (pontuação 2 fora, 3 dentro; erro há 30 dias dentro, há 31 fora).
- **Fluidez**: com 5.000 cartões e 50.000 revisões no histórico, a tela Difíceis abre e reage ao filtro de etiquetas em < 500 ms; responder um cartão no reforço e ver o próximo em < 150 ms, sem rede (mesma meta da revisão).
- **Uso (métrica de produto)**: na semana anterior a uma prova, o autor faz ao menos uma sessão de reforço; os cartões reforçados têm, no mês seguinte, retenção na revisão normal maior que a média do baralho (observado no Progresso, sem instrumentação nova).

## Histórias de usuário

- **US13**: Como concurseiro, quero ver os cartões que mais erro e reforçá-los sem bagunçar minha agenda.
- **US13a** (derivada): Como concurseiro, quero entender por que um cartão está na lista (“errou 4 vezes · último erro há 3 dias”) para confiar no critério e decidir se o cartão precisa ser reescrito.
- **US13b** (derivada): Como concurseiro na semana de uma prova CESPE, quero reforçar só os difíceis com “CESPE” para gastar o tempo no que a banca cobra.
- **US13c** (derivada): Como concurseiro, quero que um cartão errado no reforço volte no fim da sessão até eu acertar, para sair da sessão sabendo a resposta.
- **US13d** (derivada): Como concurseiro, quero, ao fim do reforço, ver o que errei e corrigir o cartão na hora, porque um cartão que erro sempre às vezes está mal escrito.
- **US13e** (borda): Como usuário sem conta e sem rede, quero ver os difíceis e reforçar normalmente. Como usuário com conta, quero que os erros feitos nos outros aparelhos contem para a lista.
- **US13f** (borda): Como usuário com um baralho novo ou que quase não erra, quero entender por que a lista está vazia, em vez de achar que a tela quebrou.

## Principais funcionalidades

RF51–RF54 estão descritos por inteiro no documento-mãe. Abaixo, o que esta entrega detalha.

| Funcionalidade | Requisitos | Observação |
| --- | --- | --- |
| F12. Difíceis e reforço | RF51–RF54 | Tela Difíceis com pontuação e filtro de etiquetas; sessão de Reforço fora da agenda. |
| Navegação | **nova entrada** | “Difíceis” entra no menu (lateral e ☰), entre Cartões e Progresso. |
| F4. Início | **atalho novo** | Atalho discreto para Difíceis quando há cartões difíceis no baralho ativo. |
| F5. Sessão de revisão | RF25–RF28, RF30 | O reforço usa a mesma interface, teclas e edição do cartão atual. |

Requisitos próprios desta entrega, derivados de RF51–RF54:

**Pontuação de dificuldade (RF51)**

- **RF51a**: A pontuação de um cartão é `2 × lapsos + erros recentes`. **Lapsos** são as vezes em que o usuário errou um cartão que já estava firmado (contados pelo agendador desde a criação do cartão). **Erros recentes** são as respostas “Errei” na revisão normal nos últimos 30 dias, contados por instante (agora menos 30 × 24 h), incluindo erros de cartões ainda em aprendizado.
- **RF51b**: Entra na lista todo cartão do baralho ativo, não excluído, com pontuação ≥ 3. Respostas no reforço nunca entram na conta (RF53), porque não são gravadas.
- **RF51c**: A ordem é pela pontuação, da maior para a menor; no empate, o erro mais recente primeiro; persistindo o empate, a ordem de criação do cartão.
- **RF51d**: Cada item mostra o começo da Frente (com as lacunas como `_____`, como na revisão antes de revelar), “errou N vezes · último erro há X dias” e as etiquetas do cartão, como chips. **N** é o total de respostas “Errei” no histórico do cartão (não só nos 30 dias). “Último erro” usa a mesma linguagem relativa do app (“hoje”, “ontem”, “há 5 dias”). Se o cartão não tiver nenhum erro no histórico local (lapsos vindos de outro aparelho antes da sincronização do histórico), mostra “errou N vezes” sem a data.
- **RF51e**: O topo da tela mostra quantos cartões difíceis há (com o filtro aplicado) e uma explicação curta e permanente do critério: “Cartões com lapsos ou erros recentes. Lapso vale 2, erro nos últimos 30 dias vale 1; entram a partir de 3.”
- **RF51f**: Tocar num item abre a edição do cartão; salvar ou voltar retorna à lista Difíceis, na mesma posição de rolagem. Editar não reagenda (RF5) nem muda a pontuação.
- **RF51g**: A lista se atualiza sozinha quando o histórico muda (uma revisão feita, uma sincronização que trouxe erros de outro aparelho, um cartão excluído), sem recarregar a página.
- **RF51h**: Sem nenhum cartão difícil no baralho ativo, a tela mostra um estado vazio que explica o critério e que a lista se forma conforme o usuário revisa, sem o botão “Reforçar”.

**Filtro por etiqueta na tela Difíceis (RF52)**

- **RF52a**: Quando há cartões difíceis com etiqueta, a tela mostra o controle “Etiquetas”, com as etiquetas presentes **entre os difíceis**, cada uma com quantos difíceis a têm. Escolher uma ou mais restringe a lista e o reforço aos cartões com **qualquer uma** das escolhidas (OU), como o “Estudar só…” da Home.
- **RF52b**: As etiquetas escolhidas ficam visíveis como chips removíveis, com “Limpar”. A contagem do topo e o rótulo do botão (“Reforçar 12”) refletem o filtro.
- **RF52c**: O filtro vale enquanto a tela Difíceis e o reforço aberto a partir dela estão em uso: voltar do reforço mantém o filtro; sair da tela por outro caminho ou trocar de baralho o limpa. É independente do “Estudar só…” da Home, que não é lido nem alterado.
- **RF52d**: Se o filtro não deixa nenhum cartão, a tela mostra “Nenhum cartão difícil com essas etiquetas”, com “Limpar filtro”, e o botão “Reforçar” fica indisponível.

**Sessão de Reforço (RF52, RF53)**

- **RF52e**: “Reforçar N” abre a sessão com os até **30** cartões de maior pontuação do resultado filtrado, em **ordem embaralhada** a cada sessão. Com menos de 30, entram todos.
- **RF52f**: A sessão usa a interface da revisão: Frente com lacunas, “Mostrar resposta” (ou Espaço) revela Verso e Notas, “Errei” (1) e “Acertei” (2 ou Espaço), bloqueio de resposta dupla (RF27) e “Editar” no cartão atual com volta ao mesmo cartão (RF30).
- **RF52g**: Um cartão respondido “Errei” **volta no fim da fila** da sessão, e continua voltando até ser respondido “Acertei” uma vez. Quando ele reaparece, a tela indica “de novo”.
- **RF52h**: O cabeçalho mostra “← Sair”, o progresso “n / total”, em que total é o número de cartões distintos da sessão e n os que já foram acertados, e a barra de progresso fina correspondente.
- **RF53a**: Uma faixa fixa e sempre visível no topo da sessão diz “Reforço — não mexe na sua agenda”, e o visual do cabeçalho se distingue do da revisão normal, para que o usuário nunca confunda as duas.
- **RF53b**: Responder no reforço não altera a data da próxima revisão nem nenhum dado de agendamento, não cria registro no histórico, não muda retenção, heatmap, sequência de dias, total de revisões, a contagem de hoje na Home nem o indicador de pendentes. Também não sobe nada na sincronização.
- **RF53c**: Um cartão que esteja na fila de hoje continua nela depois de reforçado: o reforço não substitui a revisão do dia.
- **RF53d**: A sessão vive só na tela. Sair por “← Sair”, recarregar ou fechar o app encerra o reforço sem resumo e sem perda, pois nada foi gravado. “← Sair” não pede confirmação.
- **RF53e**: Se um cartão da sessão for excluído (no próprio aparelho ou por sincronização) antes de aparecer, ele é pulado e sai do total. A sessão nunca mostra cartão excluído.

**Fim do reforço (RF54)**

- **RF54a**: O fim mostra o placar pela **primeira resposta** de cada cartão: “Acertou de primeira: 18 de 25”.
- **RF54b**: Abaixo, a lista dos cartões errados ao menos uma vez na sessão, com o começo da Frente, quantas vezes errou na sessão e o atalho “Editar” em cada um. Editar e voltar retorna ao mesmo resumo, que continua mostrando o texto atualizado.
- **RF54c**: Os botões do fim são “Voltar para Difíceis” (principal) e “Voltar ao início”. O resumo é anunciado por `aria-live`.
- **RF54d**: Com todos acertados de primeira, o resumo diz isso e não mostra a lista de errados.

**Entradas de navegação**

- **RF51i**: O menu (barra lateral no desktop e ☰ no celular) ganha “Difíceis”, entre “Cartões” e “Progresso”, sempre visível quando há baralho ativo.
- **RF51j**: A Home mostra o atalho “N cartões difíceis · Reforçar” quando o baralho ativo tem ao menos um cartão difícil. Ele leva à tela Difíceis, sem abrir a sessão direto, e não aparece no onboarding de baralho vazio. O atalho é secundário: não compete com “Estudar”.

## Critérios de aceitação

Texto completo no documento-mãe:

| Critério | Requisitos | Resumo |
| --- | --- | --- |
| CA-28 | RF51 | Cartão com 2 lapsos e 1 erro recente (pontuação 5) aparece; cartão com 1 lapso e nenhum erro recente (pontuação 2) não. |
| CA-29 | RF52, RF53, US13 | Depois de um reforço com “Errei”, a próxima revisão desses cartões, a retenção e o heatmap não mudam. |

Critérios próprios desta entrega:

- **CA-D1** (RF51a, RF51b): Dado um cartão sem lapsos com 3 erros nos últimos 30 dias, então ele aparece com pontuação 3. Dado outro com 2 erros recentes e um erro há 31 dias, então ele não aparece. Um erro feito há exatamente 30 × 24 h ainda conta.
- **CA-D2** (RF51c, RF51d): Dados três difíceis com pontuações 7, 5 e 5, sendo o último erro de um dos “5” ontem e o do outro há 10 dias, então a ordem é 7, o “5” de ontem e o “5” de 10 dias; cada item mostra “errou N vezes · último erro há X dias” com N igual ao total de “Errei” no histórico.
- **CA-D3** (RF51g): Com a tela Difíceis aberta em outra aba, quando o usuário erra pela terceira vez um cartão na revisão normal, então esse cartão aparece na lista sem recarregar.
- **CA-D4** (RF51h, US13f): Num baralho sem nenhum cartão com pontuação ≥ 3, então a tela mostra o estado vazio com a explicação do critério e não há botão “Reforçar”; a Home não mostra o atalho de difíceis.
- **CA-D5** (RF52a, RF52b, US13b): Dados 8 difíceis só com “CESPE”, 3 só com “FGV”, 2 com as duas e 5 sem etiqueta, quando o usuário escolhe “CESPE” e “FGV”, então a tela mostra 13 e o botão “Reforçar 13”.
- **CA-D6** (RF52c): Com o filtro “CESPE” ligado em Difíceis e “Estudar só: FGV” na Home, quando o usuário faz um reforço e volta, então Difíceis continua com “CESPE” e a Home continua com “Só: FGV”.
- **CA-D7** (RF52d): Com um filtro que não deixa nenhum difícil, então a tela mostra “Nenhum cartão difícil com essas etiquetas”, “Limpar filtro”, e não é possível abrir uma sessão vazia.
- **CA-D8** (RF52e): Dados 45 difíceis, quando o usuário toca “Reforçar”, então a sessão tem exatamente os 30 de maior pontuação; abrindo duas sessões seguidas, a ordem de apresentação difere.
- **CA-D9** (RF52g, RF52h, US13c): Numa sessão de 5 cartões, quando o usuário erra o 2º, então ele reaparece depois do 5º com a indicação “de novo”, e o cabeçalho mostra “4 / 5” depois de acertar o 5º; a sessão só termina quando o 2º for acertado.
- **CA-D10** (RF52f): Na sessão de reforço, Espaço revela, 1 registra “Errei”, 2 registra “Acertei”, e pressionar 2 duas vezes rapidamente conta uma única resposta.
- **CA-D11** (RF53b, RF53c): Dado um cartão vencido hoje e difícil, quando o usuário o acerta no reforço, então ele continua na fila de hoje, a Home mostra o mesmo número de antes, e o total de revisões no Progresso não muda.
- **CA-D12** (RF53b, US13e): Com conta, depois de um reforço inteiro e de “Sincronizar agora”, então nenhuma alteração em cartões ou histórico chega ao outro aparelho.
- **CA-D13** (RF53a): Durante toda a sessão de reforço, em 360 px e no desktop, a faixa “Reforço — não mexe na sua agenda” está visível sem rolar.
- **CA-D14** (RF53d): Com uma sessão de reforço pela metade, quando o usuário recarrega a página, então nada mudou nos cartões e o app não mostra erro.
- **CA-D15** (RF54a, RF54b, US13d): Numa sessão de 10 cartões com 3 errados na primeira resposta (um deles errado duas vezes), então o fim mostra “Acertou de primeira: 7 de 10” e lista os 3, um deles com “errou 2 vezes”; editar um deles e salvar volta ao mesmo resumo com o texto corrigido.
- **CA-D16** (RF52f): Durante o reforço, quando o usuário edita o cartão atual e salva, então volta ao mesmo cartão com o texto corrigido, e a data da próxima revisão do cartão não muda.
- **CA-D17** (offline, US13e): Com a rede desligada e sem conta, o usuário abre Difíceis, filtra por etiqueta, faz um reforço e vê o resumo sem nenhuma mensagem de erro.
- **CA-D18** (US13e): Com a mesma conta em dois aparelhos, quando o aparelho A erra um cartão três vezes e sincroniza, então depois da próxima sincronização o aparelho B mostra esse cartão em Difíceis.
- **CA-D19** (RF51i, RF51j): Com baralho ativo, o menu mostra “Difíceis” entre “Cartões” e “Progresso”, no desktop e no celular; com 4 difíceis, a Home mostra “4 cartões difíceis · Reforçar”, que leva à tela Difíceis.
- **CA-D20** (legibilidade): Em 360 px, a tela Difíceis, a sessão de reforço e o resumo não têm rolagem horizontal, e nenhum texto fica abaixo da escala do produto.

## Experiência do usuário

Igual ao documento-mãe (perfil, identidade visual, escala tipográfica, acessibilidade). Fluxos desta entrega:

1. *Semana da prova* (fluxo 5 do documento-mãe): Home → Estudar (revisão do dia) → Início → “6 cartões difíceis · Reforçar” → Difíceis → Etiquetas: CESPE → “Reforçar 6” → responde; os errados voltam no fim → Resumo → “Voltar para Difíceis”.
2. *Reescrever o cartão que sempre erro*: menu → Difíceis → toca no primeiro da lista (“errou 7 vezes · último erro ontem”) → edita a Frente → Salvar → volta à lista.
3. *Corrigir pelo resumo*: fim do reforço → item errado → Editar → Salvar → volta ao resumo.

UI e acessibilidade:

- A sessão de reforço é visualmente a revisão (mesmas fontes, tamanhos, cartão e botões), com a faixa fixa “Reforço — não mexe na sua agenda” e o cabeçalho diferenciado, sem depender só de cor: a faixa tem texto, e o título da página anunciado ao leitor de tela é “Reforço”.
- O “de novo” de um cartão que voltou é texto visível (`text-label`), não só ícone ou cor.
- A explicação do critério em Difíceis usa `text-meta`; os itens usam a mesma hierarquia da lista de Cartões. Os chips de etiqueta e o controle de filtro seguem os componentes de [prd-etiquetas](../prd-etiquetas/prd.md), com área de toque ≥ 44 px e estado marcado anunciado.
- A contagem de difíceis é anunciada por `aria-live` quando o filtro muda; o resumo do fim também.
- Teclado: a tela Difíceis é navegável por Tab (filtro, itens, “Reforçar”); a sessão usa as teclas da revisão.
- O atalho da Home e o item do menu usam texto, sem ícone sozinho, e não usam a cor de sinal (reservada para o que é ação principal e para o filtro ligado).

**Offline e sem conta**: Difíceis e Reforço leem só o que já está no aparelho (cartões e histórico) e não escrevem nada, então funcionam igual sem rede, sem conta e sem Supabase configurado no build. Com conta, a lista passa a considerar os erros feitos nos outros aparelhos assim que a sincronização traz o histórico; até lá, ela reflete o que o aparelho conhece, sem aviso. O filtro de etiquetas de Difíceis não é guardado nem sincronizado. Se o armazenamento do aparelho estiver bloqueado, nada desta entrega degrada além do que já degrada no resto do app.

## Restrições técnicas de alto nível

- As do documento-mãe, em especial: offline-first, escala tipográfica checada no CI, cores sempre por token e isolamento entre desenvolvimento e produção.
- **Sem mudança de schema nem de RPC**: lapsos já estão no cartão e as respostas “Errei” já estão no histórico sincronizado. A entrega não acrescenta tabela, coluna nem campo sincronizado.
- **O reforço é somente leitura**: nenhuma escrita no banco local nem na nuvem durante ou depois da sessão, inclusive marcação de “sujo” para sincronização. A única escrita possível a partir destas telas é a edição de texto do cartão, que já segue RF5.
- Os parâmetros da regra (peso 2 do lapso, janela de 30 dias, corte em 3 pontos, até 30 cartões por sessão) são constantes do produto, iguais em todos os aparelhos, e não são configuráveis pelo usuário.
- Desempenho: Difíceis em < 500 ms com 5.000 cartões e 50.000 revisões no histórico; resposta no reforço em < 150 ms; sem rede.
- Privacidade: a pontuação é derivada de dados de estudo já existentes e não sai do aparelho.

## Fora do escopo

- Tudo o que o documento-mãe exclui.
- Difíceis de todos os baralhos de uma vez: a tela é sempre do baralho ativo.
- Ajustar o critério (pesos, janela, corte) ou o tamanho da sessão de reforço.
- Marcar ou desmarcar um cartão como difícil à mão, ou esconder um cartão da lista.
- Usar a `difficulty` interna do FSRS como critério ou exibi-la.
- Reforço de cartões que não são difíceis (ex.: “reforçar a etiqueta CESPE inteira”) e reforço a partir da seleção múltipla da lista de Cartões.
- Guardar, retomar ou sincronizar uma sessão de reforço, e histórico de sessões de reforço (placar passado, evolução).
- Qualquer efeito do reforço em agenda, histórico, estatísticas, meta diária (entrega `prd-meta-lembrete`) ou lembrete.
- Filtro de etiquetas com lógica E ou exclusão em Difíceis; o filtro é sempre OU.
- Contagem de difíceis no menu ou no indicador do cabeçalho.
