import { beforeEach, describe, expect, it, vi } from 'vitest';
import { anki21bPackage } from '../../test/anki-fixtures';
import { buildLegacyPackage, loadTestWasm, packageFile } from '../../test/anki-builder';
import { prepareAnkiReader, readAnkiFile } from './anki-reader';

const BASIC = { id: 10, name: 'Básico', fields: ['Frente', 'Verso'] };

describe('readAnkiFile — formato novo (anki21b)', () => {
  it('abre o pacote do esquema 18 sem tropeçar na collation unicase', async () => {
    const reader = await prepareAnkiReader(loadTestWasm);

    const collection = await readAnkiFile(packageFile(anki21bPackage(), 'TI.colpkg'), reader);

    expect(collection.notes).toHaveLength(3);
    expect(collection.notetypes.map((type) => [type.name, type.kind])).toEqual([
      ['Básico', 'normal'],
      ['Omissão de Palavras', 'cloze'],
      ['Oclusão de Imagem', 'image-occlusion'],
    ]);
  });

  it('traz campos por ordem, etiquetas cruas e o baralho de origem com hierarquia', async () => {
    const reader = await prepareAnkiReader(loadTestWasm);

    const collection = await readAnkiFile(packageFile(anki21bPackage()), reader);

    expect(collection.notetypes[1].fields).toEqual(['Texto', 'Verso Extra']);
    expect(collection.notes[1]).toMatchObject({ tags: ' fgv requisitos ', deck: 'Engenharia de Software::Requisitos' });
    expect(collection.notes[0].deck).toBe('DevOps');
  });
});

describe('readAnkiFile — esquema legado', () => {
  it('lê tipos, notas e baralhos do JSON de col', async () => {
    const bytes = await buildLegacyPackage({
      notetypes: [BASIC, { id: 11, name: 'Cloze', fields: ['Text', 'Extra'], type: 1 }],
      decks: [{ id: 5, name: 'Direito::Constitucional' }],
      notes: [{ notetypeId: 11, fields: ['{{c1::União}}', ''], tags: ' cespe ', deckId: 5 }],
    });
    const reader = await prepareAnkiReader(loadTestWasm);

    const collection = await readAnkiFile(packageFile(bytes), reader);

    expect(collection.notetypes).toEqual([{ id: '11', name: 'Cloze', fields: ['Text', 'Extra'], kind: 'cloze' }]);
    expect(collection.notes).toEqual([
      { notetypeId: '11', fields: ['{{c1::União}}', ''], tags: ' cespe ', deck: 'Direito::Constitucional' },
    ]);
  });

  it('descarta notas sem conteúdo e recusa a coleção que fica vazia', async () => {
    const bytes = await buildLegacyPackage({ notetypes: [BASIC], notes: [{ notetypeId: 10, fields: [' ', ''] }] });
    const reader = await prepareAnkiReader(loadTestWasm);

    await expect(readAnkiFile(packageFile(bytes), reader)).rejects.toMatchObject({ code: 'no-notes' });
  });

  it('recusa um SQLite que não é coleção do Anki', async () => {
    const reader = await prepareAnkiReader(loadTestWasm);
    const garbage = new TextEncoder().encode('lixo que não é SQLite');

    expect(() => reader.open(garbage, 'x.apkg')).toThrow(expect.objectContaining({ code: 'not-anki' }));
  });
});

describe('prepareAnkiReader', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  async function freshPrepare(): Promise<typeof prepareAnkiReader> {
    return (await import('./anki-reader')).prepareAnkiReader;
  }

  const offline = (): Promise<ArrayBuffer> => Promise.reject(new TypeError('Failed to fetch'));

  it('falha com reader-unavailable sem rede', async () => {
    const prepare = await freshPrepare();

    await expect(prepare(offline)).rejects.toMatchObject({ code: 'reader-unavailable' });
  });

  it('recusa como reader-unavailable um download que não é wasm (index.html do rewrite)', async () => {
    const prepare = await freshPrepare();
    const html = (): Promise<ArrayBuffer> => Promise.resolve(new TextEncoder().encode('<!doctype html>').buffer);

    await expect(prepare(html)).rejects.toMatchObject({ code: 'reader-unavailable' });
  });

  it('não memoiza a falha: a tentativa seguinte resolve', async () => {
    const prepare = await freshPrepare();
    await prepare(offline).catch(() => undefined);

    const reader = await prepare(loadTestWasm);

    expect(typeof reader.open).toBe('function');
  });
});
