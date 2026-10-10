export type BackupErrorCode =
  | 'not-backup'
  | 'newer-version'
  | 'empty'
  | 'storage-full'
  | 'delivery-failed'
  | 'nothing-to-save';

export const NOTHING_TO_SAVE_HINT = 'Não há nada para salvar ainda.';

const MESSAGES: Record<BackupErrorCode, string> = {
  'not-backup': 'Este arquivo não é um backup do CertameCards.',
  'newer-version': 'Este backup foi feito por uma versão mais nova do app. Atualize o app e tente de novo.',
  empty: 'O arquivo não contém dados para restaurar.',
  'storage-full': 'Não há espaço suficiente no aparelho para restaurar este backup. Nada foi alterado.',
  'delivery-failed': 'Não foi possível salvar o arquivo de backup.',
  'nothing-to-save': NOTHING_TO_SAVE_HINT,
};

export const GENERIC_RESTORE_FAILURE = 'Não foi possível restaurar o backup. Nada foi alterado.';
export const GENERIC_EXPORT_FAILURE = 'Não foi possível gerar o backup.';
export const GENERIC_READ_FAILURE = 'Não foi possível ler o arquivo.';
export const SAFETY_BACKUP_FAILURE = 'Não foi possível salvar o backup do estado atual, então nada foi substituído.';

export class BackupError extends Error {
  constructor(
    readonly code: BackupErrorCode,
    options?: { cause?: unknown },
  ) {
    super(MESSAGES[code], options);
    this.name = 'BackupError';
  }
}

export function backupErrorMessage(code: BackupErrorCode): string {
  return MESSAGES[code];
}

export function isBackupError(error: unknown, code?: BackupErrorCode): error is BackupError {
  return error instanceof BackupError && (code === undefined || error.code === code);
}

export function backupFailureMessage(error: unknown, fallback: string): string {
  return isBackupError(error) ? error.message : fallback;
}

export function warnBackup(phase: string, error: unknown): void {
  console.warn('[backup]', { phase, code: isBackupError(error) ? error.code : 'unexpected' });
}
