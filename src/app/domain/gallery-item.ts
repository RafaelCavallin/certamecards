import { uid } from './db';
import type { GalleryItem } from './gallery-draft';
import type { CompressedImage } from './image-compress';

export function galleryItemFrom(image: CompressedImage): GalleryItem {
  return { id: uid(), origin: 'new', blob: image.blob, caption: '', image };
}
