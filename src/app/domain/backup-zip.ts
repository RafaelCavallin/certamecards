import { strFromU8, strToU8, unzipSync, Zip, ZipDeflate, ZipPassThrough } from 'fflate';
import { yieldToUi } from './anki-convert-batch';
import { BackupError } from './backup-errors';
import { IMAGES_DIR, MANIFEST_PATH, type BackupManifest } from './backup-format';

const MANIFEST_DEFLATE_LEVEL = 6;
const ZIP_MIME = 'application/zip';
const IMAGES_PREFIX = `${IMAGES_DIR}/`;

export interface ImageFile {
  path: string;
  bytes: Uint8Array;
}

export interface ZipInput {
  manifest: BackupManifest;
  images: ImageFile[];
  onProgress?: (done: number, total: number) => void;
}

export interface ManifestRead {
  manifest: unknown;
  imagePaths: Set<string>;
}

function addEntry(zip: Zip, file: ZipDeflate | ZipPassThrough, bytes: Uint8Array): void {
  zip.add(file);
  file.push(bytes, true);
}

export async function zipBackup({ manifest, images, onProgress }: ZipInput): Promise<Blob> {
  const chunks: Uint8Array[] = [];
  let failure: unknown = null;
  const zip = new Zip((error, chunk) => {
    if (error) failure = error;
    else chunks.push(chunk);
  });
  const total = images.length + 1;
  addEntry(zip, new ZipDeflate(MANIFEST_PATH, { level: MANIFEST_DEFLATE_LEVEL }), strToU8(JSON.stringify(manifest)));
  onProgress?.(1, total);
  for (const [index, image] of images.entries()) {
    addEntry(zip, new ZipPassThrough(image.path), image.bytes);
    onProgress?.(index + 2, total);
    await yieldToUi();
  }
  zip.end();
  if (failure) throw failure;
  return new Blob(chunks as BlobPart[], { type: ZIP_MIME });
}

export function unzipManifest(bytes: Uint8Array): ManifestRead {
  const imagePaths = new Set<string>();
  const files = unzipEntries(bytes, (name) => {
    if (name.startsWith(IMAGES_PREFIX)) imagePaths.add(name);
    return name === MANIFEST_PATH;
  });
  const entry = files[MANIFEST_PATH];
  if (!entry) throw new BackupError('not-backup');
  return { manifest: parseJson(entry), imagePaths };
}

export function unzipImages(bytes: Uint8Array, paths: readonly string[]): Map<string, Uint8Array> {
  const wanted = new Set(paths);
  const files = unzipEntries(bytes, (name) => wanted.has(name));
  return new Map(Object.entries(files));
}

function unzipEntries(bytes: Uint8Array, keep: (name: string) => boolean): Record<string, Uint8Array> {
  try {
    return unzipSync(bytes, { filter: (file) => keep(file.name) });
  } catch (error: unknown) {
    throw new BackupError('not-backup', { cause: error });
  }
}

function parseJson(entry: Uint8Array): unknown {
  try {
    return JSON.parse(strFromU8(entry)) as unknown;
  } catch (error: unknown) {
    throw new BackupError('not-backup', { cause: error });
  }
}
