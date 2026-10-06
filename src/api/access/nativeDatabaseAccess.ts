import type { ConfidentialClientCredentials } from './applicationAccessAdapter';
import { ServiceAccessError, type ServiceAccessService, type ServicePrincipal } from './serviceAccessService';

/** Server-only identity; the original browser request stays in its existing session/IP pipeline. */
export class NativeDatabaseAccess {
  private cached: { token: string; expiresAt: number } | undefined;
  constructor(
    private readonly service: ServiceAccessService,
    private readonly credentials: () => ConfidentialClientCredentials,
    private readonly now: () => number = Date.now,
  ) {}
  private issue(): void {
    const credentials = this.credentials();
    if (credentials.clientId !== 'excelsior-web') throw new ServiceAccessError(503, 'SERVICE_ACCESS_UNAVAILABLE', 'Native database identity is not configured');
    const issued = this.service.issue({ client_id: credentials.clientId, client_secret: credentials.clientSecret, scope: 'catalog:read' });
    this.cached = { token: issued.accessToken, expiresAt: this.now() + issued.expiresInSeconds * 1000 };
  }
  authenticate(): ServicePrincipal {
    if (!this.cached || this.now() >= this.cached.expiresAt - 5000) this.issue();
    try { return this.service.authenticateNativeDatabase(this.cached!.token); }
    catch (error) {
      if (!(error instanceof ServiceAccessError) || error.code !== 'SERVICE_TOKEN_INVALID') throw error;
      this.cached = undefined;
      this.issue();
      return this.service.authenticateNativeDatabase(this.cached!.token);
    }
  }
}
