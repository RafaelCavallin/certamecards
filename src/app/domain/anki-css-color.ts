import { NAMED_COLORS } from './anki-color-names';
import type { HighlightColor } from './highlight-colors';

export interface CssColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

const HEX = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const FUNCTIONAL = /^rgba?\(\s*([\d.]+%?)[\s,]+([\d.]+%?)[\s,]+([\d.]+%?)(?:[\s,/]+([\d.]+%?))?\s*\)$/i;
const COLOR_TOKEN = /rgba?\([^)]*\)|#[0-9a-f]+|[a-z]+/gi;
const BACKGROUND_DECLARATION = /(?:^|;)\s*background(?:-color)?\s*:\s*([^;]+)/gi;
const CHANNEL_MAX = 255;
const HEX_BASE = 16;
const PERCENT_SCALE = 100;
const ALPHA_MIN = 0.1;
const NEUTRAL_SATURATION_MAX = 0.25;
const NEUTRAL_LIGHTNESS_MAX = 0.94;
const NEUTRAL_LIGHTNESS_MIN = 0.12;
const FULL_TURN = 360;
const HUE_SECTOR = 60;
const YELLOW_HUE_START = 20;
const GREEN_HUE_START = 75;
const BLUISH_HUE_START = 190;
const PINK_HUE_START = 290;

function parseHex(value: string): CssColor | null {
  const digits = HEX.exec(value)?.[1];
  if (!digits) return null;
  const full = digits.length <= 4 ? [...digits].map((digit) => digit + digit).join('') : digits;
  const [r, g, b, a] = [0, 2, 4, 6].map((at) => (full.length > at ? Number.parseInt(full.slice(at, at + 2), HEX_BASE) : CHANNEL_MAX));
  return { r, g, b, a: a / CHANNEL_MAX };
}

function channelOf(raw: string): number {
  return raw.endsWith('%') ? (Number.parseFloat(raw) / PERCENT_SCALE) * CHANNEL_MAX : Number.parseFloat(raw);
}

function alphaOf(raw: string | undefined): number {
  if (raw === undefined) return 1;
  return raw.endsWith('%') ? Number.parseFloat(raw) / PERCENT_SCALE : Number.parseFloat(raw);
}

function parseFunctional(value: string): CssColor | null {
  const match = FUNCTIONAL.exec(value);
  if (!match) return null;
  return { r: channelOf(match[1]), g: channelOf(match[2]), b: channelOf(match[3]), a: alphaOf(match[4]) };
}

export function parseCssColor(value: string): CssColor | null {
  const text = value.trim().toLowerCase();
  const named = NAMED_COLORS[text];
  if (named) return { r: named[0], g: named[1], b: named[2], a: named[3] };
  return parseHex(text) ?? parseFunctional(text);
}

function hueOf(unit: readonly [number, number, number], delta: number): number {
  const [r, g, b] = unit;
  const max = Math.max(r, g, b);
  if (delta === 0) return 0;
  let sector = (r - g) / delta + 4;
  if (max === r) sector = ((g - b) / delta) % 6;
  else if (max === g) sector = (b - r) / delta + 2;
  return (sector * HUE_SECTOR + FULL_TURN) % FULL_TURN;
}

function colorOfHue(hue: number): HighlightColor {
  if (hue >= PINK_HUE_START || hue < YELLOW_HUE_START) return 'pink';
  if (hue >= GREEN_HUE_START && hue < BLUISH_HUE_START) return 'green';
  return 'yellow';
}

export function nearestHighlight(color: CssColor): HighlightColor | null {
  if (color.a < ALPHA_MIN) return null;
  const unit = [color.r, color.g, color.b].map((channel) => channel / CHANNEL_MAX) as [number, number, number];
  const max = Math.max(...unit);
  const delta = max - Math.min(...unit);
  const lightness = max - delta / 2;
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
  const neutral = saturation < NEUTRAL_SATURATION_MAX || lightness > NEUTRAL_LIGHTNESS_MAX || lightness < NEUTRAL_LIGHTNESS_MIN;
  return neutral ? null : colorOfHue(hueOf(unit, delta));
}

function firstColorIn(value: string): CssColor | null {
  const tokens = value.match(COLOR_TOKEN) ?? [];
  return tokens.map(parseCssColor).find((color) => color !== null) ?? null;
}

export function backgroundColorOf(style: string): CssColor | null {
  const declared = [...style.matchAll(BACKGROUND_DECLARATION)].map((match) => firstColorIn(match[1]));
  return declared.filter((color): color is CssColor => color !== null).at(-1) ?? null;
}
