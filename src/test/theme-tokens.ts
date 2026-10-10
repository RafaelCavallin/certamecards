import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { hexToRgb, type Rgba } from './contrast';

export type ThemeName = 'dark' | 'light';

const DARK_BLOCK = /^:root\s*\{([^}]*)\}/m;
const LIGHT_BLOCK = /:root\[data-theme='light'\]\s*\{([^}]*)\}/;
const DECLARATION = /(--[\w-]+)\s*:\s*([^;]+);/g;
const VAR_REFERENCE = /^var\((--[\w-]+)\)$/;
const COLOR_MIX = /^color-mix\(in oklab,\s*(.+?)\s+(\d+)%,\s*transparent\)$/;

function readSource(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

function declarationsIn(block: string): Map<string, string> {
  return new Map([...block.matchAll(DECLARATION)].map((match) => [match[1], match[2].trim()]));
}

function themeDeclarations(theme: ThemeName): Map<string, string> {
  const dark = declarationsIn(DARK_BLOCK.exec(readSource('src/styles/tokens.css'))?.[1] ?? '');
  if (theme === 'dark') return dark;
  const light = declarationsIn(LIGHT_BLOCK.exec(readSource('src/styles/theme-light.css'))?.[1] ?? '');
  return new Map([...dark, ...light]);
}

function resolveValue(value: string, declarations: Map<string, string>): Rgba {
  const reference = VAR_REFERENCE.exec(value);
  if (reference) return resolveValue(declarations.get(reference[1]) ?? '', declarations);
  const mix = COLOR_MIX.exec(value);
  if (mix) return { ...resolveValue(mix[1], declarations), a: Number(mix[2]) / 100 };
  return { ...hexToRgb(value), a: 1 };
}

export function themeTokens(theme: ThemeName): Record<string, Rgba> {
  const declarations = themeDeclarations(theme);
  const entries = [...declarations.keys()]
    .filter((name) => !name.startsWith('--size-'))
    .map((name) => [name.slice(2), resolveValue(declarations.get(name) ?? '', declarations)] as const);
  return Object.fromEntries(entries);
}
