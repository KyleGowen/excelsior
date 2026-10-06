import { z } from 'zod';
import { EvaluateDraftRequestBody } from './EvaluateDraftRequestBody';
export const ExportDraftRequestBody = z.object({ draft:EvaluateDraftRequestBody, display:z.object({ name:z.string().max(100), description:z.string().max(500), exportedBy:z.string().max(100), surface:z.enum(['editor','selection']) }).strict() }).strict();
