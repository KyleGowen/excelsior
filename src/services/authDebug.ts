import type { Request } from 'express';

/**
 * Lightweight, toggleable auth diagnostics.
 *
 * Enabled by default so we can debug the "random logout" reports without a
 * redeploy. Set `DEBUG_AUTH=0` (or `DEBUG_AUTH=false`) to silence it once the
 * issue is confirmed fixed. All logs are prefixed with `[auth-debug]` so they
 * are easy to grep/exclude in the container logs.
 *
 * Never log session material, including token prefixes.
 */
export function isAuthDebugEnabled(): boolean {
  const flag = process.env.DEBUG_AUTH;
  return flag !== '0' && flag !== 'false';
}

export function debugAuth(message: string, details?: Record<string, unknown>): void {
  if (!isAuthDebugEnabled()) {
    return;
  }
  if (details) {
    console.log(`[auth-debug] ${message}`, details);
  } else {
    console.log(`[auth-debug] ${message}`);
  }
}

/** Retained caller API; no part of a session credential reaches diagnostics. */
export function tokenPrefix(token: string | undefined | null): string {
  if (!token) {
    return '(none)';
  }
  return '[REDACTED]';
}

/**
 * Snapshot of the request properties that determine cookie attributes and
 * explain proxy/TLS-related logout bugs (HSTS upgrades, X-Forwarded-Proto, etc.).
 */
export function requestAuthContext(req: Request): Record<string, unknown> {
  const headers = req.headers ?? {};
  return {
    method: req.method,
    path: req.originalUrl,
    secure: req.secure,
    protocol: req.protocol,
    xForwardedProto: headers['x-forwarded-proto'] ?? null,
    host: headers.host ?? null,
    hasSessionCookie: Boolean(req.cookies?.sessionId),
  };
}
