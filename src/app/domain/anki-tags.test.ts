import { describe, expect, it } from 'vitest';
import { catalogByKey, importTags } from './anki-tags';

const EMPTY = new Map<string, string>();

describe('importTags', () => {
  it('separa as etiquetas do Anki por espaço', () => {
    expect(importTags(' cespe constitucional ', EMPTY)).toEqual({ tags: ['cespe', 'constitucional'], dropped: 0 });
  });

  it('adota a grafia do catálogo, troca _ por espaço e descarta leech', () => {
    const catalog = catalogByKey([{ key: 'cespe', name: 'CESPE' }]);

    const result = importTags('cespe Direito_Constitucional leech', catalog);

    expect(result).toEqual({ tags: ['CESPE', 'Direito Constitucional'], dropped: 1 });
  });

  it('mantém a hierarquia do Anki literal', () => {
    expect(importTags('Concurso::CESPE', EMPTY).tags).toEqual(['Concurso::CESPE']);
  });

  it('descarta etiqueta com mais de 40 caracteres', () => {
    const long = 'a'.repeat(41);

    expect(importTags(`${long} ok`, EMPTY)).toEqual({ tags: ['ok'], dropped: 1 });
  });

  it('fica com as 20 primeiras e conta as demais como descartadas', () => {
    const raw = Array.from({ length: 22 }, (_, index) => `t${index}`).join(' ');

    const result = importTags(raw, EMPTY);

    expect(result.tags).toHaveLength(20);
    expect(result.dropped).toBe(2);
  });

  it('junta etiquetas equivalentes da mesma nota sem contar como descarte', () => {
    expect(importTags('cespe Cespe marked CÉSPE', EMPTY)).toEqual({ tags: ['cespe'], dropped: 1 });
  });

  it('devolve vazio para nota sem etiqueta', () => {
    expect(importTags('   ', EMPTY)).toEqual({ tags: [], dropped: 0 });
  });
});
