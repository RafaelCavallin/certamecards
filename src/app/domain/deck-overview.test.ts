import { afterEach, describe, expect, it } from 'vitest';
import { makeDeck, makeTaggedCard } from '../../test/card-fixtures';
import { resetDb } from '../../test/db-helpers';
import { DAY } from './dates';
import { db, type Card, type ReviewLog } from './db';
import { loadDeckOverview, summarizeDeck } from './deck-overview';

const NOW = Date.parse('2026-03-09T12:00:00Z');
const REVIEW_STATE = 2;
const FIRM_STABILITY = 30;

afterEach(async () => resetDb());

function makeLog(cardId: string, reviewedAt: number, rating: ReviewLog['rating'] = 'good'): ReviewLog {
  return { id: `${cardId}-${reviewedAt}-${rating}`, cardId, deckId: 'deck-1', rating, reviewedAt, stateBefore: 2, scheduledDays: 1, durationMs: 1000, dirty: 0 };
}

function manyLogs(cardId: string, count: number, rating: ReviewLog['rating']): ReviewLog[] {
  return Array.from({ length: count }, (_, n) => makeLog(cardId, NOW - (n + 1) * 1000, rating));
}

describe('summarizeDeck', () => {
  it('baralho vazio não tem retenção nem última revisão', () => {
    const summary = summarizeDeck([], [], NOW);

    expect(summary).toEqual({
      total: 0,
      maturity: { new: 0, learning: 0, mature: 0 },
      retention30: null,
      reviewsTotal: 0,
      difficult: 0,
      lastReviewAt: null,
    });
  });

  it('calcula a retenção só com as revisões dos últimos 30 dias', () => {
    const logs = [
      makeLog('a', NOW - 1000, 'good'),
      makeLog('a', NOW - 2000, 'again'),
      makeLog('a', NOW - 31 * DAY, 'again'),
    ];

    const summary = summarizeDeck([makeTaggedCard('a', [])], logs, NOW);

    expect(summary.retention30).toBe(0.5);
    expect(summary.reviewsTotal).toBe(3);
  });

  it('informa a revisão mais recente', () => {
    const logs = [makeLog('a', NOW - 5000), makeLog('a', NOW - 1000), makeLog('a', NOW - 9000)];

    expect(summarizeDeck([makeTaggedCard('a', [])], logs, NOW).lastReviewAt).toBe(NOW - 1000);
  });

  it('conta como difícil a partir de 3 pontos', () => {
    const cards = [makeTaggedCard('hard', []), makeTaggedCard('easy', [])];
    const logs = [...manyLogs('hard', 3, 'again'), ...manyLogs('easy', 2, 'again')];

    expect(summarizeDeck(cards, logs, NOW).difficult).toBe(1);
  });

  it('separa os cartões por maturidade', () => {
    const cards: Card[] = [
      makeTaggedCard('n', []),
      makeTaggedCard('l', [], { state: REVIEW_STATE, stability: 1 }),
      makeTaggedCard('m', [], { state: REVIEW_STATE, stability: FIRM_STABILITY }),
    ];

    expect(summarizeDeck(cards, [], NOW).maturity).toEqual({ new: 1, learning: 1, mature: 1 });
  });
});

describe('loadDeckOverview', () => {
  it('ignora cartões excluídos e de outro baralho', async () => {
    await db.cards.bulkAdd([
      makeTaggedCard('a', []),
      makeTaggedCard('gone', [], { deletedAt: 5 }),
      makeTaggedCard('other', [], { deckId: 'deck-2' }),
    ]);
    await db.reviewLogs.bulkAdd([makeLog('a', NOW - 1000), makeLog('gone', NOW - 1000), makeLog('other', NOW - 1000)]);

    const overview = await loadDeckOverview(makeDeck('deck-1'), NOW);

    expect(overview.total).toBe(1);
    expect(overview.reviewsTotal).toBe(1);
  });

  it('conta no baralho atual as revisões de um cartão movido', async () => {
    await db.cards.add(makeTaggedCard('moved', [], { deckId: 'deck-2' }));
    await db.reviewLogs.add(makeLog('moved', NOW - 1000));

    const overview = await loadDeckOverview(makeDeck('deck-2'), NOW);

    expect(overview.reviewsTotal).toBe(1);
  });

  it('limita os cartões novos de hoje por "novos por dia"', async () => {
    const cards = Array.from({ length: 15 }, (_, n) => makeTaggedCard(`c${n}`, [], { createdAt: n + 1 }));
    await db.cards.bulkAdd(cards);

    const overview = await loadDeckOverview(makeDeck('deck-1'), NOW);

    expect(overview.dueToday).toBe(10);
    expect(overview.total).toBe(15);
  });
});
