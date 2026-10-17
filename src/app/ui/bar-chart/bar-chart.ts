import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { ForecastDay } from '../../domain/stats';

const MIN_BAR_PERCENT = 2;
const PERCENT = 100;
const LABEL_STEP = 2;

interface Bar {
  day: string;
  heightPercent: number;
  highlight: boolean;
  showLabel: boolean;
  title: string;
}

@Component({
  selector: 'app-bar-chart',
  templateUrl: './bar-chart.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BarChart {
  readonly data = input.required<ForecastDay[]>();
  readonly ariaLabel = computed(
    () => `Previsão de cartões vencendo nos próximos ${this.data().length} dias`,
  );

  readonly bars = computed<Bar[]>(() => {
    const days = this.data();
    const max = Math.max(1, ...days.map((day) => day.count));
    return days.map((day, index) => ({
      day: day.day,
      heightPercent: day.count === 0 ? 0 : Math.max(MIN_BAR_PERCENT, (day.count / max) * PERCENT),
      highlight: index === 0,
      showLabel: index % LABEL_STEP === 0,
      title: `${day.day}: ${day.count} ${day.count === 1 ? 'cartão' : 'cartões'}`,
    }));
  });
}
