/**
 * Shared fetch client for the Excelsior API.
 *
 * - Always sends cookies (`credentials: 'include'`) so the session-based
 *   `/api/auth/*` login works for all subsequent `/api/v1` calls.
 * - Unwraps the v1 envelope `{ data, success, errors, meta }`.
 * - Throws `ApiError` with a useful message on non-2xx responses.
 */

export class ApiError extends Error {
  status: number;
  code?: string;
  /** v1 envelope `data` on error responses (e.g. structured validationErrors). */
  data?: unknown;
  constructor(message: string, status: number, code?: string, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    // Guard so we never assign an explicit `undefined` (exactOptionalPropertyTypes).
    if (code !== undefined) this.code = code;
    if (data !== undefined) this.data = data;
  }
}

interface V1Envelope<T> {
  data: T;
  success?: boolean;
  errors?: Array<{ message?: string; code?: string } | string>;
  meta?: Record<string, unknown>;
}

export interface RequestOptions {
  method?: string;
  body?: unknown;
  /** When true, return the raw parsed JSON without unwrapping `.data`. */
  raw?: boolean;
  signal?: AbortSignal;
  cache?: RequestCache;
}

function extractErrorMessage(payload: unknown, fallback: string): { message: string; code?: string } {
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    const errors = obj.errors;
    if (Array.isArray(errors) && errors.length > 0) {
      const first = errors[0];
      if (typeof first === 'string') return { message: first };
      if (first && typeof first === 'object') {
        const e = first as Record<string, unknown>;
        const message = (e.message as string) || (e.detail as string) || fallback;
        const code = e.code as string | undefined;
        return code !== undefined ? { message, code } : { message };
      }
    }
    if (typeof obj.message === 'string') return { message: obj.message };
    if (typeof obj.error === 'string') return { message: obj.error };
  }
  return { message: fallback };
}

export interface ApiTransportOptions {
  /** Empty means the existing same-origin Express session adapter. */
  apiBase?: string;
  credentials?: RequestCredentials;
  /** Public host-adapter mount only; never a service credential. */
  pathPrefix?: string;
  getHeaders?: (request: { path: string; method: string }) => Record<string, string> | Promise<Record<string, string>>;
  /** The host updates its player-token provider, then returns true to retry once. */
  refreshAuthentication?: () => Promise<boolean>;
  fetcher?: typeof fetch;
}

export function createApiClient(transport: ApiTransportOptions = {}) {
  const base = (transport.apiBase ?? '').replace(/\/+$/, '');
  if (base) {
    const url = new URL(base);
    if (url.username || url.password || url.search || url.hash || url.pathname !== '/' || (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)))) throw new Error('API base must be an HTTPS origin or local development origin');
  }
  const prefix = transport.pathPrefix ?? '';
  if (prefix && !/^\/api\/[a-zA-Z0-9_/-]+$/.test(prefix)) throw new Error('Invalid host adapter prefix');
  let renewal: Promise<boolean> | undefined;
  async function renew(): Promise<boolean> {
    if (!renewal) renewal = Promise.resolve().then(() => transport.refreshAuthentication!());
    try { return await renewal; }
    catch { throw new ApiError('Could not renew authentication.', 401, 'AUTH_REFRESH_FAILED'); }
    finally { renewal = undefined; }
  }
  async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    if (!path.startsWith('/api/') || path.includes('#') || (/[%]/.test(path.split('?')[0]!) || path.split('?')[0]?.includes('..')) || path.includes('\\')) throw new ApiError('Invalid API path.', 0, 'INVALID_API_PATH');
    const { method = 'GET', body, raw = false, signal, cache } = options;
    for (let attempt = 0; attempt < 2; attempt++) {
      signal?.throwIfAborted();
      const headers: Record<string, string> = { ...await transport.getHeaders?.({ path, method }) };
      if (Object.keys(headers).some(key => ['x-excelsior-service-authorization', 'cookie', 'client_secret'].includes(key.toLowerCase()))) throw new ApiError('Service credentials must remain in the server adapter.', 0, 'SERVER_CREDENTIAL_REQUIRED');
      const init: RequestInit = { method, headers, credentials: transport.credentials ?? 'include' };
      if (body !== undefined) { headers['Content-Type'] = 'application/json'; init.body = JSON.stringify(body); }
      if (signal) init.signal = signal;
      if (cache) init.cache = cache;
      let response: Response;
      try { response = await (transport.fetcher ?? fetch)(base + prefix + path, init); }
      catch (err) {
        if ((err as Error)?.name === 'AbortError') throw err;
        throw new ApiError('Network error. Please check your connection.', 0);
      }
      const text = await response.text();
      let parsed: unknown = undefined;
      if (text) { try { parsed = JSON.parse(text); } catch { parsed = text; } }
      const explicitAuthAction = /^\/api\/(?:v1\/)?auth\/(?:login|signup|google|refresh|logout)$/.test(path.split('?')[0]!);
      if (response.status === 401 && attempt === 0 && transport.refreshAuthentication && !explicitAuthAction) {
        signal?.throwIfAborted();
        if (await renew()) continue;
      }
      if (!response.ok) {
        const { message, code } = extractErrorMessage(parsed, 'Request failed (' + response.status + ')');
        const data = parsed && typeof parsed === 'object' && 'data' in parsed ? (parsed as V1Envelope<unknown>).data : undefined;
        throw new ApiError(message, response.status, code, data);
      }
      if (raw) return parsed as T;
      if (parsed && typeof parsed === 'object' && 'data' in parsed) return (parsed as V1Envelope<T>).data;
      return parsed as T;
    }
    throw new ApiError('Authentication expired.', 401);
  }
  return { request, api: createApiMethods(request) };
}

function createApiMethods(request: <T>(path: string, options?: RequestOptions) => Promise<T>) {
  return {
    get: <T>(path: string, signal?: AbortSignal) => request<T>(path, signal ? { method: 'GET', signal } : { method: 'GET' }),
    getFresh: <T>(path: string, signal?: AbortSignal) => request<T>(path, signal ? { method: 'GET', signal, cache: 'no-store' } : { method: 'GET', cache: 'no-store' }),
    post: <T>(path: string, body?: unknown, signal?: AbortSignal) => request<T>(path, { method: 'POST', body, ...(signal ? { signal } : {}) }),
    put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
    patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
    del: <T>(path: string, body?: unknown) => request<T>(path, { method: 'DELETE', body }),
  };
}

const sameOriginClient = createApiClient();
export const apiRequest = sameOriginClient.request;
export const api = sameOriginClient.api;
