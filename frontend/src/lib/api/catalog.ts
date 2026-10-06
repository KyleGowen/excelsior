/** Catalog (card database) + sets API. Returns full arrays (no server paging). */
import { api as defaultApi } from './client';

import type { CatalogCard, CatalogType, SetInfo } from './types';


export interface FoilMapEntry {
  foilCardId: string;
  baseCardId: string;
  cardType: string;
}

function requirePresentation(cards:CatalogCard[]):CatalogCard[] {
 if(!Array.isArray(cards) || cards.some(c => !c.presentation || c.presentation.schemaVersion !== 1 || !Array.isArray(c.presentation.characterNames) || !Array.isArray(c.presentation.printingIds))) throw new Error('Catalog presentation metadata is unavailable. Retry without using client rule fallbacks.');
 return cards;
}

/** Bind these existing operations to one host's transport; no global client mutation. */
export function createCatalogApi(api: typeof defaultApi = defaultApi) {


async function fetchCatalog(type: CatalogType, signal?: AbortSignal): Promise<CatalogCard[]> {
  return requirePresentation(await api.get<CatalogCard[]>(`/api/v1/catalog/presentation/${type}`, signal));
}


/** Bypass the browser HTTP cache when a selected printing must reflect current catalog data. */
async function fetchCatalogFresh(type: CatalogType, signal?: AbortSignal): Promise<CatalogCard[]> {
  return requirePresentation(await api.getFresh<CatalogCard[]>(`/api/v1/catalog/presentation/${type}`, signal));
}


function fetchSets(signal?: AbortSignal): Promise<SetInfo[]> {
  return api.get<SetInfo[]>('/api/v1/dbv/sets', signal);
}


function fetchFoilCardMap(signal?: AbortSignal): Promise<FoilMapEntry[]> {
  return api.get<FoilMapEntry[]>('/api/v1/catalog/foil-card-map', signal);
}
return { fetchCatalog, fetchCatalogFresh, fetchSets, fetchFoilCardMap };
}

export const { fetchCatalog, fetchCatalogFresh, fetchSets, fetchFoilCardMap } = createCatalogApi();
