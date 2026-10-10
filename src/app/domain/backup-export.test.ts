import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDb } from '../../test/db-helpers';
import { createFakeSupabase } from '../../test/fake-supabase';
import { makeCard, makeDeck, makeImage, makeLog, makeSettings } from '../../test/backup-fixtures';
import { backupFileName, createBackup } from './backup-export';
import { estimateBackupSize } from './backup-estimate';
import { parseManifest } from './backup-manifest-read';
import { unzipImages, unzipManifest } from './backup-zip';
import { db } from './db';
import { hasStudyData } from './backup-records';

const getSupabase = vi.fn();
vi.mock('./supabase', () => ({ getSupabase: () => getSupabase() }));

function setOnline(value: boolean): void {
  Object.defineProperty(navigator, 'onLine', { configurable: true, value });
}

async function readBack(blob: Blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const { manifest, imagePaths } = unzipManifest(bytes);
  return { bytes, imagePaths, parsed: parseManifest(manifest, imagePaths) };
}

async function seedBasics(): Promise<void> {
  await db.decks.bulkAdd([makeDeck(), makeDeck({ id: 'deck-2', name: 'Penal' })]);
  await db.cards.bulkAdd(Array.from({ length: 50 }, (_, i) => makeCard({ id: `card-${i}`, deckId: i % 2 ? 'deck-2' : 'deck-1' })));
  await db.reviewLogs.bulkAdd(Array.from({ length: 300 }, (_, i) => makeLog({ id: `log-${i}`, cardId: `card-${i % 50}`, deckId: i % 2 ? 'deck-2' : 'deck-1' })));
  await db.settings.add(makeSettings());
}

async function seedImage(id: string, cardId: string, withFile: boolean): Promise<void> {
  await db.cardImages.add(makeImage({ id, cardId, blobState: withFile ? 'uploaded' : 'remote' }));
  if (withFile) await db.imageBlobs.add({ id, blob: new Blob([new Uint8Array([1, 2, 3, 4])], { type: 'image/webp' }) });
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

describe('backupFileName', () => {
  it('usa a data local, não a UTC', () => {
    expect(backupFileName(new Date(2026, 9, 2, 23, 30))).toBe('certamecards-backup-2026-10-02.zip');
  });
});

describe('createBackup', () => {
  it('gera um zip legível com tudo que há no aparelho', async () => {
    await seedBasics();
    for (const n of [1, 2, 3, 4]) await seedImage(`img-${n}`, `card-${n}`, true);

    const result = await createBackup();

    const { parsed, imagePaths } = await readBack(result.blob);
    expect(result.fileName).toMatch(/^certamecards-backup-\d{4}-\d{2}-\d{2}\.zip$/);
    expect([parsed.decks.length, parsed.cards.length, parsed.reviewLogs.length, parsed.images.length]).toEqual([2, 50, 300, 4]);
    expect(parsed.settings?.dailyGoal).toBe(40);
    expect(imagePaths.size).toBe(4);
    expect(parsed.discarded).toBe(0);
  });

  it('leva os cartões excluídos e o estado de agendamento sem dirty', async () => {
    await db.decks.add(makeDeck());
    await db.cards.bulkAdd([makeCard(), makeCard({ id: 'gone', deletedAt: 5 })]);

    const { parsed } = await readBack((await createBackup()).blob);

    expect(parsed.cards.map((card) => card.id).sort()).toEqual(['card-1', 'gone']);
    expect(parsed.cards.find((card) => card.id === 'card-1')).toMatchObject({ reps: 5, lapses: 1, stability: 12.4 });
  });

  it('recusa quando não há nada para salvar', async () => {
    await db.cards.add(makeCard({ deletedAt: 5 }));

    await expect(createBackup()).rejects.toMatchObject({ code: 'nothing-to-save' });
  });

  it('informa o progresso das três fases', async () => {
    await seedBasics();
    const onProgress = vi.fn();

    await createBackup(onProgress);

    const phases = onProgress.mock.calls.map(([progress]) => progress.phase);
    expect(phases).toEqual(['images', 'collect', 'zip']);
  });

  it('registra a conta vinculada ao aparelho', async () => {
    await seedBasics();
    await db.syncState.put({ key: 'boundUserId', value: 'user-1' });

    const { parsed } = await readBack((await createBackup()).blob);

    expect(parsed.accountId).toBe('user-1');
  });
});

describe('createBackup — imagem que só está na nuvem', () => {
  beforeEach(async () => {
    await seedBasics();
    await seedImage('img-local', 'card-1', true);
    await seedImage('img-cloud', 'card-2', false);
  });

  it('sem rede, deixa a imagem de fora e conta a ausência', async () => {
    setOnline(false);

    const result = await createBackup();

    const { parsed } = await readBack(result.blob);
    expect(result.missingImages).toBe(1);
    expect(parsed.images.map((image) => image.id)).toEqual(['img-local']);
  });

  it('com sessão e rede, baixa a imagem e a inclui', async () => {
    const fake = createFakeSupabase({
      session: { user: { id: 'user-1' } },
      storage: { files: { 'user-1/img-cloud': new Blob([new Uint8Array([9, 9, 9, 9])], { type: 'image/webp' }) } },
    });
    getSupabase.mockResolvedValue(fake.client);
    await db.syncState.put({ key: 'boundUserId', value: 'user-1' });

    const result = await createBackup();

    const { parsed, bytes } = await readBack(result.blob);
    expect(result.missingImages).toBe(0);
    expect(parsed.images.map((image) => image.id).sort()).toEqual(['img-cloud', 'img-local']);
    expect([...(unzipImages(bytes, ['images/img-cloud.webp']).get('images/img-cloud.webp') ?? [])]).toEqual([9, 9, 9, 9]);
  });

  it('não falha quando o download dá erro', async () => {
    getSupabase.mockRejectedValue(new Error('rede caiu'));
    await db.syncState.put({ key: 'boundUserId', value: 'user-1' });

    const result = await createBackup();

    expect(result.missingImages).toBe(1);
  });
});

describe('estimateBackupSize e hasStudyData', () => {
  it('estima o manifesto mais o tamanho das imagens com arquivo', async () => {
    await db.decks.add(makeDeck());
    await db.cards.add(makeCard());
    const without = await estimateBackupSize();
    await seedImage('img-1', 'card-1', true);

    const withImage = await estimateBackupSize();

    expect(without).toBeGreaterThan(500);
    expect(withImage).toBeGreaterThan(without + 4);
  });

  it('só há dados de estudo com cartão vivo ou revisão', async () => {
    await db.decks.add(makeDeck());
    expect(await hasStudyData()).toBe(false);

    await db.reviewLogs.add(makeLog());
    expect(await hasStudyData()).toBe(true);
  });
});
