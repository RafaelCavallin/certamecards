import { afterEach, describe, expect, it } from 'vitest';
import { buildLegacyPackage, loadTestWasm, packageFile } from '../../test/anki-builder';
import { resetDb } from '../../test/db-helpers';
import { createFakeSupabase } from '../../test/fake-supabase';
import { convertNotes } from './anki-convert-batch';
import { importDrafts } from './anki-import';
import { suggestMapping } from './anki-mapping';
import { prepareAnkiReader, readAnkiFile } from './anki-reader';
import { db } from './db';
import { pushDirty } from './sync-push';

afterEach(resetDb);

const NOTETYPES = [
  { id: 1, name: 'Básico', fields: ['Frente', 'Verso'] },
  { id: 2, name: 'Questão', fields: ['Enunciado', 'Gabarito', 'Comentário'] },
  { id: 3, name: 'Lacuna', fields: ['Texto', 'Extra'], type: 1 },
];

const NOTES = [
  { notetypeId: 1, fields: ['É <b>vedado</b>', '<div>um</div><div>dois</div>'], tags: 'cespe' },
  { notetypeId: 2, fields: ['Prazo?', '5 dias', 'Art. 10'], tags: '' },
  { notetypeId: 3, fields: ['A {{c1::União}} legisla {{c2::privativamente}}', 'Art. 22'], tags: 'cespe constitucional' },
];

async function importPackage(notes = NOTES): Promise<string> {
  const reader = await prepareAnkiReader(loadTestWasm);
  const collection = await readAnkiFile(packageFile(await buildLegacyPackage({ notetypes: NOTETYPES, notes })), reader);
  const mappings = Object.fromEntries(collection.notetypes.map((type) => [type.id, suggestMapping(type)]));
  const setup = { notetypes: collection.notetypes, mappings, catalog: new Map<string, string>() };
  const conversion = await convertNotes({ notes: collection.notes, setup });
  const target = { kind: 'new' as const, name: 'Constitucional' };
  const outcome = await importDrafts({ drafts: conversion.drafts, target, signal: new AbortController().signal, onProgress: () => undefined });
  return outcome.deckId;
}

describe('pacote legado de ponta a ponta', () => {
  it('grava cartões com texto, marcas, Notas e etiquetas', async () => {
    const deckId = await importPackage();

    const cards = await db.cards.where('deckId').equals(deckId).sortBy('createdAt');
    expect(cards.map((card) => [card.front, card.back, card.notes, card.tags])).toEqual([
      ['É vedado', 'um\ndois', '', ['cespe']],
      ['Prazo?', '5 dias', 'Art. 10', []],
      ['A União legisla privativamente', 'A União legisla privativamente', 'Art. 22', ['cespe', 'constitucional']],
      ['A União legisla privativamente', 'A União legisla privativamente', 'Art. 22', ['cespe', 'constitucional']],
    ]);
    expect(cards[0].marks.front.emphasis).toEqual([{ start: 2, end: 8 }]);
    expect(cards[2].marks.front.cloze).toEqual([{ start: 2, end: 7 }]);
    expect(cards[3].marks.front.cloze).toEqual([{ start: 16, end: 30 }]);
  });

  it('cria o baralho de destino com o nome escolhido', async () => {
    const deckId = await importPackage();

    expect((await db.decks.get(deckId))?.name).toBe('Constitucional');
  });
});

describe('cartões importados sobem no push', () => {
  it('envia o baralho e os cartões em lotes e limpa dirty', async () => {
    const notes = Array.from({ length: 210 }, (_, index) => ({ notetypeId: 1, fields: [`f${index}`, 'v'], tags: 'cespe' }));
    await importPackage(notes);
    const { client, rpcCalls } = createFakeSupabase({ rpc: () => ({ error: null }) });

    const pushed = await pushDirty(client);

    const sentCards = rpcCalls.flatMap((call) => (call.args as { p_cards?: unknown[] }).p_cards ?? []);
    expect(pushed).toBe(211);
    expect(sentCards).toHaveLength(210);
    expect(await db.cards.where('dirty').equals(1).count()).toBe(0);
  });

  it('não reenvia nada num segundo push', async () => {
    await importPackage();
    const { client } = createFakeSupabase({ rpc: () => ({ error: null }) });
    await pushDirty(client);

    expect(await pushDirty(client)).toBe(0);
  });
});
