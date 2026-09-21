import type { UserRole } from '../../../types';
import type { SupporterEntitlementSource } from '../../../repository/SupporterEntitlementRepository';

export interface AdminUserDto {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  lastLoginAt: string | null;
  isSupporter: boolean;
  supporterSources: SupporterEntitlementSource[];
  complimentarySupporterExpiresAt: string | null;
}

