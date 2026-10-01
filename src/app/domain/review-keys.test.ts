import { describe, expect, it } from 'vitest';
import { reviewKeyAction } from './review-keys';

const SPACE = { code: 'Space', key: ' ' };

describe('reviewKeyAction', () => {
  it('Espaço revela antes de revelar', () => {
    expect(reviewKeyAction(SPACE, false)).toBe('reveal');
  });

  it('Espaço acerta depois de revelar', () => {
    expect(reviewKeyAction(SPACE, true)).toBe('good');
  });

  it('1 erra e 2 acerta depois de revelar', () => {
    expect([reviewKeyAction({ code: 'Digit1', key: '1' }, true), reviewKeyAction({ code: 'Digit2', key: '2' }, true)]).toEqual(['again', 'good']);
  });

  it('1 e 2 não fazem nada antes de revelar', () => {
    expect([reviewKeyAction({ code: 'Digit1', key: '1' }, false), reviewKeyAction({ code: 'Digit2', key: '2' }, false)]).toEqual([null, null]);
  });

  it('outras teclas são ignoradas', () => {
    expect(reviewKeyAction({ code: 'KeyA', key: 'a' }, true)).toBeNull();
  });
});
