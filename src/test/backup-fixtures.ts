import { strToU8, zipSync } from 'fflate';
import { toManifest } from '../app/domain/backup-manifest-write';
import { imageEntryPath, type BackupContent, type BackupManifest } from '../app/domain/backup-format';
import type { Card, CardImage, Deck, ReviewLog, UserSettings } from '../app/domain/db';
import { EMPTY_CARD_MARKS } from '../app/domain/text-marks';

export const BACKUP_NOW = Date.parse('2026-10-01T12:00:00Z');
export const BACKUP_DAY = 86_400_000;

export function makeDeck(over: Partial<Deck> = {}): Deck {
  return {
    id: 'deck-1',
    name: 'Constitucional',
    newCardsPerDay: 20,
    youngLimit: 50,
    requestRetention: 0.9,
    createdAt: BACKUP_NOW - 30 * BACKUP_DAY,
    updatedAt: BACKUP_NOW - 30 * BACKUP_DAY,
    deletedAt: 0,
    dirty: 0,
    ...over,
  };
}

export function makeCard(over: Partial<Card> = {}): Card {
  return {
    id: 'card-1',
    deckId: 'deck-1',
    front: 'O mandato é de quatro anos',
    back: 'Art. 82, CF',
    notes: '',
    marks: { ...EMPTY_CARD_MARKS, front: { cloze: [{ start: 15, end: 21 }], emphasis: [] } },
    tags: ['CESPE'],
    due: BACKUP_NOW + BACKUP_DAY,
    stability: 12.4,
    difficulty: 5.1,
    elapsedDays: 9,
    scheduledDays: 12,
    learningSteps: 0,
    reps: 5,
    lapses: 1,
    state: 2,
    lastReview: BACKUP_NOW - 9 * BACKUP_DAY,
    createdAt: BACKUP_NOW - 20 * BACKUP_DAY,
    updatedAt: BACKUP_NOW - 9 * BACKUP_DAY,
    deletedAt: 0,
    dirty: 0,
    ...over,
  };
}

export function makeLog(over: Partial<ReviewLog> = {}): ReviewLog {
  return {
    id: 'log-1',
    cardId: 'card-1',
    deckId: 'deck-1',
    rating: 'good',
    reviewedAt: BACKUP_NOW - 9 * BACKUP_DAY,
    stateBefore: 2,
    scheduledDays: 12,
    durationMs: 5400,
    dirty: 0,
    ...over,
  };
}

export function makeSettings(over: Partial<UserSettings> = {}): UserSettings {
  return {
    id: 'me',
    dailyGoal: 40,
    reminderEnabled: false,
    reminderMinute: 1200,
    timeZone: 'America/Sao_Paulo',
    updatedAt: BACKUP_NOW - 10 * BACKUP_DAY,
    dirty: 0,
    ...over,
  };
}

export function makeImage(over: Partial<CardImage> = {}): CardImage {
  return {
    id: 'image-1',
    cardId: 'card-1',
    position: 0,
    caption: 'Esquema do art. 82',
    mimeType: 'image/webp',
    width: 1600,
    height: 1200,
    byteSize: 4,
    blobState: 'uploaded',
    createdAt: BACKUP_NOW - 20 * BACKUP_DAY,
    updatedAt: BACKUP_NOW - 20 * BACKUP_DAY,
    deletedAt: 0,
    dirty: 0,
    ...over,
  };
}

export function makeContent(over: Partial<BackupContent> = {}): BackupContent {
  return {
    decks: [makeDeck()],
    cards: [makeCard()],
    reviewLogs: [makeLog()],
    settings: makeSettings(),
    images: [makeImage()],
    ...over,
  };
}

export function manifestOf(content: BackupContent, accountId: string | null = null): BackupManifest {
  return toManifest(content, { exportedAt: BACKUP_NOW, accountId });
}

export function imageBytes(seed: number): Uint8Array {
  return new Uint8Array([seed, seed + 1, seed + 2, seed + 3]);
}

export function zipOfManifest(manifest: unknown, images: Record<string, Uint8Array> = {}): Uint8Array {
  return zipSync({ 'backup.json': strToU8(JSON.stringify(manifest)), ...images });
}

export function zipOfContent(content: BackupContent, accountId: string | null = null): Uint8Array {
  const images = Object.fromEntries(content.images.map((image) => [imageEntryPath(image.id, image.mimeType), imageBytes(1)]));
  return zipOfManifest(manifestOf(content, accountId), images);
}
