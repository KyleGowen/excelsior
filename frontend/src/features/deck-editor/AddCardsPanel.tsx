import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchCatalog, fetchFoilCardMap, fetchSets } from '../../lib/api/catalog';
import {
  ADD_CARDS_ANY_CHARACTER_SPECIALS_TAB,
  ADD_CARDS_TAB_ORDER,
  ADD_CARDS_TYPE_TABS,
  CATALOG_TYPES,
  CATALOG_TYPE_BY_SLUG,
  addCardsCatalogTypeForTab,
  cardDisplayName,
  type CatalogTabSelection,
} from '../../lib/catalog/catalogTypeMap';
import {
  findLastInstanceIdForRepresentative,
  prepareAddCardsCatalogList,
  qtyInDeckForRepresentative,
} from '../../lib/catalog/defaultCatalogCards';
import { buildFoilCardMapLookup } from '../../lib/catalog/foilCatalog';
import { maxCopiesForAddCards } from '../../lib/decks/addCardsLimits';
import { useAllCatalogCards } from '../../lib/catalog/useAllCatalogCards';
import { CardImage } from '../../components/CardImage';
import { CardTile } from '../../components/CardTile';
import { Pagination } from '../../components/Pagination';
import { SlideOutPanel } from '../../components/SlideOutPanel';
import { StatIconBadge } from '../../components/StatIconBadge';
import { LoadingState } from '../../components/LoadingState';
import { EmptyState } from '../../components/EmptyState';
import { IconSearch, IconClose } from '../../components/icons';
import { imagePathFromCard } from '../../lib/images/cardImages';
import { AddCardsQtyOverlay } from './AddCardsQtyOverlay';
import type { CatalogCard, CatalogType, DeckCardEntry } from '../../lib/api/types';
import {
  ADD_CARDS_STACKS_PAGE_SIZE,
  buildCharacterStacks,
  stackCardsInAddOrder,
  stackTotalCardCount,
  type CharacterStack,
  type StackCardEntry,
} from '../../lib/catalog/characterStacks';
import { CharacterStackRow } from './CharacterStackRow';
import { MissionSetRow } from './MissionSetRow';
import {
  ADD_CARDS_MISSION_SETS_PAGE_SIZE,
  buildMissionSets,
  countDeckMissions,
  missionSetCardsInAddOrder,
  type MissionSet,
} from '../../lib/catalog/missionSets';
import { useLayoutMode } from '../../lib/layout/LayoutModeProvider';
import { stepCyclicalIndex } from '../../lib/layout/cyclicalIndex';
import {
  ADD_CARDS_SWIPE_BLOCK_SELECTOR,
  useHorizontalSwipe,
} from '../../lib/layout/useHorizontalSwipe';
import {
  addCardsGridClassName,
  addCardsPageSizeAll,
  addCardsPageSizeForType,
  flattenAddCardsSections,
  groupAllCatalogByType,
  groupPageItemsByType,
  paginateItems,
} from './addCardsCatalog';
import {
  buildAddCardsSectionsWithOptions,
  filterAndSortTypeCardsWithOptions,
  filterCharacterStacksWithOptions,
  filterMissionSetsWithOptions,
  type AddCardsFilterOptions,
} from './addCardsFilters';
import { AddCardsFilterBar } from './AddCardsFilterBar';
import { buildDeckUsabilityContext, effectiveHideUnusablesForTab, tabSupportsHideUnusables } from '../../lib/deck-usability';
import { useDbvFilters } from '../database/filters/useDbvFilters';
import { calculateDeckTotalThreat, MAX_TOTAL_THREAT } from '../../lib/decks/deckThreat';
import { buildAddCardsEffectiveCharacterStats } from './addCardsTeamStats';

const STACK_CATALOG_TYPES = ['characters', 'special-cards', 'advanced-universe'] as const;

/** Catalog slugs needed for hide-unusable deck context when tab-scoped data is incomplete. */
const DECK_USABILITY_CONTEXT_TYPES = ['characters', 'missions', 'locations', 'battlegrounds'] as const;

const ADD_CARDS_SEARCH_PLACEHOLDER = 'Search name, character, mission set, or card text...';
const STACKS_SEARCH_PLACEHOLDER = 'Search character names...';
const ADD_CARDS_SEARCH_ARIA_LABEL = 'Search cards to add';
const STACKS_SEARCH_ARIA_LABEL = 'Search character names';
const EMPTY_CHARACTER_SLOT_COUNT = 4;

function useDebounced<T>(value: T, delay = 250): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export interface AddCardsPanelProps {
  open: boolean;
  onClose: () => void;
  onAdd: (card: CatalogCard, type: CatalogType) => void;
  onAddStack: (entries: StackCardEntry[]) => void;
  onRemoveInstance: (instanceId: string) => void;
  cards: DeckCardEntry[];
  /** Resolved catalog rows for deck cards (`${deckType}:${cardId}`), from DeckEditorPage. */
  deckCatalogIndex?: Map<string, CatalogCard>;
  reserveCharacterId?: string | null;
}

interface HoveredAddCard {
  card: CatalogCard;
  catalogType: CatalogType;
}

const CHARACTER_STAT_ROWS: Array<{
  key: 'energy' | 'combat' | 'brute_force' | 'intelligence' | 'threat_level';
  icon: 'energy' | 'combat' | 'brute_force' | 'intelligence' | 'threat_level';
  label: string;
}> = [
  { key: 'energy', icon: 'energy', label: 'Energy' },
  { key: 'combat', icon: 'combat', label: 'Combat' },
  { key: 'brute_force', icon: 'brute_force', label: 'Brute Force' },
  { key: 'intelligence', icon: 'intelligence', label: 'Intelligence' },
  { key: 'threat_level', icon: 'threat_level', label: 'Threat Value' },
];

function numericStat(card: CatalogCard, key: (typeof CHARACTER_STAT_ROWS)[number]['key']): number {
  const value = Number(card[key] ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function AddCardsTeamStats({
  cards,
  deckCatalogIndex,
  reserveCharacterId,
  onCardHover,
  onCardHoverEnd,
}: {
  cards: DeckCardEntry[];
  deckCatalogIndex?: Map<string, CatalogCard>;
  reserveCharacterId?: string | null;
  onCardHover: (card: CatalogCard, catalogType: CatalogType) => void;
  onCardHoverEnd: () => void;
}) {
  const characterCards = cards
    .filter((entry) => entry.type === 'character')
    .slice(0, EMPTY_CHARACTER_SLOT_COUNT)
    .map((entry) => deckCatalogIndex?.get(`${entry.type}:${entry.cardId}`) ?? null);
  const rows = [
    ...characterCards,
    ...Array.from({ length: Math.max(0, EMPTY_CHARACTER_SLOT_COUNT - characterCards.length) }, () => null),
  ];
  const effectiveCharacterStats = buildAddCardsEffectiveCharacterStats(cards, deckCatalogIndex);
  const locationCard =
    cards
      .filter((entry) => entry.type === 'location')
      .map((entry) => deckCatalogIndex?.get(`${entry.type}:${entry.cardId}`) ?? null)
      .find(Boolean) ?? null;
  const battlegroundCard =
    cards
      .filter((entry) => entry.type === 'battleground')
      .map((entry) => deckCatalogIndex?.get(`${entry.type}:${entry.cardId}`) ?? null)
      .find(Boolean) ?? null;
  const structuralCard = locationCard ?? battlegroundCard;
  const structuralCatalogType: CatalogType = locationCard ? 'locations' : 'battlegrounds';
  const structuralName = [locationCard, battlegroundCard]
    .filter((card): card is CatalogCard => Boolean(card))
    .map(cardDisplayName)
    .join(' & ');
  const totalThreat = calculateDeckTotalThreat(
    cards,
    reserveCharacterId,
    (deckType, cardId) => deckCatalogIndex?.get(`${deckType}:${cardId}`),
  );
  const isOverThreat = totalThreat > MAX_TOTAL_THREAT;

  return (
    <section className="add-cards__team-stats" aria-label="Team character stats">
      <div className="add-cards__pane-heading">
        <span>Team</span>
        <span className="add-cards__team-threat">
          Threat:{' '}
          {isOverThreat ? (
            <>
              <span className="add-cards__team-threat-value--over">{totalThreat}</span>
              {' / '}
              {MAX_TOTAL_THREAT}
            </>
          ) : (
            totalThreat
          )}
        </span>
      </div>
      <div className="add-cards__team-rows">
        {rows.map((card, index) => {
          const displayCard = card
            ? { ...card, ...(effectiveCharacterStats.get(card.id) ?? {}) }
            : null;
          return (
            <div
              key={card?.id ?? `empty-${index}`}
              className={`add-cards__team-row${card ? ' add-cards__team-row--interactive' : ' add-cards__team-row--empty'}`}
              tabIndex={card ? 0 : undefined}
              onPointerEnter={() => {
                if (card) onCardHover(card, 'characters');
              }}
              onPointerLeave={card ? onCardHoverEnd : undefined}
              onFocus={() => {
                if (card) onCardHover(card, 'characters');
              }}
              onBlur={card ? onCardHoverEnd : undefined}
            >
              <span className="add-cards__team-name">
                {card ? cardDisplayName(card) : `Character ${index + 1}`}
              </span>
              <span className="add-cards__team-stat-list">
                {CHARACTER_STAT_ROWS.map(({ key, icon, label }) => (
                  <StatIconBadge
                    key={key}
                    type={icon}
                    value={displayCard ? numericStat(displayCard, key) : 0}
                    size="md"
                    title={card ? `${cardDisplayName(card)} ${label}` : `Empty slot ${label}`}
                  />
                ))}
              </span>
            </div>
          );
        })}
        <div
          className={`add-cards__team-row add-cards__team-row--location${
            structuralCard ? ' add-cards__team-row--interactive' : ' add-cards__team-row--empty'
          }`}
          tabIndex={structuralCard ? 0 : undefined}
          onPointerEnter={() => {
            if (structuralCard) onCardHover(structuralCard, structuralCatalogType);
          }}
          onPointerLeave={structuralCard ? onCardHoverEnd : undefined}
          onFocus={() => {
            if (structuralCard) onCardHover(structuralCard, structuralCatalogType);
          }}
          onBlur={structuralCard ? onCardHoverEnd : undefined}
        >
          <span className="add-cards__team-name">
            {structuralName || 'No Location or Battleground Set'}
          </span>
          {locationCard ? (
            <span className="add-cards__team-stat-list" aria-label="Location threat value">
              {CHARACTER_STAT_ROWS.slice(0, 4).map(({ key }) => (
                <span key={key} className="add-cards__team-stat-spacer" aria-hidden="true" />
              ))}
              <StatIconBadge
                type="threat_level"
                value={numericStat(locationCard, 'threat_level')}
                size="md"
                title={`${cardDisplayName(locationCard)} Threat Value`}
              />
            </span>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function AddCardsPanel({
  open,
  onClose,
  onAdd,
  onAddStack,
  onRemoveInstance,
  cards,
  deckCatalogIndex,
  reserveCharacterId,
}: AddCardsPanelProps) {
  const { isMobile } = useLayoutMode();
  const queryClient = useQueryClient();
  const addCardsRef = useRef<HTMLDivElement>(null);
  const typeTabsRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<CatalogTabSelection>('all');
  const [search, setSearch] = useState('');
  const [setFilter, setSetFilter] = useState('');
  const [hideUnusables, setHideUnusables] = useState(false);
  const [page, setPage] = useState(1);
  const [hoveredCard, setHoveredCard] = useState<HoveredAddCard | null>(null);
  const debouncedSearch = useDebounced(search);

  const isAllTab = tab === 'all';
  const isStacksTab = tab === 'stacks';
  const isMissionsTab = tab === 'missions';
  const isAnyCharacterSpecialsTab = tab === ADD_CARDS_ANY_CHARACTER_SPECIALS_TAB;
  const activeType = addCardsCatalogTypeForTab(tab);
  const dynamicFilterType = activeType ?? 'characters';
  const dynamicFilters = useDbvFilters(dynamicFilterType, { persistByCatalogType: true });

  useEffect(() => {
    setPage(1);
  }, [tab, debouncedSearch, setFilter, hideUnusables, dynamicFilters.state]);

  const goToRelativeTab = useCallback(
    (delta: 1 | -1) => {
      const idx = ADD_CARDS_TAB_ORDER.indexOf(tab);
      const next =
        ADD_CARDS_TAB_ORDER[
          stepCyclicalIndex(idx >= 0 ? idx : 0, ADD_CARDS_TAB_ORDER.length, delta)
        ];
      setTab(next);
    },
    [tab],
  );

  useHorizontalSwipe({
    targetRef: addCardsRef,
    enabled: isMobile && open,
    blockSelector: ADD_CARDS_SWIPE_BLOCK_SELECTOR,
    onSwipeLeft: () => goToRelativeTab(1),
    onSwipeRight: () => goToRelativeTab(-1),
  });

  useEffect(() => {
    if (!isMobile) return;
    addCardsRef.current?.closest('.slideout__body')?.scrollTo({ top: 0 });
  }, [tab, isMobile]);

  useEffect(() => {
    if (!isMobile || !typeTabsRef.current) return;
    const activeTab = typeTabsRef.current.querySelector<HTMLElement>(
      `[data-add-cards-tab="${tab}"]`,
    );
    activeTab?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [tab, isMobile]);

  const foilMapQuery = useQuery({
    queryKey: ['foil-card-map'],
    queryFn: () => fetchFoilCardMap(),
    enabled: open,
    staleTime: 60 * 60 * 1000,
  });

  const setsQuery = useQuery({
    queryKey: ['sets'],
    queryFn: () => fetchSets(),
    enabled: open,
    staleTime: 60 * 60 * 1000,
  });

  const foilLookup = useMemo(
    () => buildFoilCardMapLookup(foilMapQuery.data ?? []),
    [foilMapQuery.data],
  );

  const allCatalogQuery = useAllCatalogCards({ enabled: open && isAllTab });

  const catalogQuery = useQuery({
    queryKey: ['catalog', activeType],
    queryFn: () => fetchCatalog(activeType!),
    enabled: open && !isAllTab && !isStacksTab && activeType !== null,
    staleTime: 30 * 60 * 1000,
  });

  const stackCatalogQueries = useQueries({
    queries: STACK_CATALOG_TYPES.map((type) => ({
      queryKey: ['catalog', type] as const,
      queryFn: () => fetchCatalog(type),
      enabled: open && isStacksTab,
      staleTime: 30 * 60 * 1000,
    })),
  });

  const usabilityContextCatalogQueries = useQueries({
    queries: DECK_USABILITY_CONTEXT_TYPES.map((type) => ({
      queryKey: ['catalog', type] as const,
      queryFn: () => fetchCatalog(type),
      enabled:
        open &&
        queryClient.getQueryData(['catalog', type]) === undefined &&
        !isAllTab &&
        activeType !== type &&
        !(isStacksTab && type === 'characters'),
      staleTime: 30 * 60 * 1000,
    })),
  });

  const usabilityCatalogByType = useMemo(() => {
    const byType: Partial<Record<CatalogType, CatalogCard[]>> = {};
    DECK_USABILITY_CONTEXT_TYPES.forEach((type, i) => {
      const data = usabilityContextCatalogQueries[i]?.data;
      if (data && data.length > 0) {
        byType[type] = data;
      }
    });
    return byType;
  }, [usabilityContextCatalogQueries]);

  const { cardsByType, variantLookupByType } = useMemo(() => {
    const variantLookupByType = new Map<CatalogType, Map<string, string[]>>();

    if (isStacksTab) {
      const charactersRaw = stackCatalogQueries[0]?.data ?? [];
      const specialsRaw = stackCatalogQueries[1]?.data ?? [];
      const uaRaw = stackCatalogQueries[2]?.data ?? [];

      const characters = prepareAddCardsCatalogList(
        charactersRaw,
        'characters',
        foilLookup.foilToBase,
        setFilter || undefined,
      );
      const specials = prepareAddCardsCatalogList(
        specialsRaw,
        'special-cards',
        foilLookup.foilToBase,
        setFilter || undefined,
      );
      const advancedUniverse = prepareAddCardsCatalogList(
        uaRaw,
        'advanced-universe',
        foilLookup.foilToBase,
        setFilter || undefined,
      );

      variantLookupByType.set('characters', characters.variantIdsByRepresentative);
      variantLookupByType.set('special-cards', specials.variantIdsByRepresentative);
      variantLookupByType.set('advanced-universe', advancedUniverse.variantIdsByRepresentative);

      return {
        cardsByType: {
          characters: characters.cards,
          'special-cards': specials.cards,
          'advanced-universe': advancedUniverse.cards,
        } as Partial<Record<CatalogType, CatalogCard[]>>,
        variantLookupByType,
      };
    }

    if (isAllTab) {
      const rawByType = groupAllCatalogByType(allCatalogQuery.cards);
      const dedupedByType: Partial<Record<CatalogType, CatalogCard[]>> = {};
      for (const meta of CATALOG_TYPES) {
        const raw = rawByType[meta.type] ?? [];
        if (raw.length === 0) continue;
        const prepared = prepareAddCardsCatalogList(
          raw,
          meta.type,
          foilLookup.foilToBase,
          setFilter || undefined,
        );
        dedupedByType[meta.type] = prepared.cards;
        variantLookupByType.set(meta.type, prepared.variantIdsByRepresentative);
      }
      return { cardsByType: dedupedByType, variantLookupByType };
    }

    if (activeType) {
      const prepared = prepareAddCardsCatalogList(
        catalogQuery.data ?? [],
        activeType,
        foilLookup.foilToBase,
        setFilter || undefined,
      );
      variantLookupByType.set(activeType, prepared.variantIdsByRepresentative);
      return {
        cardsByType: { [activeType]: prepared.cards } as Partial<Record<CatalogType, CatalogCard[]>>,
        variantLookupByType,
      };
    }

    return { cardsByType: {} as Partial<Record<CatalogType, CatalogCard[]>>, variantLookupByType };
  }, [
    isAllTab,
    isStacksTab,
    activeType,
    allCatalogQuery.cards,
    catalogQuery.data,
    stackCatalogQueries,
    foilLookup.foilToBase,
    setFilter,
  ]);

  const usabilityCtx = useMemo(
    () =>
      buildDeckUsabilityContext(cards, usabilityCatalogByType, {
        deckCatalogIndex,
      }),
    [cards, usabilityCatalogByType, deckCatalogIndex],
  );

  const effectiveHideUnusables = effectiveHideUnusablesForTab(tab, hideUnusables);

  const filterOptions: AddCardsFilterOptions = useMemo(
    () => ({
      searchQuery: debouncedSearch,
      setFilter,
      hideUnusables: effectiveHideUnusables,
      usabilityCtx,
      specialScope: isAnyCharacterSpecialsTab
        ? 'any-character'
        : tab === 'special-cards'
          ? 'character-specific'
          : undefined,
      dynamicFilters: activeType ? dynamicFilters.state : undefined,
    }),
    [
      debouncedSearch,
      setFilter,
      effectiveHideUnusables,
      usabilityCtx,
      isAnyCharacterSpecialsTab,
      tab,
      activeType,
      dynamicFilters.state,
    ],
  );

  const hideUnusablesDisabled = !tabSupportsHideUnusables(tab);
  const hideUnusablesDisabledReason = isStacksTab
    ? 'Not available on the Stacks tab'
    : isMissionsTab
      ? 'Not available on the Missions tab'
      : hideUnusablesDisabled
        ? 'Not available for this card type'
        : undefined;

  const characterStacks = useMemo(() => {
    if (!isStacksTab) return [];
    return buildCharacterStacks({
      characters: cardsByType.characters ?? [],
      specials: cardsByType['special-cards'] ?? [],
      advancedUniverse: cardsByType['advanced-universe'] ?? [],
    });
  }, [isStacksTab, cardsByType]);

  const filteredStacks = useMemo(
    () =>
      filterCharacterStacksWithOptions(characterStacks, filterOptions, {
        characterNameSearchOnly: true,
      }),
    [characterStacks, filterOptions],
  );

  const allSections = useMemo(
    () => buildAddCardsSectionsWithOptions(cardsByType, filterOptions),
    [cardsByType, filterOptions],
  );

  const allFlat = useMemo(() => flattenAddCardsSections(allSections), [allSections]);

  const typeList = useMemo(() => {
    if (isAllTab || isStacksTab || isMissionsTab || !activeType) return [];
    return filterAndSortTypeCardsWithOptions(
      cardsByType[activeType] ?? [],
      activeType,
      filterOptions,
    );
  }, [isAllTab, isStacksTab, isMissionsTab, activeType, cardsByType, filterOptions]);

  const missionSets = useMemo(() => {
    if (!isMissionsTab) return [];
    return buildMissionSets(cardsByType.missions ?? []);
  }, [isMissionsTab, cardsByType.missions]);

  const filteredMissionSets = useMemo(
    () =>
      filterMissionSetsWithOptions(missionSets, filterOptions, {
        missionSetNameSearch: true,
      }),
    [missionSets, filterOptions],
  );

  const deckMissionCount = useMemo(() => countDeckMissions(cards), [cards]);
  const missionLimitReached = deckMissionCount >= 7;

  const pageSize = isStacksTab
    ? ADD_CARDS_STACKS_PAGE_SIZE
    : isMissionsTab
      ? ADD_CARDS_MISSION_SETS_PAGE_SIZE
      : isAllTab
        ? addCardsPageSizeAll(isMobile)
        : addCardsPageSizeForType(activeType!, isMobile);
  const totalItems = isStacksTab
    ? filteredStacks.length
    : isMissionsTab
      ? filteredMissionSets.length
      : isAllTab
        ? allFlat.length
        : typeList.length;
  const maxPage = Math.max(1, Math.ceil(totalItems / pageSize));
  const effectivePage = Math.min(page, maxPage);

  const pageAllItems = useMemo(
    () => (isAllTab ? paginateItems(allFlat, effectivePage, pageSize) : []),
    [isAllTab, allFlat, effectivePage, pageSize],
  );

  const pageAllBlocks = useMemo(
    () => groupPageItemsByType(pageAllItems),
    [pageAllItems],
  );

  const pageTypeCards = useMemo(
    () =>
      !isAllTab && !isStacksTab && !isMissionsTab
        ? paginateItems(typeList, effectivePage, pageSize)
        : [],
    [isAllTab, isStacksTab, isMissionsTab, typeList, effectivePage, pageSize],
  );

  const pageStacks = useMemo(
    () => (isStacksTab ? paginateItems(filteredStacks, effectivePage, pageSize) : []),
    [isStacksTab, filteredStacks, effectivePage, pageSize],
  );

  const pageMissionSets = useMemo(
    () => (isMissionsTab ? paginateItems(filteredMissionSets, effectivePage, pageSize) : []),
    [isMissionsTab, filteredMissionSets, effectivePage, pageSize],
  );

  const qtyInDeck = (card: CatalogCard, catalogType: CatalogType) => {
    const deckType = CATALOG_TYPE_BY_SLUG[catalogType].deckType;
    const variantMap = variantLookupByType.get(catalogType) ?? new Map<string, string[]>();
    return qtyInDeckForRepresentative(card, catalogType, cards, deckType, variantMap);
  };

  const maxCopiesForCard = (card: CatalogCard) => {
    return maxCopiesForAddCards(card);
  };

  const handleAddCard = (card: CatalogCard, catalogType: CatalogType) => {
    if (qtyInDeck(card, catalogType) >= maxCopiesForCard(card)) return;
    onAdd(card, catalogType);
  };

  const showHoverCard = useCallback((card: CatalogCard, catalogType: CatalogType) => {
    setHoveredCard({ card, catalogType });
  }, []);

  const clearHoverCard = useCallback(() => {
    setHoveredCard(null);
  }, []);

  const handleRemoveCard = (card: CatalogCard, catalogType: CatalogType) => {
    const deckType = CATALOG_TYPE_BY_SLUG[catalogType].deckType;
    const variantMap = variantLookupByType.get(catalogType) ?? new Map<string, string[]>();
    const instanceId = findLastInstanceIdForRepresentative(card, cards, deckType, variantMap);
    if (instanceId) onRemoveInstance(instanceId);
  };

  const renderQtyOverlay = (card: CatalogCard, catalogType: CatalogType) => (
    <AddCardsQtyOverlay
      value={qtyInDeck(card, catalogType)}
      max={maxCopiesForCard(card)}
      onIncrement={() => handleAddCard(card, catalogType)}
      onDecrement={() => handleRemoveCard(card, catalogType)}
    />
  );

  const stackInDeckCount = (stack: CharacterStack) =>
    stackCardsInAddOrder(stack).filter(({ card, catalogType }) => qtyInDeck(card, catalogType) > 0)
      .length;

  const handleAddStack = (stack: CharacterStack) => {
    const missing = stackCardsInAddOrder(stack).filter(
      ({ card, catalogType }) => qtyInDeck(card, catalogType) === 0,
    );
    if (missing.length > 0) {
      onAddStack(missing);
    }
  };

  const handleAddMissionSet = (set: MissionSet) => {
    const missing = missionSetCardsInAddOrder(set).filter(
      ({ card }) => qtyInDeck(card, 'missions') === 0,
    );
    if (missing.length > 0) {
      onAddStack(missing);
    }
  };

  const isLoading = isStacksTab
    ? stackCatalogQueries.some((q) => q.isLoading) || foilMapQuery.isLoading
    : isAllTab
      ? allCatalogQuery.isLoading || foilMapQuery.isLoading
      : catalogQuery.isLoading || foilMapQuery.isLoading;
  const isError = isStacksTab
    ? stackCatalogQueries.some((q) => q.isError)
    : isAllTab
      ? allCatalogQuery.isError
      : catalogQuery.isError;
  const hasResults = totalItems > 0;
  const dynamicFilterCards = activeType ? cardsByType[activeType] ?? [] : [];

  return (
    <SlideOutPanel
      open={open}
      onClose={onClose}
      title="Add Cards"
      ariaLabel="Add cards"
      width={575}
      className="add-cards-slideout"
      footer={
        <div className="add-cards__footer">
          <button type="button" className="btn btn-primary add-cards__done" onClick={onClose}>
            <IconClose /> Done
          </button>
        </div>
      }
    >
      <div className="add-cards-shell">
        <aside className="add-cards__context-pane" aria-label="Add cards context">
          <AddCardsTeamStats
            cards={cards}
            deckCatalogIndex={deckCatalogIndex}
            reserveCharacterId={reserveCharacterId}
            onCardHover={showHoverCard}
            onCardHoverEnd={clearHoverCard}
          />

          <AddCardsFilterBar
            sets={setsQuery.data ?? []}
            setFilter={setFilter}
            onSetFilterChange={setSetFilter}
            hideUnusables={effectiveHideUnusables}
            onHideUnusablesChange={setHideUnusables}
            hideUnusablesDisabled={hideUnusablesDisabled}
            hideUnusablesDisabledReason={hideUnusablesDisabledReason}
            activeType={activeType}
            dynamicFilters={activeType ? dynamicFilters : null}
            dynamicFilterCards={dynamicFilterCards}
          />

          <section className="add-cards__hover-preview" aria-label="Hovered card preview">
            {hoveredCard ? (
              <div className="add-cards__hover-art">
                <CardImage
                  imagePath={imagePathFromCard(hoveredCard.card)}
                  alt={cardDisplayName(hoveredCard.card)}
                  catalogType={hoveredCard.catalogType}
                  useThumbnail={false}
                  loading="eager"
                  className="card-image--contain add-cards__hover-art-image"
                  isFoil={hoveredCard.card.is_foil}
                  showFoilEffect={false}
                />
              </div>
            ) : (
              <div className="add-cards__hover-placeholder">
                <span>Hover for full image.</span>
              </div>
            )}
          </section>
        </aside>

        <div className="add-cards" ref={addCardsRef} onPointerLeave={clearHoverCard}>
          <div className="add-cards__search">
            <IconSearch className="add-cards__search-icon" />
            <input
              type="search"
              placeholder={isStacksTab ? STACKS_SEARCH_PLACEHOLDER : ADD_CARDS_SEARCH_PLACEHOLDER}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label={isStacksTab ? STACKS_SEARCH_ARIA_LABEL : ADD_CARDS_SEARCH_ARIA_LABEL}
            />
          </div>
          <div className="add-cards__types" ref={typeTabsRef} role="tablist" aria-label="Card types">
            {ADD_CARDS_TYPE_TABS.map((meta) => (
              <button
                key={meta.tab}
                type="button"
                role="tab"
                aria-selected={tab === meta.tab}
                data-add-cards-tab={meta.tab}
                className={`add-cards__type ${tab === meta.tab ? 'is-active' : ''}`}
                onClick={() => setTab(meta.tab)}
              >
                {meta.shortLabel}
              </button>
            ))}
          </div>

          <div className="add-cards__inline-filters">
            <AddCardsFilterBar
              sets={setsQuery.data ?? []}
              setFilter={setFilter}
              onSetFilterChange={setSetFilter}
              hideUnusables={effectiveHideUnusables}
              onHideUnusablesChange={setHideUnusables}
              hideUnusablesDisabled={hideUnusablesDisabled}
              hideUnusablesDisabledReason={hideUnusablesDisabledReason}
              activeType={activeType}
              dynamicFilters={activeType ? dynamicFilters : null}
              dynamicFilterCards={dynamicFilterCards}
            />
          </div>

          {isLoading ? (
          <LoadingState label="Loading..." />
        ) : isError ? (
          <EmptyState title="Could not load cards" message="Try again in a moment." icon={<IconSearch />} />
        ) : !hasResults ? (
          <EmptyState title="No cards" message="Try another search or type." icon={<IconSearch />} />
        ) : isStacksTab ? (
          <div className="add-cards__stack-list">
            {pageStacks.map((stack) => (
              <CharacterStackRow
                key={stack.characterName}
                stack={stack}
                inDeckCount={stackInDeckCount(stack)}
                totalCount={stackTotalCardCount(stack)}
                onAddStack={() => handleAddStack(stack)}
                onCardHover={showHoverCard}
                onCardHoverEnd={clearHoverCard}
              />
            ))}
          </div>
        ) : isMissionsTab ? (
          <div className="add-cards__mission-set-list">
            {pageMissionSets.map((set) => (
              <MissionSetRow
                key={set.missionSetName}
                missionSet={set}
                qtyInDeck={(card) => qtyInDeck(card, 'missions')}
                missionLimitReached={missionLimitReached}
                renderOverlay={(card, _inDeck) => renderQtyOverlay(card, 'missions')}
                onAddMission={(card) => handleAddCard(card, 'missions')}
                onAddSet={() => handleAddMissionSet(set)}
                onCardHover={showHoverCard}
                onCardHoverEnd={clearHoverCard}
              />
            ))}
          </div>
        ) : isAllTab ? (
          <div className="add-cards__sections">
            {pageAllBlocks.map((block, blockIndex) => (
              <section className="add-cards__section" key={`${block.meta.type}-${blockIndex}`}>
                <h3 className="add-cards__section-title">
                  {block.meta.label}
                  <span className="add-cards__section-count">{block.cards.length}</span>
                </h3>
                <div className={addCardsGridClassName(block.meta.type)}>
                  {block.cards.map((card) => {
                    const catalogType = block.meta.type;
                    return (
                      <CardTile
                        key={`${catalogType}-${card.id}`}
                        card={card}
                        catalogType={catalogType}
                        showMeta={false}
                        showFoilEffect={false}
                        onClick={() => handleAddCard(card, catalogType)}
                        overlay={renderQtyOverlay(card, catalogType)}
                        onHoverStart={() => showHoverCard(card, catalogType)}
                        onHoverEnd={clearHoverCard}
                      />
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className={addCardsGridClassName(activeType!)}>
            {pageTypeCards.map((card) => {
              const catalogType = activeType!;
              return (
                <CardTile
                  key={card.id}
                  card={card}
                  catalogType={catalogType}
                  showMeta={false}
                  showFoilEffect={false}
                  onClick={() => handleAddCard(card, catalogType)}
                  overlay={renderQtyOverlay(card, catalogType)}
                  onHoverStart={() => showHoverCard(card, catalogType)}
                  onHoverEnd={clearHoverCard}
                />
              );
            })}
          </div>
        )}

        {hasResults && !isLoading ? (
          <Pagination
            className="add-cards__pagination"
            page={effectivePage}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setPage}
          />
        ) : null}
        </div>
      </div>
    </SlideOutPanel>
  );
}
