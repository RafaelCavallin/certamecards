import { afterEach, describe, expect, it } from 'vitest';
import { resetDb } from '../../test/db-helpers';
import { makeDeck, makeTaggedCard } from '../../test/card-fixtures';
import { createFakeSupabase } from '../../test/fake-supabase';
import { FUTURE_MARKS, HIGHLIGHT_MARKS } from '../../test/marks-fixtures';
import { loadCardDraft } from './card-draft';
import { saveCardEdit } from './card-save';
import { db } from './db';
import { pullAll } from './sync-pull';
import { pushDirty } from './sync-push';
import { remapMarks } from './text-marks-remap';

afterEach(resetDb);

interface PushedCards {
  p_cards: { marks: unknown; synced_at?: string }[];
}

async function pushAndCapture(): Promise<PushedCards['p_cards']> {
  const { client, rpcCalls } = createFakeSupabase({ rpc: () => ({ error: null }) });
  await pushDirty(client);
  return rpcCalls.flatMap((call) => (call.args as PushedCards).p_cards ?? []);
}

describe('marca-texto entre aparelhos', () => {
  it('leva o marca-texto de um aparelho a outro por push e pull', async () => {
    await db.cards.add(makeTaggedCard('c1', [], { marks: HIGHLIGHT_MARKS, dirty: 1 }));
    const pushed = await pushAndCapture();
    await resetDb();
    const remote = pushed.map((row) => ({ ...row, synced_at: '2026-01-01T00:00:10Z' }));

    await pullAll(createFakeSupabase({ tables: { cards: remote } }).client);

    expect((await db.cards.get('c1'))?.marks).toEqual(HIGHLIGHT_MARKS);
    expect((await db.cards.get('c1'))?.dirty).toBe(0);
  });

  it('mantém tipo e cor desconhecidos, reposicionados, depois de editar o texto e reenviar', async () => {
    await db.decks.add(makeDeck('d1'));
    const remote = { ...pushedRowOf('c1', FUTURE_MARKS), synced_at: '2026-01-01T00:00:10Z' };
    await pullAll(createFakeSupabase({ tables: { cards: [remote] } }).client);
    const draft = await loadCardDraft('c1');
    if (!draft) throw new Error('rascunho ausente');
    const front = `Antes ${draft.content.front}`;
    const marks = { ...draft.content.marks, front: remapMarks(draft.content.front, front, draft.content.marks.front) };

    await saveCardEdit({ cardId: 'c1', draft: { ...draft, content: { ...draft.content, front, marks } } });

    const [row] = await pushAndCapture();
    expect(row.marks).toMatchObject({
      version: 7,
      front: { highlight: [{ start: 6, end: 11, color: 'blue' }], strike: [{ start: 14, end: 18 }] },
    });
  });
});

function pushedRowOf(id: string, marks: unknown): Record<string, unknown> {
  const card = makeTaggedCard(id, [], { deckId: 'd1', front: 'Frente longa', back: 'Verso' });
  return { id, deck_id: card.deckId, front: card.front, back: card.back, notes: '', marks, tags: [], due: 1, stability: 1, difficulty: 1, elapsed_days: 0, scheduled_days: 1, learning_steps: 0, reps: 0, lapses: 0, state: 0, last_review: null, created_at: 1, updated_at: 1, deleted_at: 0 };
}
