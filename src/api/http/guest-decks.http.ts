import type { Request, RequestHandler, Response, Router } from 'express';
import type { GuestDeckService } from '../services/guestDeckService';
import { sendV1Json, sendV1Success } from './v1Envelope';
import { CreateGuestDeckBody } from './models/guest-decks/CreateGuestDeckBody';
import { UpdateGuestDeckBody } from './models/guest-decks/UpdateGuestDeckBody';
import { GuestDeckCardsPutBody } from './models/guest-decks/GuestDeckCardsPutBody';
import { GuestDeckCardsPostBody } from './models/guest-decks/GuestDeckCardsPostBody';

export interface GuestDecksV1HttpDeps {
  guestDeckService: GuestDeckService;
  authenticateUser: RequestHandler;
}

function requireGuestSessionV1(req: Request, res: Response): string | null {
  if (req.user?.role !== 'GUEST') {
    sendV1Json(res, 403, null, [
      {
        code: 'GUEST_ONLY',
        message: 'Guest deck endpoints are only available to GUEST users'
      }
    ]);
    return null;
  }
  const sessionId = req.cookies?.sessionId;
  if (!sessionId) {
    sendV1Json(res, 401, null, [
      { code: 'SESSION_REQUIRED', message: 'Session required for guest decks' }
    ]);
    return null;
  }
  return sessionId;
}

export function registerGuestDecksV1HttpRoutes(router: Router, deps: GuestDecksV1HttpDeps): void {
  router.post('/guest/decks', deps.authenticateUser, async (req, res) => {
    res.set('Cache-Control', 'no-store');
    const sessionId = requireGuestSessionV1(req, res);
    if (!sessionId) return;
    const parsed = CreateGuestDeckBody.parse(req.body);
    if (!parsed.ok) {
      sendV1Json(res, 400, null, parsed.errors);
      return;
    }
    const result = await deps.guestDeckService.createDeck(sessionId, parsed.value);
    if (!result.ok) {
      sendV1Json(res, result.status, null, [{ code: result.code, message: result.message }]);
      return;
    }
    sendV1Success(res, result.data, result.status);
  });

  router.get('/guest/decks', deps.authenticateUser, async (req, res) => {
    res.set('Cache-Control', 'no-store');
    const sessionId = requireGuestSessionV1(req, res);
    if (!sessionId) return;
    const result = await deps.guestDeckService.listDecks(sessionId, req.user!.id);
    if (!result.ok) {
      sendV1Json(res, result.status, null, [{ code: result.code, message: result.message }]);
      return;
    }
    sendV1Success(res, result.data);
  });

  router.get('/guest/decks/:id', deps.authenticateUser, async (req, res) => {
    res.set('Cache-Control', 'no-store');
    const sessionId = requireGuestSessionV1(req, res);
    if (!sessionId) return;
    const result = await deps.guestDeckService.getDeck(sessionId, req.params.id);
    if (!result.ok) {
      sendV1Json(res, result.status, null, [{ code: result.code, message: result.message }]);
      return;
    }
    sendV1Success(res, result.data);
  });

  router.put('/guest/decks/:id', deps.authenticateUser, async (req, res) => {
    res.set('Cache-Control', 'no-store');
    const sessionId = requireGuestSessionV1(req, res);
    if (!sessionId) return;
    const parsed = UpdateGuestDeckBody.parse(req.body);
    if (!parsed.ok) {
      sendV1Json(res, 400, null, parsed.errors);
      return;
    }
    const result = await deps.guestDeckService.updateDeckMetadata(sessionId, req.params.id, parsed.value);
    if (!result.ok) {
      sendV1Json(res, result.status, null, [{ code: result.code, message: result.message }]);
      return;
    }
    sendV1Success(res, result.data);
  });

  router.put('/guest/decks/:id/cards', deps.authenticateUser, async (req, res) => {
    res.set('Cache-Control', 'no-store');
    const sessionId = requireGuestSessionV1(req, res);
    if (!sessionId) return;
    const parsed = GuestDeckCardsPutBody.parse(req.body);
    if (!parsed.ok) {
      sendV1Json(res, 400, null, parsed.errors);
      return;
    }
    const result = await deps.guestDeckService.replaceCards(sessionId, req.params.id, parsed.value);
    if (!result.ok) {
      sendV1Json(res, result.status, null, [{ code: result.code, message: result.message }]);
      return;
    }
    sendV1Success(res, result.data);
  });

  router.post('/guest/decks/:id/cards', deps.authenticateUser, async (req, res) => {
    res.set('Cache-Control', 'no-store');
    const sessionId = requireGuestSessionV1(req, res);
    if (!sessionId) return;
    const parsed = GuestDeckCardsPostBody.parse(req.body);
    if (!parsed.ok) {
      sendV1Json(res, 400, null, parsed.errors);
      return;
    }
    const result = await deps.guestDeckService.addCard(sessionId, req.params.id, parsed.value);
    if (!result.ok) {
      sendV1Json(res, result.status, null, [{ code: result.code, message: result.message }]);
      return;
    }
    sendV1Success(res, result.data);
  });

  router.delete('/guest/decks/:id', deps.authenticateUser, async (req, res) => {
    res.set('Cache-Control', 'no-store');
    const sessionId = requireGuestSessionV1(req, res);
    if (!sessionId) return;
    const result = deps.guestDeckService.deleteDeck(sessionId, req.params.id);
    if (!result.ok) {
      sendV1Json(res, result.status, null, [{ code: result.code, message: result.message }]);
      return;
    }
    sendV1Success(res, result.data, 200, 'Deck deleted successfully');
  });
}
