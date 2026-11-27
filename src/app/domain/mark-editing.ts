import type { HighlightColor } from './highlight-colors';
import type { Mark, Marks, Range } from './text-marks';

export type MarkRequest =
  | { kind: 'cloze' }
  | { kind: 'emphasis' }
  | { kind: 'highlight'; color: HighlightColor };

function sortedByStart<T extends Range>(ranges: T[]): T[] {
  return [...ranges].sort((a, b) => a.start - b.start);
}

export function addMark(marks: Marks, request: MarkRequest, range: Range): Marks {
  if (request.kind === 'highlight') {
    const highlight = sortedByStart([...(marks.highlight ?? []), { ...range, color: request.color }]);
    return { ...marks, highlight };
  }
  return { ...marks, [request.kind]: sortedByStart([...marks[request.kind], range]) };
}

export function removeMark(marks: Marks, mark: Mark): Marks {
  const current: Range[] = marks[mark.kind] ?? [];
  return { ...marks, [mark.kind]: current.filter((range) => range.start !== mark.start) };
}

export function recolorHighlight(marks: Marks, mark: Mark, color: HighlightColor): Marks {
  const highlight = (marks.highlight ?? []).map((range) =>
    range.start === mark.start ? { ...range, color } : range,
  );
  return { ...marks, highlight };
}
