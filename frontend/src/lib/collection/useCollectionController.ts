/** Device-local input/persistence and presentation; derived totals/capabilities come from the API. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useOptionalModuleHost } from '../../modules/ModuleHost';
import { fetchCollectionView, evaluateGuestCollection, setCollectionQuantity, addCollectionCard } from '../api/collection';
import { getGuestCollection, setGuestQuantity } from './guestCollection';
import { cardDisplayName } from '../catalog/catalogTypeMap';
import type { CatalogCard, CollectionCardType } from '../api/types';

export interface UseCollectionResult {
  isGuest: boolean;
  isLoading: boolean;
  isError: boolean;
  isUpdating: boolean;
  canSetQuantity: boolean;
  retry: () => void;
  quantityFor: (cardId: string, collectionType: CollectionCardType) => number;
  setQuantity: (card: CatalogCard, collectionType: CollectionCardType, quantity: number) => Promise<void>;
  totalOwned: number | null;
  uniqueCards: number | null;
}
export interface UseCollectionOptions { enabled?: boolean }

export function useCollectionController(isGuest: boolean, options: UseCollectionOptions = {}): UseCollectionResult {
  const { enabled = true } = options;
  const hostApi = useOptionalModuleHost()?.api;
  const fetchView = hostApi?.fetchCollectionView ?? fetchCollectionView;
  const evaluateGuest = hostApi?.evaluateGuestCollection ?? evaluateGuestCollection;
  const addCard = hostApi?.addCollectionCard ?? addCollectionCard;
  const setQty = hostApi?.setCollectionQuantity ?? setCollectionQuantity;
  const queryClient = useQueryClient();
  const [guestTick, setGuestTick] = useState(0);
  const [pending, setPending] = useState(0);
  const [mutationError, setMutationError] = useState(false);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const guestEntries = useMemo(() => { void guestTick; return isGuest ? getGuestCollection().map(({cardId, cardType, imagePath, quantity}) => ({cardId, cardType, imagePath, quantity})) : []; }, [isGuest, guestTick]);
  const savedKey = ['collection', 'view'] as const;
  const saved = useQuery({ queryKey: savedKey, queryFn: ({signal}) => fetchView(signal), enabled: enabled && !isGuest, staleTime: 0 });
  const guest = useQuery({ queryKey: ['collection', 'device-evaluation', guestEntries], queryFn: ({signal}) => evaluateGuest(guestEntries, signal), enabled: isGuest, staleTime: 0 });
  useEffect(() => {
    if (!isGuest) return;
    const handler = () => setGuestTick(t => t + 1);
    window.addEventListener('guest-collection-change', handler);
    return () => window.removeEventListener('guest-collection-change', handler);
  }, [isGuest]);
  const query = isGuest ? guest : saved;
  const evaluation = isGuest ? guest.data : saved.data?.evaluation;
  const hasGuestEvaluation = useRef(false);
  if (isGuest && guest.data) hasGuestEvaluation.current = true;
  const entries = useMemo(() => isGuest ? guestEntries : (saved.data?.cards ?? []).map(row => ({cardId: row.card_id, cardType: row.card_type, quantity: row.quantity, imagePath: row.image_path})), [isGuest, guestEntries, saved.data]);
  // A presentation lookup retains the previous printing display convention, not totals/rules.
  const map = useMemo(() => new Map(entries.map(row => [`${row.cardType}:${row.cardId}`, row.quantity])), [entries]);
  const mapRef = useRef(map); mapRef.current = map;
  const quantityFor = useCallback((cardId: string, type: CollectionCardType) => map.get(`${type}:${cardId}`) ?? 0, [map]);
  const setQuantity = useCallback((card: CatalogCard, cardType: CollectionCardType, quantity: number) => {
    const imagePath = String(card.image_path || card.image || '');
    const next = Math.max(0, quantity); // Local input normalization; server validates persisted requests.
    if (isGuest) {
      setGuestQuantity({cardId:card.id, cardType, imagePath, quantity:next, cardName:cardDisplayName(card), set:card.set});
      return Promise.resolve();
    }
    setPending(n => n + 1); setMutationError(false);
    const work = queue.current.catch(() => {}).then(async () => {
      await queryClient.cancelQueries({queryKey:['collection', 'view']});
      const current = mapRef.current.get(`${cardType}:${card.id}`) ?? 0;
      if (current <= 0) { if (next <= 0) return; await addCard({cardId:card.id,cardType,quantity:next,imagePath}); }
      else await setQty({cardId:card.id,cardType,quantity:next,imagePath});
      // A focus/reconnect read may have started during the write. It cannot
      // supply the post-write snapshot, even when fetchQuery would deduplicate it.
      await queryClient.cancelQueries({queryKey:['collection', 'view']});
      const fresh = await queryClient.fetchQuery({queryKey:['collection','view'],queryFn:({signal}) => fetchView(signal),staleTime:0});
      // Keep queued absolute requests ordered even before React commits the fresh view.
      mapRef.current = new Map(fresh.cards.map(row => [`${row.card_type}:${row.card_id}`,row.quantity]));
      await queryClient.invalidateQueries({queryKey:['collection','me']});
    });
    queue.current = work;
    return work.catch(error => {setMutationError(true); throw error;}).finally(() => setPending(n => n - 1));
  }, [isGuest,queryClient,addCard,setQty,fetchView]);
  const isUpdating = pending > 0 || query.isFetching;
  return {
    isGuest, isLoading: enabled && query.isPending && !(isGuest && hasGuestEvaluation.current),
    isError: query.isError || mutationError,
    isUpdating,
    canSetQuantity: evaluation?.capabilities.canSetQuantity === true && pending === 0 && !query.isError && !mutationError,
    retry: () => {void query.refetch().then(result => {if(result.isSuccess)setMutationError(false);});},
    quantityFor, setQuantity,
    // Never invent totals or display a saved snapshot as current while a write is in flight.
    totalOwned: pending > 0 || query.isError || mutationError ? null : evaluation?.totalOwned ?? null,
    uniqueCards: pending > 0 || query.isError || mutationError ? null : evaluation?.uniqueCards ?? null,
  };
}
