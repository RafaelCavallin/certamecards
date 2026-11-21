import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { queueCount } from '../../domain/queue';
import type { Deck } from '../../domain/db';
import { DueTick } from '../../state/due-tick';
import { liveQueryTicking } from '../../state/live-query';
import { DueBadge } from '../due-badge/due-badge';

@Component({
  selector: 'app-deck-row',
  imports: [DueBadge],
  templateUrl: './deck-row.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckRow {
  private readonly dueTick = inject(DueTick);

  readonly deck = input.required<Deck>();

  readonly count = liveQueryTicking(this.dueTick.tick, () => queueCount(this.deck()));
  readonly label = computed(() => `${this.count() ?? 0} para revisar`);
}
