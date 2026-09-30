# Documento de Requisitos do Produto (PRD) — Tema claro

> Entrega da Fase 2 (F16). Documento-mãe: [tasks/produto/prd.md](../produto/prd.md): visão, identidade visual, restrições e fora do escopo valem aqui sem repetição. Os IDs (US, RF, CA) são os do documento-mãe, preservados para rastreabilidade; os critérios próprios desta entrega usam o prefixo `CA-T`. Depende da Fase 1 ([prd-mvp-offline](../prd-mvp-offline/prd.md) e [prd-conta-sync](../prd-conta-sync/prd.md)) concluída.

## Visão geral

Hoje o CertameCards só tem o tema escuro herdado do Lingo. Para quem estuda de dia, em ambiente claro ou com o celular no brilho automático, texto claro sobre fundo escuro cansa mais e reflete o ambiente na tela. Esta entrega acrescenta um tema **claro** e a opção **Seguir o sistema**, escolhidos em Ajustes → Aparência. O escuro continua sendo o padrão.

O tema claro é a mesma interface com outra paleta: mesma hierarquia visual, mesmas fontes, mesma escala tipográfica, mesmos componentes. A escolha é do aparelho, funciona sem rede e sem conta e não passa pela sincronização.

## Objetivos

- Entrega em até 2 dias de trabalho, conforme o sequenciamento da TechSpec-mãe.
- **Contraste**: 100% dos textos com contraste ≥ 4,5:1 sobre o fundo em que aparecem, nos dois temas; anel de foco, bordas de campos e botões com ≥ 3:1.
- **Sem piscar**: com o tema claro escolhido, nenhum quadro com fundo escuro ao abrir ou recarregar o app.
- **Sem regressão no escuro**: o tema escuro fica idêntico ao da Fase 1 em todas as telas.
- **Cobertura total das telas**: as 9 rotas (Início, Revisão, Cartões, Novo cartão, Editar cartão, Progresso, Ajustes, Conta, Sem baralho), o seletor de baralhos, o menu ☰ e os diálogos legíveis no tema claro, sem nenhum elemento “esquecido” no escuro.

## Histórias de usuário

- **US17**: Como concurseiro que estuda à noite, quero poder escolher entre tema escuro e claro.
- **US17a** (derivada): Como concurseiro que estuda de dia e à noite, quero que o app siga o tema do sistema e troque sozinho quando o celular muda de modo.
- **US17b** (borda): Como usuário em navegação privada ou com o armazenamento bloqueado, quero que o app abra normalmente no tema escuro, mesmo sem conseguir lembrar a minha escolha.

## Principais funcionalidades

Os requisitos RF70–RF72 estão descritos por inteiro no documento-mãe; abaixo, o que esta entrega detalha.

| Funcionalidade | Requisitos | Observação |
| --- | --- | --- |
| F16. Tema claro | RF70–RF72 | Escuro (padrão), Claro ou Seguir o sistema, por aparelho. |
| F9. Ajustes | RF42, **nova seção** | Ajustes ganha a seção “Aparência”. |

Requisitos próprios desta entrega, derivados de RF70–RF72:

- **RF70a**: Ajustes → Aparência mostra as três opções como escolha única, com a atual marcada. A troca vale na hora, sem salvar nem recarregar. É o único lugar em que o tema é trocado: não há atalho no cabeçalho nem no menu ☰.
- **RF70b**: A escolha é guardada no aparelho e não sincroniza: entrar numa conta, sair dela ou sincronizar não muda o tema. Dois aparelhos da mesma conta podem ter temas diferentes.
- **RF70c**: Se o aparelho não conseguir guardar a escolha (navegação privada, armazenamento bloqueado), o app abre no tema **Escuro** sem mensagem de erro. A escolha feita vale até a página fechar.
- **RF70d**: Com **Seguir o sistema**, o app acompanha na hora a mudança de modo do sistema operacional, sem recarregar e sem interromper o que o usuário está fazendo (uma revisão em andamento continua no mesmo cartão, com a resposta revelada ou não).
- **RF71a**: A cor da barra do navegador (e da barra de status do app instalado, onde o sistema permitir) acompanha o tema em uso, inclusive nas trocas feitas em Ajustes e pelo sistema.
- **RF72a**: Destaques, lacunas (fechada e revelada), botões “Errei” e “Acertei”, estados de erro e de sucesso, o heatmap e o gráfico de previsão mantêm no tema claro o mesmo significado de cor do escuro: âmbar para sinal e destaque, verde para acerto, rosa para erro.
- **RF72b**: No tema claro, os níveis do heatmap continuam distinguíveis entre si e do fundo, e as barras do gráfico de previsão continuam visíveis sobre o fundo.
- **RF72c**: Diálogos (confirmação, edição durante a revisão) e o menu ☰ continuam separados visualmente do conteúdo por trás deles no tema claro.

## Critérios de aceitação

Texto completo no documento-mãe:

| Critério | Requisitos | Resumo |
| --- | --- | --- |
| CA-38 | RF70, RF71 | Com “Claro” escolhido, recarregar não mostra nenhum quadro com fundo escuro antes do conteúdo. |
| CA-39 | RF72 | No tema claro, todos os textos atingem contraste ≥ 4,5:1 sobre o fundo em que aparecem. |

Critérios próprios desta entrega:

- **CA-T1** (RF70, RF70a): Dado um aparelho que nunca escolheu tema, quando o usuário abre o app, então ele está no tema Escuro e Ajustes → Aparência mostra “Escuro” marcado.
- **CA-T2** (RF70a): Dado o tema Escuro, quando o usuário marca “Claro” em Ajustes → Aparência, então todas as cores trocam na hora, sem recarregar, e ao navegar para qualquer outra tela ela aparece no tema claro.
- **CA-T3** (RF70b): Dado um aparelho com tema “Claro” e conta conectada, quando o usuário sincroniza, sai da conta e entra de novo, então o tema continua “Claro”; num segundo aparelho da mesma conta, o tema continua o que estava lá.
- **CA-T4** (RF70c, US17b): Dado um navegador que bloqueia o armazenamento do site, quando o usuário abre o app, então ele abre no tema Escuro, sem erro visível nem erro no console; escolher “Claro” troca o tema até a página fechar.
- **CA-T5** (RF70d, US17a): Com “Seguir o sistema” marcado e o sistema no modo escuro, quando o sistema muda para o modo claro com o app aberto no meio de uma revisão, então o app fica claro em até 1 s, sem recarregar, e a revisão continua no mesmo cartão.
- **CA-T6** (RF70d): Com “Escuro” ou “Claro” marcado, quando o modo do sistema muda, então o tema do app não muda.
- **CA-T7** (RF71, RF71a): Em cada um dos três modos, a cor da barra do navegador corresponde ao fundo do tema em uso: ao abrir, depois de trocar em Ajustes e (em “Seguir o sistema”) depois de o sistema mudar.
- **CA-T8** (RF72, RF72a): No tema claro, na revisão de um cartão com um destaque e uma lacuna na Frente, o destaque aparece em negrito na cor de sinal legível, a lacuna aparece como `_____` e, depois de revelada, o trecho aparece com fundo sutil perceptível; os botões “Errei” e “Acertei” mantêm as cores de erro e acerto.
- **CA-T9** (RF72): No tema claro, o anel de foco (navegação por Tab), as bordas de campos de texto e as bordas de botões secundários atingem contraste ≥ 3:1 sobre o fundo em que aparecem.
- **CA-T10** (RF72b): No tema claro, com histórico de revisões em dias de intensidades diferentes, os níveis do heatmap (Início e Progresso) são distinguíveis entre si e o dia sem revisão é distinguível do fundo; as barras da previsão de 14 dias são visíveis.
- **CA-T11** (RF72c): No tema claro, com um diálogo de confirmação aberto, o diálogo se distingue claramente da tela por trás dele.
- **CA-T12** (sem regressão): No tema Escuro, todas as telas ficam iguais às da Fase 1.
- **CA-T13** (offline): Com a rede desligada e sem conta, trocar entre os três modos funciona e a escolha persiste depois de recarregar.

## Experiência do usuário

Igual ao documento-mãe (perfil, identidade visual, escala tipográfica, acessibilidade). Fluxos desta entrega:

1. *Trocar o tema*: Ajustes → Aparência → Escuro / Claro / Seguir o sistema → a tela troca na hora.
2. *Seguir o sistema*: com a opção marcada, o app acompanha sozinho o modo do celular ou do computador, inclusive com o app aberto.

UI e acessibilidade:

- A seção “Aparência” fica em Ajustes, no mesmo padrão visual das outras seções, e é navegável por teclado: as três opções são um grupo de escolha única, com rótulo acessível e foco visível.
- Áreas de toque de cada opção ≥ 44 px.
- Nenhum texto novo abaixo da escala tipográfica do produto.
- O tema claro não muda tamanhos, espaçamentos, fontes nem disposição: só cores.
- `prefers-reduced-motion` continua respeitado; a troca de tema não tem animação obrigatória.

**Offline e sem conta**: o tema é inteiramente local. Funciona igual com ou sem rede, com ou sem conta, e com ou sem Supabase configurado no build. Não há nada a degradar além do RF70c (armazenamento indisponível → Escuro).

## Restrições técnicas de alto nível

- As do documento-mãe, em especial: Tailwind com os tokens de cor do Lingo, cores sempre por token (nunca hex em template), texto sobre sinal pelo token próprio, escala tipográfica checada no CI.
- O tema claro troca só a paleta. A paleta de referência, com os contrastes calculados, está na TechSpec-mãe (“Paleta do tema claro”).
- Sem mudança de schema, de RPC ou de sincronização: a preferência não vai para o Supabase.
- A aplicação do tema não pode atrasar a primeira pintura de forma perceptível (meta de primeira carga ≤ 3 s em 4G mantida).
- O ícone e a tela de abertura do app instalado são definidos pelo manifesto, que é fixo: continuam escuros nos dois temas.

## Fora do escopo

- Tudo o que o documento-mãe exclui.
- Atalho de troca de tema no cabeçalho ou no menu ☰.
- Sincronizar a preferência de tema entre aparelhos.
- Temas além de escuro e claro (alto contraste, sépia, cores personalizáveis) e agendamento por horário.
- Mudar o manifesto, o ícone ou a tela de abertura do app instalado conforme o tema.
- Mudanças de tipografia, espaçamento ou disposição.
