import { useMemo } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useOptionalModuleHost } from '../../modules/ModuleHost';
import { fetchDeckFull } from '../../lib/api/decks';
import { fetchCatalog } from '../../lib/api/catalog';
import { cardStats } from '../../lib/catalog/catalogTypeMap';
import type { BuildDeckExportJsonInput } from '../../lib/decks/buildDeckExportJson';
import {
  buildDeckCardIndex,
  catalogSlugForDeckType,
  normalizeDeckCardType,
} from '../../lib/decks/deckCardCatalog';
import { calculateDeckTotalThreat } from '../../lib/decks/deckThreat';
import { countPlayableCards } from '../../lib/decks/drawHand';
import { calculateDeckIconTotals } from '../../lib/decks/iconTotals';
import type { CatalogType } from '../../lib/api/types';

const EMPTY_ICON_TOTALS = { energy: 0, combat: 0, bruteForce: 0, intelligence: 0 };
const EMPTY_MAX_STATS = { energy: 0, combat: 0, bruteForce: 0, intelligence: 0 };

export function createStubDeckExportInput(exportedBy: string): BuildDeckExportJsonInput {
  return {
    name: '',
    description: '',
    cards: [],
    cardIndex: new Map(),
    reserveCharacterId: null,
    maxStats: EMPTY_MAX_STATS,
    iconTotals: EMPTY_ICON_TOTALS,
    totalThreat: 0,
    totalCards: 0,
    legal: false,
    limited: false,
    exportedBy,
  };
}

export interface UseDeckExportInputResult {
  input: BuildDeckExportJsonInput | null;
  loading: boolean;
}

/**
 * Load full deck + catalog data and assemble input for buildDeckExportJson / ExportDeckPanel.
 * Used from deck selection actions menu (list tiles only carry preview cards).
 */
export function useDeckExportInputController(
  deckId: string | null,
  isGuest: boolean,
  enabled: boolean,
  user: import('../../lib/api/types').AppUser | null,
): UseDeckExportInputResult {
  const hostApi = useOptionalModuleHost()?.api;
  const loadDeck = hostApi?.fetchDeckFull ?? fetchDeckFull;
  const loadCatalog = hostApi?.fetchCatalog ?? fetchCatalog;

  const deckQuery = useQuery({
    queryKey: ['deck', deckId],
    queryFn: ({ signal }) => loadDeck(deckId!, isGuest, signal),
    enabled: enabled && Boolean(deckId),
  });

  const deck = deckQuery.data;
  const cards = deck?.cards ?? [];

  const deckCatalogTypes = useMemo(
    () => Array.from(new Set(cards.map((c) => normalizeDeckCardType(c.type)))),
    [cards],
  );

  const catalogQueries = useQueries({
    queries: deckCatalogTypes.map((deckType) => {
      const slug = catalogSlugForDeckType(deckType);
      return {
        queryKey: ['catalog', slug ?? deckType],
        queryFn: ({ signal }: { signal: AbortSignal }) => loadCatalog(slug as CatalogType, signal),
        enabled: enabled && Boolean(deckId) && Boolean(slug),
        staleTime: 30 * 60 * 1000,
      };
    }),
  });

  const charactersQuery = useQuery({
    queryKey: ['catalog', 'characters'],
    queryFn: () => fetchCatalog('characters'),
    enabled: enabled && Boolean(deckId),
    staleTime: 30 * 60 * 1000,
  });

  const cardIndex = useMemo(
    () => buildDeckCardIndex(deckCatalogTypes, catalogQueries.map((q) => q.data)),
    [catalogQueries, deckCatalogTypes],
  );

  const reserveCharacterId = deck?.metadata.reserve_character ?? null;

  const maxStats = useMemo(() => {
    const statById = new Map<string, ReturnType<typeof cardStats>>();
    (charactersQuery.data ?? []).forEach((c) => {
      const s = cardStats(c);
      if (s) statById.set(c.id, s);
    });
    const chars = cards.filter((c) => c.type === 'character');
    const acc = { energy: 0, combat: 0, bruteForce: 0, intelligence: 0 };
    chars.forEach((c) => {
      const s = statById.get(c.cardId);
      if (s) {
        acc.energy = Math.max(acc.energy, s.energy);
        acc.combat = Math.max(acc.combat, s.combat);
        acc.bruteForce = Math.max(acc.bruteForce, s.bruteForce);
        acc.intelligence = Math.max(acc.intelligence, s.intelligence);
      }
    });
    return acc;
  }, [cards, charactersQuery.data]);

  const iconTotals = useMemo(
    () =>
      calculateDeckIconTotals(cards, (type, cardId) =>
        cardIndex.get(`${type}:${cardId}`),
      ),
    [cards, cardIndex],
  );

  const totalThreat = useMemo(
    () =>
      calculateDeckTotalThreat(cards, reserveCharacterId, (type, cardId) =>
        cardIndex.get(`${type}:${cardId}`),
      ),
    [cards, reserveCharacterId, cardIndex],
  );

  const totalCards = countPlayableCards(cards);

  const catalogLoading =
    deckQuery.isLoading ||
    deckQuery.isFetching ||
    charactersQuery.isLoading ||
    catalogQueries.some((q) => q.isLoading || q.isFetching);

  const input = useMemo((): BuildDeckExportJsonInput | null => {
    if (!deck) return null;
    return {
      name: deck.metadata.name,
      description: deck.metadata.description ?? '',
      cards,
      cardIndex,
      reserveCharacterId,
      maxStats,
      iconTotals,
      totalThreat,
      totalCards,
      legal: deck.metadata.is_valid ?? false,
      limited: deck.metadata.is_limited ?? false,
      exportedBy: user?.username ?? 'Guest',
    };
  }, [
    deck,
    cards,
    cardIndex,
    reserveCharacterId,
    maxStats,
    iconTotals,
    totalThreat,
    totalCards,
    user?.username,
  ]);

  return { input, loading: catalogLoading };
}
