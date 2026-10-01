import { State } from 'ts-fsrs';
import { startOfToday } from './dates';
import { db, type Card } from './db';

const YOUNG_STABILITY_DAYS = 21;

/** Cartões "young": ainda não consolidados. Base do limite inteligente. */
export function isYoung(card: Card): boolean {
  if (card.state === State.Learning || card.state === State.Relearning) return true;
  return card.state === State.Review && card.stability < YOUNG_STABILITY_DAYS;
}

/** Novos já respondidos hoje neste baralho — desconta do teto diário. */
export async function countIntroducedToday(deckId: string): Promise<number> {
  const logs = await db.reviewLogs.where('reviewedAt').above(startOfToday()).toArray();
  const firstReviews = logs.filter((log) => log.stateBefore === State.New);
  if (firstReviews.length === 0) return 0;
  const ids = [...new Set(firstReviews.map((log) => log.cardId))];
  const cards = await db.cards.bulkGet(ids);
  return cards.filter((card) => card && card.deckId === deckId && card.deletedAt === 0).length;
}

/** Distribui os novos ao longo da sessão em vez de empilhá-los no fim. */
export function interleave(due: Card[], fresh: Card[]): Card[] {
  if (fresh.length === 0) return due;
  if (due.length === 0) return fresh;
  const out: Card[] = [];
  const step = Math.max(1, Math.floor(due.length / fresh.length));
  let freshIndex = 0;
  due.forEach((card, i) => {
    out.push(card);
    if (i % step === step - 1 && freshIndex < fresh.length) out.push(fresh[freshIndex++]);
  });
  while (freshIndex < fresh.length) out.push(fresh[freshIndex++]);
  return out;
}
