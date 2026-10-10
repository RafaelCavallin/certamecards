import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDb } from '../../test/db-helpers';
import { createFakeSupabase } from '../../test/fake-supabase';
import { makeCardImage, makeImageBlob } from '../../test/image-fixtures';
import { db } from './db';
import { pushImages } from './image-sync-push';

const USER = 'user-1';

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(async () => {
  vi.restoreAllMocks();
  await resetDb();
});

async function seedLocalImage(id: string, size = 300): Promise<void> {
  await db.cardImages.add(makeCardImage(id, { blobState: 'local' }));
  await db.imageBlobs.add({ id, blob: makeImageBlob(size) });
}

function sentIds(args: unknown): string[] {
  return (args as { p_images: { id: string }[] }).p_images.map((image) => image.id);
}

describe('pushImages — arquivo, depois metadados', () => {
  it('sobe o arquivo antes dos metadados e marca a imagem como enviada e limpa', async () => {
    await seedLocalImage('i1');
    const { client, calls, files } = createFakeSupabase();

    const result = await pushImages(client, USER);

    expect(calls).toEqual(['upload:user-1/i1', 'rpc:sync_push_images']);
    expect(files.get('user-1/i1')?.size).toBe(300);
    expect(await db.cardImages.get('i1')).toMatchObject({ blobState: 'uploaded', dirty: 0 });
    expect(result).toEqual({ pushed: 1, failed: 0 });
  });

  it('trata o 409 do reenvio como sucesso e continua com os metadados', async () => {
    await seedLocalImage('i1');
    const { client, calls } = createFakeSupabase({ storage: { files: { 'user-1/i1': makeImageBlob(300) } } });

    const result = await pushImages(client, USER);

    expect(calls).toEqual(['upload:user-1/i1', 'rpc:sync_push_images']);
    expect(await db.cardImages.get('i1')).toMatchObject({ blobState: 'uploaded', dirty: 0 });
    expect(result.failed).toBe(0);
  });

  it('nunca envia metadado de imagem cujo arquivo não subiu', async () => {
    await seedLocalImage('ok');
    await seedLocalImage('falha');
    const { client, rpcCalls } = createFakeSupabase({
      storage: { uploadError: (path) => (path.endsWith('falha') ? { message: 'boom', status: 500 } : null) },
    });

    const result = await pushImages(client, USER);

    expect(sentIds(rpcCalls[0].args)).toEqual(['ok']);
    expect(await db.cardImages.get('falha')).toMatchObject({ blobState: 'local', dirty: 1 });
    expect(await db.cardImages.get('ok')).toMatchObject({ blobState: 'uploaded', dirty: 0 });
    expect(result).toEqual({ pushed: 1, failed: 1 });
  });

  it('não sobe imagem local cujo arquivo sumiu do aparelho', async () => {
    await db.cardImages.add(makeCardImage('sem-arquivo', { blobState: 'local' }));
    const { client, calls } = createFakeSupabase();

    const result = await pushImages(client, USER);

    expect(calls).toEqual([]);
    expect(result.failed).toBe(1);
  });

  it('envia a legenda de uma imagem que só existe na nuvem (remote)', async () => {
    await db.cardImages.add(makeCardImage('r1', { blobState: 'remote', caption: 'Nova', dirty: 1 }));
    const { client, rpcCalls, calls } = createFakeSupabase();

    await pushImages(client, USER);

    expect(calls).toEqual(['rpc:sync_push_images']);
    expect(sentIds(rpcCalls[0].args)).toEqual(['r1']);
    expect((await db.cardImages.get('r1'))?.dirty).toBe(0);
  });

  it('não reenvia o que já está limpo', async () => {
    await db.cardImages.add(makeCardImage('i1', { blobState: 'uploaded', dirty: 0 }));
    const { client, calls } = createFakeSupabase();

    await pushImages(client, USER);

    expect(calls).toEqual([]);
  });

  it('divide mais de 200 imagens em lotes na RPC', async () => {
    const images = Array.from({ length: 201 }, (_, index) => makeCardImage(`i${index}`, { blobState: 'uploaded' }));
    await db.cardImages.bulkAdd(images);
    const { client, rpcCalls } = createFakeSupabase();

    await pushImages(client, USER);

    expect(rpcCalls.map((call) => sentIds(call.args).length)).toEqual([200, 1]);
  });

  it('mantém sujo e conta a falha quando a RPC rejeita o lote, sem lançar', async () => {
    await db.cardImages.add(makeCardImage('i1', { blobState: 'uploaded' }));
    const { client } = createFakeSupabase({ rpc: () => ({ error: { message: 'check', code: '23514' } }) });

    const result = await pushImages(client, USER);

    expect(result).toEqual({ pushed: 0, failed: 1 });
    expect((await db.cardImages.get('i1'))?.dirty).toBe(1);
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('23514'), { ids: ['i1'] });
  });

  it('isola a fase que lança e segue para as próximas', async () => {
    await seedLocalImage('i1');
    const { client, calls } = createFakeSupabase({ storage: { uploadError: () => { throw new TypeError('rede'); } } });

    const result = await pushImages(client, USER);

    expect(result.failed).toBeGreaterThan(0);
    expect(calls).toEqual(['upload:user-1/i1']);
    expect((await db.cardImages.get('i1'))?.blobState).toBe('local');
  });
});

describe('pushImages — CAS', () => {
  it('mantém suja a legenda editada durante o envio e a leva no próximo push', async () => {
    await db.cardImages.add(makeCardImage('i1', { blobState: 'uploaded', updatedAt: 1 }));
    let edited = false;
    const { client, rpcCalls } = createFakeSupabase({
      rpc: async () => {
        if (!edited) await db.cardImages.update('i1', { caption: 'Nova', updatedAt: 2 });
        edited = true;
        return { error: null };
      },
    });

    await pushImages(client, USER);
    const afterFirst = await db.cardImages.get('i1');
    await pushImages(client, USER);

    expect([afterFirst?.dirty, afterFirst?.caption]).toEqual([1, 'Nova']);
    expect((rpcCalls[1].args as { p_images: { caption: string }[] }).p_images[0].caption).toBe('Nova');
    expect((await db.cardImages.get('i1'))?.dirty).toBe(0);
  });
});

describe('pushImages — exclusão', () => {
  async function seedTombstone(): Promise<void> {
    await db.cardImages.add(makeCardImage('i1', { deletedAt: 9, updatedAt: 9, blobState: 'pending-delete', dirty: 1 }));
  }

  it('sobe o tombstone antes de apagar o arquivo e mantém pending-delete se a limpeza falha', async () => {
    await seedTombstone();
    const { client, calls } = createFakeSupabase({ storage: { removeError: () => ({ message: 'fora do ar', status: 500 }) } });

    const result = await pushImages(client, USER);

    expect(calls).toEqual(['rpc:sync_push_images', 'remove:user-1/i1']);
    expect(await db.cardImages.get('i1')).toMatchObject({ blobState: 'pending-delete', dirty: 0 });
    expect(result.failed).toBe(1);
  });

  it('tenta a limpeza de novo na próxima sincronização e então marca como purged', async () => {
    await seedTombstone();
    let down = true;
    const { client, calls } = createFakeSupabase({ storage: { removeError: () => (down ? { message: 'fora do ar' } : null) } });
    await pushImages(client, USER);
    down = false;

    const result = await pushImages(client, USER);

    expect(calls.slice(2)).toEqual(['remove:user-1/i1']);
    expect((await db.cardImages.get('i1'))?.blobState).toBe('purged');
    expect(result.failed).toBe(0);
  });

  it('não apaga o arquivo enquanto o tombstone ainda não subiu', async () => {
    await seedTombstone();
    const { client, calls } = createFakeSupabase({ rpc: () => ({ error: { message: 'x', code: '500' } }) });

    await pushImages(client, USER);

    expect(calls).toEqual(['rpc:sync_push_images']);
    expect((await db.cardImages.get('i1'))?.blobState).toBe('pending-delete');
  });

  it('não repete a limpeza de uma imagem já purged', async () => {
    await db.cardImages.add(makeCardImage('i1', { deletedAt: 9, blobState: 'purged', dirty: 0 }));
    const { client, calls } = createFakeSupabase();

    await pushImages(client, USER);

    expect(calls).toEqual([]);
  });
});
