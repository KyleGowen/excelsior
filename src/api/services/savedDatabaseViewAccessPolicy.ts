import type { UserRole } from '../../types';

export interface SavedDatabaseViewAccessPrincipal {
  id: string;
  role: UserRole;
}

export interface SavedDatabaseViewAccessPolicy {
  canAccess(principal: SavedDatabaseViewAccessPrincipal): Promise<boolean> | boolean;
}

export class AdminSavedDatabaseViewAccessPolicy implements SavedDatabaseViewAccessPolicy {
  canAccess(principal: SavedDatabaseViewAccessPrincipal): boolean {
    return principal.role === 'ADMIN';
  }
}
