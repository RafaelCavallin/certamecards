import { afterEach, describe, expect, it } from 'vitest';
import { resetDb } from '../../test/db-helpers';
import { makeTaggedCard } from '../../test/card-fixtures';
import { makeCardImage, makeImageBlob } from '../../test/image-fixtures';
import { completeSignIn } from './auth';
import { db } from './db';

afterEach(resetDb);

async function seedLocalLibrary(): Promise<void> {
  await db.cards.add(makeTaggedCard('c1', [], { dirty: 0 }));
  await db.cardImages.bulkAdd([
    makeCardImage('withFile', { blobState: 'uploaded', dirty: 0 }),
    makeCardImage('cloudOnly', { blobState: 'remote', dirty: 0 }),
    makeCardImage('gone', { deletedAt: 5, blobState: 'purged', dirty: 0 }),
  ]);
  await db.imageBlobs.add({ id: 'withFile', blob: makeImageBlob(40) });
  await db.syncState.bulkPut([
    { key: 'cursor:card_images', value: 'x' },
    { key: 'cursor:cards', value: 'y' },
  ]);
}

describe('entrar na conta — juntar', () => {
  it('marca as imagens como sujas, devolve as que têm arquivo a local e zera o cursor de imagens', async () => {
    await seedLocalLibrary();

    await completeSignIn('u2', 'merge');

    const states = await db.cardImages.toArray();
    expect(states.map((image) => [image.id, image.dirty, image.blobState]).sort()).toEqual([
      ['cloudOnly', 1, 'remote'],
      ['gone', 1, 'purged'],
      ['withFile', 1, 'local'],
    ]);
    expect(await db.syncState.get('cursor:card_images')).toBeUndefined();
    expect((await db.syncState.get('boundUserId'))?.value).toBe('u2');
    expect((await db.cards.get('c1'))?.dirty).toBe(1);
  });
});

describe('entrar na conta — descartar e trocar de conta', () => {
  it('descartar apaga as imagens e os arquivos do aparelho junto com os cartões', async () => {
    await seedLocalLibrary();

    await completeSignIn('u2', 'discard');

    const counts = [await db.cards.count(), await db.cardImages.count(), await db.imageBlobs.count()];
    expect(counts).toEqual([0, 0, 0]);
    expect((await db.syncState.get('boundUserId'))?.value).toBe('u2');
  });

  it('entrar numa conta diferente da vinculada nunca mistura as imagens da anterior', async () => {
    await seedLocalLibrary();
    await db.syncState.put({ key: 'boundUserId', value: 'u1' });

    await completeSignIn('u2', 'merge');

    expect([await db.cardImages.count(), await db.imageBlobs.count()]).toEqual([0, 0]);
    expect((await db.syncState.get('boundUserId'))?.value).toBe('u2');
  });

  it('cancelar não altera nada local', async () => {
    await seedLocalLibrary();

    await completeSignIn('u2', 'cancel');

    expect([await db.cardImages.count(), await db.imageBlobs.count()]).toEqual([3, 1]);
    expect(await db.syncState.get('cursor:card_images')).toBeDefined();
  });
});
