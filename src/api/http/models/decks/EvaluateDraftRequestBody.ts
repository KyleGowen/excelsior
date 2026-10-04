import { z } from 'zod';
const identity = z.string().trim().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/);
export const EvaluateDraftRequestBody = z.object({
    schemaVersion: z.literal(1),
    draftId: identity,
    revision: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
    cards: z.array(z.object({
        type: z.enum(['character', 'special', 'power', 'mission', 'event', 'location', 'battleground', 'aspect', 'advanced-universe', 'advanced_universe', 'teamwork', 'ally-universe', 'ally_universe', 'training', 'basic-universe', 'basic_universe']),
        cardId: identity,
        quantity: z.number().int().min(1).max(100),
        exclude_from_draw: z.boolean().optional()
    }).strict()).max(100),
    reserveCharacterId: identity.nullable().default(null),
    limited: z.boolean().default(false),
    format: z.literal('venture').default('venture'),
    koCharacterIds: z.array(identity).max(100).default([])
}).strict();
export type EvaluateDraftInput = z.infer<typeof EvaluateDraftRequestBody>;
