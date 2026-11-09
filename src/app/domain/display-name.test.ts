import { describe, expect, it } from 'vitest';
import { DISPLAY_NAME_MAX_LENGTH, displayNameOf, isValidDisplayName, normalizeDisplayName } from './display-name';

describe('normalizeDisplayName', () => {
  it('tira espaços das pontas e junta os repetidos', () => {
    expect(normalizeDisplayName('  Maria   Silva \n')).toBe('Maria Silva');
  });

  it('corta no tamanho máximo sem deixar espaço no fim', () => {
    const long = 'a'.repeat(DISPLAY_NAME_MAX_LENGTH - 1) + ' ' + 'b'.repeat(10);

    const name = normalizeDisplayName(long);

    expect(name).toBe('a'.repeat(DISPLAY_NAME_MAX_LENGTH - 1));
    expect(normalizeDisplayName('x'.repeat(100))).toHaveLength(DISPLAY_NAME_MAX_LENGTH);
  });
});

describe('isValidDisplayName', () => {
  it('aceita nome com letras e recusa vazio ou só espaços', () => {
    expect(isValidDisplayName('Ana')).toBe(true);
    expect(isValidDisplayName('')).toBe(false);
    expect(isValidDisplayName('   ')).toBe(false);
  });
});

describe('displayNameOf', () => {
  it('lê o display_name normalizado', () => {
    expect(displayNameOf({ display_name: ' Maria  Silva ' })).toBe('Maria Silva');
  });

  it('devolve null sem metadata, sem a chave, vazio ou com tipo errado', () => {
    expect(displayNameOf(undefined)).toBeNull();
    expect(displayNameOf({})).toBeNull();
    expect(displayNameOf({ display_name: '  ' })).toBeNull();
    expect(displayNameOf({ display_name: 42 })).toBeNull();
  });
});
