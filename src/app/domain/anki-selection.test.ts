import { describe, expect, it } from 'vitest';
import {
  countPlannedCards,
  notetypesInSelection,
  summarizeSourceDecks,
  suggestDeckName,
  toggleMember,
} from './anki-selection';
import type { AnkiCollection, AnkiNote } from './anki-types';

function notes(count: number, deck: string, notetypeId = 'basic'): AnkiNote[] {
  return Array.from({ length: count }, () => ({ notetypeId, fields: ['f', 'v'], tags: '', deck }));
}

const collection: AnkiCollection = {
  fileName: 'Direito.apkg',
  notetypes: [
    { id: 'basic', name: 'Básico', fields: ['Frente', 'Verso'], kind: 'normal' },
    { id: 'cloze', name: 'Lacuna', fields: ['Texto', 'Extra'], kind: 'cloze' },
  ],
  notes: [
    ...notes(300, 'Direito::Constitucional'),
    ...notes(200, 'Direito::Administrativo'),
    { notetypeId: 'cloze', fields: ['{{c1::a}} {{c2::b}} {{c3::c}} {{c1::d}}', ''], tags: '', deck: 'Direito::Constitucional' },
  ],
};

const mappings = {
  basic: { include: true, front: 0, back: 1, notes: null },
  cloze: { include: true, front: 0, back: null, notes: 1 },
};

describe('summarizeSourceDecks', () => {
  it('conta as notas por baralho de origem, em ordem alfabética', () => {
    expect(summarizeSourceDecks(collection)).toEqual([
      { name: 'Direito::Administrativo', count: 200 },
      { name: 'Direito::Constitucional', count: 301 },
    ]);
  });
});

describe('countPlannedCards', () => {
  it('conta só os baralhos marcados e um cartão por número de lacuna', () => {
    const decks = new Set(['Direito::Constitucional']);

    expect(countPlannedCards({ collection, decks, mappings })).toBe(303);
  });

  it('não conta tipos desmarcados', () => {
    const decks = new Set(['Direito::Constitucional']);
    const excluded = { ...mappings, cloze: { ...mappings.cloze, include: false } };

    expect(countPlannedCards({ collection, decks, mappings: excluded })).toBe(300);
  });

  it('não conta nada sem baralho marcado', () => {
    expect(countPlannedCards({ collection, decks: new Set(), mappings })).toBe(0);
  });
});

describe('notetypesInSelection', () => {
  it('mostra só os tipos presentes nos baralhos marcados', () => {
    const types = notetypesInSelection(collection, new Set(['Direito::Administrativo']));

    expect(types.map((type) => type.id)).toEqual(['basic']);
  });
});

describe('suggestDeckName', () => {
  it('usa o último nível quando há um só baralho de origem', () => {
    expect(suggestDeckName({ fileName: 'x.apkg', decks: ['Direito::Constitucional'] })).toBe('Constitucional');
  });

  it('usa o nome do arquivo sem extensão com vários baralhos', () => {
    expect(suggestDeckName({ fileName: 'Pacote TI.colpkg', decks: ['A', 'B'] })).toBe('Pacote TI');
  });

  it('corta no limite do nome de baralho', () => {
    expect(suggestDeckName({ fileName: `${'n'.repeat(120)}.apkg`, decks: [] })).toHaveLength(80);
  });

  it('cai num nome padrão quando nada serve', () => {
    expect(suggestDeckName({ fileName: '.apkg', decks: [''] })).toBe('Importado do Anki');
  });
});

describe('toggleMember', () => {
  it('tira o que está e põe o que falta, sem alterar o conjunto recebido', () => {
    const decks = new Set(['A', 'B']);

    expect([...toggleMember(toggleMember(decks, 'A'), 'C')]).toEqual(['B', 'C']);
    expect([...decks]).toEqual(['A', 'B']);
  });
});
