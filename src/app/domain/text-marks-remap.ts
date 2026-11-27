import type { Marks, Range } from './text-marks';

function commonPrefixLength(before: string, after: string): number {
  const limit = Math.min(before.length, after.length);
  let i = 0;
  while (i < limit && before[i] === after[i]) i++;
  return i;
}

function commonSuffixLength(before: string, after: string, prefix: number): number {
  const limit = Math.min(before.length, after.length) - prefix;
  let i = 0;
  while (i < limit && before[before.length - 1 - i] === after[after.length - 1 - i]) i++;
  return i;
}

/**
 * Reposiciona as marcas depois de uma edição do texto. O trecho alterado é o
 * que sobra entre o prefixo e o sufixo comuns: marcas antes dele ficam onde
 * estão, marcas depois andam junto, e marcas que o trecho alterado atravessa
 * são descartadas — o texto que elas marcavam não existe mais.
 */
export function remapRanges<T extends Range>(before: string, after: string, ranges: T[]): T[] {
  if (before === after) return ranges;
  const prefix = commonPrefixLength(before, after);
  const changedEnd = before.length - commonSuffixLength(before, after, prefix);
  const delta = after.length - before.length;
  return ranges.flatMap((range) => {
    if (range.end <= prefix) return [range];
    if (range.start >= changedEnd) return [{ ...range, start: range.start + delta, end: range.end + delta }];
    return [];
  });
}

function isRange(value: unknown): value is Range {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Record<string, unknown>;
  return typeof item['start'] === 'number' && typeof item['end'] === 'number';
}

function isRangeList(value: unknown): value is Range[] {
  return Array.isArray(value) && value.every(isRange);
}

export function remapMarks(before: string, after: string, marks: Marks): Marks {
  const entries = Object.entries(marks).map(([key, value]): [string, unknown] => [
    key,
    isRangeList(value) ? remapRanges(before, after, value) : value,
  ]);
  return { cloze: [], emphasis: [], ...Object.fromEntries(entries) };
}
