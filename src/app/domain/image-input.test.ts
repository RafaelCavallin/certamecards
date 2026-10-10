import { describe, expect, it } from 'vitest';
import { filesFromList, pastedImages } from './image-input';

const png = new File(['x'], 'print.png', { type: 'image/png' });
const pdf = new File(['x'], 'doc.pdf', { type: 'application/pdf' });

describe('pastedImages', () => {
  it('devolve as imagens coladas sem texto', () => {
    expect(pastedImages({ types: ['Files'], files: [png] })).toEqual([png]);
  });

  it('ignora a imagem quando a área de transferência traz texto junto', () => {
    expect(pastedImages({ types: ['text/plain', 'Files'], files: [png] })).toEqual([]);
  });

  it('ignora arquivos que não são imagem', () => {
    expect(pastedImages({ types: ['Files'], files: [pdf, png] })).toEqual([png]);
  });

  it('devolve lista vazia quando só há texto', () => {
    expect(pastedImages({ types: ['text/plain'], files: [] })).toEqual([]);
  });
});

describe('filesFromList', () => {
  it('converte a lista de arquivos em array e aceita nulo', () => {
    const list = { 0: png, 1: pdf, length: 2, item: () => null } as unknown as FileList;

    expect(filesFromList(list)).toEqual([png, pdf]);
    expect(filesFromList(null)).toEqual([]);
    expect(filesFromList(undefined)).toEqual([]);
  });
});
