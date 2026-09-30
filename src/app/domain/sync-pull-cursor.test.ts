import { afterEach, describe, expect, it } from 'vitest';
import { db } from './db';
import { resetDb } from '../../test/db-helpers';
import { pullAll } from './sync-pull';

function client(): unknown {
  const query = { select: () => query, gt: () => query, order: () => query, limit: async () => ({ data: [], error: null }) };
  return { from: () => query };
}

afterEach(async () => resetDb());

describe('pullAll com cursor', () => {
  it('reprocessa a janela de segurança a partir do cursor', async () => {
    await db.syncState.put({ key: 'cursor:decks', value: '2026-01-01T00:00:05Z' });

    expect(await pullAll(client() as never)).toBe(0);
  });
});
