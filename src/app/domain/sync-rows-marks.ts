import { z } from 'zod';

const rangeSchema = z.object({ start: z.number(), end: z.number() });
const fieldMarksSchema = z.object({ cloze: z.array(rangeSchema), emphasis: z.array(rangeSchema) });

export const cardMarksSchema = z.object({
  front: fieldMarksSchema,
  back: fieldMarksSchema,
  notes: fieldMarksSchema,
});
