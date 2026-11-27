import { describe, expect, it } from 'vitest';
import { recolorHighlight } from './mark-editing';
import type { Marks } from './text-marks';

const EMPTY: Marks = { cloze: [], emphasis: [], highlight: [] };

describe('recolorHighlight', () => {
  const marks: Marks = {
    ...EMPTY,
    highlight: [{ start: 0, end: 4, color: 'yellow' }, { start: 8, end: 12, color: 'pink' }],
  };

  it('troca só a cor do trecho indicado', () => {
    const result = recolorHighlight(marks, { start: 0, end: 4, color: 'yellow', kind: 'highlight' }, 'green');

    expect(result.highlight).toEqual([
      { start: 0, end: 4, color: 'green' },
      { start: 8, end: 12, color: 'pink' },
    ]);
  });

  it('não altera o original', () => {
    recolorHighlight(marks, { start: 0, end: 4, color: 'yellow', kind: 'highlight' }, 'green');

    expect(marks.highlight?.[0].color).toBe('yellow');
  });
});
