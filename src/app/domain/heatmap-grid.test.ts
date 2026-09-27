import { describe, expect, it } from 'vitest';
import { buildHeatmapGrid, heatmapIntensity } from './heatmap-grid';
import { iso } from './dates';

const TODAY = new Date(2026, 2, 10);

describe('heatmapIntensity', () => {
  it('classifica dia sem revisões como vazio', () => {
    expect(heatmapIntensity(0, 10)).toBe('empty');
  });

  it('classifica um dia bem abaixo do melhor dia como baixo', () => {
    expect(heatmapIntensity(1, 10)).toBe('low');
  });

  it('classifica um dia próximo à metade do melhor dia como médio', () => {
    expect(heatmapIntensity(5, 10)).toBe('mid');
  });

  it('classifica o próprio melhor dia como alto', () => {
    expect(heatmapIntensity(10, 10)).toBe('high');
  });

  it('usa o piso mínimo quando o melhor dia é pequeno, evitando marcar 1 revisão como alta', () => {
    expect(heatmapIntensity(1, 1)).not.toBe('high');
  });
});

describe('buildHeatmapGrid', () => {
  it('não inclui dias futuros na grade', () => {
    const grid = buildHeatmapGrid(new Map(), TODAY);

    expect(grid.cells.every((cell) => new Date(cell.key) <= TODAY)).toBe(true);
  });

  it('inclui o dia de hoje como a última célula', () => {
    const grid = buildHeatmapGrid(new Map(), TODAY);

    expect(grid.cells.at(-1)?.key).toBe(iso(TODAY));
  });

  it('reflete a contagem informada na célula correspondente', () => {
    const counts = new Map([[iso(TODAY), 7]]);

    const grid = buildHeatmapGrid(counts, TODAY);

    const todayCell = grid.cells.find((cell) => cell.key === iso(TODAY));
    expect(todayCell?.count).toBe(7);
    expect(grid.max).toBe(7);
  });

  it('marca o mês só na primeira semana em que ele aparece', () => {
    const grid = buildHeatmapGrid(new Map(), TODAY);

    const marchMarks = grid.monthMarks.filter((mark) => mark.label === 'mar');
    expect(marchMarks).toHaveLength(1);
  });
});
