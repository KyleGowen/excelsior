import { Response } from 'express';

/**
 * Centralized authorization helper functions.
 *
 * These reduce duplicated ad-hoc checks scattered across route handlers
 * and ensure consistent error responses for authentication/authorization failures.
 */

/**
 * Ensures the request has an authenticated user attached.
 * Returns false (and sends 401) if no user is present.
 */
export function requireAuth(req: any, res: Response): boolean {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return false;
  }
  return true;
}

/**
 * Ensures the authenticated user has the ADMIN role.
 * Returns false (and sends 403) if the user is not an admin.
 */
export function requireAdmin(req: any, res: Response): boolean {
  if (req.user?.role !== 'ADMIN') {
    res.status(403).json({ success: false, error: 'Only ADMIN users can access this endpoint' });
    return false;
  }
  return true;
}

/**
 * Blocks mutation operations by GUEST users.
 * Returns true (and sends 403) if the user is a guest — caller should return early.
 * Returns false if the user is allowed to proceed.
 */
export function blockGuestMutation(req: any, res: Response, operation: string): boolean {
  if (req.user?.role === 'GUEST') {
    res.status(403).json({ success: false, error: `Guests may not ${operation}` });
    return true; // blocked
  }
  return false; // allowed
}

/**
 * Verifies the authenticated user owns the given deck.
 * Sends 403 and returns false if ownership check fails.
 *
 * @param deckUserId - The user_id from the deck record
 * @param requestUserId - The authenticated user's id (req.user.id)
 */
export function requireDeckOwner(deckUserId: string, requestUserId: string, res: Response): boolean {
  if (deckUserId !== requestUserId) {
    res.status(403).json({ success: false, error: 'Access denied. You do not own this deck.' });
    return false;
  }
  return true;
}
