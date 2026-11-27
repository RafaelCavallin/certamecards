import { afterEach, describe, expect, it } from 'vitest';
import { buildLegacyPackage, loadTestWasm, packageFile } from '../../test/anki-builder';
import { resetDb } from '../../test/db-helpers';
import { convertNotes } from './anki-convert-batch';
import { importDrafts } from './anki-import';
import { suggestMapping } from './anki-mapping';
import { prepareAnkiReader, readAnkiFile } from './anki-reader';
import { db, type Card } from './db';

afterEach(resetDb);

const NOTETYPES = [
  { id: 1, name: 'Básico', fields: ['Frente', 'Verso'] },
  { id: 3, name: 'Lacuna', fields: ['Texto', 'Extra'], type: 1 },
];

function span(background: string, text: string): string {
  return `<span style="background-color: ${background}">${text}</span>`;
}

const BACKGROUNDS = [
  span('rgb(255, 255, 128)', 'amarelado'),
  span('rgb(128, 255, 128)', 'esverdeado'),
  span('pink', 'rosado'),
  span('blue', 'azul'),
  span('white', 'branco'),
  span('transparent', 'transparente'),
].join(' ');

const NOTES = [
  { notetypeId: 1, fields: [BACKGROUNDS, '<b style="background-color: lime">vedado</b> e <b>salvo</b>'] },
  { notetypeId: 3, fields: [`A {{c1::${span('yellow', 'União')}}} legisla ${span('lime', 'sempre')}`, ''] },
];

async function importedCards(): Promise<Card[]> {
  const reader = await prepareAnkiReader(loadTestWasm);
  const collection = await readAnkiFile(packageFile(await buildLegacyPackage({ notetypes: NOTETYPES, notes: NOTES })), reader);
  const mappings = Object.fromEntries(collection.notetypes.map((type) => [type.id, suggestMapping(type)]));
  const setup = { notetypes: collection.notetypes, mappings, catalog: new Map<string, string>() };
  const conversion = await convertNotes({ notes: collection.notes, setup });
  const target = { kind: 'new' as const, name: 'Marca-texto' };
  const outcome = await importDrafts({ drafts: conversion.drafts, target, signal: new AbortController().signal, onProgress: () => undefined });
  return db.cards.where('deckId').equals(outcome.deckId).sortBy('createdAt');
}

function highlighted(text: string, ranges: { start: number; end: number; color: string }[] | undefined): string[][] {
  return (ranges ?? []).map((range) => [text.slice(range.start, range.end), range.color]);
}

describe('importação do Anki com cor de fundo', () => {
  it('vira marca-texto da cor mais próxima e ignora fundos sem cor', async () => {
    const [basic] = await importedCards();

    expect(highlighted(basic.front, basic.marks.front.highlight)).toEqual([
      ['amarelado', 'yellow'],
      ['esverdeado', 'green'],
      ['rosado', 'pink'],
      ['azul', 'yellow'],
    ]);
  });

  it('deixa só o marca-texto no trecho em negrito com fundo verde', async () => {
    const [basic] = await importedCards();

    expect(highlighted(basic.back, basic.marks.back.highlight)).toEqual([['vedado', 'green']]);
    expect(basic.marks.back.emphasis.map((range) => basic.back.slice(range.start, range.end))).toEqual(['salvo']);
  });

  it('mantém a lacuna com fundo colorido como lacuna e o marca-texto fora dela', async () => {
    const [, cloze] = await importedCards();

    expect(cloze.marks.front.cloze.map((range) => cloze.front.slice(range.start, range.end))).toEqual(['União']);
    expect(highlighted(cloze.front, cloze.marks.front.highlight)).toEqual([['sempre', 'green']]);
  });
});
