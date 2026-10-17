import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { BarChart } from '../../ui/bar-chart/bar-chart';
import {
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

  readonly metrics = computed(() => {
    const rhythm = this.rhythm();
    return [
      { label: 'Sequência', value: streakLabel(rhythm.streak) },
      { label: 'Retenção 30d', value: retentionLabel(rhythm.retention30) },
      { label: 'Hoje', value: reviewsLabel(rhythm.reviewedToday) },
    ];
  });
  readonly tomorrow = computed(() => tomorrowLabel(this.rhythm().forecast));
}
