import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDb } from '../../test/db-helpers';
import { createFakeSupabase } from '../../test/fake-supabase';
import { fileOf, seedDevice, tableCounts } from '../../test/backup-restore-helpers';
import { BACKUP_NOW, makeCard, makeContent, makeDeck, makeImage, makeLog, zipOfContent } from '../../test/backup-fixtures';
import { readBackup, restoreBackup } from './backup-restore';
import { db } from './db';
import { DEFAULT_DECK_NAME } from './decks';

const getSupabase = vi.fn();
vi.mock('./supabase', () => ({ getSupabase: () => getSupabase() }));
const { syncNow } = await import('./sync');

function setOnline(value: boolean): void {
  Object.defineProperty(navigator, 'onLine', { configurable: true, value });
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

async function restoreFrom(content = makeContent(), plan: 'merge' | 'replace' = 'merge') {
  const preview = await readBackup(fileOf(zipOfContent(content)));
  return restoreBackup({ preview, plan });
}

describe('Mesclar', () => {
  const cards = [makeCard({ id: 'c1' }), makeCard({ id: 'c2' }), makeCard({ id: 'c3' })];
  const base = makeContent({ cards, reviewLogs: [makeLog({ id: 'l1', cardId: 'c1' })], images: [] });

  it('mantém a edição local mais nova e conta o que ficou', async () => {
    await seedDevice(base);
    await db.cards.update('c1', { front: 'Editado depois', updatedAt: BACKUP_NOW + 1000 });

    const report = await restoreFrom(base);

    expect((await db.cards.get('c1'))?.front).toBe('Editado depois');
    expect(report.keptLocal).toBeGreaterThanOrEqual(1);
  });

  it('depois de estudar: une as revisões, mantém o novo e a exclusão e preserva a agenda', async () => {
    await seedDevice(base);
    await db.reviewLogs.bulkAdd([makeLog({ id: 'l2', cardId: 'c2' }), makeLog({ id: 'l3', cardId: 'c3' })]);
    await db.cards.add(makeCard({ id: 'novo' }));
    await db.cards.update('c1', { reps: 6, due: BACKUP_NOW + 99, updatedAt: BACKUP_NOW + 1000 });
    await db.cards.update('c2', { deletedAt: BACKUP_NOW + 1000, updatedAt: BACKUP_NOW + 1000 });

    const report = await restoreFrom(base);

    expect(await db.reviewLogs.count()).toBe(3);
    expect(report.applied.reviewLogs).toBe(0);
    expect(await db.cards.get('novo')).toBeDefined();
    expect((await db.cards.get('c2'))?.deletedAt).toBe(BACKUP_NOW + 1000);
    expect(await db.cards.get('c1')).toMatchObject({ reps: 6, due: BACKUP_NOW + 99 });
  });

  it('não apaga nada que está no aparelho e fora do arquivo', async () => {
    await seedDevice({ decks: [makeDeck({ id: 'local' })], cards: [makeCard({ id: 'lc', deckId: 'local' })] });

    const report = await restoreFrom(base);

    expect((await db.decks.get('local'))?.deletedAt).toBe(0);
    expect((await db.cards.get('lc'))?.deletedAt).toBe(0);
    expect(report.removed).toBe(0);
  });

  it('mantém o arquivo do aparelho de uma imagem local mais nova e preenche o que faltava', async () => {
    const local = makeImage({ updatedAt: BACKUP_NOW + 500, blobState: 'remote', caption: 'Legenda local' });
    await seedDevice({ decks: [makeDeck()], cards: [makeCard()], images: [local] });

    await restoreFrom(makeContent());

    const image = await db.cardImages.get('image-1');
    expect(image).toMatchObject({ caption: 'Legenda local', blobState: 'uploaded', dirty: 0, updatedAt: BACKUP_NOW + 500 });
    expect([...new Uint8Array(await (await db.imageBlobs.get('image-1'))!.blob.arrayBuffer())]).toEqual([1, 2, 3, 4]);
  });
});

describe('Substituir', () => {
  const archive = makeContent({ images: [] });

  it('exclui o que não está no arquivo e preserva o histórico', async () => {
    await seedDevice({
      decks: [makeDeck({ id: 'penal', name: 'Penal' })],
      cards: [makeCard({ id: 'penal-card', deckId: 'penal' })],
      reviewLogs: [makeLog({ id: 'penal-log', cardId: 'penal-card', deckId: 'penal' })],
      images: [makeImage({ id: 'penal-img', cardId: 'penal-card' })],
    }, { 'penal-img': [7, 7] });

    const report = await restoreFrom(archive, 'replace');

    expect(await db.decks.get('penal')).toMatchObject({ deletedAt: expect.any(Number), dirty: 1 });
    expect((await db.cards.get('penal-card'))?.deletedAt).toBeGreaterThan(0);
    expect(await db.cardImages.get('penal-img')).toMatchObject({ blobState: 'pending-delete', dirty: 1 });
    expect(await db.imageBlobs.get('penal-img')).toBeUndefined();
    expect(await db.reviewLogs.get('penal-log')).toBeDefined();
    expect(report.removed).toBe(2);
  });

  it('grava o arquivo por cima mesmo quando o aparelho tem versão mais nova', async () => {
    await seedDevice(archive);
    await db.cards.update('card-1', { front: 'Mais novo no aparelho', updatedAt: BACKUP_NOW + 9000 });

    await restoreFrom(archive, 'replace');

    expect((await db.cards.get('card-1'))?.front).toBe('O mandato é de quatro anos');
  });
});

describe('baralho padrão intocado', () => {
  const archive = makeContent({ decks: [makeDeck({ id: 'a' }), makeDeck({ id: 'b' })], cards: [makeCard({ deckId: 'a' })], images: [] });

  async function liveDeckIds(): Promise<string[]> {
    return (await db.decks.where('deletedAt').equals(0).primaryKeys()).sort();
  }

  it('some quando o aparelho só tem o padrão vazio', async () => {
    await db.decks.add(makeDeck({ id: 'seed', name: DEFAULT_DECK_NAME }));

    await restoreFrom(archive);

    expect(await liveDeckIds()).toEqual(['a', 'b']);
    expect(await db.decks.get('seed')).toMatchObject({ dirty: 1 });
  });

  it('fica quando já tem cartão, outro nome ou o arquivo não traz baralho vivo', async () => {
    await db.decks.add(makeDeck({ id: 'seed', name: DEFAULT_DECK_NAME }));
    await db.cards.add(makeCard({ id: 'mine', deckId: 'seed' }));
    await restoreFrom(archive);
    expect(await liveDeckIds()).toEqual(['a', 'b', 'seed']);
  });
});

describe('tudo-ou-nada', () => {
  const archive = makeContent({ decks: [makeDeck({ id: 'a' })], cards: [makeCard({ id: 'x', deckId: 'a' })], images: [] });

  it('uma falha no meio não deixa nada do arquivo', async () => {
    await seedDevice({ decks: [makeDeck({ id: 'local' })] });
    const before = await tableCounts();
    const spy = vi.spyOn(db.cards, 'bulkPut').mockRejectedValue(new Error('falha simulada'));

    await expect(restoreFrom(archive, 'replace')).rejects.toThrow('falha simulada');

    expect(await tableCounts()).toEqual(before);
    expect((await db.decks.get('local'))?.deletedAt).toBe(0);
    spy.mockRestore();
    await restoreFrom(archive, 'replace');
    expect(await db.cards.count()).toBe(1);
  });

  it('falta de espaço vira storage-full e não altera nada', async () => {
    await seedDevice({ decks: [makeDeck({ id: 'local' })] });
    const before = await tableCounts();
    vi.spyOn(db.cards, 'bulkPut').mockRejectedValue(new DOMException('cheio', 'QuotaExceededError'));

    await expect(restoreFrom(archive)).rejects.toMatchObject({ code: 'storage-full' });

    expect(await tableCounts()).toEqual(before);
  });
});

describe('restauração com conta', () => {
  async function connect(files: Record<string, Blob> = {}) {
    const fake = createFakeSupabase({ session: { user: { id: 'user-1' } }, storage: { files } });
    getSupabase.mockResolvedValue(fake.client);
    await db.syncState.put({ key: 'boundUserId', value: 'user-1' });
    return fake;
  }

  const withEverything = makeContent({
    cards: [makeCard(), makeCard({ id: 'gone', deletedAt: BACKUP_NOW, updatedAt: BACKUP_NOW })],
    reviewLogs: [makeLog(), makeLog({ id: 'l2', cardId: 'gone' })],
  });

  it('o que foi restaurado sobe na sincronização, decks e cartões antes das revisões', async () => {
    const fake = await connect();
    await seedDevice({ decks: [makeDeck({ id: 'orphan' })], cards: [makeCard({ id: 'orphan-card', deckId: 'orphan' })] });
    await restoreFrom(withEverything, 'replace');

    const outcome = await syncNow('manual');

    const pushes = fake.rpcCalls.filter((call) => call.name === 'sync_push').map((call) => call.args as Record<string, { id: string; deleted_at?: number }[]>);
    const cardsPushed = pushes.flatMap((args) => args.p_cards);
    expect(outcome.status).toBe('ok');
    expect(cardsPushed.find((card) => card.id === 'orphan-card')?.deleted_at).toBeGreaterThan(0);
    expect(pushes.findIndex((args) => args.p_cards.length > 0)).toBeLessThan(pushes.findIndex((args) => args.p_logs.length > 0));
    expect(fake.calls).toContain('upload:user-1/image-1');
    expect(await db.cards.filter((card) => card.dirty === 1).count()).toBe(0);
    expect((await db.cardImages.get('image-1'))?.blobState).toBe('uploaded');
  });

  it('imagem que já existe na nuvem termina como enviada', async () => {
    await connect({ 'user-1/image-1': new Blob([new Uint8Array([1, 2, 3, 4])]) });
    await restoreFrom(withEverything, 'replace');

    await syncNow('manual');

    expect((await db.cardImages.get('image-1'))?.blobState).toBe('uploaded');
  });
});
