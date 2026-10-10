import { browserStorage, type KeyValueStorage } from './local-storage';

export { browserStorage };
export type ThemePreference = 'dark' | 'light' | 'system';
export type ResolvedTheme = 'dark' | 'light';
export type ThemeStorage = KeyValueStorage;

export interface ThemeOption {
  value: ThemePreference;
  label: string;
}

export const THEME_STORAGE_KEY = 'certamecards.theme';
export const DEFAULT_THEME_PREFERENCE: ThemePreference = 'dark';
export const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)';

export const THEME_OPTIONS: readonly ThemeOption[] = [
  { value: 'dark', label: 'Escuro' },
  { value: 'light', label: 'Claro' },
  { value: 'system', label: 'Seguir o sistema' },
];

export function parseThemePreference(raw: string | null): ThemePreference {
  const match = THEME_OPTIONS.find((option) => option.value === raw);
  return match?.value ?? DEFAULT_THEME_PREFERENCE;
}

export function resolveTheme(preference: ThemePreference, systemPrefersDark: boolean): ResolvedTheme {
  if (preference === 'system') return systemPrefersDark ? 'dark' : 'light';
  return preference;
}

export function readThemePreference(storage: ThemeStorage | null): ThemePreference {
  if (!storage) return DEFAULT_THEME_PREFERENCE;
  try {
    return parseThemePreference(storage.getItem(THEME_STORAGE_KEY));
  } catch {
    return DEFAULT_THEME_PREFERENCE;
  }
}

export function writeThemePreference(storage: ThemeStorage | null, preference: ThemePreference): boolean {
  if (!storage) return false;
  try {
    storage.setItem(THEME_STORAGE_KEY, preference);
    return true;
  } catch {
    return false;
  }
}
