import { trimRange } from './text-marks-selection';
import type { Range } from './text-marks';

export function trimmedRanges<T extends Range>(text: string, ranges: readonly T[]): T[] {
  return ranges.map((range) => ({ ...range, ...trimRange(text, range) })).filter((range) => range.end > range.start);
}

export function subtractRanges<T extends Range>(ranges: readonly T[], holes: readonly Range[]): T[] {
  return ranges.flatMap((range) =>
    holes.reduce<T[]>((pieces, hole) => pieces.flatMap((piece) => cut(piece, hole)), [range]),
  );
}

function cut<T extends Range>(piece: T, hole: Range): T[] {
  if (hole.end <= piece.start || hole.start >= piece.end) return [piece];
  const before = { ...piece, end: hole.start };
  const after = { ...piece, start: hole.end };
  return [before, after].filter((range) => range.end > range.start);
}

export function unionRanges(ranges: readonly Range[]): Range[] {
  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  return sorted.reduce<Range[]>((merged, range) => {
    const last = merged[merged.length - 1];
    if (last && range.start <= last.end) last.end = Math.max(last.end, range.end);
    else merged.push({ ...range });
    return merged;
  }, []);
}
