import { State } from 'ts-fsrs';
import type { ReviewLog } from './db';

export const EXIT_STREAK = 3;

function nextStreak(current: number, log: ReviewLog): number {
  if (log.rating === 'again') return 0;
  return log.stateBefore === State.Review ? current + 1 : current;
}

export function countReviewStreaks(logs: readonly ReviewLog[]): Map<string, number> {
  const streaks = new Map<string, number>();
  const ordered = [...logs].sort((a, b) => a.reviewedAt - b.reviewedAt);
  for (const log of ordered) {
    streaks.set(log.cardId, nextStreak(streaks.get(log.cardId) ?? 0, log));
  }
  return streaks;
}

export function hasLeftDifficult(cardId: string, streaks: ReadonlyMap<string, number>): boolean {
  return (streaks.get(cardId) ?? 0) >= EXIT_STREAK;
}
