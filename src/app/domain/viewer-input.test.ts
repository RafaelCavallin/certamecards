import { describe, expect, it } from 'vitest';
import { clampIndex, isDoubleTap, isZoomed, swipeDirection, viewerKeyAction } from './viewer-input';

describe('viewerKeyAction', () => {
  it('mapeia setas, zoom e Escape', () => {
    const keys = ['ArrowLeft', 'ArrowRight', '+', '=', '-', 'Escape'];

    expect(keys.map(viewerKeyAction)).toEqual(['prev', 'next', 'zoom-in', 'zoom-in', 'zoom-out', 'close']);
  });

  it('ignora as teclas da revisão, para não responder o cartão sem querer', () => {
    expect([' ', 'Space', '1', '2', 'Enter', 'a'].map(viewerKeyAction)).toEqual([null, null, null, null, null, null]);
  });
});

describe('swipeDirection', () => {
  it('desliza para a próxima com o dedo indo para a esquerda e para a anterior para a direita', () => {
    expect(swipeDirection({ dx: -80, dy: 5, scale: 1 })).toBe('next');
    expect(swipeDirection({ dx: 80, dy: -5, scale: 1 })).toBe('prev');
  });

  it('não troca de imagem com zoom, porque o arrasto move a imagem', () => {
    expect(swipeDirection({ dx: -200, dy: 0, scale: 2 })).toBeNull();
  });

  it('exige 60 px na horizontal e mais deslocamento horizontal que vertical', () => {
    expect(swipeDirection({ dx: -59, dy: 0, scale: 1 })).toBeNull();
    expect(swipeDirection({ dx: -60, dy: 0, scale: 1 })).toBe('next');
    expect(swipeDirection({ dx: -70, dy: 90, scale: 1 })).toBeNull();
    expect(swipeDirection({ dx: -70, dy: 70, scale: 1 })).toBeNull();
  });
});

describe('isDoubleTap e clampIndex', () => {
  it('reconhece o segundo toque dentro de 300 ms', () => {
    expect([isDoubleTap(null, 1000), isDoubleTap(1000, 1250), isDoubleTap(1000, 1300), isDoubleTap(1000, 1301)]).toEqual([
      false, true, true, false,
    ]);
  });

  it('mantém o índice dentro da galeria', () => {
    expect([clampIndex(-1, 4), clampIndex(2, 4), clampIndex(9, 4), clampIndex(0, 1)]).toEqual([0, 2, 3, 0]);
  });
});

describe('isZoomed', () => {
  it('tolera a imprecisão de ponto flutuante que o panzoom deixa depois de um reset', () => {
    expect([isZoomed(1), isZoomed(1.0000000467), isZoomed(1.01), isZoomed(1.02), isZoomed(2.5)]).toEqual([false, false, false, true, true]);
  });

  it('o deslize também considera ajustada a imagem com escala imprecisa', () => {
    expect(swipeDirection({ dx: -80, dy: 0, scale: 1.0000000467 })).toBe('next');
  });
});
