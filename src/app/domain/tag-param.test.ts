import { describe, expect, it } from 'vitest';
import { UNTAGGED_KEY } from './tag-filter';
import { parseTagParam, serializeTagParam } from './tag-param';

describe('parseTagParam', () => {
  it('devolve vazio para nulo e texto vazio', () => {
    expect([parseTagParam(null), parseTagParam(''), parseTagParam(undefined)]).toEqual([[], [], []]);
  });

  it('normaliza, descarta vazios e duplicatas', () => {
    expect(parseTagParam('CESPE,,cespe, fgv ')).toEqual(['cespe', 'fgv']);
  });

  it('preserva a chave de "Sem etiqueta" e trata a minúscula como etiqueta comum', () => {
    expect(parseTagParam(`${UNTAGGED_KEY},sem-etiqueta`)).toEqual([UNTAGGED_KEY, 'sem-etiqueta']);
  });
});

describe('serializeTagParam', () => {
  it('devolve nulo sem chaves', () => {
    expect(serializeTagParam([])).toBeNull();
  });

  it('preserva as chaves ida e volta', () => {
    const keys = ['cespe', 'art. 37', UNTAGGED_KEY];

    expect(parseTagParam(serializeTagParam(keys))).toEqual(keys);
  });
});
