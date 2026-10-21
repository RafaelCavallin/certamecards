import Dexie, { type EntityTable } from 'dexie';
import { trackDirty } from './dirty-tracking';
import { browserStorage } from './local-storage';
import { recordStoreCreated } from './store-marker';
import type { Card, CardImage, Deck, ImageBlobRecord, ReviewLog, SyncState, UserSettings } from './db-types';

export type {
  BlobState,
  Card,
  CardImage,
  Deck,
  FsrsState,
  ImageBlobRecord,
  ImageMime,
  ReviewLog,
  SyncState,
  UserSettings,
} from './db-types';

export const db = new Dexie('certamecards') as Dexie & {
  decks: EntityTable<Deck, 'id'>;
  cards: EntityTable<Card, 'id'>;
  reviewLogs: EntityTable<ReviewLog, 'id'>;
  settings: EntityTable<UserSettings, 'id'>;
  syncState: EntityTable<SyncState, 'key'>;
  cardImages: EntityTable<CardImage, 'id'>;
  imageBlobs: EntityTable<ImageBlobRecord, 'id'>;
};

db.version(1).stores({
  decks: 'id, name, createdAt, dirty, deletedAt',
  cards: 'id, deckId, due, state, createdAt, updatedAt, dirty, deletedAt, [deckId+deletedAt]',
  reviewLogs: 'id, cardId, deckId, reviewedAt, dirty',
  settings: 'id, dirty',
  syncState: 'key',
});

db.version(2).stores({
  cardImages: 'id, cardId, dirty, deletedAt, blobState',
  imageBlobs: 'id',
});

trackDirty(db.decks, true);
trackDirty(db.cards, true);
trackDirty(db.reviewLogs, false);
trackDirty(db.settings, false);
trackDirty(db.cardImages, true, ['blobState']);

db.on('populate', () => recordStoreCreated(browserStorage(), Date.now()));

export function uid(): string {
  return crypto.randomUUID();
}
