import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import type { CatalogCard } from '../../lib/api/types';
import type { CountEntry } from '../../lib/tournaments/types';
import { CardImage } from '../CardImage';
import { DashboardTile, type DashboardTileVariant } from '../dashboard';
import './TournamentCharts.css';
import { getTournamentCharacterMosaicColumns } from './tournamentCharacterMosaic';

const ART_CYCLE_MS = 1500;
const ART_CYCLE_HOVER_DELAY_MS = 1000;
const ART_TOUCH_HOLD_DELAY_MS = 750;

interface TournamentCharacterRosterTileProps {
  title: string;
  eventSubtitle?: string;
  entries: CountEntry[];
  variant: DashboardTileVariant;
  mode: 'cycle' | 'mosaic';
  onEntryClick: (entry: CountEntry) => void;
  resolveCard: (entry: CountEntry) => CatalogCard | null;
  isClickable: (entry: CountEntry) => boolean;
}

interface ResolvedRosterEntry {
  entry: CountEntry;
  card: CatalogCard | null;
}

function RosterCardImage({ item }: { item: ResolvedRosterEntry }) {
  if (!item.card) {
    return <span className="tournament-character-roster__placeholder">{item.entry.name}</span>;
  }

  return (
    <CardImage
      imagePath={item.card.image_path ?? item.card.image}
      alt={item.entry.name}
      catalogType={item.entry.catalogType}
      useThumbnail
      loading="eager"
      isFoil={item.card.is_foil}
      foilSeed={item.card.id}
      foilSize="hero"
    />
  );
}

function TournamentCharacterMosaic({
  items,
  onEntryClick,
  isClickable,
}: {
  items: ResolvedRosterEntry[];
  onEntryClick: (entry: CountEntry) => void;
  isClickable: (entry: CountEntry) => boolean;
}) {
  const columns = getTournamentCharacterMosaicColumns(items.length);
  const rows = Math.ceil(items.length / columns);

  return (
    <div
      className="tournament-character-roster__mosaic"
      style={
        {
          '--tournament-roster-columns': columns,
          '--tournament-roster-rows': rows,
        } as CSSProperties
      }
    >
      {items.map((item) => {
        const clickable = Boolean(item.card && isClickable(item.entry));
        return (
          <button
            key={item.entry.name}
            type="button"
            className="tournament-character-roster__mosaic-item"
            onClick={clickable ? () => onEntryClick(item.entry) : undefined}
            disabled={!clickable}
            aria-label={`View ${item.entry.name}`}
          >
            <RosterCardImage item={item} />
            <span className="tournament-character-roster__scrim" aria-hidden="true" />
            <span className="tournament-character-roster__name">{item.entry.name}</span>
          </button>
        );
      })}
    </div>
  );
}

function TournamentCharacterCycle({
  items,
  onEntryClick,
  isClickable,
}: {
  items: ResolvedRosterEntry[];
  onEntryClick: (entry: CountEntry) => void;
  isClickable: (entry: CountEntry) => boolean;
}) {
  const [slideIndex, setSlideIndex] = useState(0);
  const cycleTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const cycleDelayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdEngagedRef = useRef(false);
  const suppressOpenClickRef = useRef(false);
  const touchHoldActiveRef = useRef(false);
  const artRef = useRef<HTMLDivElement>(null);
  const startArtCycleRef = useRef<(delayMs?: number) => void>(() => {});
  const stopArtCycleRef = useRef<() => void>(() => {});
  const shownItem = items[slideIndex] ?? items[0]!;

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
      if (items.length <= 1) return;
      stopArtCycle();
      cycleDelayTimer.current = setTimeout(() => {
        cycleDelayTimer.current = null;
        holdEngagedRef.current = true;
        setSlideIndex((index) => (index + 1) % items.length);
        cycleTimer.current = setInterval(() => {
          setSlideIndex((index) => (index + 1) % items.length);
        }, ART_CYCLE_MS);
      }, delayMs);
    },
    [items.length, stopArtCycle],
  );

  startArtCycleRef.current = startArtCycle;
  stopArtCycleRef.current = stopArtCycle;

  useEffect(() => setSlideIndex(0), [items.length]);

  useEffect(() => {
    const element = artRef.current;
    if (!element) return undefined;

    const finishTouchHold = () => {
      if (!touchHoldActiveRef.current) return;
      touchHoldActiveRef.current = false;
      const wasCycling = holdEngagedRef.current;
      stopArtCycleRef.current();
      if (wasCycling) suppressOpenClickRef.current = true;
    };
    const onTouchStart = () => {
      touchHoldActiveRef.current = true;
      holdEngagedRef.current = false;
      startArtCycleRef.current(ART_TOUCH_HOLD_DELAY_MS);
    };
    const onTouchEnd = () => finishTouchHold();
    const onContextMenu = (event: Event) => event.preventDefault();

    element.addEventListener('touchstart', onTouchStart, { passive: true });
    element.addEventListener('touchend', onTouchEnd);
    element.addEventListener('touchcancel', onTouchEnd);
    element.addEventListener('contextmenu', onContextMenu);

    return () => {
      element.removeEventListener('touchstart', onTouchStart);
      element.removeEventListener('touchend', onTouchEnd);
      element.removeEventListener('touchcancel', onTouchEnd);
      element.removeEventListener('contextmenu', onContextMenu);
    };
  }, []);

  useEffect(() => () => stopArtCycle(), [stopArtCycle]);

  const handlePointerEnter = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'touch') startArtCycle();
  };
  const handlePointerLeave = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'touch') stopArtCycle();
  };
  const clickable = Boolean(shownItem.card && isClickable(shownItem.entry));
  const handleOpen = () => {
    if (suppressOpenClickRef.current) {
      suppressOpenClickRef.current = false;
      return;
    }
    if (clickable) onEntryClick(shownItem.entry);
  };

  return (
    <div
      ref={artRef}
      className="tournament-character-roster__cycle"
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      <button
        type="button"
        className="tournament-character-roster__cycle-button"
        onClick={handleOpen}
        disabled={!clickable}
        aria-label={`View ${shownItem.entry.name}`}
      >
        <span key={shownItem.entry.name} className="tournament-character-roster__cycle-image">
          <RosterCardImage item={shownItem} />
        </span>
        <span className="tournament-character-roster__scrim" aria-hidden="true" />
        <span className="tournament-character-roster__name">{shownItem.entry.name}</span>
        <span className="tournament-character-roster__position">
          {slideIndex + 1} / {items.length}
        </span>
      </button>
    </div>
  );
}

export function TournamentCharacterRosterTile({
  title,
  eventSubtitle,
  entries,
  variant,
  mode,
  onEntryClick,
  resolveCard,
  isClickable,
}: TournamentCharacterRosterTileProps) {
  const items = useMemo(
    () => entries.map((entry) => ({ entry, card: resolveCard(entry) })),
    [entries, resolveCard],
  );

  return (
    <DashboardTile
      variant={variant}
      layout="chart"
      title={title}
      eventSubtitle={eventSubtitle}
      subtitle={`${entries.length} newcomer${entries.length === 1 ? '' : 's'}`}
      className="stats-chart-tile tournament-character-roster"
    >
      {mode === 'cycle' ? (
        <TournamentCharacterCycle
          items={items}
          onEntryClick={onEntryClick}
          isClickable={isClickable}
        />
      ) : (
        <TournamentCharacterMosaic
          items={items}
          onEntryClick={onEntryClick}
          isClickable={isClickable}
        />
      )}
    </DashboardTile>
  );
}
