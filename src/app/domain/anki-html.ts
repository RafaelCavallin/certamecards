import { plainChars, toParsedField, type ParsedField, type StyledChar } from './anki-char-stream';

export const CLOZE_TAG = 'anki-cloze';
export const CLOZE_NUMBER_ATTRIBUTE = 'data-n';

const SOUND_PATTERN = /\[sound:[^\]]*\]/gi;
const WHITESPACE_PATTERN = /\s/;
const BOLD_STYLE = /font-weight\s*:\s*(bold|bolder|[6-9]00)/i;
const UNDERLINE_STYLE = /text-decoration(-line)?\s*:[^;]*underline/i;
const EMPHASIS_TAGS = new Set(['b', 'strong', 'u']);
const REMOVED_TAGS = new Set(['img', 'audio', 'video', 'script', 'style', 'object', 'iframe', 'svg']);
const BLOCK_TAGS = new Set(['div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'tr', 'ul', 'ol', 'blockquote', 'pre']);
const CELL_TAGS = new Set(['td', 'th']);
const LIST_BULLET = '• ';
const CELL_SEPARATOR = ' | ';
const LINE_BREAK = '\n';
const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

interface WalkContext {
  emphasis: boolean;
  cloze: number;
}

export function htmlToMarkedText(html: string): ParsedField {
  const doc = new DOMParser().parseFromString(html.replace(SOUND_PATTERN, ''), 'text/html');
  const stream: StyledChar[] = [];
  walkChildren(doc.body, { emphasis: false, cloze: 0 }, stream);
  return toParsedField(stream);
}

function walkChildren(parent: Node, context: WalkContext, stream: StyledChar[]): void {
  parent.childNodes.forEach((child) => walk(child, context, stream));
}

function walk(node: Node, context: WalkContext, stream: StyledChar[]): void {
  if (node.nodeType === TEXT_NODE) {
    pushText(stream, node.textContent ?? '', context);
    return;
  }
  if (node.nodeType !== ELEMENT_NODE) return;
  const element = node as Element;
  const tag = element.tagName.toLowerCase();
  if (REMOVED_TAGS.has(tag)) return;
  if (tag === 'br') {
    stream.push(...plainChars(LINE_BREAK));
    return;
  }
  if (BLOCK_TAGS.has(tag) || tag === 'li') softBreak(stream);
  stream.push(...plainChars(prefixOf(element, tag)));
  walkChildren(element, childContext(element, tag, context), stream);
  if (BLOCK_TAGS.has(tag)) softBreak(stream);
}

function softBreak(stream: StyledChar[]): void {
  for (let index = stream.length - 1; index >= 0; index--) {
    if (stream[index].char === LINE_BREAK) return;
    if (stream[index].char !== ' ') break;
  }
  stream.push(...plainChars(LINE_BREAK));
}

function prefixOf(element: Element, tag: string): string {
  if (tag === 'li') return LIST_BULLET;
  const previous = element.previousElementSibling;
  if (CELL_TAGS.has(tag) && previous && CELL_TAGS.has(previous.tagName.toLowerCase())) return CELL_SEPARATOR;
  return '';
}

function childContext(element: Element, tag: string, context: WalkContext): WalkContext {
  const cloze = tag === CLOZE_TAG ? Number(element.getAttribute(CLOZE_NUMBER_ATTRIBUTE)) || 0 : context.cloze;
  return { emphasis: context.emphasis || isEmphasis(element, tag), cloze };
}

function isEmphasis(element: Element, tag: string): boolean {
  if (EMPHASIS_TAGS.has(tag)) return true;
  const style = element.getAttribute('style') ?? '';
  return BOLD_STYLE.test(style) || UNDERLINE_STYLE.test(style);
}

function pushText(stream: StyledChar[], text: string, context: WalkContext): void {
  for (const char of text) {
    stream.push({ char: WHITESPACE_PATTERN.test(char) ? ' ' : char, ...context });
  }
}
