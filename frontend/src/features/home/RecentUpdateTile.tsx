import { resolveThumbUrl } from '../../lib/images/cardImages';
import { IconSparkles } from '../../components/icons';
import type { RecentUpdate } from '../../lib/api/types';
import { formatUpdateTypeLabel } from './recentUpdatesUtils';
import './recentUpdates.css';

interface RecentUpdateTileProps {
  item: RecentUpdate;
  isOpen: boolean;
  onToggle: () => void;
}

export function RecentUpdateTile({ item, isOpen, onToggle }: RecentUpdateTileProps) {
  const typeLabel = formatUpdateTypeLabel(item.type);
  const typeClass = item.type.replace(/_/g, '-');
  const isSkyboundLaunch = item.id === 'a1000001-0000-4000-8000-000000000007';
  const isSkyboundAltArtReveal = item.id === 'a1000001-0000-4000-8000-000000000009';
  const isErrataFeature = item.id === 'a1000001-0000-4000-8000-000000000010';
  const isPreconstructedDecksUpdate = item.id === 'a1000001-0000-4000-8000-000000000011';
  const thumbnailClassName = isSkyboundLaunch
    ? 'home__news-thumb-image--skybound-launch'
    : isSkyboundAltArtReveal
      ? 'home__news-thumb-image--skybound-alt-art'
      : isErrataFeature
        ? 'home__news-thumb-image--errata-feature'
        : isPreconstructedDecksUpdate
          ? 'home__news-thumb-image--preconstructed-decks'
          : undefined;

  return (
    <button
      type="button"
      className={`home__news-item${isOpen ? ' home__news-item--open' : ''}`}
      aria-expanded={isOpen}
      onClick={onToggle}
    >
      <div className="home__news-thumb">
        {item.cardImageUrl ? (
          <img
            className={thumbnailClassName}
            src={resolveThumbUrl(item.cardImageUrl)}
            alt=""
            loading="lazy"
            draggable={false}
          />
        ) : (
          <span className="home__news-thumb-icon"><IconSparkles /></span>
        )}
      </div>
      <div className="home__news-body">
        <span className={`home__news-tag home__news-tag--${typeClass}`}>
          {typeLabel}
        </span>
        <h3 className="home__news-title">{item.title}</h3>
        <p className={`home__news-summary home__news-summary--${isOpen ? 'expanded' : 'clamped'}`}>
          {item.description}
        </p>
        <span className="home__news-date">
          {new Date(item.updatedAt).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      </div>
    </button>
  );
}
