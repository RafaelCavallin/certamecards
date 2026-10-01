import type { CardContent } from './cards';
import type { Marks, Range } from './text-marks';

export type ContentKeySource = Pick<CardContent, 'front' | 'back' | 'marks'>;

export interface DedupeResult<T> {
  unique: T[];
  duplicates: number;
}

export function contentKey(content: ContentKeySource): string {
  return JSON.stringify([
    content.front.trim(),
    content.back.trim(),
    canonicalMarks(content.marks.front),
    canonicalMarks(content.marks.back).emphasis,
  ]);
}

export function dropDuplicates<T extends ContentKeySource>(
  drafts: readonly T[],
  existing: ReadonlySet<string>,
): DedupeResult<T> {
  const seen = new Set(existing);
  const unique: T[] = [];
  for (const draft of drafts) {
    const key = contentKey(draft);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(draft);
  }
  return { unique, duplicates: drafts.length - unique.length };
}

function canonicalMarks(marks: Marks | undefined): Marks {
  return { cloze: sortRanges(marks?.cloze ?? []), emphasis: sortRanges(marks?.emphasis ?? []) };
}

function sortRanges(ranges: readonly Range[]): Range[] {
  return [...ranges]
    .map((range) => ({ start: range.start, end: range.end }))
    .sort((a, b) => a.start - b.start || a.end - b.end);
}
