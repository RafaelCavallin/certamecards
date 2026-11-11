import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MarkedText } from '../../ui/marked-text/marked-text';
import { TagChips } from '../../ui/tag-chips/tag-chips';
import { difficultyCaption } from '../../domain/days-ago';
import type { DifficultCard } from '../../domain/difficulty';

@Component({
  selector: 'app-difficult-row',
  imports: [RouterLink, MarkedText, TagChips],
  templateUrl: './difficult-row.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DifficultRow {
  readonly item = input.required<DifficultCard>();
  readonly now = input.required<number>();

  readonly caption = computed(() => difficultyCaption(this.item(), this.now()));
  readonly frontId = computed(() => `dificil-${this.item().card.id}`);
}
