import { describe, expect, it } from 'vitest';
import { makeCardImage } from '../../test/image-fixtures';
import { parseCardImageRow, toCardImageRow } from './sync-rows-image';

function remoteRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return { ...toCardImageRow(makeCardImage('i1', { caption: 'Mapa', updatedAt: 7 })), synced_at: '2026-01-01T00:00:10Z', ...overrides };
}

describe('parseCardImageRow', () => {
  it('converte a linha remota em imagem limpa, ainda sem arquivo no aparelho', () => {
    const parsed = parseCardImageRow(remoteRow());

    expect(parsed).toEqual({
      row: {
        id: 'i1', cardId: 'card-1', position: 0, caption: 'Mapa', mimeType: 'image/webp', width: 800, height: 600,
        byteSize: 1000, blobState: 'remote', createdAt: 1, updatedAt: 7, deletedAt: 0, dirty: 0,
      },
      syncedAt: '2026-01-01T00:00:10Z',
    });
  });

  it('trata legenda ausente como texto vazio', () => {
    expect(parseCardImageRow(remoteRow({ caption: null }))?.row.caption).toBe('');
  });

  it('descarta formato que o app não gera e linhas incompletas', () => {
    expect(parseCardImageRow(remoteRow({ mime_type: 'image/gif' }))).toBeNull();
    expect(parseCardImageRow(remoteRow({ card_id: undefined }))).toBeNull();
    expect(parseCardImageRow(null)).toBeNull();
  });
});

describe('toCardImageRow', () => {
  it('envia só as colunas da tabela, sem estado local nem dirty', () => {
    const row = toCardImageRow(makeCardImage('i1', { blobState: 'uploaded' }));

    expect(Object.keys(row).sort()).toEqual([
      'byte_size', 'caption', 'card_id', 'created_at', 'deleted_at', 'height', 'id', 'mime_type', 'position', 'updated_at', 'width',
    ]);
  });

  it('faz a ida e volta preservando os campos', () => {
    const original = makeCardImage('i1', { caption: 'Mapa', position: 3, deletedAt: 9, updatedAt: 9 });

    const back = parseCardImageRow({ ...toCardImageRow(original), synced_at: 's' })?.row;

    expect(back).toEqual({ ...original, blobState: 'remote', dirty: 0 });
  });
});
