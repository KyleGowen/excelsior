import type { UserRole } from '../../../types';

/**
 * v1 POST /auth/login and POST /auth/refresh success payload inside envelope `data`.
 *
 * Phase 2 §6.1.2 added `refreshToken` / `refreshExpiresInSeconds`. When the
 * `DISABLE_AUTH_REFRESH=1` kill switch is set these fields are omitted (legacy
 * shape), so they are optional in the type.
 */
export interface LoginSuccessDataDto {
  accessToken: string;
  tokenType: 'Bearer';
  expiresInSeconds: number;
  refreshToken?: string;
  refreshExpiresInSeconds?: number;
  user: {
    id: string;
    username: string;
    role: UserRole;
  };
}
