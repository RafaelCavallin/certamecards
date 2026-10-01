import { describe, expect, it } from 'vitest';
import { canGoBack, previousStep, stepAfterReading, visibleStepNumber } from './anki-steps';

describe('passos da importação', () => {
  it('pula o passo de origem quando há um só baralho', () => {
    expect(stepAfterReading(1)).toBe('fields');
    expect(stepAfterReading(3)).toBe('decks');
  });

  it('volta do destino para os campos e dos campos para a origem ou o arquivo', () => {
    expect(previousStep('target', 1)).toBe('fields');
    expect(previousStep('fields', 3)).toBe('decks');
    expect(previousStep('fields', 1)).toBe('file');
    expect(previousStep('decks', 3)).toBe('file');
  });

  it('só permite voltar nos passos de escolha', () => {
    expect(['file', 'reading', 'decks', 'fields', 'preparing', 'target', 'importing', 'done'].filter((step) =>
      canGoBack(step as Parameters<typeof canGoBack>[0]),
    )).toEqual(['decks', 'fields', 'target']);
  });

  it('numera os passos visíveis de 1 a 4 e esconde o número no progresso e no fim', () => {
    expect([visibleStepNumber('file'), visibleStepNumber('decks'), visibleStepNumber('fields'), visibleStepNumber('target')]).toEqual([1, 2, 3, 4]);
    expect(visibleStepNumber('importing')).toBeNull();
    expect(visibleStepNumber('done')).toBeNull();
  });
});
