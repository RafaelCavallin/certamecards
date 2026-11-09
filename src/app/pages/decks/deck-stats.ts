import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { formatDaysAgo } from '../../domain/days-ago';
import type { DeckOverview } from '../../domain/deck-overview';
import { maturitySegments } from '../../domain/maturity-segments';

@Component({
  selector: 'app-deck-stats',
  templateUrl: './deck-stats.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckStats {
  readonly overview = input.required<DeckOverview>();

  readonly metrics = computed(() => {
    const o = this.overview();
    return [
      { label: 'Cartões', value: String(o.total) },
      { label: 'Para revisar', value: String(o.dueToday) },
      { label: 'Difíceis', value: String(o.difficult) },
      { label: 'Retenção 30d', value: o.retention30 === null ? '—' : `${Math.round(o.retention30 * 100)}%` },
      { label: 'Revisões', value: String(o.reviewsTotal) },
      { label: 'Revisado', value: o.lastReviewAt === null ? '—' : formatDaysAgo(o.lastReviewAt, Date.now()) },
    ];
  });

  readonly segments = computed(() => maturitySegments(this.overview().maturity));
}
