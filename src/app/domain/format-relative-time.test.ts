import { describe, expect, it } from 'vitest';
import { formatRelativeSync } from './format-relative-time';

const NOW = Date.parse('2026-01-01T12:00:00Z');

describe('formatRelativeSync', () => {
  it('mostra "agora mesmo" para menos de um minuto', () => {
    expect(formatRelativeSync(NOW - 30_000, NOW)).toBe('Sincronizado agora mesmo.');
  });

  it('mostra minutos entre um minuto e uma hora', () => {
    expect(formatRelativeSync(NOW - 2 * 60_000, NOW)).toBe('Sincronizado há 2 min.');
  });

  it('mostra horas entre uma hora e um dia', () => {
    expect(formatRelativeSync(NOW - 3 * 3_600_000, NOW)).toBe('Sincronizado há 3 h.');
  });

  it('mostra dias a partir de 24 horas', () => {
    expect(formatRelativeSync(NOW - 2 * 86_400_000, NOW)).toBe('Sincronizado há 2 d.');
  });
});
