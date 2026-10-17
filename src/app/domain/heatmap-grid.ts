import { iso } from './dates';

const CELL = 11;
const GAP = 3;
const WEEKS = 40;
const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const INTENSITY_LOW = 0.34;
const INTENSITY_MID = 0.67;
const INTENSITY_FLOOR = 4;
const TOP_MARGIN = 20;

export const HEATMAP_HEIGHT = 7 * (CELL + GAP) + TOP_MARGIN;
export const HEATMAP_MONTH_LABEL_Y = 14;

export type HeatmapIntensity = 'empty' | 'low' | 'mid' | 'high';

export interface HeatmapCell {
  key: string;
  x: number;
  y: number;
  count: number;
  intensity: HeatmapIntensity;
  label: string;
}

export interface HeatmapMonthMark {
  label: string;
  x: number;
}

export interface HeatmapGrid {
  cells: HeatmapCell[];
  monthMarks: HeatmapMonthMark[];
  max: number;
  width: number;
}

/** Bucket de intensidade da cor — a escala acompanha o melhor dia, nunca um valor fixo. */
export function heatmapIntensity(count: number, max: number): HeatmapIntensity {
  if (count === 0) return 'empty';
  const ratio = Math.min(1, count / Math.max(INTENSITY_FLOOR, max));
  if (ratio < INTENSITY_LOW) return 'low';
  return ratio < INTENSITY_MID ? 'mid' : 'high';
}

function startOfGrid(today: Date): Date {
  const start = new Date(today);
  start.setDate(start.getDate() - (WEEKS - 1) * 7 - today.getDay());
  return start;
}

function cellLabel(date: Date): string {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

interface RawGrid {
  cells: HeatmapCell[];
  monthMarks: HeatmapMonthMark[];
  max: number;
}

function buildCellsAndMarks(start: Date, today: Date, counts: Map<string, number>): RawGrid {
  const cells: HeatmapCell[] = [];
  const monthMarks: HeatmapMonthMark[] = [];
  let lastMonth = -1;
  let max = 0;
  for (let week = 0; week < WEEKS; week++) {
    for (let day = 0; day < 7; day++) {
      const date = new Date(start);
      date.setDate(start.getDate() + week * 7 + day);
      if (date > today) continue;
      const count = counts.get(iso(date)) ?? 0;
      max = Math.max(max, count);
      if (day === 0 && date.getMonth() !== lastMonth) {
        lastMonth = date.getMonth();
        monthMarks.push({ label: MONTHS[lastMonth], x: week * (CELL + GAP) });
      }
      cells.push({
        key: iso(date),
        x: week * (CELL + GAP),
        y: day * (CELL + GAP) + TOP_MARGIN,
        count,
        intensity: 'empty',
        label: cellLabel(date),
      });
    }
  }
  return { cells, monthMarks, max };
}

/** Grade de 40 semanas de constância, sem lib de gráfico — SVG à mão custa menos que a dependência. */
export function buildHeatmapGrid(counts: Map<string, number>, now: Date = new Date()): HeatmapGrid {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const start = startOfGrid(today);
  const { cells, monthMarks, max } = buildCellsAndMarks(start, today, counts);
  const withIntensity = cells.map((cell) => ({ ...cell, intensity: heatmapIntensity(cell.count, max) }));
  return { cells: withIntensity, monthMarks, max, width: WEEKS * (CELL + GAP) };
}
