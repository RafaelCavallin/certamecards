import { db } from './db';
import type { KeyValueStorage } from './local-storage';

export const ACCOUNT_NUDGE_CARD_STEPS: readonly number[] = [25, 50, 70];
export const ACCOUNT_NUDGE_MIN_DECKS = 2;
export const ACCOUNT_NUDGE_DISMISSED_KEY = 'certamecards.accountNudgeDismissedLevel';
const NO_LEVEL = 0;
const DECKS_LEVEL = 1;

export interface NudgeFacts {
  cards: number;
  decks: number;
}

export interface NudgeInput {
  signedOut: boolean;
  level: number;
  dismissedLevel: number;
}

export function nudgeLevel(facts: NudgeFacts): number {
  const reached = ACCOUNT_NUDGE_CARD_STEPS.filter((step) => facts.cards >= step).length;
  if (facts.decks < ACCOUNT_NUDGE_MIN_DECKS) return reached;
  return Math.max(reached, DECKS_LEVEL);
}

export function shouldNudgeAccount(input: NudgeInput): boolean {
  return input.signedOut && input.level > input.dismissedLevel;
}

export async function accountNudgeFacts(): Promise<NudgeFacts> {
  const cards = await db.cards.where('deletedAt').equals(0).count();
  const decks = await db.decks.where('deletedAt').equals(0).count();
  return { cards, decks };
}

export function readDismissedLevel(storage: KeyValueStorage | null): number {
  try {
    const level = Number(storage?.getItem(ACCOUNT_NUDGE_DISMISSED_KEY) ?? NO_LEVEL);
    return Number.isInteger(level) && level > NO_LEVEL ? level : NO_LEVEL;
  } catch {
    return NO_LEVEL;
  }
}

export function writeDismissedLevel(storage: KeyValueStorage | null, level: number): void {
  try {
    storage?.setItem(ACCOUNT_NUDGE_DISMISSED_KEY, String(level));
  } catch {
    return;
  }
}
