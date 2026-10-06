import { z } from 'zod';
import { EvaluateDraftRequestBody } from './EvaluateDraftRequestBody';
export const DrawDraftRequestBody = z.object({ draft:EvaluateDraftRequestBody }).strict();
