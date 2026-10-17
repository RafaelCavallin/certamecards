import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CdkDragHandle } from '@angular/cdk/drag-drop';
import { ImageThumb } from '../image-thumb/image-thumb';
import { IMAGE_CAPTION_MAX } from '../../domain/card-limits';
import { charCounterLabel } from '../../domain/char-counter';
import type { GalleryItem } from '../../domain/gallery-draft';
import { imageAlt } from '../../domain/image-labels';

@Component({
  selector: 'app-image-editor-item',
  imports: [ImageThumb, CdkDragHandle],
  templateUrl: './image-editor-item.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageEditorItem {
  readonly item = input.required<GalleryItem>();
  readonly index = input.required<number>();
  readonly total = input.required<number>();
  readonly move = output<-1 | 1>();
  readonly remove = output<void>();
  readonly captionChange = output<string>();
  readonly captionMax = IMAGE_CAPTION_MAX;

  readonly position = computed(() => this.index() + 1);
  readonly alt = computed(() => imageAlt({ caption: this.item().caption, index: this.index(), total: this.total() }));
  readonly counter = computed(() => charCounterLabel(this.item().caption.length, IMAGE_CAPTION_MAX));

  onCaption(field: HTMLInputElement): void {
    this.captionChange.emit(field.value);
  }
}
