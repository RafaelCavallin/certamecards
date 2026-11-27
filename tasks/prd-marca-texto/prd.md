# Documento de Requisitos do Produto (PRD) — Marca-texto

> Entrega da Fase 2 (F19). Documento-mãe: [tasks/produto/prd.md](../produto/prd.md). A visão, a identidade visual, as restrições e o que fica fora do escopo valem aqui sem ser repetidos. Os IDs (US20–US24, RF84–RF99, CA-47 e CA-48) são os do documento-mãe, mantidos para rastreabilidade; este documento detalha os requisitos. Os critérios próprios desta entrega usam o prefixo `CA-M`. Altera o **RF12** (visual da lacuna revelada) e o **RF61** (importação do Anki). Depende de [prd-tema-claro](../prd-tema-claro/prd.md), [prd-importacao-anki](../prd-importacao-anki/prd.md) e [prd-backup](../prd-backup/prd.md), todas concluídas.

## Visão geral

Quem estuda lei seca no papel usa marca-texto de cores diferentes para separar o que é regra, o que é exceção e o que é prazo ou pegadinha. No CertameCards existe uma única marca visual, o **destaque** (negrito âmbar na revisão). Com ela, o concurseiro diz que um trecho é importante, mas não consegue dizer de que tipo ele é. Cartões longos, com vários destaques, viram um bloco uniforme de texto âmbar.

Esta entrega acrescenta o **marca-texto** em três cores (amarelo, verde e rosa), disponível na Frente, no Verso e nas Notas. O usuário seleciona um trecho e toca na cor. O trecho ganha um fundo colorido no formulário e em todas as telas que mostram o cartão. As cores não têm significado fixo: cada usuário decide o que elas querem dizer para ele. Para o amarelo não se confundir com a lacuna, a lacuna revelada passa a ser uma moldura âmbar sem preenchimento. O marca-texto é local e funciona sem rede e sem conta. Com conta, ele sincroniza junto com o cartão. Ele entra no backup e na importação do Anki, onde os fundos coloridos viram marca-texto.

## Objetivos

- Entrega em até 3 dias de trabalho.
- **Rapidez**: aplicar um marca-texto leva **1 toque** depois de selecionar o trecho. Trocar a cor de um marca-texto existente leva 1 toque, sem refazer a seleção.
- **Contraste**: o texto sobre cada uma das três cores atinge ≥ 4,5:1 nos dois temas. A moldura da lacuna atinge ≥ 3:1 sobre o fundo em que aparece, nos dois temas.
- **Distinção**: as três cores se distinguem entre si e do fundo do cartão nos dois temas, inclusive em simulação de protanopia e de deuteranopia.
- **Sem perda**: 0 marca-texto perdido ao editar o texto ao redor, ao sincronizar entre dois aparelhos nesta versão, ao fazer backup e restaurar, e ao ser visto por versões futuras que não conheçam algum tipo de marca.
- **Sem regressão**: cartões existentes aparecem iguais aos de antes em todas as telas. A única diferença é a lacuna (no formulário e revelada), que passa a ser moldura.
- **Desempenho mantido**: responder um cartão e ver o próximo continua ≤ 150 ms, e a lista continua fluida com 5.000 cartões, também com marca-texto em todos eles.

## Histórias de usuário

- **US20**: Como concurseiro, quero pintar trechos do cartão de amarelo, verde ou rosa para separar visualmente tipos de informação (regra, exceção, prazo), como faço no papel.
- **US21**: Como concurseiro, quero trocar a cor de um marca-texto ou tirá-lo sem refazer a seleção, para corrigir uma marcação rapidamente.
- **US22**: Como concurseiro que já usa marca-texto colorido no Anki, quero que esses trechos venham como marca-texto na importação, para não remarcar tudo.
- **US23** (borda): Como concurseiro que estuda no celular sem rede e sem conta, quero marcar e ver o marca-texto exatamente como com rede. Com conta, quero ver a mesma marcação no outro aparelho.
- **US24** (borda): Como concurseiro com daltonismo ou que usa leitor de tela, quero saber qual cor estou aplicando e perceber na revisão que um trecho está marcado.

## Principais funcionalidades

### F19.1 Marcar com marca-texto no formulário

Funciona como o destaque e a lacuna: o usuário seleciona o trecho e escolhe a ação na barra abaixo do campo. O formulário de novo cartão, o de edição e o diálogo de edição durante o estudo se comportam do mesmo jeito.

- **RF84**: Na Frente, no Verso e nas Notas, selecionar um trecho mostra na barra **três botões de cor** (amarelo, verde e rosa), além de “Destacar seleção” (e de “Ocultar seleção”, só na Frente). Um toque numa cor aplica o marca-texto ao trecho.
- **RF85**: O marca-texto segue as regras das demais marcas: a seleção é aparada nos espaços das pontas, um trecho tem **uma marca só** (lacuna, destaque ou marca-texto, nunca duas) (RF8), e ao editar o texto a marca se reposiciona ou é descartada se a edição a atravessar (RF9).
- **RF86**: Com o cursor dentro de um marca-texto, a barra mostra as **outras duas cores** e “Tirar marca-texto”. Tocar numa cor troca a cor do mesmo trecho. “Tirar marca-texto” remove só aquela marca.
- **RF87**: Sem seleção, a linha de resumo conta também os marca-textos (ex.: “1 lacuna, 2 destaques e 3 marca-textos · toque na marca para desfazer”). A dica sem marcas cita a nova ação (ex.: “Selecione um trecho para ocultar, destacar ou marcar”). Em telas com 640 px ou mais, a altura do formulário não muda (RF10); em telas mais estreitas, as ações quebram linha ao selecionar e a barra pode crescer até 3 linhas.
- **RF88**: Enquanto o usuário edita, o marca-texto aparece como fundo na cor escolhida, sem deslocar o texto, o cursor nem a seleção.

### F19.2 Exibir o marca-texto

- **RF89**: O marca-texto aparece **sempre** como fundo colorido, com o texto em peso normal e na cor principal do texto (inclusive nas Notas, cujo texto fora do marca-texto é acinzentado): na revisão (inclusive na Frente antes de “Mostrar resposta”), na sessão de reforço e no seu resumo, na lista de cartões, na lista de difíceis e na prévia da importação.
- **RF90**: O destaque não muda: continua sublinhado no formulário e negrito âmbar nas demais telas.
- **RF91**: No tema claro, as três cores têm versões próprias que mantêm a mesma leitura: amarelo, verde e rosa.

### F19.3 Novo visual da lacuna

- **RF92** (altera RF12): No formulário e na revisão depois de revelada, a lacuna aparece como **moldura âmbar sem preenchimento**, no lugar do fundo âmbar sutil de hoje. A lacuna fechada continua como `_____`.

### F19.4 Guardar, sincronizar e fazer backup

- **RF93**: O marca-texto é salvo com o cartão no aparelho, na hora, sem rede e sem conta. Com conta, sincroniza como as demais marcas (última escrita vence por cartão). Marcar, trocar a cor ou tirar um marca-texto não reagenda o cartão nem gera revisão (RF5).
- **RF94**: O backup inclui o marca-texto e a restauração o preserva. Backups gerados antes desta entrega continuam restauráveis e trazem os cartões sem marca-texto.
- **RF95**: A partir desta versão, um aparelho que receba por sincronização ou backup um tipo de marca que ele não conhece **preserva** essa marca ao salvar o cartão, mesmo sem conseguir exibi-la.

### F19.5 Importação do Anki

- **RF96** (amplia RF61): Na importação do Anki, um trecho com cor de fundo vira marca-texto da cor mais próxima entre amarelo, verde e rosa. Fundos sem cor (branco, preto, cinza, transparente) são ignorados. Um fundo colorido que não lembra nenhuma das três cores vira amarelo.
- **RF97**: Na importação, quando um trecho tem mais de uma marca no Anki, vale a ordem **lacuna > marca-texto > destaque**, para continuar valendo a regra de uma marca por trecho (RF85). Cartões já importados não são alterados.

### F19.6 Acessibilidade

- **RF98**: Cada botão de cor tem nome acessível com a ação e a cor (“Marcar em verde”, “Trocar para rosa”), é alcançável por teclado, tem foco visível e área de toque ≥ 44 px.
- **RF99**: Na revisão e nas demais telas do RF89, o trecho com marca-texto é exposto às tecnologias assistivas como texto marcado.

## Critérios de aceitação

Texto completo no documento-mãe:

| Critério | Requisitos | Resumo |
| --- | --- | --- |
| CA-47 | RF84, RF89 | Três cores aplicadas com um toque cada; na revisão, a Frente mostra o marca-texto antes de revelar. |
| CA-48 | RF91, RF92 | Contraste do texto sobre as cores e da moldura da lacuna nos dois temas; amarelo distinguível da lacuna. |

Critérios próprios desta entrega:

- **CA-M1** (RF84, US20): Dado um cartão novo com texto na Frente, no Verso e nas Notas, quando o usuário seleciona um trecho de cada campo e toca em amarelo, verde e rosa, respectivamente, então cada trecho aparece com fundo na cor tocada, e só um toque foi necessário depois de cada seleção.
- **CA-M2** (RF84): Ao selecionar um trecho da Frente, a barra mostra “Ocultar seleção”, “Destacar seleção” e as três cores. No Verso e nas Notas, mostra “Destacar seleção” e as três cores, sem “Ocultar seleção”.
- **CA-M3** (RF85): Dada a palavra “vedado” com marca-texto verde, quando o usuário seleciona um trecho que inclui “vedado”, então a barra mostra as ações daquele marca-texto, e não há como aplicar uma segunda marca sobre ele.
- **CA-M4** (RF85, RF88): Dado “prazo de quinze dias” com marca-texto rosa em “quinze”, quando o usuário digita no início do campo, então o rosa continua cobrindo “quinze”, sem desalinhar do texto. Quando apaga “quinze”, o marca-texto desaparece.
- **CA-M5** (RF86, US21): Com o cursor dentro de um marca-texto amarelo, então a barra mostra verde, rosa e “Tirar marca-texto”. Tocar em verde deixa o mesmo trecho verde. “Tirar marca-texto” remove só aquela marca, sem mexer nas outras.
- **CA-M6** (RF87): Dado um campo com 1 lacuna, 2 destaques e 3 marca-textos e sem seleção, então a linha de resumo mostra “1 lacuna, 2 destaques e 3 marca-textos · toque na marca para desfazer”, e, em telas com 640 px ou mais, a altura da barra é a mesma de quando há seleção. Em telas mais estreitas, a barra sem seleção continua com uma linha e, ao selecionar, as ações quebram linha.
- **CA-M7** (RF89): Dado um cartão com marca-texto na Frente, no Verso e nas Notas, quando ele é revisado, então o marca-texto da Frente aparece antes de “Mostrar resposta”, e os do Verso e das Notas aparecem depois de revelar. O texto marcado tem o mesmo peso do texto ao redor e usa a cor principal do texto, também nas Notas.
- **CA-M8** (RF89): O mesmo cartão aparece com os três marca-textos na lista de cartões, na lista de difíceis, na sessão de reforço e no seu resumo.
- **CA-M9** (RF92, sem regressão): Dado um cartão criado antes desta entrega, com um destaque e uma lacuna na Frente, então o destaque aparece como antes. A lacuna aparece como `_____` até revelar e, depois, com moldura âmbar sem fundo. No formulário, a lacuna também aparece só com a moldura.
- **CA-M10** (RF91, contraste): Nos dois temas, o texto sobre cada uma das três cores atinge ≥ 4,5:1, a moldura da lacuna atinge ≥ 3:1 sobre o fundo, e um trecho amarelo se distingue de uma lacuna revelada no mesmo cartão.
- **CA-M11** (distinção): Nos dois temas, um cartão com trechos amarelo, verde e rosa lado a lado permite distinguir as três cores entre si e do fundo, também em simulação de protanopia e de deuteranopia (registrado nas evidências do QA).
- **CA-M12** (RF93, US23, offline): Com a rede desligada e sem conta, marcar, trocar a cor e tirar um marca-texto funcionam, e a marcação continua lá depois de recarregar. A data da próxima revisão do cartão não muda.
- **CA-M13** (RF93, US23): Com a mesma conta em dois aparelhos, quando o aparelho A marca um trecho de verde e sincroniza, então o aparelho B, depois de sincronizar, mostra o mesmo trecho em verde.
- **CA-M14** (RF94): Dado um baralho com marca-texto nas três cores, quando o usuário faz backup, apaga os dados e restaura, então todos os marca-textos voltam nas mesmas posições e cores. Um backup feito antes desta entrega continua restaurando sem erro.
- **CA-M15** (RF95): Dado um cartão que chega com um tipo de marca desconhecido além das marcas conhecidas, quando o usuário edita o texto e salva, então a marca desconhecida continua no cartão e volta intacta na próxima sincronização ou no próximo backup.
- **CA-M16** (RF96, RF97, US22): Dado um `.apkg` com trechos de fundo amarelado, esverdeado, rosado, azul, branco e transparente, e um trecho em negrito com fundo verde, então a prévia e os cartões importados mostram amarelo, verde, rosa, amarelo (o azul), nenhuma marca, nenhuma marca, e o trecho em negrito com fundo verde fica só com marca-texto verde. Uma lacuna com fundo colorido continua sendo lacuna.
- **CA-M17** (RF98, US24): Navegando só pelo teclado, o usuário seleciona um trecho, chega aos três botões de cor com Tab e aplica uma cor. O leitor de tela anuncia cada botão com a ação e a cor, e cada botão tem área de toque ≥ 44 px.
- **CA-M18** (RF99): Na revisão, um leitor de tela indica que o trecho com marca-texto está marcado.
- **CA-M19** (desempenho): Com 5.000 cartões, cada um com marca-texto, a lista de cartões continua fluida e responder um cartão na revisão continua ≤ 150 ms.

## Experiência do usuário

Igual ao documento-mãe (perfil, identidade visual, escala tipográfica, acessibilidade). Fluxos desta entrega:

1. *Marcar*: no formulário, seleciona “salvo nos casos previstos em lei” → toca em rosa → o trecho fica rosa e o cursor vai para o fim dele.
2. *Trocar ou tirar*: toca dentro de um trecho rosa → a barra mostra amarelo, verde e “Tirar marca-texto” → toca em verde.
3. *Estudar*: na revisão, a Frente já mostra os marca-textos; ao revelar, Verso e Notas aparecem com os seus.
4. *Migrar do Anki*: importa um `.apkg` com fundos coloridos → a prévia já mostra o marca-texto → importa.

UI e acessibilidade:

- A barra continua mostrando só o que há para fazer: com seleção, as ações de marcar; com o cursor numa marca, as ações daquela marca; sem nenhum dos dois, a linha de resumo.
- Os botões de cor são círculos na cor do marca-texto, sem texto visível, com nome acessível (RF98). Eles ficam na mesma linha das outras ações e quebram linha em telas estreitas, sem mudar a altura reservada pela barra quando não há seleção.
- O marca-texto é um fundo atrás do texto: não muda o tamanho da letra, o peso, a entrelinha nem a quebra de linha.
- A cor não é a única informação na tela de edição: o botão e o resumo dizem o que está sendo feito. Na revisão, a cor é só o significado que o próprio usuário deu a ela.
- Nenhum texto novo abaixo da escala tipográfica do produto. `prefers-reduced-motion` continua respeitado.

**Offline e sem conta**: o marca-texto é parte do cartão. Marcar, exibir, fazer backup e importar funcionam igual com ou sem rede, com ou sem conta e com ou sem Supabase configurado no build. Com conta e sem rede, a marcação fica no aparelho e sobe na próxima sincronização, como qualquer edição. Não há nada a degradar.

## Restrições técnicas de alto nível

- As do documento-mãe, em especial: cores sempre por token (nunca hex em template), escala tipográfica checada no CI, contraste AA nos dois temas.
- O campo de edição continua sendo texto puro com as marcas desenhadas por trás. Nenhuma marca pode alterar a métrica do texto no formulário.
- Toda cor nova tem valor nos dois temas e teste de contraste automatizado.
- Sem mudança de schema nem de RPC de sincronização.
- **Risco aceito**: um aparelho que ainda esteja com a versão anterior a esta entrega descarta o marca-texto ao salvar um cartão, e a sincronização pode levar essa perda aos outros aparelhos. A mitigação é o aviso de nova versão que já existe. O RF95 impede que o problema se repita com tipos de marca futuros.
- Desempenho do documento-mãe mantido: resposta a um cartão ≤ 150 ms e lista fluida com 5.000 cartões.

## Fora do escopo

- Tudo o que o documento-mãe exclui, em especial o editor rico.
- Negrito, itálico, tachado ou outras formatações como marcas próprias.
- Duas marcas no mesmo trecho (ex.: marca-texto e destaque juntos, ou marca-texto dentro de uma lacuna).
- Mais de três cores, cores personalizáveis e rótulos de significado por cor (“Regra”, “Exceção”).
- Buscar, filtrar ou ordenar cartões por cor de marca-texto. Estatísticas por cor.
- Converter destaques existentes em marca-texto, ou reprocessar cartões já importados do Anki.
- Exportar para o Anki.
- Proteger contra a versão anterior já instalada nos aparelhos (risco aceito nas restrições).
- Atalhos de teclado para aplicar as cores.
