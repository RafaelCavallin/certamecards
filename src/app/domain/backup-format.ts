import type { Card, CardImage, Deck, ImageMime, ReviewLog, UserSettings } from './db';

export const BACKUP_FORMAT = 'certamecards-backup';
export const BACKUP_VERSION = 1;
export const MANIFEST_PATH = 'backup.json';
export const IMAGES_DIR = 'images';

const IMAGE_EXTENSIONS: Record<ImageMime, string> = {
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
};

export function imageEntryPath(id: string, mimeType: ImageMime): string {
  return `${IMAGES_DIR}/${id}.${IMAGE_EXTENSIONS[mimeType]}`;
}

export type RestorePlan = 'merge' | 'replace';

export interface BackupCounts {
  decks: number;
  cards: number;
  reviewLogs: number;
  images: number;
}

export interface BackupContent {
  decks: Deck[];
  cards: Card[];
  reviewLogs: ReviewLog[];
  settings: UserSettings | null;
  images: CardImage[];
}

export interface ManifestMeta {
  exportedAt: number;
  accountId: string | null;
}

export interface BackupManifest extends ManifestMeta {
  format: typeof BACKUP_FORMAT;
  version: number;
  decks: object[];
  cards: object[];
  reviewLogs: object[];
  settings: object | null;
  images: object[];
}

export interface ParsedBackup extends BackupContent, ManifestMeta {
  imagePaths: Record<string, string>;
  discarded: number;
}

export interface BackupSource {
  parsed: ParsedBackup;
  bytes: Uint8Array;
}

export interface BackupPreview {
  exportedAt: number;
  counts: BackupCounts;
  imageBytes: number;
  accountMismatch: boolean;
  discarded: number;
  source: BackupSource;
}

export interface RestoreProgress {
  done: number;
  total: number;
}

export interface RestoreInput {
  preview: BackupPreview;
  plan: RestorePlan;
  onProgress?: (progress: RestoreProgress) => void;
}

export interface RestoreReport {
  applied: BackupCounts;
  keptLocal: number;
  removed: number;
  discarded: number;
}
