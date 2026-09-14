/** Catalog (card database) + sets API. Returns full arrays (no server paging). */
import { api } from './client';
import type { CatalogCard, CatalogType, SetInfo } from './types';

export function fetchCatalog(type: CatalogType, signal?: AbortSignal): Promise<CatalogCard[]> {
  return api.get<CatalogCard[]>(`/api/v1/catalog/${type}`, signal);
}

/** Bypass the browser HTTP cache when a selected printing must reflect current catalog data. */
export function fetchCatalogFresh(type: CatalogType, signal?: AbortSignal): Promise<CatalogCard[]> {
  return api.getFresh<CatalogCard[]>(`/api/v1/catalog/${type}`, signal);
}

export function fetchSets(signal?: AbortSignal): Promise<SetInfo[]> {
  return api.get<SetInfo[]>('/api/v1/dbv/sets', signal);
}

export interface FoilMapEntry {
  foilCardId: string;
  baseCardId: string;
  cardType: string;
}

export function fetchFoilCardMap(signal?: AbortSignal): Promise<FoilMapEntry[]> {
  return api.get<FoilMapEntry[]>('/api/v1/catalog/foil-card-map', signal);
}
