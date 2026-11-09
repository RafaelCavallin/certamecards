import { DAY } from './dates';
import { liveCards } from './cards';
import { db, type Card, type Deck, type ReviewLog } from './db';
import { countRecentErrors, isDifficultCandidate } from './difficulty';
import { queueCount } from './queue';
import { RETENTION_WINDOW_DAYS, buildMaturity, type Maturity } from './stats';

export interface DeckOverview {
  total: number;
  dueToday: number;
  maturity: Maturity;
  retention30: number | null;
  reviewsTotal: number;
  difficult: number;
  lastReviewAt: number | null;
}

export type DeckSummary = Omit<DeckOverview, 'dueToday'>;

function retentionOf(logs: readonly ReviewLog[], since: number): number | null {
  const recent = logs.filter((log) => log.reviewedAt >= since);
  if (recent.length === 0) return null;
  return recent.filter((log) => log.rating === 'good').length / recent.length;
}

function lastReviewOf(logs: readonly ReviewLog[]): number | null {
  if (logs.length === 0) return null;
  return logs.reduce((latest, log) => Math.max(latest, log.reviewedAt), 0);
}

export function summarizeDeck(cards: Card[], logs: ReviewLog[], now: number): DeckSummary {
  const since = now - RETENTION_WINDOW_DAYS * DAY;
  const recentErrors = countRecentErrors(logs, since);
  return {
    total: cards.length,
    maturity: buildMaturity(cards),
    retention30: retentionOf(logs, since),
    reviewsTotal: logs.length,
    difficult: cards.filter((card) => isDifficultCandidate(card, recentErrors)).length,
    lastReviewAt: lastReviewOf(logs),
  };
}

async function logsOfCards(cards: readonly Card[]): Promise<ReviewLog[]> {
  const ids = cards.map((card) => card.id);
  return db.reviewLogs.where('cardId').anyOf(ids).toArray();
}

export async function loadDeckOverview(deck: Deck, now: number = Date.now()): Promise<DeckOverview> {
  const cards = await liveCards(deck.id).toArray();
  const [logs, dueToday] = await Promise.all([logsOfCards(cards), queueCount(deck)]);
  return { ...summarizeDeck(cards, logs, now), dueToday };
}
