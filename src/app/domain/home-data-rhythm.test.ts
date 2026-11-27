import { State } from 'ts-fsrs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDb } from '../../test/db-helpers';
import { makeDeck, makeTaggedCard } from '../../test/card-fixtures';
import { makeLog } from '../../test/backup-fixtures';
import { db } from './db';
import { loadHomeSnapshot } from './home-data';

const NOW = new Date('2026-03-09T12:00:00Z');
const DAY = 86_400_000;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
});

afterEach(async () => {
  vi.useRealTimers();
  await resetDb();
});

describe('loadHomeSnapshot (ritmo)', () => {
  it('resume o ritmo com as revisões de hoje e a previsão a partir de amanhã', async () => {
    await db.cards.bulkAdd([
      makeTaggedCard('a', [], { state: State.Review, due: NOW.getTime() - DAY, stability: 30 }),
      makeTaggedCard('b', [], { state: State.Review, due: NOW.getTime() + DAY, stability: 30 }),
    ]);
    await db.reviewLogs.bulkAdd([
      makeLog({ id: 'l1', cardId: 'a', reviewedAt: NOW.getTime() - 60_000 }),
      makeLog({ id: 'l2', cardId: 'a', reviewedAt: NOW.getTime() - 2 * DAY }),
    ]);

    const { rhythm } = await loadHomeSnapshot(makeDeck('deck-1'), []);

    expect(rhythm.reviewedToday).toBe(1);
    expect(rhythm.forecast).toHaveLength(7);
    expect(rhythm.forecast[0].count).toBe(1);
    expect(rhythm.forecast.some((day) => day.day === 'hoje')).toBe(false);
  });

  it('soma em todos os baralhos o que falta estudar hoje, não só o do baralho ativo', async () => {
    await db.decks.bulkAdd([makeDeck('deck-1'), makeDeck('deck-2')]);
    await db.cards.bulkAdd([
      makeTaggedCard('a', [], { state: State.Review, due: NOW.getTime() - DAY, stability: 30 }),
      makeTaggedCard('b', [], { deckId: 'deck-2', state: State.Review, due: NOW.getTime() - DAY, stability: 30 }),
      makeTaggedCard('c', [], { deckId: 'deck-2', state: State.Learning, due: NOW.getTime() + 60_000 }),
    ]);

    const snapshot = await loadHomeSnapshot(makeDeck('deck-1'), []);

    expect(snapshot.queueSize).toBe(1);
    expect(snapshot.todayTotal).toBe(3);
  });
});
