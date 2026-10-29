export const DISPLAY_NAME_MAX_LENGTH = 60;
export const DISPLAY_NAME_KEY = 'display_name';

export function normalizeDisplayName(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ').slice(0, DISPLAY_NAME_MAX_LENGTH).trim();
}

export function isValidDisplayName(raw: string): boolean {
  return normalizeDisplayName(raw).length > 0;
}

export function displayNameOf(metadata: Record<string, unknown> | undefined): string | null {
  const value = metadata?.[DISPLAY_NAME_KEY];
  if (typeof value !== 'string') return null;
  const name = normalizeDisplayName(value);
  return name.length > 0 ? name : null;
}
