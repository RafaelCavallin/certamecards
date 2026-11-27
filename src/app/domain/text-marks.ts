import { displayHighlightColor, type HighlightColor } from './highlight-colors';

export interface Range {
  start: number;
  end: number;
}

export interface HighlightRange extends Range {
  color: string;
}

export interface Marks {
  cloze: Range[];
  emphasis: Range[];
  highlight?: HighlightRange[];
}

export type CardField = 'front' | 'back' | 'notes';

export type CardMarks = Record<CardField, Marks>;

export const EMPTY_CARD_MARKS: CardMarks = {
  front: { cloze: [], emphasis: [], highlight: [] },
  back: { cloze: [], emphasis: [], highlight: [] },
  notes: { cloze: [], emphasis: [], highlight: [] },
};

export type MarkKind = 'cloze' | 'emphasis' | 'highlight';

export type Mark = (Range & { kind: 'cloze' | 'emphasis' }) | (HighlightRange & { kind: 'highlight' });

export interface Segment {
  text: string;
  start: number;
  kind: MarkKind | null;
  color: HighlightColor | null;
}

export function marksOf(marks: Partial<Marks>): Mark[] {
  return [
    ...(marks.cloze ?? []).map((range) => ({ ...range, kind: 'cloze' as const })),
    ...(marks.emphasis ?? []).map((range) => ({ ...range, kind: 'emphasis' as const })),
    ...(marks.highlight ?? []).map((range) => ({ ...range, kind: 'highlight' as const })),
  ].sort((a, b) => a.start - b.start);
}

function plainSegment(text: string, start: number, end: number): Segment {
  return { text: text.slice(start, end), start, kind: null, color: null };
}

function markSegment(text: string, mark: Mark): Segment {
  const color = mark.kind === 'highlight' ? displayHighlightColor(mark.color) : null;
  return { text: text.slice(mark.start, mark.end), start: mark.start, kind: mark.kind, color };
}

/**
 * Fatia o texto pelas marcas. Os offsets são sempre os do texto original —
 * mascarar a lacuna antes de aplicar o destaque deslocaria tudo que vem
 * depois, então todas as marcas são resolvidas na mesma passada.
 */
export function splitByMarks(text: string, marks: Mark[]): Segment[] {
  const segments: Segment[] = [];
  let cursor = 0;
  for (const mark of [...marks].sort((a, b) => a.start - b.start)) {
    if (mark.start < cursor) continue;
    if (mark.start > cursor) segments.push(plainSegment(text, cursor, mark.start));
    segments.push(markSegment(text, mark));
    cursor = mark.end;
  }
  if (cursor < text.length) segments.push(plainSegment(text, cursor, text.length));
  return segments;
}

const MIN_BLANK_LENGTH = 3;

/** O texto que a lacuna mostra no lugar do trecho escondido. */
export function blank(text: string): string {
  return '_'.repeat(Math.max(MIN_BLANK_LENGTH, text.length));
}
