import type { ServiceScope } from '../../access/serviceAccessConfig';

/** Short-lived application identity; no player identity or refresh credential is included. */
export interface ServiceTokenDataDto {
  accessToken: string;
  tokenType: 'Bearer';
  expiresInSeconds: number;
  scopes: ServiceScope[];
}
