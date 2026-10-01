import type { DifficultCard } from './difficulty';
import type { BinaryRating } from './scheduler';

export const REINFORCE_LIMIT = 30;

export interface ReinforceState {
  readonly pending: readonly string[];
  readonly cleared: readonly string[];
  readonly misses: Readonly<Record<string, number>>;
}

export interface MissedCard {
  id: string;
  misses: number;
}

export interface ReinforceSummary {
  total: number;
  firstTry: number;
  missed: MissedCard[];
}

function shuffle(ids: readonly string[], random: () => number): string[] {
  const out = [...ids];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function pickReinforceCards(list: readonly DifficultCard[], random: () => number): string[] {
  return shuffle(list.slice(0, REINFORCE_LIMIT).map((item) => item.card.id), random);
}

export function startReinforce(ids: readonly string[]): ReinforceState {
  return { pending: [...ids], cleared: [], misses: {} };
}

export function answerReinforce(state: ReinforceState, rating: BinaryRating): ReinforceState {
  const [current, ...rest] = state.pending;
  if (current === undefined) return state;
  if (rating === 'good') return { ...state, pending: rest, cleared: [...state.cleared, current] };
  const misses = { ...state.misses, [current]: (state.misses[current] ?? 0) + 1 };
  return { ...state, pending: [...rest, current], misses };
}

export function dropMissing(state: ReinforceState, alive: ReadonlySet<string>): ReinforceState {
  return { ...state, pending: state.pending.filter((id) => alive.has(id)) };
}

export function reinforceProgress(state: ReinforceState): { done: number; total: number } {
  return { done: state.cleared.length, total: state.cleared.length + state.pending.length };
}

export function summarizeReinforce(state: ReinforceState): ReinforceSummary {
  const missed = state.cleared
    .filter((id) => (state.misses[id] ?? 0) > 0)
    .map((id) => ({ id, misses: state.misses[id] }));
  const order = Object.keys(state.misses);
  missed.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  return { total: state.cleared.length, firstTry: state.cleared.length - missed.length, missed };
}
