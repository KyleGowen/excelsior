import type { UserRole } from '../../../types';

/**
 * v1 GET /auth/me — `data` field.
 */
export interface AuthMeDataDto {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  lastLoginAt: string | null;
  /** Optional public display name (SSO users); null for password users. */
  displayName: string | null;
  /** `'password'` or `'google'`. */
  authProvider: string;
}
