import { liveCardImages, tombstoneImages } from './card-images';
import { normalizeCardContent, sameCardContent } from './card-content';
import { newCardRecord, type CardContent } from './cards';
import type { CardDraft } from './card-draft';
import { db, type Card } from './db';
import { planGallerySave, type GallerySavePlan } from './gallery-draft';
import { ImageError } from './image-errors';

export interface NewCardSave {
  deckId: string;
  draft: CardDraft;
}

export interface CardEditSave {
  cardId: string;
  draft: CardDraft;
  deckId?: string;
}

type CardChanges = Partial<CardContent> & { deckId?: string };

function isQuotaError(error: unknown): boolean {
  const inner = (error as { inner?: { name?: string } } | null)?.inner;
  return error instanceof Error && (error.name === 'QuotaExceededError' || inner?.name === 'QuotaExceededError');
}

async function inTransaction<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await db.transaction('rw', [db.decks, db.cards, db.cardImages, db.imageBlobs], work);
  } catch (error: unknown) {
    throw isQuotaError(error) ? new ImageError('storage-full') : error;
  }
}

async function applyPlan(plan: GallerySavePlan, now: number): Promise<void> {
  await db.cardImages.bulkAdd(plan.adds.map((add) => add.image));
  await db.imageBlobs.bulkAdd(plan.adds.map((add) => ({ id: add.image.id, blob: add.blob })));
  for (const update of plan.updates) await db.cardImages.update(update.id, update.changes);
  await tombstoneImages(plan.removals, now);
}

async function requireLiveDeck(deckId: string): Promise<void> {
  const deck = await db.decks.get(deckId);
  if (!deck || deck.deletedAt !== 0) throw new Error('Baralho não encontrado.');
}

export async function saveNewCard({ deckId, draft }: NewCardSave): Promise<Card> {
  const now = Date.now();
  const card = newCardRecord({ ...draft.content, deckId }, now);
  const plan = planGallerySave({ cardId: card.id, saved: [], items: draft.gallery, now });
  await inTransaction(async () => {
    await requireLiveDeck(deckId);
    await db.cards.add(card);
    await applyPlan(plan, now);
  });
  return card;
}

export async function saveCardEdit({ cardId, draft, deckId }: CardEditSave): Promise<Card> {
  const now = Date.now();
  return inTransaction(async () => {
    const existing = await db.cards.get(cardId);
    if (!existing) throw new Error('Cartão não encontrado.');
    const changes = cardChanges(existing, normalizeCardContent(draft.content), deckId);
    if (changes.deckId) await requireLiveDeck(changes.deckId);
    const changed = Object.keys(changes).length > 0;
    if (changed) await db.cards.update(cardId, { ...changes, updatedAt: now });
    const saved = await liveCardImages(cardId);
    await applyPlan(planGallerySave({ cardId, saved, items: draft.gallery, now }), now);
    return changed ? { ...existing, ...changes, updatedAt: now } : existing;
  });
}

function cardChanges(existing: Card, content: CardContent, deckId: string | undefined): CardChanges {
  const textChanged = !sameCardContent(content, pickContent(existing));
  const deckChanged = deckId !== undefined && deckId !== existing.deckId;
  return { ...(textChanged ? content : {}), ...(deckChanged ? { deckId } : {}) };
}

function pickContent(card: Card): CardContent {
  return { front: card.front, back: card.back, notes: card.notes, marks: card.marks, tags: card.tags };
}
