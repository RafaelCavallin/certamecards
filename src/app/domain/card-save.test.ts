import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDb } from '../../test/db-helpers';
import { makeTaggedCard } from '../../test/card-fixtures';
import { makeCardImage, makeImageBlob } from '../../test/image-fixtures';
import { newGalleryItem } from '../../test/gallery-fixtures';
import { emptyDraft, loadCardDraft, type CardDraft } from './card-draft';
import { saveCardEdit, saveNewCard } from './card-save';
import { db } from './db';
import { moveItem, removeItem, setCaption } from './gallery-draft';

const NOW = 1_790_000_000_000;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
});

afterEach(async () => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  await resetDb();
});

function draftWith(gallery: CardDraft['gallery']): CardDraft {
  return { content: { ...emptyDraft().content, front: 'Frente', back: 'Verso' }, gallery };
}

async function seedCardWithImages(): Promise<void> {
  await db.cards.add(makeTaggedCard('c1', [], { front: 'Frente', back: 'Verso', due: 5000, reps: 3, lapses: 1, state: 2, updatedAt: 777 }));
  await db.cardImages.bulkAdd(
    ['i1', 'i2', 'i3'].map((id, position) => makeCardImage(id, { cardId: 'c1', position, dirty: 0, blobState: 'uploaded', updatedAt: 100 })),
  );
  await db.imageBlobs.bulkAdd(['i1', 'i2', 'i3'].map((id) => ({ id, blob: makeImageBlob(500) })));
}

describe('saveNewCard', () => {
  it('grava cartão, metadados e arquivos de uma vez, com o estado FSRS inicial', async () => {
    const draft = draftWith([newGalleryItem('n1', 'Mapa'), newGalleryItem('n2')]);

    const card = await saveNewCard({ deckId: 'd1', draft });

    const images = (await db.cardImages.toArray()).sort((a, b) => a.position - b.position);
    const blobs = await db.imageBlobs.toArray();
    expect(await db.cards.count()).toBe(1);
    expect(card).toMatchObject({ deckId: 'd1', state: 0, reps: 0, lapses: 0, due: NOW, createdAt: NOW, dirty: 1 });
    expect(images.map((image) => [image.id, image.cardId, image.position, image.blobState, image.dirty])).toEqual([
      ['n1', card.id, 0, 'local', 1],
      ['n2', card.id, 1, 'local', 1],
    ]);
    expect(blobs.map((record) => [record.id, record.blob.size, record.blob.type])).toEqual([
      ['n1', 1000, 'image/webp'],
      ['n2', 1000, 'image/webp'],
    ]);
  });

  it('não grava nada quando a cota do aparelho estoura', async () => {
    vi.spyOn(db.imageBlobs, 'bulkAdd').mockRejectedValue(new DOMException('cheio', 'QuotaExceededError'));

    const attempt = saveNewCard({ deckId: 'd1', draft: draftWith([newGalleryItem('n1')]) });

    await expect(attempt).rejects.toMatchObject({ code: 'storage-full', message: 'Sem espaço no aparelho para salvar as imagens.' });
    expect([await db.cards.count(), await db.cardImages.count(), await db.imageBlobs.count()]).toEqual([0, 0, 0]);
  });

  it('repassa um erro que não é de cota sem convertê-lo', async () => {
    vi.spyOn(db.imageBlobs, 'bulkAdd').mockRejectedValue(new Error('outra falha'));

    const attempt = saveNewCard({ deckId: 'd1', draft: draftWith([newGalleryItem('n1')]) });

    await expect(attempt).rejects.toThrow('outra falha');
    expect(await db.cards.count()).toBe(0);
  });
});

describe('saveCardEdit', () => {
  it('reordena e legenda, deixando suja só a imagem que mudou', async () => {
    await seedCardWithImages();
    const draft = (await loadCardDraft('c1'))!;
    const gallery = setCaption(moveItem(draft.gallery, 2, -1), 'i3', 'Mapa: atos');

    await saveCardEdit({ cardId: 'c1', draft: { ...draft, gallery } });

    const images = (await db.cardImages.toArray()).sort((a, b) => a.position - b.position);
    expect(images.map((image) => [image.id, image.position, image.caption, image.dirty])).toEqual([
      ['i1', 0, '', 0],
      ['i3', 1, 'Mapa: atos', 1],
      ['i2', 2, '', 1],
    ]);
    expect(images[1].updatedAt).toBe(NOW);
  });

  it('tombstona a imagem removida e apaga o arquivo local', async () => {
    await seedCardWithImages();
    const draft = (await loadCardDraft('c1'))!;

    await saveCardEdit({ cardId: 'c1', draft: { ...draft, gallery: removeItem(draft.gallery, 'i1') } });

    const removed = (await db.cardImages.get('i1'))!;
    expect(removed).toMatchObject({ deletedAt: NOW, updatedAt: NOW, blobState: 'pending-delete', dirty: 1 });
    expect(await db.imageBlobs.get('i1')).toBeUndefined();
    expect(await db.imageBlobs.count()).toBe(2);
  });

  it('adiciona imagem nova depois das salvas', async () => {
    await seedCardWithImages();
    const draft = (await loadCardDraft('c1'))!;

    await saveCardEdit({ cardId: 'c1', draft: { ...draft, gallery: [...draft.gallery, newGalleryItem('n1')] } });

    const added = (await db.cardImages.get('n1'))!;
    expect([added.cardId, added.position, added.blobState]).toEqual(['c1', 3, 'local']);
    expect((await db.imageBlobs.get('n1'))?.blob.size).toBe(1000);
  });

  it('não reagenda nem mexe no cartão quando só as imagens mudam', async () => {
    await seedCardWithImages();
    const draft = (await loadCardDraft('c1'))!;

    const saved = await saveCardEdit({ cardId: 'c1', draft: { ...draft, gallery: setCaption(draft.gallery, 'i1', 'Nova') } });

    const card = (await db.cards.get('c1'))!;
    expect([card.due, card.reps, card.lapses, card.state, card.updatedAt, card.dirty]).toEqual([5000, 3, 1, 2, 777, 0]);
    expect(saved.updatedAt).toBe(777);
  });

  it('muda o texto sem tocar nos campos do FSRS e devolve o cartão atualizado', async () => {
    await seedCardWithImages();
    const draft = (await loadCardDraft('c1'))!;
    const content = { ...draft.content, back: '  Verso novo  ' };

    const saved = await saveCardEdit({ cardId: 'c1', draft: { ...draft, content } });

    const card = (await db.cards.get('c1'))!;
    expect([card.back, card.updatedAt, card.due, card.reps, card.lapses, card.state]).toEqual(['Verso novo', NOW, 5000, 3, 1, 2]);
    expect(saved).toMatchObject({ back: 'Verso novo', updatedAt: NOW });
    expect(await db.reviewLogs.count()).toBe(0);
  });

  it('falha com mensagem clara quando o cartão não existe', async () => {
    const attempt = saveCardEdit({ cardId: 'nada', draft: draftWith([]) });

    await expect(attempt).rejects.toThrow('Cartão não encontrado.');
  });
});
