import type { GalleryItem } from '../app/domain/gallery-draft';
import { makeImageBlob } from './image-fixtures';

export function newGalleryItem(id: string, caption = ''): GalleryItem {
  return {
    id,
    origin: 'new',
    blob: makeImageBlob(),
    caption,
    image: { blob: makeImageBlob(), mimeType: 'image/webp', width: 100, height: 50, byteSize: 1000 },
  };
}

export function savedGalleryItem(id: string, caption = ''): GalleryItem {
  return { id, origin: 'saved', blob: makeImageBlob(), caption };
}
