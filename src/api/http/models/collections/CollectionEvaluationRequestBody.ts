import { z } from 'zod';
import { isValidCollectionCardType } from '../../../../validation/collectionCardType';
/** Bounded device-local snapshot. Identity/role/storage cannot be supplied. */
export const CollectionEvaluationRequestBody = z.object({
  entries: z.array(z.object({
    cardId: z.string().min(1).max(200),
    cardType: z.string().refine(isValidCollectionCardType),
    imagePath: z.string().max(2048),
    quantity: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
  }).strict()).max(10000),
}).strict().refine(input => input.entries.reduce((sum, row) => sum + row.quantity, 0) <= Number.MAX_SAFE_INTEGER);
