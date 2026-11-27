import { HIGHLIGHT_COLORS, type HighlightColor } from './highlight-colors';
import { isFilled, runsOf, type Run } from './anki-runs';
import type { HighlightRange, Range } from './text-marks';
import { trimRange } from './text-marks-selection';

export interface StyledChar {
  char: string;
  emphasis: boolean;
  cloze: number;
  highlight: HighlightColor | null;
}

export interface ClozeRange {
  n: number;
  range: Range;
}

export interface ParsedField {
  text: string;
  emphasis: Range[];
  highlight: HighlightRange[];
  clozes: ClozeRange[];
}

const LINE_BREAK = '\n';
const SPACE = ' ';
const PLAIN: Omit<StyledChar, 'char'> = { emphasis: false, cloze: 0, highlight: null };

export function plainChars(text: string): StyledChar[] {
  return [...text].map((char) => ({ char, ...PLAIN }));
}

function highlightKey(styled: StyledChar): number {
  return styled.highlight ? HIGHLIGHT_COLORS.indexOf(styled.highlight) + 1 : 0;
}

function trimmedRun(text: string, run: Run): Run {
  return { n: run.n, range: trimRange(text, run.range) };
}

export function toParsedField(stream: readonly StyledChar[]): ParsedField {
  const chars = joinLines(collapseBlankLines(splitLines(stream).map(normalizeLine)));
  const text = chars.map((styled) => styled.char).join('');
  const trimmed = (key: (styled: StyledChar) => number): Run[] =>
    runsOf(chars, key).map((run) => trimmedRun(text, run)).filter((run) => isFilled(run.range));
  return {
    text,
    emphasis: trimmed((styled) => (styled.emphasis ? 1 : 0)).map((run) => run.range),
    highlight: trimmed(highlightKey).map((run) => ({ ...run.range, color: HIGHLIGHT_COLORS[run.n - 1] })),
    clozes: trimmed((styled) => styled.cloze),
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

function isSpace(styled: StyledChar): boolean {
  return styled.char === SPACE;
}
