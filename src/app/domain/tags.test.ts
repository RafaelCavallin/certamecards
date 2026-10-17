import { describe, it, expect } from 'vitest';
import { addTagInput, normalizeTag, normalizeTags, splitTagInput, tagRejectionMessage, tagKey, type TagSummary } from './tags';

const CESPE: TagSummary = { key: 'cespe', name: 'CESPE', count: 3 };

function chips(count: number): string[] {
  return Array.from({ length: count }, (_, index) => `t${index}`);
}

describe('normalizeTag e splitTagInput', () => {
  it('apara as pontas e colapsa espaços internos', () => {
    expect(normalizeTag('  Art.   37 ')).toBe('Art. 37');
  });

  it('quebra por vírgula e quebra de linha ignorando vazias', () => {
    expect(splitTagInput(' CESPE ,  Art.   37 , , pegadinha')).toEqual(['CESPE', 'Art. 37', 'pegadinha']);
    expect(splitTagInput('a\nb\r\n,c')).toEqual(['a', 'b', 'c']);
  });
});

describe('tagKey', () => {
  it('ignora caixa, acento e espaços repetidos', () => {
    expect(tagKey(' Pegadinha ')).toBe(tagKey('pegadinha'));
    expect(tagKey('Ação  Civil')).toBe('acao civil');
  });
});

describe('addTagInput', () => {
  it('usa a grafia do catálogo quando só caixa ou acento diferem', () => {
    const result = addTagInput({ raw: 'cespe', current: [], catalog: [CESPE] });

    expect(result).toEqual({ kind: 'added', tags: ['CESPE'], rejected: [] });
  });

  it('ignora em silêncio a equivalente já presente', () => {
    const result = addTagInput({ raw: 'Pegadinha', current: ['pegadinha'], catalog: [] });

    expect(result).toEqual({ kind: 'unchanged', tags: ['pegadinha'], rejected: [] });
  });

  it('ignora equivalentes repetidas na mesma colagem', () => {
    const result = addTagInput({ raw: 'a, A, b', current: [], catalog: [] });

    expect(result.tags).toEqual(['a', 'b']);
  });

  it('rejeita a 21ª etiqueta com limit', () => {
    const result = addTagInput({ raw: 'nova', current: chips(20), catalog: [] });

    expect(result.tags).toHaveLength(20);
    expect(result.rejected).toEqual([{ tag: 'nova', reason: 'limit' }]);
  });

  it('rejeita 41 caracteres e aceita 40', () => {
    const accepted = addTagInput({ raw: 'x'.repeat(40), current: [], catalog: [] });
    const rejected = addTagInput({ raw: 'x'.repeat(41), current: [], catalog: [] });

    expect(accepted.tags).toEqual(['x'.repeat(40)]);
    expect(rejected.rejected).toEqual([{ tag: 'x'.repeat(41), reason: 'too-long' }]);
  });

  it('colar 3 com 19 etiquetas adiciona 1 e rejeita 2', () => {
    const result = addTagInput({ raw: 'a, b, c', current: chips(19), catalog: [] });

    expect(result.tags).toHaveLength(20);
    expect(result.rejected).toEqual([
      { tag: 'b', reason: 'limit' },
      { tag: 'c', reason: 'limit' },
    ]);
  });

  it('ignora entrada vazia', () => {
    expect(addTagInput({ raw: ' , ', current: ['a'], catalog: [] }).kind).toBe('unchanged');
  });
});

describe('normalizeTags', () => {
  it('mantém a primeira grafia e descarta vazias e acima de 40', () => {
    expect(normalizeTags(['CESPE', 'cespe', ' ', 'x'.repeat(41)])).toEqual(['CESPE']);
  });

  it('corta em 20 etiquetas', () => {
    expect(normalizeTags(chips(25))).toEqual(chips(20));
  });

  it('é idempotente', () => {
    const once = normalizeTags([' a  b ', 'A B', 'Ç', 'ç']);

    expect(normalizeTags(once)).toEqual(once);
    expect(once).toEqual(['a b', 'Ç']);
  });
});

describe('tagRejectionMessage', () => {
  it('explica cada motivo de rejeição', () => {
    expect(tagRejectionMessage('too-long')).toBe('Etiquetas têm até 40 caracteres.');
    expect(tagRejectionMessage('limit')).toBe('Limite de 20 etiquetas');
  });
});
