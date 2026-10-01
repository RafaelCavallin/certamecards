import { afterEach, describe, expect, it } from 'vitest';
import { resetDb } from '../../test/db-helpers';
import { makeTaggedCard } from '../../test/card-fixtures';
import { db } from './db';
import { deleteTag, planTagRename } from './tag-bulk';
import type { TagSummary } from './tags';

afterEach(resetDb);

const catalog: TagSummary[] = [
  { key: 'cespe', name: 'CESPE', count: 128 },
  { key: 'cebraspe', name: 'Cebraspe', count: 4 },
];

describe('planTagRename', () => {
  it('rename quando a chave nova não existe', () => {
    expect(planTagRename(catalog, { fromKey: 'cebraspe', newName: ' Banca  X ' })).toEqual({
      kind: 'rename', fromKey: 'cebraspe', name: 'Banca X',
    });
  });

  it('rename quando só muda caixa ou acento', () => {
    expect(planTagRename(catalog, { fromKey: 'cespe', newName: 'Cespé' }).kind).toBe('rename');
  });

  it('merge quando a chave nova é de outra etiqueta', () => {
    expect(planTagRename(catalog, { fromKey: 'cebraspe', newName: 'cespe' })).toEqual({
      kind: 'merge', fromKey: 'cebraspe', target: catalog[0], affected: 4,
    });
  });

  it('invalid para nome vazio ou acima de 40', () => {
    expect(planTagRename(catalog, { fromKey: 'cespe', newName: '  ' })).toEqual({ kind: 'invalid', reason: 'empty' });
    expect(planTagRename(catalog, { fromKey: 'cespe', newName: 'x'.repeat(41) })).toEqual({ kind: 'invalid', reason: 'too-long' });
  });
});

describe('deleteTag', () => {
  it('remove de todos os baralhos vivos sem apagar cartões nem tocar nos excluídos', async () => {
    await db.cards.bulkAdd([
      makeTaggedCard('a', ['x', 'y']),
      makeTaggedCard('b', ['X'], { deckId: 'deck-2', due: 77 }),
      makeTaggedCard('c', ['x'], { deletedAt: 5 }),
    ]);

    const result = await deleteTag('x');

    expect(result).toEqual({ updated: 2 });
    expect((await db.cards.get('a'))?.tags).toEqual(['y']);
    const other = await db.cards.get('b');
    expect(other?.tags).toEqual([]);
    expect(other?.deletedAt).toBe(0);
    expect(other?.due).toBe(77);
    expect((await db.cards.get('c'))?.tags).toEqual(['x']);
  });
});
