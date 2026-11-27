import { describe, expect, it } from 'vitest';
import { blank, marksOf, splitByMarks } from './text-marks';

const SENTENCE = 'O mandato e de quatro anos';
const MANDATO = { start: 2, end: 9 };
const QUATRO = { start: 15, end: 21 };
const ANOS = { start: 22, end: 26 };

describe('marksOf', () => {
  it('mescla as listas ordenadas pelo início', () => {
    const marks = marksOf({ cloze: [QUATRO], emphasis: [MANDATO], highlight: [{ ...ANOS, color: 'pink' }] });

    expect(marks).toEqual([
      { ...MANDATO, kind: 'emphasis' },
      { ...QUATRO, kind: 'cloze' },
      { ...ANOS, kind: 'highlight', color: 'pink' },
    ]);
  });

  it('trata listas ausentes, inclusive highlight de cartão antigo, como vazias', () => {
    expect(marksOf({})).toEqual([]);
    expect(marksOf({ cloze: [QUATRO], emphasis: [] })).toEqual([{ ...QUATRO, kind: 'cloze' }]);
  });
});

describe('splitByMarks', () => {
  it('devolve o texto inteiro sem marcas', () => {
    expect(splitByMarks(SENTENCE, [])).toEqual([{ text: SENTENCE, start: 0, kind: null, color: null }]);
  });

  it('intercala lacuna e destaque na mesma passada', () => {
    const segments = splitByMarks(SENTENCE, marksOf({ cloze: [QUATRO], emphasis: [MANDATO] }));

    expect(segments).toEqual([
      { text: 'O ', start: 0, kind: null, color: null },
      { text: 'mandato', start: 2, kind: 'emphasis', color: null },
      { text: ' e de ', start: 9, kind: null, color: null },
      { text: 'quatro', start: 15, kind: 'cloze', color: null },
      { text: ' anos', start: 21, kind: null, color: null },
    ]);
  });

  it('entrega o segmento do marca-texto com a cor de exibição', () => {
    const segments = splitByMarks(SENTENCE, marksOf({ highlight: [{ ...MANDATO, color: 'pink' }, { ...ANOS, color: 'blue' }] }));

    expect(segments.filter((s) => s.kind === 'highlight')).toEqual([
      { text: 'mandato', start: 2, kind: 'highlight', color: 'pink' },
      { text: 'anos', start: 22, kind: 'highlight', color: 'yellow' },
    ]);
  });

  it('cobre marcas no início, no fim e coladas uma na outra', () => {
    const marks = marksOf({ cloze: [{ start: 0, end: 2 }], emphasis: [{ start: 2, end: 6 }] });

    expect(splitByMarks('abcdef', marks)).toEqual([
      { text: 'ab', start: 0, kind: 'cloze', color: null },
      { text: 'cdef', start: 2, kind: 'emphasis', color: null },
    ]);
  });

  it('descarta a segunda marca quando duas se sobrepõem', () => {
    const marks = marksOf({ cloze: [MANDATO], highlight: [{ start: 4, end: 12, color: 'green' }] });

    const segments = splitByMarks(SENTENCE, marks);

    expect(segments.filter((s) => s.kind !== null)).toEqual([
      { text: 'mandato', start: 2, kind: 'cloze', color: null },
    ]);
    expect(segments.map((s) => s.text).join('')).toBe(SENTENCE);
  });

  it('preserva o texto original ao concatenar os segmentos', () => {
    const segments = splitByMarks(SENTENCE, marksOf({ cloze: [QUATRO], emphasis: [MANDATO] }));

    expect(segments.map((s) => s.text).join('')).toBe(SENTENCE);
  });
});

describe('blank', () => {
  it('usa no mínimo três traços', () => {
    expect(blank('a')).toBe('___');
    expect(blank('quatro')).toBe('______');
  });
});
