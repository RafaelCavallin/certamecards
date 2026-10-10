import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';

const fetchMissingImages = vi.fn(async () => 0);
vi.mock('../domain/image-download', () => ({ fetchMissingImages }));
const { ImagePrefetch } = await import('./image-prefetch');

TestBed.initTestEnvironment(BrowserTestingModule, platformBrowserTesting());

afterEach(() => {
  TestBed.resetTestingModule();
  vi.clearAllMocks();
});

describe('ImagePrefetch', () => {
  it('baixa na hora as imagens dos cartões pedidos', () => {
    const prefetch = TestBed.inject(ImagePrefetch);

    prefetch.request(['c1', 'c2', 'c3']);

    expect(fetchMissingImages).toHaveBeenCalledWith(['c1', 'c2', 'c3']);
  });

  it('refaz, quando a conexão volta, o último pedido da tela e o da fila juntos', () => {
    const prefetch = TestBed.inject(ImagePrefetch);
    prefetch.request(['c1', 'c2', 'c3'], 'queue');
    prefetch.request(['c1'], 'screen');
    fetchMissingImages.mockClear();

    window.dispatchEvent(new Event('online'));

    expect(fetchMissingImages).toHaveBeenCalledTimes(1);
    expect(fetchMissingImages).toHaveBeenCalledWith(['c1', 'c2', 'c3']);
  });

  it('um pedido novo da mesma origem substitui o anterior, sem acumular cartões já passados', () => {
    const prefetch = TestBed.inject(ImagePrefetch);
    prefetch.request(['c1', 'c2', 'c3'], 'queue');
    prefetch.request(['c2', 'c3', 'c4'], 'queue');
    fetchMissingImages.mockClear();

    window.dispatchEvent(new Event('online'));

    expect(fetchMissingImages).toHaveBeenCalledWith(['c2', 'c3', 'c4']);
  });

  it('devolve zero em vez de lançar quando o download falha', async () => {
    fetchMissingImages.mockRejectedValueOnce(new Error('sem sessão'));
    const prefetch = TestBed.inject(ImagePrefetch);

    expect(await prefetch.request(['c1'])).toBe(0);
  });

  it('para de ouvir a conexão quando o serviço é destruído', () => {
    const prefetch = TestBed.inject(ImagePrefetch);
    prefetch.request(['c1']);
    TestBed.resetTestingModule();
    fetchMissingImages.mockClear();

    window.dispatchEvent(new Event('online'));

    expect(fetchMissingImages).not.toHaveBeenCalled();
  });
});
