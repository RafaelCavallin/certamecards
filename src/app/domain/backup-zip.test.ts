import { strToU8, zipSync } from 'fflate';
import { describe, expect, it, vi } from 'vitest';
import { BackupError } from './backup-errors';
import { unzipImages, unzipManifest, zipBackup } from './backup-zip';
import { imageBytes, makeContent, manifestOf } from '../../test/backup-fixtures';

async function bytesOf(blob: Blob): Promise<Uint8Array> {
  return new Uint8Array(await blob.arrayBuffer());
}

describe('zipBackup', () => {
  it('gera um zip que o leitor abre, com manifesto e imagens', async () => {
    const manifest = manifestOf(makeContent());
    const images = [{ path: 'images/image-1.webp', bytes: imageBytes(7) }];

    const bytes = await bytesOf(await zipBackup({ manifest, images }));

    const read = unzipManifest(bytes);
    expect(read.manifest).toEqual(JSON.parse(JSON.stringify(manifest)));
    expect([...read.imagePaths]).toEqual(['images/image-1.webp']);
    expect(unzipImages(bytes, ['images/image-1.webp']).get('images/image-1.webp')).toEqual(imageBytes(7));
  });

  it('informa o progresso por arquivo', async () => {
    const onProgress = vi.fn();
    const images = [
      { path: 'images/a.webp', bytes: imageBytes(1) },
      { path: 'images/b.webp', bytes: imageBytes(2) },
    ];

    await zipBackup({ manifest: manifestOf(makeContent()), images, onProgress });

    expect(onProgress.mock.calls).toEqual([[1, 3], [2, 3], [3, 3]]);
  });
});

describe('unzipManifest', () => {
  it('recusa bytes que não são um zip', () => {
    expect(() => unzipManifest(strToU8('isto não é um zip'))).toThrow(BackupError);
  });

  it('recusa zip sem backup.json', () => {
    const bytes = zipSync({ 'outro.txt': strToU8('x') });

    expect(() => unzipManifest(bytes)).toThrow(expect.objectContaining({ code: 'not-backup' }));
  });

  it('recusa backup.json que não é JSON', () => {
    const bytes = zipSync({ 'backup.json': strToU8('{quebrado') });

    expect(() => unzipManifest(bytes)).toThrow(expect.objectContaining({ code: 'not-backup' }));
  });
});

describe('unzipImages', () => {
  it('extrai só os caminhos pedidos', () => {
    const bytes = zipSync({ 'images/a.webp': imageBytes(1), 'images/b.webp': imageBytes(2), 'backup.json': strToU8('{}') });

    const files = unzipImages(bytes, ['images/b.webp']);

    expect([...files.keys()]).toEqual(['images/b.webp']);
  });
});
