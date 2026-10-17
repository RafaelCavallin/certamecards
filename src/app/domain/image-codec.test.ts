import { afterEach, describe, expect, it, vi } from 'vitest';
import { browserCodec } from './image-codec';

interface FakeBitmap {
  width: number;
  height: number;
  close: ReturnType<typeof vi.fn>;
}

function bitmap(width: number, height: number): FakeBitmap {
  return { width, height, close: vi.fn() };
}

function stubCanvas() {
  const operations: string[] = [];
  const context = {
    fillStyle: '',
    fillRect: vi.fn(() => void operations.push('fillRect')),
    drawImage: vi.fn(() => void operations.push('drawImage')),
  };
  const convertToBlob = vi.fn(async () => new Blob(['x'], { type: 'image/webp' }));
  class FakeOffscreen {
    constructor(
      readonly width: number,
      readonly height: number,
    ) {}
    getContext = () => context;
    convertToBlob = convertToBlob;
  }
  vi.stubGlobal('OffscreenCanvas', FakeOffscreen);
  return { context, operations, convertToBlob };
}

afterEach(() => vi.unstubAllGlobals());

describe('browserCodec.decode', () => {
  it('abre a imagem respeitando a orientação da câmera e expõe close', async () => {
    const source = bitmap(1200, 900);
    const create = vi.fn(async () => source);
    vi.stubGlobal('createImageBitmap', create);
    const file = new Blob(['x']);

    const decoded = await browserCodec.decode(file);
    decoded.close();

    expect(create).toHaveBeenCalledWith(file, { imageOrientation: 'from-image' });
    expect([decoded.width, decoded.height]).toEqual([1200, 900]);
    expect(source.close).toHaveBeenCalledTimes(1);
  });

  it('traduz a falha de decodificação em ImageError unreadable', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn().mockRejectedValue(new Error('x')));

    const attempt = browserCodec.decode(new Blob(['x']));

    await expect(attempt).rejects.toMatchObject({ code: 'unreadable' });
  });

  it('decodifica de novo já reduzida quando o lado maior passa de 2× o alvo', async () => {
    const original = bitmap(8000, 6000);
    const smaller = bitmap(2000, 1500);
    const create = vi.fn().mockResolvedValueOnce(original).mockResolvedValueOnce(smaller);
    vi.stubGlobal('createImageBitmap', create);

    const decoded = await browserCodec.decode(new Blob(['x']));

    expect(create).toHaveBeenLastCalledWith(expect.anything(), expect.objectContaining({ resizeWidth: 2000 }));
    expect(original.close).toHaveBeenCalledTimes(1);
    expect([decoded.width, decoded.height]).toEqual([2000, 1500]);
  });

  it('usa o bitmap original quando o navegador não aceita redimensionar', async () => {
    const original = bitmap(8000, 6000);
    const create = vi.fn().mockResolvedValueOnce(original).mockRejectedValueOnce(new Error('sem suporte'));
    vi.stubGlobal('createImageBitmap', create);

    const decoded = await browserCodec.decode(new Blob(['x']));

    expect(decoded.width).toBe(8000);
    expect(original.close).not.toHaveBeenCalled();
  });
});

describe('browserCodec.encode', () => {
  const size = { width: 100, height: 50 };
  const source = {} as CanvasImageSource;

  it('pinta o fundo branco antes de desenhar quando opaco', async () => {
    const { context, operations } = stubCanvas();

    await browserCodec.encode({ source, size, type: 'image/jpeg', quality: 0.9, opaque: true });

    expect(operations).toEqual(['fillRect', 'drawImage']);
    expect(context.fillStyle).toBe('white');
    expect(context.fillRect).toHaveBeenCalledWith(0, 0, 100, 50);
  });

  it('preserva a transparência quando não opaco', async () => {
    const { operations } = stubCanvas();

    await browserCodec.encode({ source, size, type: 'image/webp', quality: 0.9, opaque: false });

    expect(operations).toEqual(['drawImage']);
  });

  it('codifica no tipo e na qualidade pedidos', async () => {
    const { convertToBlob } = stubCanvas();

    const blob = await browserCodec.encode({ source, size, type: 'image/webp', quality: 0.8, opaque: false });

    expect(convertToBlob).toHaveBeenCalledWith({ type: 'image/webp', quality: 0.8 });
    expect(blob.type).toBe('image/webp');
  });

  it('usa o canvas do documento quando não há OffscreenCanvas', async () => {
    vi.stubGlobal('OffscreenCanvas', undefined);
    const context = { fillStyle: '', fillRect: vi.fn(), drawImage: vi.fn() };
    const toBlob = vi.fn((callback: (blob: Blob | null) => void) => callback(new Blob(['x'], { type: 'image/jpeg' })));
    const canvas = document.createElement('canvas');
    vi.spyOn(canvas, 'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D);
    vi.spyOn(canvas, 'toBlob').mockImplementation(toBlob as unknown as HTMLCanvasElement['toBlob']);
    vi.spyOn(document, 'createElement').mockReturnValue(canvas);

    const blob = await browserCodec.encode({ source, size, type: 'image/jpeg', quality: 0.7, opaque: true });

    expect(blob.type).toBe('image/jpeg');
    expect([canvas.width, canvas.height]).toEqual([100, 50]);
    vi.restoreAllMocks();
  });

  it('falha com ImageError quando o canvas não devolve blob', async () => {
    vi.stubGlobal('OffscreenCanvas', undefined);
    const canvas = document.createElement('canvas');
    vi.spyOn(canvas, 'getContext').mockReturnValue({ drawImage: vi.fn() } as unknown as CanvasRenderingContext2D);
    vi.spyOn(canvas, 'toBlob').mockImplementation(((callback: (blob: Blob | null) => void) => callback(null)) as HTMLCanvasElement['toBlob']);
    vi.spyOn(document, 'createElement').mockReturnValue(canvas);

    const attempt = browserCodec.encode({ source, size, type: 'image/webp', quality: 0.9, opaque: false });

    await expect(attempt).rejects.toMatchObject({ code: 'unreadable' });
    vi.restoreAllMocks();
  });
});
