import type { Router, RequestHandler } from 'express';
import type { CollectionService } from '../../services/collectionService';
import { evaluateCollection } from '../../services/collection-evaluation/evaluateCollection';
import { CollectionEvaluationRequestBody } from './models/collections/CollectionEvaluationRequestBody';
import { createV1RateLimit } from './middleware/v1RateLimit';
import { sendV1Success, sendV1Json } from './v1Envelope';
/** Device drafts are stateless; saved views derive identity only from verified auth. */
export function registerCollectionEvaluationV1HttpRoutes(router: Router, service: CollectionService, authenticate: RequestHandler): void {
  router.post('/collections/evaluate', createV1RateLimit({ routeKey: 'collection-evaluation', budget: { limit: 120, windowMs: 60000 } }), (req, res) => {
    res.set('Cache-Control', 'no-store');
    const input = CollectionEvaluationRequestBody.safeParse(req.body);
    if (!input.success) { sendV1Json(res, 400, null, [{ code: 'VALIDATION_ERROR', message: 'Invalid collection snapshot' }]); return; }
    sendV1Success(res, evaluateCollection(input.data.entries, 'device', true));
  });
  router.get('/collections/me/view', authenticate, async (req, res) => {
    res.set('Cache-Control', 'no-store');
    if (req.user?.role !== 'USER' && req.user?.role !== 'ADMIN') {
      sendV1Json(res, 403, null, [{ code: 'GUEST_FORBIDDEN', message: 'Guest collections remain on this device' }]); return;
    }
    try { sendV1Success(res, await service.getCollectionView(req.user.id)); }
    catch { sendV1Json(res, 503, null, [{ code: 'COLLECTION_VIEW_UNAVAILABLE', message: 'Collection is unavailable. Retry without changing your quantities.' }]); }
  });
}
