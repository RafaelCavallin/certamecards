import type { ParsedField } from './anki-char-stream';
import { CLOZE_NUMBER_ATTRIBUTE, CLOZE_TAG } from './anki-html';
import { subtractRanges, trimmedRanges, unionRanges } from './anki-ranges';
import type { Marks } from './text-marks';

// Abertura de lacuna do Anki: {{c1:: — o número pode faltar num cartão malformado ({{c::x}})
const CLOZE_OPEN = /^\{\{c(\d*)::/;
const CLOZE_CLOSE = '}}';
const HINT_SEPARATOR = '::';

interface Frame {
  n: number;
  content: string;
  inHint: boolean;
  nested: boolean;
}

export interface ClozeSide {
  n: number;
  front: { text: string; marks: Marks };
  back: { text: string; marks: Marks };
}

export function markClozes(html: string): string {
  const stack: Frame[] = [];
  let out = '';
  const emit = (text: string): void => {
    const top = stack[stack.length - 1];
    if (!top) out += text;
    else if (!top.inHint) top.content += text;
  };
  for (let index = 0; index < html.length; ) {
    index += step(html, index, { stack, emit });
  }
  return out + stack.map((frame) => frame.content).join('');
}

interface StepState {
  stack: Frame[];
  emit: (text: string) => void;
}

function step(html: string, index: number, state: StepState): number {
  const open = CLOZE_OPEN.exec(html.slice(index, index + 16));
  if (open) {
    state.stack.push({ n: Number(open[1]) || 0, content: '', inHint: false, nested: false });
    return open[0].length;
  }
  const top = state.stack[state.stack.length - 1];
  if (top && html.startsWith(CLOZE_CLOSE, index)) {
    closeFrame(state);
    return CLOZE_CLOSE.length;
  }
  if (top && html.startsWith(HINT_SEPARATOR, index)) {
    top.inHint = true;
    return HINT_SEPARATOR.length;
  }
  state.emit(html[index]);
  return 1;
}

function closeFrame(state: StepState): void {
  const frame = state.stack.pop() as Frame;
  const parent = state.stack[state.stack.length - 1];
  if (parent) parent.nested = true;
  const valid = frame.n > 0 && !frame.nested && !parent;
  state.emit(valid ? `<${CLOZE_TAG} ${CLOZE_NUMBER_ATTRIBUTE}="${frame.n}">${frame.content}</${CLOZE_TAG}>` : frame.content);
}

export function expandCloze(parsed: ParsedField): ClozeSide[] {
  const numbers = [...new Set(parsed.clozes.map((cloze) => cloze.n))].sort((a, b) => a - b);
  return numbers.map((n) => {
    const hidden = parsed.clozes.filter((cloze) => cloze.n === n).map((cloze) => cloze.range);
    return {
      n,
      front: { text: parsed.text, marks: { cloze: hidden, emphasis: trimmedRanges(parsed.text, subtractRanges(parsed.emphasis, hidden)) } },
      back: { text: parsed.text, marks: { cloze: [], emphasis: unionRanges([...parsed.emphasis, ...hidden]) } },
    };
  });
}
