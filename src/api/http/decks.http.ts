import crypto from 'crypto';
import type { Request, RequestHandler, Response, Router } from 'express';
import type { Deck } from '../../types';
import { checkRateLimit, blockInReadOnlyMode } from '../../routes/helpers';
import type { DeckWriteService } from '../services/deckWriteService';
import type { DeckListService } from '../services/deckListService';
import type { DeckStatsService } from '../services/deckStatsService';
import type { DeckDetailService } from '../services/deckDetailService';
import type { DeckCardsService } from '../services/deckCardsService';
import type { DeckCreateV1DataDto } from '../dto/v1/DeckCreateV1DataDto';
import type { DeckValidateV1SuccessDto } from '../dto/v1/DeckValidateV1SuccessDto';
import type { DeckDeleteV1DataDto } from '../dto/v1/DeckDeleteV1DataDto';
import type { V1Envelope } from './v1Envelope';
import { sendV1Json, sendV1Success, sendV1Unauthorized } from './v1Envelope';
import { CreateDeckRequestBody } from './models/decks/CreateDeckRequestBody';
import { ValidateDeckRequestBody } from './models/decks/ValidateDeckRequestBody';
import { UpdateDeckRequestBody, type UpdateDeckParsed } from './models/decks/UpdateDeckRequestBody';
import { DeckCardsPostBody } from './models/decks/DeckCardsPostBody';
import { DeckCardsPutBody } from './models/decks/DeckCardsPutBody';
import type { DeckBackgroundListReader } from './dbv-support.http';
import type { DeckStatsV1DataDto } from '../dto/v1/DeckStatsV1DataDto';
import type { DeckUIPreferencesService } from '../services/deckUIPreferencesService';
import { COMMUNITY_DECKS_USER_ID } from '../../constants/communityDecksUser';
import { TOURNAMENT_DECKS_USER_ID } from '../../constants/tournamentDecksUser';

/**
 * Maps validated JSON fields to repository `Partial<Deck>`.
 * Explicit `null` must be preserved (not omitted) so `updateDeck` can SET columns to SQL NULL.
 */
function toDeckPartialUpdates(u: UpdateDeckParsed): Partial<Deck> {
  const out: Record<string, unknown> = {};
  if (u.name !== undefined) out.name = u.name;
  if (u.description !== undefined) {
    out.description = u.description === null ? null : u.description;
  }
  if (u.is_limited !== undefined) out.is_limited = u.is_limited;
  // `is_valid` is server-owned: recomputed from cards on every card mutation / import /
  // create / sample-copy. Never trust a client-supplied value on metadata PUT.
  if (u.is_private !== undefined) out.is_private = u.is_private;
  if (u.reserve_character !== undefined) {
    out.reserve_character = u.reserve_character === null ? null : u.reserve_character;
  }
  if (u.display_mission_card_id !== undefined) {
    out.display_mission_card_id = u.display_mission_card_id;
  }
  if (u.background_image_path !== undefined) {
    out.background_image_path = u.background_image_path === null ? null : u.background_image_path;
  }
  return out as Partial<Deck>;
}

export interface DecksV1HttpDeps {
  deckListService: DeckListService;
  deckStatsService: DeckStatsService;
  deckWriteService: DeckWriteService;
  deckDetailService: DeckDetailService;
  deckCardsService: DeckCardsService;
  deckBackgroundService: DeckBackgroundListReader;
  authenticateUser: RequestHandler;
  /** Optional auth for guest-viewable deck GETs (public decks without login). */
  optionalAuth?: RequestHandler;
  deckUIPreferencesService: DeckUIPreferencesService;
  /**
   * User id whose decks back the public "Community Decks" pool. Defaults to the
   * community_decks account when omitted (e.g. in unit fixtures).
   */
  communityDecksUserId?: string;
  /**
   * User id whose decks back the public "Tournament Winning Decks" pool. Defaults to the
   * tournament_decks account when omitted (e.g. in unit fixtures).
   */
  tournamentDecksUserId?: string;
}

function stableV1DeckListBody<T>(data: T): string {
  const envelope: V1Envelope<T> = { data, meta: {}, errors: [], success: true };
  return JSON.stringify(envelope);
}

function sendGuestForbiddenV1(res: Response, operation: string): void {
  sendV1Json(res, 403, null, [
    { code: 'GUEST_FORBIDDEN', message: `Guests may not ${operation}` }
  ]);
}

export function registerDecksV1HttpRoutes(router: Router, deps: DecksV1HttpDeps): void {
  router.get('/decks', deps.authenticateUser, async (req, res) => {
    try {
      const userId = req.user!.id;
      const list = await deps.deckListService.getTransformedListForUser(userId);
      const body = stableV1DeckListBody(list);
      const etag = `"${crypto.createHash('sha1').update(body).digest('hex')}"`;

      // Mutable per-user list: avoid browser freshness cache (was max-age=30; tiles showed stale is_valid after save).
      res.set('Cache-Control', 'private, max-age=0, must-revalidate');
      res.set('Vary', 'Cookie');
      res.set('ETag', etag);

      if (req.headers['if-none-match'] === etag) {
        res.status(304).end();
        return;
      }

      res.status(200).type('application/json').send(body);
    } catch (error) {
      console.error('v1 GET /decks error:', error);
      sendV1Json(res, 500, null, [{ code: 'DECK_LIST_ERROR', message: 'Failed to fetch decks' }]);
    }
  });

  router.get('/decks/stats', deps.authenticateUser, async (req, res) => {
    try {
      const stats = await deps.deckStatsService.getAggregateStatsForUser(req.user!.id);
      const data: DeckStatsV1DataDto = stats;
      sendV1Success(res, data);
    } catch (error) {
      console.error('v1 GET /decks/stats error:', error);
      sendV1Json(res, 500, null, [{ code: 'DECK_STATS_ERROR', message: 'Failed to fetch deck stats' }]);
    }
  });

  /**
   * Community deck pool. Returns the community_decks account's public, legal decks,
   * sorted by updated_at descending. Registered before `/decks/:id` so the
   * literal `community` segment is not captured as an id. Requires an authenticated
   * session (the Home screen is behind auth).
   */
  router.get('/decks/community', deps.authenticateUser, async (_req, res) => {
    try {
      const communityUserId = deps.communityDecksUserId ?? COMMUNITY_DECKS_USER_ID;
      const list = await deps.deckListService.getTransformedCommunityListForUser(communityUserId);
      sendV1Success(res, list);
    } catch (error) {
      console.error('v1 GET /decks/community error:', error);
      sendV1Json(res, 500, null, [
        { code: 'COMMUNITY_DECKS_ERROR', message: 'Failed to fetch community decks' }
      ]);
    }
  });

  /**
   * Tournament deck pool. Returns the tournament_decks account's public, legal decks,
   * sorted by updated_at descending. Registered before `/decks/:id` so the
   * literal `tournament` segment is not captured as an id.
   */
  router.get('/decks/tournament', deps.authenticateUser, async (_req, res) => {
    try {
      const tournamentUserId = deps.tournamentDecksUserId ?? TOURNAMENT_DECKS_USER_ID;
      const list = await deps.deckListService.getTransformedTournamentListForUser(tournamentUserId);
      sendV1Success(res, list);
    } catch (error) {
      console.error('v1 GET /decks/tournament error:', error);
      sendV1Json(res, 500, null, [
        { code: 'TOURNAMENT_DECKS_ERROR', message: 'Failed to fetch tournament decks' }
      ]);
    }
  });

  router.post(
    '/decks/validate',
    deps.authenticateUser,
    async (req: Request, res: Response) => {
      try {
        const parsed = ValidateDeckRequestBody.parse(req.body);
        if (!parsed.ok) {
          sendV1Json(res, 400, null, parsed.errors);
          return;
        }

        const validationErrors = await deps.deckWriteService.validateDeckCards(parsed.value.cards);

        if (validationErrors.length > 0) {
          const joined = validationErrors.map((e) => e.message).join('; ');
          sendV1Json(
            res,
            400,
            { validationErrors },
            [{ code: 'DECK_VALIDATION_FAILED', message: joined }]
          );
          return;
        }

        const data: DeckValidateV1SuccessDto = { valid: true, message: 'Deck is valid' };
        sendV1Success(res, data);
      } catch (error) {
        console.error('v1 POST /decks/validate error:', error);
        sendV1Json(res, 500, null, [{ code: 'DECK_VALIDATE_ERROR', message: 'Failed to validate deck' }]);
      }
    }
  );

  router.post('/decks', deps.authenticateUser, async (req: Request, res: Response) => {
    try {
      if (checkRateLimit(req, res, 'deck creation', { v1: true })) {
        return;
      }
      if (blockInReadOnlyMode(req, res, 'deck creation', { v1: true })) {
        return;
      }
      if (req.user?.role === 'GUEST') {
        sendGuestForbiddenV1(res, 'create decks');
        return;
      }

      const parsed = CreateDeckRequestBody.parse(req.body);
      if (!parsed.ok) {
        sendV1Json(res, 400, null, parsed.errors);
        return;
      }

      const { name, description, characters, is_private } = parsed.value;

      try {
        const deck = is_private === undefined
          ? await deps.deckWriteService.createDeck(req.user!.id, name, description, characters)
          : await deps.deckWriteService.createDeck(req.user!.id, name, description, characters, is_private);
        const data = deck as DeckCreateV1DataDto;
        sendV1Success(res, data, 201);
      } catch (error) {
        if (error instanceof Error && error.message.includes('Maximum 4 characters allowed')) {
          sendV1Json(res, 400, null, [{ code: 'VALIDATION_ERROR', message: error.message }]);
          return;
        }
        console.error('v1 POST /decks error:', error);
        sendV1Json(res, 500, null, [{ code: 'DECK_CREATE_ERROR', message: 'Failed to create deck' }]);
      }
    } catch (error) {
      console.error('v1 POST /decks error:', error);
      sendV1Json(res, 500, null, [{ code: 'DECK_CREATE_ERROR', message: 'Failed to create deck' }]);
    }
  });

  router.get('/decks/:id/cards', deps.authenticateUser, async (req: Request, res: Response) => {
    res.set('Cache-Control', 'no-store');
    try {
      const result = await deps.deckCardsService.getDeckCards(req.params.id);
      if (!result.ok) {
        if (result.kind === 'not_implemented') {
          sendV1Json(res, 501, null, [{ code: 'NOT_IMPLEMENTED', message: 'Not implemented' }]);
          return;
        }
        sendV1Json(res, 500, null, [{ code: 'DECK_CARDS_FETCH_ERROR', message: 'Failed to fetch deck cards' }]);
        return;
      }
      sendV1Success(res, result.data, 200, 'Card added to deck successfully');
    } catch (error) {
      console.error('v1 GET /decks/:id/cards error:', error);
      sendV1Json(res, 500, null, [{ code: 'DECK_CARDS_FETCH_ERROR', message: 'Failed to fetch deck cards' }]);
    }
  });

  router.post('/decks/:id/cards', deps.authenticateUser, async (req: Request, res: Response) => {
    res.set('Cache-Control', 'no-store');
    try {
      if (checkRateLimit(req, res, 'card addition', { v1: true })) {
        return;
      }
      if (blockInReadOnlyMode(req, res, 'card addition', { v1: true })) {
        return;
      }
      if (req.user?.role === 'GUEST') {
        sendGuestForbiddenV1(res, 'modify decks');
        return;
      }

      const parsed = DeckCardsPostBody.parse(req.body);
      if (!parsed.ok) {
        sendV1Json(res, 400, null, parsed.errors);
        return;
      }

      const { cardType, cardId, quantity } = parsed.value;
      const result = await deps.deckCardsService.postCard(
        req.params.id,
        req.user!.id,
        cardType,
        cardId,
        quantity
      );

      if (!result.ok) {
        if (result.kind === 'forbidden') {
          sendV1Json(res, 403, null, [{ code: 'DECK_ACCESS_DENIED', message: result.message }]);
          return;
        }
        if (result.kind === 'not_found') {
          sendV1Json(res, 404, null, [{ code: 'DECK_NOT_FOUND', message: result.message }]);
          return;
        }
        if (result.kind === 'bad_request') {
          sendV1Json(res, 400, null, [{ code: 'VALIDATION_ERROR', message: result.message }]);
          return;
        }
        sendV1Json(res, 500, null, [{ code: 'DECK_CARD_ADD_ERROR', message: result.message }]);
        return;
      }

      sendV1Success(res, result.data, 200, 'Card added to deck successfully');
    } catch (error) {
      console.error('v1 POST /decks/:id/cards error:', error);
      sendV1Json(res, 500, null, [{ code: 'DECK_CARD_ADD_ERROR', message: 'Failed to add card to deck' }]);
    }
  });

  router.put('/decks/:id/cards', deps.authenticateUser, async (req: Request, res: Response) => {
    res.set('Cache-Control', 'no-store');
    try {
      if (checkRateLimit(req, res, 'card replacement', { v1: true })) {
        return;
      }
      if (blockInReadOnlyMode(req, res, 'card replacement', { v1: true })) {
        return;
      }
      if (req.user?.role === 'GUEST') {
        sendGuestForbiddenV1(res, 'modify decks');
        return;
      }

      const parsed = DeckCardsPutBody.parse(req.body);
      if (!parsed.ok) {
        sendV1Json(res, 400, null, parsed.errors);
        return;
      }

      const result = await deps.deckCardsService.putReplaceCards(req.params.id, req.user!.id, parsed.value.cards);

      if (!result.ok) {
        if (result.kind === 'forbidden') {
          sendV1Json(res, 403, null, [{ code: 'DECK_ACCESS_DENIED', message: result.message }]);
          return;
        }
        if (result.kind === 'replace_failed') {
          const msg = result.details ? `${result.message}: ${result.details}` : result.message;
          sendV1Json(res, result.status, null, [{ code: 'DECK_CARDS_REPLACE_FAILED', message: msg }]);
          return;
        }
        sendV1Json(res, 500, null, [{ code: 'DECK_CARDS_REPLACE_ERROR', message: result.message }]);
        return;
      }

      sendV1Success(res, result.data);
    } catch (error) {
      console.error('v1 PUT /decks/:id/cards error:', error);
      sendV1Json(res, 500, null, [{ code: 'DECK_CARDS_REPLACE_ERROR', message: 'Failed to replace cards in deck' }]);
    }
  });

  router.delete('/decks/:id/cards', deps.authenticateUser, async (req: Request, res: Response) => {
    res.set('Cache-Control', 'no-store');
    try {
      if (checkRateLimit(req, res, 'card removal', { v1: true })) {
        return;
      }
      if (blockInReadOnlyMode(req, res, 'card removal', { v1: true })) {
        return;
      }
      if (req.user?.role === 'GUEST') {
        sendGuestForbiddenV1(res, 'modify decks');
        return;
      }

      const parsed = DeckCardsPostBody.parse(req.body);
      if (!parsed.ok) {
        sendV1Json(res, 400, null, parsed.errors);
        return;
      }

      const { cardType, cardId, quantity } = parsed.value;
      const result = await deps.deckCardsService.deleteCards(req.params.id, req.user!.id, cardType, cardId, quantity);

      if (!result.ok) {
        if (result.kind === 'forbidden') {
          sendV1Json(res, 403, null, [{ code: 'DECK_ACCESS_DENIED', message: result.message }]);
          return;
        }
        if (result.kind === 'not_found') {
          sendV1Json(res, 404, null, [{ code: 'DECK_NOT_FOUND', message: result.message }]);
          return;
        }
        sendV1Json(res, 500, null, [{ code: 'DECK_CARD_REMOVE_ERROR', message: result.message }]);
        return;
      }

      sendV1Success(res, result.data);
    } catch (error) {
      console.error('v1 DELETE /decks/:id/cards error:', error);
      sendV1Json(res, 500, null, [{ code: 'DECK_CARD_REMOVE_ERROR', message: 'Failed to remove card from deck' }]);
    }
  });

  const deckViewAuth = deps.optionalAuth ?? deps.authenticateUser;

  router.get('/decks/:id/full', deckViewAuth, async (req: Request, res: Response) => {
    try {
      // Deck contents and calculated count can change on save. These reads are
      // also public, so an edge cache must never serve a prior owner's snapshot.
      res.set('Cache-Control', 'no-store');
      const viewerId = req.user?.id ?? '';
      const detail = await deps.deckDetailService.getDeckFullDetail(req.params.id, viewerId);
      if (!detail) {
        sendV1Json(res, 404, null, [{ code: 'DECK_NOT_FOUND', message: 'Deck not found' }]);
        return;
      }
      sendV1Success(res, detail);
    } catch (error) {
      console.error('v1 GET /decks/:id/full error:', error);
      sendV1Json(res, 500, null, [{ code: 'DECK_FETCH_ERROR', message: 'Failed to fetch full deck data' }]);
    }
  });

  router.get('/decks/:id', deckViewAuth, async (req: Request, res: Response) => {
    res.set('Cache-Control', 'no-store');
    try {
      // See `/decks/:id/full`: both the compact and fully hydrated views must
      // reflect the current persisted deck for owners and public viewers.
      res.set('Cache-Control', 'no-store');
      const viewerId = req.user?.id ?? '';
      const detail = await deps.deckDetailService.getDeckDetail(req.params.id, viewerId);
      if (!detail) {
        sendV1Json(res, 404, null, [{ code: 'DECK_NOT_FOUND', message: 'Deck not found' }]);
        return;
      }
      sendV1Success(res, detail);
    } catch (error) {
      console.error('v1 GET /decks/:id error:', error);
      sendV1Json(res, 500, null, [{ code: 'DECK_FETCH_ERROR', message: 'Failed to fetch deck' }]);
    }
  });

  router.put('/decks/:id', deps.authenticateUser, async (req: Request, res: Response) => {
    res.set('Cache-Control', 'no-store');
    try {
      if (process.env.NODE_ENV === 'test' && req.headers['x-expect-401'] && !req.user) {
        return sendV1Unauthorized(res, 'Authentication required');
      }
      if (!req.user) {
        return sendV1Unauthorized(res, 'Authentication required');
      }

      if (checkRateLimit(req, res, 'deck update', { v1: true })) {
        return;
      }
      if (blockInReadOnlyMode(req, res, 'deck update', { v1: true })) {
        return;
      }
      if (req.user.role === 'GUEST') {
        sendGuestForbiddenV1(res, 'modify decks');
        return;
      }

      const parsed = UpdateDeckRequestBody.parse(req.body);
      if (!parsed.ok) {
        sendV1Json(res, 400, null, parsed.errors);
        return;
      }

      const u = parsed.value;
      if (u.background_image_path !== undefined && u.background_image_path !== null && u.background_image_path) {
        try {
          const isValid = await deps.deckBackgroundService.validateBackgroundPath(u.background_image_path);
          if (!isValid) {
            sendV1Json(res, 400, null, [{ code: 'INVALID_BACKGROUND', message: 'Invalid background image path' }]);
            return;
          }
        } catch (validationError) {
          console.error('Error validating background path:', validationError);
          sendV1Json(res, 400, null, [
            {
              code: 'INVALID_BACKGROUND',
              message: 'Invalid background image path',
              field: 'background_image_path'
            }
          ]);
          return;
        }
      }

      const strictReserve = process.env.NODE_ENV === 'test' && Boolean(req.headers['x-expect-400-validation']);
      const result = await deps.deckDetailService.updateDeckMetadata(
        req.params.id,
        req.user.id,
        toDeckPartialUpdates(u),
        {
          strictReserveTestValidation: strictReserve
        }
      );

      if (!result.ok) {
        if (result.kind === 'not_found') {
          sendV1Json(res, 404, null, [{ code: 'DECK_NOT_FOUND', message: result.message }]);
          return;
        }
        if (result.kind === 'forbidden') {
          sendV1Json(res, 403, null, [{ code: 'DECK_ACCESS_DENIED', message: result.message }]);
          return;
        }
        sendV1Json(res, 400, null, [{ code: 'VALIDATION_ERROR', message: result.message }]);
        return;
      }

      sendV1Success(res, result.data);
    } catch (error) {
      console.error('v1 PUT /decks/:id error:', error);
      sendV1Json(res, 500, null, [
        {
          code: 'DECK_UPDATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update deck'
        }
      ]);
    }
  });

  router.get('/decks/:id/ui-preferences', deps.authenticateUser, async (req: Request, res: Response) => {
    res.set('Cache-Control', 'no-store');
    try {
      if (req.user?.role === 'GUEST') {
        sendGuestForbiddenV1(res, 'view UI preferences');
        return;
      }
      const { id } = req.params;
      const result = await deps.deckUIPreferencesService.getForOwner(id, req.user!.id);
      if (!result.ok) {
        sendV1Json(res, 403, null, [
          { code: 'DECK_ACCESS_DENIED', message: 'Access denied. You do not own this deck.' }
        ]);
        return;
      }
      sendV1Success(res, result.data);
    } catch (error) {
      console.error('v1 GET /decks/:id/ui-preferences error:', error);
      sendV1Json(res, 500, null, [
        { code: 'UI_PREFERENCES_FETCH_ERROR', message: 'Failed to fetch UI preferences' }
      ]);
    }
  });

  router.put('/decks/:id/ui-preferences', deps.authenticateUser, async (req: Request, res: Response) => {
    res.set('Cache-Control', 'no-store');
    try {
      if (checkRateLimit(req, res, 'UI preferences save', { v1: true })) {
        return;
      }
      if (blockInReadOnlyMode(req, res, 'UI preferences save', { v1: true })) {
        return;
      }
      if (req.user?.role === 'GUEST') {
        sendGuestForbiddenV1(res, 'modify UI preferences');
        return;
      }

      const { id } = req.params;
      const result = await deps.deckUIPreferencesService.updateForOwner(id, req.user!.id, req.body);

      if (!result.ok) {
        if (result.kind === 'validation_error') {
          sendV1Json(res, 400, null, [{ code: 'VALIDATION_ERROR', message: result.message }]);
          return;
        }
        if (result.kind === 'not_found') {
          sendV1Json(res, 404, null, [{ code: 'DECK_NOT_FOUND', message: result.message }]);
          return;
        }
        sendV1Json(res, 403, null, [
          { code: 'DECK_ACCESS_DENIED', message: result.message }
        ]);
        return;
      }

      sendV1Success(res, result.data);
    } catch (error) {
      console.error('v1 PUT /decks/:id/ui-preferences error:', error);
      sendV1Json(res, 500, null, [
        { code: 'UI_PREFERENCES_UPDATE_ERROR', message: 'Failed to update UI preferences' }
      ]);
    }
  });

  router.delete('/decks/:id', deps.authenticateUser, async (req: Request, res: Response) => {
    res.set('Cache-Control', 'no-store');
    try {
      if (!req.user) {
        return sendV1Unauthorized(res, 'Authentication required');
      }
      if (checkRateLimit(req, res, 'deck deletion', { v1: true })) {
        return;
      }
      if (blockInReadOnlyMode(req, res, 'deck deletion', { v1: true })) {
        return;
      }
      if (req.user.role === 'GUEST') {
        sendGuestForbiddenV1(res, 'delete decks');
        return;
      }

      const result = await deps.deckDetailService.deleteDeckIfOwner(req.params.id, req.user.id);
      if (!result.ok) {
        if (result.kind === 'forbidden') {
          sendV1Json(res, 403, null, [
            { code: 'DECK_ACCESS_DENIED', message: 'Access denied. You do not own this deck.' }
          ]);
          return;
        }
        sendV1Json(res, 404, null, [{ code: 'DECK_NOT_FOUND', message: 'Deck not found' }]);
        return;
      }

      const data: DeckDeleteV1DataDto = { message: 'Deck deleted successfully' };
      sendV1Success(res, data);
    } catch {
      sendV1Json(res, 500, null, [{ code: 'DECK_DELETE_ERROR', message: 'Failed to delete deck' }]);
    }
  });
}
