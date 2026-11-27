import { describe, expect, it } from 'vitest';
import { oklabDistance, simulateVision, type VisionType } from '../../test/color-vision';
import { contrastRatio, type Rgb, type Rgba } from '../../test/contrast';
import { themeTokens, type ThemeName } from '../../test/theme-tokens';

const TEXT_MIN = 4.5;
const NON_TEXT_MIN = 3;
const HIGHLIGHT_PAIR_MIN_DELTA = 0.08;
const HIGHLIGHT_BACKDROP_MIN_DELTA = 0.12;

const THEMES: ThemeName[] = ['dark', 'light'];
const HIGHLIGHTS = ['highlight-yellow', 'highlight-green', 'highlight-pink'];
const BACKDROPS = ['ink', 'surface'];
const VISIONS: VisionType[] = ['normal', 'protanopia', 'deuteranopia'];

function color(tokens: Record<string, Rgba>, name: string): Rgb {
  return tokens[name];
}

const pairs = HIGHLIGHTS.flatMap((first, index) => HIGHLIGHTS.slice(index + 1).map((second) => [first, second]));

describe.each(THEMES)('marca-texto no tema %s', (theme) => {
  const tokens = themeTokens(theme);

  it.each(HIGHLIGHTS)('o texto principal sobre %s tem contraste AA', (name) => {
    expect(contrastRatio(color(tokens, 'text'), color(tokens, name))).toBeGreaterThanOrEqual(TEXT_MIN);
  });

  it.each(BACKDROPS)('a moldura da lacuna (signal) tem pelo menos 3:1 sobre %s', (backdrop) => {
    expect(contrastRatio(color(tokens, 'signal'), color(tokens, backdrop))).toBeGreaterThanOrEqual(NON_TEXT_MIN);
  });

  it.each(VISIONS.flatMap((vision) => pairs.map(([first, second]) => [vision, first, second])))(
    'em visão %s, %s e %s se distinguem',
    (vision, first, second) => {
      const a = simulateVision(color(tokens, first), vision as VisionType);
      const b = simulateVision(color(tokens, second), vision as VisionType);

      expect(oklabDistance(a, b)).toBeGreaterThanOrEqual(HIGHLIGHT_PAIR_MIN_DELTA);
    },
  );

  it.each(HIGHLIGHTS.flatMap((name) => BACKDROPS.map((backdrop) => [name, backdrop])))(
    '%s se distingue de %s',
    (name, backdrop) => {
      expect(oklabDistance(color(tokens, name), color(tokens, backdrop))).toBeGreaterThanOrEqual(HIGHLIGHT_BACKDROP_MIN_DELTA);
    },
  );
});

describe('simulateVision', () => {
  it('não altera a visão normal e muda o vermelho puro na protanopia', () => {
    const red = { r: 255, g: 0, b: 0 };

    expect(simulateVision(red, 'normal')).toEqual(red);
    expect(simulateVision(red, 'protanopia').r).toBeLessThan(red.r);
  });
});
