export type HighlightColor = 'yellow' | 'green' | 'pink';

export const HIGHLIGHT_COLORS: readonly HighlightColor[] = ['yellow', 'green', 'pink'];

export const HIGHLIGHT_COLOR_NAMES: Record<HighlightColor, string> = {
  yellow: 'amarelo',
  green: 'verde',
  pink: 'rosa',
};

const FALLBACK_COLOR: HighlightColor = 'yellow';

export function isHighlightColor(color: string): color is HighlightColor {
  return (HIGHLIGHT_COLORS as readonly string[]).includes(color);
}

export function displayHighlightColor(color: string): HighlightColor {
  return isHighlightColor(color) ? color : FALLBACK_COLOR;
}
