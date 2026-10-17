import { describe, expect, it } from 'vitest';
import { makeTaggedCard } from '../../test/card-fixtures';
import { searchCards } from './card-search';
import { UNTAGGED_KEY, countUntagged, filterCardsByTags, hasAnyTag, withUntaggedOption } from './tag-filter';

const cards = [
  makeTaggedCard('a', ['CESPE', 'Art. 37'], { front: 'prazo' }),
  makeTaggedCard('b', ['CESPE'], { front: 'prazo também' }),
  makeTaggedCard('c', ['Art. 37'], { front: 'outro' }),
];

describe('filterCardsByTags', () => {
  it('une as etiquetas escolhidas (OU)', () => {
    const result = filterCardsByTags(cards, ['cespe', 'art. 37']);

    expect(result.map((card) => card.id)).toEqual(['a', 'b', 'c']);
  });

  it('uma etiqueta traz só os cartões que a têm', () => {
    const result = filterCardsByTags(cards, ['art. 37']);

    expect(result.map((card) => card.id)).toEqual(['a', 'c']);
  });

  it('sem chaves devolve todos', () => {
    expect(filterCardsByTags(cards, [])).toHaveLength(3);
  });

  it('combina com a busca em qualquer ordem', () => {
    const filterFirst = searchCards(filterCardsByTags(cards, ['cespe']), 'também');
    const searchFirst = filterCardsByTags(searchCards(cards, 'também'), ['cespe']);

    expect(filterFirst.map((card) => card.id)).toEqual(['b']);
    expect(searchFirst).toEqual(filterFirst);
  });
});

describe('hasAnyTag', () => {
  it('compara pela chave, sem caixa nem acento', () => {
    expect(hasAnyTag(cards[0], new Set(['cespe']))).toBe(true);
    expect(hasAnyTag(cards[2], new Set(['cespe', 'art. 37']))).toBe(true);
    expect(hasAnyTag(cards[2], new Set(['cespe']))).toBe(false);
  });
});

describe('Sem etiqueta', () => {
  const untagged = makeTaggedCard('d', []);

  it('casa com hasAnyTag sozinha ou junto de outras chaves', () => {
    expect(hasAnyTag(untagged, new Set([UNTAGGED_KEY]))).toBe(true);
    expect(hasAnyTag(cards[1], new Set(['cespe', UNTAGGED_KEY]))).toBe(true);
    expect(hasAnyTag(cards[2], new Set([UNTAGGED_KEY]))).toBe(false);
  });

  it('filterCardsByTags com a chave traz só os sem etiqueta', () => {
    const result = filterCardsByTags([...cards, untagged], [UNTAGGED_KEY]);

    expect(result.map((card) => card.id)).toEqual(['d']);
  });

  it('se soma às etiquetas escolhidas (OU)', () => {
    const result = filterCardsByTags([...cards, untagged], [UNTAGGED_KEY, 'cespe']);

    expect(result.map((card) => card.id)).toEqual(['a', 'b', 'd']);
  });

  it('countUntagged conta só os cartões sem etiqueta', () => {
    expect(countUntagged([...cards, untagged])).toBe(1);
  });
});

describe('withUntaggedOption', () => {
  const options = [{ key: 'cespe', name: 'CESPE', count: 2 }];

  it('põe "Sem etiqueta" antes das etiquetas', () => {
    expect(withUntaggedOption(options, 3)).toEqual([
      { key: UNTAGGED_KEY, name: 'Sem etiqueta', count: 3 },
      ...options,
    ]);
  });

  it('não oferece a opção sem cartões sem etiqueta nem sem etiquetas reais', () => {
    expect(withUntaggedOption(options, 0)).toEqual(options);
    expect(withUntaggedOption([], 5)).toEqual([]);
  });
});
