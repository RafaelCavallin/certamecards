import { describe, expect, it } from 'vitest';
import { makeCardImage } from '../../test/image-fixtures';
import { newGalleryItem, savedGalleryItem } from '../../test/gallery-fixtures';
import { acceptedCount, moveItem, planGallerySave, removeItem, setCaption } from './gallery-draft';

const NOW = 5000;

describe('acceptedCount', () => {
  it('aceita só o que cabe até o limite de 6', () => {
    expect([acceptedCount(4, 5), acceptedCount(6, 1), acceptedCount(0, 3), acceptedCount(0, 9)]).toEqual([2, 0, 3, 6]);
  });
});

describe('moveItem, removeItem e setCaption', () => {
  const items = [savedGalleryItem('a'), savedGalleryItem('b'), savedGalleryItem('c')];

  it('move a terceira imagem para a esquerda sem mutar a lista original', () => {
    const moved = moveItem(items, 2, -1);

    expect(moved.map((item) => item.id)).toEqual(['a', 'c', 'b']);
    expect(items.map((item) => item.id)).toEqual(['a', 'b', 'c']);
  });

  it('não move além das pontas e devolve a mesma lista', () => {
    expect(moveItem(items, 0, -1)).toBe(items);
    expect(moveItem(items, 2, 1)).toBe(items);
    expect(moveItem(items, 7, -1)).toBe(items);
  });

  it('remove pelo id sem mutar', () => {
    const rest = removeItem(items, 'b');

    expect(rest.map((item) => item.id)).toEqual(['a', 'c']);
    expect(items).toHaveLength(3);
  });

  it('legenda só a imagem pedida', () => {
    const captioned = setCaption(items, 'b', 'Mapa');

    expect(captioned.map((item) => item.caption)).toEqual(['', 'Mapa', '']);
    expect(items[1].caption).toBe('');
  });
});

describe('planGallerySave', () => {
  it('planeja adições com estado local, posição pela ordem e legenda aparada', () => {
    const items = [newGalleryItem('n1', '  Mapa  '), newGalleryItem('n2')];

    const plan = planGallerySave({ cardId: 'c1', saved: [], items, now: NOW });

    expect(plan.adds.map((add) => [add.image.id, add.image.position, add.image.caption, add.image.blobState])).toEqual([
      ['n1', 0, 'Mapa', 'local'],
      ['n2', 1, '', 'local'],
    ]);
    expect(plan.adds[0].image).toMatchObject({ cardId: 'c1', createdAt: NOW, updatedAt: NOW, deletedAt: 0, dirty: 1 });
    expect([plan.updates, plan.removals]).toEqual([[], []]);
  });

  it('só gera update para a imagem cuja posição ou legenda mudou', () => {
    const saved = [makeCardImage('a', { position: 0 }), makeCardImage('b', { position: 1 }), makeCardImage('c', { position: 2 })];
    const items = [savedGalleryItem('a'), savedGalleryItem('c', 'Mapa: atos'), savedGalleryItem('b')];

    const plan = planGallerySave({ cardId: 'card-1', saved, items, now: NOW });

    expect(plan.updates).toEqual([
      { id: 'c', changes: { position: 1, caption: 'Mapa: atos', updatedAt: NOW } },
      { id: 'b', changes: { position: 2, caption: '', updatedAt: NOW } },
    ]);
  });

  it('marca como remoção a imagem salva que saiu do rascunho', () => {
    const saved = [makeCardImage('a'), makeCardImage('b', { position: 1 })];

    const plan = planGallerySave({ cardId: 'card-1', saved, items: [savedGalleryItem('a')], now: NOW });

    expect(plan.removals).toEqual(['b']);
    expect(plan.updates).toEqual([]);
  });

  it('limita a posição gravada a 5 mesmo com mais de 6 itens', () => {
    const items = Array.from({ length: 8 }, (_, index) => newGalleryItem(`n${index}`));

    const plan = planGallerySave({ cardId: 'c1', saved: [], items, now: NOW });

    expect(plan.adds.map((add) => add.image.position)).toEqual([0, 1, 2, 3, 4, 5, 5, 5]);
  });

  it('corta a legenda em 200 caracteres', () => {
    const plan = planGallerySave({ cardId: 'c1', saved: [], items: [newGalleryItem('n1', 'x'.repeat(250))], now: NOW });

    expect(plan.adds[0].image.caption).toHaveLength(200);
  });
});
