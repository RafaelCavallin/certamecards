import { DECK_NAME_MAX } from './card-limits';
import { liveCards } from './cards';
import { db, uid, type Deck } from './db';

export const DEFAULT_DECK_NAME = 'Meus cartões';
const FALLBACK_DECK_NAME = 'Novo baralho';
const DEFAULT_NEW_CARDS_PER_DAY = 20;
const DEFAULT_YOUNG_LIMIT = 50;
const DEFAULT_REQUEST_RETENTION = 0.9;

function clampDeckName(name: string): string {
  return name.trim().slice(0, DECK_NAME_MAX);
}

function newDeck(name: string): Deck {
  const now = Date.now();
  return {
    id: uid(),
    name,
    newCardsPerDay: DEFAULT_NEW_CARDS_PER_DAY,
    youngLimit: DEFAULT_YOUNG_LIMIT,
    requestRetention: DEFAULT_REQUEST_RETENTION,
    createdAt: now,
    updatedAt: now,
    deletedAt: 0,
    dirty: 1,
  };
}

/**
 * Baralho padrão só na primeiríssima abertura — quando o banco nunca teve
 * nenhum baralho, nem tombstoned. Excluir o último baralho é uma decisão
 * válida do usuário; `null` significa "sem baralho agora", não erro.
 */
export async function ensureDefaultDeck(): Promise<Deck | null> {
  return db.transaction('rw', db.decks, async () => {
    const everHadAnyDeck = (await db.decks.count()) > 0;
    if (everHadAnyDeck) {
      return (await db.decks.filter((deck) => deck.deletedAt === 0).first()) ?? null;
    }
    const deck = newDeck(DEFAULT_DECK_NAME);
    await db.decks.add(deck);
    return deck;
  });
}

export async function createDeck(name: string): Promise<Deck> {
  const deck = newDeck(clampDeckName(name) || FALLBACK_DECK_NAME);
  await db.decks.add(deck);
  return deck;
}

export async function renameDeck(deckId: string, name: string): Promise<void> {
  const trimmed = clampDeckName(name);
  if (!trimmed) return;
  await db.decks.update(deckId, { name: trimmed, updatedAt: Date.now() });
}

export interface DeckRhythm {
  newCardsPerDay?: number;
  youngLimit?: number;
}

export async function updateDeckRhythm(deckId: string, rhythm: DeckRhythm): Promise<void> {
  await db.decks.update(deckId, { ...rhythm, updatedAt: Date.now() });
}

/**
 * Tombstona o baralho e todos os seus cartões vivos na mesma transação
 * local. Um cartão criado em outro aparelho depois desta exclusão fica
 * órfão e vivo — some da UI porque o baralho sumiu, mas reaparece se o
 * baralho for restaurado.
 */
export async function deleteDeck(deckId: string): Promise<void> {
  const now = Date.now();
  await db.transaction('rw', db.decks, db.cards, async () => {
    await db.decks.update(deckId, { deletedAt: now, updatedAt: now });
    const cardIds = await liveCards(deckId).primaryKeys();
    await db.cards.where('id').anyOf(cardIds).modify({ deletedAt: now, updatedAt: now });
  });
}
