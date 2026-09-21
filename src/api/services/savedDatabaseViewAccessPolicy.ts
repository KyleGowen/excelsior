import type { UserRole } from '../../types';
import type { SupporterEntitlementService } from './supporterEntitlementService';

export interface SavedDatabaseViewAccessPrincipal {
  id: string;
  role: UserRole;
}

export interface SavedDatabaseViewAccessPolicy {
  canAccess(principal: SavedDatabaseViewAccessPrincipal): Promise<boolean> | boolean;
}

export class SupporterSavedDatabaseViewAccessPolicy implements SavedDatabaseViewAccessPolicy {
  constructor(private readonly supporterEntitlementService: Pick<SupporterEntitlementService, 'isSupporter'>) {}

  async canAccess(principal: SavedDatabaseViewAccessPrincipal): Promise<boolean> {
    return principal.role === 'ADMIN'
      || (principal.role === 'USER' && await this.supporterEntitlementService.isSupporter(principal.id));
  }
}
