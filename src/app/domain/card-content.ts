import { normalizeTags } from './tags';
import { normalizeCardMarks } from './text-marks-normalize';
import type { CardContent } from './cards';

export function normalizeCardContent(content: CardContent): CardContent {
  return {
    front: content.front.trim(),
    back: content.back.trim(),
    notes: content.notes.trim(),
    marks: normalizeCardMarks(content.marks),
    tags: normalizeTags(content.tags),
  };
}

export function sameCardContent(a: CardContent, b: CardContent): boolean {
  return (
    a.front === b.front &&
    a.back === b.back &&
    a.notes === b.notes &&
    JSON.stringify(a.marks) === JSON.stringify(b.marks) &&
    JSON.stringify(a.tags) === JSON.stringify(b.tags)
  );
}
