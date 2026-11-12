import { describe, expect, it } from 'vitest';
import { APP_TITLE, pageTitle } from './page-title';

describe('pageTitle', () => {
  it('usa o título da rota quando ele existe', () => {
    expect(pageTitle('Difíceis')).toBe('Difíceis');
  });

  it('volta ao título do app quando a rota não tem título', () => {
    expect(pageTitle(undefined)).toBe(APP_TITLE);
  });

  it('volta ao título do app quando o título da rota é vazio ou só espaços', () => {
    expect(pageTitle('')).toBe(APP_TITLE);
    expect(pageTitle('   ')).toBe(APP_TITLE);
  });
});
