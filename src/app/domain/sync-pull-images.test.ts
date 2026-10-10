import { afterEach, describe, expect, it } from 'vitest';
import { resetDb } from '../../test/db-helpers';
import { makeTaggedCard } from '../../test/card-fixtures';
import { createFakeSupabase } from '../../test/fake-supabase';
import { makeCardImage, makeImageBlob } from '../../test/image-fixtures';
import { db } from './db';
import { pullAll } from './sync-pull';
import { toCardImageRow, toCardRow } from './sync-rows';

afterEach(resetDb);

const SYNCED_AT = '2026-01-01T00:00:10Z';

function remoteImage(id: string, overrides: Parameters<typeof makeCardImage>[1] = {}): Record<string, unknown> {
  return { ...toCardImageRow(makeCardImage(id, overrides)), synced_at: SYNCED_AT };
}

async function seedUploaded(id: string, overrides: Parameters<typeof makeCardImage>[1] = {}): Promise<void> {
  await db.cardImages.add(makeCardImage(id, { blobState: 'uploaded', dirty: 0, updatedAt: 10, caption: 'old', ...overrides }));
  await db.imageBlobs.add({ id, blob: makeImageBlob(50) });
}

describe('pull de card_images', () => {
  it('grava a imagem nova como remote e limpa, e avança o cursor', async () => {
    const { client } = createFakeSupabase({ tables: { card_images: [remoteImage('i1', { updatedAt: 5 })] } });

    const count = await pullAll(client);

    expect(count).toBe(1);
    expect(await db.cardImages.get('i1')).toMatchObject({ blobState: 'remote', dirty: 0, updatedAt: 5 });
    expect((await db.syncState.get('cursor:card_images'))?.value).toBe(SYNCED_AT);
  });

  it('não reaplica a mesma linha ao repuxar a janela de overlap', async () => {
    const { client } = createFakeSupabase({ tables: { card_images: [remoteImage('i1')] } });
    await pullAll(client);

    const second = await pullAll(client);

    expect(second).toBe(0);
  });

  it('descarta em silêncio linha de formato desconhecido sem derrubar o pull', async () => {
    const bad = { ...remoteImage('bad'), mime_type: 'image/gif' };
    const { client } = createFakeSupabase({ tables: { card_images: [bad, remoteImage('ok')] } });

    await pullAll(client);

    expect(await db.cardImages.toCollection().primaryKeys()).toEqual(['ok']);
  });
});

describe('LWW da imagem', () => {
  it('a versão remota mais nova vence e mantém o arquivo local como enviado', async () => {
    await seedUploaded('i1');
    const { client } = createFakeSupabase({ tables: { card_images: [remoteImage('i1', { updatedAt: 20, caption: 'new' })] } });

    await pullAll(client);

    expect(await db.cardImages.get('i1')).toMatchObject({ caption: 'new', updatedAt: 20, blobState: 'uploaded', dirty: 0 });
    expect((await db.imageBlobs.get('i1'))?.blob.size).toBe(50);
  });

  it('a versão remota mais velha perde e não mexe na imagem local', async () => {
    await seedUploaded('i1', { dirty: 1 });
    const { client } = createFakeSupabase({ tables: { card_images: [remoteImage('i1', { updatedAt: 5, caption: 'stale' })] } });

    const count = await pullAll(client);

    expect(count).toBe(0);
    expect(await db.cardImages.get('i1')).toMatchObject({ caption: 'old', updatedAt: 10, dirty: 1 });
  });

  it('o tombstone remoto mais novo apaga o arquivo local e marca a imagem como purged', async () => {
    await seedUploaded('i1');
    const { client } = createFakeSupabase({ tables: { card_images: [remoteImage('i1', { updatedAt: 30, deletedAt: 30 })] } });

    await pullAll(client);

    expect(await db.cardImages.get('i1')).toMatchObject({ deletedAt: 30, blobState: 'purged', dirty: 0 });
    expect(await db.imageBlobs.get('i1')).toBeUndefined();
  });

  it('uma edição remota depois do meu tombstone ressuscita a imagem sem arquivo (remote)', async () => {
    await db.cardImages.add(makeCardImage('i1', { deletedAt: 10, updatedAt: 10, blobState: 'pending-delete', dirty: 0 }));
    const { client } = createFakeSupabase({ tables: { card_images: [remoteImage('i1', { updatedAt: 20 })] } });

    await pullAll(client);

    expect(await db.cardImages.get('i1')).toMatchObject({ deletedAt: 0, blobState: 'remote' });
  });
});

describe('cartão excluído em outro aparelho', () => {
  it('tombstona as imagens vivas dele com a data da exclusão e apaga os arquivos', async () => {
    await db.cards.add(makeTaggedCard('c1', [], { updatedAt: 1 }));
    await seedUploaded('i1', { cardId: 'c1' });
    const deletedCard = { ...toCardRow(makeTaggedCard('c1', [], { updatedAt: 50, deletedAt: 50 })), synced_at: SYNCED_AT };
    const { client } = createFakeSupabase({ tables: { cards: [deletedCard] } });

    await pullAll(client);

    expect(await db.cardImages.get('i1')).toMatchObject({ deletedAt: 50, updatedAt: 50, blobState: 'pending-delete', dirty: 1 });
    expect(await db.imageBlobs.get('i1')).toBeUndefined();
  });

  it('não mexe nas imagens quando o cartão remoto continua vivo', async () => {
    await db.cards.add(makeTaggedCard('c1', [], { updatedAt: 1 }));
    await seedUploaded('i1', { cardId: 'c1' });
    const edited = { ...toCardRow(makeTaggedCard('c1', [], { updatedAt: 50, front: 'Nova' })), synced_at: SYNCED_AT };
    const { client } = createFakeSupabase({ tables: { cards: [edited] } });

    await pullAll(client);

    expect(await db.cardImages.get('i1')).toMatchObject({ deletedAt: 0, blobState: 'uploaded' });
  });
});
