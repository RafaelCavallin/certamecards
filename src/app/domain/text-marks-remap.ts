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
export function remapRanges(before: string, after: string, ranges: Range[]): Range[] {
  if (before === after) return ranges;
  const prefix = commonPrefixLength(before, after);
  const changedEnd = before.length - commonSuffixLength(before, after, prefix);
  const delta = after.length - before.length;
  return ranges.flatMap((range) => {
    if (range.end <= prefix) return [range];
    if (range.start >= changedEnd) return [{ start: range.start + delta, end: range.end + delta }];
    return [];
  });
}

export function remapMarks(before: string, after: string, marks: Marks): Marks {
  return {
    cloze: remapRanges(before, after, marks.cloze),
    emphasis: remapRanges(before, after, marks.emphasis),
  };
}
