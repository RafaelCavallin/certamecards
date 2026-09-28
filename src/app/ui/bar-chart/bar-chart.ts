import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { ForecastDay } from '../../domain/stats';

const WIDTH = 300;
const HEIGHT = 120;
const GAP = 4;
const LABEL_MARGIN = 22;
const BAR_BOTTOM_GAP = 4;
const LABEL_BASELINE_GAP = 6;

interface Bar {
  x: number;
  y: number;
  width: number;
  height: number;
  labelY: number;
  highlight: boolean;
  showLabel: boolean;
  day: string;
  count: number;
}

/** Carga dos próximos 14 dias — 14 barras em SVG, sem lib de gráfico. */
@Component({
  selector: 'app-bar-chart',
  templateUrl: './bar-chart.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BarChart {
  readonly data = input.required<ForecastDay[]>();

  readonly width = WIDTH;
  readonly height = HEIGHT;

  readonly bars = computed<Bar[]>(() => {
    const days = this.data();
    const barWidth = (WIDTH - GAP * (days.length - 1)) / Math.max(1, days.length);
    const max = Math.max(1, ...days.map((day) => day.count));
    return days.map((day, index) => {
      const height = (day.count / max) * (HEIGHT - LABEL_MARGIN - BAR_BOTTOM_GAP);
      return {
        x: index * (barWidth + GAP),
        y: HEIGHT - LABEL_MARGIN - height,
        width: barWidth,
        height,
        labelY: HEIGHT - LABEL_BASELINE_GAP,
        highlight: index === 0,
        showLabel: index % 2 === 0,
        day: day.day,
        count: day.count,
      };
    });
  });

  barTitle(bar: Bar): string {
    return `${bar.day}: ${bar.count} ${bar.count === 1 ? 'cartão' : 'cartões'}`;
  }
}
