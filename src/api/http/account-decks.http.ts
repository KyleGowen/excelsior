import type { Application, RequestHandler } from 'express';
import { AccountDeckService, AccountDeckError } from '../services/accountDeckService';
import { DraftStructureError } from '../services/deckDraftEvaluationService';
import { AccountDeckSnapshotRequestBody } from './models/decks/AccountDeckSnapshotRequestBody';
import { sendV1Json, sendV1Success } from './v1Envelope';

/** Internal aliases can only be reached through the enabled confidential account gateway. */
export function registerAccountDeckRoutes(app: Application, service: AccountDeckService, authenticate: RequestHandler) {
  const guard: RequestHandler = (req, res, next) => {
    if (process.env.ENABLE_ACCOUNT_DECK_GATEWAY !== '1' || !req.originalUrl.startsWith('/api/service/account/v1/decks') || !req.serviceClient?.scopes.includes('account:self')) {
      sendV1Json(res, 403, null, [{ code: 'SERVICE_SCOPE_DENIED', message: 'Account deck access is not enabled' }]); return;
    }
    next();
  };
  const action = (work: (req: Parameters<RequestHandler>[0]) => Promise<unknown>): RequestHandler => async (req, res) => {
    try {
      if (!req.user || req.user.role === 'GUEST') throw new AccountDeckError(403, 'GUEST_FORBIDDEN');
      sendV1Success(res, await work(req));
    } catch (error) {
      const status = error instanceof AccountDeckError ? error.status : error instanceof DraftStructureError ? 400 : 503;
      const code = error instanceof AccountDeckError ? error.code : status === 400 ? 'VALIDATION_ERROR' : 'DECK_SERVICE_UNAVAILABLE';
      sendV1Json(res, status, null, [{ code, message: 'Deck operation could not be completed' }]);
    }
  };
  app.get('/api/account-decks', guard, authenticate, action(req => service.list(req.user!.id)));
  app.get('/api/account-decks/:id/full', guard, authenticate, action(req => service.load(req.params.id!, req.user!.id)));
  app.post('/api/account-decks/save', guard, authenticate, action(async req => {
    const result = AccountDeckSnapshotRequestBody.safeParse(req.body);
    if (!result.success) throw new AccountDeckError(400, 'VALIDATION_ERROR');
    return service.save(req.user!.id, result.data);
  }));
}
