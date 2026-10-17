# Documento de Requisitos do Produto (PRD) — Imagens nas Notas

> Entrega da Fase 2 (F17). Documento-mãe: [tasks/produto/prd.md](../produto/prd.md). A visão, a identidade visual, as restrições e o que fica fora do escopo valem aqui sem ser repetidos. Os IDs (US, RF, CA) são os do documento-mãe, mantidos para rastreabilidade. Os critérios próprios desta entrega usam o prefixo `CA-I`. Depende da Fase 1 ([prd-mvp-offline](../prd-mvp-offline/prd.md) e [prd-conta-sync](../prd-conta-sync/prd.md)) e de [prd-dificeis-reforco](../prd-dificeis-reforco/prd.md), concluídas: as imagens aparecem também na sessão de reforço.

## Visão geral

Boa parte do material de concurso não cabe em texto puro: o esquema de controle de constitucionalidade do caderno, a tabela de prazos fotografada da apostila, o mapa mental das espécies de ato administrativo, o print da questão comentada. Hoje o concurseiro ou redigita esse conteúdo em linhas soltas nas Notas, perdendo a estrutura visual que ajudava a memorizar, ou deixa o material fora do app e consulta em outro lugar.

Esta entrega permite anexar **até 6 imagens** a cada cartão, numa galeria abaixo das Notas. O usuário escolhe a imagem por arquivo, câmera do celular ou colando (Ctrl+V). O app reduz a imagem no próprio aparelho para um tamanho leve, com até 2.000 px no lado maior, até 1,5 MB e no formato WebP, e apaga os metadados da foto. Depois o usuário ordena e legenda a galeria. Na revisão, as imagens aparecem como miniaturas depois de revelar a resposta, e um toque abre em tela cheia, com zoom e navegação entre elas. A imagem fica disponível no aparelho imediatamente e funciona sem rede e sem conta. Com conta, ela sobe para a nuvem quando há conexão e aparece nos outros aparelhos quando o cartão é exibido.

## Objetivos

- Entrega em até 5 dias de trabalho, conforme o sequenciamento da TechSpec-mãe.
- **Tamanho**: 100% das imagens salvas têm lado maior ≤ 2.000 px e ≤ 1,5 MB (CA-40). Uma foto típica de celular (12 MP) é salva com ≤ 600 KB.
- **Rapidez ao anexar**: uma foto de 12 MP fica pronta na galeria do formulário em < 3 s num celular intermediário e em < 1 s num computador comum.
- **Revisão sem atraso**: responder um cartão com imagens e ver o próximo continua em < 150 ms (objetivo do documento-mãe). Abrir uma imagem já disponível no aparelho em tela cheia leva < 300 ms.
- **Legibilidade**: num esquema fotografado com texto de corpo 10 pt, o texto continua legível em tela cheia com zoom depois da redução.
- **Confiabilidade**: zero imagens perdidas e zero imagens órfãs entre aparelhos em uso normal. Toda imagem criada offline chega ao outro aparelho depois da sincronização (CA-42), e toda imagem de um cartão excluído some nos dois aparelhos e na nuvem (CA-43).
- **Cota**: com os limites desta entrega, o uso pessoal cabe no 1 GB do Storage gratuito do Supabase, e o uso fica visível em Ajustes.
- **Uso (métrica de produto)**: no primeiro mês, o autor anexa imagens a pelo menos 50 cartões. Observado pelo contador de Ajustes, sem instrumentação nova.

## Histórias de usuário

- **US18**: Como concurseiro, quero anexar esquemas e mapas mentais às Notas e ampliá-los na revisão.
- **US18a** (derivada): Como concurseiro estudando com o caderno ao lado, quero fotografar um esquema com a câmera do celular direto no formulário do cartão, sem passar pela galeria do aparelho.
- **US18b** (derivada): Como concurseiro cadastrando no computador, quero colar com Ctrl+V um recorte de tela (print de questão, trecho de PDF) no cartão que estou criando.
- **US18c** (derivada): Como concurseiro, quero ordenar as imagens e dar uma legenda a cada uma (“Mapa: controle difuso × concentrado”), para saber o que cada imagem é antes de abrir.
- **US18d** (derivada): Como concurseiro revisando no celular, quero ampliar a imagem com a pinça e passar para a próxima, para ler um esquema denso na tela pequena.
- **US18e** (derivada): Como concurseiro com muitos cartões ilustrados, quero ver quanto espaço as imagens ocupam, para saber se estou perto do limite.
- **US18f** (borda): Como usuário sem conta, quero anexar e ver imagens só no aparelho, sem nenhum aviso de erro.
- **US18g** (borda): Como usuário com conta e sem rede, quero anexar imagens offline e vê-las no outro aparelho depois. Se um cartão chegou ao outro aparelho e a imagem ainda não foi baixada, quero entender por que ela não aparece, em vez de ver uma imagem quebrada.
- **US18h** (borda): Como usuário que cola uma imagem em formato estranho ou grande demais, quero uma mensagem clara do que aconteceu, sem perder o que já digitei no cartão.

## Principais funcionalidades

RF73–RF78 estão descritos por inteiro no documento-mãe. Abaixo, o que esta entrega detalha.

| Funcionalidade | Requisitos | Observação |
| --- | --- | --- |
| F17. Imagens nas Notas | RF73–RF78 | Galeria no formulário, galeria e visualizador na revisão, sincronização de arquivos. |
| F1. Cartão (formulário) | RF4, RF5 | A galeria entra no formulário de criação, de edição e na edição durante a revisão (RF30). |
| F12. Reforço | RF52 | A sessão de reforço mostra a galeria como a revisão. |
| F9. Ajustes | **entrada nova** | Contador de uso das imagens. |

Requisitos próprios desta entrega, derivados de RF73–RF78:

**Adicionar (RF73, RF74)**

- **RF73a**: O formulário do cartão tem a seção **Imagens**, abaixo das Notas, com o botão “Adicionar imagem”. Ele abre o seletor de arquivos do sistema, que permite escolher várias imagens de uma vez e, no celular, oferece a câmera entre as opções. No celular, um segundo botão, “Tirar foto”, abre direto a câmera traseira.
- **RF73b**: Colar uma imagem (Ctrl+V / Cmd+V, ou “Colar” no menu do celular) com o foco em qualquer ponto do formulário adiciona a imagem à galeria. Colar texto continua colando texto no campo, como antes. Quando a área de transferência traz texto e imagem juntos, o texto vai para o campo focado e a imagem não é adicionada.
- **RF73c**: No desktop, arrastar arquivos de imagem para a seção Imagens adiciona-os. Arrastar é só um atalho: tudo é possível pelo botão e pelo teclado.
- **RF73d**: O limite é de 6 imagens por cartão. Com 6, os botões de adicionar ficam indisponíveis e a seção mostra “6 de 6 imagens”. Se o usuário escolhe mais arquivos do que cabem, entram os primeiros, na ordem da escolha, e a tela avisa “Só cabiam mais 2 imagens; 3 ficaram de fora.”
- **RF74a**: O formulário aceita **qualquer imagem que o navegador consiga abrir**, como JPEG, PNG, WebP, GIF, BMP, AVIF e HEIC (este quando o navegador abre). Toda imagem é convertida para **WebP**. No navegador que não gera WebP, o formato é JPEG. O usuário não escolhe formato. GIF animado guarda só o primeiro quadro. Arquivo que não abre mostra “Não foi possível abrir este arquivo como imagem.” e não entra na galeria.
- **RF74b**: Toda imagem é reprocessada, mesmo quando já é pequena. Ela é girada conforme a orientação da câmera, reduzida para que o lado maior tenha no máximo 2.000 px (sem ampliar as menores) e comprimida até caber em 1,5 MB, com a maior qualidade que caiba. Metadados da foto (localização, aparelho, data) não são guardados. Transparência é preservada no WebP. No JPEG, o fundo transparente vira branco.
- **RF74c**: Enquanto a imagem é preparada, o lugar dela na galeria mostra “Preparando imagem…” com indicador de progresso. O usuário pode seguir digitando nos campos. Salvar fica indisponível até todas as imagens terminarem e mostra o motivo (“Aguardando 2 imagens”).
- **RF74d**: Se a imagem não couber em 1,5 MB nem com a menor qualidade aceitável, ela não entra, com a mensagem “Esta imagem ficou grande demais mesmo reduzida.” Se o aparelho estiver sem espaço, salvar o cartão falha com “Sem espaço no aparelho para salvar as imagens.”, e o texto digitado é mantido no formulário.

**Organizar (RF76)**

- **RF76a**: Cada imagem da galeria do formulário aparece como miniatura com três ações: “Mover para a esquerda”, “Mover para a direita” e “Remover”. As ações funcionam por toque e teclado e têm rótulo acessível com a posição (“Mover a imagem 2 para a esquerda”). No desktop, arrastar a miniatura também reordena.
- **RF76b**: Cada imagem tem o campo opcional **Legenda**, de até 200 caracteres, com contador perto do limite. A legenda é texto puro, sem marcas. Ela vira o texto alternativo da imagem e aparece sob a imagem em tela cheia.
- **RF76c**: Adicionar, reordenar, legendar e remover só valem ao **salvar** o cartão. Sair sem salvar descarta essas mudanças. Para isso, o formulário ganha um aviso de alterações não salvas, que também vale para o texto: ao sair da criação, da edição ou do diálogo de edição da revisão com texto, etiquetas ou imagens diferentes do que foi carregado, o app pergunta “Descartar alterações?”. Recarregar ou fechar a aba nesse estado usa o aviso do próprio navegador. Remover não pede confirmação dentro do formulário, porque é desfeito ao sair sem salvar.
- **RF76d**: Na criação em série (RF4), salvar limpa também a galeria, e o próximo cartão começa sem imagens. Na edição, salvar volta para a tela anterior com a galeria atualizada.
- **RF76e**: Mexer nas imagens é editar o cartão e segue o RF5: não muda o agendamento e não gera revisão.
- **RF76f**: Um cartão pode ter imagens com as Notas vazias. Frente e Verso continuam obrigatórios.

**Exibir (RF75)**

- **RF75a**: Na revisão, a galeria aparece **só depois de revelar a resposta**, abaixo das Notas (ou abaixo do Verso, quando não há Notas), com as miniaturas na ordem definida. Antes de revelar, nada indica que o cartão tem imagens. As miniaturas reservam o espaço delas, para o texto não pular quando carregam.
- **RF75b**: Tocar ou clicar numa miniatura, ou ativá-la com Enter, abre o **visualizador em tela cheia** nessa imagem. Ele mostra a imagem inteira ajustada à tela, a legenda (se houver), a posição “2 / 4” e os botões “Anterior”, “Próxima”, “Ampliar”, “Reduzir” e “Fechar”.
- **RF75c**: O zoom funciona por pinça, roda do mouse, toque duplo (alterna entre ajustado e ampliado) e pelos botões, até 5×. Com a imagem ampliada, arrastar move a imagem. Com ela ajustada, deslizar para os lados troca de imagem. Setas ←/→ trocam de imagem, +/− ampliam e reduzem, e Escape fecha. Fechar devolve o foco à miniatura de origem.
- **RF75d**: Com o visualizador aberto, os atalhos da revisão (Espaço, 1, 2) não respondem, para não registrar uma resposta sem querer. Ao fechar, a revisão volta exatamente ao estado anterior.
- **RF75e**: A sessão de **reforço** (RF52) mostra a galeria e o visualizador da mesma forma, sem gravar nada (RF53).
- **RF75f**: A edição do cartão durante a revisão (RF30) inclui a galeria. Ao voltar, a revisão mostra as imagens atualizadas.
- **RF75g**: Na lista de Cartões nada muda: as imagens não aparecem no item, e a busca não procura nas legendas.

**Disponibilidade e sincronização (RF77, RF78)**

- **RF77a**: **Sem conta**, as imagens existem só no aparelho. Não há nenhum aviso de sincronização, envio ou nuvem.
- **RF77b**: **Com conta**, a imagem fica disponível no aparelho assim que o cartão é salvo, com ou sem rede. Ela é enviada nas sincronizações seguintes (as mesmas de RF37) quando houver rede. Uma imagem que falha ao subir é tentada de novo na próxima sincronização, sem atrasar o envio do texto dos cartões e das revisões.
- **RF77c**: Nos outros aparelhos, o cartão e a lista das imagens dele chegam pela sincronização. O **arquivo** de cada imagem é baixado quando o cartão é exibido (revisão, reforço ou edição). Na revisão e no reforço, as imagens dos 2 próximos cartões da fila também são baixadas antes. Depois de baixada, a imagem fica disponível sem rede.
- **RF77d**: Uma imagem que ainda não está no aparelho, quando não há rede ou o download falha, aparece como um quadro do mesmo tamanho com “Imagem disponível quando houver conexão”, sem ícone de erro. Ela é carregada sozinha quando a conexão volta, enquanto o cartão está na tela. A falta de uma imagem nunca impede revelar, responder nem avançar.
- **RF77e**: Ordem, legenda e remoção sincronizam como o texto do cartão: a última alteração vence. O arquivo de uma imagem nunca muda depois de salvo. Trocar uma imagem é remover uma e adicionar outra.
- **RF77f**: Em “Conta” (F9), quando há imagens aguardando envio, aparece “3 imagens aguardando envio” junto da última sincronização. Fora isso, o estado de envio não aparece em lugar nenhum.
- **RF77g**: Na primeira entrada com dados dos dois lados (RF39), as imagens seguem os cartões. Em “juntar”, as imagens locais sobem com os cartões. Em “descartar os dados do aparelho”, as imagens locais são apagadas junto com os cartões. Em “cancelar”, nada muda. Entrar em outra conta (RF40) nunca mostra imagens da conta anterior.
- **RF78a**: Excluir um cartão, inclusive em lote (RF32) ou ao excluir o baralho (RF16), exclui as imagens dele no aparelho na hora. Com conta, a exclusão se propaga aos outros aparelhos e o arquivo é apagado da nuvem na sincronização seguinte. Uma falha nessa limpeza é tentada de novo depois, sem aviso ao usuário.
- **RF78b**: Imagem removida no formulário e salva segue a mesma regra de exclusão.

**Uso de espaço**

- **RF74e**: Ajustes ganha a linha **Imagens**: “34 imagens · 12,3 MB”, contando as imagens dos cartões não excluídos de todos os baralhos. Com conta, a linha diz que o total vale para a conta e acrescenta o limite de referência do plano gratuito (“de 1 GB”). A linha é só informativa: não bloqueia nem alerta.

## Critérios de aceitação

Texto completo no documento-mãe:

| Critério | Requisitos | Resumo |
| --- | --- | --- |
| CA-40 | RF73, RF74 | Foto de 12 MP colada no formulário é salva com lado maior ≤ 2.000 px e ≤ 1,5 MB. |
| CA-41 | RF75, US18 | Tocar na miniatura abre em tela cheia; pinça/roda amplia; Escape ou “fechar” volta ao cartão. |
| CA-42 | RF77 | Imagem adicionada offline no aparelho A aparece no B depois que A reconecta e B exibe o cartão. |
| CA-43 | RF78 | Excluir cartão com imagens faz as imagens sumirem também no outro aparelho após a sincronização. |

Critérios próprios desta entrega:

- **CA-I1** (RF73a, RF73d): Num cartão com 4 imagens, quando o usuário escolhe 5 arquivos de uma vez, então entram os 2 primeiros, a seção mostra “6 de 6 imagens” com os botões de adicionar indisponíveis, e a tela avisa que 3 ficaram de fora.
- **CA-I2** (RF73b, US18b): Com o foco no campo Verso, quando o usuário cola um recorte de tela, então a imagem entra na galeria e o Verso não muda. Quando cola um texto, o texto entra no Verso e a galeria não muda.
- **CA-I3** (RF73a, US18a): No celular, “Tirar foto” abre a câmera e, depois da foto, a imagem aparece na galeria do formulário sem sair da tela.
- **CA-I4** (RF74a): Um PNG com fundo transparente é salvo como WebP com a transparência mantida (no Chrome). Um GIF animado é salvo como imagem parada. Um `.pdf` ou um `.txt` renomeado para `.png` mostra “Não foi possível abrir este arquivo como imagem.”, e nada entra na galeria.
- **CA-I5** (RF74b): Uma foto de celular com localização GPS e orientação “retrato” é salva em pé e sem nenhum metadado de localização. Uma imagem de 800 × 600 px continua com 800 × 600 px.
- **CA-I6** (RF74b, Objetivo de legibilidade): Um esquema fotografado com texto de corpo 10 pt, depois de salvo, tem o texto legível no visualizador com zoom, num celular de 360 px.
- **CA-I7** (RF74c, Objetivo de rapidez): Ao adicionar uma foto de 12 MP, então “Preparando imagem…” aparece no lugar dela, os campos de texto continuam editáveis, Salvar fica indisponível com “Aguardando 1 imagem”, e a imagem fica pronta em < 3 s num celular intermediário.
- **CA-I8** (RF74d, US18h): Com o armazenamento do aparelho cheio, quando o usuário salva um cartão com imagens, então aparece “Sem espaço no aparelho para salvar as imagens.”, nada é gravado, e Frente, Verso e Notas continuam preenchidos no formulário.
- **CA-I9** (RF76a, RF76b, US18c): Quando o usuário move a 3ª imagem para a esquerda, legenda-a “Mapa: atos” e salva, então na revisão ela aparece em 2º lugar, com “Mapa: atos” como texto alternativo e como legenda em tela cheia.
- **CA-I10** (RF76c): Na edição de um cartão com 3 imagens, quando o usuário remove uma e toca “← Voltar”, então aparece “Descartar alterações?”. Ao confirmar, o cartão continua com as 3 imagens. Ao cancelar, o formulário continua aberto com as 2 imagens restantes. Sem nenhuma alteração, “← Voltar” sai sem perguntar. O mesmo vale para o texto, e para Escape no diálogo de edição da revisão.
- **CA-I11** (RF76d, RF76e): Na criação em série, depois de salvar um cartão com 2 imagens, então o formulário volta vazio e sem imagens. Num cartão já revisado, adicionar uma imagem e salvar não muda a data da próxima revisão nem o número de revisões.
- **CA-I12** (RF75a): Na revisão de um cartão com imagens, antes de “Mostrar resposta” nenhuma miniatura aparece. Depois, as miniaturas aparecem abaixo das Notas, na ordem salva, e o texto acima não muda de posição quando elas carregam.
- **CA-I13** (RF75c, RF75d, US18d): No visualizador, → passa para a próxima imagem e “2 / 4” vira “3 / 4”. Pressionar 2 ou Espaço não registra resposta. Escape fecha e devolve o foco à miniatura, e então 2 registra “Acertei”.
- **CA-I14** (RF75e): Na sessão de reforço, um cartão com imagens mostra a galeria depois de revelar, e abrir o visualizador não altera nada do agendamento nem das estatísticas.
- **CA-I15** (RF75f): Durante a revisão, quando o usuário edita o cartão atual, adiciona uma imagem e salva, então volta ao mesmo cartão com a nova miniatura na galeria.
- **CA-I16** (RF77a, US18f): Com a rede desligada, sem conta e sem Supabase configurado no build, o usuário cria um cartão com 3 imagens, revisa, abre o visualizador e exclui o cartão, sem nenhuma mensagem de erro ou de sincronização.
- **CA-I17** (RF77c, RF77d, US18g): No aparelho B, com um cartão sincronizado cuja imagem ainda não foi baixada, então com a rede desligada a miniatura mostra “Imagem disponível quando houver conexão” e o cartão pode ser respondido normalmente. Ao religar a rede com o cartão na tela, a imagem aparece sem recarregar.
- **CA-I18** (RF77c): No aparelho B, ao responder um cartão na revisão, então as imagens dos 2 cartões seguintes já estão baixadas. Desligar a rede em seguida não impede vê-las.
- **CA-I19** (RF77b, RF77f): Com conta e sem rede, depois de salvar 3 imagens, então “Conta” mostra “3 imagens aguardando envio”. Ao religar a rede e sincronizar, a linha some, e o texto dos cartões foi enviado mesmo que uma das imagens tenha falhado e ficado para a próxima.
- **CA-I20** (RF77e): Com a mesma conta em dois aparelhos, quando A muda a legenda de uma imagem e depois B muda a mesma legenda, então após sincronizar os dois mostram a legenda de B.
- **CA-I21** (RF77g): Num aparelho com cartões e imagens locais, quando o usuário entra numa conta com dados e escolhe “juntar”, então as imagens locais aparecem no outro aparelho da conta. Escolhendo “descartar”, elas não existem mais no aparelho, e a linha de Ajustes não as conta.
- **CA-I22** (RF78a, RF16): Ao excluir um baralho com 10 cartões ilustrados, então a linha Imagens de Ajustes diminui na hora. Com conta, depois de sincronizar, os arquivos não existem mais na nuvem.
- **CA-I23** (RF74e, US18e): Com 34 imagens somando 12,3 MB, então Ajustes mostra “34 imagens · 12,3 MB”. Com conta, a linha mostra também o limite “de 1 GB”.
- **CA-I24** (Objetivo de revisão sem atraso): Numa sessão em que todo cartão tem 6 imagens, responder e ver o próximo cartão continua em < 150 ms, e abrir uma imagem já baixada em tela cheia leva < 300 ms.
- **CA-I25** (legibilidade e acessibilidade): Em 360 px, a seção Imagens do formulário, a galeria da revisão e o visualizador ficam sem rolagem horizontal. Nenhum texto fica abaixo da escala do produto. Todas as ações da galeria e do visualizador são alcançáveis por teclado, com áreas de toque ≥ 44 px.

## Experiência do usuário

Igual ao documento-mãe (perfil, identidade visual, escala tipográfica, acessibilidade, dois temas). Perfil desta entrega: o concurseiro que estuda por material visual (caderno com esquemas, apostila com tabelas, mapas mentais) e por questões comentadas. Ele anexa as imagens pelo celular, com a câmera, ou pelo computador, colando prints, e as consulta sobretudo no celular.

Fluxos:

1. *Fotografar do caderno*: Home → “+ Cartão” → Frente, Verso, Notas → “Tirar foto” → foto do esquema → legenda → Salvar → próximo cartão.
2. *Colar print*: no computador, recorte de tela do PDF → formulário do cartão → Ctrl+V → reordenar → Salvar.
3. *Revisar com imagem*: Revisão → Mostrar resposta → miniatura → tela cheia → pinça para ampliar → próxima → Escape → Acertei.
4. *Outro aparelho*: computador cria o cartão com imagens → celular sincroniza → revisão no celular baixa as imagens do cartão e dos 2 próximos → ônibus sem rede → imagens já baixadas aparecem.

UI e acessibilidade:

- A seção Imagens do formulário segue o padrão visual dos campos (rótulo mono em `text-label`, contador “2 de 6 imagens”). As miniaturas ficam numa grade que quebra linha no celular, e a legenda fica sob cada miniatura.
- O visualizador é um diálogo modal em tela cheia. O foco fica preso dentro dele, a página de trás não rola, e o zoom da página não disputa com o da imagem. Os botões têm rótulo acessível e o fundo é escuro nos dois temas, para dar contraste à imagem.
- O texto alternativo de cada imagem é a legenda. Sem legenda, é “Imagem 2 de 4 do cartão”.
- “Preparando imagem…”, os avisos de limite e de erro e a contagem de imagens adicionadas são anunciados por `aria-live`. Erros usam a cor `miss` acompanhada de texto.
- O placeholder “Imagem disponível quando houver conexão” usa `text-meta` e `muted` e não parece um erro.
- Animações de abrir, fechar e trocar de imagem respeitam `prefers-reduced-motion`.
- Textos em português do Brasil, com números no formato brasileiro (“12,3 MB”).

**Offline e sem conta**: anexar, reduzir, ordenar, legendar, revisar, ampliar e excluir imagens funcionam no aparelho, sem rede, sem conta e sem Supabase configurado no build, sem nenhuma menção a envio ou nuvem. Com conta e sem rede, nada muda para o usuário além de “N imagens aguardando envio” em Conta. A única degradação visível é no outro aparelho: uma imagem que ainda não foi baixada aparece como placeholder explicativo até haver conexão, e ela nunca bloqueia a revisão. O texto dos cartões e as revisões continuam sincronizando mesmo quando o envio de alguma imagem falha.

## Restrições técnicas de alto nível

- As do documento-mãe, em especial: offline-first, escala tipográfica checada no CI, cores sempre por token, isolamento entre desenvolvimento e produção e Supabase sem servidor próprio.
- **Schema já desenhado**: a tabela de metadados das imagens, o bucket privado do Storage e a RPC de envio estão na migration da Fase 2 (`20261017000000_images_reminders.sql`), com os limites deste PRD: 6 por cartão (posição 0–5), legenda ≤ 200, lado ≤ 2.000 px, ≤ 1,5 MB, WebP/JPEG/PNG. Mudanças nesses limites exigem migration nova. Os limites do app vêm do mesmo lugar dos limites de texto e espelham o banco.
- **Integridade entre aparelhos**: outro aparelho nunca vê a lista de uma imagem cujo arquivo ainda não está na nuvem, e o envio de imagens não pode bloquear nem atrasar o de cartões e revisões.
- **Isolamento**: cada usuário só lê, grava e apaga os arquivos da própria pasta no Storage. O bucket não é público.
- **Privacidade**: a imagem é processada no aparelho, e os metadados da foto (localização, aparelho) são descartados antes de gravar ou enviar. Nenhum serviço de terceiros recebe as imagens.
- **Cota**: plano gratuito do Supabase (1 GB de Storage). Os limites de RF73/RF74 e o contador de Ajustes são a mitigação. Não há bloqueio por cota nesta entrega.
- **Armazenamento local**: os arquivos ficam no IndexedDB, separados dos dados dos cartões, para que listas e buscas não carreguem imagens. O pedido de persistência do armazenamento (RF45) já existente cobre as imagens.
- **Desempenho**: a redução não trava a interface. Miniaturas não pesam na lista de 5.000 cartões nem no tempo de resposta da revisão. A biblioteca de zoom, se houver, é pequena e não pesa no carregamento inicial de quem não abre imagens.
- **Navegadores**: Chrome/Edge/Firefox atuais e Safari do iOS/macOS atuais, incluindo o PWA instalado no iPhone. Onde o navegador não gera WebP, o formato de saída é JPEG.

## Fora do escopo

- Tudo o que o documento-mãe exclui, em especial imagens no meio do texto, editor rico e marcas (destaque, lacuna) nas imagens.
- Imagens na Frente ou no Verso, imagens visíveis antes de revelar a resposta e opção por imagem de “mostrar já na Frente”.
- Oclusão de imagem (esconder partes da imagem como lacuna), anotação, desenho, recorte ou giro manual no app.
- Miniaturas ou indicador de imagens na lista de Cartões, e busca pelas legendas.
- Importar a mídia do Anki para a galeria (F14 exclui) e incluir imagens no backup em arquivo, que fica com a entrega de backup (F15).
- Mais de 6 imagens por cartão, imagens acima de 2.000 px ou 1,5 MB, original em resolução cheia guardado à parte e escolha de formato ou qualidade pelo usuário.
- Vídeo, áudio, PDF e GIF animado (o GIF entra como imagem parada).
- Bloqueio ou alerta por cota, limpeza de imagens antigas e compartilhamento de imagens entre cartões (a mesma imagem colada em dois cartões vira dois arquivos).
- Pré-baixar todas as imagens da conta para uso offline: o download é sob demanda e pela fila (RF77c).
