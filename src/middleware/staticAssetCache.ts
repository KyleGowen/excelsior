import type { NextFunction, Request, Response } from 'express';
import path from 'path';

export const APP_SHELL_CACHE_CONTROL = 'no-cache, no-store, must-revalidate';
export const SHORT_STATIC_CACHE_CONTROL = 'public, max-age=300';
export const IMMUTABLE_FRONTEND_CACHE_CONTROL = 'public, max-age=31536000, immutable';

const SHORT_CACHE_EXTENSIONS = new Set([
  '.css',
  '.js',
  '.json',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.gif',
  '.svg',
  '.ico',
  '.woff',
  '.woff2',
]);

function normalizeFilePath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

export function setNoStoreHeaders(res: Response): void {
  res.setHeader('Cache-Control', APP_SHELL_CACHE_CONTROL);
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
}

export function setStaticAssetCacheHeaders(res: Response, filePath: string): void {
  const normalizedPath = normalizeFilePath(filePath);
  const ext = path.extname(normalizedPath).toLowerCase();

  if (ext === '.html') {
    setNoStoreHeaders(res);
    return;
  }

  if (SHORT_CACHE_EXTENSIONS.has(ext)) {
    res.setHeader('Cache-Control', SHORT_STATIC_CACHE_CONTROL);
  }
}

/** Only frontend build mounts opt in; a content change generates a new Vite URL. */
export function setFrontendAssetCacheHeaders(res: Response, filePath: string): void {
  const filename = path.posix.basename(normalizeFilePath(filePath));
  if (/^.+-[A-Za-z0-9_-]{8,}\.(?:js|css)$/.test(filename)) {
    res.setHeader('Cache-Control', IMMUTABLE_FRONTEND_CACHE_CONTROL);
    return;
  }
  setStaticAssetCacheHeaders(res, filePath);
}

function cdnHostnameFromBaseUrl(cdnBaseUrl: string): string | null {
  if (!cdnBaseUrl) {
    return null;
  }
  try {
    return new URL(cdnBaseUrl).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * All hostnames the client (or the edge) may use for this request. Express
 * `req.hostname` can differ from the raw `Host` header and from
 * `X-Forwarded-Host` when nginx/proxy/CloudFront forward to Node.
 */
function stripHostPort(value: string): string {
  const t = value.trim().toLowerCase();
  if (t.startsWith('[')) {
    const end = t.indexOf(']');
    if (end > 0) {
      return t.slice(0, end + 1);
    }
  }
  // IPv6 without brackets (e.g. ::1) — do not treat last segment as a port
  if (t.includes(':') && t.split(':').length > 2) {
    return t;
  }
  const i = t.lastIndexOf(':');
  if (i > 0 && /^\d{1,5}$/.test(t.slice(i + 1))) {
    return t.slice(0, i);
  }
  return t;
}

function requestHostHeaderNames(req: Request): string[] {
  const out = new Set<string>();
  const add = (s: string | undefined) => {
    if (!s) return;
    for (const part of s.split(',')) {
      const t = part.trim();
      if (!t) continue;
      const h = stripHostPort(t);
      if (h) out.add(h);
    }
  };
  if (req.hostname) add(req.hostname);
  add(req.get('host'));
  add(req.get('x-forwarded-host'));
  return [...out];
}

/**
 * The browser/edge is already asking for the exact CDN URL we would redirect
 * to; emitting 302 to the same URL causes ERR_TOO_MANY_REDIRECTS.
 */
function isRedirectSameAsRequestUrl(req: Request, intendedRedirect: string, cdnBaseUrl: string): boolean {
  if (!intendedRedirect) return true;
  let redirect: URL;
  try {
    redirect = new URL(intendedRedirect);
  } catch {
    return false;
  }
  const cdn = cdnHostnameFromBaseUrl(cdnBaseUrl);
  if (!cdn || redirect.hostname.toLowerCase() !== cdn) {
    return false;
  }
  const wantPathAndQuery = (req.originalUrl || '').split('#')[0] || '';
  if (redirect.pathname + redirect.search !== wantPathAndQuery) {
    return false;
  }
  for (const h of requestHostHeaderNames(req)) {
    if (h === cdn) {
      return true;
    }
  }
  return false;
}

export function buildStaticImageCdnRedirectUrl(originalUrl: string, cdnBaseUrl = process.env.CDN_BASE_URL || ''): string | null {
  const cdnBase = cdnBaseUrl.replace(/\/$/, '');
  if (!cdnBase || !originalUrl.startsWith('/src/resources/images/')) {
    return null;
  }
  return cdnBase + originalUrl;
}

/**
 * When `Host` matches a case where a 302 to `CDN_BASE_URL` + path would be
 * self-referential, the browser or edge sees ERR_TOO_MANY_REDIRECTS. Fall through
 * to `express.static` instead:
 *
 * - CloudFront custom origin: `Host` is the origin FQDN (e.g. origin.excelsior.cards;
 *   see `infra/cloudfront.tf`).
 * - Same host as `CDN_BASE_URL` (e.g. d6vp4hrkfkf5v.cloudfront.net when the request
 *   hits the app with that Host while `CDN_BASE_URL` points at the same distribution).
 * - When any `Host` / `X-Forwarded-Host` name matches the CDN hostname (not only
 *   `req.hostname`, which can differ from `Host` behind some proxies).
 * - When the effective request is already the same URL as the redirect target
 *   (see `isRedirectSameAsRequestUrl`).
 *
 * `STATIC_IMAGE_CDN_REDIRECT=0` — emergency kill switch: never 302, always static.
 */
export function shouldSkipCdnImageRedirect(
  req: Request,
  cdnBaseUrl: string = process.env.CDN_BASE_URL || '',
  originalUrl: string = req.originalUrl
): boolean {
  if (process.env.STATIC_IMAGE_CDN_REDIRECT === '0') {
    return true;
  }
  const cdnHost = cdnHostnameFromBaseUrl(cdnBaseUrl);
  const intended = buildStaticImageCdnRedirectUrl(originalUrl, cdnBaseUrl);
  if (intended && cdnHost && isRedirectSameAsRequestUrl(req, intended, cdnBaseUrl)) {
    return true;
  }
  for (const h of requestHostHeaderNames(req)) {
    if (h.startsWith('origin.')) {
      return true;
    }
    if (h === 'localhost' || h === '127.0.0.1' || h === '[::1]' || h === '::1') {
      return true;
    }
    if (cdnHost && h === cdnHost) {
      return true;
    }
  }
  return false;
}

export function redirectStaticImagesToCdn(req: Request, res: Response, next: NextFunction): void {
  const redirectUrl = buildStaticImageCdnRedirectUrl(req.originalUrl);
  if (!redirectUrl) {
    next();
    return;
  }
  if (shouldSkipCdnImageRedirect(req, process.env.CDN_BASE_URL, req.originalUrl)) {
    next();
    return;
  }
  res.redirect(302, redirectUrl);
}
