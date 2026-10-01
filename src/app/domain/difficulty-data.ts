import { liveCards } from './cards';
import { db, type Card, type ReviewLog } from './db';
import {
  RECENT_ERROR_WINDOW_MS,
  countRecentErrors,
  isDifficultCandidate,
  rankDifficult,
  summarizeErrorHistory,
  type DifficultCard,
} from './difficulty';

interface Candidates {
  candidates: Card[];
  recent: Map<string, number>;
}

async function loadCandidates(deckId: string, now: number): Promise<Candidates> {
  const since = now - RECENT_ERROR_WINDOW_MS;
  const [cards, logs] = await Promise.all([
    liveCards(deckId).toArray(),
    db.reviewLogs.where('reviewedAt').aboveOrEqual(since).toArray(),
  ]);
  const recent = countRecentErrors(logs, since);
  return { candidates: cards.filter((card) => isDifficultCandidate(card, recent)), recent };
}

async function loadLogsOf(cardIds: readonly string[]): Promise<ReviewLog[]> {
  const perCard = await db.transaction('r', db.reviewLogs, () =>
    Promise.all(cardIds.map((id) => db.reviewLogs.where('cardId').equals(id).toArray())),
  );
  return perCard.flat();
}

export async function listDifficult(deckId: string, now: number = Date.now()): Promise<DifficultCard[]> {
  const { candidates, recent } = await loadCandidates(deckId, now);
  const ids = candidates.map((card) => card.id);
  const logs = await loadLogsOf(ids);
  return rankDifficult({ cards: candidates, recent, history: summarizeErrorHistory(logs) });
}

export async function countDifficult(deckId: string, now: number = Date.now()): Promise<number> {
  return (await loadCandidates(deckId, now)).candidates.length;
}

export async function liveCardIds(deckId: string): Promise<string[]> {
  return (await liveCards(deckId).primaryKeys()) as string[];
}
