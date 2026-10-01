import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { prepareAnkiReader, type AnkiReader } from '../domain/anki-reader';

export type ReaderStatus = 'preparing' | 'ready' | 'needs-network';

@Injectable()
export class AnkiReaderStatus {
  private readonly statusSignal = signal<ReaderStatus>('preparing');
  private readonly readerSignal = signal<AnkiReader | null>(null);

  readonly status = this.statusSignal.asReadonly();
  readonly reader = this.readerSignal.asReadonly();

  constructor() {
    const retryWhenOnline = (): void => {
      if (this.statusSignal() === 'needs-network') this.retry();
    };
    window.addEventListener('online', retryWhenOnline);
    inject(DestroyRef).onDestroy(() => window.removeEventListener('online', retryWhenOnline));
    this.retry();
  }

  retry(): void {
    void this.prepare();
  }

  private async prepare(): Promise<void> {
    this.statusSignal.set('preparing');
    try {
      this.readerSignal.set(await prepareAnkiReader());
      this.statusSignal.set('ready');
    } catch {
      this.statusSignal.set('needs-network');
    }
  }
}
