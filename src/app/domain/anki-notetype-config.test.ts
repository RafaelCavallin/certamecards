import { describe, expect, it } from 'vitest';
import { readNotetypeConfig } from './anki-notetype-config';

const CSS = Array.from(new TextEncoder().encode('.card { font-family: arial; color: black; }'));

describe('readNotetypeConfig', () => {
  it('lê kind = 1 de um tipo de lacuna', () => {
    const config = new Uint8Array([0x08, 0x01, 0x1a, CSS.length, ...CSS, 0x48, 0x05]);

    expect(readNotetypeConfig(config)).toEqual({ kind: 1, originalStockKind: 5 });
  });

  it('assume kind = 0 quando o campo 1 não aparece (tipo básico)', () => {
    const config = new Uint8Array([0x1a, CSS.length, ...CSS, 0x42, 0x05, 0x10, 0x01, 0x1a, 0x01, 0x00, 0x48, 0x01]);

    expect(readNotetypeConfig(config)).toEqual({ kind: 0, originalStockKind: 1 });
  });

  it('reconhece a oclusão de imagem pelo campo 9', () => {
    const config = new Uint8Array([0x08, 0x01, 0x1a, 0x01, 0x2e, 0x48, 0x06]);

    expect(readNotetypeConfig(config).originalStockKind).toBe(6);
  });

  it('pula campos longos com comprimento em varint de dois bytes sem desalinhar', () => {
    const long = new Array<number>(200).fill(0x41);
    const config = new Uint8Array([0x1a, 0xc8, 0x01, ...long, 0x08, 0x01]);

    expect(readNotetypeConfig(config).kind).toBe(1);
  });

  it('pula campos de 32 e 64 bits', () => {
    const config = new Uint8Array([0x15, 1, 2, 3, 4, 0x19, 1, 2, 3, 4, 5, 6, 7, 8, 0x48, 0x06]);

    expect(readNotetypeConfig(config).originalStockKind).toBe(6);
  });

  it('não lança com config vazio ou truncado', () => {
    expect(readNotetypeConfig(new Uint8Array([0x08]))).toEqual({ kind: 0, originalStockKind: 0 });
  });
});
