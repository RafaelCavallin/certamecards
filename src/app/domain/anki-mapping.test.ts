import { describe, expect, it } from 'vitest';
import { classifyNotetype, suggestMapping } from './anki-mapping';
import type { AnkiNotetype, NotetypeKind } from './anki-types';

function notetype(fields: string[], kind: NotetypeKind = 'normal'): AnkiNotetype {
  return { id: '1', name: 'Tipo', fields, kind };
}

describe('classifyNotetype', () => {
  it('classifica básico, lacuna e oclusão de imagem', () => {
    expect(classifyNotetype(notetype(['Frente', 'Verso']))).toBe('basic');
    expect(classifyNotetype(notetype(['Texto', 'Extra'], 'cloze'))).toBe('cloze');
    expect(classifyNotetype(notetype(['Occlusion', 'Image'], 'image-occlusion'))).toBe('unsupported');
  });

  it('não suporta tipo sem campos', () => {
    expect(classifyNotetype(notetype([]))).toBe('unsupported');
  });
});

describe('suggestMapping', () => {
  it('mapeia o Básico por nome, sem Notas', () => {
    expect(suggestMapping(notetype(['Frente', 'Verso']))).toEqual({ include: true, front: 0, back: 1, notes: null });
  });

  it('reconhece nomes de um tipo próprio de questão', () => {
    const mapping = suggestMapping(notetype(['Enunciado', 'Gabarito', 'Comentário']));

    expect(mapping).toEqual({ include: true, front: 0, back: 1, notes: 2 });
  });

  it('deixa o nome vencer a posição', () => {
    const mapping = suggestMapping(notetype(['Back', 'Front']));

    expect(mapping).toMatchObject({ front: 1, back: 0 });
  });

  it('cai na posição quando nenhum nome é reconhecido', () => {
    expect(suggestMapping(notetype(['A', 'B', 'C']))).toEqual({ include: true, front: 0, back: 1, notes: 2 });
  });

  it('não reaproveita para as Notas um campo já usado', () => {
    const mapping = suggestMapping(notetype(['Front', 'Back', 'Back Extra']));

    expect(mapping).toEqual({ include: true, front: 0, back: 1, notes: 2 });
  });

  it('mapeia lacuna com texto na Frente, sem Verso e Extra nas Notas', () => {
    const mapping = suggestMapping(notetype(['Texto', 'Verso Extra'], 'cloze'));

    expect(mapping).toEqual({ include: true, front: 0, back: null, notes: 1 });
  });

  it('deixa a lacuna de um campo só sem Notas', () => {
    expect(suggestMapping(notetype(['Text'], 'cloze'))).toEqual({ include: true, front: 0, back: null, notes: null });
  });

  it('desmarca a oclusão de imagem', () => {
    const mapping = suggestMapping(notetype(['Occlusion', 'Image'], 'image-occlusion'));

    expect(mapping.include).toBe(false);
  });

  it('usa o único campo de um tipo básico para Frente e Verso', () => {
    expect(suggestMapping(notetype(['Só'])).back).toBe(0);
  });
});
