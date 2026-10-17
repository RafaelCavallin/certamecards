import { ChangeDetectionStrategy, Component, effect, input, signal } from '@angular/core';

@Component({
  selector: 'app-image-thumb',
  templateUrl: './image-thumb.html',
  host: { class: 'block h-full w-full' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageThumb {
  readonly blob = input<Blob | null>(null);
  readonly alt = input('');
  readonly fit = input<'cover' | 'contain'>('cover');
  readonly framed = input(true);
  readonly url = signal<string | null>(null);

  constructor() {
    effect((onCleanup) => {
      const blob = this.blob();
      if (!blob) {
        this.url.set(null);
        return;
      }
      const objectUrl = URL.createObjectURL(blob);
      this.url.set(objectUrl);
      onCleanup(() => URL.revokeObjectURL(objectUrl));
    });
  }
}
