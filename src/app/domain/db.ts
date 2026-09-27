import Dexie, { type EntityTable } from 'dexie';
import { trackDirty } from './dirty-tracking';
import type { CardMarks } from './text-marks';

export type FsrsState = 0 | 1 | 2 | 3;

export interface Deck {
  id: string;
  name: string;
  newCardsPerDay: number;
  youngLimit: number;
  requestRetention: number;
  fsrsParams?: number[];
  paramsOptimizedAt?: number;
  createdAt: number;
  updatedAt: number;
  deletedAt: number;
  dirty: 0 | 1;
}

export interface Card {
  id: string;
  deckId: string;
  front: string;
  back: string;
  notes: string;
  marks: CardMarks;
  tags: string[];
  due: number;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  learningSteps: number;
  reps: number;
  lapses: number;
  state: FsrsState;
  lastReview?: number;
  createdAt: number;
  updatedAt: number;
  deletedAt: number;
  dirty: 0 | 1;
}

export interface ReviewLog {
  id: string;
  cardId: string;
  deckId: string;
  rating: 'again' | 'good';
  reviewedAt: number;
  stateBefore: FsrsState;
  scheduledDays: number;
  durationMs: number;
  dirty: 0 | 1;
}

export interface SyncState {
  key: string;
  value: string | number | null;
}

export interface UserSettings {
  id: 'me';
  dailyGoal: number | null;
  reminderEnabled: boolean;
  reminderMinute: number;
  timeZone: string;
  updatedAt: number;
  dirty: 0 | 1;
}

export const db = new Dexie('certamecards') as Dexie & {
  decks: EntityTable<Deck, 'id'>;
  cards: EntityTable<Card, 'id'>;
  reviewLogs: EntityTable<ReviewLog, 'id'>;
  settings: EntityTable<UserSettings, 'id'>;
  syncState: EntityTable<SyncState, 'key'>;
};

db.version(1).stores({
  decks: 'id, name, createdAt, dirty, deletedAt',
  cards: 'id, deckId, due, state, createdAt, updatedAt, dirty, deletedAt, [deckId+deletedAt]',
  reviewLogs: 'id, cardId, deckId, reviewedAt, dirty',
  settings: 'id, dirty',
  syncState: 'key',
});

trackDirty(db.decks, true);
trackDirty(db.cards, true);
trackDirty(db.reviewLogs, false);
trackDirty(db.settings, false);

export function uid(): string {
  return crypto.randomUUID();
}
