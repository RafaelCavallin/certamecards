import { z } from 'zod';
import { BACKUP_FORMAT, BACKUP_VERSION, type ParsedBackup } from './backup-format';
import { BackupError } from './backup-errors';
import { validateRecords, type ImageEntry } from './backup-validate';
import type { UserSettings } from './db';
import {
  parseCardImageRow,
  parseCardRow,
  parseDeckRow,
  parseReviewLogRow,
  parseSettingsRow,
  type Parsed,
} from './sync-rows';

const headerSchema = z.object({ format: z.literal(BACKUP_FORMAT), version: z.number().int().min(1) });

const envelopeSchema = z.object({
  exportedAt: z.number(),
  accountId: z.string().nullable(),
  decks: z.array(z.unknown()),
  cards: z.array(z.unknown()),
  reviewLogs: z.array(z.unknown()),
  settings: z.unknown(),
  images: z.array(z.unknown()),
});

const pathSchema = z.object({ path: z.string() });

function withSyncedAt(raw: unknown): unknown {
  return typeof raw === 'object' && raw !== null ? { ...raw, synced_at: '' } : raw;
}

function parseAll<T>(items: unknown[], parse: (raw: unknown) => Parsed<T> | null): T[] {
  return items.flatMap((item) => parse(withSyncedAt(item))?.row ?? []);
}

function parseImages(items: unknown[]): ImageEntry[] {
  return items.flatMap((item) => {
    const image = parseCardImageRow(withSyncedAt(item))?.row;
    const path = pathSchema.safeParse(item);
    return image && path.success ? [{ image, path: path.data.path }] : [];
  });
}

function assertSupported(raw: unknown): void {
  const header = headerSchema.safeParse(raw);
  if (!header.success) throw new BackupError('not-backup');
  if (header.data.version > BACKUP_VERSION) throw new BackupError('newer-version');
}

function parseSettings(raw: unknown): UserSettings | null {
  return raw === null ? null : (parseSettingsRow(withSyncedAt(raw))?.row ?? null);
}

export function parseManifest(raw: unknown, availablePaths: ReadonlySet<string>): ParsedBackup {
  assertSupported(raw);
  const envelope = envelopeSchema.safeParse(raw);
  if (!envelope.success) throw new BackupError('not-backup');
  const data = envelope.data;
  const settings = parseSettings(data.settings);
  const valid = validateRecords({
    decks: parseAll(data.decks, parseDeckRow),
    cards: parseAll(data.cards, parseCardRow),
    reviewLogs: parseAll(data.reviewLogs, parseReviewLogRow),
    images: parseImages(data.images),
    availablePaths,
  });
  const seen = data.decks.length + data.cards.length + data.reviewLogs.length + data.images.length;
  const kept = valid.decks.length + valid.cards.length + valid.reviewLogs.length + valid.images.length;
  const settingsLost = data.settings !== null && settings === null ? 1 : 0;
  return {
    exportedAt: data.exportedAt,
    accountId: data.accountId,
    ...valid,
    settings,
    images: valid.images.map((entry) => entry.image),
    imagePaths: Object.fromEntries(valid.images.map((entry) => [entry.image.id, entry.path])),
    discarded: seen - kept + settingsLost,
  };
}
