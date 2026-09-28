import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  computed,
  input,
  viewChild,
} from '@angular/core';
import {
  HEATMAP_HEIGHT,
  HEATMAP_MONTH_LABEL_Y,
  buildHeatmapGrid,
  type HeatmapIntensity,
} from '../../domain/heatmap-grid';

const INTENSITY_CLASS: Record<HeatmapIntensity, string> = {
  empty: 'fill-line',
  low: 'fill-muted',
  mid: 'fill-signal/50',
  high: 'fill-signal',
};

/** Constância dos últimos 10 meses — grade de retângulos em SVG, sem lib de gráfico. */
@Component({
  selector: 'app-heatmap',
  templateUrl: './heatmap.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Heatmap {
  readonly counts = input.required<Map<string, number>>();

  readonly height = HEATMAP_HEIGHT;
  readonly monthLabelY = HEATMAP_MONTH_LABEL_Y;
  readonly grid = computed(() => buildHeatmapGrid(this.counts()));

  private readonly scrollHost = viewChild.required<ElementRef<HTMLElement>>('scrollHost');

  constructor() {
    afterRenderEffect(() => {
      this.grid();
      const el = this.scrollHost().nativeElement;
      el.scrollLeft = el.scrollWidth;
    });
  }

  cellClass(intensity: HeatmapIntensity): string {
    return INTENSITY_CLASS[intensity];
  }

  cellTitle(count: number, label: string): string {
    if (count === 0) return `${label}: sem revisões`;
    return `${label}: ${count} ${count === 1 ? 'revisão' : 'revisões'}`;
  }
}
