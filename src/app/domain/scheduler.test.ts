import { createEmptyCard, State } from 'ts-fsrs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDb } from '../../test/db-helpers';
import { answer } from './scheduler';
import { db, type Card, type Deck } from './db';
import { EMPTY_CARD_MARKS } from './text-marks';

const NOW = new Date('2026-03-09T12:00:00Z');
const DAY = 86_400_000;

function makeCard(overrides: Partial<Card> = {}): Card {
  return {
    id: 'c1',
    deckId: 'd1',
    front: 'O mandato é de quatro anos',
    back: 'CF/88, art. 82',
    notes: '',
    marks: EMPTY_CARD_MARKS,
    tags: [],
    due: NOW.getTime() - DAY,
    stability: 10,
    difficulty: 5,
    elapsedDays: 1,
    scheduledDays: 1,
    learningSteps: 0,
    reps: 3,
    lapses: 0,
    state: State.Review,
    lastReview: NOW.getTime() - DAY,
    createdAt: 1000,
    updatedAt: 1000,
    deletedAt: 0,
    dirty: 0,
    ...overrides,
  };
}

function makeDeck(overrides: Partial<Deck> = {}): Deck {
  return {
    id: 'd1',
    name: 'Constitucional',
    newCardsPerDay: 20,
    youngLimit: 50,
    requestRetention: 0.9,
    createdAt: 1000,
    updatedAt: 1000,
    deletedAt: 0,
    dirty: 0,
    ...overrides,
  };
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
});

afterEach(async () => {
  vi.useRealTimers();
  await resetDb();
});

describe('answer', () => {
  it('grava o novo agendamento no cartão e marca dirty', async () => {
    const card = makeCard();
    await db.cards.add(card);

    await answer({ card, deck: makeDeck(), rating: 'good', durationMs: 4200 });

    const stored = (await db.cards.get('c1'))!;
    expect(stored.due).toBeGreaterThan(NOW.getTime());
    expect(stored.reps).toBe(card.reps + 1);
    expect(stored.lastReview).toBe(NOW.getTime());
    expect(stored.updatedAt).toBe(NOW.getTime());
    expect(stored.dirty).toBe(1);
  });

  it('registra o log da revisão com o baralho denormalizado e a duração', async () => {
    const card = makeCard();
    await db.cards.add(card);

    await answer({ card, deck: makeDeck(), rating: 'again', durationMs: 9000 });

    const log = (await db.reviewLogs.toArray())[0];
    expect(log).toMatchObject({
      cardId: 'c1',
      deckId: 'd1',
      rating: 'again',
      reviewedAt: NOW.getTime(),
      stateBefore: State.Review,
      durationMs: 9000,
      dirty: 1,
    });
  });

  it('agenda "again" para antes de "good" a partir do mesmo estado', async () => {
    const card = makeCard();
    await db.cards.bulkAdd([card, makeCard({ id: 'c2' })]);

    await answer({ card, deck: makeDeck(), rating: 'again', durationMs: 1000 });
    await answer({ card: makeCard({ id: 'c2' }), deck: makeDeck(), rating: 'good', durationMs: 1000 });

    const again = (await db.cards.get('c1'))!;
    const good = (await db.cards.get('c2'))!;
    expect(again.due).toBeLessThan(good.due);
    expect(again.lapses).toBe(1);
    expect(good.lapses).toBe(0);
  });

  it('leva o cartão novo para fora do estado New e grava learningSteps', async () => {
    const empty = createEmptyCard(NOW);
    const card = makeCard({
      state: empty.state,
      reps: empty.reps,
      stability: empty.stability,
      difficulty: empty.difficulty,
      learningSteps: empty.learning_steps,
      lastReview: undefined,
    });
    await db.cards.add(card);

    await answer({ card, deck: makeDeck(), rating: 'good', durationMs: 1000 });

    const stored = (await db.cards.get('c1'))!;
    expect(stored.state).not.toBe(State.New);
    expect(typeof stored.learningSteps).toBe('number');
  });

  it('usa uma instância diferente do FSRS por retenção alvo do baralho', async () => {
    const relaxed = makeCard({ id: 'relaxado' });
    const strict = makeCard({ id: 'exigente' });
    await db.cards.bulkAdd([relaxed, strict]);

    await answer({ card: relaxed, deck: makeDeck({ requestRetention: 0.7 }), rating: 'good', durationMs: 1000 });
    await answer({ card: strict, deck: makeDeck({ requestRetention: 0.97 }), rating: 'good', durationMs: 1000 });

    const relaxedAfter = (await db.cards.get('relaxado'))!;
    const strictAfter = (await db.cards.get('exigente'))!;
    expect(strictAfter.scheduledDays).toBeLessThan(relaxedAfter.scheduledDays);
  });
});
