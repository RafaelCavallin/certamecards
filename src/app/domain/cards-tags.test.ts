import { afterEach, describe, expect, it } from 'vitest';
import { resetDb } from '../../test/db-helpers';
import { createCard, updateCardContent } from './cards';
import { db } from './db';
import { EMPTY_CARD_MARKS } from './text-marks';

afterEach(resetDb);

describe('etiquetas no cartão', () => {
  const base = { deckId: 'd1', front: 'F', back: 'B', notes: '', marks: EMPTY_CARD_MARKS };

  it('createCard grava as etiquetas normalizadas', async () => {
    const card = await createCard({ ...base, tags: [' CESPE ', 'cespe', 'Art.  37'] });

    expect((await db.cards.get(card.id))!.tags).toEqual(['CESPE', 'Art. 37']);
  });

  it('updateCardContent normaliza, devolve o conteúdo gravado e marca dirty', async () => {
    const created = await createCard({ ...base, tags: ['a'] });
    await db.cards.update(created.id, { dirty: 0 });

    const saved = await updateCardContent(created.id, { ...base, tags: ['b', 'B', ' '] });

    const after = (await db.cards.get(created.id))!;
    expect(saved.tags).toEqual(['b']);
    expect(after.tags).toEqual(['b']);
    expect(after.dirty).toBe(1);
  });

  it('trocar etiquetas não reagenda nem cria log', async () => {
    const created = await createCard({ ...base, tags: [] });

    await updateCardContent(created.id, { ...base, tags: ['x'] });

    const after = (await db.cards.get(created.id))!;
    expect(after.due).toBe(created.due);
    expect(after.reps).toBe(created.reps);
    expect(await db.reviewLogs.count()).toBe(0);
  });
});
