import { describe, expect, it } from 'vitest';
import { frontSizeClass } from './type-scale';

describe('frontSizeClass', () => {
  it('usa o tamanho normal até 280 caracteres', () => {
    expect(frontSizeClass('a'.repeat(280))).toBe('text-front');
  });

  it('usa o degrau menor acima de 280 caracteres', () => {
    expect(frontSizeClass('a'.repeat(281))).toBe('text-front-long');
  });

  it('usa o tamanho normal para textos curtos', () => {
    expect(frontSizeClass('O mandato é de quatro anos')).toBe('text-front');
  });
});
