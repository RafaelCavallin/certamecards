export const CLOZE_KIND = 1;
export const IMAGE_OCCLUSION_STOCK_KIND = 6;

const KIND_FIELD = 1;
const ORIGINAL_STOCK_KIND_FIELD = 9;
const WIRE_VARINT = 0;
const WIRE_FIXED64 = 1;
const WIRE_LENGTH_DELIMITED = 2;
const WIRE_FIXED32 = 5;
const FIXED64_BYTES = 8;
const FIXED32_BYTES = 4;
const VARINT_PAYLOAD_MASK = 0x7f;
const VARINT_CONTINUATION = 0x80;
const VARINT_SHIFT = 7;
const WIRE_TYPE_BITS = 8;

export interface NotetypeConfig {
  kind: number;
  originalStockKind: number;
}

interface Varint {
  value: number;
  next: number;
}

/**
 * `notetypes.config` é um protobuf (NotetypeConfig do Anki). Só interessam
 * dois campos varint do nível de cima: 1 (`kind`, 1 = lacuna) e 9
 * (`original_stock_kind`, 6 = oclusão de imagem). O resto é pulado pelo
 * tipo de fio, sem conhecer o esquema.
 */
export function readNotetypeConfig(config: Uint8Array): NotetypeConfig {
  const result: NotetypeConfig = { kind: 0, originalStockKind: 0 };
  let offset = 0;
  while (offset < config.length) {
    const key = readVarint(config, offset);
    const field = Math.floor(key.value / WIRE_TYPE_BITS);
    const wire = key.value % WIRE_TYPE_BITS;
    if (wire !== WIRE_VARINT) {
      offset = skipField(config, key.next, wire);
      continue;
    }
    const value = readVarint(config, key.next);
    assignField(result, field, value.value);
    offset = value.next;
  }
  return result;
}

function assignField(result: NotetypeConfig, field: number, value: number): void {
  if (field === KIND_FIELD) result.kind = value;
  if (field === ORIGINAL_STOCK_KIND_FIELD) result.originalStockKind = value;
}

function readVarint(bytes: Uint8Array, start: number): Varint {
  let value = 0;
  let multiplier = 1;
  for (let offset = start; offset < bytes.length; offset++) {
    const byte = bytes[offset];
    value += (byte & VARINT_PAYLOAD_MASK) * multiplier;
    if (byte < VARINT_CONTINUATION) return { value, next: offset + 1 };
    multiplier *= 2 ** VARINT_SHIFT;
  }
  return { value, next: bytes.length };
}

function skipField(bytes: Uint8Array, offset: number, wire: number): number {
  if (wire === WIRE_LENGTH_DELIMITED) {
    const length = readVarint(bytes, offset);
    return length.next + length.value;
  }
  if (wire === WIRE_FIXED64) return offset + FIXED64_BYTES;
  if (wire === WIRE_FIXED32) return offset + FIXED32_BYTES;
  return bytes.length;
}
