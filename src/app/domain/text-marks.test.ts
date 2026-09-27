import { describe, expect, it } from 'vitest';
import { blank, markAt, marksOf, splitByMarks, trimRange } from './text-marks';

const SENTENCE = 'O mandato e de quatro anos';
//                0123456789...
const MANDATO = { start: 2, end: 9 };
const QUATRO = { start: 15, end: 21 };

describe('marksOf', () => {
  it('mescla as duas listas ordenadas pelo início', () => {
    expect(marksOf([QUATRO], [MANDATO])).toEqual([
      { ...MANDATO, kind: 'emphasis' },
      { ...QUATRO, kind: 'cloze' },
    ]);
  });

  it('trata listas ausentes como vazias', () => {
    expect(marksOf()).toEqual([]);
  });
});

describe('splitByMarks', () => {
  it('devolve o texto inteiro sem marcas', () => {
    expect(splitByMarks(SENTENCE, [])).toEqual([{ text: SENTENCE, start: 0, kind: null }]);
  });

  it('intercala lacuna e destaque na mesma passada', () => {
    const segments = splitByMarks(SENTENCE, marksOf([QUATRO], [MANDATO]));

    expect(segments).toEqual([
      { text: 'O ', start: 0, kind: null },
      { text: 'mandato', start: 2, kind: 'emphasis' },
      { text: ' e de ', start: 9, kind: null },
      { text: 'quatro', start: 15, kind: 'cloze' },
      { text: ' anos', start: 21, kind: null },
    ]);
  });

  it('cobre marcas no início, no fim e coladas uma na outra', () => {
    const segments = splitByMarks('abcdef', marksOf([{ start: 0, end: 2 }], [{ start: 2, end: 6 }]));

    expect(segments).toEqual([
      { text: 'ab', start: 0, kind: 'cloze' },
      { text: 'cdef', start: 2, kind: 'emphasis' },
    ]);
  });

  it('descarta a segunda marca quando duas se sobrepõem', () => {
    const segments = splitByMarks(SENTENCE, marksOf([MANDATO], [{ start: 4, end: 12 }]));

    expect(segments.filter((s) => s.kind !== null)).toEqual([{ text: 'mandato', start: 2, kind: 'cloze' }]);
    expect(segments.map((s) => s.text).join('')).toBe(SENTENCE);
  });

  it('preserva o texto original ao concatenar os segmentos', () => {
    const segments = splitByMarks(SENTENCE, marksOf([QUATRO], [MANDATO]));

    expect(segments.map((s) => s.text).join('')).toBe(SENTENCE);
  });
});

describe('blank', () => {
  it('usa no mínimo três traços', () => {
    expect(blank('a')).toBe('___');
    expect(blank('quatro')).toBe('______');
  });
});

describe('trimRange', () => {
  it('tira os espaços das pontas da seleção', () => {
    expect(trimRange(SENTENCE, { start: 1, end: 10 })).toEqual(MANDATO);
  });

  it('mantém a seleção que já começa e termina em letra', () => {
    expect(trimRange(SENTENCE, QUATRO)).toEqual(QUATRO);
  });

  it('vira uma seleção vazia quando só há espaço', () => {
    expect(trimRange(SENTENCE, { start: 1, end: 2 })).toEqual({ start: 1, end: 1 });
  });
});

describe('markAt', () => {
  const MARKS = marksOf([QUATRO], [MANDATO]);

  it('acha a marca que a seleção atravessa', () => {
    expect(markAt(MARKS, { start: 3, end: 5 })).toEqual({ ...MANDATO, kind: 'emphasis' });
  });

  it('acha a marca em que o cursor parou dentro', () => {
    expect(markAt(MARKS, { start: 20, end: 20 })).toEqual({ ...QUATRO, kind: 'cloze' });
  });

  it('ignora o cursor parado na borda da marca', () => {
    expect(markAt(MARKS, { start: 15, end: 15 })).toBeNull();
    expect(markAt(MARKS, { start: 21, end: 21 })).toBeNull();
  });

  it('devolve null quando a seleção está livre', () => {
    expect(markAt(MARKS, { start: 10, end: 14 })).toBeNull();
  });
});
