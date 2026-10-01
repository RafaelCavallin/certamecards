import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetDb } from '../../test/db-helpers';
import { makeDeck, makeTaggedCard } from '../../test/card-fixtures';
import { convertNotes, previewDrafts, type ConversionSetup } from './anki-convert-batch';
import { catalogByKey } from './anki-tags';
import type { AnkiNote } from './anki-types';
import { db } from './db';
import { listTagCatalog } from './tag-catalog';

afterEach(resetDb);

const setup: ConversionSetup = {
  notetypes: [
    { id: 'b', name: 'Básico', fields: ['Frente', 'Verso'], kind: 'normal' },
    { id: 'o', name: 'Oclusão', fields: ['Occlusion'], kind: 'image-occlusion' },
  ],
  mappings: { b: { include: true, front: 0, back: 1, notes: null }, o: { include: false, front: 0, back: null, notes: null } },
  catalog: new Map(),
};

function basicNotes(count: number, tags = ''): AnkiNote[] {
  return Array.from({ length: count }, (_, index) => ({ notetypeId: 'b', fields: [`f${index}`, 'v'], tags, deck: '' }));
}

describe('convertNotes', () => {
  it('converte em lotes, conta pulados e etiquetas descartadas', async () => {
    const notes = [...basicNotes(1200, 'leech ok'), { notetypeId: 'o', fields: ['x'], tags: '', deck: '' }];
    const onProgress = vi.fn();

    const result = await convertNotes({ notes, setup, onProgress });

    expect(result.drafts).toHaveLength(1200);
    expect(result.skipped['unsupported-type']).toBe(1);
    expect(result.droppedTags).toBe(1200);
    expect(onProgress.mock.calls.map(([done]) => done)).toEqual([500, 1000, 1201]);
  });

  it('para com cancelled quando o sinal é abortado', async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(convertNotes({ notes: basicNotes(10), setup, signal: controller.signal })).rejects.toMatchObject({
      code: 'cancelled',
    });
  });
});

describe('previewDrafts', () => {
  it('devolve os 3 primeiros rascunhos, pulando as notas inválidas', () => {
    const notes = [{ notetypeId: 'b', fields: ['', 'v'], tags: '', deck: '' }, ...basicNotes(5)];

    expect(previewDrafts(notes, setup).map((draft) => draft.front)).toEqual(['f0', 'f1', 'f2']);
  });
});

describe('grafia do catálogo vinda do Dexie', () => {
  it('grava “CESPE” para a etiqueta cespe do Anki quando o app já usa “CESPE”', async () => {
    await db.decks.add(makeDeck('deck-1'));
    await db.cards.add(makeTaggedCard('c1', ['CESPE']));
    const catalog = catalogByKey(await listTagCatalog());

    const result = await convertNotes({ notes: basicNotes(1, 'cespe'), setup: { ...setup, catalog } });

    expect(result.drafts[0].tags).toEqual(['CESPE']);
  });
});
