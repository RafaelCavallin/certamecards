import { trimRange, type Range } from './text-marks';

export function trimmedRanges(text: string, ranges: readonly Range[]): Range[] {
  return ranges.map((range) => trimRange(text, range)).filter((range) => range.end > range.start);
}

export function subtractRanges(ranges: readonly Range[], holes: readonly Range[]): Range[] {
  return ranges.flatMap((range) =>
    holes.reduce<Range[]>((pieces, hole) => pieces.flatMap((piece) => cut(piece, hole)), [range]),
  );
}

function cut(piece: Range, hole: Range): Range[] {
  if (hole.end <= piece.start || hole.start >= piece.end) return [piece];
  const before = { start: piece.start, end: hole.start };
  const after = { start: hole.end, end: piece.end };
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
