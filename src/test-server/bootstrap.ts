/**
 * Test app bootstrap: builds Express app with test deps and shared route registration.
 * Reuses registerRoutes from main app so test server does not duplicate route handlers.
 */
import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';

import { DataSourceConfig } from '../config/DataSourceConfig';
import { DeckPersistenceService } from '../services/deckPersistence';
import { DeckValidationService } from '../services/deckValidationService';
import { DeckService } from '../services/deckService';
import { AuthenticationService } from '../services/AuthenticationService';
import { NewUserSampleDeckService } from '../services/newUserSampleDeckService';
import { DeckBackgroundService } from '../services/deckBackgroundService';
import { CollectionsRepository } from '../database/collectionsRepository';
import { createSessionRepositoryFromDataSource } from '../database/sessionRepository';
import { CollectionService } from '../services/collectionService';
import { FoilCardMapRepository } from '../database/foilCardMapRepository';
import { CardErrataRepository } from '../database/cardErrataRepository';
import { registerRoutes, type RouteDependencies } from '../routes';
import { transformDeckList } from '../api/deckTransform';
import { CatalogService } from '../api/services/catalogService';
import { DbvSupportService } from '../api/services/dbvSupportService';
import { RecentUpdatesService } from '../api/services/recentUpdatesService';
import { DeckListService } from '../api/services/deckListService';
import { DeckStatsService } from '../api/services/deckStatsService';
import { DeckWriteService } from '../api/services/deckWriteService';
import { DeckDetailService } from '../api/services/deckDetailService';
import { DeckCardsService } from '../api/services/deckCardsService';
import { DeckUIPreferencesService } from '../api/services/deckUIPreferencesService';
import { GuestDeckService } from '../api/services/guestDeckService';
import { AdminService } from '../api/services/adminService';
import { AdminBizOpsDashboardService } from '../api/services/adminBizOpsDashboardService';
import { AwsCostLedgerRepository } from '../repository/AwsCostLedgerRepository';
import { UserAccountService } from '../api/services/userAccountService';
import { CommunityService } from '../api/services/communityService';
import { FeedbackService } from '../api/services/feedbackService';
import { PostgreSQLSavedDatabaseViewRepository } from '../database/savedDatabaseViewRepository';
import { SavedDatabaseViewService } from '../api/services/savedDatabaseViewService';
import { AdminSavedDatabaseViewAccessPolicy } from '../api/services/savedDatabaseViewAccessPolicy';
import { GUEST_USER_ID } from '../constants/guestUser';
import { TOURNAMENT_DECKS_USER_ID } from '../constants/tournamentDecksUser';
import { registerApiV1Routes } from '../api/http/registerApiV1Routes';
import { registerLegacyDeckReadCompatRoutes } from '../api/http/legacyDeckReadCompat.http';
import { requireAdmin, blockGuestMutation, requireDeckOwner } from '../middleware/authorizationHelpers';
import { setupMiddleware } from '../middleware/setup';

import {
  validateCardAddition,
  checkIfCardIsCataclysm,
  checkIfCardIsAssist,
  checkIfCardIsAmbush,
  checkIfCardIsFortification,
  checkIfCardIsOnePerDeck,
  databaseInit,
  guestDeckPersistence
} from '../index';

import { registerTestOnlyRoutes, type TestOnlyRoutesDeps } from './testOnlyRoutes';
import { sendV1Unauthorized } from '../api/http/v1Envelope';

// Importing from index runs it and ensures DataSourceConfig / DB init exist

// Build services/repos (same singletons as main app via DataSourceConfig)
new DeckPersistenceService();
const dataSource = DataSourceConfig.getInstance();
const userRepository = dataSource.getUserRepository();
const deckRepository = dataSource.getDeckRepository();
const cardRepository = dataSource.getCardRepository();
const deckValidationService = new DeckValidationService(cardRepository);
const deckBusinessService = new DeckService(deckRepository);
const newUserSampleDeckService = new NewUserSampleDeckService(userRepository, deckRepository, deckValidationService);
const sessionRepository = createSessionRepositoryFromDataSource(dataSource);
const authService = new AuthenticationService(userRepository, sessionRepository, newUserSampleDeckService);
const collectionsRepository = new CollectionsRepository(dataSource.getPool());
const collectionService = new CollectionService(collectionsRepository);
const deckBackgroundService = new DeckBackgroundService();
const foilCardMapRepository = new FoilCardMapRepository(dataSource.getPool());
const testPool = dataSource.getPool();
const cardErrataRepository = testPool ? new CardErrataRepository(testPool) : undefined;
const catalogService = new CatalogService(cardRepository, foilCardMapRepository, cardErrataRepository);
const dbvSupportService = new DbvSupportService(() => dataSource.getPool());
const recentUpdatesService = new RecentUpdatesService(() => dataSource.getPool());
const deckListService = new DeckListService(deckRepository);
const deckStatsService = new DeckStatsService(deckRepository);
const deckWriteService = new DeckWriteService(deckBusinessService, deckValidationService);
const deckDetailService = new DeckDetailService(deckRepository);
const deckCardsService = new DeckCardsService(deckRepository, {
  validateCardAddition,
  checkIfCardIsCataclysm,
  checkIfCardIsAssist,
  checkIfCardIsAmbush,
  checkIfCardIsFortification,
  checkIfCardIsOnePerDeck,
  validateDeck: (cards) => deckValidationService.validateDeck(cards)
});
const deckUIPreferencesService = new DeckUIPreferencesService(deckRepository);

const guestDeckService = new GuestDeckService({
  guestDeckPersistence,
  deckRepository,
  validateCardAddition,
  checkIfCardIsOnePerDeck,
  checkIfCardIsCataclysm
});

const awsCostLedgerRepository = new AwsCostLedgerRepository();
const bizOpsDashboardService = new AdminBizOpsDashboardService(awsCostLedgerRepository);
const adminService = new AdminService({
  userRepository,
  deckRepository,
  cardRepository,
  databaseInit
});

const userAccountService = new UserAccountService(userRepository);
const feedbackService = new FeedbackService({
  sendFeedbackEmail: async () => undefined
});
const communityService = new CommunityService(deckRepository, userRepository, [
  GUEST_USER_ID,
  TOURNAMENT_DECKS_USER_ID
]);
const savedDatabaseViewRepository = new PostgreSQLSavedDatabaseViewRepository(dataSource.getPool());
const savedDatabaseViewService = new SavedDatabaseViewService(savedDatabaseViewRepository);
const savedDatabaseViewAccessPolicy = new AdminSavedDatabaseViewAccessPolicy();

// Test auth: session cookie or x-test-user-id header; otherwise 401 (so routes that require auth still get 401 when unauthenticated)
const authenticateUser = authService.createAuthMiddleware();
const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.headers.cookie && req.headers.cookie.includes('sessionId=')) {
      await authenticateUser(req, res, next);
    } else if (req.headers['x-test-user-id']) {
      const userId = Array.isArray(req.headers['x-test-user-id'])
        ? req.headers['x-test-user-id'][0]
        : (req.headers['x-test-user-id'] as string);
      const user = await userRepository.getUserById(userId);
      if (user) req.user = user;
      next();
    } else {
      if (req.originalUrl.startsWith('/api/v1')) {
        sendV1Unauthorized(res, 'Authentication required');
      } else {
        res.status(401).json({ success: false, error: 'Authentication required' });
      }
    }
  } catch {
    next();
  }
};

// Truly-optional auth: attaches req.user when a session cookie or x-test-user-id
// header is present, but NEVER rejects (guest-viewable community reads).
const optionalAuthNeverReject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.headers.cookie && req.headers.cookie.includes('sessionId=')) {
      return optionalAuth(req, res, next);
    }
    const testUserId = req.headers['x-test-user-id'];
    if (testUserId) {
      const userId = Array.isArray(testUserId) ? testUserId[0] : (testUserId as string);
      const user = await userRepository.getUserById(userId);
      if (user) req.user = user;
    }
  } catch {
    // Optional auth must never block a public read.
  }
  next();
};

function getGitInfo() {
  return {
    commit: 'unknown',
    shortCommit: 'unknown',
    branch: 'unknown',
    commitDate: 'unknown',
    commitMessage: 'unknown',
    commitAuthor: 'unknown',
    commitEmail: 'unknown'
  };
}

const testDeps = {
  authService,
  authenticateUser: optionalAuth,
  deckRepository,
  cardRepository,
  catalogService,
  userRepository,
  deckValidationService,
  deckBusinessService,
  collectionService,
  deckBackgroundService,
  foilCardMapRepository,
  databaseInit,
  dataSource,
  validateCardAddition,
  checkIfCardIsCataclysm,
  checkIfCardIsAssist,
  checkIfCardIsAmbush,
  checkIfCardIsFortification,
  checkIfCardIsOnePerDeck,
  getGitInfo,
  requireAdmin,
  blockGuestMutation,
  requireDeckOwner,
  transformDeckList,
  userAccountService
} as unknown as RouteDependencies;

const app = express();
setupMiddleware(app);

// Global nav component files (test server used these explicit routes)
app.get('/components/globalNav.html', (_req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'components', 'globalNav.html'));
});
app.get('/components/globalNav.css', (_req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'components', 'globalNav.css'));
});
app.get('/components/globalNav.js', (_req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'components', 'globalNav.js'));
});

// Test-only routes first so lenient /users/:userId/decks take precedence over auth-required page routes
registerTestOnlyRoutes(app, {
  deckRepository,
  authenticateUser: optionalAuth
} as TestOnlyRoutesDeps);
registerRoutes(app, testDeps);

registerApiV1Routes(app, {
  authenticationService: authService,
  userRepository,
  catalogService,
  dbvSupportService,
  recentUpdatesService,
  authenticateUser: optionalAuth,
  optionalAuthenticate: optionalAuthNeverReject,
  deckBackgroundService,
  deckListService,
  deckStatsService,
  deckWriteService,
  deckDetailService,
  deckCardsService,
  deckUIPreferencesService,
  collectionService,
  guestDeckService,
  adminService,
  bizOpsDashboardService,
  userAccountService,
  communityService,
  feedbackService,
  savedDatabaseViewService,
  savedDatabaseViewAccessPolicy
});

registerLegacyDeckReadCompatRoutes(app, {
  authenticateUser: optionalAuth,
  deckDetailService
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  if (err instanceof SyntaxError && (err as SyntaxError & { status?: number }).status === 400 && 'body' in err) {
    return res.status(400).json({ success: false, error: 'Invalid JSON' });
  }
  res.status(500).json({ success: false, error: 'Internal server error' });
});

app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

// Re-export for lifecycle (closeTestServer needs guestDeckPersistence)
export { app, guestDeckPersistence, databaseInit, userRepository, deckRepository, cardRepository };
