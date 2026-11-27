import { describe, expect, it } from 'vitest';
import { resolveFieldMarks } from './anki-marks';
import { htmlToMarkedText } from './anki-html';

function slices(text: string, ranges: readonly { start: number; end: number }[]): string[] {
  return ranges.map((range) => text.slice(range.start, range.end));
}

describe('resolveFieldMarks — uma marca por trecho', () => {
  it('deixa só o marca-texto num trecho em negrito com fundo verde', () => {
    const parsed = htmlToMarkedText('é <b style="background-color:lime">vedado</b> salvo <b>lei</b>');

    const marks = resolveFieldMarks(parsed);

    expect(marks.highlight).toEqual([{ start: 2, end: 8, color: 'green' }]);
    expect(slices(parsed.text, marks.emphasis)).toEqual(['lei']);
    expect(marks.cloze).toEqual([]);
  });

  it('recorta o destaque que só passa em parte do fundo colorido', () => {
    const parsed = htmlToMarkedText('<b>regra <span style="background:yellow">geral</span> aqui</b>');

    const marks = resolveFieldMarks(parsed);

    expect(slices(parsed.text, marks.highlight)).toEqual(['geral']);
    expect(slices(parsed.text, marks.emphasis)).toEqual(['regra', 'aqui']);
  });

  it('mantém o marca-texto de um campo sem negrito', () => {
    const parsed = htmlToMarkedText('um <span style="background-color: rgb(255,192,203)">dois</span>');

    expect(resolveFieldMarks(parsed)).toEqual({ cloze: [], emphasis: [], highlight: [{ start: 3, end: 7, color: 'pink' }] });
  });
});
