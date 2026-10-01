import { Injectable, computed, inject, signal } from '@angular/core';
import { DeckStore } from './deck-store';
import { emptyConversion, type ConversionResult } from '../domain/anki-convert-batch';
import { dropDuplicates } from '../domain/anki-dedupe';
import { GENERIC_IMPORT_FAILURE, isAnkiError } from '../domain/anki-errors';
import { existingContentKeys, importDrafts, type ImportOutcome, type ImportTarget } from '../domain/anki-import';

export type RunStep = 'importing' | 'done';

export interface ImportProgress {
  done: number;
  total: number;
}

@Injectable()
export class AnkiImportRun {
  private readonly deckStore = inject(DeckStore);
  private readonly stepSignal = signal<RunStep | null>(null);
  private controller: AbortController | null = null;

  readonly step = this.stepSignal.asReadonly();
  readonly conversion = signal<ConversionResult>(emptyConversion());
  readonly target = signal<ImportTarget | null>(null);
  readonly duplicates = signal(0);
  readonly progress = signal<ImportProgress>({ done: 0, total: 0 });
  readonly outcome = signal<ImportOutcome | null>(null);
  readonly error = signal<string | null>(null);
  readonly toCreate = computed(() => this.conversion().drafts.length - this.duplicates());

  async prepare(conversion: ConversionResult, target: ImportTarget): Promise<void> {
    this.conversion.set(conversion);
    await this.chooseTarget(target);
  }

  async chooseTarget(target: ImportTarget): Promise<void> {
    this.target.set(target);
    const existing = target.kind === 'existing' ? await existingContentKeys(target.deckId) : new Set<string>();
    if (this.target() !== target) return;
    this.duplicates.set(dropDuplicates(this.conversion().drafts, existing).duplicates);
  }

  async start(): Promise<void> {
    const target = this.target();
    if (!target || this.toCreate() === 0) return;
    this.error.set(null);
    this.controller = new AbortController();
    this.progress.set({ done: 0, total: this.toCreate() });
    this.stepSignal.set('importing');
    try {
      await this.write(target, this.controller.signal);
    } catch (error: unknown) {
      this.reportFailure(error);
      this.stepSignal.set(null);
    }
  }

  cancel(): void {
    this.controller?.abort();
  }

  private async write(target: ImportTarget, signal: AbortSignal): Promise<void> {
    const outcome = await importDrafts({
      drafts: this.conversion().drafts,
      target,
      signal,
      onProgress: (done, total) => this.progress.set({ done, total }),
    });
    this.deckStore.switchDeck(outcome.deckId);
    this.outcome.set(outcome);
    this.stepSignal.set('done');
  }

  private reportFailure(error: unknown): void {
    if (isAnkiError(error, 'cancelled')) return;
    console.error('Falha ao gravar a importação do Anki.', error);
    this.error.set(GENERIC_IMPORT_FAILURE);
  }
}
