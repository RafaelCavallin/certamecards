# Documento de Requisitos do Produto (PRD) — Meta e lembrete

> Entrega da Fase 2 (F13). Documento-mãe: [tasks/produto/prd.md](../produto/prd.md). A visão, a identidade visual, as restrições e o que fica fora do escopo valem aqui sem ser repetidos. Os IDs (US, RF, CA) são os do documento-mãe, mantidos para rastreabilidade. Os critérios próprios desta entrega usam o prefixo `CA-M`. Depende da Fase 1 ([prd-mvp-offline](../prd-mvp-offline/prd.md) e [prd-conta-sync](../prd-conta-sync/prd.md)), concluída: a meta lê o histórico de revisões e sincroniza pelas configurações do usuário; o lembrete por notificação exige conta. Convive com [prd-dificeis-reforco](../prd-dificeis-reforco/prd.md): o reforço nunca conta para a meta.

## Visão geral

A repetição espaçada só funciona com constância, e hoje o app não ajuda o concurseiro a manter o ritmo: ele mostra quantos cartões vencem, mas não diz se o dia “valeu”, e não chama o usuário de volta quando ele esquece de estudar. O resultado é o dia perdido que vira uma pilha de vencidos no dia seguinte, justamente o que faz a pessoa abandonar o método.

Esta entrega acrescenta a **meta diária** de revisões (opcional, de 10 a 500 por dia, somando todos os baralhos), com o progresso visível na Home (“28 / 40 hoje”), uma comemoração breve quando a meta é batida e, no Progresso, a sequência de dias com meta batida e esses dias marcados no heatmap. Acrescenta também o **lembrete diário** num horário escolhido, enviado como notificação **só quando a meta do dia ainda não foi batida** (sem meta: só quando não houve revisão no dia), para que o lembrete nunca incomode quem já estudou. A meta funciona sem rede e sem conta. A notificação exige conta. Quem não tem conta ou não pode receber notificações baixa um evento recorrente para a própria agenda (`.ics`).

## Objetivos

- Entrega em até 4 dias de trabalho, conforme o sequenciamento da TechSpec-mãe (meta primeiro, depois o lembrete).
- **Constância (métrica de produto, do documento-mãe)**: com a meta ligada, o autor bate a meta em ≥ 4 dias por semana durante o primeiro mês, visível no heatmap e na sequência de dias com meta do Progresso.
- **Lembrete sem ruído**: zero notificação em dia de meta já batida (com as revisões já sincronizadas) e no máximo uma notificação por conta por dia. Medido no roteiro E2E e por teste do critério de envio no banco local.
- **Pontualidade**: em dia sem meta batida, a notificação chega entre o horário escolhido e 15 minutos depois em ≥ 95% dos dias (CA-31).
- **Contagem correta**: o progresso da Home bate com o número de respostas da revisão normal feitas no dia local, somando todos os baralhos, em 100% dos casos de teste, inclusive na virada da meia-noite e com revisões vindas de outro aparelho.
- **Fluidez**: o progresso da Home se atualiza em < 150 ms depois de uma resposta, sem rede; o Progresso com 50.000 revisões no histórico calcula a sequência com meta em < 500 ms.

## Histórias de usuário

- **US14**: Como concurseiro, quero uma meta diária e um lembrete que só apareça quando eu ainda não estudei, para não quebrar a constância.
- **US14a** (derivada): Como concurseiro, quero ver na Home quanto falta para a meta de hoje (“28 / 40 hoje”) para decidir se faço mais uma rodada.
- **US14b** (derivada): Como concurseiro, quero sentir que fechei o dia quando bato a meta, com uma comemoração breve que não atrapalhe a sessão.
- **US14c** (derivada): Como concurseiro, quero ver no Progresso há quantos dias seguidos bato a meta e quais dias bati, para enxergar a constância de longo prazo.
- **US14d** (derivada): Como concurseiro com celular e computador, quero configurar o horário uma vez e escolher em quais aparelhos recebo a notificação.
- **US14e** (borda): Como usuário sem conta, quero usar a meta normalmente e, no lugar da notificação, colocar um lembrete diário na minha agenda.
- **US14f** (borda): Como usuário de iPhone, quero entender por que a notificação não está disponível no navegador e o que fazer (instalar o app na tela de início ou usar a agenda).
- **US14g** (borda): Como usuário que negou a permissão de notificação, quero saber que o lembrete não vai chegar e como resolver, em vez de achar que ele está funcionando.

## Principais funcionalidades

RF55–RF59 estão descritos por inteiro no documento-mãe. Abaixo, o que esta entrega detalha.

| Funcionalidade | Requisitos | Observação |
| --- | --- | --- |
| F13. Meta diária | RF55, RF56 | Configuração em Ajustes, progresso e comemoração na Home, sequência e marcas no Progresso. |
| F13. Lembrete | RF57–RF59 | Horário na conta, inscrição por aparelho, notificação condicionada à meta, `.ics` como alternativa. |
| F9. Ajustes | **seção nova** | “Meta e lembrete”, entre as seções existentes de estudo e a de conta. |
| F4. Início | RF19 | O progresso da meta entra abaixo do número de hoje, sem competir com “Estudar”. |
| F7. Progresso | RF34 | Novo indicador “Dias seguidos com meta” e marca no heatmap. |

Requisitos próprios desta entrega, derivados de RF55–RF59:

**Meta diária (RF55)**

- **RF55a**: Ajustes → Meta e lembrete tem o controle “Meta diária”, **desligado por padrão**. Ligado, mostra o número de revisões por dia, com valor inicial 40, aceitando inteiros de 10 a 500. Valor fora da faixa não é salvo e mostra a faixa permitida.
- **RF55b**: Conta para a meta **toda resposta na revisão normal** (“Errei” ou “Acertei”) feita no dia, em qualquer baralho, inclusive o mesmo cartão respondido de novo em reaprendizado e sessões com “Estudar só…”. Respostas no **reforço não contam** (RF53).
- **RF55c**: O “dia” é o dia do calendário no fuso do aparelho, de 00:00 a 23:59. Na virada da meia-noite, com o app aberto, o progresso volta a zero sozinho, sem recarregar.
- **RF55d**: Com conta, a meta (ligada/desligada e valor) sincroniza entre aparelhos pela regra de última escrita, como as demais configurações. Sem conta, vale só no aparelho. Mudar a meta não gera revisão nem altera agendamento.
- **RF55e**: Mudar o valor da meta vale imediatamente para hoje e para a avaliação dos dias passados: o app não guarda histórico de metas, e os dias anteriores são julgados contra a meta atual (premissa registrada; ver Fora do escopo).

**Progresso da meta na Home (RF56)**

- **RF56a**: Com meta ligada e baralho ativo, a Home mostra “28 / 40 hoje” com uma barra de progresso, abaixo do número de cartões de hoje. O número soma todos os baralhos (não só o ativo) e o rótulo deixa isso claro (“Meta diária · todos os baralhos”).
- **RF56b**: O progresso se atualiza sozinho depois de cada resposta e quando uma sincronização traz revisões feitas hoje em outro aparelho, sem recarregar.
- **RF56c**: Ao atingir a meta, a Home passa a mostrar “Meta de hoje batida · 42 / 40”, com a cor de acerto e texto (não só cor). Respostas além da meta continuam contando.
- **RF56d**: **Comemoração breve**: quando a resposta que atinge a meta acontece numa sessão de revisão, a sessão mostra uma mensagem destacada (“Meta de hoje batida!”) por poucos segundos, sem interromper a sessão nem exigir toque, e o fim da sessão repete a informação. A comemoração aparece **uma vez por dia**, mesmo que a meta mude depois. Com `prefers-reduced-motion`, a mensagem aparece sem animação. Ela é anunciada por `aria-live`.
- **RF56e**: Com meta desligada, nada disso aparece na Home, nem na sessão; a Home mostra um atalho discreto “Definir meta diária”, que leva a Ajustes → Meta e lembrete, só enquanto a meta nunca tiver sido ligada no aparelho ou na conta.

**Meta no Progresso (RF56)**

- **RF56f**: Com meta ligada, o Progresso mostra “Dias seguidos com meta”, contado até hoje: hoje entra quando a meta for batida; enquanto hoje não for batido, a sequência mostra o valor até ontem, sem zerar. Um dia sem a meta batida zera a sequência (sem tolerância). Também mostra “Melhor sequência com meta”.
- **RF56g**: No heatmap (Progresso e Home), os dias com meta batida recebem uma marca própria, distinguível da intensidade de revisões **sem depender só de cor** (ex.: contorno ou símbolo), explicada na legenda do heatmap e no texto acessível de cada dia (“12 de março: 45 revisões · meta batida”).
- **RF56h**: A sequência de dias de estudo existente (RF34) continua igual, ao lado da nova. Com meta desligada, o Progresso não mostra os indicadores de meta nem as marcas.

**Lembrete por notificação (RF57)**

- **RF57a**: Ajustes → Meta e lembrete tem “Lembrete diário” com o horário (padrão 20:00, em intervalos de 15 minutos). O horário e o “lembrete ligado” pertencem à **conta** e sincronizam entre aparelhos; o fuso considerado é o do último aparelho que salvou a configuração, atualizado sozinho quando o aparelho muda de fuso e o usuário abre o app.
- **RF57b**: Cada aparelho tem a opção “Receber notificações neste aparelho”. Ativá-la pede a permissão do navegador **só nesse momento**, por ação do usuário, nunca ao abrir o app. O estado dessa opção vale só para o aparelho e não sincroniza.
- **RF57c**: A notificação é enviada, no máximo **uma vez por dia por conta**, a todos os aparelhos inscritos, entre o horário escolhido e 15 minutos depois, **somente se** naquele dia (no fuso da configuração) a meta ainda não foi batida — sem meta, somente se não houve nenhuma revisão. Se o envio atrasar, ele ainda pode sair até 59 minutos depois do horário; passado isso, o dia é pulado.
- **RF57d**: O critério usa as revisões **já sincronizadas**. Para reduzir lembrete indevido, o app sincroniza também quando é minimizado ou fechado (além dos momentos de RF37), e o texto da notificação é neutro: título “CertameCards”; corpo “Ainda faltam revisões para a meta de hoje.” com meta, ou “Que tal revisar hoje?” sem meta.
- **RF57e**: Tocar na notificação abre o app (ou a aba já aberta) na Home.
- **RF57f**: A seção mostra o estado do aparelho em texto, sempre que o usuário abre a tela: “Notificações ativas neste aparelho”, “Permissão negada pelo navegador — reative nas configurações do navegador”, “Este navegador não recebe notificações”, “No iPhone, instale o app na tela de início para receber notificações” ou “Entre na sua conta para receber notificações”. Os casos sem notificação oferecem o `.ics` (RF58).
- **RF57g**: Sem Supabase ou sem chave de notificação configurada no build (preview, local sem push), a opção de notificação fica indisponível com a mensagem “Notificações não estão disponíveis nesta versão”, sem erro; meta e `.ics` funcionam normalmente.

**Lembrete na agenda (RF58)**

- **RF58a**: “Adicionar lembrete à agenda” baixa um arquivo `.ics` com um evento diário recorrente, sem data de fim, no horário escolhido e no fuso do aparelho, com um alarme no início do evento, título “Revisar no CertameCards” e duração de 15 minutos.
- **RF58b**: A opção está sempre disponível na seção, mas aparece em destaque quando a notificação não é possível (sem conta, sem suporte, permissão negada, iPhone fora da tela de início) e funciona sem rede.
- **RF58c**: O evento da agenda não sabe da meta: ele lembra todo dia. A tela diz isso (“O lembrete da agenda aparece todos os dias, mesmo que você já tenha estudado”). Mudar o horário depois não altera eventos já importados; a tela orienta a baixar de novo e apagar o antigo na agenda.

**Desligar e inscrição por aparelho (RF59)**

- **RF59a**: Desligar “Lembrete diário” para o envio em **todos** os aparelhos da conta. Desativar “Receber notificações neste aparelho” para só naquele aparelho; os outros continuam recebendo.
- **RF59b**: Sair da conta remove a inscrição daquele aparelho; o aparelho não recebe lembrete de nenhuma conta até ser inscrito de novo. Entrar em outra conta nunca herda a inscrição da anterior (RF40).
- **RF59c**: Se o navegador revogar a permissão ou a inscrição expirar, o aparelho deixa de ser notificado sem erro para o usuário, e a seção passa a mostrar o estado real (RF57f) na próxima abertura, oferecendo reativar.
- **RF59d**: Ligar ou desligar o lembrete e mudar o horário exigem rede para valer no envio; sem rede, a mudança fica salva no aparelho e vale assim que sincronizar. Ativar a inscrição do aparelho exige rede; sem rede, a tela diz “Conecte-se para ativar as notificações neste aparelho” e não deixa a opção num estado ambíguo.

## Critérios de aceitação

Texto completo no documento-mãe:

| Critério | Requisitos | Resumo |
| --- | --- | --- |
| CA-30 | RF55, RF56 | Com meta 40 e 28 revisões hoje, a Home mostra “28 / 40 hoje”; na 40ª, indica meta batida e o dia é marcado no Progresso. |
| CA-31 | RF57, US14 | Lembrete às 20:00 e meta batida às 19:00: nenhuma notificação; dia sem meta batida: notificação entre 20:00 e 20:15. |
| CA-32 | RF58 | Sem conta, “Adicionar lembrete à agenda” baixa um `.ics` que cria um evento diário no horário escolhido. |

Critérios próprios desta entrega:

- **CA-M1** (RF55a, RF55d): Num aparelho novo, a meta está desligada. Quando o usuário a liga, o valor inicial é 40; ao digitar 5 ou 501, o valor não é salvo e a faixa 10–500 é mostrada.
- **CA-M2** (RF55b): Com meta 10, quando o usuário responde 6 cartões no baralho A, 3 no baralho B e responde “Errei” e depois “Acertei” no mesmo cartão em reaprendizado, então a Home mostra “11 / 10” e meta batida. Uma sessão de reforço inteira depois disso não muda o número.
- **CA-M3** (RF55c): Com o app aberto na Home às 23:59 mostrando “30 / 40 hoje”, então depois da meia-noite a Home mostra “0 / 40 hoje” sem recarregar.
- **CA-M4** (RF55d, RF56b): Com a mesma conta em dois aparelhos, quando o aparelho A muda a meta para 60 e responde 20 cartões, então depois da sincronização o aparelho B mostra “20 / 60 hoje”.
- **CA-M5** (RF56d): Com meta 10, quando o usuário dá a 10ª resposta do dia numa sessão, então a sessão mostra “Meta de hoje batida!” sem parar a sessão, e o fim da sessão repete a mensagem; ao fazer outra sessão no mesmo dia, a comemoração não reaparece.
- **CA-M6** (RF56e): Com meta desligada, a Home e a sessão não mostram progresso nem comemoração; o atalho “Definir meta diária” leva a Ajustes → Meta e lembrete.
- **CA-M7** (RF56f): Com meta 20 e 20+ revisões em cada um dos últimos 5 dias e 0 hoje às 10:00, então “Dias seguidos com meta” mostra 5; ao bater a meta hoje, mostra 6. Com um dia de 19 revisões no meio, a sequência conta só os dias depois dele.
- **CA-M8** (RF56g): No heatmap, um dia com meta batida e outro com o mesmo número de revisões mas sem meta (meta alterada depois) são distinguíveis em tons de cinza, e o leitor de tela anuncia “meta batida” só no primeiro.
- **CA-M9** (RF57b): Abrir o app e Ajustes não pede permissão de notificação; o pedido só aparece ao ativar “Receber notificações neste aparelho”.
- **CA-M10** (RF57c, CA-31): Com meta 40, lembrete às 20:00 e 39 revisões sincronizadas às 19:50, então chega uma notificação até 20:15; com 40, não chega nenhuma. Sem meta e uma revisão no dia, não chega nenhuma.
- **CA-M11** (RF57c): Com dois aparelhos inscritos na mesma conta, num dia sem meta batida, cada aparelho recebe exatamente uma notificação, e nenhuma outra no restante do dia.
- **CA-M12** (RF57d, RF57e): Quando o usuário responde a 40ª revisão offline às 19:00 e reconecta às 19:30 com o app minimizado, então nenhuma notificação chega às 20:00. Tocar numa notificação recebida abre a Home.
- **CA-M13** (RF57f, US14g): Com a permissão de notificação negada no navegador, a seção mostra “Permissão negada pelo navegador” com a orientação e o `.ics` em destaque; num iPhone pelo Safari, sem instalar, mostra a orientação de instalar na tela de início.
- **CA-M14** (RF57g): No preview da `des` (sem Supabase), a seção mostra a meta, “Notificações não estão disponíveis nesta versão” e o `.ics`, sem nenhuma mensagem de erro.
- **CA-M15** (RF58a, RF58c): O `.ics` baixado com horário 07:30, importado no Google Agenda e no calendário do iPhone, cria um evento diário às 07:30 no fuso do aparelho, de 15 minutos, com alarme, sem data de fim.
- **CA-M16** (RF59a): Com dois aparelhos inscritos, quando o aparelho A desativa “Receber notificações neste aparelho”, então só o B recebe o próximo lembrete; quando o B desliga “Lembrete diário” e sincroniza, nenhum recebe.
- **CA-M17** (RF59b): Quando o usuário sai da conta num aparelho inscrito e entra em outra conta, então o aparelho não recebe lembrete de nenhuma das duas até ser inscrito de novo.
- **CA-M18** (RF59d): Sem rede, quando o usuário muda o horário para 21:00, então a mudança fica salva e aparece ao reabrir a tela; depois de reconectar e sincronizar, o lembrete do dia segue as 21:00.
- **CA-M19** (offline, US14e): Com a rede desligada e sem conta, o usuário liga a meta, revisa, vê o progresso e a comemoração, vê a sequência no Progresso e baixa o `.ics`, sem nenhuma mensagem de erro.
- **CA-M20** (legibilidade): Em 360 px, a seção Meta e lembrete, o progresso da Home, a comemoração e os indicadores do Progresso não têm rolagem horizontal e nenhum texto fica abaixo da escala do produto.

## Experiência do usuário

Igual ao documento-mãe (perfil, identidade visual, escala tipográfica, acessibilidade). Fluxos desta entrega:

1. *Definir a meta*: Home → “Definir meta diária” → Ajustes → Meta e lembrete → liga “Meta diária” → 40 → volta à Home (“0 / 40 hoje”).
2. *Dia de estudo*: Home (“28 / 40 hoje”) → Estudar → na 40ª resposta, “Meta de hoje batida!” por alguns segundos → fim da sessão com a meta batida → Home (“Meta de hoje batida · 42 / 40”).
3. *Ligar o lembrete no celular*: Ajustes → Meta e lembrete → “Lembrete diário” ligado às 20:00 → “Receber notificações neste aparelho” → permissão do navegador → “Notificações ativas neste aparelho”.
4. *Sem conta ou sem notificação*: Ajustes → Meta e lembrete → mensagem do estado → “Adicionar lembrete à agenda” → abre o `.ics` no calendário.
5. *Constância*: Progresso → “Dias seguidos com meta: 12” → heatmap com os dias marcados.

UI e acessibilidade:

- A seção “Meta e lembrete” agrupa, nesta ordem: Meta diária (interruptor e número), Lembrete diário (interruptor e horário), Receber neste aparelho (interruptor e estado em texto) e Adicionar lembrete à agenda. Interruptores com rótulo acessível e estado anunciado; campos numérico e de horário com rótulo visível e faixa permitida no texto de apoio.
- O progresso da Home usa `text-meta` para o rótulo e `text-body` para os números; a barra tem `role="progressbar"` com valor e máximo. Não usa a cor de sinal, reservada a “Estudar”; ao bater a meta, usa a cor de acerto com texto.
- A comemoração é texto (`text-body`), não bloqueia teclado nem toque, não move o cartão de lugar e some sozinha; respeita `prefers-reduced-motion`.
- As mensagens de estado da notificação são texto em `text-meta`, nunca só ícone; a de permissão negada não usa a cor de erro, porque não é falha do app.
- A marca de meta batida no heatmap funciona em tons de cinza e tem legenda.
- Área de toque ≥ 44 px em todos os controles novos; tudo navegável por teclado.

**Offline e sem conta**: a meta, o progresso da Home, a comemoração, a sequência e as marcas do Progresso leem só o histórico local e funcionam iguais sem rede, sem conta e sem Supabase configurado no build. Sem conta, a meta vale só no aparelho. O lembrete por notificação é a única parte que exige conta e rede; sem elas, a seção diz por que não está disponível e oferece o `.ics`, que é gerado no aparelho e funciona offline. Com conta, as mudanças de configuração feitas offline ficam no aparelho e sobem na próxima sincronização; até lá, o servidor usa a configuração anterior. Revisões feitas offline só contam para o critério do lembrete depois de sincronizadas, o que pode gerar um lembrete indevido; o texto neutro da notificação e a sincronização ao minimizar reduzem esse efeito.

## Restrições técnicas de alto nível

- As do documento-mãe, em especial: offline-first, escala tipográfica checada no CI, cores sempre por token e isolamento entre desenvolvimento e produção.
- **Schema já desenhado**: as configurações do usuário (meta, lembrete ligado, horário, fuso) já existem na migration do MVP e sincronizam pela RPC atual. As inscrições por aparelho, o registro de envio por dia e o critério de quem recebe estão na migration da Fase 2 (`20261017000000_images_reminders.sql`). Mudanças nesses limites (meta 10–500, horário 0–1439) exigem migration nova.
- **Notificação decidida no servidor**: o envio é feito por uma função agendada do Supabase a cada 15 minutos, por Web Push com chaves VAPID; só a chave pública vai no bundle. A chave privada e o token da função ficam nos segredos do Supabase, nunca no repositório nem na Vercel. O agendamento é aplicado à mão em cada ambiente; em produção, só com pedido explícito do Rafael.
- **Plataformas**: notificação no Chrome/Edge/Firefox de desktop e Android; no iPhone, apenas com o app instalado na tela de início (iOS 16.4+). O `.ics` precisa abrir no Google Agenda e no calendário do iPhone.
- **Privacidade**: o servidor guarda apenas o endereço de inscrição de cada aparelho e a data do último envio; a notificação não contém conteúdo de cartão nem número de revisões. Sair da conta apaga a inscrição do aparelho.
- **Desempenho**: progresso da Home em < 150 ms após uma resposta; Progresso com 50.000 revisões em < 500 ms; nada desta entrega atrasa a resposta a um cartão.
- Os parâmetros do produto (faixa 10–500, meta inicial 40, horário padrão 20:00, intervalo de 15 minutos, janela de envio até 59 minutos, um envio por dia) são constantes, iguais em todos os aparelhos.

## Fora do escopo

- Tudo o que o documento-mãe exclui, em especial lembrete por notificação sem conta e lembretes múltiplos por dia.
- Meta por baralho, por etiqueta ou em minutos de estudo; meta de cartões novos.
- Histórico de metas: mudar a meta reavalia os dias passados contra a meta nova.
- Tolerância na sequência (dia de folga, “congelar” a sequência) e conquistas, medalhas ou outra gamificação além da comemoração breve.
- Lembrete com conteúdo personalizado (número de vencidos, nome do baralho) e ações na notificação (“Adiar”, “Estudar agora” como botões).
- Horário diferente por aparelho ou por dia da semana; silenciar fins de semana.
- Lembrete por e-mail, SMS ou outro canal.
- Notificação local agendada pelo próprio aparelho, sem servidor.
- Atualizar automaticamente um evento `.ics` já importado na agenda.
- Qualquer efeito do reforço ([prd-dificeis-reforco](../prd-dificeis-reforco/prd.md)) na meta, na sequência ou no lembrete.
