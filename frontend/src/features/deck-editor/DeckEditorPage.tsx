import { Fragment, useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense } from 'react';
import { useNavigate, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../app/AuthProvider';
import {
  fetchDeckFull,
  replaceDeckCards,
  updateDeckMeta,
  validateDeck,
  type DeckCardInput,
  type UpdateDeckMetaInput,
} from '../../lib/api/decks';
import { fetchCatalog, fetchFoilCardMap, fetchSets } from '../../lib/api/catalog';
import { fetchFavoriteDecks } from '../../lib/api/favorites';
import { useFavoriteToggle } from '../../lib/decks/useFavoriteToggle';
import { favoritesQueryKey } from '../../lib/decks/favoritesQueryKey';
import { clonePreloadedGuestDeck, guestNeedsCloneOnOpen } from '../../lib/decks/guestCloneOnOpen';
import { calculateDeckTotalThreat, formatThreatTooltip } from '../../lib/decks/deckThreat';
import { calculateDeckIconTotals } from '../../lib/decks/iconTotals';
import {
  characterDeckEntries,
  computeReserveRowState,
  reserveSlotVisible,
} from '../../lib/decks/reserveCharacter';
import {
  aggregateInstancesForSave,
  expandDeckToInstances,
  removeInstance,
  createInstanceId,
} from '../../lib/decks/deckInstances';
import { collectPrintingsForCard } from '../../lib/catalog/cardPrintings';
import {
  CATALOG_TYPE_BY_SLUG,
  cardDisplayName,
  cardStats,
  isLandscapeCatalogType,
} from '../../lib/catalog/catalogTypeMap';
import { deckEditorCatalogTypes } from '../../lib/decks/deckEditorSectionOrder';
import {
  buildFoilCardMapLookup,
  cardHasFoilVersion,
  isFoilCard,
} from '../../lib/catalog/foilCatalog';
import { buildSetNameLookup, resolveSetDisplayName } from '../../lib/catalog/setNames';
import type { StatIconType } from '../../lib/icons/statIconTypes';
import { CardImage } from '../../components/CardImage';
import { buildFoilSeed } from '../../lib/visual/foilEffect';
import { CardDetailPanel } from '../../components/CardDetailPanel';
import { StatIconBadge } from '../../components/StatIconBadge';
import { deckLegalityBadgeFromValidity, legalityBadgeClass } from '../../components/DeckTile/deckTileLegality';
import { LegalityErrorsPopover } from '../../components/LegalityErrorsPopover';
import { normalizeValidationErrors } from '../../lib/decks/validationErrors';
import { MobileBottomNav } from '../../components/MobileBottomNav';
import { LoadingState } from '../../components/LoadingState';
import { EmptyState } from '../../components/EmptyState';
import { Logo } from '../../components/Logo';
import {
  IconChevronLeft,
  IconHome,
  IconDatabase,
  IconDecks,
  IconCollection,
  IconUsers,
  IconSave,
  IconPlus,
  IconTrash,
  IconCards,
  IconList,
  IconGrid,
  IconHeart,
  IconChevronUp,
  IconChevronDown,
  IconGripVertical,
} from '../../components/icons';
import {
  buildKoDimmingContext,
  calculateActiveTeamStats,
  shouldDimDeckCard,
  toggleKoCharacterId,
} from '../../lib/decks/simulateKo';
import { canDrawHand, countCardsInDeck, drawRandomHand, sortDrawnHandCards } from '../../lib/decks/drawHand';
import {
  computePrePlacedFlags,
  isPrePlaced,
  isPrePlacedEligible,
  reconcilePrePlaced,
} from '../../lib/decks/prePlaced';
import {
  buildDeckCardIndex,
  catalogSlugForDeckType,
  deckCardDisplayName,
  hasMixedSpecialCardCategories,
  isAnyCharacterSpecialEntry,
  normalizeDeckCardType,
  resolveDeckCatalogCard,
  sortDeckPowerEntries,
  sortDeckSpecialEntries,
} from '../../lib/decks/deckCardCatalog';
import { DeckListView, persistDeckViewMode, readDeckViewMode } from './DeckListView';
import { KoToggleButton } from './KoToggleButton';
import { ReserveCharacterButton } from './ReserveCharacterButton';
import type {
  CatalogCard,
  CatalogType,
  DeckCardEntry,
  DeckCardType,
  DeckDetail,
} from '../../lib/api/types';
import type { StackCardEntry } from '../../lib/catalog/characterStacks';
import { useLayoutMode } from '../../lib/layout/LayoutModeProvider';
import { useDeckCardDetailHistory } from '../../lib/layout/useDeckCardDetailHistory';
import { clearProgressiveImageSession } from '../../lib/images/progressiveImageLoad';
import { resolveMobileDeckTypeTab, stepCyclicalIndex } from '../../lib/layout/cyclicalIndex';
import { useHorizontalSwipe } from '../../lib/layout/useHorizontalSwipe';
import { getDeckEditorReturnTo, getDeckEditorBackAriaLabel } from '../../lib/navigation/deckEditorReturn';
import { effectiveTeamCharacterStats } from '../../lib/deck-usability';
import { deckEditorCardImageLoadingProps } from './deckEditorCardImage';
import {
  characterOrderPosition,
  moveCharacterBy,
  reorderCharacterTo,
} from '../../lib/decks/characterOrder';
import './DeckEditorPage.css';

const AddCardsPanel = lazy(() =>
  import('./AddCardsPanel').then((m) => ({ default: m.AddCardsPanel })),
);
const DrawHandPanel = lazy(() =>
  import('./DrawHandPanel').then((m) => ({ default: m.DrawHandPanel })),
);

const CHARACTER_REORDER_HOLD_MS = 500;
const CHARACTER_REORDER_MOVE_TOLERANCE_PX = 10;

function deckCardImgOrientationClass(catalogType?: CatalogType): string {
  if (!catalogType) return 'deck-editor__card-img--portrait';
  if (catalogType === 'characters') return 'deck-editor__card-img--characters';
  if (catalogType === 'locations' || catalogType === 'battlegrounds') return 'deck-editor__card-img--locations';
  if (catalogType === 'events') return 'deck-editor__card-img--events';
  return 'deck-editor__card-img--portrait';
}

const DECK_STAT_ROWS: Array<{
  key: 'energy' | 'combat' | 'bruteForce' | 'intelligence';
  label: string;
  iconKey: StatIconType;
}> = [
  { key: 'energy', label: 'Energy', iconKey: 'energy' },
  { key: 'combat', label: 'Combat', iconKey: 'combat' },
  { key: 'bruteForce', label: 'Brute Force', iconKey: 'brute_force' },
  { key: 'intelligence', label: 'Intelligence', iconKey: 'intelligence' },
];

function DeckStatRow({
  label,
  ariaLabel,
  sectionTooltip,
  iconTooltipPrefix,
  values,
}: {
  label: string;
  ariaLabel: string;
  sectionTooltip: string;
  iconTooltipPrefix: string;
  values: Record<(typeof DECK_STAT_ROWS)[number]['key'], number>;
}) {
  return (
    <section
      className="deck-editor__stats-block"
      aria-label={ariaLabel}
      title={sectionTooltip}
    >
      <span className="deck-editor__stats-block-label">{label}</span>
      <div className="deck-editor__stats-row">
        {DECK_STAT_ROWS.map(({ key, label: statLabel, iconKey }) => (
          <span
            className="deck-editor__stat-group"
            key={key}
            title={`${iconTooltipPrefix} — ${statLabel}: ${values[key]}`}
          >
            <StatIconBadge type={iconKey} value={values[key]} size="lg" />
          </span>
        ))}
      </div>
    </section>
  );
}

function DeckThreatStat({ totalThreat }: { totalThreat: number }) {
  return (
    <span className="deck-editor__threat-stat">
      <StatIconBadge
        type="threat_level"
        value={totalThreat}
        size="lg"
        title={formatThreatTooltip(totalThreat)}
      />
    </span>
  );
}

function DeckSaveButton({
  dirty,
  saving,
  onSave,
}: {
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
}) {
  const label = saving ? 'Saving...' : dirty ? 'Save' : 'Saved';
  return (
    <button
      type="button"
      className={[
        'btn btn-primary deck-editor__save-btn',
        !dirty && !saving ? 'deck-editor__save-btn--saved' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={onSave}
      disabled={saving || !dirty}
    >
      <IconSave /> {label}
    </button>
  );
}

function DeckStatsPanel({
  maxStats,
  iconTotals,
  totalThreat,
  showThreatInPanel = true,
}: {
  maxStats: Record<(typeof DECK_STAT_ROWS)[number]['key'], number>;
  iconTotals: Record<(typeof DECK_STAT_ROWS)[number]['key'], number>;
  totalThreat: number;
  showThreatInPanel?: boolean;
}) {
  return (
    <div className="deck-editor__stats-panel">
      {showThreatInPanel ? <DeckThreatStat totalThreat={totalThreat} /> : null}
      <DeckStatRow
        label="Max"
        ariaLabel="Character maximums"
        sectionTooltip="Character max stats"
        iconTooltipPrefix="Character max"
        values={maxStats}
      />
      <DeckStatRow
        label="Total"
        ariaLabel="Icon totals"
        sectionTooltip="Deck icon totals"
        iconTooltipPrefix="Icon total"
        values={iconTotals}
      />
    </div>
  );
}

export default function DeckEditorPage() {
  const { deckId = '', userId = '' } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isGuest } = useAuth();
  const { isMobile } = useLayoutMode();
  const returnTo = getDeckEditorReturnTo(location.state);
  const backAriaLabel = getDeckEditorBackAriaLabel(returnTo);

  const forceReadonly = searchParams.get('readonly') === 'true';
  const needsGuestClone = guestNeedsCloneOnOpen(deckId, isGuest, forceReadonly);
  const [guestCloning, setGuestCloning] = useState(needsGuestClone);

  const queryClient = useQueryClient();

  useEffect(() => {
    if (!needsGuestClone || !user) {
      setGuestCloning(false);
      return;
    }
    let cancelled = false;
    setGuestCloning(true);
    clonePreloadedGuestDeck(deckId)
      .then((guestDeckId) => {
        if (!cancelled) {
          navigate(`/users/${user.id}/decks/${guestDeckId}`, { replace: true });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setGuestCloning(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [needsGuestClone, deckId, user, navigate]);

  const deckQuery = useQuery({
    queryKey: ['deck', deckId],
    queryFn: () => fetchDeckFull(deckId, isGuest),
    enabled: Boolean(deckId) && !needsGuestClone && !guestCloning,
  });

  const deck = deckQuery.data;
  const isOwner = Boolean(deck?.metadata.isOwner) && !forceReadonly;
  // A real (non-guest) user can favorite any deck that isn't their own.
  const canFavorite =
    Boolean(user) && !isGuest && Boolean(deck) && deck?.metadata.userId !== user?.id;
  const favListKey = favoritesQueryKey(user?.id);
  const favoritesQuery = useQuery({
    queryKey: favListKey,
    queryFn: fetchFavoriteDecks,
    enabled: canFavorite,
  });
  const favoriteToggle = useFavoriteToggle();
  const isFavorited = Boolean(
    favoritesQuery.data?.some((d) => d.metadata.id === deckId),
  );

  const [cards, setCards] = useState<DeckCardEntry[]>([]);
  const [name, setName] = useState('');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [privacyBusy, setPrivacyBusy] = useState(false);
  const [limitedBusy, setLimitedBusy] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addCardsMounted, setAddCardsMounted] = useState(false);
  const [selected, setSelected] = useState<{
    card: CatalogCard;
    type: CatalogType;
    instanceId: string;
  } | null>(null);
  const [validity, setValidity] = useState<{
    valid: boolean;
    message?: string;
    validationErrors?: string[];
  } | null>(null);
  const [reserveCharacterId, setReserveCharacterId] = useState<string | null>(null);
  const [koCharacterIds, setKoCharacterIds] = useState<Set<string>>(() => new Set());
  const [drawHandOpen, setDrawHandOpen] = useState(false);
  const [drawnCards, setDrawnCards] = useState<DeckCardEntry[]>([]);
  const [mobileDeckTypeTab, setMobileDeckTypeTab] = useState<CatalogType | null>(null);
  const [deckViewMode, setDeckViewMode] = useState(readDeckViewMode);
  const [activeCharacterReorderId, setActiveCharacterReorderId] = useState<string | null>(null);
  const [draggedCharacterId, setDraggedCharacterId] = useState<string | null>(null);
  const [dragOverCharacterId, setDragOverCharacterId] = useState<string | null>(null);
  const loadedRef = useRef(false);
  const savedReserveRef = useRef<string | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const typeTabsRef = useRef<HTMLDivElement>(null);
  const characterHoldRef = useRef<{
    timer: ReturnType<typeof setTimeout>;
    x: number;
    y: number;
  } | null>(null);
  const suppressCharacterOpenRef = useRef(false);
  const canSimulateKo = Boolean(user);

  const { close: closeCardDetail } = useDeckCardDetailHistory(Boolean(selected), () => setSelected(null));

  useEffect(() => {
    loadedRef.current = false;
    setKoCharacterIds(new Set());
    setDrawHandOpen(false);
    setDrawnCards([]);
    setAddOpen(false);
    setAddCardsMounted(false);
    setActiveCharacterReorderId(null);
  }, [deckId]);

  useEffect(() => () => {
    if (characterHoldRef.current) clearTimeout(characterHoldRef.current.timer);
  }, []);

  useEffect(() => {
    if (addOpen) setAddCardsMounted(true);
  }, [addOpen]);

  useEffect(() => () => clearProgressiveImageSession('deck-editor'), []);

  useEffect(() => {
    if (deck && !loadedRef.current) {
      setCards(expandDeckToInstances(deck.cards ?? []));
      setName(deck.metadata.name);
      const loadedReserve = deck.metadata.reserve_character ?? null;
      setReserveCharacterId(loadedReserve);
      savedReserveRef.current = loadedReserve;
      loadedRef.current = true;
    }
  }, [deck]);

  // Live validation (debounced) so legality reflects edits.
  useEffect(() => {
    if (cards.length === 0) {
      setValidity(null);
      return;
    }
    const t = setTimeout(() => {
      validateDeck(cards)
        .then((r) =>
          setValidity({
            valid: r.valid,
            message: r.message,
            validationErrors: r.validationErrors,
          }),
        )
        .catch(() => setValidity(null));
    }, 1000);
    return () => clearTimeout(t);
  }, [cards]);

  // Cards loaded from /full carry only { type, cardId, quantity } — no name or
  // image. Resolve those from the catalog (by deck card type → catalog slug) so
  // the editor shows real card art rather than "No image" placeholders.
  const deckCatalogTypes = useMemo(
    () => Array.from(new Set(cards.map((c) => normalizeDeckCardType(c.type)))),
    [cards],
  );
  const catalogQueries = useQueries({
    queries: deckCatalogTypes.map((deckType) => {
      const slug = catalogSlugForDeckType(deckType);
      return {
        queryKey: ['catalog', slug ?? deckType],
        queryFn: () => fetchCatalog(slug as CatalogType),
        enabled: Boolean(slug),
        staleTime: 30 * 60 * 1000,
      };
    }),
  });
  const cardIndex = useMemo(
    () => buildDeckCardIndex(deckCatalogTypes, catalogQueries.map((q) => q.data)),
    [catalogQueries, deckCatalogTypes],
  );

  const foilMapQuery = useQuery({
    queryKey: ['foil-card-map'],
    queryFn: () => fetchFoilCardMap(),
    staleTime: 60 * 60 * 1000,
  });
  const setsQuery = useQuery({
    queryKey: ['sets'],
    queryFn: () => fetchSets(),
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

  const hasCharactersInDeckCatalog = deckCatalogTypes.some(
    (t) => catalogSlugForDeckType(t) === 'characters',
  );
  const charactersQuery = useQuery({
    queryKey: ['catalog', 'characters'],
    queryFn: () => fetchCatalog('characters'),
    enabled: !hasCharactersInDeckCatalog,
    staleTime: 30 * 60 * 1000,
  });

  const catalogBySlug = useMemo(() => {
    const map = new Map<CatalogType, CatalogCard[]>();
    catalogQueries.forEach((q, i) => {
      const deckType = deckCatalogTypes[i];
      const slug = catalogSlugForDeckType(deckType);
      if (slug) map.set(slug, q.data ?? []);
    });
    return map;
  }, [catalogQueries, deckCatalogTypes]);

  const totalCards = countCardsInDeck(cards);

  const koCtx = useMemo(
    () =>
      koCharacterIds.size > 0
        ? buildKoDimmingContext(cards, cardIndex, koCharacterIds)
        : null,
    [cards, cardIndex, koCharacterIds],
  );

  const drawHandKoCtx = useMemo(
    () => buildKoDimmingContext(cards, cardIndex, koCharacterIds),
    [cards, cardIndex, koCharacterIds],
  );

  const canDraw = useMemo(() => canDrawHand(cards), [cards]);

  useEffect(() => {
    if (!canDraw && drawHandOpen) {
      setDrawHandOpen(false);
      setDrawnCards([]);
    }
  }, [canDraw, drawHandOpen]);

  const allCharactersCatalog = catalogBySlug.get('characters') ?? charactersQuery.data ?? [];

  const maxStats = useMemo(() => {
    if (koCtx) {
      return calculateActiveTeamStats(koCtx);
    }
    const statById = new Map<string, { name: string; stats: NonNullable<ReturnType<typeof cardStats>> }>();
    allCharactersCatalog.forEach((c) => {
      const s = cardStats(c);
      if (s) statById.set(c.id, { name: String(c.name ?? 'Unknown'), stats: s });
    });
    const chars = cards.filter((c) => c.type === 'character');
    const effectiveCharacterStats = effectiveTeamCharacterStats(
      chars.flatMap((c) => {
        const resolved = statById.get(c.cardId);
        if (!resolved) return [];
        return [{
          name: resolved.name,
          energy: resolved.stats.energy,
          combat: resolved.stats.combat,
          brute_force: resolved.stats.bruteForce,
          intelligence: resolved.stats.intelligence,
        }];
      }),
    );
    const acc = { energy: 0, combat: 0, bruteForce: 0, intelligence: 0 };
    effectiveCharacterStats.forEach((stats) => {
      acc.energy = Math.max(acc.energy, stats.energy);
      acc.combat = Math.max(acc.combat, stats.combat);
      acc.bruteForce = Math.max(acc.bruteForce, stats.brute_force);
      acc.intelligence = Math.max(acc.intelligence, stats.intelligence);
    });
    return acc;
  }, [cards, allCharactersCatalog, koCtx]);

  const iconTotals = useMemo(
    () =>
      calculateDeckIconTotals(cards, (type, cardId) =>
        cardIndex.get(`${type}:${cardId}`),
      ),
    [cards, cardIndex],
  );

  const characterEntries = useMemo(() => characterDeckEntries(cards), [cards]);

  const totalThreat = useMemo(
    () =>
      calculateDeckTotalThreat(cards, reserveCharacterId, (type, cardId) =>
        cardIndex.get(`${type}:${cardId}`),
      ),
    [cards, reserveCharacterId, cardIndex],
  );

  const grouped = useMemo(() => {
    const map = new Map<DeckCardType, DeckCardEntry[]>();
    cards.forEach((c) => {
      const arr = map.get(c.type) ?? [];
      arr.push(c);
      map.set(c.type, arr);
    });
    return deckEditorCatalogTypes().map((meta) => {
      const raw = meta.deckType === 'location'
        ? [...(map.get('location') ?? []), ...(map.get('battleground') ?? [])]
        : meta.deckType === 'battleground'
          ? []
          : map.get(meta.deckType) ?? [];
      const entries =
        meta.deckType === 'power'
          ? sortDeckPowerEntries(raw, cardIndex)
          : meta.deckType === 'special'
            ? sortDeckSpecialEntries(raw, cardIndex)
            : raw;
      const sectionMeta = meta.deckType === 'location'
        ? { ...meta, label: 'Location and Battleground', shortLabel: 'Location and Battleground' }
        : meta;
      return {
        meta: sectionMeta,
        entries,
        hasSpecialCategoryDivider:
          meta.deckType === 'special' && hasMixedSpecialCardCategories(entries, cardIndex),
      };
    }).filter((g) => g.entries.length > 0);
  }, [cards, cardIndex]);

  const immersiveOpen = addOpen || drawHandOpen || Boolean(selected);
  const deckTypeTabs = grouped;

  useEffect(() => {
    if (!isMobile || deckTypeTabs.length === 0) {
      setMobileDeckTypeTab(null);
      return;
    }
    setMobileDeckTypeTab((prev) =>
      resolveMobileDeckTypeTab(
        prev,
        deckTypeTabs.map((g) => g.meta.type),
      ),
    );
  }, [isMobile, deckTypeTabs]);

  const visibleGroups = useMemo(() => {
    if (!isMobile || deckViewMode === 'list') return grouped;
    if (deckTypeTabs.length === 0) return [];
    const type = mobileDeckTypeTab ?? deckTypeTabs[0].meta.type;
    const active = grouped.find((g) => g.meta.type === type);
    return active ? [active] : [deckTypeTabs[0]];
  }, [isMobile, deckViewMode, grouped, deckTypeTabs, mobileDeckTypeTab]);

  const scrollContainerRef = isMobile ? mainRef : contentRef;

  useEffect(() => {
    if (!isMobile) return;
    mainRef.current?.scrollTo({ top: 0 });
  }, [mobileDeckTypeTab, isMobile]);

  useEffect(() => {
    if (!isMobile || !mobileDeckTypeTab || !typeTabsRef.current) return;
    const activeTab = typeTabsRef.current.querySelector<HTMLElement>(
      `[data-deck-type="${mobileDeckTypeTab}"]`,
    );
    activeTab?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [mobileDeckTypeTab, isMobile]);

  const goToRelativeDeckType = useCallback(
    (delta: 1 | -1) => {
      if (deckTypeTabs.length <= 1) return;
      const activeIndex = deckTypeTabs.findIndex((g) => g.meta.type === mobileDeckTypeTab);
      const idx = activeIndex >= 0 ? activeIndex : 0;
      const next = stepCyclicalIndex(idx, deckTypeTabs.length, delta);
      setMobileDeckTypeTab(deckTypeTabs[next].meta.type);
    },
    [deckTypeTabs, mobileDeckTypeTab],
  );

  useHorizontalSwipe({
    targetRef: scrollContainerRef,
    enabled:
      isMobile && deckViewMode === 'card' && !immersiveOpen && deckTypeTabs.length > 1,
    onSwipeLeft: () => goToRelativeDeckType(1),
    onSwipeRight: () => goToRelativeDeckType(-1),
  });

  const removeDeckInstance = (instanceId: string) => {
    const entry = cards.find((c) => c.instanceId === instanceId);
    if (!entry) return;
    if (entry.type === 'character' && reserveCharacterId === entry.cardId) {
      setReserveCharacterId(null);
    }
    if (entry.type === 'character') {
      setKoCharacterIds((prev) => {
        if (!prev.has(entry.cardId)) return prev;
        const next = new Set(prev);
        next.delete(entry.cardId);
        return next;
      });
    }
    setCards((prev) => reconcilePrePlaced(removeInstance(prev, instanceId), cardIndex));
    if (selected?.instanceId === instanceId) {
      setSelected(null);
    }
    setDirty(true);
  };

  const reorderCharacter = (instanceId: string, delta: -1 | 1) => {
    setCards((prev) => moveCharacterBy(prev, instanceId, delta));
    setDirty(true);
  };

  const clearCharacterHold = () => {
    if (!characterHoldRef.current) return;
    clearTimeout(characterHoldRef.current.timer);
    characterHoldRef.current = null;
  };

  const startCharacterHold = (
    entry: DeckCardEntry,
    event: React.PointerEvent<HTMLButtonElement>,
  ) => {
    if (!isMobile || !isOwner || entry.type !== 'character' || !entry.instanceId) return;
    clearCharacterHold();
    characterHoldRef.current = {
      x: event.clientX,
      y: event.clientY,
      timer: setTimeout(() => {
        suppressCharacterOpenRef.current = true;
        setActiveCharacterReorderId(entry.instanceId ?? null);
        characterHoldRef.current = null;
      }, CHARACTER_REORDER_HOLD_MS),
    };
  };

  const moveCharacterHold = (event: React.PointerEvent<HTMLButtonElement>) => {
    const hold = characterHoldRef.current;
    if (!hold) return;
    if (
      Math.abs(event.clientX - hold.x) > CHARACTER_REORDER_MOVE_TOLERANCE_PX ||
      Math.abs(event.clientY - hold.y) > CHARACTER_REORDER_MOVE_TOLERANCE_PX
    ) {
      clearCharacterHold();
    }
  };

  const finishCharacterHold = () => clearCharacterHold();

  const dropCharacterOn = (targetInstanceId: string) => {
    if (!draggedCharacterId || draggedCharacterId === targetInstanceId) return;
    setCards((prev) => reorderCharacterTo(prev, draggedCharacterId, targetInstanceId));
    setDirty(true);
  };

  const selectReserveCharacter = (cardId: string) => {
    setReserveCharacterId(cardId);
    setDirty(true);
  };

  const deselectReserveCharacter = () => {
    setReserveCharacterId(null);
    setDirty(true);
  };

  const selectDeckCard = (
    catalogCard: CatalogCard,
    catalogType: CatalogType,
    instanceId: string,
  ) => {
    setSelected({ card: catalogCard, type: catalogType, instanceId });
  };

  const closeDrawHand = () => {
    setDrawHandOpen(false);
    setDrawnCards([]);
  };

  const handleBackToDecks = () => {
    if (selected) {
      closeCardDetail();
      return;
    }
    if (drawHandOpen) {
      closeDrawHand();
      return;
    }
    if (addOpen) {
      setAddOpen(false);
      return;
    }
    if (returnTo) {
      navigate(returnTo);
      return;
    }
    navigate(`/users/${user?.id ?? userId}/decks`);
  };

  const handleDrawHandToggle = () => {
    if (drawHandOpen) {
      closeDrawHand();
      return;
    }
    setDrawnCards(sortDrawnHandCards(drawRandomHand(cards), cardIndex));
    setDrawHandOpen(true);
  };

  const handleViewModeToggle = () => {
    setDeckViewMode((prev) => {
      const next = prev === 'card' ? 'list' : 'card';
      persistDeckViewMode(next);
      return next;
    });
  };

  const handleDrawHandRedraw = () => {
    setDrawnCards(sortDrawnHandCards(drawRandomHand(cards), cardIndex));
  };

  const handleDrawHandReorder = (fromIndex: number, toIndex: number) => {
    setDrawnCards((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const selectedDeckEntry = useMemo(() => {
    if (!selected) return null;
    return cards.find((c) => c.instanceId === selected.instanceId) ?? null;
  }, [selected, cards]);

  const printingRows = useMemo(() => {
    if (!selected || !isOwner) return undefined;
    const allCards = catalogBySlug.get(selected.type) ?? [];
    const printings = collectPrintingsForCard(
      selected.card,
      selected.type,
      allCards,
      foilLookup,
      (set) => resolveSetDisplayName(set, setNameLookup) ?? String(set ?? ''),
    );
    if (printings.length <= 1) return undefined;
    const currentId = selectedDeckEntry?.cardId ?? selected.card.id;
    return printings.map((printing) => ({
      card: printing,
      setDisplayName: resolveSetDisplayName(printing.set, setNameLookup) ?? String(printing.set ?? ''),
      setNumber: printing.set_number ? String(printing.set_number) : null,
      isCurrent: printing.id === currentId,
    }));
  }, [selected, isOwner, catalogBySlug, foilLookup, setNameLookup, selectedDeckEntry]);

  const applyPrinting = (printingId: string) => {
    if (!selected?.instanceId || !isOwner) return;
    const entry = cards.find((c) => c.instanceId === selected.instanceId);
    if (!entry) return;

    const deckType = CATALOG_TYPE_BY_SLUG[selected.type].deckType;
    const targetCard =
      cardIndex.get(`${deckType}:${printingId}`) ??
      cardIndex.get(`${normalizeDeckCardType(deckType)}:${printingId}`) ??
      cardIndex.get(printingId) ??
      (catalogBySlug.get(selected.type) ?? []).find((c) => c.id === printingId);
    if (!targetCard) return;

    const previousCardId = entry.cardId;
    const imagePath =
      (targetCard.image_path as string) || (targetCard.image as string) || undefined;

    setCards((prev) =>
      prev.map((c) =>
        c.instanceId === selected.instanceId
          ? {
              ...c,
              cardId: printingId,
              defaultImage: imagePath,
              is_foil: isFoilCard(targetCard),
              name: cardDisplayName(targetCard),
            }
          : c,
      ),
    );

    if (entry.type === 'character' && previousCardId !== printingId) {
      if (reserveCharacterId === previousCardId) {
        setReserveCharacterId(printingId);
      }
      setKoCharacterIds((prev) => {
        if (!prev.has(previousCardId)) return prev;
        const next = new Set(prev);
        next.delete(previousCardId);
        next.add(printingId);
        return next;
      });
    }

    setSelected((prev) => (prev ? { ...prev, card: targetCard } : null));
    setDirty(true);
  };

  // Deck-level location and character enablers for Pre-Placed eligibility.
  // Computed once so per-card eligibility is O(1).
  const prePlacedFlags = useMemo(
    () => computePrePlacedFlags(cards, cardIndex),
    [cards, cardIndex],
  );

  const togglePrePlaced = useCallback((instanceId: string) => {
    setCards((prev) =>
      prev.map((c) =>
        c.instanceId === instanceId
          ? { ...c, exclude_from_draw: !(c.exclude_from_draw === true) }
          : c,
      ),
    );
    setDirty(true);
  }, []);

  const selectedPrePlacedEligible =
    isOwner && selectedDeckEntry
      ? isPrePlacedEligible(selectedDeckEntry, prePlacedFlags, cardIndex)
      : false;

  const addCard = (card: CatalogCard, type: CatalogType) => {
    const deckType = CATALOG_TYPE_BY_SLUG[type].deckType;
    setCards((prev) => [
      ...prev,
      {
        type: deckType,
        cardId: card.id,
        quantity: 1,
        instanceId: createInstanceId(),
        name: cardDisplayName(card),
        defaultImage: (card.image_path as string) || (card.image as string),
        is_foil: isFoilCard(card),
      },
    ]);
    setDirty(true);
  };

  const addStack = (entries: StackCardEntry[]) => {
    if (entries.length === 0) return;
    setCards((prev) => {
      let next = [...prev];
      for (const { card, catalogType } of entries) {
        const deckType = CATALOG_TYPE_BY_SLUG[catalogType].deckType;
        next = [
          ...next,
          {
            type: deckType,
            cardId: card.id,
            quantity: 1,
            instanceId: createInstanceId(),
            name: cardDisplayName(card),
            defaultImage: (card.image_path as string) || (card.image as string),
            is_foil: isFoilCard(card),
          },
        ];
      }
      return next;
    });
    setDirty(true);
  };

  const handleSave = async () => {
    if (!isOwner || saving) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const metaPatch: UpdateDeckMetaInput = {};
      if (name.trim() && name.trim() !== deck?.metadata.name) {
        metaPatch.name = name.trim();
      }
      if (reserveCharacterId !== savedReserveRef.current) {
        metaPatch.reserve_character = reserveCharacterId;
      }
      if (Object.keys(metaPatch).length > 0) {
        const updated = await updateDeckMeta(deckId, metaPatch, isGuest);
        savedReserveRef.current = reserveCharacterId;
        queryClient.setQueryData(['deck', deckId], updated);
      }
      const payload: DeckCardInput[] = aggregateInstancesForSave(cards).map((c, displayOrder) => ({
        cardType: c.type,
        cardId: c.cardId,
        quantity: c.quantity,
        displayOrder,
        exclude_from_draw: c.exclude_from_draw,
      }));
      const updatedCards = await replaceDeckCards(deckId, payload, isGuest);
      queryClient.setQueryData<DeckDetail>(['deck', deckId], (prev) => {
        const base = prev ?? updatedCards;
        return {
          ...base,
          cards: updatedCards.cards ?? cards,
          metadata: {
            ...base.metadata,
            ...updatedCards.metadata,
            reserve_character: reserveCharacterId,
          },
        };
      });
      setDirty(false);
      setSaveMsg('Saved');
      setTimeout(() => setSaveMsg(null), 2500);
      // Card changes recompute decks.is_valid server-side; refresh the deck lists
      // (My Decks, community feed, favorites, tournament) so tile legality matches.
      void queryClient.invalidateQueries({ queryKey: ['decks', 'mine', user?.id] });
      void queryClient.invalidateQueries({ queryKey: ['deck', deckId] });
    } catch (err) {
      setSaveMsg((err as Error)?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePrivacy = async () => {
    if (!isOwner || privacyBusy || !deck) return;
    const nextPrivate = !(deck.metadata.is_private ?? true);
    setPrivacyBusy(true);
    try {
      const updated = await updateDeckMeta(deckId, { is_private: nextPrivate }, isGuest);
      queryClient.setQueryData(['deck', deckId], (prev: typeof deck | undefined) => {
        const base = prev ?? updated;
        return {
          ...base,
          metadata: { ...base.metadata, is_private: updated.metadata.is_private ?? nextPrivate },
        };
      });
    } catch {
      /* leave state unchanged on failure */
    } finally {
      setPrivacyBusy(false);
    }
  };

  const handleToggleLimited = async () => {
    if (!isOwner || limitedBusy || !deck) return;
    const nextLimited = !(deck.metadata.is_limited ?? false);
    setLimitedBusy(true);
    try {
      const updated = await updateDeckMeta(deckId, { is_limited: nextLimited }, isGuest);
      queryClient.setQueryData(['deck', deckId], (prev: typeof deck | undefined) => {
        const base = prev ?? updated;
        return {
          ...base,
          metadata: { ...base.metadata, is_limited: updated.metadata.is_limited ?? nextLimited },
        };
      });
      // Refresh deck lists so tile chips reflect Limited everywhere.
      void queryClient.invalidateQueries({ queryKey: ['decks', 'mine', user?.id] });
      void queryClient.invalidateQueries({ queryKey: ['deck', deckId] });
    } catch {
      /* leave state unchanged on failure */
    } finally {
      setLimitedBusy(false);
    }
  };

  const handleToggleFavorite = () => {
    if (!canFavorite || favoriteToggle.isPending || !deck) return;
    const next = !isFavorited;
    queryClient.setQueryData<DeckDetail[]>(favListKey, (prev) => {
      const list = prev ?? [];
      if (next) {
        if (list.some((d) => d.metadata.id === deckId)) return list;
        return [...list, deck];
      }
      return list.filter((d) => d.metadata.id !== deckId);
    });
    favoriteToggle.mutate(
      { deckId, next },
      {
        onError: () => {
          void queryClient.invalidateQueries({ queryKey: favListKey });
        },
      },
    );
  };

  if (guestCloning) {
    return <LoadingState fullscreen label="Preparing deck..." />;
  }
  if (deckQuery.isLoading) {
    return <LoadingState fullscreen label="Loading deck..." />;
  }
  if (deckQuery.isError || !deck) {
    return (
      <div className="deck-editor deck-editor--error">
        <EmptyState
          variant="error"
          title="Deck not found"
          message="This deck may have been removed or you don't have access."
          icon={<IconDecks />}
          action={
            <button type="button" className="btn btn-primary" onClick={() => navigate('/home')}>
              Back to Home
            </button>
          }
        />
      </div>
    );
  }

  // Single source of truth for the badge: live validate result when available
  // (now correct for invalid decks), else the persisted server-owned is_valid.
  // The Limited toggle wins via the shared helper so the editor matches tiles.
  const liveValid = validity?.valid ?? (deck.metadata.is_valid ?? false);
  const legalityBadgeInfo = deckLegalityBadgeFromValidity(deck.metadata.is_limited, liveValid);
  const legalityErrors =
    legalityBadgeInfo.variant === 'not-legal'
      ? normalizeValidationErrors(validity?.validationErrors, validity?.message)
      : [];
  const showMobileNav = isMobile && !immersiveOpen;
  const showMobileTypeTabs =
    isMobile && deckViewMode === 'card' && cards.length > 0 && deckTypeTabs.length > 1;

  return (
    <>
    <div className="deck-editor">
      {/* Left rail (desktop) */}
      <aside className="deck-editor__rail">
        <button type="button" className="deck-editor__rail-logo" onClick={() => navigate('/home')} aria-label="Home">
          <Logo variant="emblem" height={26} />
        </button>
        <nav className="deck-editor__rail-nav">
          <button type="button" onClick={() => navigate('/home')} title="Home"><IconHome /></button>
          <button type="button" onClick={() => navigate('/data')} title="Card Database"><IconDatabase /></button>
          <button type="button" onClick={() => navigate(`/users/${user?.id ?? userId}/decks`)} title="Decks"><IconDecks /></button>
          <button type="button" onClick={() => navigate(`/users/${user?.id ?? userId}/collection`)} title="Collection"><IconCollection /></button>
          <button type="button" onClick={() => navigate('/community')} title="Community"><IconUsers /></button>
        </nav>
      </aside>

      <div className="deck-editor__main" ref={mainRef}>
        <header className="deck-editor__header">
          <div className="deck-editor__topbar">
            <div className="deck-editor__topbar-leading">
              <div className="deck-editor__topbar-name-row">
                <button
                  type="button"
                  className="deck-editor__back"
                  onClick={handleBackToDecks}
                  aria-label={backAriaLabel}
                >
                  <IconChevronLeft />
                </button>

                {isOwner ? (
                  <input
                    className="deck-editor__name-input"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setDirty(true);
                    }}
                    aria-label="Deck name"
                    maxLength={100}
                  />
                ) : (
                  <h1 className="deck-editor__name">{deck.metadata.name}</h1>
                )}

                {isMobile && isOwner ? (
                  <div className="deck-editor__save-group">
                    {saveMsg ? <span className="deck-editor__save-msg">{saveMsg}</span> : null}
                    <DeckSaveButton dirty={dirty} saving={saving} onSave={handleSave} />
                  </div>
                ) : null}
              </div>

              <div className="deck-editor__meta">
                <span className="deck-editor__chip">{totalCards} cards</span>
                <LegalityErrorsPopover errors={legalityErrors} pressAndHold={isMobile}>
                  {isOwner ? (
                    <button
                      type="button"
                      className={`badge ${legalityBadgeClass(legalityBadgeInfo.variant)} deck-editor__legality-toggle`}
                      onClick={handleToggleLimited}
                      disabled={limitedBusy}
                      aria-pressed={legalityBadgeInfo.variant === 'limited'}
                      title={
                        legalityBadgeInfo.variant === 'limited'
                          ? 'Limited - legality checks are skipped. Click to re-enable legality.'
                          : 'Click to mark this deck Limited (skips legality validation).'
                      }
                    >
                      {legalityBadgeInfo.label}
                    </button>
                  ) : (
                    <span className={`badge ${legalityBadgeClass(legalityBadgeInfo.variant)}`}>
                      {legalityBadgeInfo.label}
                    </span>
                  )}
                </LegalityErrorsPopover>
                {isOwner ? (
                  <button
                    type="button"
                    className={`badge badge-visibility--${(deck.metadata.is_private ?? true) ? 'private' : 'public'} deck-editor__visibility-toggle`}
                    onClick={handleTogglePrivacy}
                    disabled={privacyBusy}
                    title={
                      (deck.metadata.is_private ?? true)
                        ? 'Unlisted — hidden from Community, but anyone with this link can view it. Click to make it public.'
                        : 'Public — eligible for Community when legal. Click to make it unlisted.'
                    }
                    aria-pressed={!(deck.metadata.is_private ?? true)}
                  >
                    {(deck.metadata.is_private ?? true) ? 'Unlisted' : 'Public'}
                  </button>
                ) : (
                  <span
                    className={`badge badge-visibility--${(deck.metadata.is_private ?? true) ? 'private' : 'public'}`}
                  >
                    {(deck.metadata.is_private ?? true) ? 'Unlisted' : 'Public'}
                  </span>
                )}
                {isMobile ? <DeckThreatStat totalThreat={totalThreat} /> : null}
              </div>
            </div>

            <DeckStatsPanel
              maxStats={maxStats}
              iconTotals={iconTotals}
              totalThreat={totalThreat}
              showThreatInPanel={!isMobile}
            />

            <div className="deck-editor__actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleViewModeToggle}
                title={deckViewMode === 'card' ? 'Switch to list view' : 'Switch to card view'}
              >
                {deckViewMode === 'card' ? (
                  <>
                    <IconList /> List View
                  </>
                ) : (
                  <>
                    <IconGrid /> Card View
                  </>
                )}
              </button>
              <button
                type="button"
                className={`btn btn-ghost${drawHandOpen ? ' is-active' : ''}`}
                disabled={!canDraw}
                title={
                  canDraw
                    ? 'Draw a random 8-card hand'
                    : 'Deck must contain at least 8 playable cards.'
                }
                onClick={handleDrawHandToggle}
              >
                <IconCards /> Draw Hand
              </button>
              {isOwner ? (
                <>
                  <button type="button" className="btn btn-secondary" onClick={() => setAddOpen(true)}>
                    <IconPlus /> Add Cards
                  </button>
                  {!isMobile ? (
                    <DeckSaveButton dirty={dirty} saving={saving} onSave={handleSave} />
                  ) : null}
                </>
              ) : (
                <>
                  {canFavorite ? (
                    <button
                      type="button"
                      className={`btn btn-ghost deck-editor__favorite${isFavorited ? ' is-active' : ''}`}
                      onClick={handleToggleFavorite}
                      disabled={favoriteToggle.isPending}
                      aria-pressed={isFavorited}
                      title={isFavorited ? 'Remove from your favorites' : 'Add to your favorites'}
                    >
                      <IconHeart filled={isFavorited} /> {isFavorited ? 'Favorited' : 'Favorite'}
                    </button>
                  ) : null}
                  <span className="deck-editor__readonly-tag">Read-only</span>
                </>
              )}
              {saveMsg && !isMobile ? <span className="deck-editor__save-msg">{saveMsg}</span> : null}
            </div>
          </div>
        </header>

        {showMobileTypeTabs ? (
          <div
            className="deck-editor__type-tabs"
            ref={typeTabsRef}
            role="tablist"
            aria-label="Deck card types"
          >
            {deckTypeTabs.map(({ meta, entries }) => (
              <button
                key={meta.type}
                type="button"
                role="tab"
                data-deck-type={meta.type}
                aria-selected={mobileDeckTypeTab === meta.type}
                className={`deck-editor__type ${mobileDeckTypeTab === meta.type ? 'is-active' : ''}`}
                onClick={() => setMobileDeckTypeTab(meta.type)}
              >
                {meta.shortLabel}
                <span className="deck-editor__type-count">{entries.length}</span>
              </button>
            ))}
          </div>
        ) : null}

        {/* Card list + draw hand overlay */}
        <div className="deck-editor__content" ref={contentRef}>
          {cards.length === 0 ? (
            <EmptyState
              title="This deck is empty"
              message={isOwner ? 'Add cards to start building.' : 'No cards in this deck yet.'}
              icon={<IconDecks />}
              action={
                isOwner ? (
                  <button
                    type="button"
                    className="btn btn-primary deck-editor__empty-add"
                    onClick={() => setAddOpen(true)}
                  >
                    <IconPlus /> Add Cards
                  </button>
                ) : null
              }
            />
          ) : deckViewMode === 'list' ? (
            <DeckListView
              groups={visibleGroups}
              cardIndex={cardIndex}
              isMobile={isMobile}
              isOwner={isOwner}
              koCtx={koCtx}
              koCharacterIds={koCharacterIds}
              reserveCharacterId={reserveCharacterId}
              characterEntries={characterEntries}
              canSimulateKo={canSimulateKo}
              selectedInstanceId={selected?.instanceId ?? null}
              onSelectCard={selectDeckCard}
              onToggleKo={(cardId) =>
                setKoCharacterIds((prev) => toggleKoCharacterId(prev, cardId))
              }
              onSelectReserve={selectReserveCharacter}
              onDeselectReserve={deselectReserveCharacter}
              onRemoveInstance={removeDeckInstance}
            />
          ) : (
            visibleGroups.map(({ meta, entries, hasSpecialCategoryDivider }) => (
              <section className="deck-editor__group" key={meta.type}>
                {!showMobileTypeTabs ? (
                  <h2 className="deck-editor__group-title">
                    {meta.label}
                    <span className="deck-editor__group-count">{entries.length}</span>
                    {isOwner && meta.deckType === 'character' && entries.length > 1 ? (
                      <span className="deck-editor__group-order-hint">
                        <IconGripVertical />
                        <span className="deck-editor__group-order-hint--desktop">Drag to set preview order</span>
                        <span className="deck-editor__group-order-hint--mobile">Press and hold to reorder</span>
                      </span>
                    ) : null}
                  </h2>
                ) : null}
                {showMobileTypeTabs &&
                isOwner &&
                meta.deckType === 'character' &&
                entries.length > 1 ? (
                  <p className="deck-editor__mobile-order-hint">
                    <IconGripVertical /> Press and hold a character to set preview order
                  </p>
                ) : null}
                <div
                  className={`deck-editor__cards${
                    isLandscapeCatalogType(meta.type) ? ' deck-editor__cards--landscape' : ''
                  }`}
                >
                  {entries.map((entry, index) => {
                    const showAnyCharacterDivider =
                      hasSpecialCategoryDivider &&
                      isAnyCharacterSpecialEntry(entry, cardIndex) &&
                      !isAnyCharacterSpecialEntry(entries[index - 1] ?? entry, cardIndex);
                    const catalogCard = resolveDeckCatalogCard(entry, cardIndex);
                    const imagePath =
                      entry.defaultImage ||
                      (catalogCard?.image_path as string | undefined) ||
                      (catalogCard?.image as string | undefined);
                    const cardName = deckCardDisplayName(entry, cardIndex);
                    const catalogType = catalogSlugForDeckType(entry.type);
                    const canOpenDetail = Boolean(catalogCard && catalogType);
                    const isCardSelected =
                      canOpenDetail &&
                      selected?.instanceId === entry.instanceId &&
                      selected?.type === catalogType;
                    const reserveRowState =
                      entry.type === 'character'
                        ? computeReserveRowState(
                            entry.cardId,
                            reserveCharacterId,
                            characterEntries,
                            !isOwner,
                          )
                        : null;
                    const showKoOnCharacter = entry.type === 'character' && canSimulateKo;
                    const entryPrePlaced = isPrePlaced(entry);
                    const showCardFooter =
                      isOwner ||
                      entryPrePlaced ||
                      (entry.type === 'character' &&
                        reserveRowState !== null &&
                        reserveSlotVisible(reserveRowState)) ||
                      showKoOnCharacter;
                    const koDimmed =
                      koCtx !== null && shouldDimDeckCard(entry, catalogCard, koCtx);
                    const entryIsFoil = Boolean(entry.is_foil || (catalogCard && isFoilCard(catalogCard)));
                    const foilSeed = buildFoilSeed(entry.cardId, entry.instanceId);
                    const canReorderCharacter =
                      isOwner && entry.type === 'character' && entries.length > 1 && Boolean(entry.instanceId);
                    const orderState = entry.instanceId
                      ? characterOrderPosition(cards, entry.instanceId)
                      : { position: -1, total: 0 };
                    const reorderActive =
                      canReorderCharacter && activeCharacterReorderId === entry.instanceId;
                    const dragTarget =
                      canReorderCharacter && dragOverCharacterId === entry.instanceId &&
                      draggedCharacterId !== entry.instanceId;
                    return (
                      <Fragment key={entry.instanceId ?? `${entry.type}:${entry.cardId}`}>
                        {showAnyCharacterDivider ? (
                          <div
                            className="deck-editor__special-category-divider"
                            role="separator"
                            aria-label="Any Character specials"
                          />
                        ) : null}
                        <div
                          className={`deck-editor__card${koDimmed ? ' deck-editor__card--ko-dimmed' : ''}${canReorderCharacter ? ' deck-editor__card--reorderable' : ''}${reorderActive ? ' deck-editor__card--reorder-active' : ''}${draggedCharacterId === entry.instanceId ? ' deck-editor__card--dragging' : ''}${dragTarget ? ' deck-editor__card--drag-target' : ''}`}
                          draggable={canReorderCharacter && !isMobile}
                          onDragStart={(event) => {
                        if (!canReorderCharacter || !entry.instanceId) return;
                        setDraggedCharacterId(entry.instanceId);
                        event.dataTransfer.effectAllowed = 'move';
                        event.dataTransfer.setData('text/plain', entry.instanceId);
                      }}
                          onDragOver={(event) => {
                        if (!canReorderCharacter || !draggedCharacterId || !entry.instanceId) return;
                        event.preventDefault();
                        event.dataTransfer.dropEffect = 'move';
                        setDragOverCharacterId(entry.instanceId);
                      }}
                          onDrop={(event) => {
                        event.preventDefault();
                        if (entry.instanceId) dropCharacterOn(entry.instanceId);
                        setDraggedCharacterId(null);
                        setDragOverCharacterId(null);
                      }}
                          onDragEnd={() => {
                        setDraggedCharacterId(null);
                        setDragOverCharacterId(null);
                      }}
                        >
                      <div className="deck-editor__card-media">
                        <button
                          type="button"
                          className={`deck-editor__card-img ${deckCardImgOrientationClass(catalogType)}${isCardSelected ? ' is-selected' : ''}`}
                          onClick={() => {
                            if (suppressCharacterOpenRef.current) {
                              suppressCharacterOpenRef.current = false;
                              return;
                            }
                            if (catalogCard && catalogType && entry.instanceId) {
                              selectDeckCard(catalogCard, catalogType, entry.instanceId);
                            }
                          }}
                          onPointerDown={(event) => startCharacterHold(entry, event)}
                          onPointerMove={moveCharacterHold}
                          onPointerUp={finishCharacterHold}
                          onPointerCancel={finishCharacterHold}
                          onContextMenu={(event) => {
                            if (canReorderCharacter && isMobile) event.preventDefault();
                          }}
                          disabled={!canOpenDetail}
                          aria-label={canOpenDetail ? `View ${cardName}` : cardName}
                          aria-pressed={isCardSelected}
                        >
                          <CardImage
                            imagePath={imagePath}
                            catalogType={catalogType}
                            alt={cardName}
                            {...deckEditorCardImageLoadingProps(catalogType)}
                            isFoil={entryIsFoil}
                            foilSeed={foilSeed}
                          />
                        </button>
                        {canReorderCharacter && entry.instanceId ? (
                          <div
                            className="deck-editor__character-order"
                            aria-label={`${cardName} preview position ${orderState.position + 1} of ${orderState.total}`}
                          >
                            <span className="deck-editor__character-order-grip" aria-hidden="true">
                              <IconGripVertical />
                            </span>
                            <button
                              type="button"
                              className="deck-editor__character-order-btn"
                              disabled={orderState.position <= 0}
                              onClick={(event) => {
                                event.stopPropagation();
                                reorderCharacter(entry.instanceId!, -1);
                              }}
                              aria-label={`Move ${cardName} earlier in the deck preview`}
                              title="Move earlier"
                            >
                              <IconChevronUp />
                            </button>
                            <span className="deck-editor__character-order-position">
                              {orderState.position + 1} / {orderState.total}
                            </span>
                            <button
                              type="button"
                              className="deck-editor__character-order-btn"
                              disabled={orderState.position >= orderState.total - 1}
                              onClick={(event) => {
                                event.stopPropagation();
                                reorderCharacter(entry.instanceId!, 1);
                              }}
                              aria-label={`Move ${cardName} later in the deck preview`}
                              title="Move later"
                            >
                              <IconChevronDown />
                            </button>
                            <button
                              type="button"
                              className="deck-editor__character-order-done"
                              onClick={(event) => {
                                event.stopPropagation();
                                setActiveCharacterReorderId(null);
                              }}
                            >
                              Done
                            </button>
                          </div>
                        ) : null}
                      </div>
                      {entry.type === 'character' &&
                      reserveRowState &&
                      reserveSlotVisible(reserveRowState) ? (
                        <div className="deck-editor__card-reserve-wrap">
                          <ReserveCharacterButton
                            state={reserveRowState}
                            cardName={cardName}
                            onSelect={() => selectReserveCharacter(entry.cardId)}
                            onDeselect={deselectReserveCharacter}
                          />
                        </div>
                      ) : null}
                      {showCardFooter ? (
                        <div className="deck-editor__card-footer">
                          <span
                            className="deck-editor__card-footer-side"
                            aria-hidden="true"
                          />
                          <div className="deck-editor__card-footer-center">
                            {entryPrePlaced ? (
                              <span className="deck-editor__preplaced-chip">Pre-Placed</span>
                            ) : null}
                          </div>
                          <div className="deck-editor__card-controls">
                            {showKoOnCharacter ? (
                              <KoToggleButton
                                active={koCharacterIds.has(entry.cardId)}
                                cardName={cardName}
                                onToggle={() =>
                                  setKoCharacterIds((prev) =>
                                    toggleKoCharacterId(prev, entry.cardId),
                                  )
                                }
                              />
                            ) : null}
                            {isOwner ? (
                              <button
                                type="button"
                                className="deck-editor__card-remove"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (entry.instanceId) {
                                    removeDeckInstance(entry.instanceId);
                                  }
                                }}
                                aria-label={`Remove ${cardName}`}
                              >
                                <IconTrash />
                              </button>
                            ) : null}
                          </div>
                        </div>
                      ) : null}
                        </div>
                      </Fragment>
                    );
                  })}
                </div>
              </section>
            ))
          )}

          <Suspense fallback={<LoadingState label="Loading..." />}>
            <DrawHandPanel
              open={drawHandOpen}
            drawnCards={drawnCards}
            cardIndex={cardIndex}
            koCtx={drawHandKoCtx}
            onRedraw={handleDrawHandRedraw}
            onClose={closeDrawHand}
            onReorder={handleDrawHandReorder}
            onCardClick={selectDeckCard}
            />
          </Suspense>
        </div>
      </div>

      {/* Add cards panel */}
      {isOwner && (addOpen || addCardsMounted) ? (
        <Suspense fallback={<LoadingState label="Loading..." />}>
          <AddCardsPanel
            key={deckId}
            open={addOpen}
            onClose={() => setAddOpen(false)}
            onAdd={addCard}
            onAddStack={addStack}
            onRemoveInstance={removeDeckInstance}
            cards={cards}
            deckCatalogIndex={cardIndex}
            reserveCharacterId={reserveCharacterId}
          />
        </Suspense>
      ) : null}

      <CardDetailPanel
        card={selected?.card ?? null}
        type={selected?.type ?? null}
        open={Boolean(selected)}
        onClose={closeCardDetail}
        hasFoil={
          selected ? cardHasFoilVersion(selected.card, foilLookup.baseToFoil) : undefined
        }
        setDisplayName={
          selected ? resolveSetDisplayName(selected.card.set, setNameLookup) : undefined
        }
        isFoil={
          selected
            ? Boolean(selectedDeckEntry?.is_foil || isFoilCard(selected.card))
            : undefined
        }
        printings={printingRows}
        onApplyPrinting={isOwner ? applyPrinting : undefined}
        prePlacedEligible={selectedPrePlacedEligible}
        prePlaced={Boolean(selectedDeckEntry?.exclude_from_draw)}
        onTogglePrePlaced={
          isOwner && selected?.instanceId
            ? () => togglePrePlaced(selected.instanceId)
            : undefined
        }
      />
    </div>
    {showMobileNav ? <MobileBottomNav /> : null}
    </>
  );
}
