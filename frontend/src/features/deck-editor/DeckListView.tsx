import { useImageAssets } from '../../lib/images/useImageAssets';
import { useMemo, useState } from 'react';
import { STAT_ICON_PATHS } from '../database/filters/dbvFilterTypes';
import { catalogSlugForDeckType } from '../../lib/decks/deckCardCatalog';
import {
  balanceSectionsIntoColumns,
  buildDeckListSection,
  sectionCardCount,
  sectionRowCount,
  type AttackIconType,
  type DeckListRow,
  type DeckListSectionInput,
} from '../../lib/decks/deckListView';
import {
  computeReserveRowState,
  reserveSlotVisible,
  type ReserveRowState,
  type ReserveCharacterEntry,
} from '../../lib/decks/reserveCharacter';
import {
  shouldDimDeckCard,
  type KoDimmingContext,
} from '../../lib/decks/simulateKo';
import type { CatalogCard, CatalogType, DeckCardEntry } from '../../lib/api/types';
import type { CatalogTypeMeta } from '../../lib/catalog/catalogTypeMap';
import type { DeckCardIndex } from '../../lib/decks/deckCardCatalog';
import { IconTrash } from '../../components/icons';
import { KoToggleButton } from './KoToggleButton';
import { ReserveCharacterButton } from './ReserveCharacterButton';

const DECK_VIEW_MODE_KEY = 'deck-editor-view-mode';

export type DeckViewMode = 'card' | 'list';

export function readDeckViewMode(): DeckViewMode {
  if (typeof sessionStorage === 'undefined') return 'card';
  const stored = sessionStorage.getItem(DECK_VIEW_MODE_KEY);
  return stored === 'list' ? 'list' : 'card';
}

export function persistDeckViewMode(mode: DeckViewMode): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(DECK_VIEW_MODE_KEY, mode);
}

export interface DeckListGroup {
  meta: CatalogTypeMeta;
  entries: DeckCardEntry[];
}

export interface DeckListViewProps {
  groups: DeckListGroup[];
  cardIndex: DeckCardIndex;
  isMobile: boolean;
  isOwner: boolean;
  koCtx: KoDimmingContext | null;
  koCharacterIds: Set<string>;
  reserveCharacterId: string | null;
  characterEntries: ReserveCharacterEntry[];
  canSimulateKo: boolean;
  selectedInstanceId: string | null;
  onSelectCard: (catalogCard: CatalogCard, catalogType: CatalogType, instanceId: string) => void;
  onToggleKo: (cardId: string) => void;
  onSelectReserve: (cardId: string) => void;
  onDeselectReserve: () => void;
  onRemoveInstance: (instanceId: string) => void;
}

function attackIconPath(iconType: AttackIconType): string {
  switch (iconType) {
    case 'Energy':
      return STAT_ICON_PATHS.energy;
    case 'Combat':
      return STAT_ICON_PATHS.combat;
    case 'Brute Force':
      return STAT_ICON_PATHS.brute_force;
    case 'Intelligence':
      return STAT_ICON_PATHS.intelligence;
    case 'Any-Power':
      return STAT_ICON_PATHS['Any-Power'];
    default:
      return '';
  }
}

function DeckListAttackIcons({ iconTypes }: { iconTypes: AttackIconType[] }) {
  const { assetUrl } = useImageAssets();
  if (iconTypes.length === 0) return null;
  return (
    <span className="deck-editor__list-icons" aria-hidden="true">
      {iconTypes.map((iconType) => {
        const src = attackIconPath(iconType);
        if (!src) return null;
        return (
          <img
            key={iconType}
            className="deck-editor__list-icon"
            src={assetUrl(src)}
            alt=""
            width={18}
            height={18}
          />
        );
      })}
    </span>
  );
}

function DeckListRowView({
  row,
  isOwner,
  koCtx,
  koCharacterIds,
  reserveCharacterId,
  characterEntries,
  canSimulateKo,
  selectedInstanceId,
  onSelectCard,
  onToggleKo,
  onSelectReserve,
  onDeselectReserve,
  onRemoveInstance,
}: {
  row: DeckListRow;
  isOwner: boolean;
  koCtx: KoDimmingContext | null;
  koCharacterIds: Set<string>;
  reserveCharacterId: string | null;
  characterEntries: ReserveCharacterEntry[];
  canSimulateKo: boolean;
  selectedInstanceId: string | null;
  onSelectCard: DeckListViewProps['onSelectCard'];
  onToggleKo: (cardId: string) => void;
  onSelectReserve: (cardId: string) => void;
  onDeselectReserve: () => void;
  onRemoveInstance: (instanceId: string) => void;
}) {
  const catalogType = catalogSlugForDeckType(row.type);
  const instanceId = row.instanceIds[0];
  const canOpenDetail = Boolean(row.catalogCard && catalogType && instanceId);
  const isSelected = Boolean(instanceId && selectedInstanceId === instanceId);
  const koDimmed =
    koCtx !== null && shouldDimDeckCard(row.representativeEntry, row.catalogCard, koCtx);

  const isCharacter = row.type === 'character';
  const reserveRowState: ReserveRowState | null = isCharacter
    ? computeReserveRowState(
        row.cardId,
        reserveCharacterId,
        characterEntries,
        !isOwner,
      )
    : null;
  const showKoOnCharacter = isCharacter && canSimulateKo;
  const showCharacterActions =
    isCharacter &&
    (showKoOnCharacter || (reserveRowState !== null && reserveSlotVisible(reserveRowState)));
  const showTrash = isOwner && row.instanceIds.length > 0;
  const showRowActions = showTrash || showCharacterActions;
  const removeInstanceId = showTrash
    ? row.instanceIds[row.instanceIds.length - 1]
    : undefined;

  return (
    <div
      className={`deck-editor__list-row${koDimmed ? ' deck-editor__list-row--ko-dimmed' : ''}${isSelected ? ' is-selected' : ''}`}
    >
      <button
        type="button"
        className="deck-editor__list-row-main"
        disabled={!canOpenDetail}
        aria-pressed={isSelected}
        aria-label={canOpenDetail ? `View ${row.label}` : row.label}
        onClick={() => {
          if (row.catalogCard && catalogType && instanceId) {
            onSelectCard(row.catalogCard, catalogType, instanceId);
          }
        }}
      >
        <span className="deck-editor__list-qty">{row.quantity}</span>
        <span className="deck-editor__list-name">
          {row.label}
          <DeckListAttackIcons iconTypes={row.iconTypes} />
        </span>
      </button>
      {showRowActions ? (
        <div className="deck-editor__list-row-actions">
          {reserveRowState && reserveSlotVisible(reserveRowState) ? (
            <ReserveCharacterButton
              state={reserveRowState}
              cardName={row.label}
              onSelect={() => onSelectReserve(row.cardId)}
              onDeselect={onDeselectReserve}
            />
          ) : null}
          {showKoOnCharacter ? (
            <KoToggleButton
              active={koCharacterIds.has(row.cardId)}
              onToggle={() => onToggleKo(row.cardId)}
              cardName={row.label}
            />
          ) : null}
          {showTrash && removeInstanceId ? (
            <button
              type="button"
              className="deck-editor__list-remove"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveInstance(removeInstanceId);
              }}
              aria-label={`Remove ${row.label}`}
            >
              <IconTrash />
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function DeckListSectionView({
  section,
  collapsed,
  onToggle,
  hideTitle,
  ...rowProps
}: {
  section: DeckListSectionInput;
  collapsed: boolean;
  onToggle: () => void;
  hideTitle?: boolean;
  cardIndex: DeckCardIndex;
  isOwner: boolean;
  koCtx: KoDimmingContext | null;
  koCharacterIds: Set<string>;
  reserveCharacterId: string | null;
  characterEntries: ReserveCharacterEntry[];
  canSimulateKo: boolean;
  selectedInstanceId: string | null;
  onSelectCard: DeckListViewProps['onSelectCard'];
  onToggleKo: (cardId: string) => void;
  onSelectReserve: (cardId: string) => void;
  onDeselectReserve: () => void;
  onRemoveInstance: (instanceId: string) => void;
}) {
  const cardCount = sectionCardCount(section);

  return (
    <section className="deck-editor__list-section" data-deck-list-type={section.key}>
      {!hideTitle ? (
        <button
          type="button"
          className={`deck-editor__list-section-header${collapsed ? ' is-collapsed' : ''}`}
          onClick={onToggle}
          aria-expanded={!collapsed}
        >
          <span className="deck-editor__list-section-title">{section.label}</span>
          <span className="deck-editor__list-section-count">
            {cardCount} {cardCount === 1 ? 'card' : 'cards'}
          </span>
          <span className="deck-editor__list-section-chevron" aria-hidden="true">
            ▼
          </span>
        </button>
      ) : null}
      {!collapsed || hideTitle ? (
        <div className="deck-editor__list-items">
          {section.characterGroups?.map((group) => (
            <div className="deck-editor__list-char-group" key={group.characterName}>
              <div className="deck-editor__list-char-group-header">
                {group.characterName}
                <span className="deck-editor__list-char-group-count">
                  ({group.rows.reduce((s, r) => s + r.quantity, 0)})
                </span>
              </div>
              {group.rows.map((row) => (
                <DeckListRowView key={`${row.type}:${row.cardId}`} row={row} {...rowProps} />
              ))}
            </div>
          ))}
          {section.rows.map((row) => (
            <DeckListRowView key={`${row.type}:${row.cardId}`} row={row} {...rowProps} />
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function DeckListView({
  groups,
  cardIndex,
  isMobile,
  isOwner,
  koCtx,
  koCharacterIds,
  reserveCharacterId,
  characterEntries,
  canSimulateKo,
  selectedInstanceId,
  onSelectCard,
  onToggleKo,
  onSelectReserve,
  onDeselectReserve,
  onRemoveInstance,
}: DeckListViewProps) {
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(() => new Set());

  const sections = useMemo(
    () =>
      groups.map(({ meta, entries }) =>
        buildDeckListSection(meta.type, meta.label, meta.deckType, entries, cardIndex),
      ),
    [groups, cardIndex],
  );

  const [leftColumn, rightColumn] = useMemo(() => {
    if (isMobile || sections.length === 0) return [sections, [] as DeckListSectionInput[]];
    return balanceSectionsIntoColumns(sections, sectionRowCount);
  }, [sections, isMobile]);

  const hideSectionTitle = isMobile && groups.length === 1;

  const toggleSection = (key: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const rowProps = {
    cardIndex,
    isOwner,
    koCtx,
    koCharacterIds,
    reserveCharacterId,
    characterEntries,
    canSimulateKo,
    selectedInstanceId,
    onSelectCard,
    onToggleKo,
    onSelectReserve,
    onDeselectReserve,
    onRemoveInstance,
  };

  const renderSection = (section: DeckListSectionInput) => (
    <DeckListSectionView
      key={section.key}
      section={section}
      collapsed={collapsedSections.has(section.key)}
      onToggle={() => toggleSection(section.key)}
      hideTitle={hideSectionTitle}
      {...rowProps}
    />
  );

  if (isMobile) {
    return <div className="deck-editor__list">{sections.map(renderSection)}</div>;
  }

  return (
    <div className="deck-editor__list">
      <div className="deck-editor__list-columns">
        <div className="deck-editor__list-column">{leftColumn.map(renderSection)}</div>
        <div className="deck-editor__list-column">{rightColumn.map(renderSection)}</div>
      </div>
    </div>
  );
}
