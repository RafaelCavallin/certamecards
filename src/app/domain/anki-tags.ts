import { TAGS_MAX, TAG_MAX_LENGTH } from './card-limits';
import { normalizeTag, tagKey } from './tags';

export const ANKI_INTERNAL_TAGS: ReadonlySet<string> = new Set(['leech', 'marked']);

const ANKI_TAG_SEPARATOR = /\s+/;
const ANKI_WORD_JOINER = /_/g;

export interface ImportedTags {
  tags: string[];
  dropped: number;
}

export function importTags(raw: string, catalog: ReadonlyMap<string, string>): ImportedTags {
  const tags: string[] = [];
  const seen = new Set<string>();
  let dropped = 0;
  for (const part of splitAnkiTags(raw)) {
    const key = tagKey(part);
    if (seen.has(key)) continue;
    if (!isAcceptable(part, key) || tags.length >= TAGS_MAX) {
      dropped += 1;
      continue;
    }
    seen.add(key);
    tags.push(catalog.get(key) ?? part);
  }
  return { tags, dropped };
}

export function catalogByKey(catalog: readonly { key: string; name: string }[]): Map<string, string> {
  return new Map(catalog.map((entry) => [entry.key, entry.name]));
}

function splitAnkiTags(raw: string): string[] {
  return raw
    .split(ANKI_TAG_SEPARATOR)
    .map((part) => normalizeTag(part.replace(ANKI_WORD_JOINER, ' ')))
    .filter((part) => part.length > 0);
}

function isAcceptable(tag: string, key: string): boolean {
  return !ANKI_INTERNAL_TAGS.has(key) && tag.length <= TAG_MAX_LENGTH;
}
