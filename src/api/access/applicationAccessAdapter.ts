import { SERVICE_HEADER } from './serviceAccessService';
import type { ServiceTokenDataDto } from '../dto/v1/ServiceTokenDataDto';
import { serviceScopeForOperation } from './serviceOperations';
import { DATABASE_SERVICE_PREFIX, isDatabaseRead } from './databaseOperations';

export interface ConfidentialClientCredentials { clientId: string; clientSecret: string }
export interface PlayerAccess { userAccessToken?: string; sessionCookie?: string }
export interface ApplicationRequestOptions {
  method?: string;
  body?: unknown;
  player?: PlayerAccess;
  signal?: AbortSignal;
  requestId?: string;
  ifNoneMatch?: string;
}

/** Server-only: caches application identity, never player cookies/tokens or user data. */
export class ApplicationAccessAdapter {
  private cachedToken: { value: string; expiresAt: number } | undefined;
  private issuance: Promise<string> | undefined;
  private readonly apiOrigin: string;
  constructor(
    apiBaseUrl: string,
    private readonly credentials: () => ConfidentialClientCredentials,
    private readonly fetcher: typeof fetch = fetch,
    private readonly now: () => number = Date.now,
    private readonly databaseOnly = false,
  ) {
    const url = new URL(apiBaseUrl);
    const local = process.env.NODE_ENV !== 'production' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    if (url.username || url.password || url.search || url.hash || url.pathname !== '/' || (url.protocol !== 'https:' && !(url.protocol === 'http:' && local))) throw new Error('API base must be an HTTPS origin (local HTTP is development-only)');
    this.apiOrigin = url.origin;
    if (databaseOnly && process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0') throw new Error('Database transport requires certificate verification');
  }
  private async token(): Promise<string> {
    if (this.cachedToken && this.now() < this.cachedToken.expiresAt - 5000) return this.cachedToken.value;
    if (this.issuance) return this.issuance;
    this.issuance = (async () => {
      const { clientId, clientSecret } = this.credentials();
      const tokenPath = this.databaseOnly ? DATABASE_SERVICE_PREFIX + '/service-auth/token' : '/api/v1/service-auth/token';
      const response = await this.fetcher(this.apiOrigin + tokenPath, { method: 'POST', redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(15000), headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ grant_type: 'client_credentials', client_id: clientId, client_secret: clientSecret, ...(this.databaseOnly ? { scope: 'catalog:read' } : {}) }) });
      if (!response.ok) throw new Error('Application service authentication failed');
      const payload = await response.json() as { data: ServiceTokenDataDto };
      const data = payload.data;
      if (!data || typeof data.accessToken !== 'string' || !data.accessToken || data.tokenType !== 'Bearer' || !Number.isFinite(data.expiresInSeconds) || data.expiresInSeconds < 30 || data.expiresInSeconds > 300) throw new Error('Invalid application token response');
      this.cachedToken = { value: data.accessToken, expiresAt: this.now() + data.expiresInSeconds * 1000 };
      return data.accessToken;
    })();
    try { return await this.issuance; } finally { this.issuance = undefined; }
  }
  async request(path: string, options: ApplicationRequestOptions = {}): Promise<Response> {
    const method = options.method ?? 'GET';
    const url = new URL(path, this.apiOrigin);
    if (!path.startsWith('/api/') || url.origin !== this.apiOrigin || url.hash || url.pathname !== path.split('?')[0] || /[%\\]/.test(url.pathname) || !serviceScopeForOperation(method, url.pathname)) throw new Error('Unsupported application operation');
    if (options.player?.userAccessToken && options.player.sessionCookie) throw new Error('Choose one verified player credential');
    if (this.databaseOnly && (!isDatabaseRead(method, url.pathname) || options.player !== undefined || options.body !== undefined)) throw new Error('Unsupported database operation');
    const send = async () => {
      const token = await this.token();
      const headers: Record<string, string> = { [SERVICE_HEADER]: 'Bearer ' + token };
      if (options.player?.userAccessToken) headers.Authorization = 'Bearer ' + options.player.userAccessToken;
      if (options.player?.sessionCookie) headers.Cookie = options.player.sessionCookie;
      if (options.requestId) headers['X-Request-Id'] = options.requestId;
      if (options.ifNoneMatch) headers['If-None-Match'] = options.ifNoneMatch;
      const init: RequestInit = { method, headers, redirect: 'error', signal: options.signal ? AbortSignal.any([options.signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000) };
      if (options.body !== undefined) { headers['Content-Type'] = 'application/json'; init.body = JSON.stringify(options.body); }
      const target = this.databaseOnly ? DATABASE_SERVICE_PREFIX + path.slice('/api/v1'.length) : path;
      return { response: await this.fetcher(this.apiOrigin + target, init), token };
    };
    const first = await send();
    if (first.response.status !== 401) return first.response;
    const failure = await first.response.clone().json().catch(() => null) as { errors?: Array<{ code?: string }> } | null;
    if (failure?.errors?.[0]?.code !== 'SERVICE_TOKEN_INVALID') return first.response;
    if (this.cachedToken?.value === first.token) this.cachedToken = undefined;
    return (await send()).response; // One service renewal; player renewal is a separate concern.
  }
}
