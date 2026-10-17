import { afterEach, describe, expect, it } from 'vitest';
import { resetDb } from '../../test/db-helpers';
import { makeTaggedCard } from '../../test/card-fixtures';
import { makeCardImage, makeImageBlob } from '../../test/image-fixtures';
import { newGalleryItem, savedGalleryItem } from '../../test/gallery-fixtures';
import { emptyDraft, hasDraftChanges, loadCardDraft, type CardDraft } from './card-draft';
import { db } from './db';
import { moveItem, removeItem, setCaption } from './gallery-draft';

afterEach(resetDb);

function baseDraft(): CardDraft {
  return {
    content: { ...emptyDraft().content, front: 'Frente', back: 'Verso', notes: 'Notas', tags: ['CESPE'] },
    gallery: [savedGalleryItem('a', 'Mapa'), savedGalleryItem('b')],
  };
}

describe('hasDraftChanges', () => {
  it('considera igual um rascunho idêntico ao inicial', () => {
    expect(hasDraftChanges(baseDraft(), baseDraft())).toBe(false);
  });

  it('ignora espaços nas pontas do texto e da legenda', () => {
    const current = baseDraft();
    current.content = { ...current.content, front: '  Frente  ' };
    current.gallery = setCaption(current.gallery, 'a', ' Mapa ');

    expect(hasDraftChanges(baseDraft(), current)).toBe(false);
  });

  it('detecta mudança de Frente, Verso, Notas e etiquetas isoladamente', () => {
    const fields = [{ front: 'Outra' }, { back: 'Outro' }, { notes: 'Outras' }, { tags: ['FGV'] }];

    const results = fields.map((change) => {
      const current = baseDraft();
      current.content = { ...current.content, ...change };
      return hasDraftChanges(baseDraft(), current);
    });

    expect(results).toEqual([true, true, true, true]);
  });

  it('detecta mudança nas marcas', () => {
    const current = baseDraft();
    current.content = { ...current.content, marks: { ...current.content.marks, front: { cloze: [{ start: 0, end: 3 }], emphasis: [] } } };

    expect(hasDraftChanges(baseDraft(), current)).toBe(true);
  });

  it('detecta ordem, legenda, remoção e imagem nova na galeria', () => {
    const base = baseDraft();
    const variants = [
      moveItem(base.gallery, 1, -1),
      setCaption(base.gallery, 'b', 'Nova'),
      removeItem(base.gallery, 'a'),
      [...base.gallery, newGalleryItem('n1')],
    ];

    const results = variants.map((gallery) => hasDraftChanges(baseDraft(), { ...baseDraft(), gallery }));

    expect(results).toEqual([true, true, true, true]);
  });
});

describe('loadCardDraft', () => {
  it('devolve null para cartão inexistente', async () => {
    expect(await loadCardDraft('nada')).toBeNull();
  });

  it('carrega texto e galeria em ordem, com blob nulo para imagem ainda não baixada', async () => {
    await db.cards.add(makeTaggedCard('c1', ['CESPE'], { front: 'F', back: 'V', notes: 'N' }));
    await db.cardImages.bulkAdd([
      makeCardImage('i2', { cardId: 'c1', position: 1, caption: 'Segunda', blobState: 'remote' }),
      makeCardImage('i1', { cardId: 'c1', position: 0, caption: 'Primeira' }),
      makeCardImage('gone', { cardId: 'c1', position: 2, deletedAt: 9 }),
    ]);
    await db.imageBlobs.add({ id: 'i1', blob: makeImageBlob() });

    const draft = await loadCardDraft('c1');

    expect(draft?.content).toMatchObject({ front: 'F', back: 'V', notes: 'N', tags: ['CESPE'] });
    expect(draft?.gallery.map((item) => [item.id, item.origin, item.caption, item.blob !== null])).toEqual([
      ['i1', 'saved', 'Primeira', true],
      ['i2', 'saved', 'Segunda', false],
    ]);
  });
});
