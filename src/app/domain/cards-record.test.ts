import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetDb } from '../../test/db-helpers';
import { createCard, newCardRecord, type NewCardInput } from './cards';
import { db } from './db';
import { EMPTY_CARD_MARKS } from './text-marks';

afterEach(async () => {
  vi.useRealTimers();
  await resetDb();
});

const NOW = Date.parse('2026-10-01T12:00:00Z');

const input: NewCardInput = {
  deckId: 'deck-1',
  front: ' Frente ',
  back: 'Verso',
  notes: '',
  marks: {
    ...EMPTY_CARD_MARKS,
    back: { cloze: [{ start: 0, end: 2 }], emphasis: [] },
    notes: { cloze: [{ start: 0, end: 1 }], emphasis: [] },
  },
  tags: ['cespe', 'CESPE'],
};

describe('newCardRecord', () => {
  it('cria um cartão novo do FSRS no instante informado', () => {
    const card = newCardRecord(input, NOW);

    expect(card).toMatchObject({ state: 0, reps: 0, lapses: 0, due: NOW, createdAt: NOW, updatedAt: NOW, deletedAt: 0, dirty: 1 });
  });

  it('apara o texto, normaliza etiquetas e tira lacunas de Verso e Notas', () => {
    const card = newCardRecord(input, NOW);

    expect(card.front).toBe('Frente');
    expect(card.tags).toEqual(['cespe']);
    expect(card.marks.back.cloze).toEqual([]);
    expect(card.marks.notes.cloze).toEqual([]);
  });

  it('é o mesmo registro que createCard grava', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);

    const created = await createCard(input);

    expect(await db.cards.get(created.id)).toEqual({ ...newCardRecord(input, NOW), id: created.id });
  });
});
