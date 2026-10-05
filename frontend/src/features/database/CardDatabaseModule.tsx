import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useModuleHost, useModuleDetailHistory } from '../../modules/ModuleHost';
import { renderModuleCardActions } from '../../modules/cardActions';

import {
  buildFoilCardMapLookup,
  cardHasFoilVersion,
  dedupeFoilCatalogCards,
  isFoilCard,
  matchesHasFoilFilter,
} from '../../lib/catalog/foilCatalog';

import {
  DATABASE_TYPE_TABS,
  DBV_TAB_ORDER,
  cardMatchesDbvTab,
  cardMatchesSearchQuery,
  compareDbvAllSetsCatalogCards,
  compareDbvCatalogCards,
  isLandscapeCatalogType,
  metaForDeckType,
  CATALOG_TYPE_BY_SLUG,
  dbvCatalogTypeForTab,
  type DbvTabSelection,
} from '../../lib/catalog/catalogTypeMap';
import { compareAllCatalogCards } from '../../lib/catalog/allCatalogSort';
import {
  dedupeToDefaultCatalogCards,
  resolveDefaultCardForDeckAdd,
} from '../../lib/catalog/defaultCatalogCards';
import { collectPrintingsForCard } from '../../lib/catalog/cardPrintings';
import type { FoilCardMapLookup } from '../../lib/catalog/foilCatalog';
import { useAllCatalogCards } from '../../lib/catalog/useAllCatalogCards';
import { buildSetNameLookup, resolveSetDisplayName } from '../../lib/catalog/setNames';
import { useCollectionController } from '../../lib/collection/useCollectionController';
import { CardTile } from '../../components/CardTile';
import { CardDetailPanel } from '../../components/CardDetailPanel';
import { CatalogAllList } from '../../components/CatalogAllList';
import { Pagination } from '../../components/Pagination';
import { LoadingState } from '../../components/LoadingState';
import { EmptyState } from '../../components/EmptyState';
import { useLayoutMode } from '../../lib/layout/LayoutModeProvider';
import { stepCyclicalIndex } from '../../lib/layout/cyclicalIndex';
import { DBV_SWIPE_BLOCK_SELECTOR, useHorizontalSwipe } from '../../lib/layout/useHorizontalSwipe';

import { IconSearch, IconPlus, IconLock, IconDatabase, IconBookmark } from '../../components/icons';
import { clearProgressiveImageSession } from '../../lib/images/progressiveImageLoad';
import type { CatalogCard, CatalogType, CollectionCardType } from '../../lib/api/types';
import { DbvFilterRail } from './components/DbvFilterRail';
import { cardMatchesDbvFilters } from './filters/dbvFilterPredicates';
import { useDbvFilters } from './filters/useDbvFilters';
import { type SavedDatabaseView } from '../../lib/api/savedDatabaseViews';
import {
  SAVED_DATABASE_VIEWS_QUERY_KEY,
  SavedDatabaseViewsPanel,
  type SavedViewCreateRequest,
} from './components/SavedDatabaseViewsPanel';
import {
  captureSavedDatabaseViewState,
  normalizeSavedDatabaseViewState,
} from './savedDatabaseViewState';

const PAGE_SIZE_GRID = 24;
const PAGE_SIZE_ALL = 48;

function useDebounced<T>(value: T, delay = 250): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export function useCardDatabaseController() {
  const { isMobile } = useLayoutMode();
  const host = useModuleHost();
  const { isAdmin } = host.identity;
  const { fetchCatalog, fetchCatalogFresh, fetchFoilCardMap, fetchSets, fetchSavedDatabaseViews } = useModuleHost().api;
  const queryClient = useQueryClient();
  const dbRef = useRef<HTMLDivElement>(null);
  const typeTabsRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<DbvTabSelection>('characters');
  const [search, setSearch] = useState('');
  const [setFilter, setSetFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<CatalogCard | null>(null);
  const [selectedCatalogType, setSelectedCatalogType] = useState<CatalogType>('characters');
  const [filterRailCollapsed, setFilterRailCollapsed] = useState(false);
  const [mobileFilterPaneExpanded, setMobileFilterPaneExpanded] = useState(false);
  const [hasFoilFilter, setHasFoilFilter] = useState(false);
  const [hideAltsFilter, setHideAltsFilter] = useState(true);
  const [savedViewsOpen, setSavedViewsOpen] = useState(false);
  const [savedViewCreateRequest, setSavedViewCreateRequest] = useState<SavedViewCreateRequest | null>(null);
  const [activeSavedViewId, setActiveSavedViewId] = useState<string | null>(null);
  const [recallNotice, setRecallNotice] = useState<string | null>(null);
  const savedViewRequestIdRef = useRef(0);

  const { close: closeCardDetail } = useModuleDetailHistory(Boolean(selected), () => setSelected(null));

  const isAllTab = tab === 'all';
  const pageSize = isAllTab ? PAGE_SIZE_ALL : PAGE_SIZE_GRID;
  const tabCatalogType = dbvCatalogTypeForTab(tab);
  const activeCatalogType = isAllTab ? selectedCatalogType : tabCatalogType!;
  /** Pin catalog/deck type to the selected card so tab switches cannot miscategorize adds. */
  const detailCatalogType = selected ? selectedCatalogType : activeCatalogType;

  const debouncedSearch = useDebounced(search);
  const dbvFilters = useDbvFilters(tabCatalogType ?? 'characters');

  const savedViewsQuery = useQuery({
    queryKey: SAVED_DATABASE_VIEWS_QUERY_KEY,
    queryFn: ({ signal }) => fetchSavedDatabaseViews(signal),
    enabled: isAdmin,
    staleTime: 60 * 1000,
  });

  const catalogQuery = useQuery({
    queryKey: ['catalog', tabCatalogType],
    queryFn: ({ signal }) => fetchCatalog(tabCatalogType!, signal),
    enabled: !isAllTab,
    staleTime: 30 * 60 * 1000,
  });
  const setsQuery = useQuery({ queryKey: ['sets'], queryFn: ({ signal }) => fetchSets(signal), staleTime: 60 * 60 * 1000 });
  const foilMapQuery = useQuery({
    queryKey: ['foil-card-map'],
    queryFn: ({ signal }) => fetchFoilCardMap(signal),
    staleTime: 60 * 60 * 1000,
  });

  const foilLookup = useMemo(
    () => buildFoilCardMapLookup(foilMapQuery.data ?? []),
    [foilMapQuery.data],
  );

  const setNameLookup = useMemo(
    () => buildSetNameLookup(setsQuery.data ?? []),
    [setsQuery.data],
  );

  const allCatalogQuery = useAllCatalogCards({
    enabled: isAllTab,
    foilToBase: foilLookup.foilToBase,
  });

  const detailCatalogCached = queryClient.getQueryData<CatalogCard[]>(['catalog', detailCatalogType]);

  const detailTypeCatalogQuery = useQuery({
    queryKey: ['catalog', detailCatalogType],
    queryFn: () => fetchCatalogFresh(detailCatalogType),
    enabled: Boolean(selected),
    staleTime: 0,
  });

  const detailTypeCatalogCards = detailCatalogCached ?? detailTypeCatalogQuery.data ?? [];

  useEffect(() => {
    if (!selected || !detailTypeCatalogQuery.data) return;
    const freshSelected = detailTypeCatalogQuery.data.find((card) => card.id === selected.id);
    if (freshSelected && freshSelected !== selected) setSelected(freshSelected);
  }, [detailTypeCatalogQuery.data, selected]);

  const detailPrintingCards = useMemo(() => {
    if (!selected) return undefined;
    const printings = collectPrintingsForCard(
      selected,
      detailCatalogType,
      detailTypeCatalogCards,
      foilLookup,
      (set) => resolveSetDisplayName(set, setNameLookup) ?? String(set ?? ''),
    );
    if (printings.length <= 1) return undefined;
    return printings;
  }, [selected, detailCatalogType, detailTypeCatalogCards, foilLookup, setNameLookup]);

  const detailPrintingRows = useMemo(() => {
    if (!selected || !detailPrintingCards) return undefined;
    return detailPrintingCards.map((printing) => ({
      card: printing,
      setDisplayName: resolveSetDisplayName(printing.set, setNameLookup) ?? String(printing.set ?? ''),
      setNumber: printing.set_number ? String(printing.set_number) : null,
      isCurrent: printing.id === selected.id,
    }));
  }, [selected, detailPrintingCards, setNameLookup]);

  const viewPrintingInDetail = useCallback(
    async (printingId: string) => {
      let currentCatalog = detailTypeCatalogCards;
      try {
        currentCatalog = await queryClient.fetchQuery({
          queryKey: ['catalog', detailCatalogType],
          queryFn: () => fetchCatalogFresh(detailCatalogType),
          staleTime: 0,
        });
      } catch {
        currentCatalog = detailTypeCatalogCards;
      }
      const printing = currentCatalog.find((c) => c.id === printingId);
      if (printing) setSelected(printing);
    },
    [detailCatalogType, detailTypeCatalogCards, queryClient],
  );

  const perTypeCards = useMemo(
    () => dedupeFoilCatalogCards(catalogQuery.data ?? [], foilLookup.foilToBase),
    [catalogQuery.data, foilLookup.foilToBase],
  );

  const gridPrintingSelection = useMemo(() => {
    if (isAllTab) return [];
    const q = debouncedSearch.trim().toLowerCase();
    const catalogType = tabCatalogType!;
    const searchAndSetMatches = perTypeCards.filter((c) => {
      if (!cardMatchesDbvTab(c, tab)) return false;
      if (q && !cardMatchesSearchQuery(c, q)) return false;
      if (setFilter && String(c.set ?? '') !== setFilter) return false;
      return true;
    });
    if (hideAltsFilter) {
      return dedupeToDefaultCatalogCards(searchAndSetMatches, catalogType, setFilter || undefined);
    }
    return {
      cards: searchAndSetMatches,
      variantIdsByRepresentative: new Map(searchAndSetMatches.map((card) => [card.id, [card.id]])),
    };
  }, [perTypeCards, debouncedSearch, setFilter, tab, tabCatalogType, hideAltsFilter, isAllTab]);

  const gridFiltered = useMemo(() => {
    if (isAllTab || Array.isArray(gridPrintingSelection)) return [];
    const catalogType = tabCatalogType!;
    const result = gridPrintingSelection.cards.filter((c) => {
      if (!cardMatchesDbvFilters(c, catalogType, dbvFilters.state)) return false;
      if (!matchesHasFoilFilter(c, foilLookup.baseToFoil, hasFoilFilter)) return false;
      return true;
    });
    result.sort((a, b) =>
      setFilter
        ? compareDbvCatalogCards(a, b, catalogType)
        : compareDbvAllSetsCatalogCards(a, b, catalogType),
    );
    return result;
  }, [gridPrintingSelection, setFilter, tabCatalogType, dbvFilters.state, hasFoilFilter, foilLookup.baseToFoil, isAllTab]);

  const allTabFiltered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    const result = allCatalogQuery.cards.filter(({ card }) => {
      if (q && !cardMatchesSearchQuery(card, q)) return false;
      if (setFilter && String(card.set ?? '') !== setFilter) return false;
      return true;
    });
    result.sort((a, b) => compareAllCatalogCards(a.card, b.card));
    return result;
  }, [allCatalogQuery.cards, debouncedSearch, setFilter]);

  const filtered = isAllTab ? allTabFiltered : gridFiltered;

  useEffect(() => {
    setPage(1);
  }, [tab, debouncedSearch, setFilter, dbvFilters.state, hasFoilFilter, hideAltsFilter]);

  useEffect(() => () => clearProgressiveImageSession('database'), []);

  const goToRelativeTab = useCallback(
    (delta: 1 | -1) => {
      const idx = DBV_TAB_ORDER.indexOf(tab);
      const next = DBV_TAB_ORDER[stepCyclicalIndex(idx >= 0 ? idx : 0, DBV_TAB_ORDER.length, delta)];
      setTab(next);
      if (!selected && next !== 'all') {
        setSelectedCatalogType(dbvCatalogTypeForTab(next)!);
      }
    },
    [tab, selected],
  );

  useHorizontalSwipe({
    targetRef: dbRef,
    enabled: isMobile && !selected,
    blockSelector: DBV_SWIPE_BLOCK_SELECTOR,
    onSwipeLeft: () => goToRelativeTab(1),
    onSwipeRight: () => goToRelativeTab(-1),
  });

  useEffect(() => {
    if (!isMobile) return;
    if (host.layout || host.styles) dbRef.current?.scrollTo?.({ top: 0 }); else window.scrollTo({ top: 0 });
  }, [tab, isMobile]);

  useEffect(() => {
    if (!isMobile || !typeTabsRef.current) return;
    const activeTab = typeTabsRef.current.querySelector<HTMLElement>(`[data-db-tab="${tab}"]`);
    activeTab?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [tab, isMobile]);

  const maxPage = Math.max(1, Math.ceil(filtered.length / pageSize));
  const effectivePage = Math.min(page, maxPage);
  const pageStart = (effectivePage - 1) * pageSize;
  const pageGridCards = isAllTab ? [] : gridFiltered.slice(pageStart, pageStart + pageSize);
  const pageAllItems = isAllTab ? allTabFiltered.slice(pageStart, pageStart + pageSize) : [];

  const isLoading = isAllTab ? allCatalogQuery.isLoading : catalogQuery.isLoading;
  const isError = isAllTab ? allCatalogQuery.isError : catalogQuery.isError;
  const detailCollectionType = CATALOG_TYPE_BY_SLUG[detailCatalogType].collectionType;

  const selectCard = (card: CatalogCard, catalogType: CatalogType) => {
    setSelected(card);
    setSelectedCatalogType(catalogType);
  };

  const currentSavedViewState = useMemo(() => captureSavedDatabaseViewState({
    tab,
    search,
    setFilter,
    filters: dbvFilters.state,
    hasFoilFilter,
    hideAltsFilter,
  }), [tab, search, setFilter, dbvFilters.state, hasFoilFilter, hideAltsFilter]);

  const startSavedViewDraft = () => {
    if (!savedViewsQuery.data || savedViewsQuery.data.count >= savedViewsQuery.data.max) return;
    savedViewRequestIdRef.current += 1;
    setSavedViewCreateRequest({ id: savedViewRequestIdRef.current, viewState: currentSavedViewState });
    setSavedViewsOpen(true);
  };

  const recallSavedView = async (view: SavedDatabaseView) => {
    const rawState = view.viewState;
    const sets = setsQuery.data ?? await queryClient.ensureQueryData({
      queryKey: ['sets'],
      queryFn: ({ signal }) => fetchSets(signal),
      staleTime: 60 * 60 * 1000,
    }) ?? [];
    let targetCards: CatalogCard[] = [];
    if (rawState.tab === 'missions' || rawState.tab === 'events') {
      const targetType = rawState.tab;
      targetCards = await queryClient.ensureQueryData({
        queryKey: ['catalog', targetType],
        queryFn: ({ signal }) => fetchCatalog(targetType, signal),
        staleTime: 30 * 60 * 1000,
      });
    }
    const normalized = normalizeSavedDatabaseViewState(
      rawState,
      sets.map((set) => set.code),
      targetCards,
    );
    if (!normalized) throw new Error('This saved view uses an unsupported state format.');
    const targetCatalogType = dbvCatalogTypeForTab(normalized.state.tab) ?? 'characters';
    dbvFilters.hydrateState(normalized.state.filters, targetCatalogType);
    setTab(normalized.state.tab);
    setSearch(normalized.state.search);
    setSetFilter(normalized.state.setFilter);
    setHasFoilFilter(normalized.state.hasFoilFilter);
    setHideAltsFilter(normalized.state.hideAltsFilter);
    setPage(1);
    if (selected) closeCardDetail(); else setSelected(null);
    if (normalized.state.tab !== 'all') setSelectedCatalogType(targetCatalogType);
    setActiveSavedViewId(view.id);
    setRecallNotice(normalized.notices.length > 0
      ? `Recalled “${view.name}”. ${normalized.notices.join(' ')}`
      : `Recalled “${view.name}”.`);
    if (isMobile) setSavedViewsOpen(false);
  };

  const savedViewsAtLimit = Boolean(
    savedViewsQuery.data && savedViewsQuery.data.count >= savedViewsQuery.data.max,
  );
  const savedViewsTooltipId = 'saved-views-limit-tooltip';
  const catalogError = (isAllTab ? allCatalogQuery.isError : catalogQuery.isError);
  const retryCatalog = () => { if (isAllTab) allCatalogQuery.retry(); else void catalogQuery.refetch(); };

  return { cardActions: host.cardActions, isGuest: host.identity.isGuest, catalogError, retryCatalog, isMobile, isAdmin, dbRef, typeTabsRef, tab, setTab, search, setSearch, setFilter, setSetFilter, page, setPage, selected, setSelectedCatalogType, filterRailCollapsed, setFilterRailCollapsed, mobileFilterPaneExpanded, setMobileFilterPaneExpanded, hasFoilFilter, setHasFoilFilter, hideAltsFilter, setHideAltsFilter, savedViewsOpen, setSavedViewsOpen, savedViewCreateRequest, activeSavedViewId, recallNotice, closeCardDetail, isAllTab, pageSize, activeCatalogType, detailCatalogType, dbvFilters, savedViews: { data: savedViewsQuery.data, isLoading: savedViewsQuery.isLoading, isError: savedViewsQuery.isError }, sets: setsQuery.data ?? [], foilLookup, setNameLookup, detailTypeCatalogCards, detailPrintingRows, viewPrintingInDetail, perTypeCards, filtered, pageGridCards, pageAllItems, isLoading, isError, detailCollectionType, selectCard, startSavedViewDraft, recallSavedView, savedViewsAtLimit, savedViewsTooltipId };
}

export function CardDatabaseView({ model }: { model: ReturnType<typeof useCardDatabaseController> }) {
 const { cardActions, isGuest, catalogError, retryCatalog, isMobile, isAdmin, dbRef, typeTabsRef, tab, setTab, search, setSearch, setFilter, setSetFilter, page, setPage, selected, setSelectedCatalogType, filterRailCollapsed, setFilterRailCollapsed, mobileFilterPaneExpanded, setMobileFilterPaneExpanded, hasFoilFilter, setHasFoilFilter, hideAltsFilter, setHideAltsFilter, savedViewsOpen, setSavedViewsOpen, savedViewCreateRequest, activeSavedViewId, recallNotice, closeCardDetail, isAllTab, pageSize, activeCatalogType, detailCatalogType, dbvFilters, savedViews, sets, foilLookup, setNameLookup, detailTypeCatalogCards, detailPrintingRows, viewPrintingInDetail, perTypeCards, filtered, pageGridCards, pageAllItems, isLoading, isError, detailCollectionType, selectCard, startSavedViewDraft, recallSavedView, savedViewsAtLimit, savedViewsTooltipId } = model;


  return (
    <div className="db" ref={dbRef}>
      <div className="db__inner">
        <header className="db__header">
          <h1 className="db__title"><IconDatabase /> Card Database</h1>
          <div className="db__header-controls">
            <div className="db__search">
              <IconSearch className="db__search-icon" />
              <input
                type="search"
                placeholder="Search name, character, mission set, or card text..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search cards"
              />
            </div>
            <div className="db__set">
              <label className="sr-only" htmlFor="db-set-filter">Set</label>
              <select
                id="db-set-filter"
                value={setFilter}
                onChange={(e) => setSetFilter(e.target.value)}
                aria-label="Filter by set"
              >
                <option value="">All sets</option>
                {sets.map((s) => (
                  <option key={s.code} value={s.code}>{s.name || s.code}</option>
                ))}
              </select>
            </div>
            {isAdmin ? (
              <div className="db__saved-controls">
                <span
                  className={`db__save-view-wrap${savedViewsAtLimit ? ' is-disabled' : ''}`}
                  tabIndex={savedViewsAtLimit ? 0 : undefined}
                  aria-describedby={savedViewsAtLimit ? savedViewsTooltipId : undefined}
                >
                  <button
                    type="button"
                    className="db__saved-view-btn"
                    onClick={startSavedViewDraft}
                    disabled={savedViewsAtLimit || savedViews.isLoading || savedViews.isError}
                  >
                    <IconBookmark /> Save this view
                  </button>
                  {savedViewsAtLimit ? (
                    <span id={savedViewsTooltipId} className="db__save-view-tooltip" role="tooltip">
                      This account has reached the {savedViews.data?.max} saved-view limit.
                    </span>
                  ) : null}
                </span>
                <button
                  type="button"
                  className="db__saved-view-btn"
                  aria-expanded={savedViewsOpen}
                  aria-controls="saved-database-views-panel"
                  onClick={() => setSavedViewsOpen((open) => !open)}
                >
                  <IconDatabase /> Saved views ({savedViews.data?.count ?? 0})
                </button>
              </div>
            ) : null}
          </div>
        </header>

        {recallNotice ? <div className="db__recall-notice" role="status">{recallNotice}</div> : null}

        <div className="db__types" ref={typeTabsRef} role="tablist" aria-label="Card types">
          <button
            type="button"
            role="tab"
            aria-selected={isAllTab}
            className={`db__type ${isAllTab ? 'is-active' : ''}`}
            data-db-tab="all"
            onClick={() => setTab('all')}
          >
            All
          </button>
          {DATABASE_TYPE_TABS.map((meta) => (
            <button
              key={meta.tab}
              type="button"
              role="tab"
              aria-selected={tab === meta.tab}
              className={`db__type ${tab === meta.tab ? 'is-active' : ''}`}
              data-db-tab={meta.tab}
              onClick={() => {
                setTab(meta.tab);
                if (!selected) {
                  setSelectedCatalogType(dbvCatalogTypeForTab(meta.tab)!);
                }
              }}
            >
              {isMobile ? meta.shortLabel : meta.label}
            </button>
          ))}
        </div>

        {!isError && !isAllTab ? (
          <DbvFilterRail
            catalogType={activeCatalogType}
            filters={dbvFilters}
            allCards={perTypeCards}
            collapsed={isMobile ? !mobileFilterPaneExpanded : filterRailCollapsed}
            onCollapsedChange={(collapsed) => {
              if (isMobile) {
                setMobileFilterPaneExpanded(!collapsed);
                return;
              }
              setFilterRailCollapsed(collapsed);
            }}
            hasFoilFilter={hasFoilFilter}
            onHasFoilFilterChange={setHasFoilFilter}
            hideAltsFilter={hideAltsFilter}
            onHideAltsFilterChange={setHideAltsFilter}
          />
        ) : null}

        {catalogError ? (<EmptyState variant="error" title="Cards unavailable" message="Retry without losing your filters." action={<button type="button" onClick={retryCatalog}>Retry cards</button>} />) : isLoading ? (
          <LoadingState label="Loading cards..." />
        ) : isError ? (
          <EmptyState variant="error" title="Couldn't load cards" message="Please try again." icon={<IconDatabase />} />
        ) : filtered.length === 0 ? (
          <EmptyState title="No cards found" message="Try adjusting your search or filters." icon={<IconSearch />} />
        ) : isAllTab ? (
          <>
            <CatalogAllList
              items={pageAllItems}
              selectedId={selected?.id}
              onSelect={(item) => selectCard(item.card, item.catalogType)}
              setNameLookup={setNameLookup}
            />
            <Pagination page={page} pageSize={pageSize} totalItems={filtered.length} onPageChange={setPage} />
          </>
        ) : (
          <>
            <div className={`db__grid ${isLandscapeCatalogType(activeCatalogType) ? 'db__grid--landscape' : 'db__grid--portrait'}`}>
              {pageGridCards.map((card) => (
                <CardTile
                  key={card.id}
                  card={card}
                  catalogType={activeCatalogType}
                  hasFoilVersion={cardHasFoilVersion(card, foilLookup.baseToFoil)}
                  showFoilEffect={false}
                  onClick={() => selectCard(card, activeCatalogType)}
                />
              ))}
            </div>
            <Pagination page={page} pageSize={pageSize} totalItems={filtered.length} onPageChange={setPage} />
          </>
        )}
      </div>

      {isAdmin ? (
        <SavedDatabaseViewsPanel
          open={savedViewsOpen}
          isMobile={isMobile}
          onClose={() => setSavedViewsOpen(false)}
          data={savedViews.data}
          isLoading={savedViews.isLoading}
          loadError={savedViews.isError}
          createRequest={savedViewCreateRequest}
          activeViewId={activeSavedViewId}
          onRecall={recallSavedView}
        />
      ) : null}

      <CardDetailPanel
        card={selected}
        type={detailCatalogType}
        open={Boolean(selected)}
        onClose={closeCardDetail}
        hasFoil={selected ? cardHasFoilVersion(selected, foilLookup.baseToFoil) : undefined}
        isFoil={selected ? isFoilCard(selected) : undefined}
        setDisplayName={selected ? resolveSetDisplayName(selected.set, setNameLookup) : undefined}
        printings={detailPrintingRows}
        onApplyPrinting={viewPrintingInDetail}
        actions={
          selected ? renderModuleCardActions(cardActions, { source: 'database', card: selected, catalogType: detailCatalogType, isGuest, close: closeCardDetail }, (
            <DbDetailActions
              card={selected}
              type={detailCatalogType}
              collectionType={detailCollectionType}
              catalogCards={detailTypeCatalogCards}
              foilLookup={foilLookup}
            />
          )) : null
        }
      />

    </div>
  );

}
export function CardDatabaseModule() {
 return <CardDatabaseView model={useCardDatabaseController()} />;
}


/**
 * Slide-out action row: fixed pill buttons + shared panel for deck picker and feedback.
 * Per product rules, +Deck is disabled for GUEST (see GUEST_DECK_LESSONS_LEARNED.md).
 */
type ActionStatus = { kind: 'success' | 'error'; message: string };

function useDbDetailController({
  card,
  type,
  collectionType,
  catalogCards,
  foilLookup,
}: {
  card: CatalogCard;
  type: CatalogType;
  collectionType: CollectionCardType;
  catalogCards: CatalogCard[];
  foilLookup: FoilCardMapLookup;
}) {
  const collection = useCollectionController(useModuleHost().identity.isGuest);
  const { isGuest, user } = useModuleHost().identity;
  const { fetchUserDecks, addCardToDeck } = useModuleHost().api;
  const queryClient = useQueryClient();
  const [deckMenuOpen, setDeckMenuOpen] = useState(false);
  const [status, setStatus] = useState<ActionStatus | null>(null);

  const decksQuery = useQuery({
    queryKey: ['decks', 'mine', user?.id],
    queryFn: ({ signal }) => fetchUserDecks(signal),
    enabled: deckMenuOpen && !isGuest,
  });

  useEffect(() => {
    setDeckMenuOpen(false);
    setStatus(null);
  }, [card.id, collectionType]);

  const deckType = CATALOG_TYPE_BY_SLUG[type]?.deckType ?? metaForDeckType(type)?.deckType ?? type;

  const toggleDeckMenu = () => {
    setStatus(null);
    setDeckMenuOpen((open) => !open);
  };

  const addToDeck = async (deckId: string, deckName: string) => {
    setStatus(null);
    try {
      const resolved = resolveDefaultCardForDeckAdd(card, type, catalogCards, foilLookup);
      const updatedDeck = await addCardToDeck(deckId, { cardType: deckType, cardId: resolved.id, quantity: 1 });
      // Publish the authoritative mutation snapshot before navigation can mount
      // the editor from its previously cached card list. Cancel an older read
      // so it cannot replace this snapshot after the successful addition.
      await queryClient.cancelQueries({ queryKey: ['deck', deckId], exact: true });
      queryClient.setQueryData(['deck', deckId], updatedDeck);
      setStatus({ kind: 'success', message: `Added to ${deckName}` });
      queryClient.invalidateQueries({ queryKey: ['decks', 'mine', user?.id] });
    } catch (err) {
      setStatus({ kind: 'error', message: (err as Error)?.message || 'Could not add card' });
    }
  };

  const addToCollection = async () => {
    setDeckMenuOpen(false);
    setStatus(null);
    try {
      const next = collection.quantityFor(card.id, collectionType) + 1;
      await collection.setQuantity(card, collectionType, next);
      setStatus({ kind: 'success', message: 'Added to collection' });
    } catch (err) {
      setStatus({ kind: 'error', message: (err as Error)?.message || 'Could not add to collection' });
    }
  };

  const showPanel = deckMenuOpen || status !== null;
  return { isGuest, deckMenuOpen, status, showPanel, toggleDeckMenu, addToCollection, addToDeck, decksLoading: decksQuery.isLoading, decks: decksQuery.data ?? [], decksError: decksQuery.isError, retryDecks: () => void decksQuery.refetch() };
}

function DbDetailActions(props: Parameters<typeof useDbDetailController>[0]) {
  const { isGuest, deckMenuOpen, status, showPanel, toggleDeckMenu, addToCollection, addToDeck, decksLoading, decks, decksError, retryDecks } = useDbDetailController(props);

  return (
    <div className="db__detail-actions">
      <div className="db__detail-actions-row">
        {isGuest ? (
          <button type="button" className="btn btn-ghost db__add-deck" disabled title="Log in to add to decks">
            <IconLock /> Log in to add to decks
          </button>
        ) : (
          <button type="button" className="btn btn-ghost db__add-deck" onClick={toggleDeckMenu}>
            <IconPlus /> Add to Deck
          </button>
        )}
        <button type="button" className="btn btn-ghost db__add-collection" onClick={() => void addToCollection()}>
          <IconPlus /> Collection
        </button>
      </div>
      {showPanel ? (
        <div className="db__detail-actions-panel">
          {deckMenuOpen && !isGuest ? (
            <div className="db__deck-menu">
              {decksLoading ? (
                <div className="db__deck-menu-empty">Loading decks...</div>
              ) : decksError ? (<div role="alert">Decks unavailable<button type="button" onClick={retryDecks}>Retry decks</button></div>) : decks.length === 0 ? (
                <div className="db__deck-menu-empty">You have no decks yet.</div>
              ) : (
                decks.map((d) => (
                  <button
                    key={d.metadata.id}
                    type="button"
                    className="db__deck-menu-item"
                    onClick={() => void addToDeck(d.metadata.id, d.metadata.name)}
                  >
                    {d.metadata.name}
                  </button>
                ))
              )}
            </div>
          ) : null}
          {status ? (
            <div className={`db__add-status${status.kind === 'error' ? ' db__add-status--error' : ''}`}>
              {status.message}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
