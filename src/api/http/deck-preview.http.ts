import { DeckSummariesRequestBody } from './models/decks/DeckSummariesRequestBody';
import type { Router, RequestHandler } from 'express';
import { DraftStructureError, type DeckDraftEvaluationService } from '../services/deckDraftEvaluationService';
import { DrawDraftRequestBody } from './models/decks/DrawDraftRequestBody';
import { ExportDraftRequestBody } from './models/decks/ExportDraftRequestBody';
import { AnalyzeHandRequestBody } from './models/decks/AnalyzeHandRequestBody';
import { sendV1Success, sendV1Json } from './v1Envelope';
import { createV1RateLimit } from './middleware/v1RateLimit';
/** Stateless public previews; hand analysis is verified ADMIN identity only. */
export function registerDeckPreviewV1HttpRoutes(router: Router, service: DeckDraftEvaluationService, authenticate: RequestHandler): void {
    const limit = createV1RateLimit({ routeKey:'deck-preview', budget:{ limit:120, windowMs:60000 } });
    const unavailable = (res: Parameters<RequestHandler>[1], error:unknown) => {
        if (error instanceof DraftStructureError) sendV1Json(res,400,null,[{ code:'DRAFT_STRUCTURE_INVALID', message:error.message }]);
        else sendV1Json(res,503,null,[{ code:'DRAFT_PREVIEW_UNAVAILABLE', message:'Deck preview is unavailable. Retry without discarding the draft.' }]);
    };
    router.post('/decks/summaries', limit, async (req,res) => {
        res.set('Cache-Control','no-store');
        const input = DeckSummariesRequestBody.safeParse(req.body);
        if (!input.success) { sendV1Json(res,400,null,[{code:'VALIDATION_ERROR',message:'Invalid summaries input'}]); return; }
        try { sendV1Success(res,await service.summaries(input.data.drafts)); } catch(error) { unavailable(res,error); }
    });
    router.post('/decks/draw', limit, async (req,res) => {
        res.set('Cache-Control','no-store');
        const input = DrawDraftRequestBody.safeParse(req.body);
        if (!input.success) { sendV1Json(res,400,null,[{code:'VALIDATION_ERROR',message:'Invalid draw input'}]); return; }
        try { sendV1Success(res,await service.draw(input.data.draft)); } catch(error) { unavailable(res,error); }
    });
    router.post('/decks/export', limit, async (req,res) => {
        res.set('Cache-Control','no-store');
        const input = ExportDraftRequestBody.safeParse(req.body);
        if (!input.success) { sendV1Json(res,400,null,[{code:'VALIDATION_ERROR',message:'Invalid export input'}]); return; }
        try { sendV1Success(res,await service.exportDraft(input.data.draft,input.data.display)); } catch(error) { unavailable(res,error); }
    });
    router.post('/admin/decks/hand-analysis', authenticate, limit, async (req,res) => {
        res.set('Cache-Control','no-store');
        if (req.user?.role !== 'ADMIN') { sendV1Json(res,403,null,[{code:'FORBIDDEN',message:'Administrative analysis requires an administrator'}]); return; }
        const input = AnalyzeHandRequestBody.safeParse(req.body);
        if (!input.success) { sendV1Json(res,400,null,[{code:'VALIDATION_ERROR',message:'Invalid hand analysis input'}]); return; }
        try { sendV1Success(res,await service.analyzeHand(input.data.draft,input.data.hand)); } catch(error) { unavailable(res,error); }
    });
}
