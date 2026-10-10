export interface Size {
  width: number;
  height: number;
}

export const QUALITY_STEPS: readonly number[] = [0.9, 0.85, 0.8, 0.7, 0.6, 0.5];

export function fitWithin(width: number, height: number, max: number): Size {
  const longest = Math.max(width, height);
  if (longest <= max) return { width, height };
  const ratio = max / longest;
  return { width: Math.max(1, Math.round(width * ratio)), height: Math.max(1, Math.round(height * ratio)) };
}

export function nextQuality(current: number | null): number | null {
  if (current === null) return QUALITY_STEPS[0];
  const index = QUALITY_STEPS.indexOf(current);
  return QUALITY_STEPS[index + 1] ?? null;
}
