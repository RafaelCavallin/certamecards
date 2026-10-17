import { describe, expect, it } from 'vitest';
import { confirmationFor, countsLabels, estimateLabel, lastBackupLabel, missingImagesLabel } from './backup-labels';
import { BACKUP_DAY, BACKUP_NOW } from '../../test/backup-fixtures';

describe('confirmationFor', () => {
  it('não pede confirmação ao mesclar na mesma conta', () => {
    expect(confirmationFor({ plan: 'merge', accountMismatch: false })).toBeNull();
  });

  it('avisa da exclusão ao substituir', () => {
    const confirmation = confirmationFor({ plan: 'replace', accountMismatch: false });

    expect(confirmation?.action).toBe('Sim, substituir tudo');
    expect(confirmation?.warnings).toHaveLength(1);
    expect(confirmation?.warnings[0]).toContain('serão excluídos');
  });

  it('avisa de outra conta ao mesclar', () => {
    const confirmation = confirmationFor({ plan: 'merge', accountMismatch: true });

    expect(confirmation?.action).toBe('Sim, restaurar mesmo assim');
    expect(confirmation?.warnings[0]).toContain('outra conta');
  });

  it('junta os dois avisos ao substituir com outra conta', () => {
    const confirmation = confirmationFor({ plan: 'replace', accountMismatch: true });

    expect(confirmation?.warnings).toHaveLength(2);
    expect(confirmation?.action).toBe('Sim, substituir tudo');
  });
});

describe('rótulos do backup', () => {
  it('descreve o último backup', () => {
    expect(lastBackupLabel(null, BACKUP_NOW)).toBe('Nenhum backup feito neste aparelho');
    expect(lastBackupLabel(BACKUP_NOW - 1000, BACKUP_NOW)).toBe('Último backup: hoje');
    expect(lastBackupLabel(BACKUP_NOW - BACKUP_DAY, BACKUP_NOW)).toBe('Último backup: há 1 dia');
    expect(lastBackupLabel(BACKUP_NOW - 12 * BACKUP_DAY, BACKUP_NOW)).toBe('Último backup: há 12 dias');
  });

  it('flexiona o aviso de imagens ausentes', () => {
    expect(missingImagesLabel(1)).toBe('1 imagem não estava neste aparelho e ficou de fora do backup');
    expect(missingImagesLabel(3)).toBe('3 imagens não estavam neste aparelho e ficaram de fora do backup');
  });

  it('formata o tamanho estimado em português', () => {
    expect(estimateLabel(13_002_342)).toBe('arquivo estimado: 12,4 MB');
    expect(estimateLabel(2048)).toBe('arquivo estimado: 2 KB');
  });

  it('flexiona e formata as contagens', () => {
    const labels = countsLabels({ decks: 1, cards: 1230, reviewLogs: 300, images: 0 });

    expect(labels).toEqual(['1 baralho', '1.230 cartões', '300 revisões', '0 imagens']);
  });
});
