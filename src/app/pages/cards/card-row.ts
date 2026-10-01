import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MarkedText } from '../../ui/marked-text/marked-text';
import { TagChips } from '../../ui/tag-chips/tag-chips';
import type { Card } from '../../domain/db';

@Component({
  selector: 'app-card-row',
  imports: [RouterLink, MarkedText, TagChips],
  templateUrl: './card-row.html',
  host: { class: 'flex items-start gap-3 overflow-hidden border-b border-line py-4' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardRow {
  readonly card = input.required<Card>();
  readonly checked = input(false);
  readonly toggled = output<void>();
  readonly removed = output<void>();
}
