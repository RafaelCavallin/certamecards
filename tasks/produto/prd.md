# Documento de Requisitos do Produto (PRD) — CertameCards

## Visão geral

O CertameCards é um aplicativo pessoal de **revisão por repetição espaçada para concursos públicos**. O concurseiro transforma o que estuda (artigos de lei seca, súmulas, conceitos, prazos, pegadinhas de banca) em cartões de **Frente / Verso / Notas**, marca o que é importante com **destaque** e esconde o que precisa ser lembrado com **ocultação** (lacuna). O app decide o que revisar a cada dia com o algoritmo FSRS, e a sessão de revisão é rápida, sem distrações e legível em textos longos.

A primeira tentativa de app própria ficou lenta demais para evoluir. Este produto nasce reaproveitando deliberadamente a arquitetura, o modelo de dados, a sincronização e a identidade visual do **Lingo** (app de frases em inglês do mesmo autor, já em produção), trocando apenas o que muda de domínio: sem áudio, sem fonética, com notas longas e com frontend em **Angular**. O valor é ter, em poucas semanas, um app de revisão confiável, offline-first e instalável, focado no conteúdo de concurso.

## Objetivos

- **Velocidade de entrega**: MVP utilizável (criar cartão → revisar → progresso, offline) em até 2 semanas de trabalho; conta e sincronização em até 1 semana depois.
- **Reuso**: ≥ 70% da lógica de negócio (`db`, `scheduler`, `sync`, `syncRows`, `auth`, `stats`, `lww`, `textMarks`) portada do Lingo com os testes existentes adaptados, e não reescrita.
- **Fluidez da revisão**: responder um cartão e ver o próximo em < 150 ms (percebido como instantâneo), sem rede.
- **Legibilidade**: nenhum texto de leitura abaixo de 16 px e nenhum rótulo abaixo de 13 px; frente de até 1.500 caracteres legível sem rolagem horizontal num celular de 360 px.
- **Constância (métrica de uso)**: o autor revisa em ≥ 5 dias por semana durante o primeiro mês (visível no heatmap).
- **Confiabilidade**: zero perda de revisão ou cartão entre aparelhos em uso normal (LWW por linha, logs imutáveis).
- **Qualidade**: cobertura ≥ 80% na camada de domínio; `lint`, `test:coverage` e `build` verdes no CI.
- **Fase 2 em até 4 semanas após o MVP**, entregue em fatias independentes (cada funcionalidade F11–F17 vai para produção sozinha).
- **Fase 2 — uso**: ≥ 50% dos cartões com ao menos uma etiqueta após 1 mês; meta diária batida em ≥ 4 dias por semana; um baralho do Anki de 5.000 notas importado em < 30 s.

### Fases

- **Fase 1 (MVP)** — F1 a F10: cadastro, marcas, baralhos, Home, revisão, lista, progresso, conta/sync, ajustes, PWA.
- **Fase 2** — F11 a F17: etiquetas, cartões difíceis e reforço, meta diária e lembrete, importação do Anki, backup em arquivo, tema claro, imagens nas Notas.

O banco já nasce com as colunas das etiquetas e das configurações do usuário (Fase 2), para a sincronização não precisar ser refeita depois.

### Divisão em entregas

Este documento é a referência de produto; não é executado diretamente. Cada entrega tem a sua pasta `tasks/prd-<slug>/`, com PRD e TechSpec que recortam este documento (mantendo os IDs US, RF, CA, TU, TI e E2E) e passam pela esteira `/criar-tasks` → `/executar-task` → `/executar-review` → `/executar-qa`.

| Entrega | Pasta | Escopo | Estado |
| --- | --- | --- | --- |
| Fase 1 — MVP offline | [prd-mvp-offline](../prd-mvp-offline/prd.md) | F1–F7, F9 sem conta, F10, RF36 | PRD e TechSpec prontos |
| Fase 1 — Conta e sincronização | [prd-conta-sync](../prd-conta-sync/prd.md) | F8 (RF37–RF41), conta em F9 | PRD e TechSpec prontos |
| Fase 2 — Tema claro | `prd-tema-claro` | F16 | a criar ao iniciar |
| Fase 2 — Etiquetas | `prd-etiquetas` | F11 | a criar ao iniciar |
| Fase 2 — Difíceis e reforço | `prd-dificeis-reforco` | F12 | a criar ao iniciar |
| Fase 2 — Importação do Anki | `prd-importacao-anki` | F14 | a criar ao iniciar |
| Fase 2 — Meta e lembrete | `prd-meta-lembrete` | F13 | a criar ao iniciar |
| Fase 2 — Imagens nas Notas | `prd-imagens-notas` | F17 | a criar ao iniciar |
| Fase 2 — Backup e restauração | `prd-backup` | F15 | a criar ao iniciar |

A ordem da Fase 2 é a da seção “Sequenciamento do desenvolvimento” da [TechSpec](techspec.md). Uma mudança de produto que afete mais de uma entrega é feita primeiro aqui e depois refletida nos recortes.

## Histórias de usuário

- **US1**: Como concurseiro, quero criar um cartão com frente, verso e notas longas (com parágrafos) para registrar um dispositivo de lei e o meu comentário sobre ele.
- **US2**: Como concurseiro, quero **esconder** palavras da frente (ex.: “o prazo é de ___ dias”) para me testar no ponto exato que a banca cobra.
- **US3**: Como concurseiro, quero **destacar** palavras (ex.: “**salvo**”, “**vedado**”, “**exclusivamente**”) para enxergar as palavras-chave de pegadinha em toda revisão.
- **US4**: Como concurseiro, quero abrir o app e ver quantos cartões tenho hoje e quanto tempo levará, para decidir se reviso agora.
- **US5**: Como concurseiro, quero revisar respondendo só “Errei” ou “Acertei”, para não perder tempo avaliando dificuldade.
- **US6**: Como concurseiro, quero separar cartões em **baralhos** (ex.: “Constitucional”, “Português — Crase”) criados na hora, sem tela de cadastro de matérias.
- **US7**: Como concurseiro, quero buscar, editar e excluir cartões para corrigir um cartão errado ou desatualizado (lei alterada).
- **US8**: Como concurseiro, quero estudar sem internet (ônibus, sala de espera) e ter tudo sincronizado depois entre celular e computador.
- **US9**: Como concurseiro, quero ver meu progresso (retenção, sequência de dias, previsão de carga) para manter a constância.
- **US10** (borda): Como usuário sem conta, quero usar o app por completo só no aparelho; ao criar conta depois, quero decidir o que acontece com os dados locais.
- **US11** (borda): Como usuário que excluiu todos os baralhos, quero ser levado a criar um novo, em vez de ver um app quebrado.
- **US12** (Fase 2): Como concurseiro, quero etiquetar cartões por banca e tema para revisar só “CESPE” na semana da prova CESPE.
- **US13** (Fase 2): Como concurseiro, quero ver os cartões que mais erro e reforçá-los sem bagunçar minha agenda.
- **US14** (Fase 2): Como concurseiro, quero uma meta diária e um lembrete que só apareça quando eu ainda não estudei, para não quebrar a constância.
- **US15** (Fase 2): Como concurseiro que já usa Anki, quero trazer meus baralhos (com lacunas, negritos e etiquetas) sem redigitar.
- **US16** (Fase 2): Como usuário sem conta, quero exportar um backup para não perder meus cartões se trocar de celular.
- **US17** (Fase 2): Como concurseiro que estuda à noite, quero poder escolher entre tema escuro e claro.
- **US18** (Fase 2): Como concurseiro, quero anexar esquemas e mapas mentais às Notas e ampliá-los na revisão.

## Principais funcionalidades

### F1. Cartão Frente / Verso / Notas

Cada cartão tem três campos de texto. Frente e Verso são obrigatórios; Notas é opcional. Os três aceitam quebras de linha e parágrafos (texto puro, sem editor rico).

- **RF1**: O cartão tem Frente (obrigatória, até 5.000 caracteres), Verso (obrigatório, até 5.000) e Notas (opcional, até 20.000).
- **RF2**: Os três campos preservam quebras de linha e linhas em branco (parágrafos) na edição e na revisão.
- **RF3**: O campo Notas começa com altura de pelo menos 6 linhas e cresce conforme o texto, sem barra de rolagem interna.
- **RF4**: Criar cartão mantém o usuário na tela e limpa os campos para o próximo (fluxo de cadastro em série); editar volta para a tela anterior.
- **RF5**: Editar o texto não altera o agendamento do cartão e não gera revisão.

### F2. Destacar e ocultar trechos

Mesma mecânica do Lingo: o usuário seleciona um trecho e escolhe a ação numa barra que aparece abaixo do campo. As marcas são desenhadas por trás do texto enquanto ele é editado.

- **RF6**: Na **Frente**, selecionar um trecho oferece “Destacar seleção” e “Ocultar seleção”. No **Verso** e nas **Notas**, oferece apenas “Destacar seleção”.
- **RF7**: Com o cursor dentro de uma marca, a barra oferece “Tirar destaque” ou “Mostrar de novo”.
- **RF8**: A seleção é aparada nos espaços das pontas; marcas não se sobrepõem.
- **RF9**: Ao editar o texto, as marcas antes e depois do trecho alterado se reposicionam; marcas atravessadas pela edição são descartadas.
- **RF10**: Sem seleção, a barra mostra uma linha de dica/resumo (ex.: “2 lacunas e 1 destaque · toque na marca para desfazer”), sem mudar a altura do formulário.
- **RF11**: Na revisão, o destaque aparece sempre (negrito na cor de sinal), inclusive antes de revelar a resposta.
- **RF12**: Na **Frente**, trecho oculto aparece como lacuna (`_____`) até “Mostrar resposta”; depois aparece revelado com um fundo sutil, para o usuário ver o que era a lacuna.
- **RF13**: Verso e Notas **não têm lacunas**: são exibidos por inteiro ao revelar a resposta, com os destaques aplicados.

### F3. Baralhos (sem cadastro de matérias)

Não existe entidade “matéria”. O agrupamento é o baralho, gerido num seletor rápido.

- **RF14**: Na primeira abertura, o app cria um baralho padrão “Meus cartões”.
- **RF15**: O seletor de baralhos (a partir do cabeçalho) lista os baralhos com a contagem pendente de cada um, permite trocar o baralho ativo, criar um novo (nome inline), renomear e excluir.
- **RF16**: Excluir baralho pede confirmação e remove também os cartões dele (exclusão lógica, sincronizável).
- **RF17**: Sem nenhum baralho, o app mostra a tela “Crie seu primeiro baralho” em vez da Home.
- **RF18**: Cada baralho tem “novos por dia” (padrão 20) e “teto de cartões ainda não firmados” (padrão 50), editáveis.

### F4. Início (Hoje)

- **RF19**: A Home mostra o número de cartões da fila de hoje do baralho ativo em destaque, a estimativa em minutos e o botão “Estudar”.
- **RF20**: Um indicador no cabeçalho soma os pendentes de todos os baralhos.
- **RF21**: A Home mostra o heatmap de constância quando houver histórico, com atalho para Progresso.
- **RF22**: Baralho vazio mostra onboarding com o botão “Criar primeiro cartão”.
- **RF23**: A contagem se atualiza sozinha quando cartões vencem (sem recarregar a página).

### F5. Sessão de revisão

- **RF24**: A fila segue o Lingo: vencidos primeiro por data; novos entram intercalados, limitados por “novos por dia” e pelo teto de não firmados.
- **RF25**: O cartão abre mostrando a Frente; “Mostrar resposta” (ou Espaço) revela Verso e Notas.
- **RF26**: Após revelar, “Errei” (tecla 1) e “Acertei” (tecla 2 ou Espaço) registram a resposta, reagendam pelo FSRS e avançam.
- **RF27**: Resposta em andamento bloqueia uma segunda resposta ao mesmo cartão (duplo clique/tecla repetida).
- **RF28**: Cabeçalho com “← Sair”, posição “n / total” e barra de progresso fina.
- **RF29**: Fim de sessão mostra quantos cartões foram revisados e o botão “Voltar ao início”.
- **RF30**: Na revisão é possível abrir a edição do cartão atual e voltar para ele (corrigir erro achado durante o estudo).

### F6. Lista de cartões

- **RF31**: Lista do baralho ativo com busca por texto (frente, verso e notas), contagem, editar e excluir por item.
- **RF32**: Seleção múltipla com exclusão em lote e confirmação.
- **RF33**: A lista carrega de forma incremental (rolagem), fluida com 5.000 cartões.

### F7. Progresso

- **RF34**: Mostra retenção dos últimos 30 dias, sequência de dias, total de revisões, heatmap de constância, previsão de vencimentos para 14 dias e maturidade (novos, em aprendizado, firmados).
- **RF35**: Permite ajustar os dois limites do baralho (RF18) na seção “Ritmo”.

### F8. Conta e sincronização (opcional)

Idêntico ao Lingo: offline-first, conta por email e senha, sincronização por linha.

- **RF36**: Sem conta, o app funciona 100% no aparelho.
- **RF37**: Com conta, baralhos, cartões e histórico sincronizam ao abrir o app, ao voltar à Home após uma sessão, ao reconectar e sob demanda (“Sincronizar agora”).
- **RF38**: Conflitos resolvem por última escrita (LWW por linha, desempate determinístico); o histórico de revisões é imutável e unido por id.
- **RF39**: Ao entrar pela primeira vez com dados no aparelho **e** na conta, o usuário escolhe: juntar, descartar os dados do aparelho ou cancelar. Lado vazio não é conflito.
- **RF40**: Entrar numa conta diferente da vinculada ao aparelho nunca mistura dados de contas.
- **RF41**: Sem Supabase configurado no build, a área de conta informa que a sincronização não está disponível, sem erro.

### F9. Ajustes

- **RF42**: Nome do baralho ativo, conta (entrar/sair, última sincronização, “Sincronizar agora”) e versão do app.
- **RF43**: **Não** há ajustes de voz, velocidade de narração, modo “ouvir primeiro” nem fonética.

### F10. PWA

- **RF44**: Instalável (manifest, ícone, tema escuro `#14142B`), com service worker que permite abrir e revisar sem rede após a primeira visita.
- **RF45**: O app pede persistência do armazenamento ao navegador para reduzir o risco de perda de dados locais.

### F11. Etiquetas por banca e tema — Fase 2

Etiquetas livres no cartão (“CESPE”, “FGV”, “pegadinha”, “Art. 37”), para filtrar a lista e a revisão. Não substituem o baralho: um cartão fica em um baralho e pode ter várias etiquetas.

- **RF46**: O cartão tem até 20 etiquetas de 1 a 40 caracteres, editadas no formulário como chips, com autocompletar das etiquetas já usadas.
- **RF47**: Etiquetas se comparam sem diferenciar maiúsculas nem acentos (“Pegadinha” = “pegadinha”); o mesmo cartão não repete etiqueta.
- **RF48**: A lista de Cartões filtra por uma ou mais etiquetas (o cartão precisa ter todas as selecionadas), combinável com a busca.
- **RF49**: Na Home, “Estudar só…” restringe a fila de hoje às etiquetas escolhidas; o número de hoje e a estimativa passam a refletir o filtro, que fica visível e pode ser limpo com um toque. A revisão reagenda normalmente.
- **RF50**: Ajustes → Etiquetas lista todas com a contagem de cartões e permite renomear (inclusive juntar duas) e excluir em todos os cartões de uma vez.

### F12. Cartões difíceis e reforço — Fase 2

- **RF51**: A tela “Difíceis” lista os cartões do baralho ativo com pontuação de dificuldade = 2 × lapsos + erros nos últimos 30 dias, a partir de 3 pontos, do mais difícil para o menos; cada item mostra “errou N vezes · último erro há X dias”.
- **RF52**: “Reforçar” abre uma sessão **fora da agenda** com até 30 cartões difíceis, opcionalmente filtrados por etiqueta, na mesma interface da revisão.
- **RF53**: Respostas no reforço **não** alteram o agendamento, o histórico nem as estatísticas; a tela avisa isso (“Reforço — não mexe na sua agenda”). Motivo: revisar antes da hora distorceria o FSRS e a retenção medida.
- **RF54**: O fim do reforço mostra quantos acertou e quais errou, com atalho para editar cada um.

### F13. Meta diária e lembrete — Fase 2

- **RF55**: Meta de revisões por dia (desligada por padrão; 10 a 500), somando todos os baralhos, sincronizada entre aparelhos.
- **RF56**: Com meta ligada, a Home mostra o progresso (“28 / 40 hoje”) e sinaliza quando a meta é batida; o Progresso mostra a sequência de dias com meta batida e marca esses dias no heatmap.
- **RF57**: Lembrete diário num horário escolhido, enviado como notificação **somente se a meta do dia ainda não foi batida** (sem meta: somente se não houve revisão no dia). Exige conta e permissão de notificação; no iPhone, exige o app instalado na tela de início.
- **RF58**: Onde não houver notificação (sem conta, navegador sem suporte ou permissão negada), “Adicionar lembrete à agenda” baixa um evento diário recorrente (`.ics`) no horário escolhido.
- **RF59**: O lembrete pode ser desligado a qualquer momento; cada aparelho se inscreve separadamente.

### F14. Importação do Anki — Fase 2

Portada do Lingo, com os campos do CertameCards.

- **RF60**: Importar um arquivo `.apkg`: escolher o baralho de destino (existente ou novo), filtrar pelos baralhos de origem, mapear campos do Anki para Frente, Verso e Notas (Notas opcional) e ver a prévia das 3 primeiras notas.
- **RF61**: O HTML do Anki vira texto preservando quebras de linha e parágrafos (`<br>`, `<div>`, `<p>`, `<li>`); trechos em negrito ou sublinhado (`<b>`, `<strong>`, `<u>`) viram **destaque**.
- **RF62**: Notas de lacuna do Anki (`{{c1::texto::dica}}`) viram **um cartão por número de lacuna** (c1, c2…), com a lacuna daquele número oculta na Frente e as demais em texto normal; a dica é descartada.
- **RF63**: As etiquetas das notas do Anki viram etiquetas do cartão.
- **RF64**: Só o conteúdo é importado: o histórico do Anki não vem (o agendamento recomeça no FSRS) e a mídia do Anki (imagens e áudio) não é importada.
- **RF65**: A importação é tudo-ou-nada, com barra de progresso; 10.000 notas em menos de 30 s num computador comum.

### F15. Backup e restauração em arquivo — Fase 2

Portado do Lingo, sem áudio e com imagens.

- **RF66**: Ajustes → Backup gera um `.zip` com baralhos, cartões (com etiquetas e marcas), histórico, configurações e imagens.
- **RF67**: Restaurar mostra uma prévia (data do backup e contagens) e oferece **Mesclar** (a versão mais recente de cada item vence) ou **Substituir** (apaga o que há no aparelho, com confirmação).
- **RF68**: Backup e restauração funcionam sem rede; restaurar com conta conectada envia o resultado na próxima sincronização.
- **RF69**: Sem conta e sem backup há mais de 30 dias, Ajustes mostra um aviso discreto sugerindo exportar.

### F16. Tema claro — Fase 2

- **RF70**: Ajustes → Aparência: **Escuro** (padrão), **Claro** ou **Seguir o sistema**; a escolha vale para o aparelho.
- **RF71**: O tema é aplicado antes da primeira pintura (sem piscar escuro → claro) e a cor da barra do navegador acompanha.
- **RF72**: O tema claro mantém a mesma hierarquia visual e contraste AA em todos os textos; a cor de sinal é escurecida para funcionar como texto sobre fundo claro.

### F17. Imagens nas Notas — Fase 2

Esquemas, tabelas fotografadas e mapas mentais anexados ao cartão.

- **RF73**: Até 6 imagens por cartão, adicionadas por arquivo, câmera do celular ou colar (Ctrl+V) no formulário.
- **RF74**: As imagens são reduzidas no aparelho antes de salvar (lado maior até 2.000 px, formato WebP), com no máximo 1,5 MB cada depois da redução.
- **RF75**: Na revisão, as imagens aparecem abaixo das Notas depois de revelar a resposta, como miniaturas; tocar abre em tela cheia com zoom (pinça, roda do mouse) e navegação entre as imagens.
- **RF76**: No formulário é possível reordenar, legendar (opcional, até 200 caracteres) e remover imagens.
- **RF77**: Offline-first: a imagem fica disponível no aparelho imediatamente; com conta, é enviada para a nuvem quando houver rede e baixada nos outros aparelhos quando o cartão for exibido (com pré-carregamento dos próximos cartões da fila).
- **RF78**: Excluir um cartão exclui suas imagens em todos os aparelhos.

## Critérios de aceitação

- **CA-01** (RF1–RF3, US1): Dado o formulário de novo cartão, quando o usuário digita uma Frente, um Verso e três parágrafos nas Notas e salva, então ao abrir o cartão na revisão os três parágrafos aparecem separados, e o campo Notas nunca exibiu barra de rolagem interna.
- **CA-02** (RF4): Dado um cartão salvo pela tela de criação, então os campos ficam vazios e o foco volta para a Frente.
- **CA-03** (RF5): Dado um cartão já revisado, quando o usuário edita o Verso e salva, então a data da próxima revisão e o número de revisões não mudam.
- **CA-04** (RF6, RF12, US2): Dada a Frente “O mandato é de quatro anos” com “quatro” oculto, quando o cartão abre na revisão, então aparece “O mandato é de _____ anos”; ao tocar “Mostrar resposta”, “quatro” aparece com fundo sutil.
- **CA-05** (RF6, RF11, US3): Dado “salvo” destacado na Frente, então ele aparece em negrito colorido antes e depois de revelar a resposta.
- **CA-06** (RF6, RF13): Quando o usuário seleciona um trecho do Verso ou das Notas, então a barra oferece só “Destacar seleção” (nunca “Ocultar seleção”); na revisão, Verso e Notas aparecem inteiros, com o destaque em negrito colorido.
- **CA-07** (RF9): Dada a Frente com “quatro” oculto, quando o usuário insere texto no início da frase, então a lacuna continua cobrindo “quatro”; quando apaga a palavra “quatro”, a lacuna desaparece.
- **CA-08** (RF7): Com o cursor dentro de um destaque, então a barra mostra “Tirar destaque”, e usá-lo remove só aquela marca.
- **CA-09** (RF14, RF17, US11): Dada a primeira abertura, então existe o baralho “Meus cartões”; quando o usuário exclui o último baralho e recarrega, então vê “Crie seu primeiro baralho” e nenhum baralho é recriado sozinho.
- **CA-10** (RF15, RF16, US6): Quando o usuário cria o baralho “Constitucional” pelo seletor, então ele vira o baralho ativo sem sair da tela atual; ao excluí-lo com confirmação, os cartões dele somem da lista e da fila.
- **CA-11** (RF19, RF23, US4): Dado um cartão que vence em 1 minuto, quando o usuário deixa a Home aberta, então o número de hoje aumenta em até 60 s sem recarregar.
- **CA-12** (RF24): Dado um baralho com 30 cartões novos e “novos por dia” = 10, então a fila do dia tem no máximo 10 novos, intercalados entre os vencidos.
- **CA-13** (RF25–RF27, US5): Com o teclado, Espaço revela; 1 registra “Errei”; 2 registra “Acertei”; pressionar 2 duas vezes rapidamente registra uma única revisão.
- **CA-14** (RF30): Durante a revisão, quando o usuário edita o cartão atual e salva, então volta à revisão no mesmo cartão com o texto corrigido.
- **CA-15** (RF31, RF33): Dado um baralho com 5.000 cartões, quando o usuário busca uma palavra que só existe nas Notas de um cartão, então esse cartão aparece e a rolagem da lista permanece fluida.
- **CA-16** (RF34): Dado um dia com 10 revisões e 8 acertos, então a retenção de 30 dias exibida é 80% e o dia aparece preenchido no heatmap.
- **CA-17** (RF36, US8): Com a rede desligada e sem conta, o usuário cria cartões, revisa e vê o progresso sem nenhuma mensagem de erro.
- **CA-18** (RF37, RF38, US8): Com a mesma conta em dois aparelhos, quando um revisa offline e depois reconecta, então as revisões aparecem no outro após a próxima sincronização, sem duplicar logs.
- **CA-19** (RF39, US10): Dado um aparelho com cartões locais e uma conta com cartões, quando o usuário entra, então vê as opções juntar/descartar/cancelar; “cancelar” sai da conta sem alterar nada local.
- **CA-20** (RF40): Dado um aparelho vinculado à conta A com dados, quando o usuário entra na conta B com dados, então os dados de A nunca aparecem em B.
- **CA-21** (RF43): Em nenhuma tela existe controle de áudio, voz, velocidade, gravação ou fonética.
- **CA-22** (RF44): Depois da primeira visita, com a rede desligada, recarregar o app abre a Home e permite revisar.
- **CA-23** (Legibilidade): Em 360 px de largura, nenhum texto de leitura fica abaixo de 16 px, nenhum rótulo abaixo de 13 px e não há rolagem horizontal.

**Fase 2**

- **CA-24** (RF46, RF47): Dado um cartão com a etiqueta “Pegadinha”, quando o usuário tenta adicionar “pegadinha”, então nenhuma etiqueta nova é criada; ao digitar “peg” em outro cartão, “Pegadinha” é sugerida.
- **CA-25** (RF48): Com as etiquetas “CESPE” e “Art. 37” selecionadas na lista, então só aparecem cartões que têm as duas.
- **CA-26** (RF49, US12): Dada uma fila de 40 cartões dos quais 12 têm “CESPE”, quando o usuário escolhe “Estudar só: CESPE”, então a Home mostra 12 e a sessão só apresenta esses 12; ao limpar o filtro, volta a 40 menos os já revisados.
- **CA-27** (RF50): Quando o usuário renomeia “Cespe” para “CESPE” e já existe “CESPE”, então as duas se juntam e nenhum cartão fica com etiqueta duplicada.
- **CA-28** (RF51): Dado um cartão com 2 lapsos e 1 erro nos últimos 30 dias (pontuação 5) e outro com 1 lapso e nenhum erro recente (pontuação 2), então só o primeiro aparece em “Difíceis”.
- **CA-29** (RF52, RF53, US13): Depois de uma sessão de reforço com respostas “Errei”, então a data da próxima revisão desses cartões, a retenção e o heatmap não mudam.
- **CA-30** (RF55, RF56): Com meta 40 e 28 revisões hoje, então a Home mostra “28 / 40 hoje”; na 40ª revisão, a Home indica meta batida e o dia é marcado no Progresso.
- **CA-31** (RF57, US14): Com lembrete às 20:00 e meta já batida às 19:00, então nenhuma notificação chega às 20:00; num dia sem a meta batida, chega uma notificação entre 20:00 e 20:15.
- **CA-32** (RF58): Sem conta, “Adicionar lembrete à agenda” baixa um `.ics` que, aberto no calendário, cria um evento diário no horário escolhido.
- **CA-33** (RF60, RF61): Dada uma nota do Anki com `<b>vedado</b>` e dois `<div>` no verso, então o cartão importado tem “vedado” destacado e o verso em dois parágrafos.
- **CA-34** (RF62, RF63, US15): Dada uma nota de lacuna com `{{c1::União}}` e `{{c2::privativamente}}` e as etiquetas `cespe constitucional`, então são criados 2 cartões, cada um com uma lacuna diferente oculta na Frente, ambos com as duas etiquetas.
- **CA-35** (RF65): Se a importação falhar no meio (arquivo corrompido), então nenhum cartão daquela importação permanece no baralho.
- **CA-36** (RF66, RF67, US16): Dado um backup exportado, quando o usuário restaura em outro navegador com “Substituir”, então baralhos, cartões, etiquetas, histórico e imagens ficam idênticos aos do aparelho de origem.
- **CA-37** (RF67): Com “Mesclar”, um cartão editado depois do backup mantém a edição mais recente.
- **CA-38** (RF70, RF71, US17): Com o tema “Claro” escolhido, ao recarregar a página não há nenhum quadro com fundo escuro antes do conteúdo.
- **CA-39** (RF72): No tema claro, todos os textos atingem contraste AA (≥ 4,5:1) sobre o fundo em que aparecem.
- **CA-40** (RF73, RF74): Uma foto de 12 MP colada no formulário é salva com lado maior ≤ 2.000 px e ≤ 1,5 MB.
- **CA-41** (RF75, US18): Na revisão, tocar numa miniatura abre a imagem em tela cheia; pinça/roda amplia; Escape ou “fechar” volta ao cartão.
- **CA-42** (RF77): Uma imagem adicionada offline no aparelho A aparece no aparelho B (mesma conta) depois que A reconecta e B exibe o cartão.
- **CA-43** (RF78): Excluir um cartão com imagens faz as imagens sumirem também no outro aparelho após a sincronização.

## Experiência do usuário

**Perfil principal**: o próprio autor, concurseiro, que estuda em blocos curtos no celular (transporte, intervalos) e cadastra cartões no computador enquanto estuda o material. Perfil secundário: outros concurseiros convidados, sem conhecimento técnico.

**Fluxos principais**:
1. *Cadastro em série*: Home → “+ Cartão” → Frente → seleciona palavra → “Ocultar seleção” → Verso → Notas com parágrafos → Salvar → próximo.
2. *Revisão diária*: Home (“Hoje: 42 · cerca de 9 min”) → Estudar → Frente → Mostrar resposta → Errei/Acertei → … → Sessão concluída → Início.
3. *Correção*: Revisão → “Editar” no cartão atual → corrige → volta ao mesmo cartão.
4. *Organização*: Cabeçalho → seletor de baralhos → “+ Novo baralho” → digita nome → ativo.
5. *Semana da prova* (Fase 2): Home → “Estudar só…” → CESPE → Estudar; depois, Difíceis → Reforçar.
6. *Migração do Anki* (Fase 2): Ajustes → Importar do Anki → arquivo → baralho de destino → mapear campos → prévia → Importar.

**Identidade visual (herdada do Lingo)**: mesma paleta (`ink #14142B`, `surface #1F1F3D`, `line #32325C`, `text #EDEBFF`, `muted #9C9BC4`, `signal #F4B740`, `hit #7CE2C0`, `miss #F2789B`), mesmas fontes auto-hospedadas (Bricolage Grotesque para títulos e conteúdo do cartão, Inter para corpo, JetBrains Mono para rótulos), mesmos cantos arredondados, botões-pílula, foco visível em âmbar, skeletons e respeito a `prefers-reduced-motion`. Tema escuro por padrão; tema claro na Fase 2 (F16).

**Textos maiores que no Lingo** (requisito explícito): o Lingo usa muitos rótulos de 10–12 px e textos auxiliares de 14 px. No CertameCards:
- rótulos em fonte mono: mínimo 13–14 px (no Lingo 10–12 px);
- textos auxiliares e botões: 16 px (no Lingo 14 px);
- corpo e Notas: 18 px com entrelinha folgada;
- Frente: 24 px no celular, 30 px em telas maiores, reduzindo um degrau quando o texto passa de ~280 caracteres (lei seca longa);
- Verso: 20–24 px.

**Acessibilidade**: navegação completa por teclado; foco visível; botões com rótulo acessível; contraste AA em todos os textos sobre `ink`/`surface`, nos dois temas; imagens com texto alternativo (a legenda, quando houver); áreas de toque ≥ 44 px; `aria-live` para estados de carregamento e fim de sessão.

**Mobile-first**: largura máxima de conteúdo ~42 rem; menu ☰ abaixo de `md`; rodapé de atalhos na Home a partir de `md`; áreas seguras (`safe-area-inset`).

## Restrições técnicas de alto nível

- **Frontend obrigatoriamente em Angular** (versão estável atual), PWA instalável, mobile-first.
- **Backend como o Lingo**: Supabase (Postgres + Auth + RLS + RPC de push), sem servidor próprio; hospedagem estática na Vercel.
- **Fase 2 amplia o Supabase** com Storage (imagens) e uma Edge Function agendada (envio dos lembretes por Web Push, com chaves VAPID só no servidor). Continua sem servidor próprio.
- **Armazenamento**: imagens limitadas a 1,5 MB e 6 por cartão para caber no plano gratuito do Supabase no uso pessoal.
- **Offline-first**: os dados vivem no IndexedDB do navegador; a nuvem é uma camada opcional de sincronização.
- **Estilos**: os mesmos tokens de cor, fontes e padrões visuais do Lingo (Tailwind), com a escala tipográfica aumentada descrita acima.
- **Algoritmo**: FSRS com retenção alvo de 0,90 e avaliação binária.
- **Segurança e privacidade**: dados pessoais de estudo; isolamento por usuário garantido no banco (RLS, chave composta `user_id + id`); nenhuma chave secreta no bundle; só email e nome são coletados.
- **Ambientes isolados**: desenvolvimento nunca aponta para o banco de produção (mesmo modelo local / preview / produção do Lingo).
- **Desempenho**: primeira carga ≤ 3 s em 4G no celular; resposta a um cartão ≤ 150 ms; lista fluida com 5.000 cartões; sincronização paginada (500 linhas por página).

## Fora do escopo

- Áudio de qualquer tipo: narração/TTS, repetir áudio, velocidade de voz, modo “ouvir primeiro”, gravação e comparação da própria voz.
- Transcrição fonética e busca de pronúncia.
- Geração automática por IA (tradução/dicas do Lingo).
- Em avaliação, fora das Fases 1 e 2: “colar um artigo de lei e gerar lacunas” e o formato Certo/Errado no estilo CESPE.
- Cadastro de matérias/disciplinas como entidade própria (o baralho cumpre esse papel).
- Histórico e mídia do Anki; exportar para o Anki.
- Otimizador de parâmetros do FSRS (o schema já reserva as colunas).
- Editor rico (listas, tabelas, formatação livre) e imagens no meio do texto — o texto é puro com quebras de linha; imagens ficam numa galeria abaixo das Notas.
- Ocultar trechos no Verso e nas Notas (lacuna existe só na Frente).
- Lembrete por notificação sem conta; lembretes múltiplos por dia.
- Compartilhamento de baralhos entre usuários, monetização/assinatura.
