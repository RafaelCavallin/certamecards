import type { ParsedField } from './anki-char-stream';
import type { CardContent } from './cards';
import type { Marks } from './text-marks';

export interface CardDraft extends CardContent {
  notetypeId: string;
}

export interface Side {
  text: string;
  marks: Marks;
}

const NO_MARKS: Marks = { cloze: [], emphasis: [] };

export function asSide(parsed: ParsedField): Side {
  return { text: parsed.text, marks: { cloze: [], emphasis: parsed.emphasis } };
}

export function emptyField(): ParsedField {
  return { text: '', emphasis: [], clozes: [] };
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
      back: { cloze: [], emphasis: parts.back.marks.emphasis },
      notes: { ...NO_MARKS, emphasis: parts.notes.emphasis },
    },
    tags: parts.tags,
    notetypeId: parts.notetypeId,
  };
}
