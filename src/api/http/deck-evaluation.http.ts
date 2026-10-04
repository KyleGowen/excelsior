import type { Router } from 'express';
import { EvaluateCandidatesRequestBody } from './models/decks/EvaluateCandidatesRequestBody';
import { DeckDraftEvaluationService, DraftStructureError } from '../services/deckDraftEvaluationService';
import { EvaluateDraftRequestBody } from './models/decks/EvaluateDraftRequestBody';
import { parseV1Body } from './parseV1Body';
import { sendV1Json, sendV1Success } from './v1Envelope';
import { createV1RateLimit } from './middleware/v1RateLimit';
export function registerDeckEvaluationV1HttpRoutes(router: Router, service: DeckDraftEvaluationService): void {
    router.post('/decks/candidates/evaluate', createV1RateLimit({ routeKey: 'candidate-evaluation', budget: { limit: 120, windowMs: 60000 } }), async (req, res) => {
        res.set('Cache-Control', 'no-store');
        const parsed = parseV1Body(EvaluateCandidatesRequestBody, req.body, res);
        if (!parsed) return;
        const input = EvaluateCandidatesRequestBody.safeParse(parsed.value);
        if (!input.success) { sendV1Json(res, 400, null, [{ code: 'VALIDATION_ERROR', message: 'Invalid candidate evaluation input' }]); return; }
        try { sendV1Success(res, await service.evaluateCandidates(input.data)); }
        catch (error) {
            if (error instanceof DraftStructureError) sendV1Json(res, 400, null, [{ code: 'DRAFT_STRUCTURE_INVALID', message: error.message }]);
            else sendV1Json(res, 503, null, [{ code: 'DRAFT_EVALUATION_UNAVAILABLE', message: 'Card eligibility is unavailable. Retry without discarding the draft.' }]);
        }
    });
    router.post('/decks/evaluate', createV1RateLimit({ routeKey: 'draft-evaluation', budget: { limit: 120, windowMs: 60000 } }), async (req, res) => {
        res.set('Cache-Control', 'no-store');
        const parsed = parseV1Body(EvaluateDraftRequestBody, req.body, res);
        if (!parsed)
            return;
        // Enforce the new contract even when the historical global zod kill switch is set.
        const input = EvaluateDraftRequestBody.safeParse(parsed.value);
        if (!input.success) {
            sendV1Json(res, 400, null, [{ code: 'VALIDATION_ERROR', message: 'Invalid draft evaluation input' }]);
            return;
        }
        try {
            sendV1Success(res, await service.evaluate(input.data));
        }
        catch (error) {
            if (error instanceof DraftStructureError)
                sendV1Json(res, 400, null, [{ code: 'DRAFT_STRUCTURE_INVALID', message: error.message }]);
            else
                sendV1Json(res, 503, null, [{ code: 'DRAFT_EVALUATION_UNAVAILABLE', message: 'Deck evaluation is unavailable. Retry without discarding the draft.' }]);
        }
    });
}
