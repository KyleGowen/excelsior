import { useState } from 'react';
import type { TournamentEventMeta } from '../../lib/tournaments/types';
import type { TournamentPodiumDeckEntry } from '../../lib/tournaments/tournamentPodiumDecks';
import { getTournamentPlacardSections } from '../../lib/tournaments/tournamentPlacardSections';
import type { DashboardTileVariant } from '../dashboard';
import { PreviewTextTile } from './PreviewTextTile';
import { TournamentPodiumDeckRows } from './TournamentPodiumDeckRows';
import './TournamentCharts.css';

export interface TournamentPlacardSlide {
  id: string;
  label: string;
  meta: TournamentEventMeta;
  podiumEntries?: TournamentPodiumDeckEntry[];
}

interface TournamentPlacardCarouselTileProps {
  slides: TournamentPlacardSlide[];
  variant?: DashboardTileVariant;
  onOpenPodiumDeck?: (deckId: string, userId: string) => void;
  showWinnerWithPodium?: boolean;
}

export function TournamentPlacardCarouselTile({
  slides,
  variant = 'rail',
  onOpenPodiumDeck,
  showWinnerWithPodium = false,
}: TournamentPlacardCarouselTileProps) {
  const [activeSlideId, setActiveSlideId] = useState(slides[0]?.id ?? '');
  const activeSlide = slides.find((slide) => slide.id === activeSlideId) ?? slides[0];
  if (!activeSlide) return null;

  const showPodium = Boolean(activeSlide.podiumEntries?.length && onOpenPodiumDeck);
  const sections = getTournamentPlacardSections(
    activeSlide.meta,
    showPodium,
    showWinnerWithPodium,
  );

  return (
    <PreviewTextTile
      className="tournament-placard-tile tournament-placard-carousel-tile"
      variant={variant}
      title={activeSlide.meta.title}
      subtitle={activeSlide.meta.seasonLabel}
      sections={sections}
      header={(
        <div className="tournament-placard-carousel-tile__switcher" aria-label="Seattle event summary">
          {slides.map((slide) => (
            <button
              key={slide.id}
              type="button"
              className={slide.id === activeSlide.id ? 'is-active' : undefined}
              aria-pressed={slide.id === activeSlide.id}
              onClick={() => setActiveSlideId(slide.id)}
            >
              {slide.label}
            </button>
          ))}
        </div>
      )}
      footer={
        showPodium && activeSlide.podiumEntries && onOpenPodiumDeck ? (
          <TournamentPodiumDeckRows
            entries={activeSlide.podiumEntries}
            onOpenDeck={onOpenPodiumDeck}
          />
        ) : undefined
      }
    />
  );
}
