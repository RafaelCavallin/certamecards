# Documento de Requisitos do Produto (PRD) — Proteção dos dados locais

> Entrega da Fase 2 (F18). Documento-mãe: [tasks/produto/prd.md](../produto/prd.md). A visão, a identidade visual, as restrições e o que fica fora do escopo valem aqui sem ser repetidos. Os IDs (US, RF, CA) são os do documento-mãe, mantidos para rastreabilidade; os critérios próprios desta entrega usam o prefixo `CA-P`. Depende das entregas concluídas da Fase 1 ([prd-mvp-offline](../prd-mvp-offline/prd.md), [prd-conta-sync](../prd-conta-sync/prd.md)), da [importação do Anki](../prd-importacao-anki/prd.md) e do [backup](../prd-backup/prd.md), para onde os avisos apontam.

## Visão geral

Em 2026-10-18, em produção, um usuário sem conta importou um baralho do Anki, estudou e editou cartões no Chrome de um notebook com o disco a 97%. O navegador tinha negado o armazenamento persistente ao app e, quando o espaço livre caiu abaixo do seu limite, apagou de uma vez todos os dados “best-effort” do site: banco local, cache e service worker. O app não percebeu nada. O modal de edição ficou preso em “Carregando…”, sem botão de fechar, e a página pareceu travada. As respostas continuaram sendo gravadas num banco novo e vazio. Depois de recarregar, só havia “Meus cartões” vazio, sem nenhuma explicação.

Esta entrega faz o app **perceber, explicar e prevenir** essa perda. Quando o navegador fecha o acesso aos dados com o app aberto, um aviso bloqueante pede para recarregar. No carregamento seguinte a uma perda, um aviso diz o que aconteceu, como recuperar e como evitar. A edição e a revisão deixam de falhar em silêncio. E o app pede armazenamento persistente em mais momentos, mostrando em Ajustes → Armazenamento se os dados estão protegidos. Tudo funciona sem conta e sem rede; a conta só acrescenta o caminho de recuperação pela sincronização.

## Objetivos

- **Nenhuma falha silenciosa**: em 100% dos casos em que o navegador fecha o acesso ao banco com o app aberto, aparece o aviso bloqueante em até 1 s, e nenhuma revisão nem edição é gravada depois disso (CA-44, verificado em E2E).
- **Nenhuma tela presa**: o modal e a página de edição saem do estado de carregamento em 100% dos casos (cartão encontrado, não encontrado ou erro de leitura) e o modal sempre pode ser fechado (verificado em E2E).
- **Perda explicada**: em 100% das perdas em que o localStorage sobrevive (despejo por falta de espaço, exclusão só do banco), o carregamento seguinte mostra o aviso explicativo; em 0% dos primeiros usos e das limpezas totais feitas pelo usuário (CA-45).
- **Prevenção**: o pedido de armazenamento persistente é feito na abertura, ao fim de cada importação e por botão; o estado (protegido, não protegido, não suportado) é visível em Ajustes.
- **Sem custo para a revisão**: responder um cartão continua em < 150 ms; a checagem de perda na abertura não acrescenta espera perceptível.
- Entrega em até 3 dias de trabalho; cobertura ≥ 80% em `domain/` mantida.

## Histórias de usuário

- **US19**: Como concurseiro que usa o app só no navegador, quero que meus cartões não sumam sem aviso e, se o navegador apagá-los, quero saber o que houve e como recuperar.
- **US19a** (derivada): Como usuário no meio da revisão, quero ser avisado na hora se o app perder o acesso aos dados, em vez de continuar respondendo cartões que não serão salvos.
- **US19b** (derivada): Como usuário que abriu o app e encontrou tudo vazio, quero uma explicação clara (o navegador apagou os dados deste aparelho), o caminho de recuperação (entrar na conta, restaurar um backup ou reimportar) e como evitar que aconteça de novo.
- **US19c** (derivada): Como usuário editando um cartão, quero sempre conseguir fechar o modal e entender por que o cartão não abriu.
- **US19d** (derivada): Como usuário sem conta, quero saber se o navegador pode apagar meus dados e o que fazer para protegê-los.
- **US19e** (borda): Como usuário com conta, quero que o aviso de perda me diga que o que estava sincronizado volta ao entrar.
- **US19f** (borda): Como usuário que limpou os dados do site de propósito, não quero ser alarmado com um aviso de perda.
- **US19g** (borda): Como usuário com o app aberto em duas abas, quando uma versão nova do app atualiza o banco na outra aba, quero ser levado a recarregar, sem perder nada.

## Principais funcionalidades

RF79–RF83 estão descritos no documento-mãe. Abaixo, o que esta entrega detalha.

| Funcionalidade | Requisitos | Observação |
| --- | --- | --- |
| F18. Proteção dos dados locais | RF79–RF83 | Avisos de perda, falhas visíveis e armazenamento persistente. |
| F5. Sessão de revisão | RF30 | Editar e responder durante a revisão passam a falhar com mensagem. |
| F9. Ajustes | **entrada nova** | Seção “Armazenamento”. |
| F14. Importação do Anki | **resumo** | Pedido de persistência e recomendação de backup ao concluir. |

### Aviso de perda em uso (RF79)

- **RF79a**: Quando o navegador fecha o acesso ao banco local com o app aberto (dados apagados, limpeza, outra aba atualizando o banco), o app mostra um aviso modal: “O CertameCards perdeu o acesso aos dados deste navegador. Recarregue a página para continuar.” O único botão é “Recarregar”.
- **RF79b**: O aviso não pode ser dispensado com Esc nem clicando fora; o restante da página fica inerte enquanto ele estiver aberto.
- **RF79c**: Enquanto o aviso estiver aberto, nenhuma ação do usuário grava revisões, cartões ou configurações.

### Aviso de dados apagados (RF80)

- **RF80a**: Se o banco local foi criado de novo num navegador onde o app já tinha dados, o app mostra, ao abrir, um aviso: os dados guardados neste aparelho foram apagados pelo navegador, o que costuma acontecer quando falta espaço em disco ou quando o site não tem armazenamento protegido.
- **RF80b**: O aviso diz como recuperar: com conta, entrar (ou continuar conectado) traz de volta o que estava sincronizado; sem conta, restaurar um backup ou importar de novo. Traz links para Conta, Backup e Ajustes → Armazenamento.
- **RF80c**: O aviso tem “Entendi”; dispensado, não volta nos carregamentos seguintes, até uma nova perda.
- **RF80d**: O aviso não aparece no primeiro uso do app no navegador, nem quando o usuário apagou todos os dados do site (inclusive as preferências salvas no navegador), nem em instalações que existiam antes desta entrega e nunca perderam dados.
- **RF80e**: Se a perda acontece com o app aberto (RF79), depois do “Recarregar” o aviso de dados apagados aparece em seguida, quando o banco de fato foi apagado; se foi só uma atualização em outra aba, não aparece.

### Edição e revisão sem falha silenciosa (RF81)

- **RF81a**: O modal de edição na revisão mostra “Carregando…” só enquanto lê o cartão. Se o cartão não existe, mostra “Cartão não encontrado.”; se a leitura falha, “Não foi possível abrir o cartão.”.
- **RF81b**: Em qualquer um desses estados, o modal tem um botão “Fechar” e fecha com Esc.
- **RF81c**: A página de edição (`/cartoes/:id`) trata a falha de leitura com a mesma mensagem; o caso “não encontrado” já existe.
- **RF81d**: Responder um cartão que não existe mais mostra “Não foi possível registrar a resposta.” na sessão, não avança e não grava revisão.

### Armazenamento persistente (RF82, RF83)

- **RF82a**: O app pede armazenamento persistente ao abrir (como hoje), ao concluir uma importação do Anki e quando o usuário toca “Proteger meus dados” em Ajustes → Armazenamento.
- **RF82b**: Ajustes → Armazenamento mostra um de três estados:
  - **Protegido**: “O navegador não apaga estes dados sozinho.”
  - **Não protegido**: “O navegador pode apagar estes dados se faltar espaço no aparelho.” Com o botão “Proteger meus dados” e as orientações: instalar o app (ou adicioná-lo aos favoritos) ajuda o navegador a protegê-lo; com conta, os dados ficam salvos na nuvem; sem conta, faça backups.
  - **Não suportado**: “Este navegador não permite proteger os dados.” Com as mesmas orientações de conta e backup.
- **RF82c**: Tocar “Proteger meus dados” atualiza o estado exibido; se o navegador negar, a seção continua “Não protegido”, sem mensagem de erro.
- **RF83**: Ao concluir uma importação, sem conta e com o armazenamento não protegido, o resumo mostra uma linha: “Sem conta, estes cartões só existem neste navegador. Faça um backup.”, com link para Backup.

## Critérios de aceitação

- **CA-44** (RF79, US19a): Com a revisão aberta, quando o navegador apaga os dados do site, então aparece o aviso que só oferece “Recarregar” e nenhuma revisão é gravada depois disso.
- **CA-45** (RF80, US19b, US19f): Depois de uma perda, ao recarregar, o app explica que os dados deste aparelho foram apagados pelo navegador; ao tocar “Entendi” e recarregar de novo, o aviso não volta; num navegador que nunca abriu o app, ou depois de apagar todos os dados do site, o aviso não aparece.
- **CA-46** (RF82): Ajustes → Armazenamento mostra “Protegido” ou explica que o navegador pode apagar os dados se faltar espaço, com o botão para pedir proteção.
- **CA-P01** (RF79b): Com o aviso bloqueante aberto, Esc e clique fora não o fecham, e os botões da página não respondem.
- **CA-P02** (RF80d): Numa instalação existente antes desta entrega, com dados, ao abrir a versão nova pela primeira vez, nenhum aviso de perda aparece.
- **CA-P03** (RF80b, US19e): Com conta conectada, o aviso de dados apagados menciona que o que estava sincronizado volta pela conta.
- **CA-P04** (RF81a, RF81b, US19c): Na revisão, quando o cartão atual foi excluído por outro caminho e o usuário toca “Editar cartão”, então o modal mostra “Cartão não encontrado.” e fecha pelo botão “Fechar” e por Esc.
- **CA-P05** (RF81d): Quando o cartão atual não existe mais e o usuário responde, então a sessão mostra a mensagem de erro, não avança e o Progresso não ganha revisão.
- **CA-P06** (RF82c): Num navegador que nega a proteção, tocar “Proteger meus dados” mantém “Não protegido” sem mensagem de erro.
- **CA-P07** (RF83): Sem conta e sem proteção, o resumo da importação mostra a recomendação de backup com link; com conta, não mostra.
- **CA-P08** (US19g): Com o app aberto em duas abas, quando uma delas fecha o acesso ao banco para atualizá-lo, a outra mostra o aviso bloqueante; depois de recarregar, os dados continuam lá e o aviso de dados apagados não aparece.

## Experiência do usuário

**Perfis**: o concurseiro sem conta, que depende só do navegador, é o principal; o usuário com conta é secundário (a sincronização já o protege, mas ele também precisa entender o que houve).

**Fluxos**:
1. *Perda em uso*: Revisão → navegador apaga os dados → aviso bloqueante → “Recarregar” → aviso de dados apagados → “Entendi” → Home (vazia sem conta; recuperada com conta) → Backup ou Importar.
2. *Perda entre visitas*: abrir o app → aviso de dados apagados → links para Conta, Backup ou Ajustes → Armazenamento.
3. *Prevenção*: Ajustes → Armazenamento → “Proteger meus dados” → estado atualizado; ou Importar → resumo → “Faça um backup”.
4. *Edição sem saída*: Revisão → “Editar cartão” → mensagem de erro → “Fechar” → volta à revisão.

**UI e acessibilidade**:
- Os avisos usam `<dialog>` modal, com título, texto em `text-body`, links e botões com áreas de toque ≥ 44 px, foco inicial no botão principal e foco visível.
- O aviso bloqueante não tem botão de fechar nem atalho; o explicativo fecha só por “Entendi” ou pelos links.
- As mensagens de erro da edição e da revisão são anunciadas (`role="alert"` ou `aria-live`).
- Ajustes → Armazenamento segue o padrão das outras seções (rótulo mono, texto auxiliar `text-meta`, botão com borda `edge`).
- Cores só por token; nada abaixo da escala tipográfica; funciona nos dois temas e em 360 px.
- Tom dos textos: direto e sem culpa (“o navegador apagou”), sempre com o próximo passo.

**Sem conta e sem rede**: todos os avisos, mensagens e a seção Armazenamento funcionam offline e sem Supabase configurado. Sem conta, o caminho de recuperação é backup ou reimportação; com conta, a sincronização existente faz a recuperação.

## Restrições técnicas de alto nível

- **Navegadores**: a proteção depende da API de armazenamento persistente; o Chrome concede por heurística (engajamento, favorito, app instalado), sem perguntar; o Firefox pode perguntar ao usuário; o Safari pode não suportar. O app trata os três resultados (concedido, negado, não suportado) sem erro.
- **Detecção**: depende de o navegador manter as preferências do site (localStorage) quando apaga só o banco, como faz o despejo por falta de espaço no Chrome. Limpezas totais não deixam rastro e não são detectadas, por definição.
- **Sem mudança de schema**: nenhuma tabela nova no banco local, nenhuma migration no Supabase e nenhuma mudança na sincronização.
- **Desempenho**: a checagem de perda roda na abertura sem bloquear a primeira pintura; a resposta a um cartão continua ≤ 150 ms.
- **Privacidade**: nada novo sai do aparelho; os marcadores de perda guardam só datas.

## Fora do escopo

- Recuperar dados perdidos sem conta e sem backup.
- Detectar limpezas totais dos dados do site (feitas pelo usuário, por extensões ou pelo ITP do Safari).
- Medir o espaço livre em disco ou avisar sobre disco cheio.
- Backup automático periódico ou sincronização obrigatória.
- Mudanças no schema do Dexie, nas tabelas do Supabase ou na sincronização.
- Pedir ao usuário que instale o app por um botão próprio (as orientações citam a instalação; o fluxo de instalação continua o do navegador).
