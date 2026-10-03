import type { Application, IRouter, RequestHandler } from 'express';
import express from 'express';
import type { AuthenticationService } from '../../services/AuthenticationService';
import type { UserRole } from '../../types';
import { resolveJwtConfig } from '../config/jwtConfig';
import { V1JwtTokenService } from '../services/v1JwtTokenService';
import { RefreshTokenService } from '../services/refreshTokenService';
import { CatalogService } from '../services/catalogService';
import { DbvSupportService } from '../services/dbvSupportService';
import { RecentUpdatesService } from '../services/recentUpdatesService';
import { registerAuthV1HttpRoutes } from './auth.http';
import { registerDbvCatalogV1HttpRoutes } from './dbv-catalog.http';
import { registerDbvSupportV1HttpRoutes, type DeckBackgroundListReader } from './dbv-support.http';
import { createV1SessionOrBearerAuthMiddleware } from './middleware/v1SessionOrBearerAuth';
import { createV1OptionalSessionOrBearerAuthMiddleware } from './middleware/v1OptionalSessionOrBearerAuth';
import { createApiAccessLogMiddleware } from './middleware/apiAccessLog';
import { registerDecksV1HttpRoutes } from './decks.http';
import { registerCommunityV1HttpRoutes } from './community.http';
import { registerCollectionsV1HttpRoutes } from './collections.http';
import { registerGuestDecksV1HttpRoutes } from './guest-decks.http';
import { registerAdminV1HttpRoutes } from './admin.http';
import { registerRecentUpdatesV1HttpRoutes } from './recent-updates.http';
import { registerUsersV1HttpRoutes } from './users.http';
import { registerFeedbackV1HttpRoutes } from './feedback.http';
import { registerSavedDatabaseViewsV1HttpRoutes } from './saved-database-views.http';
import type { AdminService } from '../services/adminService';
import type { AdminBizOpsDashboardService } from '../services/adminBizOpsDashboardService';
import type { CollectionService } from '../../services/collectionService';
import type { GuestDeckService } from '../services/guestDeckService';
import type { DeckListService } from '../services/deckListService';
import type { DeckStatsService } from '../services/deckStatsService';
import type { DeckWriteService } from '../services/deckWriteService';
import type { DeckDetailService } from '../services/deckDetailService';
import type { DeckCardsService } from '../services/deckCardsService';
import type { DeckUIPreferencesService } from '../services/deckUIPreferencesService';
import type { UserAccountService } from '../services/userAccountService';
import type { CommunityService } from '../services/communityService';
import type { FeedbackService } from '../services/feedbackService';
import type { SavedDatabaseViewService } from '../services/savedDatabaseViewService';
import type { SavedDatabaseViewAccessPolicy } from '../services/savedDatabaseViewAccessPolicy';
import type { Pool } from 'pg';
import { COMMUNITY_DECKS_USER_ID } from '../../constants/communityDecksUser';
import { TOURNAMENT_DECKS_USER_ID } from '../../constants/tournamentDecksUser';

export interface RegisterApiV1Deps {
  authenticationService: AuthenticationService;
  userRepository: {
    getUserById: (id: string) => Promise<
      | {
          id: string;
          name: string;
          email: string;
          role: UserRole;
          lastLoginAt?: Date | null;
          displayName?: string | null;
          authProvider?: string;
        }
      | undefined
      | null
    >;
    updateLastLoginAt: (id: string) => Promise<void>;
  };
  catalogService: CatalogService;
  dbvSupportService: DbvSupportService;
  recentUpdatesService: RecentUpdatesService;
  authenticateUser: RequestHandler;
  /** Optional auth: attaches req.user when present, never rejects (guest-viewable reads). */
  optionalAuthenticate: RequestHandler;
  deckBackgroundService: DeckBackgroundListReader;
  deckListService: DeckListService;
  deckStatsService: DeckStatsService;
  deckWriteService: DeckWriteService;
  deckDetailService: DeckDetailService;
  deckCardsService: DeckCardsService;
  deckUIPreferencesService: DeckUIPreferencesService;
  collectionService: CollectionService;
  guestDeckService: GuestDeckService;
  adminService: AdminService;
  bizOpsDashboardService: AdminBizOpsDashboardService;
  userAccountService: UserAccountService;
  communityService: CommunityService;
  feedbackService: FeedbackService;
  savedDatabaseViewService: SavedDatabaseViewService;
  savedDatabaseViewAccessPolicy: SavedDatabaseViewAccessPolicy;
  /** Phase 2: when provided, enables refresh tokens + Bearer on decks/collections. */
  pool?: Pool;
}

/**
 * Returns the `/api/v1` router (no mount). Use for tests, or mount on a standalone app at `/api/v1`.
 */
export function createApiV1Router(deps: RegisterApiV1Deps): IRouter {
  const jwtConfig = resolveJwtConfig();
  const jwtTokenService = new V1JwtTokenService(jwtConfig);
  const refreshTokenService = deps.pool
    ? new RefreshTokenService(deps.pool, {
        secret: jwtConfig.secret,
        ttlSeconds: jwtConfig.refreshTtlSeconds ?? 30 * 24 * 60 * 60
      })
    : undefined;
  const router = express.Router();

  // Phase 2 §6.1.6 — async audit log for every /api/v1/* request. Wired here
  // so it sees req.user populated by downstream auth middleware via `finish`.
  if (deps.pool) {
    router.use(createApiAccessLogMiddleware({ pool: deps.pool }));
  }

  const getUserById = async (id: string) => {
    const u = await deps.userRepository.getUserById(id);
    return u ?? null;
  };

  const catalogOptionalAuth: RequestHandler =
    process.env.DISABLE_BEARER_DECKS_COLLECTIONS === '1'
      ? deps.optionalAuthenticate
      : createV1OptionalSessionOrBearerAuthMiddleware({
          jwtTokenService,
          getUserById,
          optionalAuthenticate: deps.optionalAuthenticate
        });

  /**
   * Phase 2 §6.1.5: decks + collections accept either a session cookie or a
   * Bearer JWT. When `DISABLE_BEARER_DECKS_COLLECTIONS=1` is set, we fall back
   * to session-cookie-only auth (pre-Phase-2 behavior).
   */
  const ownedAuth: RequestHandler =
    process.env.DISABLE_BEARER_DECKS_COLLECTIONS === '1'
      ? deps.authenticateUser
      : createV1SessionOrBearerAuthMiddleware({
          jwtTokenService,
          getUserById,
          authenticateUser: deps.authenticateUser
        });

  const authDeps: Parameters<typeof registerAuthV1HttpRoutes>[1] = {
    authenticationService: deps.authenticationService,
    userRepository: deps.userRepository,
    jwtTokenService
  };
  if (refreshTokenService) {
    authDeps.refreshTokenService = refreshTokenService;
  }
  registerAuthV1HttpRoutes(router, authDeps);

  registerDbvCatalogV1HttpRoutes(router, {
    catalogService: deps.catalogService,
    catalogAuth: catalogOptionalAuth
  });

  registerDbvSupportV1HttpRoutes(router, {
    dbvSupportService: deps.dbvSupportService,
    catalogAuth: catalogOptionalAuth,
    deckBackgroundService: deps.deckBackgroundService
  });

  registerRecentUpdatesV1HttpRoutes(router, {
    recentUpdatesService: deps.recentUpdatesService,
    catalogAuth: catalogOptionalAuth
  });

  // Optional auth for guest-viewable community reads (feed + public profiles):
  // attaches req.user when a session cookie or Bearer JWT is present, never rejects.
  const optionalOwnedAuth: RequestHandler =
    process.env.DISABLE_BEARER_DECKS_COLLECTIONS === '1'
      ? deps.optionalAuthenticate
      : createV1OptionalSessionOrBearerAuthMiddleware({
          jwtTokenService,
          getUserById,
          optionalAuthenticate: deps.optionalAuthenticate
        });

  // Register BEFORE decks so `GET /decks/favorites` beats the `/decks/:id` param route.
  registerCommunityV1HttpRoutes(router, {
    communityService: deps.communityService,
    authenticateUser: ownedAuth,
    optionalAuth: optionalOwnedAuth
  });

  registerDecksV1HttpRoutes(router, {
    deckListService: deps.deckListService,
    deckStatsService: deps.deckStatsService,
    deckWriteService: deps.deckWriteService,
    deckDetailService: deps.deckDetailService,
    deckCardsService: deps.deckCardsService,
    deckBackgroundService: deps.deckBackgroundService,
    authenticateUser: ownedAuth,
    optionalAuth: optionalOwnedAuth,
    deckUIPreferencesService: deps.deckUIPreferencesService,
    communityDecksUserId: COMMUNITY_DECKS_USER_ID,
    tournamentDecksUserId: TOURNAMENT_DECKS_USER_ID
  });

  registerCollectionsV1HttpRoutes(router, {
    collectionService: deps.collectionService,
    authenticateUser: ownedAuth
  });

  registerSavedDatabaseViewsV1HttpRoutes(router, {
    savedDatabaseViewService: deps.savedDatabaseViewService,
    accessPolicy: deps.savedDatabaseViewAccessPolicy,
    authenticateUser: ownedAuth
  });

  registerGuestDecksV1HttpRoutes(router, {
    guestDeckService: deps.guestDeckService,
    authenticateUser: deps.authenticateUser
  });

  registerAdminV1HttpRoutes(router, {
    adminService: deps.adminService,
    bizOpsDashboardService: deps.bizOpsDashboardService,
    authenticateUser: deps.authenticateUser
  });

  registerUsersV1HttpRoutes(router, {
    userAccountService: deps.userAccountService,
    authenticateUser: deps.authenticateUser
  });

  registerFeedbackV1HttpRoutes(router, {
    feedbackService: deps.feedbackService,
    authenticateUser: deps.authenticateUser
  });

  return router;
}

/**
 * Mounts `/api/v1` JSON API (Bearer JWT + v1 envelope). Call from composition root after `setupMiddleware`.
 */
export function registerApiV1Routes(app: Application, deps: RegisterApiV1Deps): void {
  app.use('/api/v1', createApiV1Router(deps));
}
