import { z } from 'zod';
import { EvaluateDraftRequestBody } from './EvaluateDraftRequestBody';

/** The actor and game-rule results are always supplied by the server. */
export const AccountDeckSnapshotRequestBody = z.object({
  operationId: z.string().uuid(),
  deckId: z.string().uuid().nullable(),
  expectedUpdatedAt: z.string().max(80).refine(value => Number.isFinite(Date.parse(value))).nullable(),
  name: z.string().trim().min(1).max(100),
  cards: z.array(EvaluateDraftRequestBody.shape.cards.element.extend({ cardId: z.string().uuid() })).max(100),
  reserveCharacterId: z.string().uuid().nullable(),
  limited: z.boolean(),
}).strict().refine(value => (value.deckId === null) === (value.expectedUpdatedAt === null))
.refine(value => new Set(value.cards.map(card => card.type.replace(/_/g, "-") + ":" + card.cardId)).size === value.cards.length);
export type AccountDeckSnapshotInput = z.infer<typeof AccountDeckSnapshotRequestBody>;
