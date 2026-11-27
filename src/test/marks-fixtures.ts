import type { CardMarks } from '../app/domain/text-marks';

export const HIGHLIGHT_MARKS: CardMarks = {
  front: {
    cloze: [{ start: 15, end: 21 }],
    emphasis: [],
    highlight: [{ start: 0, end: 11, color: 'pink' }],
  },
  back: { cloze: [], emphasis: [{ start: 4, end: 10 }], highlight: [{ start: 0, end: 3, color: 'green' }] },
  notes: { cloze: [], emphasis: [], highlight: [{ start: 0, end: 5, color: 'yellow' }] },
};

export const FUTURE_MARKS = {
  front: {
    cloze: [],
    emphasis: [],
    highlight: [{ start: 0, end: 5, color: 'blue' }],
    strike: [{ start: 8, end: 12 }],
  },
  back: { cloze: [], emphasis: [], highlight: [] },
  notes: { cloze: [], emphasis: [], highlight: [] },
  version: 7,
} as unknown as CardMarks;

export const LEGACY_MARKS = {
  front: { cloze: [{ start: 15, end: 21 }], emphasis: [{ start: 2, end: 9 }] },
  back: { cloze: [], emphasis: [] },
  notes: { cloze: [], emphasis: [] },
} as unknown as CardMarks;
