import { IMAGE_BYTES_MAX, IMAGE_INPUT_BYTES_MAX, IMAGE_SIDE_MAX } from './card-limits';
import type { ImageMime } from './db-types';
import { browserCodec, type DecodedImage, type ImageCodec, type OutputMime } from './image-codec';
import { ImageError } from './image-errors';
import { fitWithin, nextQuality, type Size } from './image-resize';

export interface CompressedImage {
  blob: Blob;
  mimeType: ImageMime;
  width: number;
  height: number;
  byteSize: number;
}

export async function compressImage(file: Blob, codec: ImageCodec = browserCodec): Promise<CompressedImage> {
  if (file.size > IMAGE_INPUT_BYTES_MAX) throw new ImageError('input-too-large');
  const decoded = await codec.decode(file);
  try {
    return await encodeWithinLimit(decoded, codec);
  } finally {
    decoded.close();
  }
}

async function encodeWithinLimit(decoded: DecodedImage, codec: ImageCodec): Promise<CompressedImage> {
  const size = fitWithin(decoded.width, decoded.height, IMAGE_SIDE_MAX);
  let format: OutputMime = 'image/webp';
  let quality = nextQuality(null);
  while (quality !== null) {
    const blob = await codec.encode({ source: decoded.source, size, type: format, quality, opaque: format === 'image/jpeg' });
    if (format === 'image/webp' && blob.type !== 'image/webp') {
      format = 'image/jpeg';
      continue;
    }
    if (blob.size <= IMAGE_BYTES_MAX) return buildResult(blob, size);
    quality = nextQuality(quality);
  }
  throw new ImageError('too-large');
}

function buildResult(blob: Blob, size: Size): CompressedImage {
  const mimeType: ImageMime = blob.type === 'image/webp' ? 'image/webp' : 'image/jpeg';
  return { blob, mimeType, width: size.width, height: size.height, byteSize: blob.size };
}
