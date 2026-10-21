import { z } from 'zod';

/** Syntax/normalization is also enforced in the service when zod is disabled. */
export const SetTopDeckRequestBody = z.object({
  topdeckHandle: z.string().nullable(),
}).strict();
