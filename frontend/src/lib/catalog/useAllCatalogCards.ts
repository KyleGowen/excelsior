import { useOptionalModuleHost } from '../../modules/ModuleHost';
import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { fetchCatalog } from '../api/catalog';
import type { CatalogCard, CatalogType } from '../api/types';
import { CATALOG_TYPES } from './catalogTypeMap';
import { dedupeFoilCatalogCards } from './foilCatalog';

export interface CatalogCardWithType {
  card: CatalogCard;
  catalogType: CatalogType;
}

interface UseAllCatalogCardsOptions {
  enabled?: boolean;
  /** When set, dedupe foil rows per catalog slug before merge (DBV All tab). */
  foilToBase?: Map<string, string>;
}

export function useAllCatalogCards(options: UseAllCatalogCardsOptions = {}) {
  const hostOperation = useOptionalModuleHost()?.api.fetchCatalog ?? fetchCatalog;
  const { enabled = true, foilToBase } = options;

  const queries = useQueries({
    queries: CATALOG_TYPES.map((meta) => ({
      queryKey: ['catalog', meta.type] as const,
      queryFn: ({ signal }: { signal: AbortSignal }) => hostOperation(meta.type, signal),
      staleTime: 30 * 60 * 1000,
      enabled,
    })),
  });

  const isLoading = enabled && queries.some((q) => q.isLoading);
  const isError = enabled && queries.some((q) => q.isError);

  const catalogDataSignature = queries.map((q) => q.dataUpdatedAt).join(',');

  const cards = useMemo(() => {
    if (!enabled) return [];
    const items: CatalogCardWithType[] = [];
    CATALOG_TYPES.forEach((meta, i) => {
      const raw = queries[i]?.data ?? [];
      const list = foilToBase ? dedupeFoilCatalogCards(raw, foilToBase) : raw;
      list.forEach((card) => items.push({ card, catalogType: meta.type }));
    });
    return items;
  }, [enabled, catalogDataSignature, foilToBase]);

  return { cards, isLoading, isError, retry: () => { void Promise.all(queries.map(query => query.refetch())); } };
}
