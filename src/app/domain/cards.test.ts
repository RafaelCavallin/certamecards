import { afterEach, describe, expect, it } from 'vitest';
import { resetDb } from '../../test/db-helpers';
import { createCard, deleteCards, liveCards, updateCardContent } from './cards';
import { db } from './db';
import { EMPTY_CARD_MARKS, type CardMarks } from './text-marks';

const marksWithEmphasis: CardMarks = {
  ...EMPTY_CARD_MARKS,
  front: { cloze: [{ start: 0, end: 3 }], emphasis: [] },
};

afterEach(resetDb);

describe('createCard', () => {
  it('grava um cartão novo com estado FSRS inicial e dirty=1', async () => {
    const card = await createCard({
      deckId: 'd1',
      front: '  O mandato é de quatro anos.  ',
      back: 'CF/88, art. 82.',
      notes: '',
      marks: EMPTY_CARD_MARKS,
    });

    expect(card.front).toBe('O mandato é de quatro anos.');
    expect(card.reps).toBe(0);
    expect(card.lapses).toBe(0);
    expect(card.state).toBe(0);
    expect(card.tags).toEqual([]);
    expect(card.dirty).toBe(1);
    expect(await db.cards.get(card.id)).toBeDefined();
  });
});

describe('updateCardContent', () => {
  it('muda texto e marcas sem tocar no estado FSRS nem criar log', async () => {
    const created = await createCard({
      deckId: 'd1',
      front: 'Frente original',
      back: 'Verso original',
      notes: '',
      marks: EMPTY_CARD_MARKS,
    });
    const before = (await db.cards.get(created.id))!;

    await updateCardContent(created.id, {
      front: 'Frente corrigida',
      back: 'Verso corrigido',
      notes: 'Nova nota',
      marks: marksWithEmphasis,
    });

    const after = (await db.cards.get(created.id))!;
    expect(after.front).toBe('Frente corrigida');
    expect(after.back).toBe('Verso corrigido');
    expect(after.notes).toBe('Nova nota');
    expect(after.marks).toEqual(marksWithEmphasis);
    expect(after.due).toBe(before.due);
    expect(after.stability).toBe(before.stability);
    expect(after.reps).toBe(before.reps);
    expect(after.state).toBe(before.state);
    expect(await db.reviewLogs.count()).toBe(0);
  });
});

describe('deleteCards', () => {
  it('tombstona todos os ids informados', async () => {
    const a = await createCard({ deckId: 'd1', front: 'A', back: 'A', notes: '', marks: EMPTY_CARD_MARKS });
    const b = await createCard({ deckId: 'd1', front: 'B', back: 'B', notes: '', marks: EMPTY_CARD_MARKS });

    await deleteCards([a.id, b.id]);

    expect((await db.cards.get(a.id))!.deletedAt).toBeGreaterThan(0);
    expect((await db.cards.get(b.id))!.deletedAt).toBeGreaterThan(0);
  });
});

describe('liveCards', () => {
  it('devolve só os cartões vivos do baralho pedido', async () => {
    const alive = await createCard({ deckId: 'd1', front: 'A', back: 'A', notes: '', marks: EMPTY_CARD_MARKS });
    const dead = await createCard({ deckId: 'd1', front: 'B', back: 'B', notes: '', marks: EMPTY_CARD_MARKS });
    await createCard({ deckId: 'outro', front: 'C', back: 'C', notes: '', marks: EMPTY_CARD_MARKS });
    await deleteCards([dead.id]);

    const ids = await liveCards('d1').primaryKeys();

    expect(ids).toEqual([alive.id]);
  });
});
