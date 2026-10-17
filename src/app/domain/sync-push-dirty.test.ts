import { afterEach, describe, expect, it } from 'vitest';
import { db, type Card } from './db';
import { resetDb } from '../../test/db-helpers';
import { chunk, clearDirty, type DirtyTable } from './sync-push-dirty';
import { EMPTY_CARD_MARKS } from './text-marks';

function makeCard(overrides: Partial<Card> = {}): Card {
  return { id: 'card-1', deckId: 'deck-1', front: 'F', back: 'B', notes: '', marks: EMPTY_CARD_MARKS, tags: [], due: 1, stability: 1, difficulty: 1, elapsedDays: 0, scheduledDays: 1, learningSteps: 0, reps: 0, lapses: 0, state: 0, createdAt: 1, updatedAt: 1, deletedAt: 0, dirty: 1, ...overrides };
}

afterEach(async () => resetDb());

describe('chunk', () => {
  it('divide a lista em lotes de no máximo 200 itens', () => {
    const items = Array.from({ length: 201 }, (_, index) => index);

    const result = chunk(items);

    expect(result).toHaveLength(2);
    expect(result[0]).toHaveLength(200);
    expect(result[1]).toHaveLength(1);
  });
});

describe('clearDirty', () => {
  it('limpa a flag dirty da linha enviada sem alteração', async () => {
    const sent = makeCard();
    await db.cards.add(sent);

    await clearDirty(db.cards as unknown as DirtyTable<Card>, [sent]);

    expect((await db.cards.get('card-1'))?.dirty).toBe(0);
  });

  it('mantém dirty quando o updatedAt mudou em trânsito (CAS)', async () => {
    const sentSnapshot = makeCard();
    await db.cards.add(makeCard({ updatedAt: 2 }));

    await clearDirty(db.cards as unknown as DirtyTable<Card>, [sentSnapshot]);

    expect((await db.cards.get('card-1'))?.dirty).toBe(1);
  });
});
