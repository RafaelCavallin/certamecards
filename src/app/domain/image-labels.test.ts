import { describe, expect, it } from 'vitest';
import {
  formatMegabytes,
  galleryCountLabel,
  imageAlt,
  imageUsageLabel,
  pendingUploadsLabel,
  skippedFilesMessage,
  waitingImagesLabel,
} from './image-labels';

describe('textos da galeria', () => {
  it('conta as imagens do cartão', () => {
    expect([galleryCountLabel(2), galleryCountLabel(6)]).toEqual(['2 de 6 imagens', '6 de 6 imagens']);
  });

  it('avisa quantas imagens estão sendo preparadas, no singular e no plural', () => {
    expect([waitingImagesLabel(1), waitingImagesLabel(2)]).toEqual(['Aguardando 1 imagem', 'Aguardando 2 imagens']);
  });

  it('explica quantos arquivos ficaram de fora', () => {
    expect(skippedFilesMessage({ accepted: 2, skipped: 3 })).toBe('Só cabiam mais 2 imagens; 3 ficaram de fora.');
    expect(skippedFilesMessage({ accepted: 1, skipped: 1 })).toBe('Só cabia mais 1 imagem; 1 ficou de fora.');
    expect(skippedFilesMessage({ accepted: 0, skipped: 2 })).toBe('O limite é de 6 imagens por cartão.');
  });

  it('usa a legenda como texto alternativo e, sem ela, a posição', () => {
    expect(imageAlt({ caption: ' Mapa: atos ', index: 1, total: 4 })).toBe('Mapa: atos');
    expect(imageAlt({ caption: '', index: 1, total: 4 })).toBe('Imagem 2 de 4 do cartão');
  });
});

describe('textos de Ajustes', () => {
  it('formata megabytes em pt-BR e kilobytes abaixo de 1 MB', () => {
    expect([formatMegabytes(12_897_484), formatMegabytes(512_000), formatMegabytes(10)]).toEqual(['12,3 MB', '500 KB', '1 KB']);
  });

  it('mostra o uso, com o limite do plano só com conta', () => {
    const usage = { count: 34, bytes: 12_897_484 };

    expect(imageUsageLabel({ ...usage, withAccount: false })).toBe('34 imagens · 12,3 MB');
    expect(imageUsageLabel({ ...usage, withAccount: true })).toBe('34 imagens · 12,3 MB de 1 GB');
    expect(imageUsageLabel({ count: 1, bytes: 2_097_152, withAccount: false })).toBe('1 imagem · 2,0 MB');
    expect(imageUsageLabel({ count: 0, bytes: 0, withAccount: true })).toBe('Nenhuma imagem');
  });

  it('avisa quantas imagens aguardam envio', () => {
    expect([pendingUploadsLabel(1), pendingUploadsLabel(3)]).toEqual(['1 imagem aguardando envio', '3 imagens aguardando envio']);
  });
});
