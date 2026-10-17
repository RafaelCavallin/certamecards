import { zipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { anki21bPackage } from '../../test/anki-fixtures';
import { buildLegacyCollection } from '../../test/anki-builder';
import { AnkiImportError } from './anki-errors';
import { unpackAnkiPackage } from './anki-package';

const SQLITE_HEADER = 'SQLite format 3';
const BASIC = { id: 1, name: 'Básico', fields: ['Frente', 'Verso'] };

function header(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes.slice(0, SQLITE_HEADER.length));
}

async function collectionWith(text: string): Promise<Uint8Array> {
  return buildLegacyCollection({ notetypes: [BASIC], notes: [{ notetypeId: 1, fields: [text, 'x'] }] });
}

describe('unpackAnkiPackage', () => {
  it('descompacta o anki21b mesmo com o anki2-isca no pacote', () => {
    const collection = unpackAnkiPackage(anki21bPackage());

    expect(header(collection)).toBe(SQLITE_HEADER);
  });

  it('prefere o anki21 ao anki2 do mesmo pacote', async () => {
    const modern = await collectionWith('nova');
    const decoy = await collectionWith('isca');

    const collection = unpackAnkiPackage(zipSync({ 'collection.anki2': decoy, 'collection.anki21': modern }));

    expect(collection).toEqual(modern);
  });

  it('lê um pacote que só tem o anki2', async () => {
    const legacy = await collectionWith('antiga');

    const collection = unpackAnkiPackage(zipSync({ 'collection.anki2': legacy }));

    expect(collection).toEqual(legacy);
  });

  it('recusa um ZIP sem coleção', () => {
    const bytes = zipSync({ 'leia-me.txt': new TextEncoder().encode('oi') });

    expect(() => unpackAnkiPackage(bytes)).toThrow(AnkiImportError);
  });

  it('recusa bytes que não são ZIP', () => {
    const bytes = new TextEncoder().encode('não sou um zip');

    expect(() => unpackAnkiPackage(bytes)).toThrow(/não parece ser um baralho do Anki/);
  });

  it('recusa um anki21b com zstd truncado', () => {
    const bytes = zipSync({ 'collection.anki21b': new Uint8Array([0x28, 0xb5, 0x2f, 0xfd, 0x00]) });

    expect(() => unpackAnkiPackage(bytes)).toThrow(expect.objectContaining({ code: 'not-anki' }));
  });
});
