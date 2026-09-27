import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { queueCount } from '../../domain/queue';
import type { Deck } from '../../domain/db';
import { liveQuerySignal } from '../../state/live-query';
import { DueBadge } from '../due-badge/due-badge';

@Component({
  selector: 'app-deck-row',
  imports: [DueBadge],
  templateUrl: './deck-row.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckRow {
  readonly deck = input.required<Deck>();

  readonly count = liveQuerySignal(() => queueCount(this.deck()));
  readonly label = computed(() => `${this.count() ?? 0} para revisar`);
}
