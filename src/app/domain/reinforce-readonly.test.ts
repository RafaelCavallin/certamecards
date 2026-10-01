import { State } from 'ts-fsrs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeDeck, makeTaggedCard } from '../../test/card-fixtures';
import { resetDb } from '../../test/db-helpers';
import { db, type ReviewLog } from './db';
import { buildQueue } from './queue';
import { listDifficult } from './difficulty-data';
import { answerReinforce, pickReinforceCards, startReinforce } from './reinforce';
import { computeStats } from './stats';

const NOW = Date.parse('2026-03-09T12:00:00Z');
const DAY = 86_400_000;

function makeLog(cardId: string, reviewedAt: number): ReviewLog {
  return { id: `${cardId}-${reviewedAt}`, cardId, deckId: 'deck-1', rating: 'again', reviewedAt, stateBefore: 2, scheduledDays: 1, durationMs: 1000, dirty: 0 };
}

async function snapshot() {
  const deck = (await db.decks.get('deck-1'))!;
  return {
    tables: [
      await db.decks.toArray(),
      await db.cards.orderBy('id').toArray(),
      await db.reviewLogs.orderBy('id').toArray(),
      await db.settings.toArray(),
      await db.syncState.toArray(),
    ],
    queue: (await buildQueue(deck)).map((card) => card.id),
    stats: await computeStats(deck),
  };
}

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
  await db.decks.add(makeDeck('deck-1'));
  const due = { state: State.Review, due: NOW - DAY, lastReview: NOW - 2 * DAY, reps: 4 };
  await db.cards.bulkAdd([makeTaggedCard('a', [], { ...due, lapses: 2 }), makeTaggedCard('b', [], { ...due, lapses: 3 })]);
  await db.reviewLogs.bulkAdd([makeLog('a', NOW - 3 * DAY), makeLog('b', NOW - 2 * DAY)]);
});

afterEach(async () => {
  vi.useRealTimers();
  await resetDb();
});

describe('sessão de reforço completa', () => {
  it('não altera cartões, histórico, fila nem estatísticas', async () => {
    const before = await snapshot();

    const list = await listDifficult('deck-1');
    const ids = pickReinforceCards(list, () => 0.5);
    const state = ['again', 'good', 'good', 'again', 'good'].reduce(
      (current, rating) => answerReinforce(current, rating as 'again' | 'good'),
      startReinforce(ids),
    );

    expect(state.pending).toEqual([]);
    expect(await snapshot()).toEqual(before);
  });
});
