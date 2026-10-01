import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AnkiImportSession } from '../../state/anki-import-session';
import { AnkiReaderStatus } from '../../state/anki-reader-status';

const LARGE_FILE_BYTES = 300 * 1024 * 1024;

@Component({
  selector: 'app-import-file',
  templateUrl: './import-file.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportFile {
  readonly reader = inject(AnkiReaderStatus);
  readonly session = inject(AnkiImportSession);

  readonly dragging = signal(false);
  readonly largeFile = signal(false);
  readonly reading = computed(() => this.session.step() === 'reading');
  readonly disabled = computed(() => this.reader.status() !== 'ready' || this.reading());

  pick(input: HTMLInputElement): void {
    const file = input.files?.[0];
    input.value = '';
    if (file) this.read(file);
  }

  dragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(!this.disabled());
  }

  drop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    const file = event.dataTransfer?.files[0];
    if (file && !this.disabled()) this.read(file);
  }

  private read(file: File): void {
    const reader = this.reader.reader();
    if (!reader) return;
    this.largeFile.set(file.size > LARGE_FILE_BYTES);
    void this.session.readFile(file, reader);
  }
}
