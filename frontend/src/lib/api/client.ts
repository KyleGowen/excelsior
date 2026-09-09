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

interface RequestOptions {
  method?: string;
  body?: unknown;
  /** When true, return the raw parsed JSON without unwrapping `.data`. */
  raw?: boolean;
  signal?: AbortSignal;
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

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, raw = false, signal } = options;

  const headers: Record<string, string> = {};
  let bodyInit: BodyInit | undefined;
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    bodyInit = JSON.stringify(body);
  }

  // Build init without explicit `undefined` props (exactOptionalPropertyTypes).
  const init: RequestInit = { method, headers, credentials: 'include' };
  if (bodyInit !== undefined) init.body = bodyInit;
  if (signal) init.signal = signal;

  let response: Response;
  try {
    response = await fetch(path, init);
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') throw err;
    throw new ApiError('Network error. Please check your connection.', 0);
  }

  const text = await response.text();
  let parsed: unknown = undefined;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!response.ok) {
    const { message, code } = extractErrorMessage(parsed, `Request failed (${response.status})`);
    const envelopeData =
      parsed && typeof parsed === 'object' && 'data' in (parsed as object)
        ? (parsed as V1Envelope<unknown>).data
        : undefined;
    throw new ApiError(message, response.status, code, envelopeData);
  }

  if (raw) return parsed as T;

  // Unwrap v1 envelope when present.
  if (parsed && typeof parsed === 'object' && 'data' in (parsed as object)) {
    return (parsed as V1Envelope<T>).data;
  }
  return parsed as T;
}

export const api = {
  get: <T>(path: string, signal?: AbortSignal) =>
    apiRequest<T>(path, signal ? { method: 'GET', signal } : { method: 'GET' }),
  post: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'PATCH', body }),
  del: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'DELETE', body }),
};
