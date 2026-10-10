import { afterEach, describe, expect, it } from 'vitest';
import { resetDb } from '../../test/db-helpers';
import { makeDeck, makeTaggedCard } from '../../test/card-fixtures';
import { makeCardImage, makeImageBlob } from '../../test/image-fixtures';
import { galleryImages, imageUsage, pendingUploadCount, tombstoneImagesOfCards } from './card-images';
import { deleteCards } from './cards';
import { db } from './db';
import { deleteDeck } from './decks';

afterEach(resetDb);

async function seedTwoCards(): Promise<void> {
  await db.decks.add(makeDeck('deck-1'));
  await db.cards.bulkAdd([makeTaggedCard('c1', []), makeTaggedCard('c2', [])]);
  await db.cardImages.bulkAdd([
    makeCardImage('i1', { cardId: 'c1', byteSize: 1000, blobState: 'local' }),
    makeCardImage('i2', { cardId: 'c1', position: 1, byteSize: 2000, blobState: 'uploaded' }),
    makeCardImage('i3', { cardId: 'c2', byteSize: 4000, blobState: 'local' }),
  ]);
  await db.imageBlobs.bulkAdd(['i1', 'i2', 'i3'].map((id) => ({ id, blob: makeImageBlob(10) })));
}

describe('exclusão de cartões e baralhos', () => {
  it('deleteCards tombstona as imagens dos cartões e apaga os arquivos na mesma transação', async () => {
    await seedTwoCards();

    await deleteCards(['c1']);

    const images = await db.cardImages.orderBy('id').toArray();
    expect(images.map((image) => [image.id, image.deletedAt > 0, image.blobState, image.dirty])).toEqual([
      ['i1', true, 'pending-delete', 1],
      ['i2', true, 'pending-delete', 1],
      ['i3', false, 'local', 1],
    ]);
    expect((await db.imageBlobs.toArray()).map((record) => record.id)).toEqual(['i3']);
  });

  it('deleteDeck tombstona as imagens de todos os cartões vivos do baralho', async () => {
    await seedTwoCards();

    await deleteDeck('deck-1');

    const live = await db.cardImages.where('deletedAt').equals(0).count();
    expect([live, await db.imageBlobs.count()]).toEqual([0, 0]);
    expect((await imageUsage()).count).toBe(0);
  });

  it('o contador cai na hora ao excluir cartões', async () => {
    await seedTwoCards();

    await deleteCards(['c2']);

    expect(await imageUsage()).toEqual({ count: 2, bytes: 3000 });
  });

  it('não reescreve uma imagem que já estava tombstonada', async () => {
    await db.cardImages.add(makeCardImage('old', { cardId: 'c1', deletedAt: 10, updatedAt: 10, blobState: 'purged', dirty: 0 }));

    await tombstoneImagesOfCards(['c1'], 99);

    expect(await db.cardImages.get('old')).toMatchObject({ deletedAt: 10, updatedAt: 10, blobState: 'purged', dirty: 0 });
  });
});

describe('imageUsage e pendingUploadCount', () => {
  it('conta só imagens vivas de cartões vivos e soma os bytes', async () => {
    await seedTwoCards();
    await db.cardImages.bulkAdd([
      makeCardImage('dead', { cardId: 'c1', deletedAt: 5, byteSize: 9000 }),
      makeCardImage('orphan', { cardId: 'sem-cartao', byteSize: 9000 }),
    ]);
    await db.cards.add(makeTaggedCard('c3', [], { deletedAt: 5 }));
    await db.cardImages.add(makeCardImage('ofDeadCard', { cardId: 'c3', byteSize: 9000 }));

    expect(await imageUsage()).toEqual({ count: 3, bytes: 7000 });
  });

  it('conta como pendentes só as imagens vivas ainda locais', async () => {
    await seedTwoCards();
    await db.cardImages.add(makeCardImage('dead', { cardId: 'c1', deletedAt: 5, blobState: 'local' }));

    expect(await pendingUploadCount()).toBe(2);
  });

  it('devolve zero com o banco vazio', async () => {
    expect([await imageUsage(), await pendingUploadCount()]).toEqual([{ count: 0, bytes: 0 }, 0]);
  });
});

describe('galleryImages', () => {
  it('ordena por posição, desempata por criação e traz o blob quando existe', async () => {
    await db.cardImages.bulkAdd([
      makeCardImage('b', { cardId: 'c1', position: 1, createdAt: 2 }),
      makeCardImage('a2', { cardId: 'c1', position: 0, createdAt: 5 }),
      makeCardImage('a1', { cardId: 'c1', position: 0, createdAt: 3 }),
    ]);
    await db.imageBlobs.add({ id: 'a1', blob: makeImageBlob(10) });

    const gallery = await galleryImages('c1');

    expect(gallery.map(({ image, blob }) => [image.id, blob !== null])).toEqual([
      ['a1', true],
      ['a2', false],
      ['b', false],
    ]);
  });
});
