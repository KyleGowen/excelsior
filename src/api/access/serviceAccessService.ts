import { createHash, randomUUID, timingSafeEqual } from 'crypto';
import jwt from 'jsonwebtoken';
import { readServiceAccessConfig, type ServiceAccessConfig, type ServiceClientConfig, type ServiceScope } from './serviceAccessConfig';
import type { ServiceTokenDataDto } from '../dto/v1/ServiceTokenDataDto';

export const SERVICE_HEADER = 'x-excelsior-service-authorization';
export const SERVICE_ISSUER = 'excelsior-service-access';
export const SERVICE_AUDIENCE = 'excelsior-api-v1';
export interface ServicePrincipal {
  clientId: string;
  scopes: ServiceScope[];
  expiresAt: number;
}
export interface ServiceAccessAuditEvent {
  event: 'service_token' | 'service_request';
  clientId?: string;
  outcome: 'allowed' | 'denied' | 'throttled';
  code?: string;
  operation?: string;
  requestId?: string;
}
export class ServiceAccessError extends Error {
  constructor(readonly status: number, readonly code: string, message: string, readonly retryAfterSeconds?: number, readonly clientId?: string) {
    super(message);
  }
}
interface Bucket { count: number; resetAt: number }
export class ServiceAccessService {
  private readonly buckets = new Map<string, Bucket>();
  constructor(
    private readonly configProvider: () => ServiceAccessConfig | null = readServiceAccessConfig,
    private readonly now: () => number = Date.now,
    private readonly audit: (event: ServiceAccessAuditEvent) => void = () => {},
  ) {}

  private configuration(): ServiceAccessConfig {
    try {
      const config = this.configProvider();
      if (config) return config;
    } catch { /* Configuration values and parse errors are never returned or logged. */ }
    throw new ServiceAccessError(503, 'SERVICE_ACCESS_UNAVAILABLE', 'Service access is not configured');
  }
  private client(config: ServiceAccessConfig, id: string): ServiceClientConfig | undefined {
    return config.clients.find(client => client.id === id && client.enabled);
  }
  private limit(client: ServiceClientConfig): void {
    const now = this.now();
    for (const [key, value] of this.buckets) if (now >= value.resetAt) this.buckets.delete(key);
    let bucket = this.buckets.get(client.id);
    if (!bucket) { bucket = { count: 0, resetAt: now + 60000 }; this.buckets.set(client.id, bucket); }
    if (bucket.count >= client.requestsPerMinute) {
      throw new ServiceAccessError(429, 'SERVICE_CLIENT_RATE_LIMITED', 'Service client request limit exceeded', Math.ceil((bucket.resetAt - now) / 1000), client.id);
    }
    bucket.count++;
  }
  record(event: ServiceAccessAuditEvent): void {
    try { this.audit(event); } catch { /* Audit outages never expose credentials or change authorization. */ }
  }

  issue(input: { client_id: string; client_secret: string; scope?: string | undefined }): ServiceTokenDataDto {
    const config = this.configuration();
    const client = this.client(config, input.client_id);
    const digest = createHash('sha256').update(input.client_secret).digest();
    let version: string | undefined;
    // Compare every configured version; unknown clients still perform a fixed-length comparison.
    for (const credential of client?.credentials ?? [{ version: '', secretSha256: '0'.repeat(64) }]) {
      if (timingSafeEqual(digest, Buffer.from(credential.secretSha256, 'hex'))) version = credential.version;
    }
    if (!client || !version) {
      this.record({ event: 'service_token', outcome: 'denied', code: 'INVALID_SERVICE_CREDENTIALS' });
      throw new ServiceAccessError(401, 'INVALID_SERVICE_CREDENTIALS', 'Invalid service credentials');
    }
    try { this.limit(client); } catch (error) {
      this.record({ event: 'service_token', clientId: client.id, outcome: 'throttled', code: 'SERVICE_CLIENT_RATE_LIMITED' });
      throw error;
    }
    const scopes = input.scope === undefined ? client.scopes : [...new Set(input.scope.split(/\s+/).filter(Boolean))];
    if (!scopes.length || scopes.some(scope => !(client.scopes as readonly string[]).includes(scope))) {
      this.record({ event: 'service_token', clientId: client.id, outcome: 'denied', code: 'SERVICE_SCOPE_DENIED' });
      throw new ServiceAccessError(403, 'SERVICE_SCOPE_DENIED', 'Requested service scope is not permitted');
    }
    const now = Math.floor(this.now() / 1000);
    const token = jwt.sign({ sub: client.id, kind: 'service', scopes, credentialVersion: version, tokenEpoch: client.tokenEpoch, iat: now, exp: now + config.tokenTtlSeconds }, config.signingSecret, {
      algorithm: 'HS256', header: { alg: 'HS256', typ: 'excelsior-service+jwt' }, issuer: SERVICE_ISSUER, audience: SERVICE_AUDIENCE, jwtid: randomUUID(),
    });
    this.record({ event: 'service_token', clientId: client.id, outcome: 'allowed' });
    return { accessToken: token, tokenType: 'Bearer', expiresInSeconds: config.tokenTtlSeconds, scopes: scopes as ServiceScope[] };
  }

  authenticate(token: string, requiredScope: ServiceScope | null): ServicePrincipal {
    const config = this.configuration();
    let principal: ServicePrincipal;
    let client: ServiceClientConfig;
    try {
      const payload = jwt.verify(token, config.signingSecret, { algorithms: ['HS256'], issuer: SERVICE_ISSUER, audience: SERVICE_AUDIENCE, clockTimestamp: Math.floor(this.now() / 1000), complete: true });
      if (payload.header.typ !== 'excelsior-service+jwt') throw new Error('Invalid token type');
      const claims = payload.payload;
      if (typeof claims === 'string' || claims.kind !== 'service' || typeof claims.sub !== 'string' || typeof claims.exp !== 'number' || typeof claims.iat !== 'number' || !Number.isInteger(claims.exp) || !Number.isInteger(claims.iat) || claims.iat > Math.floor(this.now() / 1000) || claims.exp <= claims.iat || !Array.isArray(claims.scopes) || !claims.scopes.length || new Set(claims.scopes).size !== claims.scopes.length) throw new Error('Invalid claims');
      const found = this.client(config, claims.sub);
      if (!found || found.tokenEpoch !== claims.tokenEpoch || !found.credentials.some(c => c.version === claims.credentialVersion) || claims.exp - claims.iat > config.tokenTtlSeconds || claims.scopes.some(scope => typeof scope !== 'string' || !(found.scopes as readonly string[]).includes(scope))) throw new Error('Revoked or invalid claims');
      client = found;
      principal = { clientId: client.id, scopes: claims.scopes as ServiceScope[], expiresAt: claims.exp };
    } catch {
      throw new ServiceAccessError(401, 'SERVICE_TOKEN_INVALID', 'Invalid, expired, or revoked service token');
    }
    this.limit(client);
    if (!requiredScope || !principal.scopes.includes(requiredScope)) throw new ServiceAccessError(403, 'SERVICE_SCOPE_DENIED', 'Service client cannot perform this operation', undefined, client.id);
    return principal;
  }
}
