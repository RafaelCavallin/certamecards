import { describe, expect, it } from 'vitest';
import { GENERIC_AUTH_FAILURE, NETWORK_FAILURE, authErrorMessage } from './auth-errors';

describe('authErrorMessage', () => {
  it('traduz credenciais inválidas pelo código, não pelo texto em inglês', () => {
    const error = { code: 'invalid_credentials', name: 'AuthApiError' };

    expect(authErrorMessage(error)).toBe('E-mail ou senha incorretos.');
  });

  it('usa a mesma mensagem para os dois códigos de conta existente', () => {
    expect(authErrorMessage({ code: 'user_already_exists' })).toBe(authErrorMessage({ code: 'email_exists' }));
  });

  it('avisa da falta de conexão quando a requisição nem chega ao servidor', () => {
    expect(authErrorMessage({ name: 'AuthRetryableFetchError' })).toBe(NETWORK_FAILURE);
  });

  it('cai no texto genérico para código desconhecido ou ausente', () => {
    expect(authErrorMessage({ code: 'saml_idp_not_found' })).toBe(GENERIC_AUTH_FAILURE);
    expect(authErrorMessage({})).toBe(GENERIC_AUTH_FAILURE);
  });
});
