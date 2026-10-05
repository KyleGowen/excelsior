import type { ReactNode } from 'react';
import { SlideOutPanel } from '../SlideOutPanel';
import { CardImage } from '../CardImage';
import { isFoilCard } from '../../lib/catalog/foilCatalog';
import { IconChevronDown } from '../icons';
import {
  cardDisplayName,
  cardAbilityText,
  labelForCatalogType,
} from '../../lib/catalog/catalogTypeMap';
import { isMoreCardDetailField, shouldShowCardDetailField } from './cardDetailFields';
import type { CatalogCard, CatalogType } from '../../lib/api/types';
import { imagePathFromCard } from '../../lib/images/cardImages';

/** Default slide-out width for catalog card detail (20% wider than the original 420px). */
export const CARD_DETAIL_PANEL_WIDTH = 504;

interface CardDetailPrintingRow {
  card: CatalogCard;
  setDisplayName: string;
  setNumber: string | null;
  isCurrent: boolean;
}

interface CardDetailPanelProps {
  card: CatalogCard | null;
  type: CatalogType | null;
  open: boolean;
  onClose: () => void;
  /** Action area rendered under the header (e.g. +Deck, collection stepper). */
  actions?: ReactNode;
  /** When set, renders "Has Foil" in Details (foil variant exists for this card). */
  hasFoil?: boolean;
  /** When set, renders "Is Foil" in Details (this catalog row is a foil printing). */
  isFoil?: boolean;
  /** When false, suppresses the prismatic foil overlay on the hero image. Default true. */
  showFoilEffect?: boolean;
  /** Friendly set name for Details (falls back to `card.set` code when omitted). */
  setDisplayName?: string;
  /** Deck editor: alternate printings with Apply actions (hidden when length <= 1). */
  printings?: CardDetailPrintingRow[];
  onApplyPrinting?: (printingId: string) => void;
  /** Deck editor: whether the owner may toggle Pre-Placed for this card. */
  prePlacedEligible?: boolean;
  /** Deck editor: current Pre-Placed state (excluded from Draw Hand). */
  prePlaced?: boolean;
  /** Deck editor: toggle Pre-Placed for the selected deck card. */
  onTogglePrePlaced?: () => void;
  /** Embedded previews can suppress text that duplicates readable card art. */
  hideTextSections?: boolean;
}

export type CardDetailContentProps = Omit<CardDetailPanelProps, 'open' | 'onClose'>;

/** Internal / non-display fields hidden from the auto-generated field list. */
const HIDDEN_FIELDS = new Set([
  'id',
  'image',
  'image_path',
  'reverse_image_path',
  'thumb',
  'name',
  'card_name',
  'created_at',
  'updated_at',
  'energy',
  'combat',
  'brute_force',
  'intelligence',
  'special_abilities',
  'special_ability',
  'card_effect',
  'game_effect',
  'card_text',
  'is_foil',
  'threat_level',
  'set',
  'errata',
]);

function humanizeKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bId\b/, 'ID');
}

function formatValue(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) {
    const items = value.filter((v) => v !== null && v !== undefined && v !== '');
    return items.length ? items.join(', ') : null;
  }
  if (typeof value === 'object') return null;
  return String(value);
}

function detailImageClass(type: CatalogType | null): string {
  if (type === 'characters') return ' card-detail__image--characters';
  if (type === 'locations') return ' card-detail__image--locations';
  if (type === 'events') return ' card-detail__image--events';
  return '';
}

export function CardDetailContent({
  card,
  type,
  actions,
  hasFoil,
  isFoil,
  showFoilEffect = true,
  setDisplayName,
  printings,
  onApplyPrinting,
  prePlacedEligible,
  prePlaced,
  onTogglePrePlaced,
  hideTextSections,
}: CardDetailContentProps) {
  if (!card) return null;

  const name = cardDisplayName(card);
  const ability = cardAbilityText(card);
  const typeLabel = type ? labelForCatalogType(type) : '';

  const extraFields = Object.entries(card)
    .filter(([key]) => !HIDDEN_FIELDS.has(key))
    .filter(([key]) => shouldShowCardDetailField(key, type, card))
    .map(([key, value]) => [key, formatValue(value)] as const)
    .filter(([, value]) => value !== null);

  const primaryFields = extraFields.filter(([key]) => !isMoreCardDetailField(key));
  const moreFields = extraFields.filter(([key]) => isMoreCardDetailField(key));
  const errata = card.errata ?? [];

  const showDetails = Boolean(card.set) || hasFoil !== undefined || isFoil !== undefined || extraFields.length > 0;
  const setLabel = card.set ? (setDisplayName ?? String(card.set)) : null;

  const showPrintings = Boolean(printings && printings.length > 1);

  return (
    <div className="card-detail">
      <div className={`card-detail__image${detailImageClass(type)}`}>
        <CardImage
          key={card.id}
          imagePath={imagePathFromCard(card)}
          reverseImagePath={card.reverse_image_path as string | null | undefined}
          catalogType={type ?? undefined}
          alt={name}
          useThumbnail={false}
          className="card-image--contain"
          isFoil={showFoilEffect && Boolean(isFoil ?? isFoilCard(card))}
          foilSeed={card.id}
          foilSize="hero"
          foilEagerIntro
        />
      </div>

      <div className="card-detail__tags">
        {typeLabel ? <span className="badge">{typeLabel}</span> : null}
        {card.set ? <span className="badge">{card.set}</span> : null}
        {card.rarity ? <span className="badge">{card.rarity}</span> : null}
        {card.set_number ? <span className="badge">#{card.set_number}</span> : null}
      </div>

      {actions ? <div className="card-detail__actions">{actions}</div> : null}

      {prePlaced === true || (prePlacedEligible && onTogglePrePlaced) ? (
        <div className="card-detail__preplaced">
          {prePlacedEligible && onTogglePrePlaced ? (
            <button
              type="button"
              className={`card-detail__preplaced-btn${prePlaced ? ' is-active' : ''}`}
              onClick={onTogglePrePlaced}
              aria-pressed={Boolean(prePlaced)}
              title={
                prePlaced
                  ? 'Unmark as Pre-Placed (include in Draw Hand)'
                  : 'Mark as Pre-Placed (exclude from Draw Hand)'
              }
            >
              Pre-Placed
            </button>
          ) : (
            <span className="card-detail__preplaced-btn is-active" aria-label="Pre-Placed">
              Pre-Placed
            </span>
          )}
          <p className="card-detail__preplaced-hint">
            {prePlaced
              ? 'Placed at game start — excluded from Draw Hand.'
              : 'Place at game start to exclude this card from Draw Hand.'}
          </p>
        </div>
      ) : null}

      {ability && !hideTextSections ? (
        <section className="card-detail__section">
          <h4 className="card-detail__section-title">Ability</h4>
          <p className="card-detail__text">{ability}</p>
        </section>
      ) : null}

      {showPrintings ? (
        <section className="card-detail__section">
          <h4 className="card-detail__section-title">Printings</h4>
          <ul className="card-detail__printings">
            {printings!.map((row) => {
              const labelParts = [row.setDisplayName];
              if (row.setNumber) labelParts.push(`#${row.setNumber}`);
              const label = labelParts.join(' · ');
              return (
                <li className="card-detail__printing-row" key={row.card.id}>
                  <span className="card-detail__printing-meta">{label}</span>
                  <button
                    type="button"
                    className={`card-detail__printing-apply${row.isCurrent ? ' card-detail__printing-apply--current' : ''}`}
                    disabled={row.isCurrent}
                    aria-disabled={row.isCurrent}
                    onClick={() => onApplyPrinting?.(row.card.id)}
                  >
                    {row.isCurrent ? 'Applied' : 'Apply'}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {showDetails && !hideTextSections ? (
        <section className="card-detail__section">
          <h4 className="card-detail__section-title">Details</h4>
          <dl className="card-detail__fields">
            {setLabel ? (
              <div className="card-detail__field">
                <dt>Set</dt>
                <dd>{setLabel}</dd>
              </div>
            ) : null}
            {isFoil !== undefined ? (
              <div className="card-detail__field">
                <dt>Is Foil</dt>
                <dd>{isFoil ? 'Yes' : 'No'}</dd>
              </div>
            ) : null}
            {hasFoil !== undefined ? (
              <div className="card-detail__field">
                <dt>Has Foil</dt>
                <dd>{hasFoil ? 'Yes' : 'No'}</dd>
              </div>
            ) : null}
            {primaryFields.map(([key, value]) => (
              <div className="card-detail__field" key={key}>
                <dt>{humanizeKey(key)}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          {moreFields.length ? (
            <details className="card-detail__more" key={`${card.id}-more`}>
              <summary className="card-detail__more-summary">
                <span className="card-detail__more-label">
                  <IconChevronDown className="card-detail__more-chevron" aria-hidden />
                  More
                </span>
              </summary>
              <dl className="card-detail__fields card-detail__fields--more">
                {moreFields.map(([key, value]) => (
                  <div className="card-detail__field" key={key}>
                    <dt>{humanizeKey(key)}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </details>
          ) : null}
        </section>
      ) : null}

      {errata.length ? (
        <section className="card-detail__section card-detail__errata" aria-label="Official errata">
          <h4 className="card-detail__section-title">Errata</h4>
          <div className="card-detail__errata-list">
            {errata.map((entry) => (
              <article className="card-detail__errata-entry" key={entry.id}>
                <h5 className="card-detail__errata-title">{entry.entry_title}</h5>
                <p className="card-detail__errata-text">{entry.entry_text}</p>
                <a
                  className="card-detail__errata-link"
                  href={entry.source_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  View official errata <span aria-hidden>↗</span>
                </a>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

export function CardDetailPanel({ card, type, open, onClose, ...contentProps }: CardDetailPanelProps) {
  if (!card) return null;

  const name = cardDisplayName(card);

  return (
    <SlideOutPanel
      open={open}
      onClose={onClose}
      title={name}
      ariaLabel={`${name} details`}
      width={CARD_DETAIL_PANEL_WIDTH}
      className="card-detail-slideout"
    >
      <CardDetailContent card={card} type={type} {...contentProps} />
    </SlideOutPanel>
  );
}
