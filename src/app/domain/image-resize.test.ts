import { describe, expect, it } from 'vitest';
import { QUALITY_STEPS, fitWithin, nextQuality } from './image-resize';

describe('fitWithin', () => {
  it('reduz a imagem larga mantendo a proporção', () => {
    expect(fitWithin(4000, 3000, 2000)).toEqual({ width: 2000, height: 1500 });
  });

  it('reduz a imagem em pé pelo lado maior', () => {
    expect(fitWithin(1500, 3000, 2000)).toEqual({ width: 1000, height: 2000 });
  });

  it('não amplia a imagem menor que o limite', () => {
    expect(fitWithin(800, 600, 2000)).toEqual({ width: 800, height: 600 });
  });

  it('mantém a imagem exatamente no limite', () => {
    expect(fitWithin(2000, 1000, 2000)).toEqual({ width: 2000, height: 1000 });
  });

  it('nunca devolve lado zero numa imagem muito alongada', () => {
    expect(fitWithin(10000, 1, 2000)).toEqual({ width: 2000, height: 1 });
  });
});

describe('nextQuality', () => {
  it('começa na maior qualidade', () => {
    expect(nextQuality(null)).toBe(0.9);
  });

  it('percorre os degraus em ordem decrescente e termina em null', () => {
    const visited: number[] = [];
    for (let q = nextQuality(null); q !== null; q = nextQuality(q)) visited.push(q);

    expect(visited).toEqual([...QUALITY_STEPS]);
  });
});
