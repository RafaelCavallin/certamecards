import { State } from 'ts-fsrs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeDeck, makeTaggedCard } from '../../test/card-fixtures';
import { resetDb } from '../../test/db-helpers';
import { DAY } from './dates';
import { db } from './db';
import { countTodayAcrossDecks } from './today-global';

const NOW = new Date(2026, 10, 10, 15).getTime();
const MINUTE = 60_000;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
});

afterEach(async () => {
  vi.useRealTimers();
  await resetDb();
});

describe('countTodayAcrossDecks', () => {
  it('soma a fila de agora e os cartões que voltam ainda hoje em todos os baralhos', async () => {
    await db.decks.bulkAdd([makeDeck('deck-1'), makeDeck('deck-2')]);
    await db.cards.bulkAdd([
      makeTaggedCard('vencido', [], { state: State.Review, due: NOW - DAY }),
      makeTaggedCard('aprendendo', [], { state: State.Learning, due: NOW + 10 * MINUTE }),
      makeTaggedCard('novo', [], { state: State.New, due: NOW }),
      makeTaggedCard('outro-baralho', [], { deckId: 'deck-2', state: State.Learning, due: NOW + 60 * MINUTE }),
    ]);

    expect(await countTodayAcrossDecks(NOW)).toBe(4);
  });

  it('ignora o que vence amanhã, cartões excluídos e baralhos excluídos', async () => {
    await db.decks.bulkAdd([makeDeck('deck-1'), makeDeck('deck-2', 1)]);
    await db.cards.bulkAdd([
      makeTaggedCard('amanha', [], { state: State.Review, due: NOW + DAY }),
      makeTaggedCard('excluido', [], { state: State.Review, due: NOW - DAY, deletedAt: 1 }),
      makeTaggedCard('baralho-excluido', [], { deckId: 'deck-2', state: State.Review, due: NOW - DAY }),
    ]);

    expect(await countTodayAcrossDecks(NOW)).toBe(0);
  });

  it('devolve zero quando não há baralhos', async () => {
    expect(await countTodayAcrossDecks(NOW)).toBe(0);
  });
});
