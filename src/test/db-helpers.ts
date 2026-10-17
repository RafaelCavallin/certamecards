import { db } from '../app/domain/db';

/** fake-indexeddb mantém estado entre testes no mesmo processo — chamar em afterEach. */
export async function resetDb(): Promise<void> {
  await db.transaction(
    'rw',
    db.decks,
    db.cards,
    db.reviewLogs,
    db.settings,
    db.syncState,
    db.cardImages,
    db.imageBlobs,
    async () => {
      await db.decks.clear();
      await db.cards.clear();
      await db.reviewLogs.clear();
      await db.settings.clear();
      await db.syncState.clear();
      await db.cardImages.clear();
      await db.imageBlobs.clear();
    },
  );
}
