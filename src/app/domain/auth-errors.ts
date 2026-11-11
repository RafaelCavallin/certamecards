export interface AuthErrorLike {
  code?: string;
  name?: string;
}

const NETWORK_ERROR_NAME = 'AuthRetryableFetchError';
const ACCOUNT_EXISTS = 'Já existe uma conta com este e-mail. Entre com a sua senha.';
const TOO_MANY_ATTEMPTS = 'Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo.';

export const NETWORK_FAILURE = 'Não foi possível falar com o servidor. Confira a internet e tente de novo.';
export const GENERIC_AUTH_FAILURE = 'Não foi possível concluir agora. Tente de novo.';

const MESSAGES: Record<string, string> = {
  invalid_credentials: 'E-mail ou senha incorretos.',
  email_not_confirmed: 'Confirme o seu e-mail antes de entrar.',
  user_already_exists: ACCOUNT_EXISTS,
  email_exists: ACCOUNT_EXISTS,
  weak_password: 'Senha fraca demais. Use uma senha mais longa, com letras e números.',
  email_address_invalid: 'Este e-mail não é válido.',
  validation_failed: 'Confira o e-mail e a senha informados.',
  signup_disabled: 'Novos cadastros estão desativados no momento.',
  user_banned: 'Esta conta está bloqueada.',
  over_request_rate_limit: TOO_MANY_ATTEMPTS,
  over_email_send_rate_limit: TOO_MANY_ATTEMPTS,
  request_timeout: NETWORK_FAILURE,
};

export function authErrorMessage(error: AuthErrorLike): string {
  if (error.name === NETWORK_ERROR_NAME) return NETWORK_FAILURE;
  return (error.code && MESSAGES[error.code]) || GENERIC_AUTH_FAILURE;
}
