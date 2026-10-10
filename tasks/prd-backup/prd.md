# Documento de Requisitos do Produto (PRD) — Backup e restauração

> Entrega da Fase 2 (F15). Documento-mãe: [tasks/produto/prd.md](../produto/prd.md). A visão, a identidade visual, as restrições e o que fica fora do escopo valem aqui sem ser repetidos. Os IDs (US, RF, CA) são os do documento-mãe, mantidos para rastreabilidade. Os critérios próprios desta entrega usam o prefixo `CA-B`. Depende da Fase 1 ([prd-mvp-offline](../prd-mvp-offline/prd.md) e [prd-conta-sync](../prd-conta-sync/prd.md)), de [prd-etiquetas](../prd-etiquetas/prd.md) e de [prd-imagens-notas](../prd-imagens-notas/prd.md), concluídas: o backup leva etiquetas e imagens, e a restauração com conta sobe pela sincronização existente. As configurações do usuário (meta e lembrete, de [prd-meta-lembrete](../prd-meta-lembrete/prd.md)) entram no arquivo como estiverem no aparelho, mesmo que aquela entrega ainda não tenha tela.

## Visão geral

Sem conta, tudo o que o concurseiro estudou vive só no IndexedDB do navegador: trocar de celular, limpar os dados do navegador ou o iPhone apagar o armazenamento de um app pouco usado leva meses de cartões e de histórico embora, sem volta. A conta resolve isso para quem a cria, mas o app promete funcionar por completo sem ela. Hoje não há nenhum jeito de tirar os dados do aparelho.

Esta entrega traz **Ajustes → Backup**. “Baixar backup” gera um único `.zip` com baralhos, cartões (texto, marcas, etiquetas e agendamento), histórico de revisões, configurações do usuário e imagens das Notas. “Restaurar um backup” lê esse arquivo, mostra a data e as contagens e oferece **Mesclar** (a versão mais recente de cada item vence, nada é apagado) ou **Substituir** (o aparelho fica igual ao arquivo, com confirmação e um backup automático do estado atual antes). Tudo roda no aparelho, sem rede e sem conta; com conta, o resultado da restauração sobe na próxima sincronização. Quem usa o app sem conta e está há mais de 30 dias sem backup vê um aviso discreto em Ajustes. A lógica é portada do backup do Lingo, sem áudio e com imagens.

## Objetivos

- Entrega em até 3 dias de trabalho, conforme o sequenciamento da TechSpec-mãe (última fatia da Fase 2).
- **Fidelidade**: depois de exportar e restaurar com “Substituir” num navegador vazio, 100% dos baralhos, cartões (texto, marcas, etiquetas e campos de agendamento), revisões, configurações e imagens (bytes, ordem e legenda) são idênticos aos da origem (CA-36), verificado em teste automatizado de ida e volta.
- **Sem perda na mesclagem**: “Mesclar” nunca apaga nem rebaixa um item mais recente do aparelho (CA-37) e nunca duplica revisões, verificado em teste automatizado.
- **Atomicidade**: zero alterações no aparelho depois de uma restauração que falha, é cancelada ou é interrompida no meio, verificado em teste automatizado.
- **Velocidade**: com 5.000 cartões, 20.000 revisões e sem imagens, gerar o backup leva < 10 s e restaurar leva < 15 s num celular intermediário. Com imagens, o tempo cresce com o tamanho do arquivo, sempre com barra de progresso.
- **Funciona offline**: 100% do fluxo (exportar, ler, prévia, restaurar) funciona com a rede desligada e sem Supabase configurado no build.
- **Uso (métrica de produto)**: entre os usuários sem conta, nenhum fica mais de 30 dias sem backup sem ter visto o aviso. Observado pela data do último backup exibida em Ajustes, sem instrumentação nova.

## Histórias de usuário

- **US16**: Como usuário sem conta, quero exportar um backup para não perder meus cartões se trocar de celular.
- **US16a** (derivada): Como usuário que trocou de celular, quero restaurar o arquivo no aparelho novo e encontrar meus baralhos, cartões, etiquetas, histórico, imagens e agenda exatamente como estavam.
- **US16b** (derivada): Como usuário que continuou estudando depois de fazer o backup, quero mesclar um backup antigo sem perder o que fiz depois dele.
- **US16c** (derivada): Como usuário que quer voltar a um estado anterior, quero substituir tudo pelo backup, com uma confirmação clara e uma cópia de segurança do estado atual, caso me arrependa.
- **US16d** (derivada): Como usuário sem conta, quero ser lembrado de fazer backup quando estou há muito tempo sem fazer, sem ser incomodado a cada abertura.
- **US16e** (borda): Como usuário com conta, quero que o que eu restaurar chegue aos meus outros aparelhos na próxima sincronização.
- **US16f** (borda): Como usuário com conta que escolheu o arquivo de outra conta, quero ser avisado de que os dados vão se misturar antes de confirmar.
- **US16g** (borda): Como usuário que escolheu o arquivo errado (outro app, arquivo corrompido, backup de uma versão mais nova do app), quero uma mensagem clara, sem nada alterado no aparelho.

## Principais funcionalidades

RF66–RF69 estão descritos por inteiro no documento-mãe. Abaixo, o que esta entrega detalha.

| Funcionalidade | Requisitos | Observação |
| --- | --- | --- |
| F15. Backup e restauração | RF66–RF69 | Tela Ajustes → Backup, com exportação, restauração e aviso. |
| F9. Ajustes | **entrada nova** | “Backup” em Ajustes, com o aviso de RF69. |
| F8. Conta e sincronização | RF37, RF38 | A restauração com conta sobe pela sincronização existente, com LWW por linha e revisões unidas por id. |
| F17. Imagens nas Notas | RF73–RF78 | Imagens entram no arquivo; as que só existem na nuvem são baixadas antes, quando há rede. |

Requisitos próprios desta entrega, derivados de RF66–RF69:

**Exportar (RF66)**

- **RF66a**: Ajustes → Backup mostra o que o arquivo leva (“baralhos, cartões, etiquetas, histórico de revisões, configurações e imagens”), a recomendação de guardá-lo fora do navegador, o tamanho estimado do arquivo e a data do último backup feito neste aparelho (“Último backup: há 12 dias” ou “Nenhum backup feito neste aparelho”).
- **RF66b**: “Baixar backup” gera um único `.zip` chamado `certamecards-backup-AAAA-MM-DD.zip` (data local) e o entrega como download. No iPhone com o app instalado na tela de início, onde o download direto não funciona, o arquivo é oferecido pela folha de compartilhamento do sistema (“Salvar em Arquivos”).
- **RF66c**: O arquivo contém todos os baralhos e cartões não excluídos, com texto, marcas, etiquetas e todos os campos de agendamento; todas as revisões; as configurações do usuário (meta e lembrete); e as imagens dos cartões incluídos, com ordem e legenda. Também registra a data da geração, a versão do formato e a conta vinculada ao aparelho, se houver. Para o histórico continuar íntegro, o arquivo leva também os baralhos e cartões excluídos, marcados como excluídos; a prévia e o resumo contam só os não excluídos.
- **RF66d**: O arquivo **não** contém preferências do aparelho (tema, baralho ativo, filtro de “Estudar só…”), estado de sincronização, credenciais nem tokens da conta.
- **RF66e**: Imagens cujo arquivo ainda não foi baixado neste aparelho (só existem na nuvem) são baixadas antes de gerar o backup, se houver conta e rede. Sem rede, o backup é gerado assim mesmo e a tela informa “3 imagens não estavam neste aparelho e ficaram de fora do backup”.
- **RF66f**: Enquanto gera, a tela mostra “Gerando o backup…” com barra de progresso, e o botão fica indisponível. Ao terminar, “Backup baixado” e a data do último backup é atualizada. Falha ao gerar (ex.: falta de espaço) mostra a mensagem do erro e não atualiza a data.
- **RF66g**: Com o aparelho sem nenhum cartão nem baralho, “Baixar backup” fica indisponível, com o motivo (“Não há nada para salvar ainda”).

**Ler o arquivo e prévia (RF67)**

- **RF67a**: “Restaurar um backup” abre a escolha de arquivo (`.zip`). Enquanto lê, a tela mostra “Lendo o backup…”. Nada é gravado no aparelho até a confirmação.
- **RF67b**: Arquivo que não é um backup do CertameCards mostra “Este arquivo não é um backup do CertameCards.”. Backup de uma versão de formato mais nova que a do app mostra “Este backup foi feito por uma versão mais nova do app. Atualize o app e tente de novo.”. Backup sem nenhum baralho, cartão nem revisão mostra “O arquivo não contém dados para restaurar.”. Em todos os casos a tela volta à escolha de arquivo.
- **RF67c**: Itens soltos inválidos dentro de um backup válido (corrompidos, acima dos limites de `card-limits`, imagens com formato ou tamanho fora das regras de F17) são descartados, e o resto do arquivo segue. A prévia informa quantos foram descartados. As regras de domínio valem na entrada: lacunas fora da Frente são removidas, e etiquetas seguem a grafia, os limites e a equivalência de [prd-etiquetas](../prd-etiquetas/prd.md).
- **RF67d**: A prévia mostra a data e a hora do backup e as contagens de baralhos, cartões, revisões e imagens, e o tamanho das imagens. Com conta conectada diferente da registrada no arquivo, mostra o aviso de RF67j.

**Mesclar (RF67)**

- **RF67e**: “Mesclar com o que já está aqui” é a opção pré-selecionada. Para cada baralho, cartão, imagem e configuração, vence a versão com a data de alteração mais recente entre o arquivo e o aparelho, com o mesmo desempate da sincronização. Revisões são unidas por id, sem duplicar. Nada que está no aparelho e não está no arquivo é apagado. Um item excluído no aparelho depois do backup continua excluído.
- **RF67f**: Mesclar não pede confirmação extra (exceto RF67j), porque não apaga nada.

**Substituir (RF67)**

- **RF67g**: “Substituir tudo pelo backup” deixa o aparelho igual ao arquivo: baralhos, cartões e imagens que estão no aparelho e não estão no arquivo são **excluídos**, e os do arquivo são gravados como estão no arquivo, mesmo que o aparelho tenha versão mais nova. Com conta, essas exclusões e substituições valem também nos outros aparelhos depois da sincronização. As revisões são unidas por id, como no Mesclar: o histórico nunca é apagado.
- **RF67h**: Substituir exige confirmação, com o texto: “Os baralhos e cartões deste aparelho que não estão no arquivo serão excluídos, também nos seus outros aparelhos. Um backup do estado atual será baixado antes.” e o botão “Sim, substituir tudo”, em cor `miss` acompanhada de texto.
- **RF67i**: Antes de substituir, se o aparelho tem algum cartão ou revisão, o app gera e baixa um backup do estado atual (RF66b). Se esse backup falhar, a substituição não acontece e a tela mostra o motivo.

**Outra conta (RF67)**

- **RF67j**: Com conta conectada e um arquivo gerado em outra conta, a restauração (Mesclar ou Substituir) exige confirmação com o aviso: “Este backup foi gerado em outra conta. Os dados vão se misturar com os da conta atual, neste aparelho e em todos os outros ligados a ela.” e o botão “Sim, restaurar mesmo assim”. Um arquivo gerado sem conta não gera esse aviso.

**Restaurar (RF67, RF68)**

- **RF67k**: A restauração mostra “Restaurando…” com barra de progresso determinada, anunciada por `aria-live` em marcos (a cada 25%).
- **RF67l**: A restauração é **tudo-ou-nada**: falha, recarregamento ou fechamento do app no meio não deixa o aparelho com parte do arquivo aplicada. Depois de uma falha, a tela mostra a mensagem do erro e volta à prévia; repetir não duplica nada.
- **RF67m**: O fim mostra o resumo: quantos baralhos, cartões, revisões e imagens foram aplicados, quantos itens do aparelho foram mantidos por serem mais recentes (Mesclar) ou excluídos (Substituir) e quantos itens do arquivo foram descartados. O resumo é anunciado por `aria-live`. O botão principal é “Ir para o início”.
- **RF67n**: Depois de restaurar, o baralho ativo continua o mesmo se ainda existir; senão, passa a ser o primeiro baralho; sem nenhum baralho, o app mostra “Crie seu primeiro baralho” (RF17). A fila de hoje, o Progresso e as etiquetas refletem os dados restaurados sem recarregar a página.
- **RF68a**: Exportar, ler, prévia e restaurar funcionam sem rede e sem conta, e sem Supabase configurado no build.
- **RF68b**: Com conta, tudo o que a restauração gravou ou excluiu é enviado na próxima sincronização, como qualquer alteração feita no aparelho; se houver rede, a sincronização começa logo depois da restauração. Imagens restauradas sobem para a nuvem pela mesma fila de envio de F17.

**Aviso de backup (RF69)**

- **RF69a**: Sem conta conectada, com pelo menos um cartão no aparelho e sem backup feito neste aparelho há mais de 30 dias (ou nunca), Ajustes mostra uma linha discreta, em `text-meta`, “Faz mais de 30 dias que você não faz backup. Sem conta, seus cartões só existem neste aparelho.” com o link “Fazer backup”. A primeira contagem dos 30 dias começa no primeiro cartão criado neste aparelho.
- **RF69b**: O aviso some sozinho depois de um backup baixado com sucesso e não aparece com conta conectada. Não há aviso fora de Ajustes nem notificação.

**Entrada de navegação**

- **RF66h**: Ajustes ganha a entrada “Backup”, que abre a tela de backup e restauração. Ela não entra no menu principal.

## Critérios de aceitação

Texto completo no documento-mãe:

| Critério | Requisitos | Resumo |
| --- | --- | --- |
| CA-36 | RF66, RF67, US16 | Restaurar com “Substituir” em outro navegador deixa baralhos, cartões, etiquetas, histórico e imagens idênticos aos da origem. |
| CA-37 | RF67 | Com “Mesclar”, um cartão editado depois do backup mantém a edição mais recente. |

Critérios próprios desta entrega:

- **CA-B1** (RF66b, RF66c, US16): Num aparelho com 2 baralhos, 50 cartões com etiquetas e marcas, 300 revisões e 4 imagens, “Baixar backup” gera `certamecards-backup-AAAA-MM-DD.zip`, e a prévia desse arquivo, ao restaurar, mostra 2 baralhos, 50 cartões, 300 revisões e 4 imagens.
- **CA-B2** (RF66c, RF66d, US16a): Depois de restaurar com “Substituir” num navegador vazio, um cartão que vencia amanhã com 5 revisões continua vencendo amanhã com 5 revisões, a meta diária é a mesma, e o tema e o filtro de “Estudar só…” são os do navegador novo, não os da origem.
- **CA-B3** (RF66e): Com conta, sem rede, e um cartão cuja imagem nunca foi baixada neste aparelho, o backup é gerado e a tela informa “1 imagem não estava neste aparelho e ficou de fora do backup”. Com rede, a mesma imagem entra no arquivo.
- **CA-B4** (RF67b, US16g): Um `.zip` qualquer mostra “Este arquivo não é um backup do CertameCards.”; um backup com versão de formato maior que a do app mostra a mensagem de atualizar o app; em ambos os casos nenhum dado do aparelho muda.
- **CA-B5** (RF67c): Num backup com 100 cartões, dos quais 1 tem Frente de 6.000 caracteres e 1 tem lacuna no Verso, então a prévia informa 1 item descartado, 99 cartões são restaurados, e o cartão com lacuna no Verso chega sem a lacuna e com o resto intacto.
- **CA-B6** (RF67e, US16b): Dado um backup feito ontem, quando o usuário revisou 20 cartões hoje, criou 3 cartões novos e excluiu 1 cartão, e restaura com “Mesclar”, então as 20 revisões de hoje continuam no histórico sem duplicar as de antes, os 3 cartões novos continuam, o cartão excluído continua excluído e as agendas de hoje não voltam para as de ontem.
- **CA-B7** (RF67g, RF67h, RF67i, US16c): Dado um aparelho com o baralho “Penal”, que não está no arquivo, quando o usuário escolhe “Substituir” e confirma, então um backup do estado atual é baixado antes, “Penal” deixa de existir, e as revisões feitas em “Penal” continuam contando no Progresso.
- **CA-B8** (RF67i): Se o backup automático anterior à substituição falhar, então nada é substituído e a tela mostra o motivo.
- **CA-B9** (RF67j, US16f): Com a conta A conectada e um backup da conta B, então a restauração só acontece depois do aviso de outra conta e de “Sim, restaurar mesmo assim”; um backup gerado sem conta restaura sem esse aviso.
- **CA-B10** (RF67l): Durante a restauração de um backup com 5.000 cartões, quando o usuário recarrega a página, então o aparelho fica exatamente como antes da restauração, e restaurar de novo conclui normalmente.
- **CA-B11** (RF67n): Depois de restaurar com “Substituir” um arquivo que não contém o baralho ativo, o baralho ativo passa a ser o primeiro baralho do arquivo, e a Home mostra a fila dele sem recarregar a página.
- **CA-B12** (RF68a, offline): Com a rede desligada e sem conta, o usuário baixa um backup, restaura com “Mesclar” e com “Substituir”, sem nenhuma mensagem de erro.
- **CA-B13** (RF68b, US16e): Com conta em dois aparelhos, depois de restaurar com “Substituir” no aparelho A e sincronizar, os cartões do arquivo, as imagens e as exclusões aparecem no aparelho B após a sincronização dele, sem duplicar revisões.
- **CA-B14** (RF69a, RF69b, US16d): Sem conta, com cartões e o último backup há 31 dias, Ajustes mostra o aviso; depois de “Baixar backup”, o aviso some; com 29 dias, ou com conta conectada, o aviso não aparece.
- **CA-B15** (Objetivo de velocidade): Num celular intermediário, com 5.000 cartões, 20.000 revisões e sem imagens, gerar o backup leva < 10 s e restaurá-lo leva < 15 s.
- **CA-B16** (legibilidade): Em 360 px, a tela de backup, a prévia, as confirmações e o resumo ficam sem rolagem horizontal, e nenhum texto fica abaixo da escala do produto.

## Experiência do usuário

Igual ao documento-mãe (perfil, identidade visual, escala tipográfica, acessibilidade). Perfil desta entrega: o concurseiro sem conta, que estuda no celular e precisa levar os dados para um aparelho novo ou guardar uma cópia; secundariamente, quem tem conta e quer uma cópia fora da nuvem ou voltar a um estado anterior.

Fluxos:

1. *Fazer backup*: Ajustes → Backup → “Baixar backup” → arquivo salvo → “Último backup: hoje”.
2. *Trocar de celular*: celular novo → Ajustes → Backup → “Restaurar um backup” → arquivo → prévia → “Substituir tudo pelo backup” → confirmação (sem backup automático, porque o aparelho novo ainda não tem cartões nem revisões) → resumo → Início.
3. *Recuperar sem perder o que veio depois*: Ajustes → Backup → “Restaurar um backup” → arquivo → prévia → “Mesclar” (pré-selecionado) → Restaurar → resumo.
4. *Lembrete*: Ajustes → aviso “Faz mais de 30 dias…” → “Fazer backup” → fluxo 1.

UI e acessibilidade:

- Uma só tela com duas seções: “Fazer backup” e “Restaurar”. A restauração avança em passos na mesma tela (arquivo → prévia e escolha → confirmação, quando houver → progresso → resumo), com “Voltar” até o momento de confirmar.
- Mesclar e Substituir são um grupo de rádio nativo, com rótulo e uma linha de explicação cada; a consequência de Substituir é dita em texto, não só por cor.
- A escolha de arquivo é um botão acessível por teclado (“Escolher arquivo de backup”).
- As barras de progresso têm `role="progressbar"` com valor e rótulo. Erros usam a cor `miss` acompanhada de texto; sucesso usa `hit` acompanhada de texto.
- O aviso de RF69 é uma linha de texto com link, sem caixa chamativa, sem modal e sem botão de dispensar.
- Textos em português do Brasil, com datas e números no formato brasileiro (“01/10/2026 às 20:15”, “1.230 cartões”, “12,4 MB”).

**Offline e sem conta**: backup e restauração rodam inteiros no aparelho, sem rede, sem conta e sem Supabase configurado no build. A única parte que usa rede é opcional: com conta, baixar antes do backup as imagens que só estão na nuvem (RF66e) e enviar o resultado da restauração na sincronização seguinte (RF68b). Sem rede, o backup sai sem essas imagens, com aviso, e a restauração fica pendente de envio até a próxima sincronização, como qualquer alteração offline. A data do último backup e o aviso de RF69 são do aparelho e não sincronizam.

## Restrições técnicas de alto nível

- As do documento-mãe, em especial: offline-first, escala tipográfica checada no CI, cores sempre por token e isolamento entre desenvolvimento e produção.
- **Porte do Lingo** (`services/backup*.ts`, `screens/Restore.tsx`, `components/Restore*.tsx`, `BackupSection.tsx`), sem áudio e com imagens, num formato próprio do CertameCards, versionado. Backups do Lingo não são aceitos.
- **Sem mudança de schema nem de RPC**: a restauração grava baralhos, cartões, revisões, configurações e imagens como alterações locais comuns, e a sincronização e a fila de imagens existentes as enviam.
- **Regras de domínio valem na entrada**: lacuna só na Frente, limites de `card-limits` e de imagens iguais aos do banco, equivalência de etiquetas, revisões imutáveis e unidas por id, LWW por linha com o mesmo desempate da sincronização. Os campos do FSRS vêm do arquivo como estavam: restaurar não reagenda nem gera revisão.
- **Privacidade**: o arquivo nunca sai do aparelho por ação do app; não é enviado a nenhum servidor. O arquivo não é criptografado nem protegido por senha, e a tela recomenda guardá-lo em lugar seguro. Não contém credenciais.
- **Peso do app**: a biblioteca de compactação fica fora do carregamento inicial e só é baixada quando o usuário abre o backup; depois disso, fica disponível offline pelo service worker.
- **Desempenho e memória**: as metas de CA-B15 e uma interface que responde durante a geração e a restauração. Backups com muitas imagens (centenas de MB) devem ser lidos sem travar o celular.

## Fora do escopo

- Tudo o que o documento-mãe exclui, em especial áudio de qualquer tipo.
- Backup automático ou agendado, backup na nuvem (Google Drive, Dropbox, e-mail) e histórico de versões de backup.
- Criptografia ou senha no arquivo.
- Backup ou restauração parcial: escolher baralhos, cartões ou períodos, ou exportar sem imagens.
- Restaurar backups do Lingo ou de outros apps, e exportar em outros formatos (CSV, `.apkg`).
- Restaurar preferências do aparelho (tema, baralho ativo, filtro de “Estudar só…”) ou o estado da sincronização.
- Restaurar itens excluídos do aparelho que não estão no arquivo, ou desfazer uma restauração (o backup automático de RF67i cumpre esse papel).
- Restaurar a partir da tela “Crie seu primeiro baralho”: a restauração fica só em Ajustes → Backup.
- Aviso de backup para quem tem conta, ou fora de Ajustes (Home, notificação).
