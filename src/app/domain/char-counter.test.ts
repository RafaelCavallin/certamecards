import { describe, expect, it } from 'vitest';
import { charCounterLabel } from './char-counter';

describe('charCounterLabel', () => {
  it('não mostra nada longe do limite', () => {
    expect(charCounterLabel(10, 5000)).toBeNull();
  });

  it('mostra a contagem a partir de 90% do limite', () => {
    expect(charCounterLabel(4500, 5000)).toBe('4500/5000');
  });

  it('mostra a contagem no limite exato', () => {
    expect(charCounterLabel(5000, 5000)).toBe('5000/5000');
  });

  it('mostra a contagem mesmo passando do limite', () => {
    expect(charCounterLabel(5001, 5000)).toBe('5001/5000');
  });
});
