import { ChangeDetectionStrategy, Component, ElementRef, effect, input, output, signal, viewChild } from '@angular/core';
import type { TagSummary } from '../../domain/tags';

@Component({
  selector: 'app-tag-row',
  templateUrl: './tag-row.html',
  host: { class: 'block border-b border-line py-3' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagRow {
  readonly tag = input.required<TagSummary>();
  readonly editing = input(false);
  readonly error = input<string | null>(null);
  readonly editStarted = output<void>();
  readonly editCancelled = output<void>();
  readonly renamed = output<string>();
  readonly deleteAsked = output<void>();
  readonly draft = signal('');
  private readonly field = viewChild<ElementRef<HTMLInputElement>>('field');

  constructor() {
    effect(() => {
      const element = this.field()?.nativeElement;
      if (!element) return;
      element.focus();
      element.select();
    });
  }

  startEdit(): void {
    this.draft.set(this.tag().name);
    this.editStarted.emit();
  }

  submit(): void {
    this.renamed.emit(this.draft());
  }
}
