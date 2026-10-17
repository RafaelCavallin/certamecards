import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MarkedText } from '../../ui/marked-text/marked-text';
import { TagChips } from '../../ui/tag-chips/tag-chips';
import { difficultyCaption } from '../../domain/days-ago';
import type { Card } from '../../domain/db';
import type { DifficultCard } from '../../domain/difficulty';

@Component({
  selector: 'app-difficult-row',
  imports: [MarkedText, TagChips],
  templateUrl: './difficult-row.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DifficultRow {
  readonly item = input.required<DifficultCard>();
  readonly now = input.required<number>();
  readonly edit = output<Card>();

  readonly caption = computed(() => difficultyCaption(this.item(), this.now()));
}
