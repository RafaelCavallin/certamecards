import { unzipSync, type Unzipped } from 'fflate';
import { decompress } from 'fzstd';
import { AnkiImportError } from './anki-errors';

const ZSTD_COLLECTION = 'collection.anki21b';

/**
 * Num pacote do Anki atual, `collection.anki2` é um banco-isca com uma nota
 * “atualize o Anki”: a coleção nova tem de vir antes dela.
 */
export const COLLECTION_ENTRIES = [ZSTD_COLLECTION, 'collection.anki21', 'collection.anki2'] as const;

const COLLECTION_NAMES = new Set<string>(COLLECTION_ENTRIES);

export function unpackAnkiPackage(bytes: Uint8Array): Uint8Array {
  const entries = unzipCollections(bytes);
  const name = COLLECTION_ENTRIES.find((entry) => entries[entry] !== undefined);
  if (!name) throw new AnkiImportError('not-anki');
  return name === ZSTD_COLLECTION ? decompressCollection(entries[name]) : entries[name];
}

function unzipCollections(bytes: Uint8Array): Unzipped {
  try {
    return unzipSync(bytes, { filter: (file) => COLLECTION_NAMES.has(file.name) });
  } catch (error: unknown) {
    throw new AnkiImportError('not-anki', { cause: error });
  }
}

function decompressCollection(compressed: Uint8Array): Uint8Array {
  try {
    return decompress(compressed);
  } catch (error: unknown) {
    throw new AnkiImportError('not-anki', { cause: error });
  }
}
