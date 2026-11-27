import { describe, expect, it } from 'vitest';
import { markHint, summarizeMarks } from './mark-summary';
import type { Marks } from './text-marks';

const R = { start: 0, end: 1 };
const H = { start: 0, end: 1, color: 'green' };

describe('summarizeMarks', () => {
  it('conta lacunas, destaques e marca-textos no plural', () => {
    const marks: Marks = { cloze: [R], emphasis: [R, R], highlight: [H, H, H] };

    expect(summarizeMarks(marks)).toBe('1 lacuna, 2 destaques e 3 marca-textos');
  });

  it('usa o singular', () => {
    const marks: Marks = { cloze: [], emphasis: [R], highlight: [H] };

    expect(summarizeMarks(marks)).toBe('1 destaque e 1 marca-texto');
  });

  it('cita só um tipo sem conjunção', () => {
    expect(summarizeMarks({ cloze: [R, R], emphasis: [] })).toBe('2 lacunas');
  });

  it('devolve vazio sem marcas, com ou sem a lista de marca-texto', () => {
    expect(summarizeMarks({ cloze: [], emphasis: [] })).toBe('');
    expect(summarizeMarks({ cloze: [], emphasis: [], highlight: [] })).toBe('');
  });
});

describe('markHint', () => {
  it('cita ocultar quando a lacuna é permitida', () => {
    expect(markHint(true)).toBe('Selecione um trecho para ocultar, destacar ou marcar');
  });

  it('não cita ocultar fora da Frente', () => {
    expect(markHint(false)).toBe('Selecione um trecho para destacar ou marcar');
  });
});
