import type { Maturity } from './stats';

export interface MaturitySegment {
  label: string;
  count: number;
  pct: number;
  colorClass: string;
}

function segmentOf(label: string, count: number, total: number, colorClass: string): MaturitySegment {
  return { label, count, pct: (count / total) * 100, colorClass };
}

export function maturitySegments(maturity: Maturity | undefined): MaturitySegment[] {
  if (!maturity) return [];
  const total = maturity.new + maturity.learning + maturity.mature;
  if (total === 0) return [];
  return [
    segmentOf('firmes', maturity.mature, total, 'bg-hit'),
    segmentOf('em consolidação', maturity.learning, total, 'bg-signal'),
    segmentOf('novos', maturity.new, total, 'bg-line'),
  ];
}
