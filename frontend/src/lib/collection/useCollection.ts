import { useAuth } from '../../app/AuthProvider';
import { useCollectionController, type UseCollectionOptions } from './useCollectionController';
export type { UseCollectionOptions, UseCollectionResult } from './useCollectionController';
/** Excelsior-only identity adapter; reusable modules call the data controller directly. */
export function useCollection(options: UseCollectionOptions = {}) {
 const { isGuest } = useAuth();
 return useCollectionController(isGuest, options);
}
