import type { HighlightColor } from '../../domain/highlight-colors';

export const CLOZE_FRAME = 'rounded ring-1 ring-inset ring-signal box-decoration-clone';

export const EMPHASIS_UNDERLINE = 'underline decoration-signal decoration-2 underline-offset-4';

const HIGHLIGHT_SHAPE = 'rounded-sm box-decoration-clone';

const HIGHLIGHT_FILL: Record<HighlightColor, string> = {
  yellow: 'bg-highlight-yellow',
  green: 'bg-highlight-green',
  pink: 'bg-highlight-pink',
};

export function highlightFill(color: HighlightColor): string {
  return HIGHLIGHT_FILL[color];
}

export function highlightClass(color: HighlightColor): string {
  return `${HIGHLIGHT_SHAPE} ${HIGHLIGHT_FILL[color]}`;
}
