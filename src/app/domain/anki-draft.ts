import type { ParsedField } from './anki-char-stream';
import { resolveFieldMarks } from './anki-marks';
import type { CardContent } from './cards';
import type { Marks } from './text-marks';

export interface CardDraft extends CardContent {
  notetypeId: string;
}

export interface Side {
  text: string;
  marks: Marks;
}

export function asSide(parsed: ParsedField): Side {
  return { text: parsed.text, marks: resolveFieldMarks(parsed) };
}

export function emptyField(): ParsedField {
  return { text: '', emphasis: [], highlight: [], clozes: [] };
}

export interface DraftParts {
  front: Side;
  back: Side;
  notes: ParsedField;
  tags: string[];
  notetypeId: string;
}

export function toDraft(parts: DraftParts): CardDraft {
  return {
    front: parts.front.text,
    back: parts.back.text,
    notes: parts.notes.text,
    marks: {
      front: parts.front.marks,
      back: { ...parts.back.marks, cloze: [] },
      notes: resolveFieldMarks(parts.notes),
    },
    tags: parts.tags,
    notetypeId: parts.notetypeId,
  };
}
