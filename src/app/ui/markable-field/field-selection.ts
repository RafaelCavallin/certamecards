import { computed, signal, type Signal } from '@angular/core';
import { markAt, trimRange, type Mark, type Range } from '../../domain/text-marks';

/** Estado de seleção do campo: a marca sob o cursor e a seleção ainda sem virar marca. */
export class FieldSelection {
  private readonly range = signal<Range | null>(null);

  constructor(private readonly allMarks: () => Mark[]) {}

  readonly markedMark: Signal<Mark | null> = computed(() => {
    const range = this.range();
    return range ? markAt(this.allMarks(), range) : null;
  });

  readonly pendingSelection: Signal<Range | null> = computed(() => {
    const range = this.range();
    return range && !this.markedMark() && range.end > range.start ? range : null;
  });

  read(text: string, start: number, end: number): void {
    this.range.set(trimRange(text, { start, end }));
  }

  clear(): void {
    this.range.set(null);
  }
}
