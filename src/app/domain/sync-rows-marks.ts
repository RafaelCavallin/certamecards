import { z } from 'zod';

const rangeSchema = z.object({ start: z.number(), end: z.number() });
const highlightSchema = z.looseObject({ start: z.number(), end: z.number(), color: z.string() });
const fieldMarksSchema = z.looseObject({
  cloze: z.array(rangeSchema),
  emphasis: z.array(rangeSchema),
  highlight: z.array(highlightSchema).optional().catch(undefined),
});

export const cardMarksSchema = z.looseObject({
  front: fieldMarksSchema,
  back: fieldMarksSchema,
  notes: fieldMarksSchema,
});
