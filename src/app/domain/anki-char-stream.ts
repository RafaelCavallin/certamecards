import { trimRange, type Range } from './text-marks';

export interface StyledChar {
  char: string;
  emphasis: boolean;
  cloze: number;
}

export interface ClozeRange {
  n: number;
  range: Range;
}

export interface ParsedField {
  text: string;
  emphasis: Range[];
  clozes: ClozeRange[];
}

const LINE_BREAK = '\n';
const SPACE = ' ';
const PLAIN: Omit<StyledChar, 'char'> = { emphasis: false, cloze: 0 };

export function plainChars(text: string): StyledChar[] {
  return [...text].map((char) => ({ char, ...PLAIN }));
}

export function toParsedField(stream: readonly StyledChar[]): ParsedField {
  const chars = joinLines(collapseBlankLines(splitLines(stream).map(normalizeLine)));
  const text = chars.map((styled) => styled.char).join('');
  return {
    text,
    emphasis: runsOf(chars, (styled) => (styled.emphasis ? 1 : 0)).map((run) => trimRange(text, run.range)).filter(isFilled),
    clozes: runsOf(chars, (styled) => styled.cloze)
      .map((run) => ({ n: run.n, range: trimRange(text, run.range) }))
      .filter((cloze) => isFilled(cloze.range)),
  };
}

function splitLines(stream: readonly StyledChar[]): StyledChar[][] {
  const lines: StyledChar[][] = [[]];
  for (const styled of stream) {
    if (styled.char === LINE_BREAK) lines.push([]);
    else lines[lines.length - 1].push(styled);
  }
  return lines;
}

function normalizeLine(line: readonly StyledChar[]): StyledChar[] {
  const collapsed = line.filter((styled, index) => !(isSpace(styled) && index > 0 && isSpace(line[index - 1])));
  const start = collapsed.findIndex((styled) => !isSpace(styled));
  if (start === -1) return [];
  const end = collapsed.length - [...collapsed].reverse().findIndex((styled) => !isSpace(styled));
  return collapsed.slice(start, end);
}

function collapseBlankLines(lines: StyledChar[][]): StyledChar[][] {
  const kept = lines.filter((line, index) => line.length > 0 || (index > 0 && lines[index - 1].length > 0));
  while (kept.length > 0 && kept[0].length === 0) kept.shift();
  while (kept.length > 0 && kept[kept.length - 1].length === 0) kept.pop();
  return kept;
}

function joinLines(lines: readonly StyledChar[][]): StyledChar[] {
  return lines.flatMap((line, index) => (index === 0 ? line : [{ char: LINE_BREAK, ...PLAIN }, ...line]));
}

function runsOf(chars: readonly StyledChar[], keyOf: (styled: StyledChar) => number): ClozeRange[] {
  const runs: ClozeRange[] = [];
  chars.forEach((styled, index) => {
    const n = keyOf(styled);
    if (n === 0) return;
    const last = runs[runs.length - 1];
    if (last && last.n === n && last.range.end === index) last.range.end = index + 1;
    else runs.push({ n, range: { start: index, end: index + 1 } });
  });
  return runs;
}

function isSpace(styled: StyledChar): boolean {
  return styled.char === SPACE;
}

function isFilled(range: Range): boolean {
  return range.end > range.start;
}
