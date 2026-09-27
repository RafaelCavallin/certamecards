const NEAR_LIMIT_RATIO = 0.9;

/** Contador só aparece perto do limite — abaixo disso é ruído visual. */
export function charCounterLabel(length: number, max: number): string | null {
  if (length < max * NEAR_LIMIT_RATIO) return null;
  return `${length}/${max}`;
}
