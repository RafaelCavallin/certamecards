import { describe, expect, it } from 'vitest';
import { normalizeCardMarks } from './text-marks-normalize';
import { EMPTY_CARD_MARKS, type CardMarks } from './text-marks';

function futureCard(extra: unknown): Partial<CardMarks> {
  return extra as Partial<CardMarks>;
}

describe('normalizeCardMarks', () => {
  it('devolve os três campos com arrays vazios quando a entrada é nula', () => {
    expect(normalizeCardMarks(null)).toEqual(EMPTY_CARD_MARKS);
    expect(normalizeCardMarks(undefined)).toEqual(EMPTY_CARD_MARKS);
  });

  it('completa com arrays vazios as chaves ausentes', () => {
    const result = normalizeCardMarks({ front: { cloze: [{ start: 0, end: 3 }], emphasis: [] } });

    expect(result).toEqual({
      front: { cloze: [{ start: 0, end: 3 }], emphasis: [], highlight: [] },
      back: { cloze: [], emphasis: [], highlight: [] },
      notes: { cloze: [], emphasis: [], highlight: [] },
    });
  });

  it('preenche highlight vazio num cartão gravado antes do marca-texto', () => {
    const result = normalizeCardMarks({ back: { cloze: [], emphasis: [{ start: 1, end: 4 }] } });

    expect(result.back).toEqual({ cloze: [], emphasis: [{ start: 1, end: 4 }], highlight: [] });
  });

  it('preserva a lacuna na Frente', () => {
    const result = normalizeCardMarks({ front: { cloze: [{ start: 5, end: 10 }], emphasis: [] } });

    expect(result.front.cloze).toEqual([{ start: 5, end: 10 }]);
  });

  it('descarta lacunas do Verso e das Notas, preservando destaques e marca-textos', () => {
    const result = normalizeCardMarks({
      back: { cloze: [{ start: 0, end: 4 }], emphasis: [{ start: 5, end: 8 }], highlight: [{ start: 9, end: 12, color: 'green' }] },
      notes: { cloze: [{ start: 1, end: 2 }], emphasis: [{ start: 3, end: 6 }], highlight: [{ start: 7, end: 9, color: 'pink' }] },
    });

    expect(result.back).toEqual({ cloze: [], emphasis: [{ start: 5, end: 8 }], highlight: [{ start: 9, end: 12, color: 'green' }] });
    expect(result.notes).toEqual({ cloze: [], emphasis: [{ start: 3, end: 6 }], highlight: [{ start: 7, end: 9, color: 'pink' }] });
  });

  it('preserva marca-texto nos três campos', () => {
    const highlight = [{ start: 0, end: 3, color: 'yellow' }];

    const result = normalizeCardMarks({
      front: { cloze: [], emphasis: [], highlight },
      back: { cloze: [], emphasis: [], highlight },
      notes: { cloze: [], emphasis: [], highlight },
    });

    expect([result.front.highlight, result.back.highlight, result.notes.highlight]).toEqual([highlight, highlight, highlight]);
  });

  it('preserva a cor desconhecida e descarta o item malformado', () => {
    const raw = futureCard({
      front: { cloze: [], emphasis: [], highlight: [{ start: 0, end: 5, color: 'blue' }, { start: 6, color: 'green' }, null, 'x'] },
    });

    const result = normalizeCardMarks(raw);

    expect(result.front.highlight).toEqual([{ start: 0, end: 5, color: 'blue' }]);
  });

  it('descarta um highlight que não é lista', () => {
    const result = normalizeCardMarks(futureCard({ front: { cloze: [], emphasis: [], highlight: 'x' } }));

    expect(result.front.highlight).toEqual([]);
  });

  it('preserva tipos desconhecidos no campo e no cartão', () => {
    const strike = [{ start: 8, end: 12 }];
    const raw = futureCard({ front: { cloze: [], emphasis: [], strike }, version: 7 });

    const result = normalizeCardMarks(raw);

    expect(result).toMatchObject({ version: 7, front: { strike } });
  });

  it('mantém a ordem das chaves conhecidas, para a comparação por JSON ser estável', () => {
    const result = normalizeCardMarks({ front: { emphasis: [], cloze: [] } });

    expect(Object.keys(result.front)).toEqual(['cloze', 'emphasis', 'highlight']);
  });
});
