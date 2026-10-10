import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  THEME_OPTIONS,
  THEME_STORAGE_KEY,
  browserStorage,
  parseThemePreference,
  readThemePreference,
  resolveTheme,
  writeThemePreference,
  type ThemePreference,
  type ThemeStorage,
} from './theme';

function memoryStorage(initial: string | null = null): ThemeStorage & { value: string | null } {
  const box = { value: initial };
  return {
    get value() {
      return box.value;
    },
    getItem: () => box.value,
    setItem: (_key: string, next: string) => {
      box.value = next;
    },
  };
}

function throwingStorage(): ThemeStorage {
  return {
    getItem: () => {
      throw new DOMException('blocked', 'SecurityError');
    },
    setItem: () => {
      throw new DOMException('quota', 'QuotaExceededError');
    },
  };
}

afterEach(() => vi.restoreAllMocks());

describe('resolveTheme', () => {
  it.each<[ThemePreference, boolean, 'dark' | 'light']>([
    ['dark', true, 'dark'],
    ['dark', false, 'dark'],
    ['light', true, 'light'],
    ['light', false, 'light'],
    ['system', true, 'dark'],
    ['system', false, 'light'],
  ])('preferência %s com sistema escuro=%s resolve %s', (preference, systemDark, expected) => {
    expect(resolveTheme(preference, systemDark)).toBe(expected);
  });
});

describe('parseThemePreference', () => {
  it.each(['dark', 'light', 'system'] as const)('aceita %s', (value) => {
    expect(parseThemePreference(value)).toBe(value);
  });

  it.each([null, '', 'LIGHT', 'sepia'])('trata %j como escuro', (raw) => {
    expect(parseThemePreference(raw)).toBe('dark');
  });
});

describe('readThemePreference', () => {
  it('devolve escuro sem armazenamento', () => {
    expect(readThemePreference(null)).toBe('dark');
  });

  it('devolve escuro com armazenamento vazio', () => {
    expect(readThemePreference(memoryStorage())).toBe('dark');
  });

  it('devolve o valor guardado', () => {
    expect(readThemePreference(memoryStorage('system'))).toBe('system');
  });

  it('devolve escuro quando getItem lança', () => {
    expect(readThemePreference(throwingStorage())).toBe('dark');
  });
});

describe('writeThemePreference', () => {
  it('grava na chave do tema e devolve true', () => {
    const setItem = vi.fn();

    const saved = writeThemePreference({ getItem: () => null, setItem }, 'light');

    expect(saved).toBe(true);
    expect(setItem).toHaveBeenCalledWith(THEME_STORAGE_KEY, 'light');
  });

  it('devolve false quando setItem lança', () => {
    expect(writeThemePreference(throwingStorage(), 'light')).toBe(false);
  });

  it('devolve false sem armazenamento', () => {
    expect(writeThemePreference(null, 'light')).toBe(false);
  });
});

describe('browserStorage', () => {
  it('devolve null quando o getter de localStorage lança SecurityError', () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });

    expect(browserStorage()).toBeNull();
  });

  it('devolve o localStorage quando acessível', () => {
    expect(browserStorage()).toBe(window.localStorage);
  });
});

describe('THEME_OPTIONS', () => {
  it('lista escuro, claro e seguir o sistema, nessa ordem', () => {
    expect(THEME_OPTIONS.map((option) => option.label)).toEqual(['Escuro', 'Claro', 'Seguir o sistema']);
  });
});
