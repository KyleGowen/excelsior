import type { CollectionEvaluationDto, CollectionEvaluationEntry } from '../../contracts/CollectionEvaluationDto';
export interface CollectionView { cards: CollectionCard[]; evaluation: CollectionEvaluationDto }
/** Collection APIs (logged-in users). GUEST collections are localStorage-only. */
import { api as defaultApi } from './client';

import type { CollectionCard, CollectionCardType } from './types';


export interface AddCollectionCardInput {
  cardId: string;
  cardType: CollectionCardType;
  quantity?: number;
  imagePath: string;
}


export interface SetCollectionQuantityInput {
  cardId: string;
  cardType: CollectionCardType;
  quantity: number;
  imagePath: string;
  oldImagePath?: string;
}

/** Bind these existing operations to one host's transport; no global client mutation. */
export function createCollectionApi(api: typeof defaultApi = defaultApi) {


function fetchCollectionCards(signal?: AbortSignal): Promise<CollectionCard[]> {
  return api.get<CollectionCard[]>('/api/v1/collections/me/cards', signal);
}


function addCollectionCard(input: AddCollectionCardInput): Promise<CollectionCard> {
  return api.post<CollectionCard>('/api/v1/collections/me/cards', input);
}


function setCollectionQuantity(
  input: SetCollectionQuantityInput,
): Promise<CollectionCard | null> {
  const { cardId, ...body } = input;
  return api.put<CollectionCard | null>(`/api/v1/collections/me/cards/${cardId}`, body);
}
function fetchCollectionView(signal?: AbortSignal): Promise<CollectionView> {
  return api.get<CollectionView>('/api/v1/collections/me/view', signal);
}
function evaluateGuestCollection(entries: CollectionEvaluationEntry[], signal?: AbortSignal): Promise<CollectionEvaluationDto> {
  return api.post<CollectionEvaluationDto>('/api/v1/collections/evaluate', { entries }, signal);
}
return { fetchCollectionCards, fetchCollectionView, evaluateGuestCollection, addCollectionCard, setCollectionQuantity };
}

export const { fetchCollectionCards, fetchCollectionView, evaluateGuestCollection, addCollectionCard, setCollectionQuantity } = createCollectionApi();
