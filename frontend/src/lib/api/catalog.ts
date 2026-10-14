/** Catalog (card database) + sets API. Returns full arrays (no server paging). */
import { api as defaultApi } from './client';

import type { CatalogCard, CatalogType, SetInfo } from './types';
import { decodeCatalogPresentation } from './catalogPresentation';


export interface FoilMapEntry {
  foilCardId: string;
  baseCardId: string;
  cardType: string;
}

/** Bind these existing operations to one host's transport; no global client mutation. */
export function createCatalogApi(api: typeof defaultApi = defaultApi) {


async function fetchCatalog(type: CatalogType, signal?: AbortSignal): Promise<CatalogCard[]> {
  return decodeCatalogPresentation(await api.get<unknown>(`/api/v1/catalog/presentation/${type}?compact=1`, signal));
}


/** Bypass the browser HTTP cache when a selected printing must reflect current catalog data. */
async function fetchCatalogFresh(type: CatalogType, signal?: AbortSignal): Promise<CatalogCard[]> {
  return decodeCatalogPresentation(await api.getFresh<unknown>(`/api/v1/catalog/presentation/${type}?compact=1`, signal));
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
