import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TAG_ROW_BUDGET, visibleTagChips } from '../../domain/tag-chips';

@Component({
  selector: 'app-tag-chips',
  templateUrl: './tag-chips.html',
  host: { class: 'flex min-w-0 items-center gap-1.5 overflow-hidden' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagChips {
  readonly tags = input.required<string[]>();
  readonly budget = input(TAG_ROW_BUDGET);
  readonly visible = computed(() => visibleTagChips(this.tags(), this.budget()));
  readonly allTags = computed(() => this.tags().join(', '));
}
