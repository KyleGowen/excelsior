import { z } from 'zod';
const revision=z.string().max(80).refine(value=>Number.isFinite(Date.parse(value)));
export const AccountDeckDeleteRequestBody=z.object({operationId:z.string().uuid(),deckId:z.string().uuid(),expectedUpdatedAt:revision}).strict();
export type AccountDeckDeleteInput=z.infer<typeof AccountDeckDeleteRequestBody>;
