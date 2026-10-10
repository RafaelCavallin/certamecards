import type { PanzoomObject } from '@panzoom/panzoom';
import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, HostListener, computed, inject, input, signal, viewChild } from '@angular/core';
import { ImageThumb } from '../image-thumb/image-thumb';
import type { GalleryImage } from '../../domain/card-images';
import { imageAlt } from '../../domain/image-labels';
import { clampIndex, isZoomed, viewerKeyAction, type ViewerAction } from '../../domain/viewer-input';
import { ViewerGestures } from './viewer-gestures';

const MAX_SCALE = 5;
const DOUBLE_TAP_SCALE = 2.5;
const ZOOM_STEP = 0.5;

@Component({
  selector: 'app-image-viewer',
  imports: [ImageThumb],
  templateUrl: './image-viewer.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageViewer {
  readonly images = input.required<GalleryImage[]>();
  readonly index = signal(0);
  readonly scale = signal(1);
  readonly zoomed = computed(() => isZoomed(this.scale()));
  readonly current = computed(() => this.images()[this.index()]);
  readonly position = computed(() => `${this.index() + 1} / ${this.images().length}`);
  readonly alt = computed(() => imageAlt({ caption: this.current()?.image.caption ?? '', index: this.index(), total: this.images().length }));

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly stage = viewChild.required<ElementRef<HTMLElement>>('stage');
  private readonly target = viewChild.required<ElementRef<HTMLElement>>('target');
  private panzoom: PanzoomObject | null = null;
  private opener: HTMLElement | null = null;
  readonly gestures = new ViewerGestures({
    scale: () => this.scale(),
    swipe: (direction) => this.go(direction === 'next' ? 1 : -1),
    toggleZoom: () => this.toggleZoom(),
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.panzoom?.destroy());
  }

  async open(index: number, opener: HTMLElement): Promise<void> {
    this.opener = opener;
    this.index.set(clampIndex(index, this.images().length));
    this.dialog().nativeElement.showModal();
    await this.ensurePanzoom();
    this.panzoom?.reset({ animate: false });
  }

  close(): void {
    this.dialog().nativeElement.close();
  }

  onClosed(): void {
    this.opener?.focus();
  }

  go(delta: -1 | 1): void {
    this.index.update((current) => clampIndex(current + delta, this.images().length));
    this.panzoom?.reset({ animate: false });
  }

  zoom(direction: 'in' | 'out'): void {
    if (direction === 'in') this.panzoom?.zoomIn({ animate: false });
    else this.panzoom?.zoomOut({ animate: false });
  }

  @HostListener('keydown', ['$event'])
  onKey(event: KeyboardEvent): void {
    const action = viewerKeyAction(event.key);
    if (!action || action === 'close') return;
    event.preventDefault();
    this.run(action);
  }

  private run(action: ViewerAction): void {
    if (action === 'prev') this.go(-1);
    if (action === 'next') this.go(1);
    if (action === 'zoom-in') this.zoom('in');
    if (action === 'zoom-out') this.zoom('out');
  }

  private toggleZoom(): void {
    if (isZoomed(this.scale())) this.panzoom?.reset({ animate: false });
    else this.panzoom?.zoom(DOUBLE_TAP_SCALE, { animate: false });
  }

  private async ensurePanzoom(): Promise<void> {
    if (this.panzoom) return;
    const { default: Panzoom } = await import('@panzoom/panzoom');
    const target = this.target().nativeElement;
    const instance = Panzoom(target, { maxScale: MAX_SCALE, minScale: 1, step: ZOOM_STEP, contain: 'outside', animate: false });
    this.stage().nativeElement.addEventListener('wheel', instance.zoomWithWheel);
    target.addEventListener('panzoomchange', (event) => this.scale.set((event as CustomEvent<{ scale: number }>).detail.scale));
    this.panzoom = instance;
  }
}
