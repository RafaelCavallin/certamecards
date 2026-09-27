import type { CardMarks, Marks } from './text-marks';

function normalizeMarks(raw: Partial<Marks> | null | undefined): Marks {
  return { cloze: raw?.cloze ?? [], emphasis: raw?.emphasis ?? [] };
}

/**
 * Regra de domínio inegociável: lacuna só existe na Frente. Descarta
 * `cloze` de Verso e Notas em qualquer entrada (formulário, pull, import,
 * backup) e sempre devolve os três campos, mesmo vindos ausentes ou nulos.
 */
export function normalizeCardMarks(raw: Partial<CardMarks> | null | undefined): CardMarks {
  return {
    front: normalizeMarks(raw?.front),
    back: { ...normalizeMarks(raw?.back), cloze: [] },
    notes: { ...normalizeMarks(raw?.notes), cloze: [] },
  };
}
