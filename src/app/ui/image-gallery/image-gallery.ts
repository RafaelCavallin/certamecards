import { ChangeDetectionStrategy, Component, effect, inject, input, viewChild } from '@angular/core';
import { ImageThumb } from '../image-thumb/image-thumb';
import { ImageViewer } from '../image-viewer/image-viewer';
import { galleryImages, type GalleryImage } from '../../domain/card-images';
import { imageAlt } from '../../domain/image-labels';
import { ImagePrefetch } from '../../state/image-prefetch';
import { liveQueryFor } from '../../state/live-query';

@Component({
  selector: 'app-image-gallery',
  imports: [ImageThumb, ImageViewer],
  templateUrl: './image-gallery.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageGallery {
  readonly cardId = input.required<string>();
  readonly images = liveQueryFor(this.cardId, galleryImages);

  private readonly prefetch = inject(ImagePrefetch);
  private readonly viewer = viewChild.required(ImageViewer);

  constructor() {
    effect(() => {
      if (this.images()?.some((item) => item.blob === null)) void this.prefetch.request([this.cardId()]);
    });
  }

  altOf(item: GalleryImage, index: number, total: number): string {
    return imageAlt({ caption: item.image.caption, index, total });
  }

  open(index: number, event: Event): void {
    void this.viewer().open(index, event.currentTarget as HTMLElement);
  }
}
