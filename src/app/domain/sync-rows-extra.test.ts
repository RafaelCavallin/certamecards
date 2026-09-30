import { describe, expect, it } from 'vitest';
import { parseDeckRow, parseReviewLogRow, parseSettingsRow } from './sync-rows';

const SYNCED_AT = '2026-01-01T00:00:00Z';

describe('linhas remotas auxiliares', () => {
  it('aceita deck com campos opcionais ausentes', () => {
    const row = { id: 'deck-1', name: 'Direito', new_cards_per_day: 1, young_limit: 2, request_retention: .9, created_at: 1, updated_at: 2, deleted_at: 0, synced_at: SYNCED_AT };

    expect(parseDeckRow(row)?.row.fsrsParams).toBeUndefined();
  });

  it('aceita log de revisão válido', () => {
    const row = { id: 'log-1', card_id: 'card-1', deck_id: 'deck-1', rating: 'good', reviewed_at: 1, state_before: 0, scheduled_days: 1, duration_ms: 2, synced_at: SYNCED_AT };

    expect(parseReviewLogRow(row)?.row.id).toBe('log-1');
  });

  it('aceita ajustes com objetivo diário nulo', () => {
    const row = { daily_goal: null, reminder_enabled: false, reminder_minute: 1, time_zone: 'UTC', updated_at: 2, synced_at: SYNCED_AT };

    expect(parseSettingsRow(row)?.row.dailyGoal).toBeNull();
  });
});
