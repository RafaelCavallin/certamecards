# Documento de Requisitos do Produto (PRD) — Etiquetas

> Entrega da Fase 2 (F11). Documento-mãe: [tasks/produto/prd.md](../produto/prd.md). A visão, a identidade visual, as restrições e o que fica fora do escopo valem aqui sem ser repetidos. Os IDs (US, RF, CA) são os do documento-mãe, mantidos para rastreabilidade. Os critérios próprios desta entrega usam o prefixo `CA-E`. Depende da Fase 1 ([prd-mvp-offline](../prd-mvp-offline/prd.md) e [prd-conta-sync](../prd-conta-sync/prd.md)) concluída. É a base das entregas seguintes: Difíceis e reforço filtra por etiqueta, e a importação do Anki traz as etiquetas das notas.

## Visão geral

Hoje o único agrupamento do CertameCards é o baralho. Só que o concurseiro organiza o estudo em dois eixos ao mesmo tempo: a matéria (baralho “Constitucional”) e o recorte que interessa na véspera da prova, como a banca (“CESPE”, “FGV”), o dispositivo (“Art. 37”) ou o tipo de armadilha (“pegadinha”). Sem etiquetas, na semana de uma prova CESPE ele revisa a fila inteira ou não revisa nada.

Esta entrega acrescenta etiquetas livres ao cartão. Um cartão continua num único baralho e pode ter várias etiquetas. Com elas o usuário filtra a lista de Cartões, restringe a fila de hoje na Home com “Estudar só…” e mantém o vocabulário limpo em Ajustes → Etiquetas (renomear, juntar e excluir). Tudo funciona sem rede e sem conta. Com conta, as etiquetas viajam com o cartão na sincronização que já existe.

## Objetivos

- Entrega em até 3 dias de trabalho, conforme o sequenciamento da TechSpec-mãe.
- **Adoção**: ≥ 50% dos cartões com ao menos uma etiqueta após 1 mês de uso (meta do documento-mãe).
- **Fluidez com 5.000 cartões**: aplicar ou retirar um filtro de etiquetas na lista, somado à busca, atualiza o resultado em < 150 ms percebidos. O número de hoje na Home muda em < 150 ms ao escolher ou limpar o “Estudar só…”.
- **Vocabulário consistente**: nenhum cartão com duas etiquetas equivalentes (mesmo texto sem diferenciar maiúsculas nem acentos), em nenhuma entrada: formulário, renomear/juntar e sincronização.
- **Renomear em lote**: renomear ou excluir uma etiqueta usada em 1.000 cartões termina em < 2 s, e uma falha no meio não deixa nenhum cartão alterado.
- **Agenda intacta**: filtrar a fila não muda a forma como o FSRS reagenda. A revisão filtrada grava agenda, histórico e estatísticas como qualquer outra revisão.

## Histórias de usuário

- **US12**: Como concurseiro, quero etiquetar cartões por banca e tema para revisar só “CESPE” na semana da prova CESPE.
- **US12a** (derivada): Como concurseiro, quero filtrar a lista de Cartões por etiqueta para achar e corrigir de uma vez tudo o que marquei como “Art. 37” depois de uma mudança na lei.
- **US12b** (derivada): Como concurseiro, quero que o app sugira as etiquetas que já usei para não criar “Cespe”, “CESPE” e “cespe” como coisas diferentes.
- **US12c** (derivada): Como concurseiro, quero renomear, juntar e excluir etiquetas num lugar só para arrumar o vocabulário sem abrir cartão por cartão.
- **US12d** (borda): Como concurseiro, quero que o filtro “Estudar só…” continue valendo quando eu fecho e reabro o app durante a semana da prova, sem me fazer esquecer que ele está ligado.
- **US12e** (borda): Como usuário sem conta e sem rede, quero criar, filtrar e arrumar etiquetas normalmente. Como usuário com conta, quero as mesmas etiquetas nos meus outros aparelhos.

## Principais funcionalidades

RF46–RF50 estão descritos por inteiro no documento-mãe. Abaixo, o que esta entrega detalha.

| Funcionalidade | Requisitos | Observação |
| --- | --- | --- |
| F11. Etiquetas por banca e tema | RF46–RF50 | Chips no formulário, filtro na lista, “Estudar só…” na Home, gestão em Ajustes. |
| F1. Cartão | RF1, **campo novo** | O formulário de criação e de edição ganha o campo Etiquetas. |
| F6. Lista de cartões | RF31, RF48 | Filtro por etiqueta combinado com a busca. Os itens mostram as etiquetas. |
| F4. Início | RF19, RF49 | “Estudar só…” com filtro visível e fácil de limpar. |
| F9. Ajustes | RF42, **nova seção** | Ajustes ganha a entrada “Etiquetas”. |

Requisitos próprios desta entrega, derivados de RF46–RF50:

**Etiquetas no cartão (RF46, RF47)**

- **RF46a**: No formulário, o campo Etiquetas fica depois das Notas e é opcional. O usuário digita e confirma com Enter ou vírgula. Cada etiqueta vira um chip com botão de remover. Backspace com o campo vazio remove o último chip. Colar “CESPE, Art. 37, pegadinha” cria as três de uma vez.
- **RF46b**: Antes de ser salva, a etiqueta é aparada nas pontas e tem os espaços internos repetidos reduzidos a um. Se ficar vazia, é ignorada sem mensagem. Com mais de 40 caracteres, não vira chip e o campo explica o limite.
- **RF46c**: No 20º chip, o campo para de aceitar etiquetas e mostra “Limite de 20 etiquetas”. Remover um chip libera o campo de novo.
- **RF46d**: Ao digitar, o autocompletar sugere as etiquetas já usadas em qualquer baralho, comparando sem maiúsculas nem acentos pelo começo de qualquer palavra da etiqueta (“37” sugere “Art. 37”). A lista vem ordenada pelo número de cartões que usam cada etiqueta e não mostra as que o cartão já tem. É navegável por setas e Enter.
- **RF47a**: Quando a etiqueta digitada equivale a uma já existente em outro cartão, o chip usa a grafia existente (digitar “cespe” com “CESPE” já em uso gera o chip “CESPE”). Quando equivale a um chip do próprio cartão, nada é adicionado.
- **RF47b**: A regra de equivalência vale em todas as entradas: formulário, renomear/juntar, sincronização e (nas entregas seguintes) importação do Anki e backup. Um cartão que chegue com etiquetas equivalentes fica com uma só, a primeira.
- **RF47c**: Adicionar, remover ou reordenar etiquetas é edição de texto: não reagenda o cartão nem gera revisão (RF5).

**Filtro na lista de Cartões (RF48)**

- **RF48a**: A lista de Cartões ganha o controle “Etiquetas”, que mostra as etiquetas presentes no baralho ativo, cada uma com a sua contagem. Escolher uma ou mais restringe a lista aos cartões que têm **todas** as escolhidas (E), combinável com a busca por texto.
- **RF48b**: As etiquetas escolhidas ficam visíveis acima da lista como chips removíveis, junto com “Limpar”. A contagem da lista reflete busca e filtro juntos.
- **RF48c**: Cada item da lista mostra as etiquetas do cartão como chips pequenos, depois do texto. Se não couberem numa linha, mostra as que cabem e “+N”.
- **RF48d**: O filtro da lista vale enquanto a tela está aberta e é limpo ao trocar de baralho. Seleção múltipla e exclusão em lote (RF32) agem sobre o resultado filtrado.

**“Estudar só…” na Home (RF49)**

- **RF49a**: Quando o baralho ativo tem cartões com etiqueta, a Home mostra “Estudar só…”, que lista as etiquetas do baralho com quantos cartões de cada uma estão na fila de hoje. Escolher uma ou mais restringe a fila aos cartões que têm **qualquer uma** das escolhidas (OU).
- **RF49b**: Com o filtro ligado, o número de hoje, a estimativa em minutos e a sessão aberta por “Estudar” contam só os cartões filtrados. Os limites de “novos por dia” e do teto de não firmados (RF18) continuam sendo do baralho e são aplicados depois do filtro: cartões novos estudados com filtro contam para o limite do dia.
- **RF49c**: O filtro fica sempre visível na Home (“Só: CESPE, FGV”), com um botão “Limpar” de um toque e área de toque ≥ 44 px.
- **RF49d**: O filtro é guardado no aparelho, por baralho. Vale até ser limpo e sobrevive a recarregar e a fechar o app. Trocar de baralho mostra o filtro daquele baralho, ou nenhum. Não sincroniza entre aparelhos. Se o aparelho não conseguir guardar, o filtro vale até a página fechar, sem mensagem de erro.
- **RF49e**: O indicador de pendentes no cabeçalho (RF20) e as contagens do seletor de baralhos mostram sempre o total, sem o filtro.
- **RF49f**: Se nenhum cartão de hoje tiver as etiquetas escolhidas, a Home mostra “Nenhum cartão para hoje com essas etiquetas”, com o total sem filtro e o botão “Limpar filtro”. Nesse estado, “Estudar” não abre sessão vazia.
- **RF49g**: Uma etiqueta do filtro que deixa de existir no baralho (excluída, renomeada ou removida do último cartão) sai do filtro sozinha. Se era a única, o filtro é desligado. Numa renomeação, o filtro passa a usar o nome novo.

**Ajustes → Etiquetas (RF50)**

- **RF50a**: Ajustes ganha a entrada “Etiquetas”, que abre uma tela com todas as etiquetas de todos os baralhos, em ordem alfabética (sem diferenciar maiúsculas nem acentos), cada uma com o número de cartões. Sem nenhuma etiqueta, mostra um estado vazio que explica onde criá-las.
- **RF50b**: “Renomear” edita o nome no próprio item, com as validações de RF46b. Se o nome novo equivale a outra etiqueta existente, a tela avisa “Juntar com ‘CESPE’? N cartões passam a usar ‘CESPE’” e pede confirmação. Ao juntar, nenhum cartão fica com etiqueta duplicada (CA-27). Mudar só maiúsculas ou acentos da mesma etiqueta (“Cespe” → “CESPE”) é uma renomeação comum, sem aviso.
- **RF50c**: “Excluir” pede confirmação com o número de cartões afetados e remove a etiqueta de todos eles. Os cartões continuam existindo.
- **RF50d**: Renomear, juntar e excluir são tudo-ou-nada: se algo falhar no meio, nenhum cartão fica alterado e a tela avisa que não foi possível. Não mudam agenda, histórico nem estatísticas.
- **RF50e**: Com conta, os cartões alterados em lote sobem na próxima sincronização como qualquer edição. Num conflito com uma edição do mesmo cartão feita em outro aparelho, vale a regra do produto (última escrita vence, por cartão). A etiqueta antiga pode então voltar em algum cartão, e o usuário pode renomeá-la de novo.

## Critérios de aceitação

Texto completo no documento-mãe:

| Critério | Requisitos | Resumo |
| --- | --- | --- |
| CA-24 | RF46, RF47 | “pegadinha” num cartão com “Pegadinha” não cria etiqueta nova; “peg” em outro cartão sugere “Pegadinha”. |
| CA-25 | RF48 | Com “CESPE” e “Art. 37” escolhidas na lista, só aparecem cartões com as duas. |
| CA-26 | RF49, US12 | Fila de 40 com 12 “CESPE”: “Estudar só: CESPE” mostra 12 e a sessão só traz esses 12; limpar volta a 40 menos os revisados. |
| CA-27 | RF50 | Renomear “Cespe” para “CESPE” com “CESPE” existente junta as duas, sem duplicata em nenhum cartão. |

Critérios próprios desta entrega:

- **CA-E1** (RF46a, RF46b): Dado o formulário de novo cartão, quando o usuário cola “ CESPE ,  Art.   37 , , pegadinha”, então aparecem exatamente três chips: “CESPE”, “Art. 37” e “pegadinha”.
- **CA-E2** (RF46b, RF46c): Dado um cartão com 20 etiquetas, então o campo não aceita uma 21ª e mostra “Limite de 20 etiquetas”. Dada uma etiqueta de 41 caracteres, então ela não vira chip e o limite de 40 é explicado.
- **CA-E3** (RF47a): Dada a etiqueta “CESPE” em algum cartão, quando o usuário digita “cespe” e confirma em outro cartão, então o chip criado é “CESPE”, e Ajustes → Etiquetas continua com uma única “CESPE”.
- **CA-E4** (RF46d): Dadas “Art. 37” (5 cartões) e “Art. 5º” (12 cartões), quando o usuário digita “art”, então as duas são sugeridas, “Art. 5º” primeiro. Quando digita “37”, só “Art. 37” é sugerida.
- **CA-E5** (RF47c): Dado um cartão já revisado, quando o usuário adiciona e remove etiquetas e salva, então a data da próxima revisão e o número de revisões não mudam.
- **CA-E6** (RF48a, RF48b): Dado um baralho com 5.000 cartões, quando o usuário escolhe uma etiqueta e digita uma busca, então a lista e a contagem refletem os dois filtros juntos e a rolagem continua fluida.
- **CA-E7** (RF49a): Dada uma fila de hoje com 5 cartões só com “CESPE”, 4 só com “FGV” e 2 com as duas, quando o usuário escolhe “Estudar só: CESPE, FGV”, então a Home mostra 11.
- **CA-E8** (RF49b): Dado “novos por dia” = 10, com 30 cartões novos “CESPE”, quando o usuário estuda com o filtro “CESPE”, então a sessão traz no máximo 10 novos. Ao limpar o filtro no mesmo dia, nenhum outro novo entra na fila.
- **CA-E9** (RF49d, US12d): Com o filtro “CESPE” ligado no baralho “Constitucional”, quando o usuário recarrega o app, então a Home continua mostrando “Só: CESPE”. Ao trocar para outro baralho, a Home não mostra filtro. Ao voltar para “Constitucional”, o filtro reaparece.
- **CA-E10** (RF49e): Com o filtro ligado e a Home mostrando 12, então o indicador do cabeçalho continua mostrando o total de pendentes de todos os baralhos, sem o filtro.
- **CA-E11** (RF49f): Com o filtro numa etiqueta sem nenhum cartão na fila de hoje, então a Home mostra “Nenhum cartão para hoje com essas etiquetas”, o total sem filtro e “Limpar filtro”, e não abre sessão vazia.
- **CA-E12** (RF49g): Com o filtro “Cespe” ligado, quando o usuário renomeia “Cespe” para “CESPE” em Ajustes, então a Home passa a mostrar “Só: CESPE” com a mesma contagem. Quando exclui essa etiqueta, a Home volta à fila sem filtro.
- **CA-E13** (RF50c, RF50d): Dada “pegadinha” em 30 cartões, quando o usuário a exclui com confirmação, então nenhum cartão tem mais essa etiqueta, os 30 cartões continuam existindo e as datas de revisão deles não mudam.
- **CA-E14** (RF50e, US12e): Com a mesma conta em dois aparelhos, quando o aparelho A renomeia “Cespe” para “CESPE” e sincroniza, então depois da próxima sincronização o aparelho B mostra só “CESPE” em Ajustes → Etiquetas e nos cartões.
- **CA-E15** (offline, US12e): Com a rede desligada e sem conta, o usuário cria cartões com etiquetas, filtra a lista, usa “Estudar só…” e renomeia uma etiqueta sem nenhuma mensagem de erro, e tudo persiste depois de recarregar.
- **CA-E16** (legibilidade): Em 360 px de largura, os chips do formulário, da lista, da Home e de Ajustes quebram linha sem rolagem horizontal e nenhum texto fica abaixo da escala do produto. Uma etiqueta de 40 caracteres sem espaço não estoura a largura.

## Experiência do usuário

Igual ao documento-mãe (perfil, identidade visual, escala tipográfica, acessibilidade). Fluxos desta entrega:

1. *Etiquetar no cadastro em série*: Novo cartão → Frente, Verso, Notas → Etiquetas: digita “ces”, escolhe “CESPE” → Salvar. As etiquetas **continuam preenchidas** para o próximo cartão, porque no cadastro em série os cartões seguidos costumam ter as mesmas etiquetas. Frente, Verso e Notas são limpos (RF4).
2. *Semana da prova*: Home → “Estudar só…” → CESPE → Home mostra “Só: CESPE · 12” → Estudar. Na semana seguinte: Home → “Limpar”.
3. *Corrigir por dispositivo*: Cartões → Etiquetas → “Art. 37” → editar cada cartão do resultado.
4. *Arrumar o vocabulário*: Ajustes → Etiquetas → “Cespe” → Renomear para “CESPE” → confirmar a junção.

> Premissa do fluxo 1: as etiquetas persistem entre cartões no cadastro em série. É um detalhe desta entrega sobre RF4, que só exige limpar os campos de texto. Na edição de um cartão existente não há o que persistir.

UI e acessibilidade:

- O campo Etiquetas segue o padrão de combobox acessível: a lista de sugestões é anunciada, navegável por setas, Enter escolhe e Escape fecha. Cada chip tem um botão de remover com rótulo acessível (“Remover etiqueta CESPE”).
- Os controles de filtro (lista e Home) são grupos de escolha múltipla com o estado marcado anunciado. A contagem resultante é anunciada por `aria-live` ao mudar.
- Chips usam `text-label` ou `text-meta`, nunca abaixo da escala. Botões de remover e opções de filtro têm área de toque ≥ 44 px, mesmo com o chip visualmente menor.
- O filtro ligado na Home usa a cor de sinal, para ficar evidente que a fila está restrita. Nos dois temas (quando o tema claro existir) o contraste segue AA.
- Etiquetas longas quebram ou são truncadas com reticências na lista e na Home, com o texto completo acessível. No formulário e em Ajustes aparecem inteiras.
- Na revisão, as etiquetas **não** aparecem (fora do escopo desta entrega).

**Offline e sem conta**: as etiquetas são parte do cartão e vivem no aparelho. Criar, sugerir, filtrar, “Estudar só…”, renomear, juntar e excluir funcionam igual sem rede, sem conta e sem Supabase configurado no build. Com conta, as etiquetas sincronizam junto com o cartão, sem passo extra. Renomeações offline sobem quando a rede voltar. O filtro “Estudar só…” é preferência do aparelho e nunca sincroniza. Se o armazenamento do aparelho estiver bloqueado, só o filtro deixa de ser lembrado (RF49d). As etiquetas em si são gravadas com o cartão.

## Restrições técnicas de alto nível

- As do documento-mãe, em especial: offline-first, escala tipográfica checada no CI, cores sempre por token e isolamento entre desenvolvimento e produção.
- **Sem mudança de schema nem de RPC**: o banco já nasce com as etiquetas no cartão (até 20, com a checagem de tamanho), e a sincronização já as transporta. Se a TechSpec concluir que falta alguma checagem no banco (ex.: 1–40 caracteres por etiqueta), ela vem numa migration nova, nunca editando a inicial.
- Os limites (20 etiquetas, 1–40 caracteres) valem igual no aparelho e no banco. Um cartão que não os respeite não pode ser salvo nem sincronizado.
- Renomear, juntar e excluir em lote regravam cada cartão afetado, que volta a subir na sincronização. É o custo aceito na TechSpec-mãe por guardar etiquetas no cartão e não numa tabela própria.
- Desempenho: lista e fila fluidas com 5.000 cartões e até 200 etiquetas distintas, sem rede.
- Privacidade: etiquetas são dados de estudo do usuário, com o mesmo isolamento por usuário dos cartões.

## Fora do escopo

- Tudo o que o documento-mãe exclui.
- Etiquetas na tela de revisão (antes ou depois de revelar a resposta).
- Filtro de etiquetas no Progresso (retenção, heatmap e previsão por etiqueta).
- Hierarquia de etiquetas (“CESPE::2024”), cores por etiqueta e etiquetas por baralho.
- Filtro com lógica configurável: a lista usa sempre E e a Home usa sempre OU. Não há exclusão (“sem CESPE”).
- Aplicar ou remover uma etiqueta em lote pela seleção múltipla da lista.
- Sincronizar o filtro “Estudar só…” entre aparelhos.
- Uma etiqueta como entidade própria, com descrição ou data de criação: ela existe enquanto algum cartão a usa.
- Filtro de etiquetas no reforço de cartões difíceis (entrega `prd-dificeis-reforco`) e etiquetas vindas do Anki (entrega `prd-importacao-anki`).
