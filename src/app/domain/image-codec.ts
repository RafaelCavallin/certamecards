import { IMAGE_SIDE_MAX } from './card-limits';
import { ImageError } from './image-errors';
import type { Size } from './image-resize';

export type OutputMime = 'image/webp' | 'image/jpeg';

export interface DecodedImage {
  source: CanvasImageSource;
  width: number;
  height: number;
  close(): void;
}

export interface EncodeInput {
  source: CanvasImageSource;
  size: Size;
  type: OutputMime;
  quality: number;
  opaque: boolean;
}

export interface ImageCodec {
  decode(file: Blob): Promise<DecodedImage>;
  encode(input: EncodeInput): Promise<Blob>;
}

const OPAQUE_BACKGROUND = 'white';
const OVERSIZE_FACTOR = 2;

export const browserCodec: ImageCodec = { decode: decodeInBrowser, encode: encodeInBrowser };

async function decodeInBrowser(file: Blob): Promise<DecodedImage> {
  const bitmap = await openBitmap(file);
  const oversized = Math.max(bitmap.width, bitmap.height) > IMAGE_SIDE_MAX * OVERSIZE_FACTOR;
  const smaller = oversized ? await downscaledBitmap(file, bitmap) : null;
  const chosen = smaller ?? bitmap;
  if (smaller) bitmap.close();
  return { source: chosen, width: chosen.width, height: chosen.height, close: () => chosen.close() };
}

async function openBitmap(file: Blob): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new ImageError('unreadable');
  }
}

async function downscaledBitmap(file: Blob, original: ImageBitmap): Promise<ImageBitmap | null> {
  const resize = original.width >= original.height ? { resizeWidth: IMAGE_SIDE_MAX } : { resizeHeight: IMAGE_SIDE_MAX };
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image', resizeQuality: 'high', ...resize });
  } catch {
    return null;
  }
}

async function encodeInBrowser(input: EncodeInput): Promise<Blob> {
  const { source, size, type, quality, opaque } = input;
  const canvas = typeof OffscreenCanvas === 'undefined' ? domCanvas(size) : new OffscreenCanvas(size.width, size.height);
  const context = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D | null;
  if (!context) throw new ImageError('unreadable');
  if (opaque) paintBackground(context, size);
  context.drawImage(source, 0, 0, size.width, size.height);
  return canvas instanceof HTMLCanvasElement ? domBlob(canvas, type, quality) : canvas.convertToBlob({ type, quality });
}

function paintBackground(context: OffscreenCanvasRenderingContext2D, size: Size): void {
  context.fillStyle = OPAQUE_BACKGROUND;
  context.fillRect(0, 0, size.width, size.height);
}

function domCanvas(size: Size): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  return canvas;
}

function domBlob(canvas: HTMLCanvasElement, type: OutputMime, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new ImageError('unreadable'))), type, quality);
  });
}
