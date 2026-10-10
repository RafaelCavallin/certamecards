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

export type BlobState = 'local' | 'uploaded' | 'remote' | 'pending-delete' | 'purged';
export type ImageMime = 'image/webp' | 'image/jpeg';

export interface CardImage {
  id: string;
  cardId: string;
  position: number;
  caption: string;
  mimeType: ImageMime;
  width: number;
  height: number;
  byteSize: number;
  blobState: BlobState;
  createdAt: number;
  updatedAt: number;
  deletedAt: number;
  dirty: 0 | 1;
}

export interface ImageBlobRecord {
  id: string;
  blob: Blob;
}
