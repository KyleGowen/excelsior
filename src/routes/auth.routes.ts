import express from 'express';
import type { AuthRoutesDeps } from './types';
import { debugAuth, requestAuthContext } from '../services/authDebug';
import { COMMUNITY_DECKS_USER_ID } from '../constants/communityDecksUser';
import { nativeDatabaseEnabled } from '../api/http/middleware/databaseAccess';
import { TOURNAMENT_DECKS_USER_ID } from '../constants/tournamentDecksUser';

export function registerAuthRoutes(app: express.Application, deps: AuthRoutesDeps): void {
  // Lightweight request logger for the auth surface (DEBUG_AUTH). Shows whether
  // the incoming request carried a sessionId cookie and over which protocol —
  // the fastest way to spot proxy/HSTS-driven cookie drops.
  app.use('/api/auth', (req, _res, next) => {
    debugAuth('incoming /api/auth request', requestAuthContext(req));
    next();
  });

  app.post('/api/auth/login', (req, res) => deps.authService.handleLogin(req, res));
  app.post('/api/auth/signup', (req, res) => deps.authService.handleSignup(req, res));
  app.post('/api/auth/google/preview', (req, res) => deps.authService.handleGoogleLoginPreview(req, res));
  app.post('/api/auth/google', (req, res) => deps.authService.handleGoogleLogin(req, res));
  app.post('/api/auth/logout', (req, res) => deps.authService.handleLogout(req, res));
  app.get('/api/auth/me', (req, res) => deps.authService.handleSessionValidation(req, res));

  app.get('/api/config/firebase', (req, res) => {
    const apiKey = process.env.FIREBASE_API_KEY || '';
    const authDomain = process.env.FIREBASE_AUTH_DOMAIN || '';
    const projectId = process.env.FIREBASE_PROJECT_ID || '';
    const appId = process.env.FIREBASE_APP_ID || '';
    res.json({ apiKey, authDomain, projectId, appId });
  });

  app.get('/api/v1/config/app', (req, res) => {
    const cdnBase = process.env.CDN_BASE_URL || '';
    res.set('Cache-Control', 'public, max-age=300');
    // communityDecksUserId: the internal community_decks account whose decks back the Home
    // "Community Decks" pool.
    res.json({
      cdnBase,
      communityDecksUserId: COMMUNITY_DECKS_USER_ID,
      tournamentDecksUserId: TOURNAMENT_DECKS_USER_ID,
      databaseServiceAdapter: nativeDatabaseEnabled(),
    });
  });
}
