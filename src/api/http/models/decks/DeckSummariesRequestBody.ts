import { z } from 'zod';
import { EvaluateDraftRequestBody } from './EvaluateDraftRequestBody';
export const DeckSummariesRequestBody = z.object({ drafts:z.array(EvaluateDraftRequestBody).min(1).max(20) }).strict().refine(input => input.drafts.reduce((n,d) => n+d.cards.length,0) <= 500,'At most 500 typed identities per batch');
