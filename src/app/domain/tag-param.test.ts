import { describe, expect, it } from 'vitest';
import { parseTagParam, serializeTagParam } from './tag-param';

describe('parseTagParam', () => {
  it('devolve vazio para nulo e texto vazio', () => {
    expect([parseTagParam(null), parseTagParam(''), parseTagParam(undefined)]).toEqual([[], [], []]);
  });

  it('normaliza, descarta vazios e duplicatas', () => {
    expect(parseTagParam('CESPE,,cespe, fgv ')).toEqual(['cespe', 'fgv']);
  });
});

describe('serializeTagParam', () => {
  it('devolve nulo sem chaves', () => {
    expect(serializeTagParam([])).toBeNull();
  });

  it('preserva as chaves ida e volta', () => {
    const keys = ['cespe', 'art. 37'];

    expect(parseTagParam(serializeTagParam(keys))).toEqual(keys);
  });
});
