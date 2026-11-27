import { describe, expect, it } from 'vitest';
import { hex } from '../../test/css-colors';
import { backgroundColorOf, nearestHighlight, parseCssColor, type CssColor } from './anki-css-color';

function rgb(r: number, g: number, b: number, a = 1): CssColor {
  return { r, g, b, a };
}

describe('parseCssColor', () => {
  it.each([
    [hex('ff0'), rgb(255, 255, 0)],
    [hex('FFFF00'), rgb(255, 255, 0)],
    [hex('ffff0080'), rgb(255, 255, 0, 128 / 255)],
    ['rgb(255, 255, 127)', rgb(255, 255, 127)],
    ['rgba(0,128,0,0.5)', rgb(0, 128, 0, 0.5)],
    ['rgb(100% 0% 0% / 50%)', rgb(255, 0, 0, 0.5)],
    ['yellow', rgb(255, 255, 0)],
    ['  Pink ', rgb(255, 192, 203)],
    ['transparent', rgb(0, 0, 0, 0)],
  ])('lê %s', (value, expected) => {
    expect(parseCssColor(value)).toEqual(expected);
  });

  it.each(['', 'inherit', 'var(--cor)', hex('12'), 'rgb(1, 2)', 'url(x.png)'])('devolve null para %s', (value) => {
    expect(parseCssColor(value)).toBeNull();
  });
});

describe('nearestHighlight', () => {
  it.each([
    ['amarelo puro', rgb(255, 255, 0), 'yellow'],
    ['amarelo claro do Anki', rgb(255, 242, 204), 'yellow'],
    ['laranja', rgb(255, 165, 0), 'yellow'],
    ['verde', rgb(0, 255, 0), 'green'],
    ['verde claro', rgb(144, 238, 144), 'green'],
    ['ciano', rgb(0, 255, 255), 'green'],
    ['azul claro', rgb(0, 191, 255), 'yellow'],
    ['rosa', rgb(255, 192, 203), 'pink'],
    ['magenta', rgb(255, 0, 255), 'pink'],
    ['vermelho', rgb(255, 0, 0), 'pink'],
    ['azul', rgb(0, 0, 255), 'yellow'],
    ['roxo', rgb(128, 0, 128), 'pink'],
  ])('%s vira %s', (_name, color, expected) => {
    expect(nearestHighlight(color)).toBe(expected);
  });

  it.each([
    ['branco', rgb(255, 255, 255)],
    ['quase branco', rgb(255, 255, 240)],
    ['preto', rgb(0, 0, 0)],
    ['cinza', rgb(128, 128, 128)],
    ['cinza azulado', rgb(120, 125, 135)],
    ['transparente', rgb(255, 255, 0, 0)],
    ['quase invisível', rgb(255, 255, 0, 0.05)],
  ])('ignora %s', (_name, color) => {
    expect(nearestHighlight(color)).toBeNull();
  });
});

describe('backgroundColorOf', () => {
  it('lê background-color e a cor dentro de background', () => {
    expect(backgroundColorOf(`color: red; background-color: ${hex('ff0')}`)).toEqual(rgb(255, 255, 0));
    expect(backgroundColorOf('background: url(x.png) no-repeat rgb(0, 255, 0)')).toEqual(rgb(0, 255, 0));
  });

  it('usa a última declaração com cor', () => {
    expect(backgroundColorOf('background-color: yellow; background-color: lime')).toEqual(rgb(0, 255, 0));
  });

  it('devolve null sem fundo ou com fundo sem cor', () => {
    expect(backgroundColorOf('color: red')).toBeNull();
    expect(backgroundColorOf('background: url(x.png)')).toBeNull();
    expect(backgroundColorOf('')).toBeNull();
  });
});
