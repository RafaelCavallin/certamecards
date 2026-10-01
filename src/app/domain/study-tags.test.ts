import { describe, expect, it } from 'vitest';
import { parseStudyTags, reconcileStudyTags, removeStudyTag, renameStudyTag } from './study-tags';

describe('parseStudyTags', () => {
  it('lê o mapa salvo', () => {
    expect(parseStudyTags('{"d1":["cespe","fgv"]}')).toEqual({ d1: ['cespe', 'fgv'] });
  });

  it('devolve vazio para nulo, JSON inválido e formatos inesperados', () => {
    expect(parseStudyTags(null)).toEqual({});
    expect(parseStudyTags('{quebrado')).toEqual({});
    expect(parseStudyTags('[1,2]')).toEqual({});
    expect(parseStudyTags('"texto"')).toEqual({});
    expect(parseStudyTags('null')).toEqual({});
  });

  it('descarta só as entradas que não são listas de texto', () => {
    expect(parseStudyTags('{"d1":["a"],"d2":[1],"d3":"x"}')).toEqual({ d1: ['a'] });
  });
});

describe('reconcileStudyTags', () => {
  it('tira as chaves que não existem mais', () => {
    expect(reconcileStudyTags(['a', 'b'], new Set(['b']))).toEqual(['b']);
  });

  it('deixa vazio quando a única deixou de existir', () => {
    expect(reconcileStudyTags(['a'], new Set())).toEqual([]);
  });
});

describe('renameStudyTag', () => {
  it('troca em todos os baralhos sem duplicar', () => {
    const map = { d1: ['a', 'b'], d2: ['a'], d3: ['c'] };

    expect(renameStudyTag(map, 'a', 'b')).toEqual({ d1: ['b'], d2: ['b'], d3: ['c'] });
  });
});

describe('removeStudyTag', () => {
  it('remove de todos e deixa [] quando era a única', () => {
    const map = { d1: ['a', 'b'], d2: ['a'] };

    expect(removeStudyTag(map, 'a')).toEqual({ d1: ['b'], d2: [] });
  });
});
