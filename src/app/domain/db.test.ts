import Dexie from 'dexie';
import { afterEach, describe, expect, it } from 'vitest';
import { resetDb } from '../../test/db-helpers';
import { db, uid, type CardImage } from './db';
import { EMPTY_CARD_MARKS } from './text-marks';
import { makeCardImage, makeImageBlob } from '../../test/image-fixtures';

afterEach(resetDb);

describe('uid', () => {
  it('gera identificadores diferentes a cada chamada', () => {
    expect(uid()).not.toBe(uid());
  });
});

describe('dirty-tracking nas tabelas', () => {
  it('marca dirty=1 e deletedAt=0 ao criar um baralho sem esses campos', async () => {
    await db.decks.add({
      id: 'd1',
      name: 'Meus cartões',
      newCardsPerDay: 20,
      youngLimit: 50,
      requestRetention: 0.9,
      createdAt: 1000,
      updatedAt: 1000,
    } as never);

    const deck = (await db.decks.get('d1'))!;
    expect(deck.dirty).toBe(1);
    expect(deck.deletedAt).toBe(0);
  });

  it('marca dirty=1 ao criar um cartão sem o campo', async () => {
    await db.cards.add({
      id: 'c1',
      deckId: 'd1',
      front: 'Frente',
      back: 'Verso',
      notes: '',
      marks: EMPTY_CARD_MARKS,
      tags: [],
      due: 1000,
      stability: 1,
      difficulty: 1,
      elapsedDays: 0,
      scheduledDays: 0,
      learningSteps: 0,
      reps: 0,
      lapses: 0,
      state: 0,
      createdAt: 1000,
      updatedAt: 1000,
    } as never);

    expect((await db.cards.get('c1'))!.dirty).toBe(1);
  });

  it('marca dirty=1 ao criar uma configuração sem o campo', async () => {
    await db.settings.add({
      id: 'me',
      dailyGoal: null,
      reminderEnabled: false,
      reminderMinute: 1200,
      timeZone: 'America/Sao_Paulo',
      updatedAt: 1000,
    } as never);

    expect((await db.settings.get('me'))!.dirty).toBe(1);
  });
});

describe('imagens das Notas', () => {
  it('marca dirty=1 e deletedAt=0 ao criar uma imagem sem os campos', async () => {
    const bare: Partial<CardImage> = makeCardImage('i1');
    delete bare.dirty;
    delete bare.deletedAt;

    await db.cardImages.add(bare as never);

    const image = (await db.cardImages.get('i1'))!;
    expect([image.dirty, image.deletedAt]).toEqual([1, 0]);
  });

  it('marca dirty=1 ao alterar a legenda de uma imagem limpa', async () => {
    await db.cardImages.add(makeCardImage('i1', { dirty: 0 }));

    await db.cardImages.update('i1', { caption: 'Mapa' });

    expect((await db.cardImages.get('i1'))!.dirty).toBe(1);
  });

  it('guarda o arquivo com tipo e tamanho intactos', async () => {
    await db.imageBlobs.add({ id: 'i1', blob: makeImageBlob(2048, 'image/webp') });

    const stored = (await db.imageBlobs.get('i1'))!;

    expect([stored.blob.size, stored.blob.type]).toEqual([2048, 'image/webp']);
  });

  it('encontra as imagens pelo cartão e pelo estado do arquivo', async () => {
    await db.cardImages.bulkAdd([
      makeCardImage('i1', { cardId: 'a', blobState: 'local' }),
      makeCardImage('i2', { cardId: 'a', blobState: 'remote' }),
      makeCardImage('i3', { cardId: 'b', blobState: 'local' }),
    ]);

    const ofCardA = await db.cardImages.where('cardId').equals('a').count();
    const local = await db.cardImages.where('blobState').equals('local').count();

    expect([ofCardA, local]).toEqual([2, 2]);
  });
});

describe('migração do Dexie da versão 1 para a 2', () => {
  const NAME = 'certamecards-upgrade-test';
  const V1_STORES = {
    decks: 'id, name, createdAt, dirty, deletedAt',
    cards: 'id, deckId, due, state, createdAt, updatedAt, dirty, deletedAt, [deckId+deletedAt]',
    reviewLogs: 'id, cardId, deckId, reviewedAt, dirty',
    settings: 'id, dirty',
    syncState: 'key',
  };

  afterEach(async () => {
    await Dexie.delete(NAME);
  });

  it('mantém os cartões existentes e cria as tabelas de imagem vazias', async () => {
    const legacy = new Dexie(NAME);
    legacy.version(1).stores(V1_STORES);
    await legacy.table('cards').add({ id: 'c1', deckId: 'd1', front: 'Frente', deletedAt: 0 });
    legacy.close();

    const upgraded = new Dexie(NAME);
    upgraded.version(1).stores(V1_STORES);
    upgraded.version(2).stores({ cardImages: 'id, cardId, dirty, deletedAt, blobState', imageBlobs: 'id' });
    await upgraded.open();

    const kept = await upgraded.table('cards').get('c1');
    const counts = [await upgraded.table('cardImages').count(), await upgraded.table('imageBlobs').count()];
    upgraded.close();
    expect(kept.front).toBe('Frente');
    expect(counts).toEqual([0, 0]);
  });
});
