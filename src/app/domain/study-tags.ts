export type StudyTagsByDeck = Record<string, string[]>;

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

export function parseStudyTags(raw: string | null): StudyTagsByDeck {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
    const entries = Object.entries(parsed).filter((entry): entry is [string, string[]] =>
      isStringArray(entry[1]),
    );
    return Object.fromEntries(entries);
  } catch {
    return {};
  }
}

export function reconcileStudyTags(keys: readonly string[], existing: ReadonlySet<string>): string[] {
  return keys.filter((key) => existing.has(key));
}

export function renameStudyTag(map: StudyTagsByDeck, fromKey: string, toKey: string): StudyTagsByDeck {
  return mapEntries(map, (keys) => [...new Set(keys.map((key) => (key === fromKey ? toKey : key)))]);
}

export function removeStudyTag(map: StudyTagsByDeck, key: string): StudyTagsByDeck {
  return mapEntries(map, (keys) => keys.filter((item) => item !== key));
}

function mapEntries(map: StudyTagsByDeck, transform: (keys: string[]) => string[]): StudyTagsByDeck {
  return Object.fromEntries(Object.entries(map).map(([deckId, keys]) => [deckId, transform(keys)]));
}
