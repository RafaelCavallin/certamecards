import { describe, expect, it } from 'vitest';
import { makeTaggedCard } from '../../test/card-fixtures';
import type { DifficultCard } from './difficulty';
import { difficultTagOptions, filterDifficultByTags } from './difficulty-tags';
import { UNTAGGED_KEY } from './tag-filter';

const NOW = Date.parse('2026-03-09T12:00:00Z');

function item(id: string, tags: string[]): DifficultCard {
  return { card: makeTaggedCard(id, tags), score: 3, recentErrors: 3, totalErrors: 3, lastErrorAt: NOW, streak: 0 };
}

describe('filtro por etiqueta nos difíceis', () => {
  const list = [
    ...['c1', 'c2'].map((id) => item(id, ['CESPE'])),
    item('f1', ['FGV']),
    item('both', ['CESPE', 'FGV']),
    item('none', []),
  ];

  it('une as etiquetas escolhidas (OU)', () => {
    expect(filterDifficultByTags(list, ['cespe', 'fgv'])).toHaveLength(4);
  });

  it('sem chaves devolve todos', () => {
    expect(filterDifficultByTags(list, [])).toHaveLength(5);
  });

  it('chave inexistente não devolve nada', () => {
    expect(filterDifficultByTags(list, ['outra'])).toEqual([]);
  });

  it('conta as etiquetas só entre os difíceis, com "Sem etiqueta" primeiro', () => {
    const options = difficultTagOptions(list);

    expect(options.map((option) => [option.name, option.count])).toEqual([
      ['Sem etiqueta', 1],
      ['CESPE', 3],
      ['FGV', 2],
    ]);
  });

  it('"Sem etiqueta" sozinha traz só os sem etiqueta', () => {
    const result = filterDifficultByTags(list, [UNTAGGED_KEY]);

    expect(result.map((entry) => entry.card.id)).toEqual(['none']);
  });

  it('"Sem etiqueta" se soma às etiquetas escolhidas (OU)', () => {
    expect(filterDifficultByTags(list, ['fgv', UNTAGGED_KEY])).toHaveLength(3);
  });

  it('não oferece "Sem etiqueta" quando nenhum difícil tem etiqueta', () => {
    expect(difficultTagOptions([item('a', []), item('b', [])])).toEqual([]);
  });
});
