import { describe, expect, it } from 'vitest';
import { makeTaggedCard } from '../../test/card-fixtures';
import { searchCards } from './card-search';
import { filterCardsByTags, hasAllTags, hasAnyTag } from './tag-filter';

const cards = [
  makeTaggedCard('a', ['CESPE', 'Art. 37'], { front: 'prazo' }),
  makeTaggedCard('b', ['CESPE'], { front: 'prazo também' }),
  makeTaggedCard('c', ['Art. 37'], { front: 'outro' }),
];

describe('filterCardsByTags', () => {
  it('exige todas as etiquetas (E)', () => {
    const result = filterCardsByTags(cards, ['cespe', 'art. 37']);

    expect(result.map((card) => card.id)).toEqual(['a']);
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

describe('hasAllTags e hasAnyTag', () => {
  it('compara pela chave, sem caixa nem acento', () => {
    expect(hasAllTags(cards[0], ['cespe'])).toBe(true);
    expect(hasAnyTag(cards[2], new Set(['cespe', 'art. 37']))).toBe(true);
    expect(hasAnyTag(cards[2], new Set(['cespe']))).toBe(false);
  });
});
