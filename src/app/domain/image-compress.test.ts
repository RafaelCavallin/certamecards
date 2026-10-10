import { describe, expect, it } from 'vitest';
import { IMAGE_BYTES_MAX, IMAGE_INPUT_BYTES_MAX } from './card-limits';
import type { DecodedImage, EncodeInput, ImageCodec } from './image-codec';
import { compressImage } from './image-compress';
import { ImageError } from './image-errors';

interface FakeOptions {
  width?: number;
  height?: number;
  sizeFor?: (quality: number) => number;
  typeFor?: (requested: string) => string;
}

function fakeCodec(options: FakeOptions = {}) {
  const calls: EncodeInput[] = [];
  const state = { decodeCalls: 0, closed: 0 };
  const decoded: DecodedImage = {
    source: {} as CanvasImageSource,
    width: options.width ?? 4000,
    height: options.height ?? 3000,
    close: () => void (state.closed += 1),
  };
  const codec: ImageCodec = {
    decode: async () => {
      state.decodeCalls += 1;
      return decoded;
    },
    encode: async (input) => {
      calls.push(input);
      const type = options.typeFor?.(input.type) ?? input.type;
      return new Blob([new Uint8Array(options.sizeFor?.(input.quality) ?? 1000)], { type });
    },
  };
  return { codec, calls, state };
}

function file(): Blob {
  return new Blob(['x']);
}

describe('compressImage', () => {
  it('reduz o lado maior para 2.000 px e devolve WebP dentro do limite', async () => {
    const { codec } = fakeCodec();

    const result = await compressImage(file(), codec);

    expect(result).toMatchObject({ mimeType: 'image/webp', width: 2000, height: 1500, byteSize: 1000 });
    expect(result.blob.type).toBe('image/webp');
  });

  it('para na primeira qualidade que cabe em 1,5 MB', async () => {
    const { codec, calls } = fakeCodec({ sizeFor: (quality) => (quality > 0.8 ? IMAGE_BYTES_MAX + 1 : IMAGE_BYTES_MAX) });

    const result = await compressImage(file(), codec);

    expect(calls.map((call) => call.quality)).toEqual([0.9, 0.85, 0.8]);
    expect(result.byteSize).toBe(IMAGE_BYTES_MAX);
  });

  it('não amplia uma imagem pequena', async () => {
    const { codec } = fakeCodec({ width: 800, height: 600 });

    const result = await compressImage(file(), codec);

    expect(result).toMatchObject({ width: 800, height: 600 });
  });

  it('cai para JPEG opaco quando o codec não devolve WebP', async () => {
    const { codec, calls } = fakeCodec({ typeFor: (requested) => (requested === 'image/webp' ? 'image/png' : requested) });

    const result = await compressImage(file(), codec);

    expect(result.mimeType).toBe('image/jpeg');
    expect(calls.map((call) => [call.type, call.opaque, call.quality])).toEqual([
      ['image/webp', false, 0.9],
      ['image/jpeg', true, 0.9],
    ]);
  });

  it('recusa entrada acima de 50 MB sem decodificar', async () => {
    const { codec, state } = fakeCodec();
    const huge = { size: IMAGE_INPUT_BYTES_MAX + 1 } as Blob;

    const attempt = compressImage(huge, codec);

    await expect(attempt).rejects.toMatchObject({ code: 'input-too-large', message: 'Esta imagem é grande demais para abrir.' });
    expect(state.decodeCalls).toBe(0);
  });

  it('propaga o arquivo ilegível do codec', async () => {
    const codec: ImageCodec = {
      decode: () => Promise.reject(new ImageError('unreadable')),
      encode: () => Promise.reject(new Error('não deveria codificar')),
    };

    const attempt = compressImage(file(), codec);

    await expect(attempt).rejects.toMatchObject({
      code: 'unreadable',
      message: 'Não foi possível abrir este arquivo como imagem.',
    });
  });

  it('desiste quando nem a menor qualidade cabe, tentando todas em ordem', async () => {
    const { codec, calls } = fakeCodec({ sizeFor: () => IMAGE_BYTES_MAX + 1 });

    const attempt = compressImage(file(), codec);

    await expect(attempt).rejects.toMatchObject({ code: 'too-large', message: 'Esta imagem ficou grande demais mesmo reduzida.' });
    expect(calls.map((call) => call.quality)).toEqual([0.9, 0.85, 0.8, 0.7, 0.6, 0.5]);
  });

  it('libera a imagem decodificada em caso de sucesso e de falha', async () => {
    const success = fakeCodec();
    const failure = fakeCodec({ sizeFor: () => IMAGE_BYTES_MAX + 1 });

    await compressImage(file(), success.codec);
    await compressImage(file(), failure.codec).catch(() => undefined);

    expect([success.state.closed, failure.state.closed]).toEqual([1, 1]);
  });
});
