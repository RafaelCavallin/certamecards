import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { BarChart } from '../../ui/bar-chart/bar-chart';
import { DeckRhythm } from '../../ui/deck-rhythm/deck-rhythm';
import { Heatmap } from '../../ui/heatmap/heatmap';
import { DeckStore } from '../../state/deck-store';
import { computeStats, type Stats } from '../../domain/stats';

@Component({
  selector: 'app-progress',
  imports: [BarChart, DeckRhythm, Heatmap],
  templateUrl: './progress.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Progress {
  private readonly deckStore = inject(DeckStore);

  readonly deck = this.deckStore.deck;
  readonly stats = signal<Stats | undefined>(undefined);

  readonly retentionLabel = computed(() => {
    const value = this.stats()?.retention30;
    return value === null || value === undefined ? '—' : `${Math.round(value * 100)}%`;
  });

  readonly metrics = computed(() => {
    const stats = this.stats();
    if (!stats) return [];
    return [
      { label: 'Retenção 30d', value: this.retentionLabel() },
      { label: 'Sequência', value: `${stats.streak}d` },
      { label: 'Revisões', value: String(stats.reviewsTotal) },
    ];
  });

  readonly maturitySegments = computed(() => {
    const maturity = this.stats()?.maturity;
    if (!maturity) return [];
    const total = maturity.new + maturity.learning + maturity.mature;
    if (total === 0) return [];
    return [
      {
        label: 'firmes',
        count: maturity.mature,
        pct: (maturity.mature / total) * 100,
        colorClass: 'bg-hit',
      },
      {
        label: 'em consolidação',
        count: maturity.learning,
        pct: (maturity.learning / total) * 100,
        colorClass: 'bg-signal',
      },
      {
        label: 'novos',
        count: maturity.new,
        pct: (maturity.new / total) * 100,
        colorClass: 'bg-line',
      },
    ];
  });

  constructor() {
    effect(() => {
      const deck = this.deckStore.deck();
      if (!deck) return;
      void computeStats(deck).then((stats) => this.stats.set(stats));
    });
  }
}
