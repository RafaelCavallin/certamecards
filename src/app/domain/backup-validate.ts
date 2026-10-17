import { IMAGES_PER_CARD_MAX, IMAGE_BYTES_MAX, IMAGE_CAPTION_MAX, validateCardContent } from './card-limits';
import type { Card, CardImage, Deck, ReviewLog } from './db';

export interface ImageEntry {
  image: CardImage;
  path: string;
}

export interface ValidationInput {
  decks: Deck[];
  cards: Card[];
  reviewLogs: ReviewLog[];
  images: ImageEntry[];
  availablePaths: ReadonlySet<string>;
}

export interface ValidatedRecords {
  decks: Deck[];
  cards: Card[];
  reviewLogs: ReviewLog[];
  images: ImageEntry[];
}

export function validateRecords(input: ValidationInput): ValidatedRecords {
  const deckIds = new Set(input.decks.map((deck) => deck.id));
  const cards = input.cards.filter((card) => deckIds.has(card.deckId) && validateCardContent(card).valid);
  const cardIds = new Set(cards.map((card) => card.id));
  const reviewLogs = input.reviewLogs.filter((log) => cardIds.has(log.cardId) && deckIds.has(log.deckId));
  const liveCardIds = new Set(cards.filter((card) => card.deletedAt === 0).map((card) => card.id));
  const images = keepFirstPerCard(input.images.filter((entry) => isUsableImage(entry, liveCardIds, input.availablePaths)));
  return { decks: input.decks, cards, reviewLogs, images };
}

function isUsableImage(entry: ImageEntry, liveCardIds: ReadonlySet<string>, available: ReadonlySet<string>): boolean {
  const { image } = entry;
  return (
    image.deletedAt === 0 &&
    liveCardIds.has(image.cardId) &&
    image.byteSize <= IMAGE_BYTES_MAX &&
    image.caption.length <= IMAGE_CAPTION_MAX &&
    available.has(entry.path)
  );
}

function keepFirstPerCard(entries: ImageEntry[]): ImageEntry[] {
  const counts = new Map<string, number>();
  const ordered = [...entries].sort((a, b) => a.image.position - b.image.position || a.image.createdAt - b.image.createdAt);
  const kept = new Set(
    ordered.filter(({ image }) => {
      const count = (counts.get(image.cardId) ?? 0) + 1;
      counts.set(image.cardId, count);
      return count <= IMAGES_PER_CARD_MAX;
    }),
  );
  return entries.filter((entry) => kept.has(entry));
}
