export const FRONT_MAX = 5000;
export const BACK_MAX = 5000;
export const NOTES_MAX = 20000;
export const DECK_NAME_MAX = 80;
export const TAGS_MAX = 20;
export const TAG_MAX_LENGTH = 40;

export interface CardContentLimits {
  front: string;
  back: string;
  notes: string;
  tags?: readonly string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateCardContent(content: CardContentLimits): ValidationResult {
  const front = content.front.trim();
  const back = content.back.trim();
  const notes = content.notes.trim();
  const errors = [
    outOfRange(front.length, 1, FRONT_MAX) && 'A Frente deve ter entre 1 e 5.000 caracteres.',
    outOfRange(back.length, 1, BACK_MAX) && 'O Verso deve ter entre 1 e 5.000 caracteres.',
    outOfRange(notes.length, 0, NOTES_MAX) && 'As Notas devem ter no máximo 20.000 caracteres.',
    (content.tags?.length ?? 0) > TAGS_MAX && 'Limite de 20 etiquetas',
  ].filter((error): error is string => Boolean(error));
  return { valid: errors.length === 0, errors };
}

function outOfRange(length: number, min: number, max: number): boolean {
  return length < min || length > max;
}
