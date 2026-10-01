import type { AnkiNotetype } from './anki-types';
import { tagKey } from './tags';

export type NotetypeClass = 'basic' | 'cloze' | 'unsupported';

export interface FieldMapping {
  include: boolean;
  front: number;
  back: number | null;
  notes: number | null;
}

export const UNSUPPORTED_REASON = 'Oclusão de imagem não é suportada';

const FRONT_NAMES = ['frente', 'front', 'pergunta', 'question', 'enunciado', 'texto', 'text'];
const BACK_NAMES = ['verso', 'back', 'resposta', 'answer', 'gabarito'];
const NOTES_NAMES = ['extra', 'nota', 'notes', 'comentario', 'comment', 'explicacao'];
const SECOND_FIELD = 1;
const THIRD_FIELD = 2;

export function classifyNotetype(notetype: AnkiNotetype): NotetypeClass {
  if (notetype.kind === 'image-occlusion' || notetype.fields.length === 0) return 'unsupported';
  return notetype.kind === 'cloze' ? 'cloze' : 'basic';
}

export function suggestMapping(notetype: AnkiNotetype): FieldMapping {
  const kind = classifyNotetype(notetype);
  if (kind === 'unsupported') return { include: false, front: 0, back: null, notes: null };
  const names = notetype.fields.map(tagKey);
  if (kind === 'cloze') return suggestClozeMapping(names);
  const front = findField(names, FRONT_NAMES, []) ?? 0;
  const back = findField(names, BACK_NAMES, [front]) ?? firstUnused(names, [front]) ?? front;
  const notes = findField(names, NOTES_NAMES, [front, back]) ?? positional(names, THIRD_FIELD, [front, back]);
  return { include: true, front, back, notes };
}

function suggestClozeMapping(names: readonly string[]): FieldMapping {
  const front = findField(names, FRONT_NAMES, []) ?? 0;
  const notes = findField(names, NOTES_NAMES, [front]) ?? positional(names, SECOND_FIELD, [front]);
  return { include: true, front, back: null, notes };
}

function findField(names: readonly string[], candidates: readonly string[], used: readonly number[]): number | null {
  const index = names.findIndex(
    (name, position) => !used.includes(position) && candidates.some((candidate) => name.includes(candidate)),
  );
  return index === -1 ? null : index;
}

function firstUnused(names: readonly string[], used: readonly number[]): number | null {
  const index = names.findIndex((_, position) => !used.includes(position));
  return index === -1 ? null : index;
}

function positional(names: readonly string[], position: number, used: readonly number[]): number | null {
  return position < names.length && !used.includes(position) ? position : null;
}
