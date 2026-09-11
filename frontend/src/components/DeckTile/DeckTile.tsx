import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CardImage } from '../CardImage';
import { EmptyState } from '../EmptyState';
import { IconCards, IconDots, IconHeart } from '../icons';
import { StatIconBadge } from '../StatIconBadge';
import type { DeckCardEntry, DeckListItem } from '../../lib/api/types';
import type { StatIconType } from '../../lib/icons/statIconTypes';
import { formatThreatTooltip } from '../../lib/decks/deckThreat';
import { deckArtSlides } from '../../lib/decks/deckTileArtSlides';
import { deckLegalityBadge, deckTileVisibilityBadge, legalityBadgeClass } from './deckTileLegality';
import './DeckTile.css';

const ART_CYCLE_MS = 1500;
/** Hover (desktop): current slide is already visible, so wait before the first advance. */
const ART_CYCLE_HOVER_DELAY_MS = 1000;
/**
 * Touch hold: engage cycling after a brief delay so a press-and-hold cycles without needing the OS
 * long-press (the "hold till the phone vibrates" gesture). Long enough that a quick tap opens the
 * deck and a hold-then-scroll drag scrolls cleanly before the cycle would start.
 */
const ART_TOUCH_HOLD_DELAY_MS = 750;

export interface DeckStatLine {
  energy: number;
  combat: number;
  bruteForce: number;
  intelligence: number;
}

interface DeckTileProps {
  deck: DeckListItem;
  variant?: 'compact' | 'full';
  /** Optional precomputed max-stat line (deck selection enriches from catalog). */
  maxStats?: DeckStatLine | null;
  /** Mission set name from catalog lookup (not the display mission card name). */
  missionSetName?: string | null;
  rankLabel?: string;
  onOpen?: () => void;
  onMenu?: () => void;
  /** Show the Public/Unlisted chip (display-only). Use on the owner's own decks. */
  showVisibility?: boolean;
  /** When provided, renders an upper-right favorite heart (for decks not owned by the viewer). */
  onToggleFavorite?: () => void;
  isFavorited?: boolean;
  favoriteBusy?: boolean;
  /** Owner display name (community / favorites / public profile tiles). */
  ownerName?: string | null;
  /** Click handler for the owner name (navigate to public profile). */
  onOwnerClick?: () => void;
  /** Hide the updated timestamp in curated tile contexts such as preconstructed decks. */
  showUpdated?: boolean;
  /** Hide Limited/Not Legal badges in contexts where the format is implied. */
  showLegality?: boolean;
}

function firstCardOfType(deck: DeckListItem, type: DeckCardEntry['type']): DeckCardEntry | undefined {
  return (deck.cards ?? []).find((c) => c.type === type);
}

const STAT_DEFS: Array<{ key: keyof DeckStatLine; iconKey: StatIconType }> = [
  { key: 'energy', iconKey: 'energy' },
  { key: 'combat', iconKey: 'combat' },
  { key: 'bruteForce', iconKey: 'brute_force' },
  { key: 'intelligence', iconKey: 'intelligence' },
];

export function DeckTile({
  deck,
  variant = 'full',
  maxStats,
  missionSetName,
  rankLabel,
  onOpen,
  onMenu,
  showVisibility,
  onToggleFavorite,
  isFavorited,
  favoriteBusy,
  ownerName,
  onOwnerClick,
  showUpdated = true,
  showLegality = true,
}: DeckTileProps) {
  const meta = deck.metadata;
  const artSlides = useMemo(() => deckArtSlides(deck), [deck]);
  const legalityBadge = deckLegalityBadge(meta);
  const visibilityBadge = showVisibility ? deckTileVisibilityBadge(meta) : null;
  const [slideIndex, setSlideIndex] = useState(0);
  const cycleTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const cycleDelayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdEngagedRef = useRef(false);
  const suppressOpenClickRef = useRef(false);
  const touchHoldActiveRef = useRef(false);
  const artRef = useRef<HTMLDivElement>(null);
  const startArtCycleRef = useRef<(delayMs?: number) => void>(() => {});
  const stopArtCycleRef = useRef<() => void>(() => {});
  const shownSlide = artSlides[slideIndex] ?? artSlides[0];
  const isStructuralSlide =
    shownSlide?.catalogType === 'locations' || shownSlide?.catalogType === 'battlegrounds';

  const stopArtCycle = useCallback(() => {
    if (cycleTimer.current != null) {
      clearInterval(cycleTimer.current);
      cycleTimer.current = null;
    }
    if (cycleDelayTimer.current != null) {
      clearTimeout(cycleDelayTimer.current);
      cycleDelayTimer.current = null;
    }
  }, []);

  const startArtCycle = useCallback(
    (delayMs: number = ART_CYCLE_HOVER_DELAY_MS) => {
      if (artSlides.length <= 1) return;
      stopArtCycle();
      cycleDelayTimer.current = setTimeout(() => {
        cycleDelayTimer.current = null;
        holdEngagedRef.current = true;
        setSlideIndex((i) => (i + 1) % artSlides.length);
        cycleTimer.current = setInterval(() => {
          setSlideIndex((i) => (i + 1) % artSlides.length);
        }, ART_CYCLE_MS);
      }, delayMs);
    },
    [artSlides.length, stopArtCycle],
  );

  startArtCycleRef.current = startArtCycle;
  stopArtCycleRef.current = stopArtCycle;

  const handleArtPointerEnter = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType === 'touch') return;
      startArtCycle();
    },
    [startArtCycle],
  );

  const handleArtPointerLeave = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType === 'touch') return;
      stopArtCycle();
    },
    [stopArtCycle],
  );

  useEffect(() => {
    const el = artRef.current;
    if (!el) return;

    const finishTouchHold = () => {
      if (!touchHoldActiveRef.current) return;
      touchHoldActiveRef.current = false;
      const wasCycling = holdEngagedRef.current;
      stopArtCycleRef.current();
      if (wasCycling) {
        suppressOpenClickRef.current = true;
      }
    };

    const onTouchStart = () => {
      touchHoldActiveRef.current = true;
      holdEngagedRef.current = false;
      // Engage cycling on a short hold (no OS long-press needed). touch-action: pan-x pan-y lets a
      // drag in either axis scroll instead (vertical lists, horizontal Home rails) — the browser
      // fires touchcancel when it claims the gesture for scrolling, which stops the cycle so the
      // page/rail can scroll freely.
      startArtCycleRef.current(ART_TOUCH_HOLD_DELAY_MS);
    };

    const onTouchEnd = () => finishTouchHold();
    const onContextMenu = (e: Event) => e.preventDefault();

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchend', onTouchEnd);
    el.addEventListener('touchcancel', onTouchEnd);
    el.addEventListener('contextmenu', onContextMenu);

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
      el.removeEventListener('contextmenu', onContextMenu);
    };
  }, []);

  const handleTileClick = useCallback(() => {
    if (suppressOpenClickRef.current) {
      suppressOpenClickRef.current = false;
      return;
    }
    onOpen?.();
  }, [onOpen]);

  useEffect(() => () => stopArtCycle(), [stopArtCycle]);

  const mission = firstCardOfType(deck, 'mission');
  const missionChipLabel = missionSetName?.trim() || mission?.name?.trim() || null;
  const updatedLabel = showUpdated && meta.lastModified
    ? new Date(meta.lastModified).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <article
      className={`deck-tile deck-tile--${variant}`}
      onClick={onOpen ? handleTileClick : undefined}
      role={onOpen ? 'button' : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onKeyDown={(e) => {
        if (onOpen && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      <div
        ref={artRef}
        className="deck-tile__art"
        onPointerEnter={handleArtPointerEnter}
        onPointerLeave={handleArtPointerLeave}
        onContextMenu={(e) => e.preventDefault()}
      >
        {shownSlide ? (
          <div
            className={`deck-tile__hero${isStructuralSlide ? ' deck-tile__hero--structural' : ''}`}
            aria-hidden="true"
          >
            <CardImage
              imagePath={shownSlide.imagePath}
              catalogType={shownSlide.catalogType}
              alt={shownSlide.name || 'Character'}
              useThumbnail={!isStructuralSlide}
              loading="eager"
              className={isStructuralSlide ? undefined : 'card-image--contain'}
              isFoil={shownSlide.isFoil}
              foilSeed={shownSlide.cardId}
              foilSize="hero"
            />
          </div>
        ) : (
          <div className="deck-tile__art-empty">
            <IconCards />
          </div>
        )}
        <div className="deck-tile__art-veil" />

        {rankLabel ? <span className="deck-tile__rank">{rankLabel}</span> : null}
        {onToggleFavorite ? (
          <button
            type="button"
            className={`deck-tile__fav${isFavorited ? ' is-active' : ''}`}
            aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
            aria-pressed={Boolean(isFavorited)}
            disabled={favoriteBusy}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
          >
            <IconHeart filled={isFavorited} />
          </button>
        ) : null}
        {onMenu ? (
          <button
            type="button"
            className="deck-tile__menu"
            aria-label="Deck actions"
            onClick={(e) => {
              e.stopPropagation();
              onMenu();
            }}
          >
            <IconDots />
          </button>
        ) : null}

        <div className="deck-tile__overlay">
          <h3 className="deck-tile__name" title={meta.name}>{meta.name}</h3>
        </div>
      </div>

      <div className="deck-tile__body">
        <div className="deck-tile__meta-bar" aria-label="Deck summary">
          <span className="deck-tile__metric deck-tile__metric--start" title="Cards">
            <span className="deck-tile__metric-icon" aria-hidden="true">
              <IconCards />
            </span>
            {meta.cardCount}
          </span>
          {missionChipLabel ? (
            <span className="deck-tile__chip" title={`Mission set: ${missionChipLabel}`}>
              <span className="deck-tile__chip-text">{missionChipLabel}</span>
            </span>
          ) : null}
          {showLegality ? (
            <span
              className={`deck-tile__legality deck-tile__legality--meta badge ${legalityBadgeClass(
                legalityBadge.variant,
              )}`}
            >
              {legalityBadge.label}
            </span>
          ) : null}
          <span className="deck-tile__metric deck-tile__metric--end">
            <StatIconBadge
              type="threat_level"
              value={meta.threat ?? 0}
              size="sm"
              title={formatThreatTooltip(meta.threat ?? 0)}
            />
          </span>
        </div>

        {visibilityBadge ? (
          <div className="deck-tile__subrow">
            <span className="deck-tile__subrow-spacer" aria-hidden="true" />
            <span className={`deck-tile__visibility badge badge-visibility--${visibilityBadge.variant}`}>
              {visibilityBadge.label}
            </span>
          </div>
        ) : null}

        {variant === 'full' && maxStats ? (
          <div className="deck-tile__stats" aria-label="Character maximums">
            {STAT_DEFS.map((s) => (
              <StatIconBadge
                key={s.key}
                type={s.iconKey}
                value={maxStats[s.key]}
                size="md"
              />
            ))}
          </div>
        ) : null}

        {ownerName || updatedLabel || showLegality ? (
          <div className="deck-tile__footer">
            {/* Owner/date/legality are independently optional by tile context. */}
            {ownerName ? (
              onOwnerClick ? (
                <button
                  type="button"
                  className="deck-tile__owner deck-tile__owner--link"
                  title={`View ${ownerName}'s public decks`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onOwnerClick();
                  }}
                >
                  {ownerName}
                </button>
              ) : (
                <span className="deck-tile__owner">{ownerName}</span>
              )
            ) : (
              <span className="deck-tile__footer-spacer" aria-hidden="true" />
            )}
            <div className="deck-tile__footer-end">
              {updatedLabel ? (
                <span className="deck-tile__updated">Updated {updatedLabel}</span>
              ) : null}
              {showLegality ? (
                <span
                  className={`deck-tile__legality deck-tile__legality--footer badge ${legalityBadgeClass(
                    legalityBadge.variant,
                  )}`}
                >
                  {legalityBadge.label}
                </span>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}

export function DeckTileEmpty({ message }: { message: string }) {
  return <EmptyState title="No decks yet" message={message} icon={<IconCards />} />;
}
