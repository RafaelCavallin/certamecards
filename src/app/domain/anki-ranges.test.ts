import { describe, expect, it } from 'vitest';
import { subtractRanges, trimmedRanges, unionRanges } from './anki-ranges';

describe('subtractRanges', () => {
  it('preserva a cor dos pedaços que sobram', () => {
    const result = subtractRanges([{ start: 0, end: 10, color: 'pink' }], [{ start: 3, end: 6 }]);

    expect(result).toEqual([
      { start: 0, end: 3, color: 'pink' },
      { start: 6, end: 10, color: 'pink' },
    ]);
  });

  it('descarta o trecho coberto por inteiro e devolve o que não toca o buraco', () => {
    const result = subtractRanges([{ start: 2, end: 4 }, { start: 8, end: 9 }], [{ start: 0, end: 5 }]);

    expect(result).toEqual([{ start: 8, end: 9 }]);
  });
});

describe('trimmedRanges', () => {
  it('apara os espaços e mantém a cor', () => {
    expect(trimmedRanges('a  bc  d', [{ start: 1, end: 6, color: 'green' }])).toEqual([{ start: 3, end: 5, color: 'green' }]);
  });

  it('descarta o trecho que só tinha espaço', () => {
    expect(trimmedRanges('a   b', [{ start: 1, end: 4 }])).toEqual([]);
  });
});

describe('unionRanges', () => {
  it('une trechos sobrepostos ou encostados', () => {
    expect(unionRanges([{ start: 5, end: 8 }, { start: 0, end: 3 }, { start: 3, end: 4 }])).toEqual([
      { start: 0, end: 4 },
      { start: 5, end: 8 },
    ]);
  });
});
