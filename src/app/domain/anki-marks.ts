import type { ParsedField } from './anki-char-stream';
import { subtractRanges, trimmedRanges, unionRanges } from './anki-ranges';
import type { Marks, Range } from './text-marks';

export function resolveFieldMarks(parsed: ParsedField): Marks {
  const emphasis = subtractRanges(parsed.emphasis, parsed.highlight);
  return { cloze: [], emphasis: trimmedRanges(parsed.text, emphasis), highlight: parsed.highlight };
}

export function clozeFrontMarks(parsed: ParsedField, hidden: readonly Range[]): Marks {
  const emphasis = subtractRanges(parsed.emphasis, [...hidden, ...parsed.highlight]);
  const highlight = subtractRanges(parsed.highlight, hidden);
  return {
    cloze: [...hidden],
    emphasis: trimmedRanges(parsed.text, emphasis),
    highlight: trimmedRanges(parsed.text, highlight),
  };
}

export function clozeBackMarks(parsed: ParsedField, hidden: readonly Range[]): Marks {
  const emphasis = unionRanges([...subtractRanges(parsed.emphasis, parsed.highlight), ...hidden]);
  return { cloze: [], emphasis, highlight: trimmedRanges(parsed.text, subtractRanges(parsed.highlight, hidden)) };
}
