import { describe, expect, it } from 'vitest';
import { htmlToMarkedText } from './anki-html';
import type { Range } from './text-marks';

function highlighted(html: string): string[] {
  const parsed = htmlToMarkedText(html);
  return parsed.emphasis.map((range: Range) => parsed.text.slice(range.start, range.end));
}

describe('htmlToMarkedText — quebras, parágrafos, listas e tabelas', () => {
  it('transforma dois div em duas linhas', () => {
    expect(htmlToMarkedText('<div>Primeiro</div><div>Segundo</div>').text).toBe('Primeiro\nSegundo');
  });

  it('transforma br em quebra de linha', () => {
    expect(htmlToMarkedText('linha 1<br>linha 2<br/>linha 3').text).toBe('linha 1\nlinha 2\nlinha 3');
  });

  it('limita blocos vazios seguidos a uma linha em branco', () => {
    const html = '<div>a</div><div><br></div><div></div><div><br></div><div>b</div>';

    expect(htmlToMarkedText(html).text).toBe('a\n\nb');
  });

  it('prefixa itens de lista com marcador, um por linha', () => {
    const html = '<ul><li>Legalidade</li><li>Impessoalidade</li></ul>';

    expect(htmlToMarkedText(html).text).toBe('• Legalidade\n• Impessoalidade');
  });

  it('separa células por barra e linhas da tabela por quebra', () => {
    const html = '<table><tr><td>a</td><td>b</td></tr><tr><th>c</th><td>d</td></tr></table>';

    expect(htmlToMarkedText(html).text).toBe('a | b\nc | d');
  });

  it('decodifica entidades e trata nbsp como espaço', () => {
    expect(htmlToMarkedText('A&nbsp;&amp;&nbsp;B &lt;3').text).toBe('A & B <3');
  });

  it('colapsa espaços e apara cada linha', () => {
    expect(htmlToMarkedText('  muito   espaço  <div>  aqui </div>').text).toBe('muito espaço\naqui');
  });
});

describe('htmlToMarkedText — destaques', () => {
  it('destaca b, strong e u com offsets exatos', () => {
    const parsed = htmlToMarkedText('é <b>vedado</b>, <strong>salvo</strong> e <u>só</u>');

    expect(parsed.emphasis).toEqual([
      { start: 2, end: 8 },
      { start: 10, end: 15 },
      { start: 18, end: 20 },
    ]);
  });

  it('destaca por estilo de negrito ou sublinhado', () => {
    const html = '<span style="font-weight:700">a</span> <span style="text-decoration: underline">b</span>';

    expect(highlighted(html)).toEqual(['a', 'b']);
  });

  it('apara o destaque nos espaços das pontas', () => {
    expect(highlighted('é<b> salvo </b>se')).toEqual(['salvo']);
  });

  it('funde destaques encostados', () => {
    expect(highlighted('<b>exclusiva</b><u>mente</u>')).toEqual(['exclusivamente']);
  });

  it('ignora itálico, cor e fonte', () => {
    const html = '<i>a</i> <font color="red">b</font> <span style="font-weight:400">c</span>';

    expect(htmlToMarkedText(html).emphasis).toEqual([]);
  });

  it('não leva o destaque através de uma quebra de bloco', () => {
    expect(highlighted('<b>um<div>dois</div></b>')).toEqual(['um', 'dois']);
  });
});

describe('htmlToMarkedText — mídia e som', () => {
  it('remove som e imagem sem deixar resto', () => {
    const parsed = htmlToMarkedText('texto [sound:aula.mp3]<img src="x.png">');

    expect(parsed).toEqual({ text: 'texto', emphasis: [], clozes: [] });
  });

  it('devolve vazio para um campo só com imagem', () => {
    expect(htmlToMarkedText('<img src="esquema.png">').text).toBe('');
  });

  it('remove script, style e vídeo', () => {
    const html = 'a<script>alert(1)</script><style>p{}</style><video src="v.mp4"></video>b';

    expect(htmlToMarkedText(html).text).toBe('ab');
  });
});
