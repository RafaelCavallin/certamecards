export const LAST_BACKUP_KEY = 'certamecards.lastBackupAt';

export function parseLastBackupAt(raw: string | null): number | null {
  if (raw === null) return null;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : null;
}
