import initSqlJs, { type SqlJsStatic } from 'sql.js';
import { readCollection } from './anki-collection';
import { AnkiImportError, isAnkiError } from './anki-errors';
import { unpackAnkiPackage } from './anki-package';
import type { AnkiCollection } from './anki-types';

export const SQL_WASM_URL = '/sqljs/sql-wasm-browser.wasm';

const WASM_MAGIC = [0x00, 0x61, 0x73, 0x6d];

export type WasmLoader = () => Promise<ArrayBuffer>;

export interface AnkiReader {
  open(collection: Uint8Array, fileName: string): AnkiCollection;
}

let readerPromise: Promise<AnkiReader> | null = null;

/**
 * O `sql.js` memoiza a própria inicialização, inclusive quando ela falha:
 * baixar o wasm aqui, validar e só então entregá-lo pronto é o que permite
 * tentar de novo depois de uma queda de rede (RF60p).
 */
export function prepareAnkiReader(loadWasm: WasmLoader = fetchSqlWasm): Promise<AnkiReader> {
  readerPromise ??= loadReader(loadWasm).catch((error: unknown) => {
    readerPromise = null;
    throw new AnkiImportError('reader-unavailable', { cause: error });
  });
  return readerPromise;
}

export async function readAnkiFile(file: File, reader: AnkiReader): Promise<AnkiCollection> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  return reader.open(unpackAnkiPackage(bytes), file.name);
}

async function fetchSqlWasm(): Promise<ArrayBuffer> {
  const response = await fetch(SQL_WASM_URL);
  if (!response.ok) throw new Error(`Falha ao baixar o leitor: HTTP ${response.status}`);
  return response.arrayBuffer();
}

async function loadReader(loadWasm: WasmLoader): Promise<AnkiReader> {
  const wasmBinary = await loadWasm();
  if (!isWasm(wasmBinary)) throw new Error('O leitor baixado não é um WebAssembly válido.');
  const SQL = await initSqlJs({ wasmBinary });
  return { open: (collection, fileName) => openCollection(SQL, collection, fileName) };
}

function isWasm(binary: ArrayBuffer): boolean {
  const head = new Uint8Array(binary.slice(0, WASM_MAGIC.length));
  return WASM_MAGIC.every((byte, index) => head[index] === byte);
}

function openCollection(SQL: SqlJsStatic, collection: Uint8Array, fileName: string): AnkiCollection {
  const db = new SQL.Database(collection);
  try {
    return readCollection(db, fileName);
  } catch (error: unknown) {
    if (isAnkiError(error)) throw error;
    throw new AnkiImportError('not-anki', { cause: error });
  } finally {
    db.close();
  }
}
