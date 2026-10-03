import express, { Request } from 'express';
import type { PageRoutesDeps } from './types';
import { clearSessionCookieOptions } from '../services/authCookieOptions';
import { resolveSpaIndexPath } from './spaIndexPath';

const NO_CACHE_HTML = {
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  Pragma: 'no-cache',
  Expires: '0'
} as const;

/** Lets Firebase (and other) OAuth popups communicate with the opener; avoids COOP blocking `window.closed`. */
const HTML_POPUP_FRIENDLY_HEADERS = {
  'Cross-Origin-Opener-Policy': 'same-origin-allow-popups'
} as const;

function sendAppShell(res: express.Response): void {
  res.set({ ...NO_CACHE_HTML, ...HTML_POPUP_FRIENDLY_HEADERS });
  res.sendFile(resolveSpaIndexPath());
}

export function registerPageRoutes(app: express.Application, deps: PageRoutesDeps): void {
  app.get('/logout', async (req, res, next) => {
    try {
      const sessionId = req.cookies?.sessionId;
      if (sessionId) {
        await deps.authService.destroySession(sessionId);
      }
      res.clearCookie('sessionId', clearSessionCookieOptions(req));
      res.redirect('/');
    } catch (err) {
      next(err);
    }
  });

  app.get('/', (_req, res) => {
    sendAppShell(res);
  });

  app.get('/users/:userId/decks', (_req: Request, res) => {
    sendAppShell(res);
  });

  app.get('/users/:userId/decks/:deckId', (_req: Request, res) => {
    sendAppShell(res);
  });

  app.get('/users/:userId/collection', deps.authenticateUser, (_req: Request, res) => {
    sendAppShell(res);
  });

  app.get('/data', (_req, res) => {
    sendAppShell(res);
  });

  app.get('/home', (_req, res) => {
    sendAppShell(res);
  });

  app.get('/login', (_req, res) => {
    sendAppShell(res);
  });
}
