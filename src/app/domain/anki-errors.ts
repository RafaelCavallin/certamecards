export type AnkiErrorCode = 'not-anki' | 'no-notes' | 'reader-unavailable' | 'cancelled';

const MESSAGES: Record<AnkiErrorCode, string> = {
  'not-anki': 'Este arquivo não parece ser um baralho do Anki.',
  'no-notes': 'Nenhuma nota encontrada no arquivo.',
  'reader-unavailable':
    'Para importar pela primeira vez, conecte-se à internet. Depois disso, a importação funciona sem rede.',
  cancelled: 'Importação cancelada.',
};

export const GENERIC_IMPORT_FAILURE = 'Não foi possível importar os cartões. Nada foi gravado.';

export class AnkiImportError extends Error {
  constructor(
    readonly code: AnkiErrorCode,
    options?: { cause?: unknown },
  ) {
    super(MESSAGES[code], options);
    this.name = 'AnkiImportError';
  }
}

export function ankiErrorMessage(code: AnkiErrorCode): string {
  return MESSAGES[code];
}

export function isAnkiError(error: unknown, code?: AnkiErrorCode): error is AnkiImportError {
  return error instanceof AnkiImportError && (code === undefined || error.code === code);
}
