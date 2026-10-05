import { memo, type ReactNode } from 'react';
import { CardImage } from '../CardImage';
import { cardDisplayName } from '../../lib/catalog/catalogTypeMap';
import { isFoilCard } from '../../lib/catalog/foilCatalog';
import { imagePathFromCard } from '../../lib/images/cardImages';
import type { CatalogCard, CatalogType } from '../../lib/api/types';

interface CardTileProps {
  card: CatalogCard;
  onClick?: () => void;
  /** Top-right overlay (e.g. owned quantity badge). */
  overlay?: ReactNode;
  /** Footer action area (e.g. +Deck button or quantity stepper). */
  footer?: ReactNode;
  /** Dim the art (e.g. unowned cards in the collection view). */
  dimmed?: boolean;
  showMeta?: boolean;
  /** When set (database grid), picks landscape vs portrait art frame and contain-fit. */
  catalogType?: CatalogType;
  /** Silver starburst on tile when a foil variant exists (database grid). */
  hasFoilVersion?: boolean;
  /** When false, suppresses the prismatic foil overlay on foil printings (DBV, Add Cards). Default true. */
  showFoilEffect?: boolean;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
}

function tileOrientationClass(catalogType?: CatalogType): string {
  if (!catalogType) return '';
  if (catalogType === 'characters') return 'card-tile--characters';
  if (catalogType === 'locations' || catalogType === 'battlegrounds') return 'card-tile--locations';
  if (catalogType === 'events') return 'card-tile--events';
  return 'card-tile--portrait';
}

function formatSetLabel(card: CatalogCard): string | null {
  if (!card.set) return null;
  const setNumber = String(card.set_number ?? '').trim();
  return setNumber ? `${card.set} ${setNumber}` : card.set;
}

export const CardTile = memo(function CardTile({
  card,
  onClick,
  overlay,
  footer,
  dimmed = false,
  showMeta = true,
  catalogType,
  hasFoilVersion = false,
  showFoilEffect = true,
  onHoverStart,
  onHoverEnd,
}: CardTileProps) {
  const name = cardDisplayName(card);
  const imagePath = imagePathFromCard(card);
  const setLabel = formatSetLabel(card);
  const orientationClass = tileOrientationClass(catalogType);

  return (
    <article
      className={`card-tile ${dimmed ? 'card-tile--dimmed' : ''} ${orientationClass}`.trim()}
      onPointerEnter={onHoverStart}
      onPointerLeave={onHoverEnd}
    >
      <div
        className={`card-tile__art${onClick ? ' card-tile__art--clickable' : ''}`}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onClick={onClick}
        onKeyDown={(event) => {
          if (!onClick || event.target !== event.currentTarget) return;
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onClick();
          }
        }}
        aria-label={onClick ? `View ${name}` : undefined}
      >
        <CardImage
          imagePath={imagePath}
          alt={name}
          useThumbnail={!catalogType}
          progressive={Boolean(catalogType)}
          catalogType={catalogType}
          className={catalogType ? 'card-image--contain' : ''}
          isFoil={showFoilEffect && isFoilCard(card)}
          foilSeed={card.id}
        />
        {overlay ? <span className="card-tile__overlay">{overlay}</span> : null}
      </div>
      {showMeta ? (
        <div className="card-tile__meta">
          <span className="card-tile__name-row">
            <span className="card-tile__name" title={name}>{name}</span>
            {hasFoilVersion ? (
              <span className="card-tile__foil-badge" title="has foil">
                <span className="card-tile__foil-badge-icon" aria-hidden>✦</span>
                <span className="sr-only">has foil</span>
              </span>
            ) : null}
          </span>
          <span className="card-tile__sub">
            {setLabel ? <span>{setLabel}</span> : null}
            {card.rarity ? <span className="card-tile__rarity">{card.rarity}</span> : null}
          </span>
        </div>
      ) : null}
      {footer ? <div className="card-tile__footer">{footer}</div> : null}
    </article>
  );
});
