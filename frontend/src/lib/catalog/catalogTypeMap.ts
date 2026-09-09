/**
 * Single source of truth for card-type mapping across the three vocabularies:
 *  - catalog slug   : `/api/v1/catalog/<slug>` path + tab identity
 *  - deck cardType  : hyphenated, used by deck APIs
 *  - collection type: underscored, used by collection APIs
 * plus user-facing labels and display helpers.
 */
import type {
  CatalogType,
  DeckCardType,
  CollectionCardType,
  CatalogCard,
} from '../api/types';
import { compareSetThenSetNumber, parseSetNumber } from './catalogSetSort';
import { isFoilCard } from './foilCatalog';

export const ADD_CARDS_ANY_CHARACTER_SPECIALS_TAB = 'any-character-specials' as const;

export type AddCardsVirtualTab = typeof ADD_CARDS_ANY_CHARACTER_SPECIALS_TAB;

/** Per-type catalog tab, All list, character Stacks tab, or Add Cards-only virtual tab. */
export type CatalogTabSelection = CatalogType | 'all' | 'stacks' | AddCardsVirtualTab;

/**
 * Card Database / Collection tab selection: per-type tab or the All list.
 * These views never expose the Add Cards "Stacks" tab, so they exclude `'stacks'`.
 */
export type DbvTabSelection = CatalogType | 'all';

export interface CatalogTypeMeta {
  type: CatalogType;
  label: string;
  /** Short label for compact UIs (chips/tabs). */
  shortLabel: string;
  /** Ultra-compact label for narrow scan columns (Collection All mobile). */
  compactLabel: string;
  deckType: DeckCardType;
  collectionType: CollectionCardType;
}

export const CATALOG_TYPES: CatalogTypeMeta[] = [
  { type: 'characters', label: 'Characters', shortLabel: 'Characters', compactLabel: 'Chr', deckType: 'character', collectionType: 'character' },
  { type: 'special-cards', label: 'Special Cards', shortLabel: 'Special', compactLabel: 'Spc', deckType: 'special', collectionType: 'special' },
  { type: 'power-cards', label: 'Power Cards', shortLabel: 'Power', compactLabel: 'Pow', deckType: 'power', collectionType: 'power' },
  { type: 'locations', label: 'Locations', shortLabel: 'Locations', compactLabel: 'Loc', deckType: 'location', collectionType: 'location' },
  { type: 'battlegrounds', label: 'Battlegrounds', shortLabel: 'Battlegrounds', compactLabel: 'Btg', deckType: 'battleground', collectionType: 'battleground' },
  { type: 'missions', label: 'Missions', shortLabel: 'Missions', compactLabel: 'Mis', deckType: 'mission', collectionType: 'mission' },
  { type: 'events', label: 'Events', shortLabel: 'Events', compactLabel: 'Ev', deckType: 'event', collectionType: 'event' },
  { type: 'aspects', label: 'Aspects', shortLabel: 'Aspects', compactLabel: 'Asp', deckType: 'aspect', collectionType: 'aspect' },
  { type: 'advanced-universe', label: 'Universe: Advanced', shortLabel: 'Advanced', compactLabel: 'Adv', deckType: 'advanced-universe', collectionType: 'advanced_universe' },
  { type: 'teamwork', label: 'Universe: Teamwork', shortLabel: 'Teamwork', compactLabel: 'Tmw', deckType: 'teamwork', collectionType: 'teamwork' },
  { type: 'ally-universe', label: 'Universe: Ally', shortLabel: 'Ally', compactLabel: 'Aly', deckType: 'ally-universe', collectionType: 'ally_universe' },
  { type: 'training', label: 'Universe: Training', shortLabel: 'Training', compactLabel: 'Trn', deckType: 'training', collectionType: 'training' },
  { type: 'basic-universe', label: 'Universe: Basic', shortLabel: 'Basic', compactLabel: 'Bas', deckType: 'basic-universe', collectionType: 'basic_universe' },
];

/** Card Database type tab order (All first, then CATALOG_TYPES) for UI and mobile swipe cycling. */
export const DBV_TAB_ORDER: readonly DbvTabSelection[] = [
  'all',
  ...CATALOG_TYPES.map((m) => m.type),
];

export interface AddCardsTabMeta {
  tab: CatalogTabSelection;
  shortLabel: string;
}

export const ADD_CARDS_TYPE_TABS: readonly AddCardsTabMeta[] = [
  { tab: 'all', shortLabel: 'All' },
  { tab: 'stacks', shortLabel: 'Stacks' },
  { tab: 'characters', shortLabel: 'Characters' },
  { tab: 'special-cards', shortLabel: 'Special' },
  { tab: ADD_CARDS_ANY_CHARACTER_SPECIALS_TAB, shortLabel: 'Any-Char' },
  ...CATALOG_TYPES.slice(2).map((meta) => ({ tab: meta.type, shortLabel: meta.shortLabel })),
];

/** Add Cards panel tab order (All, Stacks, then type/virtual tabs) for mobile swipe cycling. */
export const ADD_CARDS_TAB_ORDER: readonly CatalogTabSelection[] = ADD_CARDS_TYPE_TABS.map(
  (meta) => meta.tab,
);

export function addCardsCatalogTypeForTab(tab: CatalogTabSelection): CatalogType | null {
  if (tab === 'all' || tab === 'stacks') return null;
  if (tab === ADD_CARDS_ANY_CHARACTER_SPECIALS_TAB) return 'special-cards';
  return tab;
}

export const CATALOG_TYPE_BY_SLUG: Record<CatalogType, CatalogTypeMeta> = CATALOG_TYPES.reduce(
  (acc, meta) => {
    acc[meta.type] = meta;
    return acc;
  },
  {} as Record<CatalogType, CatalogTypeMeta>,
);

/** Type badge label for All-list rows (`shortLabel` or `compactLabel`). */
export function catalogTypeLabel(catalogType: CatalogType, compact = false): string {
  const meta = CATALOG_TYPE_BY_SLUG[catalogType];
  return compact ? meta.compactLabel : meta.shortLabel;
}

const DECK_TYPE_TO_META: Record<string, CatalogTypeMeta> = CATALOG_TYPES.reduce(
  (acc, meta) => {
    acc[meta.deckType] = meta;
    return acc;
  },
  {} as Record<string, CatalogTypeMeta>,
);

export function metaForDeckType(deckType: string): CatalogTypeMeta | undefined {
  return DECK_TYPE_TO_META[deckType];
}

export function labelForCatalogType(type: CatalogType): string {
  return CATALOG_TYPE_BY_SLUG[type]?.label ?? type;
}

/** Characters have explicit stats; this gates stat columns / panels. */
export function isStatCardType(type: CatalogType): boolean {
  return type === 'characters';
}

/** Character, location, Battleground, and event art use landscape tiles in the database grid. */
export function isLandscapeCatalogType(type: CatalogType): boolean {
  return type === 'characters' || type === 'locations' || type === 'battlegrounds' || type === 'events';
}

/**
 * Portrait DB tabs (5:7 tiles) use portrait preset thumbs (350×490 contain) in progressive load.
 * Landscape tabs (characters, locations, events) use landscape thumbs.
 */
export function catalogTypeUsesPortraitThumb(type: CatalogType): boolean {
  return !isLandscapeCatalogType(type);
}

/** Resolve the display name across the differing name fields. */
export function cardDisplayName(card: Partial<CatalogCard> | null | undefined): string {
  if (!card) return '';
  return (card.name as string) || (card.card_name as string) || '(Unnamed card)';
}

/** Linked character on special cards (`character` in the v1 API). */
export function cardCharacterName(card: Partial<CatalogCard> | null | undefined): string {
  if (!card) return '';
  return String((card.character as string) ?? (card.character_name as string) ?? '').trim();
}

/** Special / Advanced Universe list label with linked character prefix when present. */
export function cardLinkedDisplayName(
  card: Partial<CatalogCard> | null | undefined,
  catalogType?: CatalogType,
): string {
  const name = cardDisplayName(card);
  if (catalogType !== 'special-cards' && catalogType !== 'advanced-universe') return name;
  const character = cardCharacterName(card);
  if (!character || isAnyCharacterName(character)) return name;
  return `${character} - ${name}`;
}

export function isAnyCharacterName(value: string): boolean {
  return value.trim().toLowerCase() === 'any character';
}

export function compareCharacterNames(a: string, b: string): number {
  const aIsAny = isAnyCharacterName(a);
  const bIsAny = isAnyCharacterName(b);
  if (aIsAny !== bIsAny) return aIsAny ? 1 : -1;
  return a.localeCompare(b, undefined, { sensitivity: 'base' });
}

/** OverPower power type order (Energy → Combat → BF → Int → Multi → Any). */
const POWER_TYPE_SORT_KEYS = [
  'energy',
  'combat',
  'bruteforce',
  'intelligence',
  'multipower',
  'anypower',
] as const;

function normalizePowerTypeKey(powerType: string): string {
  return powerType.trim().toLowerCase().replace(/[\s-]+/g, '');
}

/** Sort index for power card types; unknown types sort last. */
export function powerTypeSortIndex(powerType: string): number {
  const key = normalizePowerTypeKey(powerType);
  const idx = POWER_TYPE_SORT_KEYS.indexOf(key as (typeof POWER_TYPE_SORT_KEYS)[number]);
  return idx >= 0 ? idx : POWER_TYPE_SORT_KEYS.length;
}

function comparePowerCatalogCardTiebreakers(a: CatalogCard, b: CatalogCard): number {
  const typeCmp =
    powerTypeSortIndex(String(a.power_type ?? '')) - powerTypeSortIndex(String(b.power_type ?? ''));
  if (typeCmp !== 0) return typeCmp;

  const valueA = Number(a.value ?? 0);
  const valueB = Number(b.value ?? 0);
  if (valueA !== valueB) return valueA - valueB;

  return cardDisplayName(a).localeCompare(cardDisplayName(b), undefined, { sensitivity: 'base' });
}

function compareAlphabetic(a: unknown, b: unknown): number {
  const aText = String(a ?? '').trim();
  const bText = String(b ?? '').trim();
  if (!aText && bText) return 1;
  if (aText && !bText) return -1;
  return aText.localeCompare(bText, undefined, { sensitivity: 'base' });
}

function firstNumericValue(value: unknown): number {
  const match = String(value ?? '').match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : Number.POSITIVE_INFINITY;
}

function comparePowerTypes(a: unknown, b: unknown): number {
  const aText = String(a ?? '').trim();
  const bText = String(b ?? '').trim();
  const indexCmp = powerTypeSortIndex(aText) - powerTypeSortIndex(bText);
  if (indexCmp !== 0) return indexCmp;
  return compareAlphabetic(aText, bText);
}

function compareTypeSequence(aTypes: unknown[], bTypes: unknown[]): number {
  const length = Math.max(aTypes.length, bTypes.length);
  for (let i = 0; i < length; i += 1) {
    const cmp = comparePowerTypes(aTypes[i], bTypes[i]);
    if (cmp !== 0) return cmp;
  }
  return 0;
}

function universeSortParts(card: CatalogCard, type: CatalogType): { types: unknown[]; value: number } {
  switch (type) {
    case 'power-cards':
      return { types: [card.power_type], value: firstNumericValue(card.value) };
    case 'ally-universe':
      return { types: [card.stat_type_to_use], value: firstNumericValue(card.stat_to_use) };
    case 'basic-universe':
      return { types: [card.type], value: firstNumericValue(card.value_to_use) };
    case 'training':
      return { types: [card.type_1, card.type_2], value: firstNumericValue(card.value_to_use) };
    case 'teamwork': {
      const match = String(card.to_use ?? '').trim().match(/(\d+)\s+(.+)/);
      return {
        types: [match?.[2] ?? card.power_type],
        value: match ? Number(match[1]) : firstNumericValue(card.value),
      };
    }
    default:
      return { types: [], value: Number.POSITIVE_INFINITY };
  }
}

const DBV_UNIVERSE_VALUE_TYPES = new Set<CatalogType>([
  'power-cards',
  'ally-universe',
  'basic-universe',
  'training',
  'teamwork',
]);

/**
 * Database type-grid sort when the set filter is "All Sets". Set and collector
 * number are deliberately ignored; the Database All tab and Collection use
 * separate checklist comparators.
 */
export function compareDbvAllSetsCatalogCards(
  a: CatalogCard,
  b: CatalogCard,
  type: CatalogType,
): number {
  if (DBV_UNIVERSE_VALUE_TYPES.has(type)) {
    const aParts = universeSortParts(a, type);
    const bParts = universeSortParts(b, type);
    const typeCmp = compareTypeSequence(aParts.types, bParts.types);
    if (typeCmp !== 0) return typeCmp;
    if (aParts.value !== bParts.value) return aParts.value - bParts.value;
  } else if (type === 'missions' || type === 'events') {
    const missionSetCmp = compareAlphabetic(a.mission_set, b.mission_set);
    if (missionSetCmp !== 0) return missionSetCmp;
  } else {
    let subjectA: unknown = cardDisplayName(a);
    let subjectB: unknown = cardDisplayName(b);

    if (type === 'special-cards' || type === 'advanced-universe') {
      subjectA = cardCharacterName(a);
      subjectB = cardCharacterName(b);
    } else if (type === 'aspects') {
      subjectA = a.location;
      subjectB = b.location;
    }

    const subjectCmp = compareAlphabetic(subjectA, subjectB);
    if (subjectCmp !== 0) return subjectCmp;
  }

  const nameCmp = compareAlphabetic(cardDisplayName(a), cardDisplayName(b));
  if (nameCmp !== 0) return nameCmp;

  // Character alternates share a display name. Keep their default/earliest
  // printing first by using the numeric collector number before the stable ID.
  if (type === 'characters') {
    const numberA = parseSetNumber(a);
    const numberB = parseSetNumber(b);
    if (numberA !== null && numberB !== null && numberA !== numberB) return numberA - numberB;
    if (numberA !== null && numberB === null) return -1;
    if (numberA === null && numberB !== null) return 1;
  }

  return compareAlphabetic(a.id, b.id);
}

/** Add-cards / DBV tiebreakers: Energy → Combat → BF → Int → Multi → Any, then value ascending. */
export function comparePowerCatalogCards(a: CatalogCard, b: CatalogCard): number {
  return comparePowerCatalogCardTiebreakers(a, b);
}

/** Deck editor power section: ascending value, then OP type order. */
export function compareDeckPowerCatalogCards(a: CatalogCard, b: CatalogCard): number {
  const valueA = Number(a.value ?? 0);
  const valueB = Number(b.value ?? 0);
  if (valueA !== valueB) return valueA - valueB;

  const typeCmp =
    powerTypeSortIndex(String(a.power_type ?? '')) - powerTypeSortIndex(String(b.power_type ?? ''));
  if (typeCmp !== 0) return typeCmp;

  return cardDisplayName(a).localeCompare(cardDisplayName(b), undefined, { sensitivity: 'base' });
}

/**
 * Card Database grid sort for a selected set. Character printings retain the
 * same name/collector grouping as All Sets so alternate art stays beside its
 * default; Power Cards always use type/value order.
 */
export function compareDbvCatalogCards(a: CatalogCard, b: CatalogCard, type: CatalogType): number {
  if (type === 'characters') {
    return compareDbvAllSetsCatalogCards(a, b, type);
  }

  if (type === 'power-cards') {
    return comparePowerCatalogCardTiebreakers(a, b);
  }

  const setNumCmp = compareSetThenSetNumber(a, b);
  if (setNumCmp !== 0) return setNumCmp;

  if (type === 'special-cards') {
    const charCmp = compareCharacterNames(cardCharacterName(a), cardCharacterName(b));
    if (charCmp !== 0) return charCmp;
  }

  return cardDisplayName(a).localeCompare(cardDisplayName(b), undefined, { sensitivity: 'base' });
}

/** Default catalog sort for deck-editor add-cards (not DBV grid). */
export function compareCatalogCards(a: CatalogCard, b: CatalogCard, type: CatalogType): number {
  if (type === 'special-cards') {
    const setCmp = String(a.set ?? '').localeCompare(String(b.set ?? ''), undefined, { sensitivity: 'base' });
    if (setCmp !== 0) return setCmp;

    const charCmp = compareCharacterNames(cardCharacterName(a), cardCharacterName(b));
    if (charCmp !== 0) return charCmp;

    return cardDisplayName(a).localeCompare(cardDisplayName(b), undefined, { sensitivity: 'base' });
  }

  if (type === 'power-cards') {
    return comparePowerCatalogCards(a, b);
  }

  return cardDisplayName(a).localeCompare(cardDisplayName(b), undefined, { sensitivity: 'base' });
}

export interface StatLine {
  energy: number;
  combat: number;
  bruteForce: number;
  intelligence: number;
  total: number;
}

export function cardStats(card: Partial<CatalogCard> | null | undefined): StatLine | null {
  if (!card) return null;
  const has =
    card.energy !== undefined ||
    card.combat !== undefined ||
    card.brute_force !== undefined ||
    card.intelligence !== undefined;
  if (!has) return null;
  const energy = Number(card.energy ?? 0);
  const combat = Number(card.combat ?? 0);
  const bruteForce = Number(card.brute_force ?? 0);
  const intelligence = Number(card.intelligence ?? 0);
  return {
    energy,
    combat,
    bruteForce,
    intelligence,
    total: energy + combat + bruteForce + intelligence,
  };
}

/** Best-effort inherent/ability text shown in lists + detail. */
export function cardAbilityText(card: Partial<CatalogCard> | null | undefined): string {
  if (!card) return '';
  return (
    (card.special_abilities as string) ||
    (card.special_ability as string) ||
    (card.card_effect as string) ||
    (card.game_effect as string) ||
    (card.card_text as string) ||
    ''
  );
}

/** Fields scanned by catalog search bars (name, character, mission set, text, abilities). */
const DBV_SEARCH_TEXT_FIELDS: (keyof CatalogCard)[] = [
  'mission_set',
  'special_abilities',
  'special_ability',
  'card_effect',
  'card_text',
  'card_description',
  'aspect_description',
  'game_effect',
  'stat_to_use',
  'stat_type_to_use',
  'attack_type',
];

function cardSearchTextFields(card: Partial<CatalogCard>): string[] {
  return DBV_SEARCH_TEXT_FIELDS.map((key) => String(card[key] ?? '').trim()).filter(Boolean);
}

/** Lowercase haystack for catalog search across name, character, mission set, and card text/abilities. */
export function cardSearchHaystack(card: Partial<CatalogCard> | null | undefined): string {
  if (!card) return '';
  return [
    cardDisplayName(card),
    cardCharacterName(card),
    ...cardSearchTextFields(card),
  ]
    .join(' ')
    .toLowerCase();
}

/** Split search query into foil keyword flag and remaining text tokens. */
export function parseSearchTokens(query: string): { textQuery: string; requireFoil: boolean } {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const requireFoil = tokens.includes('foil');
  const textQuery = tokens.filter((t) => t !== 'foil').join(' ');
  return { textQuery, requireFoil };
}

export function cardMatchesSearchQuery(
  card: Partial<CatalogCard> | null | undefined,
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const { textQuery, requireFoil } = parseSearchTokens(q);
  if (requireFoil && !isFoilCard(card)) return false;
  if (!textQuery) return true;
  return cardSearchHaystack(card).includes(textQuery);
}
