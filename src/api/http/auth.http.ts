import type { Router } from 'express';
import { z } from 'zod';
import type { AuthenticationService } from '../../services/AuthenticationService';
import { V1JwtTokenService } from '../services/v1JwtTokenService';
import { RefreshTokenService } from '../services/refreshTokenService';
import { LoginRequestBody } from './models/auth/LoginRequestBody';
import { sendV1Json, sendV1Success } from './v1Envelope';
import { parseV1Body } from './parseV1Body';
import { v1LoginRateLimit } from './middleware/v1LoginRateLimit';
import { createV1BearerAuthMiddleware } from './middleware/v1BearerAuth';
import type { LoginSuccessDataDto } from '../dto/v1/LoginSuccessDataDto';
import type { AuthMeDataDto } from '../dto/v1/AuthMeDataDto';

// Phase 2 §6.1.7 — zod schema for POST /api/v1/auth/refresh bodies.
// Parsed via parseV1Body so validation errors emit the standard
// { code: 'VALIDATION_ERROR', field: 'refreshToken', ... } envelope.
const RefreshRequestSchema = z.object({
  refreshToken: z
    .string({ error: 'refreshToken is required' })
    .min(1, 'refreshToken is required'),
});

export interface AuthV1HttpDeps {
  authenticationService: AuthenticationService;
  userRepository: {
    getUserById: (id: string) => Promise<
      | {
          id: string;
          name: string;
          email: string;
          role: AuthMeDataDto['role'];
          lastLoginAt?: Date | null;
          displayName?: string | null;
          authProvider?: string;
        }
      | undefined
      | null
    >;
    updateLastLoginAt: (id: string) => Promise<void>;
  };
  jwtTokenService: V1JwtTokenService;
  /**
   * Phase 2 §6.1.1-§6.1.4: optional. Absent or `DISABLE_AUTH_REFRESH=1` keeps
   * legacy shape (no refresh token, `/auth/refresh` → 501, `/auth/logout` no-op).
   */
  refreshTokenService?: RefreshTokenService;
}

function isRefreshDisabled(): boolean {
  return process.env.DISABLE_AUTH_REFRESH === '1';
}

export function registerAuthV1HttpRoutes(router: Router, deps: AuthV1HttpDeps): void {
  const bearerAuth = createV1BearerAuthMiddleware({
    jwtTokenService: deps.jwtTokenService,
    getUserById: async (id: string) => {
      const u = await deps.userRepository.getUserById(id);
      return u ?? null;
    }
  });

  router.post('/auth/login', v1LoginRateLimit, async (req, res) => {
    const parsed = LoginRequestBody.parse(req.body);
    if (!parsed.ok) {
      sendV1Json(res, 400, null, parsed.errors);
      return;
    }
    const user = await deps.authenticationService.authenticateUser({
      username: parsed.value.username,
      password: parsed.value.password
    });
    if (!user) {
      sendV1Json(res, 401, null, [
        { code: 'INVALID_CREDENTIALS', message: 'Invalid username or password' }
      ]);
      return;
    }
    try {
      await deps.userRepository.updateLastLoginAt(user.id);
    } catch {
      // Non-fatal; mirrors session cookie login behavior.
    }
    const { token, expiresInSeconds } = deps.jwtTokenService.signAccessToken(user);
    const data: LoginSuccessDataDto = {
      accessToken: token,
      tokenType: 'Bearer',
      expiresInSeconds,
      user: { id: user.id, username: user.name, role: user.role }
    };

    if (deps.refreshTokenService && !isRefreshDisabled()) {
      try {
        const issued = await deps.refreshTokenService.issue(user.id);
        data.refreshToken = issued.refreshToken;
        data.refreshExpiresInSeconds = Math.max(
          0,
          Math.floor((issued.expiresAt.getTime() - Date.now()) / 1000)
        );
      } catch (error) {
        console.error('v1 /auth/login refresh issue failed (continuing without refresh):', error);
      }
    }

    sendV1Success(res, data);
  });

  router.post('/auth/refresh', async (req, res) => {
    if (!deps.refreshTokenService || isRefreshDisabled()) {
      sendV1Json(res, 501, null, [
        { code: 'REFRESH_DISABLED', message: 'Refresh flow is not enabled on this server' }
      ]);
      return;
    }
    const parsed = parseV1Body(RefreshRequestSchema, req.body, res);
    if (!parsed) return;
    const raw = parsed.value.refreshToken;
    try {
      const { row } = await deps.refreshTokenService.verify(raw);
      const full = await deps.userRepository.getUserById(row.userId);
      if (!full) {
        sendV1Json(res, 401, null, [{ code: 'UNAUTHORIZED', message: 'User not found' }]);
        return;
      }
      const rotated = await deps.refreshTokenService.rotate(row.jti, row.userId);
      const access = deps.jwtTokenService.signAccessToken({
        id: full.id,
        name: full.name,
        email: full.email,
        role: full.role
      });
      const data: LoginSuccessDataDto = {
        accessToken: access.token,
        tokenType: 'Bearer',
        expiresInSeconds: access.expiresInSeconds,
        refreshToken: rotated.refreshToken,
        refreshExpiresInSeconds: Math.max(
          0,
          Math.floor((rotated.expiresAt.getTime() - Date.now()) / 1000)
        ),
        user: { id: full.id, username: full.name, role: full.role }
      };
      sendV1Success(res, data);
    } catch (error) {
      const code = (error as Error & { code?: string }).code ?? 'REFRESH_INVALID';
      if (code === 'REFRESH_REUSED') {
        sendV1Json(res, 401, null, [
          { code: 'REFRESH_REUSED', message: 'Refresh token reuse detected; family revoked' }
        ]);
        return;
      }
      if (code === 'REFRESH_EXPIRED') {
        sendV1Json(res, 401, null, [{ code: 'REFRESH_EXPIRED', message: 'Refresh token expired' }]);
        return;
      }
      sendV1Json(res, 401, null, [{ code: 'REFRESH_INVALID', message: 'Invalid refresh token' }]);
    }
  });

  router.get('/auth/me', bearerAuth, async (req, res) => {
    try {
      const sessionUser = req.user!;
      const full = await deps.userRepository.getUserById(sessionUser.id);
      if (!full) {
        sendV1Json(res, 401, null, [{ code: 'UNAUTHORIZED', message: 'User not found' }]);
        return;
      }
      const data: AuthMeDataDto = {
        id: full.id,
        username: full.name,
        email: full.email,
        role: full.role,
        lastLoginAt: full.lastLoginAt ? full.lastLoginAt.toISOString() : null,
        displayName: full.displayName ?? null,
        authProvider: full.authProvider ?? 'password'
      };
      sendV1Success(res, data);
    } catch (error) {
      console.error('v1 /auth/me error:', error);
      sendV1Json(res, 500, null, [{ code: 'INTERNAL_ERROR', message: 'Failed to load user' }]);
    }
  });

  router.post('/auth/logout', async (req, res) => {
    if (!deps.refreshTokenService || isRefreshDisabled()) {
      sendV1Success(res, { loggedOut: true });
      return;
    }
    const body = (req.body ?? {}) as Record<string, unknown>;
    const raw = body.refreshToken;
    if (typeof raw === 'string' && raw.length > 0) {
      try {
        const { row } = await deps.refreshTokenService.verify(raw);
        await deps.refreshTokenService.revokeByJti(row.jti);
      } catch {
        // Ignore invalid/expired refresh; logout is best-effort.
      }
    }
    sendV1Success(res, { loggedOut: true });
  });
}
