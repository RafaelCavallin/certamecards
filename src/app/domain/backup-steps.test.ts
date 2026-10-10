import { describe, expect, it } from 'vitest';
import { canGoBackFrom, previousRestoreStep, type RestoreStep } from './backup-steps';

describe('passos da restauração', () => {
  it('volta da prévia para o arquivo e da confirmação para a prévia', () => {
    expect(previousRestoreStep('preview')).toBe('pick');
    expect(previousRestoreStep('confirm')).toBe('preview');
  });

  it('só permite voltar até o momento de confirmar', () => {
    const steps: RestoreStep[] = ['pick', 'reading', 'preview', 'confirm', 'restoring', 'done'];

    expect(steps.filter(canGoBackFrom)).toEqual(['preview', 'confirm']);
    expect(previousRestoreStep('restoring')).toBe('restoring');
  });
});
