import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchCatalog, fetchSets } from '../../lib/api/catalog';
import { useCollection } from '../../lib/collection/useCollection';
import {
  CATALOG_TYPES,
  CATALOG_TYPE_BY_SLUG,
  DBV_TAB_ORDER,
  cardDisplayName,
  cardLinkedDisplayName,
  cardMatchesSearchQuery,
  isLandscapeCatalogType,
  type DbvTabSelection,
} from '../../lib/catalog/catalogTypeMap';
import { compareCollectionCatalogCards } from '../../lib/catalog/allCatalogSort';
import { useAllCatalogCards } from '../../lib/catalog/useAllCatalogCards';
import { isFoilCard } from '../../lib/catalog/foilCatalog';
import { buildSetNameLookup } from '../../lib/catalog/setNames';
import { CardTile } from '../../components/CardTile';
import { CardDetailPanel } from '../../components/CardDetailPanel';
import { CatalogAllList } from '../../components/CatalogAllList';
import { QuantityStepper } from '../../components/QuantityStepper';
import { Pagination } from '../../components/Pagination';
import { LoadingState } from '../../components/LoadingState';
import { EmptyState } from '../../components/EmptyState';
import { useLayoutMode } from '../../lib/layout/LayoutModeProvider';
import { stepCyclicalIndex } from '../../lib/layout/cyclicalIndex';
import { COLLECTION_SWIPE_BLOCK_SELECTOR, useHorizontalSwipe } from '../../lib/layout/useHorizontalSwipe';
import { useCardDetailHistory } from '../../lib/layout/useCardDetailHistory';
import { Checkbox } from '../../components/Checkbox';
import { IconSearch, IconCollection } from '../../components/icons';
import type { CatalogCard, CatalogType, CollectionCardType } from '../../lib/api/types';
import { COLLECTION_DEFAULT_TAB } from './collectionDefaults';
import './CollectionPage.css';

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

export default function CollectionPage() {
  const { isMobile } = useLayoutMode();
  const colRef = useRef<HTMLDivElement>(null);
  const typeTabsRef = useRef<HTMLDivElement>(null);
  const collection = useCollection();
  const [tab, setTab] = useState<DbvTabSelection>(COLLECTION_DEFAULT_TAB);
  const [search, setSearch] = useState('');
  const [setFilter, setSetFilter] = useState('');
  const [ownedOnly, setOwnedOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<CatalogCard | null>(null);
  const [selectedCatalogType, setSelectedCatalogType] = useState<CatalogType>('characters');

  const { close: closeCardDetail } = useCardDetailHistory(Boolean(selected), () => setSelected(null));

  const isAllTab = tab === 'all';
  const pageSize = isAllTab ? PAGE_SIZE_ALL : PAGE_SIZE_GRID;
  const activeCatalogType = isAllTab ? selectedCatalogType : tab;
  const activeCollectionType = CATALOG_TYPE_BY_SLUG[activeCatalogType].collectionType;

  const debouncedSearch = useDebounced(search);

  const catalogQuery = useQuery({
    queryKey: ['catalog', tab],
    queryFn: () => fetchCatalog(tab as CatalogType),
    enabled: !isAllTab,
    staleTime: 30 * 60 * 1000,
  });
  const setsQuery = useQuery({ queryKey: ['sets'], queryFn: () => fetchSets(), staleTime: 60 * 60 * 1000 });
  const allCatalogQuery = useAllCatalogCards({ enabled: isAllTab });
  const setNameLookup = useMemo(
    () => buildSetNameLookup(setsQuery.data ?? []),
    [setsQuery.data],
  );

  const perTypeCards = catalogQuery.data ?? [];

  const gridFiltered = useMemo(() => {
    if (isAllTab) return [];
    const q = debouncedSearch.trim().toLowerCase();
    const collectionType = CATALOG_TYPE_BY_SLUG[tab].collectionType;
    const result = perTypeCards.filter((c) => {
      if (q && !cardMatchesSearchQuery(c, q)) return false;
      if (setFilter && String(c.set ?? '') !== setFilter) return false;
      if (ownedOnly && collection.quantityFor(c.id, collectionType) <= 0) return false;
      return true;
    });
    result.sort((a, b) => compareCollectionCatalogCards(a, b));
    return result;
  }, [perTypeCards, debouncedSearch, setFilter, ownedOnly, collection.quantityFor, tab, isAllTab]);

  const allTabFiltered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    const result = allCatalogQuery.cards.filter(({ card, catalogType }) => {
      const collectionType = CATALOG_TYPE_BY_SLUG[catalogType].collectionType;
      if (q && !cardMatchesSearchQuery(card, q)) return false;
      if (setFilter && String(card.set ?? '') !== setFilter) return false;
      if (ownedOnly && collection.quantityFor(card.id, collectionType) <= 0) return false;
      return true;
    });
    result.sort((a, b) => compareCollectionCatalogCards(a.card, b.card));
    return result;
  }, [allCatalogQuery.cards, debouncedSearch, setFilter, ownedOnly, collection.quantityFor]);

  const filtered = isAllTab ? allTabFiltered : gridFiltered;

  useEffect(() => {
    setPage(1);
  }, [tab, debouncedSearch, setFilter, ownedOnly]);

  const goToRelativeTab = useCallback(
    (delta: 1 | -1) => {
      const idx = DBV_TAB_ORDER.indexOf(tab);
      const next = DBV_TAB_ORDER[stepCyclicalIndex(idx >= 0 ? idx : 0, DBV_TAB_ORDER.length, delta)];
      setTab(next);
      if (!selected && next !== 'all') {
        setSelectedCatalogType(next);
      }
    },
    [tab, selected],
  );

  useHorizontalSwipe({
    targetRef: colRef,
    enabled: isMobile && !selected,
    blockSelector: COLLECTION_SWIPE_BLOCK_SELECTOR,
    onSwipeLeft: () => goToRelativeTab(1),
    onSwipeRight: () => goToRelativeTab(-1),
  });

  useEffect(() => {
    if (!isMobile) return;
    window.scrollTo({ top: 0 });
  }, [tab, isMobile]);

  useEffect(() => {
    if (!isMobile || !typeTabsRef.current) return;
    const activeTab = typeTabsRef.current.querySelector<HTMLElement>(`[data-col-tab="${tab}"]`);
    activeTab?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [tab, isMobile]);

  const maxPage = Math.max(1, Math.ceil(filtered.length / pageSize));
  const effectivePage = Math.min(page, maxPage);
  const pageStart = (effectivePage - 1) * pageSize;
  const pageGridCards = isAllTab ? [] : gridFiltered.slice(pageStart, pageStart + pageSize);
  const pageAllItems = isAllTab ? allTabFiltered.slice(pageStart, pageStart + pageSize) : [];

  const isLoading = isAllTab
    ? allCatalogQuery.isLoading || collection.isLoading
    : catalogQuery.isLoading || collection.isLoading;

  const selectCard = (card: CatalogCard, catalogType: CatalogType) => {
    setSelected(card);
    setSelectedCatalogType(catalogType);
  };

  const quantityForItem = (cardId: string, collectionType: CollectionCardType) =>
    collection.quantityFor(cardId, collectionType);

  return (
    <div className="col" ref={colRef}>
      <div className="col__inner">
        <header className="col__header">
          <div className="col__heading">
            <h1 className="col__title"><IconCollection /> My Collection</h1>
            <div className="col__stats">
              <span className="col__stat"><strong>{collection.totalOwned}</strong> cards owned</span>
              <span className="col__stat"><strong>{collection.uniqueCards}</strong> unique</span>
              {collection.isGuest ? <span className="col__guest-note">Stored on this device</span> : null}
            </div>
          </div>
          <div className="col__controls">
            <div className="col__search">
              <IconSearch className="col__search-icon" />
              <input
                type="search"
                placeholder="Search name, character, mission set, card text, or foil..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search collection"
              />
            </div>
            <div className="col__set">
              <label className="sr-only" htmlFor="col-set-filter">Set</label>
              <select
                id="col-set-filter"
                value={setFilter}
                onChange={(e) => setSetFilter(e.target.value)}
                aria-label="Filter by set"
              >
                <option value="">All sets</option>
                {(setsQuery.data ?? []).map((s) => (
                  <option key={s.code} value={s.code}>{s.name || s.code}</option>
                ))}
              </select>
            </div>
            <Checkbox
              className="col__owned-toggle"
              label="Owned only"
              checked={ownedOnly}
              onChange={setOwnedOnly}
            />
          </div>
        </header>

        <div className="col__types" role="tablist" aria-label="Card types" ref={typeTabsRef}>
          <button
            type="button"
            role="tab"
            aria-selected={isAllTab}
            data-col-tab="all"
            className={`col__type ${isAllTab ? 'is-active' : ''}`}
            onClick={() => setTab('all')}
          >
            All
          </button>
          {CATALOG_TYPES.map((meta) => (
            <button
              key={meta.type}
              type="button"
              role="tab"
              aria-selected={tab === meta.type}
              data-col-tab={meta.type}
              className={`col__type ${tab === meta.type ? 'is-active' : ''}`}
              onClick={() => {
                setTab(meta.type);
                setSelectedCatalogType(meta.type);
              }}
            >
              {isMobile ? meta.shortLabel : meta.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <LoadingState label="Loading collection..." />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={ownedOnly ? 'No cards owned here yet' : 'No cards found'}
            message={
              ownedOnly
                ? 'Add cards to your collection to see them here.'
                : 'Try adjusting your search or filters.'
            }
            icon={<IconCollection />}
          />
        ) : isAllTab ? (
          <>
            <CatalogAllList
              items={pageAllItems}
              selectedId={selected?.id}
              onSelect={(item) => selectCard(item.card, item.catalogType)}
              setNameLookup={setNameLookup}
              typeBetweenNumberAndName
              compactTypeLabels={isMobile}
              formatName={({ card, catalogType }) =>
                isMobile
                  ? cardDisplayName(card)
                  : cardLinkedDisplayName(card, catalogType)
              }
              dimmed={(item) =>
                quantityForItem(item.card.id, CATALOG_TYPE_BY_SLUG[item.catalogType].collectionType) <= 0
              }
              renderTrailing={(item) => {
                const ct = CATALOG_TYPE_BY_SLUG[item.catalogType].collectionType;
                const qty = quantityForItem(item.card.id, ct);
                return (
                  <QuantityStepper
                    value={qty}
                    size="sm"
                    onChange={(next) => void collection.setQuantity(item.card, ct, next)}
                  />
                );
              }}
            />
            <Pagination page={page} pageSize={pageSize} totalItems={filtered.length} onPageChange={setPage} />
          </>
        ) : (
          <>
            <div
              className={`col__grid ${isLandscapeCatalogType(tab) ? 'col__grid--landscape' : 'col__grid--portrait'}`}
            >
              {pageGridCards.map((card) => {
                const collectionType = CATALOG_TYPE_BY_SLUG[tab].collectionType;
                const qty = collection.quantityFor(card.id, collectionType);
                return (
                  <CardTile
                    key={card.id}
                    card={card}
                    catalogType={tab}
                    dimmed={qty <= 0}
                    onClick={() => selectCard(card, tab)}
                    footer={
                      <QuantityStepper
                        value={qty}
                        size="sm"
                        onChange={(next) => void collection.setQuantity(card, collectionType, next)}
                      />
                    }
                  />
                );
              })}
            </div>
            <Pagination page={page} pageSize={pageSize} totalItems={filtered.length} onPageChange={setPage} />
          </>
        )}
      </div>

      <CardDetailPanel
        card={selected}
        type={activeCatalogType}
        open={Boolean(selected)}
        onClose={closeCardDetail}
        isFoil={selected ? isFoilCard(selected) : undefined}
        actions={
          selected ? (
            <div className="col__detail-qty">
              <span>In your collection</span>
              <QuantityStepper
                value={collection.quantityFor(selected.id, activeCollectionType)}
                size="sm"
                onChange={(next) => void collection.setQuantity(selected, activeCollectionType, next)}
              />
            </div>
          ) : null
        }
      />
    </div>
  );
}
