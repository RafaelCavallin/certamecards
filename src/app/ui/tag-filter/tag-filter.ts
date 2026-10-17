import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import type { TagSummary } from '../../domain/tags';

@Component({
  selector: 'app-tag-filter',
  templateUrl: './tag-filter.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagFilter {
  readonly options = input.required<TagSummary[]>();
  readonly selected = model<string[]>([]);
  readonly label = input.required<string>();
  readonly chosen = computed(() =>
    this.options().filter((option) => this.selected().includes(option.key)),
  );

  isSelected(key: string): boolean {
    return this.selected().includes(key);
  }

  toggle(key: string): void {
    this.selected.update((keys) =>
      keys.includes(key) ? keys.filter((item) => item !== key) : [...keys, key],
    );
  }

  clear(): void {
    this.selected.set([]);
  }
}
