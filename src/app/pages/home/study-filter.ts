import { ChangeDetectionStrategy, Component, ElementRef, computed, input, output, viewChild } from '@angular/core';
import { TagFilter } from '../../ui/tag-filter/tag-filter';
import { quickTags, toggleKey } from '../../domain/quick-tags';
import type { TagSummary } from '../../domain/tags';

@Component({
  selector: 'app-study-filter',
  imports: [TagFilter],
  templateUrl: './study-filter.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudyFilter {
  readonly options = input.required<TagSummary[]>();
  readonly selected = input.required<string[]>();
  readonly selectedChange = output<string[]>();
  private readonly dialogRef = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  readonly quick = computed(() => quickTags(this.options(), this.selected()));
  readonly moreLabel = computed(() => (this.quick().chips.length ? 'Todas as etiquetas…' : 'Estudar só…'));

  isSelected(key: string): boolean {
    return this.selected().includes(key);
  }

  toggle(key: string): void {
    this.selectedChange.emit(toggleKey(this.selected(), key));
  }

  open(): void {
    this.dialogRef().nativeElement.showModal();
  }

  close(): void {
    this.dialogRef().nativeElement.close();
  }

  clear(): void {
    this.selectedChange.emit([]);
  }
}
