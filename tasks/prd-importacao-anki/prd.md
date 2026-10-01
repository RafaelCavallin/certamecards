# Documento de Requisitos do Produto (PRD) — Importação do Anki

> Entrega da Fase 2 (F14). Documento-mãe: [tasks/produto/prd.md](../produto/prd.md). A visão, a identidade visual, as restrições e o que fica fora do escopo valem aqui sem ser repetidos. Os IDs (US, RF, CA) são os do documento-mãe, mantidos para rastreabilidade. Os critérios próprios desta entrega usam o prefixo `CA-A`. Depende da Fase 1 ([prd-mvp-offline](../prd-mvp-offline/prd.md) e [prd-conta-sync](../prd-conta-sync/prd.md)) e de [prd-etiquetas](../prd-etiquetas/prd.md), concluídas: as etiquetas das notas do Anki viram etiquetas do cartão, com as mesmas regras de grafia.

## Visão geral

Quase todo concurseiro que chega ao CertameCards já tem anos de cartões no Anki: lei seca em lacunas, súmulas, pegadinhas, pacotes comprados de cursinho. Redigitar isso é inviável, e sem um caminho de migração o app fica restrito a quem começa do zero. O Lingo já importa `.apkg`, mas só como texto corrido: ele perde parágrafos e negritos, ignora lacunas e etiquetas e não abre o formato novo do Anki. O pacote de TI do autor, exportado pelo Anki atual como `.colpkg` com `collection.anki21b`, nem abre por esse caminho.

Esta entrega traz a tela **Importar do Anki**. O usuário escolhe um `.apkg` ou `.colpkg`, filtra pelos baralhos de origem, confere o mapeamento de campos de cada tipo de nota para Frente, Verso e Notas, vê uma prévia fiel de como os cartões vão ficar e importa para um baralho existente ou novo, numa operação tudo-ou-nada com barra de progresso. Parágrafos são preservados, negrito e sublinhado viram **destaque**, cada número de lacuna (`c1`, `c2`…) vira um cartão com aquela lacuna oculta na Frente, e as etiquetas da nota vêm junto. Histórico e mídia ficam de fora: o agendamento recomeça no FSRS. Tudo acontece no aparelho, sem conta, e funciona sem rede depois que o leitor de arquivos foi baixado uma vez.

## Objetivos

- Entrega em até 3 dias de trabalho, conforme o sequenciamento da TechSpec-mãe.
- **Velocidade**: um baralho de 5.000 notas importado em < 30 s (meta da Fase 2 no documento-mãe) num celular intermediário; 10.000 notas em < 30 s num computador comum (RF65). O tempo vai da escolha do destino até o resumo final.
- **Compatibilidade**: 100% dos arquivos de teste abrem, nos três formatos de coleção do Anki (`anki2`, `anki21`, `anki21b`), em `.apkg` e `.colpkg`. Isso inclui os dois arquivos reais do autor: “Inglês (Curso).apkg”, com 1.952 notas, e “Pacote Regular Flashcards - TI.colpkg”, com 1.404 notas em 13 baralhos.
- **Fidelidade**: nos testes de conversão, 100% dos `<b>`, `<strong>` e `<u>` viram destaque, todo `<br>`, `<div>`, `<p>` e `<li>` vira quebra de linha, e toda nota de lacuna gera exatamente um cartão por número distinto (CA-33, CA-34).
- **Atomicidade**: zero cartões e zero baralhos remanescentes depois de uma importação que falha ou é cancelada no meio (CA-35), verificado em teste automatizado.
- **Sem duplicar**: reimportar o mesmo arquivo no mesmo baralho cria 0 cartões novos.
- **Uso (métrica de produto)**: o autor migra os seus baralhos ativos do Anki no primeiro mês e para de revisar no Anki. Observado pela queda de revisões no Anki e pelo heatmap do CertameCards, sem instrumentação nova.

## Histórias de usuário

- **US15**: Como concurseiro que já usa Anki, quero trazer meus baralhos (com lacunas, negritos e etiquetas) sem redigitar.
- **US15a** (derivada): Como concurseiro com uma coleção grande no Anki, quero importar só os baralhos de uma matéria (ex.: “Constitucional”) para o baralho certo no CertameCards, sem trazer o resto da coleção.
- **US15b** (derivada): Como concurseiro que comprou um pacote de cartões com tipos de nota próprios (“Pergunta / Resposta / Comentário / Fonte”), quero dizer qual campo vai para a Frente, qual para o Verso e qual para as Notas, para os cartões ficarem legíveis.
- **US15c** (derivada): Como concurseiro, quero ver antes de confirmar como os primeiros cartões vão ficar (lacunas, destaques, parágrafos), para não importar milhares de cartões errados.
- **US15d** (derivada): Como concurseiro que baixou uma versão atualizada de um pacote, quero reimportá-lo no mesmo baralho sem duplicar os cartões que eu já tinha.
- **US15e** (borda): Como usuário sem conta, quero importar só no aparelho. Como usuário com conta, quero que os cartões importados apareçam nos meus outros aparelhos depois da sincronização.
- **US15f** (borda): Como usuário cujo arquivo tem notas que não cabem no CertameCards (texto longo demais, só imagem, oclusão de imagem), quero saber quantas e por que ficaram de fora, em vez de descobrir depois que sumiram.
- **US15g** (borda): Como usuário novo, sem nenhum baralho, quero começar importando do Anki em vez de criar um baralho vazio.

## Principais funcionalidades

RF60–RF65 estão descritos por inteiro no documento-mãe. Abaixo, o que esta entrega detalha.

| Funcionalidade | Requisitos | Observação |
| --- | --- | --- |
| F14. Importação do Anki | RF60–RF65 | Tela com cinco passos: arquivo, origem, campos, destino e importação. |
| F9. Ajustes | **entrada nova** | “Importar do Anki” em Ajustes. |
| Sem baralho (RF17) | **entrada nova** | “Importar do Anki” na tela “Crie seu primeiro baralho”. |
| F11. Etiquetas | RF46, RF47 | Etiquetas importadas seguem a grafia, os limites e a equivalência já definidos. |

Requisitos próprios desta entrega, derivados de RF60–RF65:

**Arquivo (RF60)**

- **RF60a**: A tela aceita um arquivo `.apkg` (baralho exportado) ou `.colpkg` (coleção inteira), escolhido pelo seletor de arquivos ou arrastado para a área de soltar no desktop. A tela lê os três formatos de coleção do Anki: o antigo, o de 2.1 e o novo compactado (padrão do Anki atual). O usuário não precisa mudar nenhuma opção de exportação no Anki.
- **RF60b**: Enquanto lê, a tela mostra “Lendo o arquivo…” com indicador de progresso indeterminado. Arquivo que não é do Anki, está corrompido ou não tem nenhuma nota mostra uma mensagem clara (“Este arquivo não parece ser um baralho do Anki.”, “Nenhuma nota encontrada no arquivo.”) e volta à escolha de arquivo, sem nada gravado.
- **RF60p**: Ao abrir a tela, o leitor do Anki é preparado em segundo plano. Com rede, isso acontece sem aviso. Sem rede, ou se o download falhar no meio, o passo do arquivo mostra “Para importar pela primeira vez, conecte-se à internet. Depois disso, a importação funciona sem rede.” com o botão “Tentar de novo”, e a escolha de arquivo fica indisponível enquanto isso. Quando a conexão volta, a tela tenta de novo sozinha. O resto do app não é afetado.
- **RF60c**: Ao terminar a leitura, a tela mostra o resumo do arquivo: número de notas, de baralhos de origem e de tipos de nota.

**Baralhos de origem (RF60)**

- **RF60d**: Com mais de um baralho de origem, a tela lista os baralhos que têm notas, com o nome completo e a hierarquia do Anki (“Direito::Constitucional”) e o número de notas de cada um, todos marcados por padrão. O usuário desmarca o que não quer, e há “Marcar todos” e “Desmarcar todos”. Com um só baralho, o passo é pulado.
- **RF60e**: A contagem de notas selecionadas e a de cartões que serão criados (que conta um por número de lacuna) se atualizam a cada marcação. Sem nenhum baralho marcado, não é possível avançar.

**Campos (RF60, RF62)**

- **RF60f**: O mapeamento é feito **por tipo de nota**, só para os tipos presentes nas notas selecionadas. Cada tipo mostra o nome, o número de notas e três seletores: Frente (obrigatória), Verso (obrigatório) e Notas (opcional, com a opção “Nenhum”). Cada seletor oferece os campos daquele tipo, pelo nome.
- **RF60g**: O mapeamento vem sugerido. Nos tipos básicos, o 1º campo vai para a Frente, o 2º para o Verso e o 3º, se houver, para as Notas. Nos tipos com nomes reconhecíveis, em português ou inglês (“Frente/Front/Pergunta”, “Verso/Back/Resposta”, “Extra/Notas/Comentário”), o nome vence a posição.
- **RF60h**: Tipos de **lacuna** do Anki têm mapeamento fixo e explicado, sem seletores. O campo de texto com as lacunas gera Frente e Verso (RF62), e o campo “Extra” (ou equivalente), se houver, vai para as Notas.
- **RF60i**: Um tipo de nota pode ser deixado de fora (“Não importar este tipo”). Tipos que o CertameCards não consegue representar, como oclusão de imagem, aparecem já desmarcados, com o motivo, e não podem ser marcados.
- **RF60j**: Um mesmo campo pode ir para mais de um destino, mas a tela avisa (“Frente e Verso usam o mesmo campo”) sem bloquear.

**Prévia (RF60)**

- **RF60k**: A prévia mostra os 3 primeiros cartões que serão criados (na ordem do arquivo, depois do filtro de origem e do mapeamento), renderizados como na revisão. A Frente aparece com as lacunas como `_____` e os destaques, o Verso e as Notas com quebras de linha e destaques, e as etiquetas aparecem como chips. A prévia se atualiza ao mudar o mapeamento. Com tipos diferentes entre as notas selecionadas, cada tipo tem a sua prévia.

**Conversão do conteúdo (RF61, RF62, RF63)**

- **RF61a**: `<br>`, o fim de cada `<div>` e de cada `<p>`, e cada `<li>` viram quebra de linha. Uma sequência de blocos vazios vira no máximo uma linha em branco (parágrafo). Itens de lista começam com “• ”. Cada linha de tabela vira uma linha, com as células separadas por “ | ”. Entidades HTML (`&nbsp;`, `&amp;`, `&lt;`) viram o caractere correspondente. Espaços repetidos dentro da linha viram um, e as pontas de cada campo são aparadas.
- **RF61b**: `<b>`, `<strong>` e `<u>`, e estilos equivalentes (`font-weight: bold`/`600`+, `text-decoration: underline`), viram destaque no trecho correspondente, aparado nos espaços. Destaques encostados ou aninhados viram um só. Itálico, cor, fonte e tamanho viram texto normal.
- **RF61c**: `[sound:…]`, `<img>`, `<audio>`, `<video>`, `<script>` e `<style>` são removidos sem deixar texto. Fórmulas (MathJax/LaTeX) ficam como texto literal.
- **RF62a**: Numa nota de lacuna, cada número distinto (`c1`, `c2`…) gera um cartão. A **Frente** é o texto com a lacuna daquele número oculta (todas as ocorrências do mesmo número, se houver mais de uma) e as demais lacunas em texto normal. A dica (`{{c1::texto::dica}}`) é descartada.
- **RF62b**: O **Verso** de um cartão de lacuna é o texto inteiro, com todas as lacunas reveladas e a resposta daquele número destacada. As **Notas** recebem o campo Extra, se houver.
- **RF62c**: Destaques do Anki dentro e fora das lacunas são preservados. Onde um destaque encontra uma lacuna, a lacuna prevalece (as marcas não se sobrepõem, RF8). Na Frente, o trecho oculto não leva destaque.
- **RF62d**: Lacunas aninhadas ou malformadas (sem fechamento, número ausente) viram texto normal, sem as chaves. Nota de lacuna sem nenhuma lacuna válida é pulada (RF65c).
- **RF63a**: As etiquetas da nota viram etiquetas de todos os cartões gerados por ela, com as regras de RF46b e RF47a. `_` vira espaço (“Direito_Constitucional” → “Direito Constitucional”), e a hierarquia do Anki é mantida literal (“Concurso::CESPE”). Uma etiqueta equivalente a outra já usada no app adota a grafia existente, e duas equivalentes na mesma nota viram uma.
- **RF63b**: Etiquetas internas do Anki (`leech`, `marked`) são descartadas. Etiquetas com mais de 40 caracteres são descartadas. Passando de 20 por nota, ficam as 20 primeiras. O resumo final informa quantas etiquetas foram descartadas.
- **RF63c**: O cartão importado não recebe o nome do baralho de origem como etiqueta.

**Destino (RF60)**

- **RF60l**: O último passo antes de importar é escolher o destino: um baralho existente (o ativo vem pré-selecionado) ou “Novo baralho”, com o nome sugerido a partir do arquivo. A sugestão é o último nível do baralho de origem, se houver só um selecionado, ou o nome do arquivo sem extensão. O nome segue o limite de baralho do app.
- **RF60m**: Na tela “Crie seu primeiro baralho” (RF17), “Importar do Anki” abre a mesma tela, com “Novo baralho” como única opção de destino.
- **RF60n**: O botão principal mostra o que vai acontecer: “Importar 1.230 cartões em Constitucional”.

**Importação (RF64, RF65)**

- **RF64a**: Cada cartão importado entra como cartão novo do FSRS, sem histórico, com a data de criação do momento da importação. Os cartões entram na fila respeitando “novos por dia” e o teto de não firmados do baralho de destino (RF18), na ordem do arquivo. Irmãos de lacuna (`c1`, `c2` da mesma nota) não são separados de dia.
- **RF64b**: Antes de começar, a tela informa uma vez que o histórico e a mídia do Anki não são importados: “O agendamento recomeça do zero e imagens e áudios ficam de fora.”
- **RF65a**: A importação mostra uma barra de progresso determinada (“Criando os cartões… 3.200 de 5.000”), anunciada por `aria-live` em marcos (a cada 25%), e o botão “Cancelar”.
- **RF65b**: A importação é **tudo-ou-nada**: falha, cancelamento, recarregamento ou fechamento do app no meio não deixa nenhum cartão daquela importação, nem o baralho novo criado para ela. Depois de uma falha, a tela volta ao passo do destino com a mensagem do erro, e repetir não duplica nada.
- **RF65c**: Notas que não cabem no CertameCards são **puladas**, e a importação segue com o resto. Isso vale para nota com Frente ou Verso vazios depois da conversão (ex.: só imagem), texto acima dos limites de `card-limits` (Frente ou Verso > 5.000, Notas > 20.000 caracteres), lacuna sem lacuna válida e tipo não suportado. Antes de importar, a tela já mostra quantas notas serão puladas e por quê.
- **RF65d**: Um cartão com Frente e Verso idênticos (mesmo texto e mesmas marcas) a um cartão não excluído do baralho de destino, ou a outro cartão da mesma importação, não é criado. Isso permite reimportar uma versão atualizada de um pacote sem duplicar os cartões que não mudaram. A contagem do botão principal (RF60n) já desconta esses cartões.
- **RF65e**: O fim mostra o resumo: “1.230 cartões importados em Constitucional”, seguido de quantos foram pulados por já existirem, quantas notas não puderam ser importadas, agrupadas por motivo, e quantas etiquetas foram descartadas. O resumo é anunciado por `aria-live`. O baralho de destino vira o baralho ativo. Os botões são “Ir para o início” (principal) e “Ver cartões”.

**Entradas de navegação**

- **RF60o**: Ajustes ganha a entrada “Importar do Anki”, que abre a tela de importação. Ela não entra no menu principal.

## Critérios de aceitação

Texto completo no documento-mãe:

| Critério | Requisitos | Resumo |
| --- | --- | --- |
| CA-33 | RF60, RF61 | `<b>vedado</b>` vira destaque; dois `<div>` no verso viram dois parágrafos. |
| CA-34 | RF62, RF63, US15 | `{{c1::União}}` e `{{c2::privativamente}}` com etiquetas `cespe constitucional` geram 2 cartões, cada um com uma lacuna oculta, ambos com as duas etiquetas. |
| CA-35 | RF65 | Falha no meio (arquivo corrompido) não deixa nenhum cartão daquela importação. |

Critérios próprios desta entrega:

- **CA-A1** (RF60a, Objetivo de compatibilidade): Os arquivos “Pacote Regular Flashcards - TI.colpkg” (formato novo) e “Inglês (Curso).apkg” abrem e mostram, respectivamente, 1.404 notas em 13 baralhos de origem e 1.952 notas, sem pedir nenhuma reexportação.
- **CA-A2** (RF60b): Dado um `.zip` qualquer renomeado para `.apkg`, então a tela mostra “Este arquivo não parece ser um baralho do Anki.”, volta à escolha de arquivo, e nenhum baralho ou cartão foi criado.
- **CA-A3** (RF60d, RF60e, US15a): Num arquivo com “Direito::Constitucional” (300 notas) e “Direito::Administrativo” (200 notas), quando o usuário desmarca “Administrativo”, então a contagem mostra 300 notas, e só elas chegam à prévia e ao destino.
- **CA-A4** (RF60f, RF60g, US15b): Num arquivo com um tipo “Básico” (Frente, Verso) e um tipo próprio “Questão” (Enunciado, Gabarito, Comentário), então “Básico” vem mapeado Frente→Frente e Verso→Verso, e “Questão” vem mapeado Enunciado→Frente, Gabarito→Verso e Comentário→Notas. Trocar o mapeamento de “Questão” não muda o de “Básico”.
- **CA-A5** (RF60h, RF62b): Dada uma nota de lacuna “A {{c1::União}} legisla {{c2::privativamente}}” com Extra “Art. 22, CF”, então o cartão c1 tem Frente “A _____ legisla privativamente”, Verso “A União legisla privativamente” com “União” destacado e Notas “Art. 22, CF”.
- **CA-A6** (RF60i, RF65c, US15f): Num arquivo com 10 notas de oclusão de imagem e 90 básicas, então o tipo de oclusão aparece desmarcado com o motivo, a tela informa “10 notas não serão importadas: tipo não suportado”, e o resumo final mostra 90 importadas.
- **CA-A7** (RF60k, US15c): Ao trocar o campo do Verso de um tipo no mapeamento, então a prévia dos 3 primeiros cartões daquele tipo mostra o novo conteúdo, com lacunas como `_____` e destaques em negrito colorido, sem recarregar a tela.
- **CA-A8** (RF61a): Dado um campo `<ul><li>Legalidade</li><li>Impessoalidade</li></ul>`, então o cartão mostra “• Legalidade” e “• Impessoalidade” em linhas separadas. Dado `A&nbsp;&amp;&nbsp;B`, então o texto é “A & B”.
- **CA-A9** (RF61b, RF62c): Dada a Frente `<b>salvo</b> {{c1::<b>disposição</b> em contrário}}`, então o cartão tem “salvo” destacado e a lacuna cobrindo “disposição em contrário”, sem destaque na Frente; no Verso, “disposição em contrário” aparece destacado.
- **CA-A10** (RF61c): Um campo com `[sound:aula.mp3]` e `<img src="x.png">` além de texto importa só o texto, sem resto de marcação. Uma nota cujo Verso tem só `<img>` é pulada com o motivo “Frente ou Verso vazio”.
- **CA-A11** (RF63a, RF63b): Com “CESPE” já usada no app, uma nota com as etiquetas `cespe Direito_Constitucional leech` gera um cartão com as etiquetas “CESPE” e “Direito Constitucional”, e o resumo informa 1 etiqueta descartada.
- **CA-A12** (RF65d, US15d): Depois de importar um arquivo no baralho “Constitucional”, quando o usuário importa o mesmo arquivo de novo no mesmo baralho, então o botão mostra “Importar 0 cartões” e não pode ser usado, e a tela informa quantos já existem. Importado num baralho diferente, o arquivo cria todos de novo.
- **CA-A13** (RF65c): Uma nota com Frente de 6.000 caracteres é pulada com o motivo “Texto acima do limite”, e as demais notas do arquivo são importadas.
- **CA-A14** (RF65a, RF65b): Durante uma importação de 5.000 notas para um baralho novo, quando o usuário toca “Cancelar” (e, num segundo teste, recarrega a página), então nem o baralho novo nem nenhum cartão daquela importação existem depois.
- **CA-A15** (RF65e, RF64a): Ao fim de uma importação de 1.230 cartões em “Constitucional”, com “novos por dia” = 20, então o resumo mostra “1.230 cartões importados em Constitucional”, o baralho ativo é “Constitucional” e a Home mostra no máximo 20 cartões novos hoje.
- **CA-A16** (RF60m, US15g): Sem nenhum baralho, a tela “Crie seu primeiro baralho” oferece “Importar do Anki”. Ao concluir, o app mostra a Home do baralho novo, com os cartões importados.
- **CA-A17** (offline, RF60p, US15e): Com a rede desligada e sem conta, num aparelho que já fez uma importação antes, o usuário importa um `.apkg` sem nenhuma mensagem de erro. Num aparelho que nunca importou, a tela mostra “Para importar pela primeira vez, conecte-se à internet…” com “Tentar de novo”, a escolha de arquivo fica indisponível e o resto do app segue normal. Quando a rede é religada, a escolha de arquivo é liberada sem o usuário tocar em nada. Se a rede cai no meio do download, a tela mostra a mesma mensagem, nunca um erro genérico.
- **CA-A18** (US15e): Com conta, depois de importar 1.000 cartões e sincronizar, então os 1.000 cartões, com as etiquetas e as marcas, aparecem no outro aparelho da mesma conta, sem duplicar.
- **CA-A19** (Objetivo de velocidade): Um arquivo de 10.000 notas básicas é importado em < 30 s num computador comum, e um de 5.000 em < 30 s num celular intermediário, contados da confirmação do destino até o resumo.
- **CA-A20** (legibilidade): Em 360 px, todos os passos da importação e o resumo ficam sem rolagem horizontal, e nenhum texto fica abaixo da escala do produto.

## Experiência do usuário

Igual ao documento-mãe (perfil, identidade visual, escala tipográfica, acessibilidade). Perfil desta entrega: o concurseiro migrando do Anki, com coleções de centenas a dezenas de milhares de notas, muitas vezes com pacotes de terceiros e tipos de nota próprios. A importação acontece de preferência no computador, mas precisa funcionar no celular.

Fluxos:

1. *Migração do Anki* (fluxo 6 do documento-mãe): Ajustes → Importar do Anki → arquivo → baralhos de origem → campos por tipo, com prévia → destino → Importar → resumo → Início.
2. *Começar pelo Anki*: primeira abertura sem baralho → “Crie seu primeiro baralho” → Importar do Anki → … → destino “Novo baralho” com nome sugerido → resumo → Home.
3. *Atualizar um pacote*: Ajustes → Importar do Anki → versão nova do mesmo pacote → destino: o baralho de antes → “Importar 40 cartões · 1.190 já existem” → resumo.

UI e acessibilidade:

- Os passos ficam numa só tela, com indicação de etapa (“Passo 2 de 4”, em `text-label`) e “Voltar” em cada etapa. Voltar preserva o que já foi escolhido: baralhos marcados, mapeamento e destino.
- A área de soltar arquivo também é um botão acessível por teclado (“Escolher arquivo .apkg ou .colpkg”). Arrastar é só um atalho no desktop.
- Os seletores de campo são `<select>` nativos com rótulo visível. As caixas de baralho de origem são checkboxes com área de toque ≥ 44 px. Com muitos baralhos, a lista rola dentro da etapa, e a contagem fica sempre visível.
- A prévia reutiliza a aparência do cartão da revisão e é marcada como prévia (texto “Prévia”, não só borda ou cor).
- Avisos (notas puladas, etiquetas descartadas, campo repetido) usam texto em `text-meta`, sem depender de cor. Erros de leitura usam a cor `miss` acompanhada de texto.
- A barra de progresso tem `role="progressbar"` com valor e rótulo. “Cancelar” fica sempre alcançável por teclado durante a importação.
- Textos em português do Brasil, com números no formato brasileiro (“1.230”).

**Offline e sem conta**: a importação inteira roda no aparelho. Ler o arquivo, converter, deduplicar e gravar não usam rede nem conta, e funcionam sem Supabase configurado no build. Os componentes de leitura do Anki são baixados só por quem abre a importação, para não pesar no app de quem só estuda. Depois da primeira vez, ficam disponíveis sem rede. Sem rede e sem esses componentes, a tela segue RF60p: explica que precisa de conexão uma única vez, oferece “Tentar de novo” e libera a importação sozinha quando a conexão volta. O resto do app segue normal. Com conta, os cartões importados são enviados na próxima sincronização, como qualquer cartão criado no aparelho. Uma importação grande não bloqueia o estudo em outros aparelhos e não precisa de rede para terminar.

## Restrições técnicas de alto nível

- As do documento-mãe, em especial: offline-first, escala tipográfica checada no CI, cores sempre por token e isolamento entre desenvolvimento e produção.
- **Porte do Lingo** (`services/ankiImport.ts`, `screens/Import.tsx`, `components/AnkiNotePicker.tsx`), estendido para o formato novo compactado do Anki, o `.colpkg`, o mapeamento por tipo de nota, a conversão de HTML para texto com destaques, a expansão de lacunas e as etiquetas. Sem áudio, sem geração de narração.
- **Sem mudança de schema nem de RPC**: cartões importados são cartões comuns, com campos, marcas e etiquetas já existentes. A deduplicação compara conteúdo, sem guardar identificador do Anki.
- **Regras de domínio do app valem na entrada**: lacuna só na Frente (normalização das marcas aplicada a todo cartão importado), limites de `card-limits` iguais aos do banco, campos do FSRS escritos só pelo agendador, e equivalência de etiquetas igual à de [prd-etiquetas](../prd-etiquetas/prd.md).
- **Leitura no navegador**: o arquivo nunca sai do aparelho e não é enviado a nenhum servidor. Só os cartões resultantes sincronizam, e só com conta.
- **Peso do app**: os componentes de leitura do Anki (descompactação e banco SQLite em WebAssembly) ficam fora do carregamento inicial e do precache obrigatório do service worker.
- **Desempenho e memória**: 10.000 notas em < 30 s no computador e 5.000 em < 30 s no celular. A gravação em lote não pode travar a interface: a barra de progresso e “Cancelar” respondem durante toda a importação. Arquivos com muita mídia são lidos sem extrair a mídia. Arquivos acima de 300 MB mostram um aviso recomendando importar pelo computador ou exportar sem mídia, sem impedir a tentativa.
- Privacidade: o conteúdo do arquivo e os nomes dos baralhos de origem não são registrados em lugar nenhum além dos cartões criados.

## Fora do escopo

- Tudo o que o documento-mãe exclui, em especial o histórico de revisões, o agendamento e a mídia do Anki (imagens, áudio, vídeo) e a exportação para o Anki.
- Importar imagens do Anki para a galeria das Notas (F17), mesmo depois que ela existir.
- Recriar a hierarquia de baralhos do Anki como vários baralhos no CertameCards: cada importação vai para um único baralho de destino.
- Cartões invertidos: tipos “Básico (e invertido)” e similares geram um cartão por nota (Frente → Verso), não dois.
- Oclusão de imagem, tipos com “digite a resposta” como comportamento (o campo é importado como texto) e templates de cartão do Anki (o conteúdo vem dos campos, não da renderização do template).
- Escolher notas individualmente para importar: o filtro é por baralho de origem e por tipo de nota.
- Atualizar cartões existentes a partir de uma nova versão do pacote: um cartão alterado no pacote entra como cartão novo, e o antigo fica.
- Deduplicar entre baralhos diferentes ou por identificador da nota do Anki.
- Outros formatos (CSV, TSV, Quizlet, Mochi, `.txt` exportado do Anki).
- Lacunas no Verso ou nas Notas e qualquer outra marca além de destaque e lacuna (itálico, cores, tamanhos).
- Importar pela conta (servidor) ou continuar uma importação interrompida.
