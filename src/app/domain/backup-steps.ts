export type RestoreStep = 'pick' | 'reading' | 'preview' | 'confirm' | 'restoring' | 'done';

const PREVIOUS: Partial<Record<RestoreStep, RestoreStep>> = {
  preview: 'pick',
  confirm: 'preview',
};

export function canGoBackFrom(step: RestoreStep): boolean {
  return PREVIOUS[step] !== undefined;
}

export function previousRestoreStep(step: RestoreStep): RestoreStep {
  return PREVIOUS[step] ?? step;
}
