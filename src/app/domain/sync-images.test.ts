import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDb } from '../../test/db-helpers';
import { makeTaggedCard } from '../../test/card-fixtures';
import { createFakeSupabase } from '../../test/fake-supabase';
import { makeCardImage, makeImageBlob } from '../../test/image-fixtures';
import { db } from './db';
import { toCardImageRow } from './sync-rows';

const getSupabase = vi.fn();
vi.mock('./supabase', () => ({ getSupabase: () => getSupabase() }));
const { syncNow } = await import('./sync');

beforeEach(async () => {
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
  await db.syncState.put({ key: 'boundUserId', value: 'user-1' });
});

afterEach(async () => {
  vi.restoreAllMocks();
  getSupabase.mockReset();
  await resetDb();
});

async function seedCardWithTwoImages(): Promise<void> {
  await db.cards.add(makeTaggedCard('c1', [], { dirty: 1 }));
  await db.cardImages.bulkAdd([makeCardImage('ok', { blobState: 'local' }), makeCardImage('falha', { blobState: 'local' })]);
  await db.imageBlobs.bulkAdd([
    { id: 'ok', blob: makeImageBlob(100) },
    { id: 'falha', blob: makeImageBlob(100) },
  ]);
}

describe('syncNow com imagens', () => {
  it('envia os cartões antes das imagens e termina ok mesmo com uma imagem falhando', async () => {
    await seedCardWithTwoImages();
    const fake = createFakeSupabase({
      session: { user: { id: 'user-1' } },
      storage: { uploadError: (path) => (path.endsWith('falha') ? { message: 'boom', status: 500 } : null) },
    });
    getSupabase.mockResolvedValue(fake.client);

    const outcome = await syncNow('manual');

    expect(outcome.status).toBe('ok');
    expect(fake.calls[0]).toBe('rpc:sync_push');
    expect(fake.calls.at(-1)).toBe('rpc:sync_push_images');
    expect(fake.calls.filter((call) => call.startsWith('upload:')).sort()).toEqual(['upload:user-1/falha', 'upload:user-1/ok']);
    expect((await db.cards.get('c1'))?.dirty).toBe(0);
    expect(await db.cardImages.get('ok')).toMatchObject({ blobState: 'uploaded', dirty: 0 });
    expect(await db.cardImages.get('falha')).toMatchObject({ blobState: 'local', dirty: 1 });
  });

  it('inclui as imagens enviadas na contagem de itens enviados', async () => {
    await seedCardWithTwoImages();
    getSupabase.mockResolvedValue(createFakeSupabase({ session: { user: { id: 'user-1' } } }).client);

    const outcome = await syncNow('manual');

    expect(outcome).toMatchObject({ status: 'ok', pushed: 3 });
  });

  it('puxa as imagens de outro aparelho como remote na mesma sincronização', async () => {
    const row = { ...toCardImageRow(makeCardImage('r1')), synced_at: '2026-01-01T00:00:10Z' };
    getSupabase.mockResolvedValue(createFakeSupabase({ session: { user: { id: 'user-1' } }, tables: { card_images: [row] } }).client);

    const outcome = await syncNow('manual');

    expect(outcome).toMatchObject({ status: 'ok', pulled: 1 });
    expect((await db.cardImages.get('r1'))?.blobState).toBe('remote');
  });
});

describe('sem Supabase configurado', () => {
  it('não toca em nenhuma imagem e responde disabled', async () => {
    await seedCardWithTwoImages();
    getSupabase.mockResolvedValue(null);

    const outcome = await syncNow('manual');

    expect(outcome).toEqual({ status: 'disabled' });
    const images = await db.cardImages.orderBy('id').toArray();
    expect(images.map((image) => [image.id, image.blobState, image.dirty])).toEqual([
      ['falha', 'local', 1],
      ['ok', 'local', 1],
    ]);
    expect(await db.imageBlobs.count()).toBe(2);
  });
});
