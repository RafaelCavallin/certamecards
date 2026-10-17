export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export interface Rgba extends Rgb {
  a: number;
}

const CHANNEL_MAX = 255;
const LINEAR_THRESHOLD = 0.03928;

export function hexToRgb(hex: string): Rgb {
  const digits = hex.replace('#', '');
  const value = Number.parseInt(digits, 16);
  return { r: (value >> 16) & CHANNEL_MAX, g: (value >> 8) & CHANNEL_MAX, b: value & CHANNEL_MAX };
}

function linearChannel(channel: number): number {
  const unit = channel / CHANNEL_MAX;
  return unit <= LINEAR_THRESHOLD ? unit / 12.92 : ((unit + 0.055) / 1.055) ** 2.4;
}

function luminance(color: Rgb): number {
  return 0.2126 * linearChannel(color.r) + 0.7152 * linearChannel(color.g) + 0.0722 * linearChannel(color.b);
}

export function contrastRatio(first: Rgb, second: Rgb): number {
  const [light, dark] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

export function blendOver(foreground: Rgba, background: Rgb): Rgb {
  const mix = (front: number, back: number): number => front * foreground.a + back * (1 - foreground.a);
  return { r: mix(foreground.r, background.r), g: mix(foreground.g, background.g), b: mix(foreground.b, background.b) };
}
