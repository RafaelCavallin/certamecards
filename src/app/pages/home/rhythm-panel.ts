import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { BarChart } from '../../ui/bar-chart/bar-chart';
import {
  cardsLabel,
  forecastEmptyMessage,
  laterTodayLabel,
  retentionLabel,
  reviewsLabel,
  streakLabel,
  tomorrowLabel,
  type HomeRhythm,
} from '../../domain/home-rhythm';

@Component({
  selector: 'app-rhythm-panel',
  imports: [BarChart],
  templateUrl: './rhythm-panel.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RhythmPanel {
  readonly rhythm = input.required<HomeRhythm>();
  readonly deckName = input.required<string>();
  readonly todayTotal = input.required<number>();

  readonly metrics = computed(() => {
    const rhythm = this.rhythm();
    return [
      { label: 'Sequência', value: streakLabel(rhythm.streak) },
      { label: 'Retenção 30d', value: retentionLabel(rhythm.retention30) },
      { label: 'Hoje', value: reviewsLabel(rhythm.reviewedToday) },
      { label: 'Para hoje', value: cardsLabel(this.todayTotal()) },
    ];
  });
  readonly laterToday = computed(() => laterTodayLabel(this.rhythm().laterToday));
  readonly emptyMessage = computed(() => forecastEmptyMessage(this.rhythm()));
  readonly tomorrow = computed(() => (this.emptyMessage() ? null : tomorrowLabel(this.rhythm().forecast)));
}
