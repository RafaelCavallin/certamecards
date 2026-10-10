import { IMAGES_PER_CARD_MAX, IMAGE_CAPTION_MAX } from './card-limits';
import type { CardImage } from './db-types';
import type { CompressedImage } from './image-compress';

export interface GalleryItem {
  id: string;
  origin: 'saved' | 'new';
  blob: Blob | null;
  caption: string;
  image?: CompressedImage;
}

export interface GallerySavePlan {
  adds: { image: CardImage; blob: Blob }[];
  updates: { id: string; changes: Pick<CardImage, 'position' | 'caption' | 'updatedAt'> }[];
  removals: string[];
}

export interface PlanInput {
  cardId: string;
  saved: CardImage[];
  items: GalleryItem[];
  now: number;
}

export function acceptedCount(current: number, incoming: number): number {
  return Math.max(0, Math.min(incoming, IMAGES_PER_CARD_MAX - current));
}

export function positionOf(index: number): number {
  return Math.min(index, IMAGES_PER_CARD_MAX - 1);
}

export function normalizeCaption(caption: string): string {
  return caption.trim().slice(0, IMAGE_CAPTION_MAX);
}

export function moveItem(items: GalleryItem[], index: number, delta: -1 | 1): GalleryItem[] {
  const target = index + delta;
  if (index < 0 || index >= items.length || target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function removeItem(items: GalleryItem[], id: string): GalleryItem[] {
  return items.filter((item) => item.id !== id);
}

export function setCaption(items: GalleryItem[], id: string, caption: string): GalleryItem[] {
  return items.map((item) => (item.id === id ? { ...item, caption } : item));
}

export function planGallerySave(input: PlanInput): GallerySavePlan {
  const savedById = new Map(input.saved.map((image) => [image.id, image]));
  const adds: GallerySavePlan['adds'] = [];
  const updates: GallerySavePlan['updates'] = [];
  input.items.forEach((item, index) => {
    const position = positionOf(index);
    const caption = normalizeCaption(item.caption);
    const current = savedById.get(item.id);
    if (current) {
      if (current.position !== position || current.caption !== caption) {
        updates.push({ id: item.id, changes: { position, caption, updatedAt: input.now } });
      }
    } else if (item.origin === 'new' && item.image && item.blob) {
      adds.push({ image: newImageRecord({ input, item, position, caption }), blob: item.blob });
    }
  });
  const keptIds = new Set(input.items.map((item) => item.id));
  const removals = input.saved.filter((image) => !keptIds.has(image.id)).map((image) => image.id);
  return { adds, updates, removals };
}

interface NewImageInput {
  input: PlanInput;
  item: GalleryItem;
  position: number;
  caption: string;
}

function newImageRecord({ input, item, position, caption }: NewImageInput): CardImage {
  const image = item.image as CompressedImage;
  return {
    id: item.id,
    cardId: input.cardId,
    position,
    caption,
    mimeType: image.mimeType,
    width: image.width,
    height: image.height,
    byteSize: image.byteSize,
    blobState: 'local',
    createdAt: input.now,
    updatedAt: input.now,
    deletedAt: 0,
    dirty: 1,
  };
}
