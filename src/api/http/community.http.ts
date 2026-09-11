import type { Request, RequestHandler, Response, Router } from 'express';
import type { CommunityService } from '../services/communityService';
import { setPrivateUserCacheHeaders } from './privateUserCache';
import { sendV1Json, sendV1Success } from './v1Envelope';

export interface CommunityV1HttpDeps {
  communityService: CommunityService;
  /** Session-or-bearer auth that REJECTS guests (used by favorites mutations + list). */
  authenticateUser: RequestHandler;
  /** Optional auth: attaches req.user when present, never rejects (guest-viewable reads). */
  optionalAuth: RequestHandler;
}

function requireRealUser(req: Request, res: Response): boolean {
  if (!req.user) {
    sendV1Json(res, 401, null, [{ code: 'UNAUTHORIZED', message: 'Authentication required' }]);
    return false;
  }
  if (req.user.role !== 'USER' && req.user.role !== 'ADMIN') {
    sendV1Json(res, 403, null, [
      { code: 'FORBIDDEN', message: 'Only registered users can use favorites' }
    ]);
    return false;
  }
  return true;
}

/**
 * Community decks, favorites, and read-only public profiles.
 *
 * IMPORTANT: register this BEFORE the decks routes so `GET /decks/favorites` is
 * matched before the `GET /decks/:id` param route.
 */
export function registerCommunityV1HttpRoutes(router: Router, deps: CommunityV1HttpDeps): void {
  // The viewer's own favorited decks.
  router.get('/decks/favorites', deps.authenticateUser, async (req, res) => {
    if (!requireRealUser(req, res)) return;
    try {
      const data = await deps.communityService.getFavorites(req.user!.id);
      setPrivateUserCacheHeaders(res);
      sendV1Success(res, data);
    } catch (error) {
      console.error('v1 GET /decks/favorites error:', error);
      sendV1Json(res, 500, null, [{ code: 'FAVORITES_ERROR', message: 'Failed to load favorites' }]);
    }
  });

  router.post('/decks/:id/favorite', deps.authenticateUser, async (req, res) => {
    if (!requireRealUser(req, res)) return;
    try {
      const result = await deps.communityService.addFavorite(req.user!.id, req.params.id);
      if (!result.ok) {
        sendV1Json(res, result.status, null, [{ code: result.code, message: result.message }]);
        return;
      }
      sendV1Success(res, result.data, result.status);
    } catch (error) {
      console.error('v1 POST /decks/:id/favorite error:', error);
      sendV1Json(res, 500, null, [{ code: 'FAVORITE_ERROR', message: 'Failed to add favorite' }]);
    }
  });

  router.delete('/decks/:id/favorite', deps.authenticateUser, async (req, res) => {
    if (!requireRealUser(req, res)) return;
    try {
      const result = await deps.communityService.removeFavorite(req.user!.id, req.params.id);
      if (!result.ok) {
        sendV1Json(res, result.status, null, [{ code: result.code, message: result.message }]);
        return;
      }
      sendV1Success(res, result.data, result.status);
    } catch (error) {
      console.error('v1 DELETE /decks/:id/favorite error:', error);
      sendV1Json(res, 500, null, [{ code: 'UNFAVORITE_ERROR', message: 'Failed to remove favorite' }]);
    }
  });

  // Community feed (?search= filters by deck, owner, character, or location name). Guest-viewable.
  router.get('/community/decks', deps.optionalAuth, async (req, res) => {
    try {
      const viewerId = req.user?.id ?? null;
      const searchRaw = req.query.search;
      const search = typeof searchRaw === 'string' ? searchRaw : undefined;
      const data = await deps.communityService.getCommunityDecks(viewerId, search);
      setPrivateUserCacheHeaders(res);
      sendV1Success(res, data);
    } catch (error) {
      console.error('v1 GET /community/decks error:', error);
      sendV1Json(res, 500, null, [{ code: 'COMMUNITY_ERROR', message: 'Failed to load community decks' }]);
    }
  });

  // Official preconstructed decks, grouped newest release set first. Guest-viewable.
  router.get('/community/preconstructed-decks', deps.optionalAuth, async (req, res) => {
    try {
      const viewerId = req.user?.id ?? null;
      const data = await deps.communityService.getPreconstructedDeckGroups(viewerId);
      setPrivateUserCacheHeaders(res);
      sendV1Success(res, data);
    } catch (error) {
      console.error('v1 GET /community/preconstructed-decks error:', error);
      sendV1Json(res, 500, null, [
        { code: 'PRECONSTRUCTED_DECKS_ERROR', message: 'Failed to load preconstructed decks' }
      ]);
    }
  });

  // Read-only public profile: a user's public decks. Guest-viewable.
  router.get('/users/:userId/public-decks', deps.optionalAuth, async (req, res) => {
    try {
      const viewerId = req.user?.id ?? null;
      const data = await deps.communityService.getPublicDecksForUser(req.params.userId, viewerId);
      setPrivateUserCacheHeaders(res);
      sendV1Success(res, data);
    } catch (error) {
      console.error('v1 GET /users/:userId/public-decks error:', error);
      sendV1Json(res, 500, null, [{ code: 'PUBLIC_DECKS_ERROR', message: 'Failed to load public decks' }]);
    }
  });
}
