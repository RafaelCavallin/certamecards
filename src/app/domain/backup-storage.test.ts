import { describe, expect, it } from 'vitest';
import { parseLastBackupAt } from './backup-storage';

describe('parseLastBackupAt', () => {
  it('lê um instante válido', () => {
    expect(parseLastBackupAt('1790971200000')).toBe(1790971200000);
  });

  it('ignora ausente, lixo, zero e negativo', () => {
    expect(parseLastBackupAt(null)).toBeNull();
    expect(parseLastBackupAt('ontem')).toBeNull();
    expect(parseLastBackupAt('0')).toBeNull();
    expect(parseLastBackupAt('-5')).toBeNull();
  });
});
