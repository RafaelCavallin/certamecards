import { State } from 'ts-fsrs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDb } from '../../test/db-helpers';
import { computeStats } from './stats';
import { DAY, iso } from './dates';
import { db, type Card, type Deck } from './db';
import { EMPTY_CARD_MARKS } from './text-marks';

const NOW = new Date(2026, 2, 10, 12, 0, 0);

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

function makeCard(overrides: Partial<Card> = {}): Card {
  return {
    id: 'c1',
    deckId: 'd1',
    front: 'Frente',
    back: 'Verso',
    notes: '',
    marks: EMPTY_CARD_MARKS,
    tags: [],
    due: NOW.getTime(),
    stability: 30,
    difficulty: 1,
    elapsedDays: 0,
    scheduledDays: 1,
    learningSteps: 0,
    reps: 1,
    lapses: 0,
    state: State.Review,
    createdAt: NOW.getTime() - 5 * DAY,
    updatedAt: NOW.getTime(),
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

describe('computeStats', () => {
  it('calcula a retenção de 30 dias com 8 acertos em 10 revisões', async () => {
    await db.cards.add(makeCard());
    const logs = Array.from({ length: 10 }, (_, i) => ({
      id: `l${i}`,
      cardId: 'c1',
      deckId: 'd1',
      rating: (i < 8 ? 'good' : 'again') as 'good' | 'again',
      reviewedAt: NOW.getTime() - i * 1000,
      stateBefore: State.Review,
      scheduledDays: 1,
      durationMs: 1000,
      dirty: 0 as const,
    }));
    await db.reviewLogs.bulkAdd(logs);

    const stats = await computeStats(makeDeck());

    expect(stats.retention30).toBe(0.8);
    expect(stats.byDay.get(iso(NOW))).toBe(10);
    expect(stats.reviewsTotal).toBe(10);
    expect(stats.reviews30).toBe(10);
  });

  it('devolve retenção nula sem revisões nos últimos 30 dias', async () => {
    const stats = await computeStats(makeDeck());

    expect(stats.retention30).toBeNull();
    expect(stats.reviewsTotal).toBe(0);
  });

  it('ignora revisões fora da janela de 30 dias na retenção', async () => {
    await db.reviewLogs.add({
      id: 'antigo',
      cardId: 'c1',
      deckId: 'd1',
      rating: 'again',
      reviewedAt: NOW.getTime() - 40 * DAY,
      stateBefore: State.Review,
      scheduledDays: 1,
      durationMs: 1000,
      dirty: 0,
    });

    const stats = await computeStats(makeDeck());

    expect(stats.retention30).toBeNull();
    expect(stats.reviewsTotal).toBe(1);
  });

  it('monta a previsão de 14 dias contando só os vencimentos futuros', async () => {
    await db.cards.bulkAdd([
      makeCard({ id: 'hoje', due: NOW.getTime() }),
      makeCard({ id: 'amanha', due: NOW.getTime() + DAY }),
      makeCard({ id: 'novo', state: State.New, due: NOW.getTime() }),
    ]);

    const stats = await computeStats(makeDeck());

    expect(stats.forecast).toHaveLength(14);
    expect(stats.forecast[0]).toMatchObject({ day: 'hoje', count: 1 });
    expect(stats.forecast[1].count).toBe(1);
  });

  it('classifica a maturidade em novos, em aprendizado e firmados', async () => {
    await db.cards.bulkAdd([
      makeCard({ id: 'novo', state: State.New }),
      makeCard({ id: 'aprendendo', state: State.Learning }),
      makeCard({ id: 'jovem', state: State.Review, stability: 5 }),
      makeCard({ id: 'firmado', state: State.Review, stability: 30 }),
    ]);

    const stats = await computeStats(makeDeck());

    expect(stats.maturity).toEqual({ new: 1, learning: 2, mature: 1 });
  });

  it('só considera cartões vivos do baralho ativo na maturidade', async () => {
    await db.cards.bulkAdd([
      makeCard({ id: 'vivo', deckId: 'd1' }),
      makeCard({ id: 'excluido', deckId: 'd1', deletedAt: 500 }),
      makeCard({ id: 'outro-baralho', deckId: 'd2' }),
    ]);

    const stats = await computeStats(makeDeck());

    expect(stats.maturity.mature).toBe(1);
  });
});
