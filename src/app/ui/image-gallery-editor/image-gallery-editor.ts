import { CdkDrag, CdkDropList, moveItemInArray, type CdkDragDrop } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, computed, model, signal } from '@angular/core';
import { ImageEditorItem } from './image-editor-item';
import { IMAGES_PER_CARD_MAX } from '../../domain/card-limits';
import { acceptedCount, moveItem, removeItem, setCaption, type GalleryItem } from '../../domain/gallery-draft';
import { galleryItemFrom } from '../../domain/gallery-item';
import { ImageError } from '../../domain/image-errors';
import { filesFromList } from '../../domain/image-input';
import { compressImage } from '../../domain/image-compress';
import { galleryCountLabel, skippedFilesMessage } from '../../domain/image-labels';

const ADD_FAILED_MESSAGE = 'Não foi possível adicionar a imagem.';
const PHONE_QUERY = '(pointer: coarse), (hover: none)';

@Component({
  selector: 'app-image-gallery-editor',
  imports: [CdkDropList, CdkDrag, ImageEditorItem],
  templateUrl: './image-gallery-editor.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageGalleryEditor {
  readonly items = model<GalleryItem[]>([]);
  readonly pending = model(0);
  readonly notice = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly touchOnly = typeof matchMedia === 'function' && matchMedia(PHONE_QUERY).matches;

  readonly used = computed(() => this.items().length + this.pending());
  readonly full = computed(() => this.used() >= IMAGES_PER_CARD_MAX);
  readonly countLabel = computed(() => galleryCountLabel(this.used()));
  readonly slots = computed(() => Array.from({ length: this.pending() }, (_, index) => index));

  async addFiles(files: File[]): Promise<void> {
    const room = acceptedCount(this.used(), files.length);
    const chosen = files.slice(0, room);
    this.notice.set(chosen.length < files.length ? skippedFilesMessage({ accepted: room, skipped: files.length - room }) : null);
    this.error.set(null);
    this.pending.update((count) => count + chosen.length);
    for (const file of chosen) await this.addOne(file);
  }

  private async addOne(file: File): Promise<void> {
    try {
      const image = await compressImage(file);
      this.items.update((list) => [...list, galleryItemFrom(image)]);
    } catch (error: unknown) {
      this.error.set(error instanceof ImageError ? error.message : ADD_FAILED_MESSAGE);
    } finally {
      this.pending.update((count) => count - 1);
    }
  }

  onPicked(field: HTMLInputElement): void {
    void this.addFiles(filesFromList(field.files));
    field.value = '';
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    void this.addFiles(filesFromList(event.dataTransfer?.files));
  }

  reorder(event: CdkDragDrop<GalleryItem[]>): void {
    const next = [...this.items()];
    moveItemInArray(next, event.previousIndex, event.currentIndex);
    this.items.set(next);
  }

  move(index: number, delta: -1 | 1): void {
    this.items.update((list) => moveItem(list, index, delta));
  }

  remove(id: string): void {
    this.items.update((list) => removeItem(list, id));
    this.notice.set(null);
  }

  caption(id: string, text: string): void {
    this.items.update((list) => setCaption(list, id, text));
  }
}
