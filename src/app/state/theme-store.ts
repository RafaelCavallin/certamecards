import { Service, computed, signal } from '@angular/core';
import {
  DARK_SCHEME_QUERY,
  browserStorage,
  readThemePreference,
  resolveTheme,
  writeThemePreference,
  type ResolvedTheme,
  type ThemePreference,
} from '../domain/theme';

const THEME_COLOR_SELECTOR = 'meta[name=theme-color]';
const INK_VARIABLE = '--ink';

function applyTheme(theme: ResolvedTheme): void {
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  const ink = getComputedStyle(root).getPropertyValue(INK_VARIABLE).trim();
  if (!ink) return;
  document.querySelector(THEME_COLOR_SELECTOR)?.setAttribute('content', ink);
}

function watchSystemScheme(onChange: (prefersDark: boolean) => void): boolean {
  if (typeof matchMedia !== 'function') return true;
  const list = matchMedia(DARK_SCHEME_QUERY);
  list.addEventListener('change', (event) => onChange(event.matches));
  return list.matches;
}

@Service()
export class ThemeStore {
  private readonly storage = browserStorage();
  private readonly preferenceSignal = signal<ThemePreference>(readThemePreference(this.storage));
  private readonly systemDark = signal(watchSystemScheme((prefersDark) => this.onSystemChange(prefersDark)));

  readonly preference = this.preferenceSignal.asReadonly();
  readonly resolved = computed<ResolvedTheme>(() => resolveTheme(this.preferenceSignal(), this.systemDark()));

  constructor() {
    applyTheme(this.resolved());
  }

  setPreference(preference: ThemePreference): void {
    this.preferenceSignal.set(preference);
    writeThemePreference(this.storage, preference);
    applyTheme(this.resolved());
  }

  private onSystemChange(prefersDark: boolean): void {
    this.systemDark.set(prefersDark);
    applyTheme(this.resolved());
  }
}
