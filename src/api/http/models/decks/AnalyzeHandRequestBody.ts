import { z } from 'zod';
import { EvaluateDraftRequestBody } from './EvaluateDraftRequestBody';
export const AnalyzeHandRequestBody = z.object({ draft:EvaluateDraftRequestBody, hand:z.array(z.object({ type:z.string().min(1).max(40), cardId:z.string().min(1).max(100) }).strict()).max(9) }).strict();
