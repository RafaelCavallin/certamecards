import { describe, expect, it } from 'vitest';
import { visibleTagChips } from './tag-chips';

describe('visibleTagChips', () => {
  it('sem etiquetas não mostra nada', () => {
    expect(visibleTagChips([], 30)).toEqual({ shown: [], hiddenCount: 0 });
  });

  it('mostra as que cabem e conta as escondidas', () => {
    const result = visibleTagChips(['abcde', 'fghij', 'klmno', 'pqrst'], 16);

    expect(result).toEqual({ shown: ['abcde', 'fghij'], hiddenCount: 2 });
  });

  it('mostra todas quando cabem', () => {
    expect(visibleTagChips(['a', 'b'], 30).hiddenCount).toBe(0);
  });

  it('sempre mostra a primeira, mesmo maior que o orçamento', () => {
    const result = visibleTagChips(['x'.repeat(40), 'y'], 10);

    expect(result).toEqual({ shown: ['x'.repeat(40)], hiddenCount: 1 });
  });
});
