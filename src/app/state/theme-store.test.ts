import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { wipeLocalData } from '../domain/local-data';
import { THEME_STORAGE_KEY } from '../domain/theme';
import { installFakeMatchMedia } from '../../test/fake-match-media';
import { ThemeStore } from './theme-store';

const INK_BY_THEME: Record<string, string> = { dark: 'rgb(1, 1, 1)', light: 'rgb(2, 2, 2)' };

function dataTheme(): string | null {
  return document.documentElement.getAttribute('data-theme');
}

function themeColor(): string | null {
  return document.querySelector('meta[name=theme-color]')?.getAttribute('content') ?? null;
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  document.head.insertAdjacentHTML('beforeend', '<meta name="theme-color" content="initial">');
  vi.spyOn(window, 'getComputedStyle').mockImplementation(
    () => ({ getPropertyValue: () => INK_BY_THEME[dataTheme() ?? 'dark'] }) as unknown as CSSStyleDeclaration,
  );
});

afterEach(() => {
  document.querySelector('meta[name=theme-color]')?.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('ThemeStore', () => {
  it('abre no escuro num aparelho sem escolha', () => {
    installFakeMatchMedia(false);

    const store = new ThemeStore();

    expect(store.preference()).toBe('dark');
    expect(dataTheme()).toBe('dark');
    expect(themeColor()).toBe(INK_BY_THEME['dark']);
  });

  it('aplica, grava e persiste a escolha do claro', () => {
    installFakeMatchMedia(true);
    const store = new ThemeStore();

    store.setPreference('light');

    expect(dataTheme()).toBe('light');
    expect(themeColor()).toBe(INK_BY_THEME['light']);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    expect(new ThemeStore().preference()).toBe('light');
  });

  it('em seguir o sistema, acompanha a mudança do sistema nos dois sentidos', () => {
    const media = installFakeMatchMedia(true);
    localStorage.setItem(THEME_STORAGE_KEY, 'system');
    const store = new ThemeStore();
    expect(store.resolved()).toBe('dark');

    media.dispatch(false);
    expect([store.resolved(), dataTheme(), themeColor()]).toEqual(['light', 'light', INK_BY_THEME['light']]);

    media.dispatch(true);
    expect([store.resolved(), dataTheme(), themeColor()]).toEqual(['dark', 'dark', INK_BY_THEME['dark']]);
  });

  it.each(['dark', 'light'] as const)('com %s fixo ignora a mudança do sistema', (fixed) => {
    const media = installFakeMatchMedia(true);
    localStorage.setItem(THEME_STORAGE_KEY, fixed);
    const store = new ThemeStore();

    media.dispatch(false);
    media.dispatch(true);

    expect(store.resolved()).toBe(fixed);
    expect(dataTheme()).toBe(fixed);
  });

  it('sem matchMedia, seguir o sistema resolve como escuro', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'system');

    expect(new ThemeStore().resolved()).toBe('dark');
  });

  it('com localStorage que lança, abre no escuro e troca só em memória, sem erro', () => {
    installFakeMatchMedia(true);
    const consoleError = vi.spyOn(console, 'error');
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });

    const store = new ThemeStore();
    expect(dataTheme()).toBe('dark');
    store.setPreference('light');

    expect(store.preference()).toBe('light');
    expect(dataTheme()).toBe('light');
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('não mexe no tema ao apagar os dados locais', async () => {
    installFakeMatchMedia(true);
    localStorage.setItem(THEME_STORAGE_KEY, 'light');

    await wipeLocalData();

    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });
});
