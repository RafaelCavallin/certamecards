import type { CardImage } from '../app/domain/db';

export function makeCardImage(id: string, overrides: Partial<CardImage> = {}): CardImage {
  return {
    id,
    cardId: 'card-1',
    position: 0,
    caption: '',
    mimeType: 'image/webp',
    width: 800,
    height: 600,
    byteSize: 1000,
    blobState: 'local',
    createdAt: 1,
    updatedAt: 1,
    deletedAt: 0,
    dirty: 1,
    ...overrides,
  };
}

export function makeImageBlob(size = 1000, type = 'image/webp'): Blob {
  return new Blob([new Uint8Array(size)], { type });
}
