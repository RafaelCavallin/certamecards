import type { Range } from './text-marks';
import type { StyledChar } from './anki-char-stream';

export interface Run {
  n: number;
  range: Range;
}

export function runsOf(chars: readonly StyledChar[], keyOf: (styled: StyledChar) => number): Run[] {
  const runs: Run[] = [];
  chars.forEach((styled, index) => {
    const n = keyOf(styled);
    if (n === 0) return;
    const last = runs[runs.length - 1];
    if (last && last.n === n && last.range.end === index) last.range.end = index + 1;
    else runs.push({ n, range: { start: index, end: index + 1 } });
  });
  return runs;
}

export function isFilled(range: Range): boolean {
  return range.end > range.start;
}
