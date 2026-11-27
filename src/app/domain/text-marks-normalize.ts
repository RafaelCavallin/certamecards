import type { CardMarks, HighlightRange, Marks } from './text-marks';

function isHighlightRange(value: unknown): value is HighlightRange {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Record<string, unknown>;
  return typeof item['start'] === 'number' && typeof item['end'] === 'number' && typeof item['color'] === 'string';
}

function validHighlights(raw: unknown): HighlightRange[] {
  return Array.isArray(raw) ? raw.filter(isHighlightRange) : [];
}

function normalizeMarks(raw: Partial<Marks> | null | undefined): Marks {
  const { cloze, emphasis, highlight, ...rest } = raw ?? {};
  return { cloze: cloze ?? [], emphasis: emphasis ?? [], highlight: validHighlights(highlight), ...rest };
}

/**
 * Regra de domínio inegociável: lacuna só existe na Frente. Descarta
 * `cloze` de Verso e Notas em qualquer entrada (formulário, pull, import,
 * backup) e sempre devolve os três campos, mesmo vindos ausentes ou nulos.
 * Tipos de marca que esta versão não conhece passam intactos.
 */
export function normalizeCardMarks(raw: Partial<CardMarks> | null | undefined): CardMarks {
  const { front, back, notes, ...rest } = raw ?? {};
  return {
    front: normalizeMarks(front),
    back: { ...normalizeMarks(back), cloze: [] },
    notes: { ...normalizeMarks(notes), cloze: [] },
    ...rest,
  };
}
