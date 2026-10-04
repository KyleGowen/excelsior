import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useOptionalModuleHost } from '../../modules/ModuleHost';
import { addFavorite, removeFavorite } from '../api/favorites';
import { favoritesQueryKey } from './favoritesQueryKey';

export interface FavoriteToggleVars {
  deckId: string;
  /** Desired state after the toggle. */
  next: boolean;
}

/**
 * Add/remove a deck favorite. Always invalidates the favorites list; pass extra
 * `invalidateKeys` (e.g. the current community/profile list query key) to refetch
 * those too. Pages that want instant feedback should also optimistically patch
 * their own query via `setQueryData` before/after calling `mutate`.
 */
export function useFavoriteToggleController(userId: string | undefined, invalidateKeys: QueryKey[] = []) {
  const queryClient = useQueryClient();
  const hostApi = useOptionalModuleHost()?.api;
  const add = hostApi?.addFavorite ?? addFavorite;
  const remove = hostApi?.removeFavorite ?? removeFavorite;
  return useMutation({
    mutationFn: ({ deckId, next }: FavoriteToggleVars) =>
      next ? add(deckId) : remove(deckId),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: favoritesQueryKey(userId) });
      for (const key of invalidateKeys) {
        void queryClient.invalidateQueries({ queryKey: key });
      }
    },
  });
}
