import { describe, expect, it } from 'vitest';
import { blendOver, contrastRatio, hexToRgb, type Rgb, type Rgba } from '../../test/contrast';
import { PHASE_ONE_DARK_PALETTE } from '../../test/theme-baseline';
import { themeTokens } from '../../test/theme-tokens';

const TEXT_MIN = 4.5;
const NON_TEXT_MIN = 3;
const HEAT_NEIGHBOR_MIN = 1.5;
const HEAT_EMPTY_MIN = 1.25;

const light = themeTokens('light');
const dark = themeTokens('dark');

function rgb(tokens: Record<string, Rgba>, name: string): Rgb {
  return tokens[name];
}

interface Tint {
  name: string;
  alpha: number;
  backdrop: string;
}

function tinted(tokens: Record<string, Rgba>, tint: Tint): Rgb {
  return blendOver({ ...tokens[tint.name], a: tint.alpha }, rgb(tokens, tint.backdrop));
}

describe('paleta clara: texto', () => {
  const textTokens = ['text', 'muted', 'signal', 'hit', 'miss'];
  const backgrounds = ['ink', 'surface'];

  it.each(textTokens.flatMap((token) => backgrounds.map((bg) => [token, bg])))(
    '%s sobre %s tem contraste AA',
    (token, background) => {
      expect(contrastRatio(rgb(light, token), rgb(light, background))).toBeGreaterThanOrEqual(TEXT_MIN);
    },
  );
});

describe('paleta clara: pares compostos', () => {
  it.each([
    ['hit'],
    ['miss'],
  ])('%s sobre o próprio fundo a 10% e 20% sobre ink', (name) => {
    [0.1, 0.2].forEach((alpha) => {
      expect(contrastRatio(rgb(light, name), tinted(light, { name, alpha, backdrop: 'ink' }))).toBeGreaterThanOrEqual(TEXT_MIN);
    });
  });

  it('on-signal sobre signal', () => {
    expect(contrastRatio(rgb(light, 'on-signal'), rgb(light, 'signal'))).toBeGreaterThanOrEqual(TEXT_MIN);
  });

  it('ink sobre miss no botão de perigo', () => {
    expect(contrastRatio(rgb(light, 'ink'), rgb(light, 'miss'))).toBeGreaterThanOrEqual(TEXT_MIN);
  });

  it('text sobre a lacuna revelada (signal a 15% sobre surface)', () => {
    expect(contrastRatio(rgb(light, 'text'), tinted(light, { name: 'signal', alpha: 0.15, backdrop: 'surface' }))).toBeGreaterThanOrEqual(TEXT_MIN);
  });

  it('signal sobre a lacuna no formulário (signal a 10% sobre surface)', () => {
    expect(contrastRatio(rgb(light, 'signal'), tinted(light, { name: 'signal', alpha: 0.1, backdrop: 'surface' }))).toBeGreaterThanOrEqual(TEXT_MIN);
  });

  it.each(['placeholder', 'placeholder-strong'].flatMap((token) => ['ink', 'surface'].map((bg) => [token, bg])))(
    '%s sobre %s',
    (token, background) => {
      expect(contrastRatio(rgb(light, token), rgb(light, background))).toBeGreaterThanOrEqual(TEXT_MIN);
    },
  );
});

describe('paleta clara: elementos que não são texto', () => {
  it.each(['edge', 'signal'].flatMap((token) => ['ink', 'surface'].map((bg) => [token, bg])))(
    '%s sobre %s tem pelo menos 3:1',
    (token, background) => {
      expect(contrastRatio(rgb(light, token), rgb(light, background))).toBeGreaterThanOrEqual(NON_TEXT_MIN);
    },
  );
});

describe('paleta clara: heatmap', () => {
  const ramp = ['heat-0', 'heat-1', 'heat-2', 'heat-3'];

  it('níveis vizinhos se distinguem entre si', () => {
    const ratios = ramp.slice(1).map((name, index) => contrastRatio(rgb(light, ramp[index]), rgb(light, name)));

    ratios.forEach((ratio) => expect(ratio).toBeGreaterThanOrEqual(HEAT_NEIGHBOR_MIN));
  });

  it.each(['ink', 'surface'])('o dia sem revisão se distingue de %s', (background) => {
    expect(contrastRatio(rgb(light, 'heat-0'), rgb(light, background))).toBeGreaterThanOrEqual(HEAT_EMPTY_MIN);
  });
});

describe('tema escuro inalterado', () => {
  it.each(Object.entries(PHASE_ONE_DARK_PALETTE))('%s mantém o valor da Fase 1', (name, hex) => {
    expect(dark[name]).toEqual({ ...hexToRgb(hex), a: 1 });
  });

  it.each([
    ['edge', 'line', 1],
    ['placeholder', 'muted', 0.4],
    ['placeholder-strong', 'muted', 0.6],
    ['scrim', 'ink', 0.6],
    ['heat-0', 'line', 1],
    ['heat-1', 'muted', 1],
    ['heat-2', 'signal', 0.5],
    ['heat-3', 'signal', 1],
  ])('%s equivale a %s com opacidade %s', (token, source, alpha) => {
    expect(dark[token]).toEqual({ ...dark[source], a: alpha });
  });
});
