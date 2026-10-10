import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetDb } from '../../test/db-helpers';
import { dumpDevice, fileOf, seedDevice, tableCounts } from '../../test/backup-restore-helpers';
import { BACKUP_NOW, makeCard, makeContent, makeDeck, makeImage, makeLog, makeSettings, zipOfContent } from '../../test/backup-fixtures';
import { createBackup } from './backup-export';
import { readBackup, restoreBackup } from './backup-restore';
import { db } from './db';

afterEach(async () => {
  vi.restoreAllMocks();
  await resetDb();
});

const richContent = makeContent({
  decks: [makeDeck(), makeDeck({ id: 'deck-old', name: 'Antigo', deletedAt: BACKUP_NOW - 1000 })],
  cards: [
    makeCard(),
    makeCard({ id: 'card-2', front: 'Segundo', tags: ['CESPE', 'Art. 37'] }),
    makeCard({ id: 'card-gone', deletedAt: BACKUP_NOW - 5000, updatedAt: BACKUP_NOW - 5000 }),
  ],
  reviewLogs: [makeLog(), makeLog({ id: 'log-2', cardId: 'card-gone', rating: 'again' })],
  images: [makeImage()],
});

describe('backup → restaurar com Substituir em banco vazio', () => {
  it('deixa baralhos, cartões, etiquetas, revisões, configurações e imagens idênticos aos da origem', async () => {
    await seedDevice(richContent, { 'image-1': [1, 2, 3, 4] });
    const before = await dumpDevice();
    const { blob } = await createBackup();
    await resetDb();

    const preview = await readBackup(blob);
    await restoreBackup({ preview, plan: 'replace' });

    expect(await dumpDevice()).toEqual(before);
  });

  it('grava tudo como pendente de envio, com carimbo novo e imagens locais', async () => {
    await seedDevice(richContent, { 'image-1': [1, 2, 3, 4] });
    const { blob } = await createBackup();
    await resetDb();
    const startedAt = Date.now();

    await restoreBackup({ preview: await readBackup(blob), plan: 'replace' });

    const [decks, cards, logs, images] = await Promise.all([db.decks.toArray(), db.cards.toArray(), db.reviewLogs.toArray(), db.cardImages.toArray()]);
    expect([...decks, ...cards].every((row) => row.dirty === 1 && row.updatedAt >= startedAt)).toBe(true);
    expect(logs.every((log) => log.dirty === 1)).toBe(true);
    expect(images.map((image) => [image.blobState, image.dirty])).toEqual([['local', 1]]);
    expect((await db.settings.get('me'))?.dailyGoal).toBe(40);
  });

  it('informa o progresso até o total', async () => {
    await seedDevice(richContent, { 'image-1': [1, 2, 3, 4] });
    const { blob } = await createBackup();
    await resetDb();
    const onProgress = vi.fn();

    await restoreBackup({ preview: await readBackup(blob), plan: 'replace', onProgress });

    const last = onProgress.mock.calls.at(-1)?.[0];
    expect(last.done).toBe(last.total);
    expect(last.total).toBe(2 + 3 + 2 + 1 + 1);
  });

  it('relata o que foi aplicado, contando só os vivos', async () => {
    const preview = await readBackup(fileOf(zipOfContent(richContent)));

    const report = await restoreBackup({ preview, plan: 'replace' });

    expect(report).toEqual({ applied: { decks: 1, cards: 2, reviewLogs: 2, images: 1 }, keptLocal: 0, removed: 0, discarded: 0 });
  });
});

describe('readBackup não grava nada', () => {
  it('lê backup válido, recusa o inválido e deixa o banco igual', async () => {
    await seedDevice({ decks: [makeDeck({ id: 'local' })], cards: [makeCard({ id: 'local-card', deckId: 'local' })] });
    const before = await tableCounts();

    await readBackup(fileOf(zipOfContent(richContent)));
    await expect(readBackup(new Blob(['nada'], { type: 'text/plain' }))).rejects.toMatchObject({ code: 'not-backup' });

    expect(await tableCounts()).toEqual(before);
  });

  it('mostra a prévia só com os vivos e o tamanho das imagens', async () => {
    const preview = await readBackup(fileOf(zipOfContent(richContent)));

    expect(preview.counts).toEqual({ decks: 1, cards: 2, reviewLogs: 2, images: 1 });
    expect(preview.imageBytes).toBe(4);
    expect(preview.exportedAt).toBe(BACKUP_NOW);
  });

  it('recusa o arquivo sem baralho, cartão vivo nem revisão', async () => {
    const empty = makeContent({ decks: [], cards: [], reviewLogs: [], images: [], settings: makeSettings() });

    await expect(readBackup(fileOf(zipOfContent(empty)))).rejects.toMatchObject({ code: 'empty' });
  });

  it('detecta backup de outra conta só quando as duas contas existem', async () => {
    const file = fileOf(zipOfContent(richContent, 'user-B'));
    expect((await readBackup(file)).accountMismatch).toBe(false);

    await db.syncState.put({ key: 'boundUserId', value: 'user-A' });
    expect((await readBackup(file)).accountMismatch).toBe(true);
    expect((await readBackup(fileOf(zipOfContent(richContent, null)))).accountMismatch).toBe(false);
    expect((await readBackup(fileOf(zipOfContent(richContent, 'user-A')))).accountMismatch).toBe(false);
  });
});
