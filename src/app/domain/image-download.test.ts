import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDb } from '../../test/db-helpers';
import { createFakeSupabase, type FakeSupabaseOptions } from '../../test/fake-supabase';
import { makeCardImage, makeImageBlob } from '../../test/image-fixtures';
import { db } from './db';

const getSupabase = vi.fn();
vi.mock('./supabase', () => ({ getSupabase: () => getSupabase() }));
const { fetchMissingImages, storeDownloadedImage } = await import('./image-download');

function setOnline(value: boolean): void {
  Object.defineProperty(navigator, 'onLine', { configurable: true, value });
}

async function connect(options: FakeSupabaseOptions = {}) {
  const fake = createFakeSupabase({ session: { user: { id: 'user-1' } }, ...options });
  getSupabase.mockResolvedValue(fake.client);
  await db.syncState.put({ key: 'boundUserId', value: 'user-1' });
  return fake;
}

beforeEach(() => {
  setOnline(true);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(async () => {
  vi.restoreAllMocks();
  getSupabase.mockReset();
  await resetDb();
});

const downloadsOf = (calls: string[]) => calls.filter((call) => call.startsWith('download:'));

describe('fetchMissingImages', () => {
  it('baixa só as imagens vivas que faltam e grava o arquivo como enviado, preservando o dirty', async () => {
    await db.cardImages.bulkAdd([
      makeCardImage('falta', { cardId: 'c1', blobState: 'remote', dirty: 0 }),
      makeCardImage('editada', { cardId: 'c1', blobState: 'remote', dirty: 1 }),
      makeCardImage('jaTem', { cardId: 'c1', blobState: 'uploaded', dirty: 0 }),
      makeCardImage('excluida', { cardId: 'c1', blobState: 'remote', deletedAt: 5 }),
      makeCardImage('outroCartao', { cardId: 'c2', blobState: 'remote' }),
    ]);
    const files = { 'user-1/falta': makeImageBlob(70), 'user-1/editada': makeImageBlob(80) };
    const { calls } = await connect({ storage: { files } });

    const count = await fetchMissingImages(['c1']);

    expect(count).toBe(2);
    expect(downloadsOf(calls).sort()).toEqual(['download:user-1/editada', 'download:user-1/falta']);
    expect(await db.cardImages.get('falta')).toMatchObject({ blobState: 'uploaded', dirty: 0 });
    expect(await db.cardImages.get('editada')).toMatchObject({ blobState: 'uploaded', dirty: 1 });
    const stored = (await db.imageBlobs.get('falta'))!.blob;
    expect([stored.size, stored.type]).toEqual([70, 'image/webp']);
  });

  it('deduplica pedidos simultâneos: um download por imagem', async () => {
    await db.cardImages.add(makeCardImage('i1', { cardId: 'c1', blobState: 'remote' }));
    const { calls } = await connect({ storage: { files: { 'user-1/i1': makeImageBlob(10) } } });

    const counts = await Promise.all([fetchMissingImages(['c1']), fetchMissingImages(['c1'])]);

    expect(downloadsOf(calls)).toHaveLength(1);
    expect(counts).toEqual([1, 1]);
    expect(await db.imageBlobs.count()).toBe(1);
  });

  it('não faz nada com a lista de cartões vazia', async () => {
    const { calls } = await connect();

    expect(await fetchMissingImages([])).toBe(0);
    expect(calls).toEqual([]);
  });
});

describe('fetchMissingImages — sem condições para baixar', () => {
  beforeEach(async () => {
    await db.cardImages.add(makeCardImage('i1', { cardId: 'c1', blobState: 'remote' }));
  });

  it('não chama a rede offline', async () => {
    const { calls } = await connect();
    setOnline(false);

    expect(await fetchMissingImages(['c1'])).toBe(0);
    expect(calls).toEqual([]);
  });

  it('não faz nada sem conta vinculada', async () => {
    const fake = createFakeSupabase({ session: { user: { id: 'user-1' } } });
    getSupabase.mockResolvedValue(fake.client);

    expect(await fetchMissingImages(['c1'])).toBe(0);
    expect(fake.calls).toEqual([]);
  });

  it('não faz nada sem Supabase configurado', async () => {
    await db.syncState.put({ key: 'boundUserId', value: 'user-1' });
    getSupabase.mockResolvedValue(null);

    expect(await fetchMissingImages(['c1'])).toBe(0);
    expect((await db.cardImages.get('i1'))?.blobState).toBe('remote');
  });

  it('não faz nada sem sessão ou com a sessão de outra conta', async () => {
    const noSession = await connect({ session: null });
    expect(await fetchMissingImages(['c1'])).toBe(0);
    const otherAccount = await connect({ session: { user: { id: 'user-2' } } });
    expect(await fetchMissingImages(['c1'])).toBe(0);

    expect([...noSession.calls, ...otherAccount.calls]).toEqual([]);
  });

  it('mantém remote quando o arquivo não existe na nuvem, sem lançar', async () => {
    await connect();

    expect(await fetchMissingImages(['c1'])).toBe(0);
    expect((await db.cardImages.get('i1'))?.blobState).toBe('remote');
    expect(await db.imageBlobs.count()).toBe(0);
  });

  it('mantém remote quando a rede falha no download, inclusive se o cliente lançar', async () => {
    await connect({ storage: { downloadError: () => ({ message: 'Failed to fetch' }) } });
    expect(await fetchMissingImages(['c1'])).toBe(0);
    await connect({
      storage: {
        downloadError: () => {
          throw new TypeError('rede');
        },
      },
    });

    expect(await fetchMissingImages(['c1'])).toBe(0);
    expect((await db.cardImages.get('i1'))?.blobState).toBe('remote');
  });
});

describe('storeDownloadedImage', () => {
  it('descarta o arquivo de uma imagem excluída enquanto baixava', async () => {
    const image = makeCardImage('i1', { blobState: 'remote' });
    await db.cardImages.add({ ...image, deletedAt: 9, blobState: 'pending-delete' });

    const stored = await storeDownloadedImage(image, makeImageBlob(10));

    expect(stored).toBe(false);
    expect(await db.imageBlobs.count()).toBe(0);
  });

  it('descarta o arquivo quando a imagem deixou de existir', async () => {
    expect(await storeDownloadedImage(makeCardImage('sumiu'), makeImageBlob(10))).toBe(false);
  });
});
