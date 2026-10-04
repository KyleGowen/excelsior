import { useAuth } from '../../app/AuthProvider';
import type { QueryKey } from '@tanstack/react-query';
import { useFavoriteToggleController } from './useFavoriteToggleController';
export type { FavoriteToggleVars } from './useFavoriteToggleController';
export function useFavoriteToggle(invalidateKeys: QueryKey[] = []) {
 return useFavoriteToggleController(useAuth().user?.id, invalidateKeys);
}
