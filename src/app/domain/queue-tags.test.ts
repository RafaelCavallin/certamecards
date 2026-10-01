import { State } from 'ts-fsrs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDb } from '../../test/db-helpers';
import { makeTaggedCard } from '../../test/card-fixtures';
import { db, type Card, type Deck } from './db';
import { buildQueue } from './queue';
import { tagQueueCounts } from './queue-tags';

const NOW = new Date('2026-03-09T12:00:00Z');
const DAY = 86_400_000;

function dueCard(id: string, tags: string[]): Card {
  return makeTaggedCard(id, tags, { state: State.Review, due: NOW.getTime() - DAY, stability: 30 });
}

function freshCard(id: string, tags: string[], createdAt = 1): Card {
  return makeTaggedCard(id, tags, { state: State.New, createdAt });
}

function deckWith(overrides: Partial<Deck> = {}): Deck {
  return { id: 'deck-1', name: 'D', newCardsPerDay: 20, youngLimit: 50, requestRetention: 0.9, createdAt: 1, updatedAt: 1, deletedAt: 0, dirty: 0, ...overrides };
}

function manyDue(prefix: string, count: number, tags: string[]): Card[] {
  return Array.from({ length: count }, (_, index) => dueCard(`${prefix}${index}`, tags));
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
});

afterEach(async () => {
  vi.useRealTimers();
  await resetDb();
});

describe('buildQueue com filtro de etiquetas', () => {
  it('restringe a fila às etiquetas escolhidas (OU)', async () => {
    await db.cards.bulkAdd([
      ...manyDue('c', 5, ['CESPE']),
      ...manyDue('f', 4, ['FGV']),
      ...manyDue('o', 2, ['outra']),
      ...manyDue('s', 29, []),
    ]);

    const only = await buildQueue(deckWith(), { tagKeys: ['cespe'] });
    const either = await buildQueue(deckWith(), { tagKeys: ['cespe', 'fgv'] });
    const none = await buildQueue(deckWith(), { tagKeys: [] });

    expect([only.length, either.length, none.length]).toEqual([5, 9, 40]);
  });

  it('aplica o limite de novos depois do filtro', async () => {
    const fresh = Array.from({ length: 30 }, (_, index) => freshCard(`n${index}`, ['CESPE'], index));
    await db.cards.bulkAdd([...fresh, freshCard('x', ['FGV'], 99)]);

    const queue = await buildQueue(deckWith({ newCardsPerDay: 10 }), { tagKeys: ['cespe'] });

    expect(queue.map((card) => card.id)).toEqual(fresh.slice(0, 10).map((card) => card.id));
  });
});

describe('tagQueueCounts', () => {
  it('bate com buildQueue de uma etiqueta, inclusive com o limite de novos', async () => {
    await db.cards.bulkAdd([
      ...manyDue('c', 3, ['CESPE']),
      ...Array.from({ length: 6 }, (_, index) => freshCard(`nc${index}`, ['CESPE'], index)),
      ...Array.from({ length: 6 }, (_, index) => freshCard(`nf${index}`, ['FGV'], index)),
    ]);
    const deck = deckWith({ newCardsPerDay: 4 });

    const counts = await tagQueueCounts(deck, ['cespe', 'fgv', 'inexistente']);

    for (const [key, count] of counts) {
      expect(count).toBe((await buildQueue(deck, { tagKeys: [key] })).length);
    }
    expect([...counts.values()]).toEqual([7, 4, 0]);
  });
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
