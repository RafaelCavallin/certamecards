import { describe, expect, it } from 'vitest';
import { maturitySegments } from './maturity-segments';

describe('maturitySegments', () => {
  it('devolve lista vazia sem maturidade', () => {
    expect(maturitySegments(undefined)).toEqual([]);
  });

  it('devolve lista vazia quando o total é zero', () => {
    expect(maturitySegments({ new: 0, learning: 0, mature: 0 })).toEqual([]);
  });

  it('ordena firmes, em consolidação e novos com percentuais', () => {
    const segments = maturitySegments({ new: 2, learning: 1, mature: 1 });

    expect(segments.map((s) => s.label)).toEqual(['firmes', 'em consolidação', 'novos']);
    expect(segments.map((s) => s.pct)).toEqual([25, 25, 50]);
    expect(segments.map((s) => s.count)).toEqual([1, 1, 2]);
  });
});
