import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { currentStreak } from './stats-streak';
import { DAY } from './dates';
import { EMPTY_CARD_MARKS } from './text-marks';
import type { Card, ReviewLog } from './db';

const NOW = new Date(2026, 2, 10, 12, 0, 0);

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
    stability: 1,
    difficulty: 1,
    elapsedDays: 0,
    scheduledDays: 1,
    learningSteps: 0,
    reps: 1,
    lapses: 0,
    state: 2,
    createdAt: NOW.getTime() - 10 * DAY,
    updatedAt: NOW.getTime(),
    deletedAt: 0,
    dirty: 0,
    ...overrides,
  };
}

function makeLog(overrides: Partial<ReviewLog> = {}): ReviewLog {
  return {
    id: 'l1',
    cardId: 'c1',
    deckId: 'd1',
    rating: 'good',
    reviewedAt: NOW.getTime(),
    stateBefore: 2,
    scheduledDays: 1,
    durationMs: 1000,
    dirty: 0,
    ...overrides,
  };
}

function iso(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('currentStreak', () => {
  it('devolve zero sem nenhum cartão nem log', () => {
    expect(currentStreak(new Map(), [], [])).toBe(0);
  });

  it('conta os dias seguidos com revisão, incluindo hoje', () => {
    const today = new Date(NOW);
    const yesterday = new Date(NOW.getTime() - DAY);
    const byDay = new Map([
      [iso(today), 3],
      [iso(yesterday), 2],
    ]);
    const card = makeCard();

    expect(currentStreak(byDay, [card], [makeLog()])).toBe(2);
  });

  it('não quebra a sequência por hoje ainda estar em branco', () => {
    const yesterday = new Date(NOW.getTime() - DAY);
    const twoDaysAgo = new Date(NOW.getTime() - 2 * DAY);
    const byDay = new Map([
      [iso(yesterday), 1],
      [iso(twoDaysAgo), 1],
    ]);
    const card = makeCard({ createdAt: NOW.getTime() - 5 * DAY, due: NOW.getTime() + DAY });

    expect(currentStreak(byDay, [card], [makeLog()])).toBe(2);
  });

  it('quebra quando havia cartão vencido num dia sem nenhuma revisão', () => {
    const today = new Date(NOW);
    const byDay = new Map([[iso(today), 1]]);
    const card = makeCard({ createdAt: NOW.getTime() - 5 * DAY, due: NOW.getTime() - 5 * DAY });

    expect(currentStreak(byDay, [card], [makeLog()])).toBe(1);
  });

  it('não quebra num dia em que o cartão já tinha sido reagendado para o futuro', () => {
    const today = new Date(NOW);
    const byDay = new Map([[iso(today), 1]]);
    const card = makeCard({ createdAt: NOW.getTime() - 20 * DAY });
    const rescheduleLog = makeLog({ reviewedAt: NOW.getTime() - 10 * DAY, scheduledDays: 15 });

    expect(currentStreak(byDay, [card], [rescheduleLog])).toBe(1);
  });
});
