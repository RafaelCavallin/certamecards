import { DAY } from './dates';
import type { Card, ReviewLog } from './db';
import { summarizeTags } from './tag-catalog';
import { hasAnyTag } from './tag-filter';
import type { TagSummary } from './tags';

export const LAPSE_WEIGHT = 2;
export const RECENT_ERROR_WINDOW_MS = 30 * DAY;
export const DIFFICULT_THRESHOLD = 3;

export interface ErrorHistory {
  total: number;
  lastAt: number | null;
}

export interface DifficultCard {
  card: Card;
  score: number;
  recentErrors: number;
  totalErrors: number;
  lastErrorAt: number | null;
}

export interface RankInput {
  cards: readonly Card[];
  recent: ReadonlyMap<string, number>;
  history: ReadonlyMap<string, ErrorHistory>;
}

export function difficultyScore(input: { lapses: number; recentErrors: number }): number {
  return LAPSE_WEIGHT * input.lapses + input.recentErrors;
}

export function countRecentErrors(logs: readonly ReviewLog[], since: number): Map<string, number> {
  const counts = new Map<string, number>();
  for (const log of logs) {
    if (log.rating !== 'again' || log.reviewedAt < since) continue;
    counts.set(log.cardId, (counts.get(log.cardId) ?? 0) + 1);
  }
  return counts;
}

export function summarizeErrorHistory(logs: readonly ReviewLog[]): Map<string, ErrorHistory> {
  const history = new Map<string, ErrorHistory>();
  for (const log of logs) {
    if (log.rating !== 'again') continue;
    const current = history.get(log.cardId);
    const lastAt = Math.max(current?.lastAt ?? log.reviewedAt, log.reviewedAt);
    history.set(log.cardId, { total: (current?.total ?? 0) + 1, lastAt });
  }
  return history;
}

function scoreOf(card: Card, recent: ReadonlyMap<string, number>): number {
  return difficultyScore({ lapses: card.lapses, recentErrors: recent.get(card.id) ?? 0 });
}

export function isDifficultCandidate(card: Card, recent: ReadonlyMap<string, number>): boolean {
  return card.deletedAt === 0 && scoreOf(card, recent) >= DIFFICULT_THRESHOLD;
}

function compareDifficult(a: DifficultCard, b: DifficultCard): number {
  if (a.score !== b.score) return b.score - a.score;
  const lastA = a.lastErrorAt ?? -Infinity;
  const lastB = b.lastErrorAt ?? -Infinity;
  if (lastA !== lastB) return lastB - lastA;
  return a.card.createdAt - b.card.createdAt;
}

export function rankDifficult(input: RankInput): DifficultCard[] {
  return input.cards
    .filter((card) => isDifficultCandidate(card, input.recent))
    .map((card) => ({
      card,
      score: scoreOf(card, input.recent),
      recentErrors: input.recent.get(card.id) ?? 0,
      totalErrors: input.history.get(card.id)?.total ?? 0,
      lastErrorAt: input.history.get(card.id)?.lastAt ?? null,
    }))
    .sort(compareDifficult);
}

export function filterDifficultByTags(list: readonly DifficultCard[], keys: readonly string[]): DifficultCard[] {
  if (keys.length === 0) return [...list];
  const wanted = new Set(keys);
  return list.filter((item) => hasAnyTag(item.card, wanted));
}

export function difficultTagOptions(list: readonly DifficultCard[]): TagSummary[] {
  return summarizeTags(list.map((item) => item.card));
}
