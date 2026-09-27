export interface Range {
  start: number;
  end: number;
}

export interface Marks {
  cloze: Range[];
  emphasis: Range[];
}

export type CardField = 'front' | 'back' | 'notes';

export type CardMarks = Record<CardField, Marks>;

export const EMPTY_CARD_MARKS: CardMarks = {
  front: { cloze: [], emphasis: [] },
  back: { cloze: [], emphasis: [] },
  notes: { cloze: [], emphasis: [] },
};

export type MarkKind = 'cloze' | 'emphasis';

export type Mark = Range & { kind: MarkKind };

export interface Segment {
  text: string;
  start: number;
  kind: MarkKind | null;
}

/** Junta lacunas e destaques numa lista única, ordenada pelo início. */
export function marksOf(cloze: Range[] = [], emphasis: Range[] = []): Mark[] {
  return [
    ...cloze.map((range) => ({ ...range, kind: 'cloze' as const })),
    ...emphasis.map((range) => ({ ...range, kind: 'emphasis' as const })),
  ].sort((a, b) => a.start - b.start);
}

/**
 * Fatia o texto pelas marcas. Os offsets são sempre os do texto original —
 * mascarar a lacuna antes de aplicar o destaque deslocaria tudo que vem
 * depois, então as duas marcas são resolvidas na mesma passada.
 */
export function splitByMarks(text: string, marks: Mark[]): Segment[] {
  const segments: Segment[] = [];
  let cursor = 0;
  for (const mark of [...marks].sort((a, b) => a.start - b.start)) {
    if (mark.start < cursor) continue;
    if (mark.start > cursor) {
      segments.push({ text: text.slice(cursor, mark.start), start: cursor, kind: null });
    }
    segments.push({ text: text.slice(mark.start, mark.end), start: mark.start, kind: mark.kind });
    cursor = mark.end;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor), start: cursor, kind: null });
  return segments;
}

const MIN_BLANK_LENGTH = 3;

/** O texto que a lacuna mostra no lugar do trecho escondido. */
export function blank(text: string): string {
  return '_'.repeat(Math.max(MIN_BLANK_LENGTH, text.length));
}

/** Encolhe a seleção até os espaços das pontas ficarem de fora. */
export function trimRange(text: string, range: Range): Range {
  const selected = text.slice(range.start, range.end);
  const start = range.start + (selected.length - selected.trimStart().length);
  const end = start + selected.trim().length;
  return end > start ? { start, end } : { start: range.start, end: range.start };
}

/**
 * A marca que a seleção pegou, ou `null`. Com o cursor parado (seleção vazia)
 * só conta estar dentro da marca: encostar na borda é o que o usuário faz
 * para continuar digitando ao lado dela.
 */
export function markAt(marks: Mark[], range: Range): Mark | null {
  const isCursor = range.start === range.end;
  const hit = marks.find((mark) =>
    isCursor
      ? mark.start < range.start && range.start < mark.end
      : range.start < mark.end && mark.start < range.end,
  );
  return hit ?? null;
}
