import { describe, expect, it } from 'vitest';
import { htmlToMarkedText } from './anki-html';

function highlights(html: string): [string, string][] {
  const parsed = htmlToMarkedText(html);
  return parsed.highlight.map((range) => [parsed.text.slice(range.start, range.end), range.color]);
}

describe('htmlToMarkedText — cor de fundo vira marca-texto', () => {
  it('lê background-color em qualquer elemento', () => {
    const html = 'a <span style="background-color:rgb(255, 255, 0)">b</span> <font style="background: rgb(0, 255, 0)">c</font>';

    expect(highlights(html)).toEqual([['b', 'yellow'], ['c', 'green']]);
  });

  it('trata mark sem estilo como amarelo e mark com fundo pela cor do fundo', () => {
    const html = '<mark>x</mark> <mark style="background-color: pink">y</mark>';

    expect(highlights(html)).toEqual([['x', 'yellow'], ['y', 'pink']]);
  });

  it('herda a cor para os filhos e deixa o filho trocar de cor', () => {
    const html = '<span style="background:yellow">um <i>dois</i> <span style="background:lime">três</span></span>';

    expect(highlights(html)).toEqual([['um dois', 'yellow'], ['três', 'green']]);
  });

  it('um filho transparente não apaga o fundo do pai', () => {
    const html = '<span style="background:yellow">a <span style="background-color: transparent">b</span></span>';

    expect(highlights(html)).toEqual([['a b', 'yellow']]);
  });

  it('ignora fundos neutros, transparentes e sem cor', () => {
    const html = '<span style="background-color:white">a</span><span style="background:transparent">b</span><span style="background:url(x.png)">c</span>';

    expect(highlights(html)).toEqual([]);
  });

  it('manda o fundo azul para o amarelo', () => {
    expect(highlights('<span style="background-color: blue">z</span>')).toEqual([['z', 'yellow']]);
  });

  it('apara o espaço das pontas e separa cores diferentes encostadas', () => {
    const html = '<span style="background:yellow"> a </span><span style="background:lime">b</span>';

    expect(highlights(html)).toEqual([['a', 'yellow'], ['b', 'green']]);
  });
});
