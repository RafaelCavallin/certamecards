import type { Rgb } from './contrast';

export type VisionType = 'normal' | 'protanopia' | 'deuteranopia';

type Matrix = readonly [readonly number[], readonly number[], readonly number[]];

const CHANNEL_MAX = 255;
const SRGB_LINEAR_THRESHOLD = 0.04045;

const MACHADO_FULL: Record<Exclude<VisionType, 'normal'>, Matrix> = {
  protanopia: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deuteranopia: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
};

function toLinear(channel: number): number {
  const unit = channel / CHANNEL_MAX;
  return unit <= SRGB_LINEAR_THRESHOLD ? unit / 12.92 : ((unit + 0.055) / 1.055) ** 2.4;
}

function fromLinear(value: number): number {
  const clamped = Math.min(1, Math.max(0, value));
  const unit = clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * clamped ** (1 / 2.4) - 0.055;
  return unit * CHANNEL_MAX;
}

function linearOf(color: Rgb): [number, number, number] {
  return [toLinear(color.r), toLinear(color.g), toLinear(color.b)];
}

export function simulateVision(color: Rgb, vision: VisionType): Rgb {
  if (vision === 'normal') return color;
  const [r, g, b] = linearOf(color);
  const [row1, row2, row3] = MACHADO_FULL[vision].map((row) => row[0] * r + row[1] * g + row[2] * b);
  return { r: fromLinear(row1), g: fromLinear(row2), b: fromLinear(row3) };
}

function toOklab(color: Rgb): [number, number, number] {
  const [r, g, b] = linearOf(color);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

export function oklabDistance(first: Rgb, second: Rgb): number {
  const [l1, a1, b1] = toOklab(first);
  const [l2, a2, b2] = toOklab(second);
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2);
}
