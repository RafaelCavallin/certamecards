import { describe, expect, it } from 'vitest';
import { normalizeCardMarks } from './text-marks-normalize';
import { EMPTY_CARD_MARKS } from './text-marks';

describe('normalizeCardMarks', () => {
  it('devolve os três campos com arrays vazios quando a entrada é nula', () => {
    expect(normalizeCardMarks(null)).toEqual(EMPTY_CARD_MARKS);
    expect(normalizeCardMarks(undefined)).toEqual(EMPTY_CARD_MARKS);
  });

  it('completa com arrays vazios as chaves ausentes', () => {
    const result = normalizeCardMarks({ front: { cloze: [{ start: 0, end: 3 }], emphasis: [] } });

    expect(result).toEqual({
      front: { cloze: [{ start: 0, end: 3 }], emphasis: [] },
      back: { cloze: [], emphasis: [] },
      notes: { cloze: [], emphasis: [] },
    });
  });

  it('preserva a lacuna na Frente', () => {
    const result = normalizeCardMarks({
      front: { cloze: [{ start: 5, end: 10 }], emphasis: [] },
    });

    expect(result.front.cloze).toEqual([{ start: 5, end: 10 }]);
  });

  it('descarta lacunas do Verso e das Notas, preservando os destaques', () => {
    const result = normalizeCardMarks({
      back: { cloze: [{ start: 0, end: 4 }], emphasis: [{ start: 5, end: 8 }] },
      notes: { cloze: [{ start: 1, end: 2 }], emphasis: [{ start: 3, end: 6 }] },
    });

    expect(result.back).toEqual({ cloze: [], emphasis: [{ start: 5, end: 8 }] });
    expect(result.notes).toEqual({ cloze: [], emphasis: [{ start: 3, end: 6 }] });
  });
});
