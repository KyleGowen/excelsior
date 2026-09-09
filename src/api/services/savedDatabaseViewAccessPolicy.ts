import type { UserRole } from '../../types';

export interface SavedDatabaseViewAccessPrincipal {
  id: string;
  role: UserRole;
}

/** Replace this policy with the Supporter entitlement check when that service is ready. */
export interface SavedDatabaseViewAccessPolicy {
  canAccess(principal: SavedDatabaseViewAccessPrincipal): Promise<boolean> | boolean;
}

export class AdminSavedDatabaseViewAccessPolicy implements SavedDatabaseViewAccessPolicy {
  canAccess(principal: SavedDatabaseViewAccessPrincipal): boolean {
    return principal.role === 'ADMIN';
  }
}
