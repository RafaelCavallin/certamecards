import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDb } from '../../test/db-helpers';
import { makeDeck, makeTaggedCard } from '../../test/card-fixtures';
import { FUTURE_MARKS, HIGHLIGHT_MARKS, LEGACY_MARKS } from '../../test/marks-fixtures';
import { loadCardDraft } from './card-draft';
import { saveCardEdit } from './card-save';
import { db } from './db';

const NOW = 1_790_000_000_000;

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
  await db.decks.add(makeDeck('d1'));
});

afterEach(async () => {
  vi.useRealTimers();
  await resetDb();
});

async function seedScheduledCard(marks = LEGACY_MARKS): Promise<void> {
  const card = makeTaggedCard('c1', [], { deckId: 'd1', front: 'Frente', back: 'Verso', due: 5000, stability: 3.5, reps: 3, lapses: 1, state: 2, updatedAt: 777 });
  await db.cards.add({ ...card, marks });
}

describe('saveCardEdit com marca-texto', () => {
  it('grava só o marca-texto sem tocar no estado FSRS nem criar revisão', async () => {
    await seedScheduledCard();
    const draft = await loadCardDraft('c1');
    if (!draft) throw new Error('rascunho ausente');

    await saveCardEdit({ cardId: 'c1', draft: { ...draft, content: { ...draft.content, marks: HIGHLIGHT_MARKS } } });

    const stored = await db.cards.get('c1');
    expect(stored?.marks).toEqual(HIGHLIGHT_MARKS);
    expect(stored).toMatchObject({ due: 5000, stability: 3.5, reps: 3, lapses: 1, state: 2, dirty: 1, updatedAt: NOW });
    expect(await db.reviewLogs.count()).toBe(0);
  });

  it('não altera um cartão antigo salvo sem mudanças', async () => {
    await seedScheduledCard();
    await db.cards.update('c1', { dirty: 0 });
    const draft = await loadCardDraft('c1');
    if (!draft) throw new Error('rascunho ausente');

    await saveCardEdit({ cardId: 'c1', draft });

    const stored = await db.cards.get('c1');
    expect(stored).toMatchObject({ updatedAt: 777, dirty: 0 });
    expect(stored?.marks).toEqual(LEGACY_MARKS);
  });

  it('mantém a chave de marcas desconhecida do cartão quando o formulário devolve só os três campos', async () => {
    await seedScheduledCard(FUTURE_MARKS);
    const draft = await loadCardDraft('c1');
    if (!draft) throw new Error('rascunho ausente');
    const { front, back, notes } = draft.content.marks;

    await saveCardEdit({ cardId: 'c1', draft: { ...draft, content: { ...draft.content, front: 'Frente nova', marks: { front, back, notes } } } });

    const stored = await db.cards.get('c1');
    expect(stored?.front).toBe('Frente nova');
    expect(stored?.marks).toMatchObject({ version: 7, front: { strike: [{ start: 8, end: 12 }] } });
  });
});
