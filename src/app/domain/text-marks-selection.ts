import type { Mark, Range } from './text-marks';

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
