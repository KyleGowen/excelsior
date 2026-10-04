import { z } from 'zod';
import { EvaluateDraftRequestBody } from './EvaluateDraftRequestBody';
const identity = z.string().trim().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/);
export const EvaluateCandidatesRequestBody = z.object({
  schemaVersion: z.literal(1), revision: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
  cards: z.array(EvaluateDraftRequestBody.shape.cards.element.pick({ type: true, cardId: true, quantity: true })).max(100),
  candidates: z.array(z.object({ catalogType: z.enum(['characters', 'special-cards', 'power-cards', 'missions', 'events', 'locations', 'battlegrounds', 'aspects', 'advanced-universe', 'teamwork', 'ally-universe', 'training', 'basic-universe']), cardId: identity }).strict()).max(1500)
}).strict();
export type EvaluateCandidatesInput = z.infer<typeof EvaluateCandidatesRequestBody>;
