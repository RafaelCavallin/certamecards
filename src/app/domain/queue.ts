import { State } from 'ts-fsrs';
import { liveCards } from './cards';
import { startOfToday } from './dates';
import { db, type Card, type Deck } from './db';

const YOUNG_STABILITY_DAYS = 21;
const FALLBACK_REVIEW_MS = 8000;
const MAX_REVIEW_MS = 60_000;
const RECENT_LOGS_LIMIT = 50;

/** Cartões "young": ainda não consolidados. Base do limite inteligente. */
function isYoung(card: Card): boolean {
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

/**
 * Fila do dia: vencidos primeiro por data; novos entram apenas na
 * velocidade em que os anteriores são consolidados, limitados por
 * "novos por dia" e pelo teto de não firmados.
 */
export async function buildQueue(deck: Deck): Promise<Card[]> {
  const all = await liveCards(deck.id).toArray();
  const now = Date.now();
  const due = all
    .filter((card) => card.state !== State.New && card.due <= now)
    .sort((a, b) => a.due - b.due);
  const youngCount = all.filter(isYoung).length;
  const introducedToday = await countIntroducedToday(deck.id);
  const roomByYoung = Math.max(0, deck.youngLimit - youngCount);
  const roomByDaily = Math.max(0, deck.newCardsPerDay - introducedToday);
  const room = Math.min(roomByYoung, roomByDaily);
  const fresh = all
    .filter((card) => card.state === State.New)
    .sort((a, b) => a.createdAt - b.createdAt)
    .slice(0, room);
  return interleave(due, fresh);
}

export async function queueCount(deck: Deck): Promise<number> {
  return (await buildQueue(deck)).length;
}

/** Soma de vários baralhos — o total pendente que o indicador do cabeçalho mostra (RF20). */
export async function totalQueueCount(decks: Deck[]): Promise<number> {
  const sizes = await Promise.all(decks.map(queueCount));
  return sizes.reduce((sum, n) => sum + n, 0);
}

/** Média móvel do tempo por revisão — só para a estimativa da Home. */
export async function estimateMinutes(queueSize: number): Promise<number> {
  const recent = await db.reviewLogs.orderBy('reviewedAt').reverse().limit(RECENT_LOGS_LIMIT).toArray();
  const average = recent.length
    ? recent.reduce((sum, log) => sum + Math.min(log.durationMs || FALLBACK_REVIEW_MS, MAX_REVIEW_MS), 0) /
      recent.length
    : FALLBACK_REVIEW_MS;
  return Math.max(1, Math.round((queueSize * average) / 60_000));
}
