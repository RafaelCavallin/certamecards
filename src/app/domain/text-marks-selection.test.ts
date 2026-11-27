import { describe, expect, it } from 'vitest';
import { marksOf } from './text-marks';
import { markAt, trimRange } from './text-marks-selection';

const SENTENCE = 'O mandato e de quatro anos';
const MANDATO = { start: 2, end: 9 };
const QUATRO = { start: 15, end: 21 };
const ANOS = { start: 22, end: 26 };

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
  const MARKS = marksOf({ cloze: [QUATRO], emphasis: [MANDATO], highlight: [{ ...ANOS, color: 'green' }] });

  it('acha a marca que a seleção atravessa', () => {
    expect(markAt(MARKS, { start: 3, end: 5 })).toEqual({ ...MANDATO, kind: 'emphasis' });
  });

  it('acha a marca em que o cursor parou dentro', () => {
    expect(markAt(MARKS, { start: 20, end: 20 })).toEqual({ ...QUATRO, kind: 'cloze' });
  });

  it('acha o marca-texto sob o cursor e sob uma seleção que o toca', () => {
    const expected = { ...ANOS, kind: 'highlight', color: 'green' };

    expect(markAt(MARKS, { start: 24, end: 24 })).toEqual(expected);
    expect(markAt(MARKS, { start: 20, end: 24 })).toEqual({ ...QUATRO, kind: 'cloze' });
    expect(markAt(MARKS, { start: 21, end: 24 })).toEqual(expected);
  });

  it('ignora o cursor parado na borda da marca', () => {
    expect(markAt(MARKS, { start: 15, end: 15 })).toBeNull();
    expect(markAt(MARKS, { start: 21, end: 21 })).toBeNull();
  });

  it('devolve null quando a seleção está livre', () => {
    expect(markAt(MARKS, { start: 10, end: 14 })).toBeNull();
  });
});
