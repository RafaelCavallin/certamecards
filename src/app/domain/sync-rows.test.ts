import { describe, expect, it } from 'vitest';
import { parseCardRow, toCardRow } from './sync-rows';
import type { Card } from './db';
import { EMPTY_CARD_MARKS } from './text-marks';

function makeCard(): Card {
  return { id: 'card-1', deckId: 'deck-1', front: 'Frente', back: 'Verso', notes: '', marks: EMPTY_CARD_MARKS, tags: ['lei'], due: 1, stability: 2, difficulty: 3, elapsedDays: 0, scheduledDays: 1, learningSteps: 0, reps: 1, lapses: 0, state: 1, createdAt: 1, updatedAt: 2, deletedAt: 0, dirty: 1 };
}

describe('parseCardRow', () => {
  it('descarta marks inválido sem lançar', () => {
    const row = { ...toCardRow(makeCard()), marks: [], synced_at: '2026-01-01T00:00:00Z' };

    expect(parseCardRow(row)).toBeNull();
  });

  it('converte ida e volta preservando os campos do cartão', () => {
    const card = makeCard();
    const result = parseCardRow({ ...toCardRow(card), synced_at: '2026-01-01T00:00:00Z' });

    expect(result?.row).toEqual({ ...card, dirty: 0 });
  });

  it('aceita tags ausentes de servidores antigos', () => {
    const row = toCardRow(makeCard()) as Record<string, unknown>;
    delete row.tags;
    const result = parseCardRow({ ...row, synced_at: '2026-01-01T00:00:00Z' });

    expect(result?.row.tags).toEqual([]);
  });

  it('normaliza tags duplicadas, vazias e longas vindas do remoto', () => {
    const row = { ...toCardRow(makeCard()), tags: ['Cespe', 'CESPE', ' ', 'x'.repeat(41)], synced_at: '2026-01-01T00:00:00Z' };

    const result = parseCardRow(row);

    expect(result?.row.tags).toEqual(['Cespe']);
    expect(result?.row.dirty).toBe(0);
  });

  it('descarta lacuna de Verso e Notas vindas do remoto', () => {
    const card = makeCard();
    const row = toCardRow(card) as Record<string, unknown>;
    const marks = row.marks as typeof card.marks;
    marks.back.cloze = [{ start: 0, end: 1 }];
    marks.notes.cloze = [{ start: 0, end: 1 }];
    const result = parseCardRow({ ...row, synced_at: '2026-01-01T00:00:00Z' });

    expect(result?.row.marks.back.cloze).toEqual([]);
    expect(result?.row.marks.notes.cloze).toEqual([]);
  });
});
