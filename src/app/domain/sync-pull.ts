import type { SupabaseClient } from '@supabase/supabase-js';
import { applyCards, applyDecks, applyLogs, applySettings } from './sync-pull-apply';
import { pullTable } from './sync-pull-page';
import { parseCardRow, parseDeckRow, parseReviewLogRow, parseSettingsRow } from './sync-rows';

export async function pullAll(client: SupabaseClient): Promise<number> {
  const counts = await Promise.all([
    pullTable({ client, table: 'decks', parser: parseDeckRow, apply: applyDecks }),
    pullTable({ client, table: 'cards', parser: parseCardRow, apply: applyCards }),
    pullTable({ client, table: 'review_logs', parser: parseReviewLogRow, apply: applyLogs }),
    pullTable({ client, table: 'user_settings', parser: parseSettingsRow, apply: applySettings }),
  ]);
  return counts.reduce((total, count) => total + count, 0);
}
