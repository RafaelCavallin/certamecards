import { describe, expect, it } from 'vitest';
import { addMark, removeMark } from './mark-editing';
import type { Marks } from './text-marks';

const EMPTY: Marks = { cloze: [], emphasis: [], highlight: [] };

describe('addMark', () => {
  it('acrescenta a lacuna ao tipo indicado', () => {
    const result = addMark(EMPTY, { kind: 'cloze' }, { start: 5, end: 10 });

    expect(result).toEqual({ cloze: [{ start: 5, end: 10 }], emphasis: [], highlight: [] });
  });

  it('mantém a lista ordenada pelo início ao inserir antes de uma marca existente', () => {
    const marks: Marks = { cloze: [{ start: 10, end: 15 }], emphasis: [] };

    const result = addMark(marks, { kind: 'cloze' }, { start: 0, end: 4 });

    expect(result.cloze).toEqual([
      { start: 0, end: 4 },
      { start: 10, end: 15 },
    ]);
  });

  it('não altera o tipo de marca oposto', () => {
    const marks: Marks = { cloze: [], emphasis: [{ start: 1, end: 3 }] };

    const result = addMark(marks, { kind: 'cloze' }, { start: 5, end: 8 });

    expect(result.emphasis).toEqual([{ start: 1, end: 3 }]);
  });

  it('acrescenta o marca-texto com a cor, ordenado, em cartão sem a lista', () => {
    const marks: Marks = { cloze: [], emphasis: [] };

    const result = addMark(marks, { kind: 'highlight', color: 'green' }, { start: 4, end: 9 });

    expect(result.highlight).toEqual([{ start: 4, end: 9, color: 'green' }]);
  });

  it('insere o marca-texto antes de outro, mantendo a ordem', () => {
    const marks: Marks = { ...EMPTY, highlight: [{ start: 10, end: 14, color: 'pink' }] };

    const result = addMark(marks, { kind: 'highlight', color: 'yellow' }, { start: 0, end: 3 });

    expect(result.highlight).toEqual([
      { start: 0, end: 3, color: 'yellow' },
      { start: 10, end: 14, color: 'pink' },
    ]);
  });

  it('preserva chaves desconhecidas', () => {
    const marks = { ...EMPTY, strike: [{ start: 1, end: 2 }] } as unknown as Marks;

    const result = addMark(marks, { kind: 'highlight', color: 'pink' }, { start: 5, end: 8 });

    expect(result).toMatchObject({ strike: [{ start: 1, end: 2 }] });
  });
});

describe('removeMark', () => {
  it('remove só a marca com o início indicado', () => {
    const marks: Marks = {
      cloze: [
        { start: 0, end: 4 },
        { start: 10, end: 15 },
      ],
      emphasis: [],
    };

    const result = removeMark(marks, { start: 0, end: 4, kind: 'cloze' });

    expect(result.cloze).toEqual([{ start: 10, end: 15 }]);
  });

  it('não afeta marcas do outro tipo', () => {
    const marks: Marks = { cloze: [{ start: 0, end: 4 }], emphasis: [{ start: 5, end: 9 }] };

    const result = removeMark(marks, { start: 0, end: 4, kind: 'cloze' });

    expect(result.emphasis).toEqual([{ start: 5, end: 9 }]);
  });

  it('remove só o marca-texto indicado', () => {
    const marks: Marks = {
      ...EMPTY,
      emphasis: [{ start: 0, end: 4 }],
      highlight: [{ start: 5, end: 9, color: 'green' }, { start: 12, end: 16, color: 'pink' }],
    };

    const result = removeMark(marks, { start: 5, end: 9, color: 'green', kind: 'highlight' });

    expect(result.highlight).toEqual([{ start: 12, end: 16, color: 'pink' }]);
    expect(result.emphasis).toEqual([{ start: 0, end: 4 }]);
  });
});
