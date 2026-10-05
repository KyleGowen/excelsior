import type { ReactNode } from 'react';
import type { CatalogCard, CatalogType } from '../../lib/api/types';
import {
  CATALOG_TYPE_BY_SLUG,
  cardDisplayName,
  catalogTypeLabel,
} from '../../lib/catalog/catalogTypeMap';
import { isFoilCard } from '../../lib/catalog/foilCatalog';
import { resolveSetDisplayName } from '../../lib/catalog/setNames';

export interface CatalogAllListItem {
  card: CatalogCard;
  catalogType: CatalogType;
}

interface CatalogAllListProps {
  items: CatalogAllListItem[];
  selectedId?: string | null;
  onSelect: (item: CatalogAllListItem) => void;
  renderTrailing?: (item: CatalogAllListItem) => ReactNode;
  dimmed?: (item: CatalogAllListItem) => boolean;
  /** Uppercased set code → friendly name (from `buildSetNameLookup`). */
  setNameLookup?: Map<string, string>;
  /** Optional row label formatter (default: `cardDisplayName`). */
  formatName?: (item: CatalogAllListItem) => string;
  /** Collection All: type badge between `#` and name (default: name then type). */
  typeBetweenNumberAndName?: boolean;
  /** Use ultra-compact type labels (Collection All mobile). */
  compactTypeLabels?: boolean;
}

function setCodeForCard(card: CatalogCard): string {
  return String(card.set ?? (card.universe as string) ?? '').trim();
}

/** Mobile Collection All scan band parts (no `#`). */
function mobileScanNumLabel(setNumber: string): string {
  return setNumber || '—';
}

const EMPTY_SET_LOOKUP = new Map<string, string>();

export function CatalogAllList({
  items,
  selectedId,
  onSelect,
  renderTrailing,
  dimmed,
  setNameLookup,
  formatName,
  typeBetweenNumberAndName = false,
  compactTypeLabels = false,
}: CatalogAllListProps) {
  const hasTrailing = Boolean(renderTrailing);

  return (
    <ul
      className={[
        'catalog-all-list',
        typeBetweenNumberAndName ? 'catalog-all-list--type-after-number' : '',
      ].filter(Boolean).join(' ')}
      role="list"
    >
      {items.map((item) => {
        const { card, catalogType } = item;
        const meta = CATALOG_TYPE_BY_SLUG[catalogType];
        const setNumber = String(card.set_number ?? '').trim();
        const setCode = setCodeForCard(card);
        const setLabel = setCode
          ? resolveSetDisplayName(setCode, setNameLookup ?? EMPTY_SET_LOOKUP)
          : undefined;
        const isSelected = selectedId === card.id;
        const isDimmed = dimmed?.(item) ?? false;
        const foil = isFoilCard(card);
        const displayName = formatName ? formatName(item) : cardDisplayName(card);

        const setCodeEl = setCode ? (
          <span
            className="catalog-all-list__set-code"
            aria-hidden="true"
            title={setLabel && setLabel !== setCode ? setLabel : undefined}
          >
            {setCode}
          </span>
        ) : (
          <span className="catalog-all-list__set-code" aria-hidden="true" />
        );

        const numberEl = (
          <span className="catalog-all-list__number" aria-hidden="true">
            {setNumber ? (
              <>
                <span className="catalog-all-list__number-hash" aria-hidden="true">
                  #
                </span>
                {setNumber}
              </>
            ) : (
              '—'
            )}
          </span>
        );

        const scanIdEl = (
          <span
            className="catalog-all-list__scan-id"
            aria-hidden="true"
            title={setLabel && setLabel !== setCode ? setLabel : undefined}
          >
            <span className="catalog-all-list__scan-set">{setCode || '\u00a0'}</span>
            <span className="catalog-all-list__scan-num">{mobileScanNumLabel(setNumber)}</span>
          </span>
        );

        const nameEl = (
          <span className="catalog-all-list__name" title={displayName}>
            {displayName}
            {foil ? <span className="catalog-all-list__foil"> ✦</span> : null}
          </span>
        );

        const typeLabel = catalogTypeLabel(catalogType, compactTypeLabels);

        const typeEl = (
          <span
            className="badge catalog-all-list__type-badge"
            title={compactTypeLabels ? meta.shortLabel : undefined}
          >
            {typeLabel}
          </span>
        );

        const setBadgeEl = setLabel ? (
          <span className="badge catalog-all-list__set-badge" title={setLabel}>
            {setLabel}
          </span>
        ) : (
          <span className="catalog-all-list__set-badge" aria-hidden="true" />
        );

        return (
          <li
            key={`${catalogType}:${card.id}`}
            className={[
              'catalog-all-list__row',
              hasTrailing ? 'catalog-all-list__row--has-trailing' : '',
              isSelected ? 'is-selected' : '',
              isDimmed ? 'is-dimmed' : '',
            ].filter(Boolean).join(' ')}
          >
            <button
              type="button"
              className="catalog-all-list__main"
              onClick={() => onSelect(item)}
              aria-pressed={isSelected}
            >
              {setCodeEl}
              {numberEl}
              {scanIdEl}
              {typeBetweenNumberAndName ? (
                <>
                  {typeEl}
                  {nameEl}
                </>
              ) : (
                <>
                  {nameEl}
                  {typeEl}
                </>
              )}
              {setBadgeEl}
            </button>
            {renderTrailing ? (
              <div className="catalog-all-list__trailing">{renderTrailing(item)}</div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
