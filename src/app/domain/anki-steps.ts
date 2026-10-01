export type ImportStep = 'file' | 'reading' | 'decks' | 'fields' | 'preparing' | 'target' | 'importing' | 'done';

export const TOTAL_VISIBLE_STEPS = 4;

const VISIBLE_STEP_NUMBER: Partial<Record<ImportStep, number>> = {
  file: 1,
  reading: 1,
  decks: 2,
  fields: 3,
  preparing: 3,
  target: 4,
};

export function stepAfterReading(sourceDeckCount: number): ImportStep {
  return sourceDeckCount > 1 ? 'decks' : 'fields';
}

export function previousStep(step: ImportStep, sourceDeckCount: number): ImportStep {
  if (step === 'target') return 'fields';
  if (step === 'fields') return sourceDeckCount > 1 ? 'decks' : 'file';
  return 'file';
}

export function canGoBack(step: ImportStep): boolean {
  return step === 'decks' || step === 'fields' || step === 'target';
}

export function visibleStepNumber(step: ImportStep): number | null {
  return VISIBLE_STEP_NUMBER[step] ?? null;
}
