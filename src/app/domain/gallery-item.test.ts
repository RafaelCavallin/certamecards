import { describe, expect, it } from 'vitest';
import { makeImageBlob } from '../../test/image-fixtures';
import { galleryItemFrom } from './gallery-item';

describe('galleryItemFrom', () => {
  it('cria um item novo, sem legenda, com o arquivo comprimido e um id próprio', () => {
    const image = { blob: makeImageBlob(10), mimeType: 'image/webp' as const, width: 10, height: 5, byteSize: 10 };

    const first = galleryItemFrom(image);
    const second = galleryItemFrom(image);

    expect(first).toMatchObject({ origin: 'new', caption: '', blob: image.blob, image });
    expect(first.id).not.toBe(second.id);
  });
});
