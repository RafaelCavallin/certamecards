import { tagKey } from './tags';

export const TAG_PARAM = 'etiquetas';
const TAG_PARAM_SEPARATOR = ',';

export function parseTagParam(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const keys = raw
    .split(TAG_PARAM_SEPARATOR)
    .map(tagKey)
    .filter((key) => key.length > 0);
  return [...new Set(keys)];
}

export function serializeTagParam(keys: readonly string[]): string | null {
  return keys.length === 0 ? null : keys.join(TAG_PARAM_SEPARATOR);
}
