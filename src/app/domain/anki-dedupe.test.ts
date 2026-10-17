import { describe, expect, it } from 'vitest';
import { contentKey, dropDuplicates, type ContentKeySource } from './anki-dedupe';
import { EMPTY_CARD_MARKS, type CardMarks } from './text-marks';

function content(front: string, back: string, marks: CardMarks = EMPTY_CARD_MARKS): ContentKeySource {
  return { front, back, marks };
}

const BOLD_FRONT: CardMarks = { ...EMPTY_CARD_MARKS, front: { cloze: [], emphasis: [{ start: 0, end: 2 }] } };

describe('contentKey', () => {
  it('dá a mesma chave para o mesmo texto e as mesmas marcas', () => {
    expect(contentKey(content('Frente', 'Verso'))).toBe(contentKey(content(' Frente ', 'Verso ')));
  });

  it('diferencia a mesma Frente com destaque diferente', () => {
    expect(contentKey(content('Frente', 'Verso', BOLD_FRONT))).not.toBe(contentKey(content('Frente', 'Verso')));
  });

  it('ignora Notas e etiquetas', () => {
    const withNotes = { ...content('F', 'V'), notes: 'comentário corrigido', tags: ['CESPE'] };

    expect(contentKey(withNotes)).toBe(contentKey(content('F', 'V')));
  });

  it('não depende da ordem dos intervalos', () => {
    const a: CardMarks = { ...EMPTY_CARD_MARKS, front: { cloze: [], emphasis: [{ start: 4, end: 5 }, { start: 0, end: 1 }] } };
    const b: CardMarks = { ...EMPTY_CARD_MARKS, front: { cloze: [], emphasis: [{ start: 0, end: 1 }, { start: 4, end: 5 }] } };

    expect(contentKey(content('ab cd', 'v', a))).toBe(contentKey(content('ab cd', 'v', b)));
  });
});

describe('dropDuplicates', () => {
  it('descarta duplicatas contra o baralho e dentro da própria lista, preservando a ordem', () => {
    const existing = new Set([contentKey(content('já existe', 'v'))]);
    const drafts = [content('a', 'v'), content('já existe', 'v'), content('b', 'v'), content('a', 'v')];

    const result = dropDuplicates(drafts, existing);

    expect(result.unique.map((draft) => draft.front)).toEqual(['a', 'b']);
    expect(result.duplicates).toBe(2);
  });

  it('não altera o conjunto recebido', () => {
    const existing = new Set<string>();

    dropDuplicates([content('a', 'v')], existing);

    expect(existing.size).toBe(0);
  });
});
