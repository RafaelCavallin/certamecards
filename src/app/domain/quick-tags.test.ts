import { describe, expect, it } from 'vitest';
import { QUICK_TAGS_MAX, quickTags, toggleKey } from './quick-tags';
import type { TagSummary } from './tags';

function option(key: string, count: number): TagSummary {
  return { key, name: key.toUpperCase(), count };
}

const options = [option('a', 1), option('b', 9), option('c', 0), option('d', 4), option('e', 4), option('f', 2)];

describe('quickTags', () => {
  it('mostra as etiquetas com mais cartões hoje, na ordem da contagem', () => {
    const { chips, hasMore } = quickTags(options, []);

    expect(chips.map((chip) => chip.key)).toEqual(['b', 'd', 'e', 'f']);
    expect(chips).toHaveLength(QUICK_TAGS_MAX);
    expect(hasMore).toBe(true);
  });

  it('mantém visível a etiqueta escolhida fora do topo, sem mudar a ordem do topo', () => {
    const { chips } = quickTags(options, ['c', 'b']);

    expect(chips.map((chip) => chip.key)).toEqual(['b', 'd', 'e', 'f', 'c']);
  });

  it('não oferece "mais" quando todas as etiquetas já viraram atalho', () => {
    const { chips, hasMore } = quickTags([option('a', 2), option('b', 1)], []);

    expect(chips.map((chip) => chip.key)).toEqual(['a', 'b']);
    expect(hasMore).toBe(false);
  });

  it('sem cartões em nenhuma etiqueta, não há atalho e só resta a lista completa', () => {
    expect(quickTags([option('a', 0)], [])).toEqual({ chips: [], hasMore: true });
  });
});

describe('toggleKey', () => {
  it('liga a chave ausente e desliga a presente, preservando as outras', () => {
    expect(toggleKey(['a'], 'b')).toEqual(['a', 'b']);
    expect(toggleKey(['a', 'b'], 'a')).toEqual(['b']);
  });
});
