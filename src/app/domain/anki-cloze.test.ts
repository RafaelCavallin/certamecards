import { describe, expect, it } from 'vitest';
import { expandCloze, markClozes, type ClozeSide } from './anki-cloze';
import { htmlToMarkedText } from './anki-html';
import type { Range } from './text-marks';

function sides(html: string): ClozeSide[] {
  return expandCloze(htmlToMarkedText(markClozes(html)));
}

function slices(text: string, ranges: readonly Range[]): string[] {
  return ranges.map((range) => text.slice(range.start, range.end));
}

describe('markClozes + expandCloze — um cartão por número', () => {
  it('gera um lado por número, com a lacuna daquele número oculta', () => {
    const [c1, c2] = sides('A {{c1::União}} legisla {{c2::privativamente}}');

    expect(c1.front.text).toBe('A União legisla privativamente');
    expect(slices(c1.front.text, c1.front.marks.cloze)).toEqual(['União']);
    expect(slices(c2.front.text, c2.front.marks.cloze)).toEqual(['privativamente']);
  });

  it('revela tudo no Verso e destaca a resposta daquele número', () => {
    const [c1] = sides('A {{c1::União}} legisla {{c2::privativamente}}');

    expect(c1.back.marks).toEqual({ cloze: [], emphasis: [{ start: 2, end: 7 }] });
  });

  it('agrupa num só cartão as ocorrências do mesmo número', () => {
    const result = sides('{{c1::a}} e {{c1::b}}');

    expect(result).toHaveLength(1);
    expect(slices(result[0].front.text, result[0].front.marks.cloze)).toEqual(['a', 'b']);
  });

  it('descarta a dica', () => {
    const [c1] = sides('Prazo de {{c1::cinco::número}} dias');

    expect(c1.front.text).toBe('Prazo de cinco dias');
  });

  it('ordena os lados pelo número', () => {
    expect(sides('{{c3::c}} {{c1::a}} {{c2::b}}').map((side) => side.n)).toEqual([1, 2, 3]);
  });
});

describe('lacuna e destaque juntos', () => {
  const html = '<b>salvo</b> {{c1::<b>disposição</b> em contrário}}';

  it('na Frente, a lacuna prevalece e não há destaque dentro dela', () => {
    const [c1] = sides(html);

    expect(slices(c1.front.text, c1.front.marks.cloze)).toEqual(['disposição em contrário']);
    expect(slices(c1.front.text, c1.front.marks.emphasis)).toEqual(['salvo']);
  });

  it('no Verso, a resposta se une aos destaques sem sobreposição', () => {
    const [c1] = sides(html);

    expect(slices(c1.back.text, c1.back.marks.emphasis)).toEqual(['salvo', 'disposição em contrário']);
  });

  it('recorta para fora da lacuna um destaque que a atravessa', () => {
    const [c1] = sides('<b>regra {{c1::geral}} aqui</b>');

    expect(slices(c1.front.text, c1.front.marks.emphasis)).toEqual(['regra', 'aqui']);
  });
});

describe('lacunas malformadas e aninhadas', () => {
  it('lacuna sem fechamento vira texto sem chaves', () => {
    const parsed = htmlToMarkedText(markClozes('antes {{c1::sem fim'));

    expect(parsed).toEqual({ text: 'antes sem fim', emphasis: [], clozes: [] });
  });

  it('lacuna sem número vira texto', () => {
    expect(htmlToMarkedText(markClozes('{{c::x}} y'))).toEqual({ text: 'x y', emphasis: [], clozes: [] });
  });

  it('lacunas aninhadas viram texto, as duas', () => {
    const parsed = htmlToMarkedText(markClozes('{{c1::a {{c2::b}}}} c'));

    expect(parsed).toEqual({ text: 'a b c', emphasis: [], clozes: [] });
  });

  it('não gera cartão quando não sobra lacuna válida', () => {
    expect(sides('{{c1::a {{c2::b}}}}')).toEqual([]);
  });

  it('mantém chaves soltas fora de lacuna', () => {
    expect(htmlToMarkedText(markClozes('fim }} aqui')).text).toBe('fim }} aqui');
  });
});
