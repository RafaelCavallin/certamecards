import { z } from 'zod';
import type { CardImage } from './db';
import type { Parsed } from './sync-rows-types';

const imageSchema = z.object({
  id: z.string(),
  card_id: z.string(),
  position: z.number(),
  caption: z.string().nullish(),
  mime_type: z.enum(['image/webp', 'image/jpeg']),
  width: z.number(),
  height: z.number(),
  byte_size: z.number(),
  created_at: z.number(),
  updated_at: z.number(),
  deleted_at: z.number(),
  synced_at: z.string(),
});

export function parseCardImageRow(raw: unknown): Parsed<CardImage> | null {
  const parsed = imageSchema.safeParse(raw);
  if (!parsed.success) return null;
  const data = parsed.data;
  const row: CardImage = {
    id: data.id,
    cardId: data.card_id,
    position: data.position,
    caption: data.caption ?? '',
    mimeType: data.mime_type,
    width: data.width,
    height: data.height,
    byteSize: data.byte_size,
    blobState: 'remote',
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    deletedAt: data.deleted_at,
    dirty: 0,
  };
  return { row, syncedAt: data.synced_at };
}

export function toCardImageRow(row: CardImage): object {
  return {
    id: row.id,
    card_id: row.cardId,
    position: row.position,
    caption: row.caption,
    mime_type: row.mimeType,
    width: row.width,
    height: row.height,
    byte_size: row.byteSize,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
    deleted_at: row.deletedAt,
  };
}
