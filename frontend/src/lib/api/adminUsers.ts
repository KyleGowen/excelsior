import { api } from './client';
import type { UserRole } from './types';

export type SupporterSource = 'COMPLIMENTARY' | 'STRIPE';
export type SupporterGrantDuration = '30_DAYS' | '90_DAYS' | '1_YEAR' | 'CUSTOM' | 'PERMANENT';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  lastLoginAt: string | null;
  isSupporter: boolean;
  supporterSources: SupporterSource[];
  complimentarySupporterExpiresAt: string | null;
}

export function fetchAdminUsers(signal?: AbortSignal): Promise<AdminUser[]> {
  return api.get<AdminUser[]>('/api/v1/admin/users', signal);
}

export function updateSupporterEntitlement(
  userId: string,
  input: {
    action: 'grant' | 'revoke';
    duration?: SupporterGrantDuration;
    customExpiresAt?: string;
    reason: string;
  },
): Promise<AdminUser> {
  return api.patch<AdminUser>(`/api/v1/admin/users/${userId}/supporter`, input);
}

