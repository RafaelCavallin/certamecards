import { describe, expect, it, vi } from 'vitest';
import { BackupError, backupErrorMessage, backupFailureMessage, isBackupError, warnBackup } from './backup-errors';

describe('BackupError', () => {
  it('carrega o código e a mensagem em português', () => {
    const error = new BackupError('newer-version');

    expect(error.code).toBe('newer-version');
    expect(error.message).toBe(backupErrorMessage('newer-version'));
  });

  it('isBackupError reconhece o erro e filtra pelo código', () => {
    const error = new BackupError('empty');

    expect(isBackupError(error)).toBe(true);
    expect(isBackupError(error, 'empty')).toBe(true);
    expect(isBackupError(error, 'not-backup')).toBe(false);
    expect(isBackupError(new Error('x'))).toBe(false);
  });

  it('mostra a mensagem do erro esperado e o texto padrão para os demais', () => {
    expect(backupFailureMessage(new BackupError('empty'), 'padrão')).toBe(backupErrorMessage('empty'));
    expect(backupFailureMessage(new Error('x'), 'padrão')).toBe('padrão');
  });

  it('registra só a fase e o código, sem conteúdo do usuário', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    warnBackup('restore', new BackupError('storage-full'));
    warnBackup('export', new Error('texto do cartão'));

    expect(warn.mock.calls).toEqual([['[backup]', { phase: 'restore', code: 'storage-full' }], ['[backup]', { phase: 'export', code: 'unexpected' }]]);
    warn.mockRestore();
  });
});
