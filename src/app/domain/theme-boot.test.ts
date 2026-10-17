import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { hexToRgb } from '../../test/contrast';
import { themeTokens } from '../../test/theme-tokens';

const SCRIPT_PATTERN = /<script>([\s\S]*?)<\/script>/;
const THEME_COLOR_PATTERN = /<meta name="theme-color" content="(#[0-9A-Fa-f]{6})"/;
const LIGHT_COLOR_PATTERN = /setAttribute\('content', '(#[0-9A-Fa-f]{6})'\)/;

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

interface AngularConfig {
  projects: { certamecards: { architect: { build: { configurations: { production: { optimization: { styles: { inlineCritical: boolean } } } } } } } };
}

const indexHtml = readProjectFile('src/index.html');

interface BootResult {
  dataTheme: string | null;
  themeColor: string | null;
}

interface BootInput {
  stored: string | null | 'throw';
  systemDark: boolean;
}

function runBootScript(input: BootInput): BootResult {
  const result: BootResult = { dataTheme: null, themeColor: null };
  const storage = {
    getItem: (): string | null => {
      if (input.stored === 'throw') throw new DOMException('blocked', 'SecurityError');
      return input.stored;
    },
  };
  const fakeDocument = {
    documentElement: { setAttribute: (_name: string, value: string) => (result.dataTheme = value) },
    querySelector: () => ({ setAttribute: (_name: string, value: string) => (result.themeColor = value) }),
  };
  const matchMedia = () => ({ matches: input.systemDark });
  const source = SCRIPT_PATTERN.exec(indexHtml)?.[1] ?? '';
  new Function('localStorage', 'matchMedia', 'document', source)(storage, matchMedia, fakeDocument);
  return result;
}

describe('script de primeira pintura do index.html', () => {
  it.each<[string, BootInput, string | null]>([
    ['escuro fixo', { stored: 'dark', systemDark: false }, null],
    ['claro fixo com sistema escuro', { stored: 'light', systemDark: true }, 'light'],
    ['sistema com sistema escuro', { stored: 'system', systemDark: true }, null],
    ['sistema com sistema claro', { stored: 'system', systemDark: false }, 'light'],
    ['sem escolha', { stored: null, systemDark: false }, null],
    ['valor inválido', { stored: 'sepia', systemDark: false }, null],
    ['armazenamento que lança', { stored: 'throw', systemDark: false }, null],
  ])('%s', (_name, input, expectedTheme) => {
    const result = runBootScript(input);

    expect(result.dataTheme).toBe(expectedTheme);
    expect(result.themeColor !== null).toBe(expectedTheme === 'light');
  });

  it('a cor da barra do claro é o ink do tema claro', () => {
    const lightColor = LIGHT_COLOR_PATTERN.exec(indexHtml)?.[1] ?? '';

    expect({ ...hexToRgb(lightColor), a: 1 }).toEqual(themeTokens('light').ink);
  });

  it('a cor da barra padrão é o ink do tema escuro', () => {
    const darkColor = THEME_COLOR_PATTERN.exec(indexHtml)?.[1] ?? '';

    expect({ ...hexToRgb(darkColor), a: 1 }).toEqual(themeTokens('dark').ink);
  });

  it('o script roda antes dos estilos e não escreve no console', () => {
    expect(indexHtml.indexOf('<script>')).toBeLessThan(indexHtml.indexOf('</head>'));
    expect(SCRIPT_PATTERN.exec(indexHtml)?.[1]).not.toContain('console');
  });
});

describe('angular.json', () => {
  it('o build de produção não embute CSS crítico', () => {
    const config = JSON.parse(readProjectFile('angular.json')) as AngularConfig;
    const production = config.projects.certamecards.architect.build.configurations.production;

    expect(production.optimization.styles.inlineCritical).toBe(false);
  });
});
