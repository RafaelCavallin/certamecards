import { ChangeDetectionStrategy, Component, ElementRef, computed, input, output, viewChild } from '@angular/core';
import { TagFilter } from '../../ui/tag-filter/tag-filter';
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
  readonly names = computed(() =>
    this.options()
      .filter((option) => this.selected().includes(option.key))
      .map((option) => option.name)
      .join(', '),
  );

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
