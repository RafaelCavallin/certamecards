import { describe, expect, it } from 'vitest';
import { displayHighlightColor, HIGHLIGHT_COLOR_NAMES, HIGHLIGHT_COLORS, isHighlightColor } from './highlight-colors';

describe('displayHighlightColor', () => {
  it.each(HIGHLIGHT_COLORS)('devolve %s quando a cor é conhecida', (color) => {
    expect(displayHighlightColor(color)).toBe(color);
  });

  it('exibe como amarelo uma cor que esta versão não conhece', () => {
    expect(displayHighlightColor('blue')).toBe('yellow');
    expect(displayHighlightColor('')).toBe('yellow');
  });
});

describe('isHighlightColor', () => {
  it('reconhece só as três cores', () => {
    expect(HIGHLIGHT_COLORS.every(isHighlightColor)).toBe(true);
    expect(isHighlightColor('blue')).toBe(false);
  });
});

describe('HIGHLIGHT_COLOR_NAMES', () => {
  it('nomeia cada cor em português', () => {
    expect(HIGHLIGHT_COLOR_NAMES).toEqual({ yellow: 'amarelo', green: 'verde', pink: 'rosa' });
  });
});
