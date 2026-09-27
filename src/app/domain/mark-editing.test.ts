import { describe, expect, it } from 'vitest';
import { addMarkRange, removeMarkRange } from './mark-editing';
import type { Marks } from './text-marks';

const EMPTY: Marks = { cloze: [], emphasis: [] };

describe('addMarkRange', () => {
  it('acrescenta a marca ao tipo indicado', () => {
    const result = addMarkRange(EMPTY, 'cloze', { start: 5, end: 10 });

    expect(result).toEqual({ cloze: [{ start: 5, end: 10 }], emphasis: [] });
  });

  it('mantém a lista ordenada pelo início ao inserir antes de uma marca existente', () => {
    const marks: Marks = { cloze: [{ start: 10, end: 15 }], emphasis: [] };

    const result = addMarkRange(marks, 'cloze', { start: 0, end: 4 });

    expect(result.cloze).toEqual([
      { start: 0, end: 4 },
      { start: 10, end: 15 },
    ]);
  });

  it('não altera o tipo de marca oposto', () => {
    const marks: Marks = { cloze: [], emphasis: [{ start: 1, end: 3 }] };

    const result = addMarkRange(marks, 'cloze', { start: 5, end: 8 });

    expect(result.emphasis).toEqual([{ start: 1, end: 3 }]);
  });
});

describe('removeMarkRange', () => {
  it('remove só a marca com o início indicado', () => {
    const marks: Marks = {
      cloze: [
        { start: 0, end: 4 },
        { start: 10, end: 15 },
      ],
      emphasis: [],
    };

    const result = removeMarkRange(marks, { start: 0, end: 4, kind: 'cloze' });

    expect(result.cloze).toEqual([{ start: 10, end: 15 }]);
  });

  it('não afeta marcas do outro tipo', () => {
    const marks: Marks = { cloze: [{ start: 0, end: 4 }], emphasis: [{ start: 5, end: 9 }] };

    const result = removeMarkRange(marks, { start: 0, end: 4, kind: 'cloze' });

    expect(result.emphasis).toEqual([{ start: 5, end: 9 }]);
  });
});
