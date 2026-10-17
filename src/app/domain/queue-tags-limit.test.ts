import { State } from 'ts-fsrs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDb } from '../../test/db-helpers';
import { makeTaggedCard } from '../../test/card-fixtures';
import { db, type Card, type Deck } from './db';
import { buildQueue } from './queue';

const NOW = new Date('2026-03-09T12:00:00Z');
const DAY = 86_400_000;

function freshCard(id: string, tags: string[], createdAt = 1): Card {
  return makeTaggedCard(id, tags, { state: State.New, createdAt });
}

function deckWith(overrides: Partial<Deck> = {}): Deck {
  return { id: 'deck-1', name: 'D', newCardsPerDay: 20, youngLimit: 50, requestRetention: 0.9, createdAt: 1, updatedAt: 1, deletedAt: 0, dirty: 0, ...overrides };
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
});

afterEach(async () => {
  vi.useRealTimers();
  await resetDb();
});


describe('limite diário com filtro', () => {
  it('novos estudados com filtro consomem o limite do dia', async () => {
    const fresh = Array.from({ length: 30 }, (_, index) => freshCard(`n${index}`, ['CESPE'], index));
    await db.cards.bulkAdd(fresh);
    const logs = fresh.slice(0, 10).map((card) => ({
      id: `l-${card.id}`, cardId: card.id, deckId: 'deck-1', rating: 'good' as const,
      reviewedAt: NOW.getTime() - 1000, stateBefore: State.New, scheduledDays: 1, durationMs: 1000, dirty: 0 as const,
    }));
    await db.reviewLogs.bulkAdd(logs);
    await db.cards.bulkPut(fresh.slice(0, 10).map((card) => ({ ...card, state: State.Review, due: NOW.getTime() + DAY })));

    const queue = await buildQueue(deckWith({ newCardsPerDay: 10 }));

    expect(queue.filter((card) => card.state === State.New)).toEqual([]);
  });
});
