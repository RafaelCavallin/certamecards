import { describe, it, expect } from 'vitest';
import { findViolations } from './check-type-scale.mjs';

describe('findViolations', () => {
  it('aponta o uso de text-xs', () => {
    const violations = findViolations('<span class="text-xs">rótulo</span>');

    expect(violations).toEqual([{ pattern: 'text-xs', line: 1 }]);
  });

  it('aponta tamanhos arbitrários em colchetes', () => {
    const violations = findViolations('<p class="text-[10px]">texto</p>');

    expect(violations).toEqual([{ pattern: 'text-[Npx]/text-[Nrem]', line: 1 }]);
  });

  it('aponta cores em hex no template', () => {
    const violations = findViolations('<div style="color: #14142B">x</div>');

    expect(violations).toEqual([{ pattern: 'cor em hex', line: 1 }]);
  });

  it('aceita a escala tipográfica semântica sem apontar violação', () => {
    const violations = findViolations(
      '<p class="text-body text-front-long text-on-signal bg-signal">Frente longa</p>',
    );

    expect(violations).toEqual([]);
  });

  it('reporta o número da linha de cada violação', () => {
    const content = '<p class="text-body">ok</p>\n<span class="text-xs">ruim</span>';

    const violations = findViolations(content);

    expect(violations).toEqual([{ pattern: 'text-xs', line: 2 }]);
  });

  it('aponta font-size inline abaixo de 13px', () => {
    const violations = findViolations('<text style="font-size: 9px">rótulo</text>');

    expect(violations).toEqual([{ pattern: 'font-size inline abaixo de 13px', line: 1 }]);
  });

  it('aceita font-size inline a partir de 13px', () => {
    const violations = findViolations('<text style="font-size: 14px">rótulo</text>');

    expect(violations).toEqual([]);
  });
});
