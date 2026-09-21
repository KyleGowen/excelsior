import type { CatalogCard, DeckCardEntry, UserRole } from '../api/types';
import { cardDisplayName } from '../catalog/catalogTypeMap';
import { specialCardMatchesCharacter } from '../catalog/characterStacks';
import { variantGroupKey } from '../catalog/defaultCatalogCards';
import {
  catalogSlugForDeckType,
  normalizeDeckCardType,
  resolveDeckCatalogCard,
  type DeckCardIndex,
} from './deckCardCatalog';

export interface DrawHandAnalysis {
  ventureTotal: number;
  /** Copies that normal discard rules would not allow the player to keep. */
  duplicateCount: number;
  /** Every card in an over-limit duplicate group, including the one(s) that may be kept. */
  duplicateCardIndexes: Set<number>;
}

interface IndexedHandCard {
  index: number;
  entry: DeckCardEntry;
  catalogCard: CatalogCard | undefined;
}

const NAMED_SPECIAL_DUPLICATE_ALLOWANCE =
  /may\s+have\s+(\d+)\s+duplicate(?:s)?\s+["“]([^"”]+)["”]\s+special/gi;
const UNLIMITED_NAMED_SPECIAL_DUPLICATE_ALLOWANCE =
  /may\s+have\s+duplicate(?:s)?\s+["“]([^"”]+)["”]\s+special/gi;
const SELF_SPECIAL_DUPLICATE_ALLOWANCE =
  /may\s+keep\s+(\d+)\s+duplicate(?:s)?\s+of\s+this\s+special/i;
const SPECIAL_ACTS_AS_LEVEL = /\bacts\s+as\s+(?:a\s+)?level\s+(\d+)\b/i;
const EXCLUDED_FROM_VENTURE_TOTAL =
  /\bdoes\s+not\s+count\s+(?:to|toward)\s+(?:the\s+)?venture\s+total\b/i;

function normalizeText(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function optionalNonNegativeNumber(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value >= 0 ? value : null;
  }

  const match = String(value ?? '').match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function firstNonNegativeNumber(value: unknown): number {
  return optionalNonNegativeNumber(value) ?? 0;
}

function specialVentureValue(card: CatalogCard): number {
  const catalogValue = optionalNonNegativeNumber(card.value);
  if (catalogValue !== null) return catalogValue;

  const effect = String(card.card_effect ?? '');
  if (EXCLUDED_FROM_VENTURE_TOTAL.test(effect)) return 0;

  const printedLevel = effect.match(SPECIAL_ACTS_AS_LEVEL)?.[1];
  return firstNonNegativeNumber(printedLevel);
}

/**
 * Potential Venture contribution printed on a card, without resolving playability or combos.
 * Basic and Training Universe bonuses modify an action but do not add damage or Venture
 * unless another card explicitly creates an exception in the live battle state.
 */
export function drawHandVentureValue(
  entry: DeckCardEntry,
  cardIndex: DeckCardIndex,
): number {
  const catalogCard = resolveDeckCatalogCard(entry, cardIndex);
  if (!catalogCard) return 0;

  const type = normalizeDeckCardType(entry.type);
  if (type === 'special') return specialVentureValue(catalogCard);
  if (type === 'teamwork') return firstNonNegativeNumber(catalogCard.acts_as);
  if (type === 'ally-universe') return firstNonNegativeNumber(catalogCard.attack_value);
  if (type === 'training' || type === 'basic-universe') return 0;

  return firstNonNegativeNumber(catalogCard.value);
}

function duplicateGroupKey(entry: DeckCardEntry, catalogCard?: CatalogCard): string {
  const type = normalizeDeckCardType(entry.type);

  // During the Discard Phase, Power cards duplicate by numerical value even
  // when their Power Type icons differ.
  if (type === 'power' && catalogCard) {
    return `power:${firstNonNegativeNumber(catalogCard.value)}`;
  }

  const catalogType = catalogSlugForDeckType(type);
  const logicalCardKey =
    catalogCard && catalogType ? variantGroupKey(catalogCard, catalogType) : null;
  return `${type}:${normalizeText(logicalCardKey ?? entry.cardId)}`;
}

function characterCards(deckCards: DeckCardEntry[], cardIndex: DeckCardIndex): CatalogCard[] {
  const seen = new Set<string>();
  const characters: CatalogCard[] = [];

  for (const entry of deckCards) {
    if (normalizeDeckCardType(entry.type) !== 'character') continue;
    const character = resolveDeckCatalogCard(entry, cardIndex);
    if (!character) continue;
    const characterName = normalizeText(cardDisplayName(character));
    if (!characterName || seen.has(characterName)) continue;
    seen.add(characterName);
    characters.push(character);
  }

  return characters;
}

function namedSpecialAllowance(
  special: CatalogCard,
  characters: CatalogCard[],
): number {
  const specialName = normalizeText(cardDisplayName(special));
  let allowance = 0;

  for (const character of characters) {
    const characterName = cardDisplayName(character);
    if (!specialCardMatchesCharacter(special, characterName)) continue;

    const ability = String(character.special_abilities ?? '');
    NAMED_SPECIAL_DUPLICATE_ALLOWANCE.lastIndex = 0;
    for (const match of ability.matchAll(NAMED_SPECIAL_DUPLICATE_ALLOWANCE)) {
      if (normalizeText(match[2]) !== specialName) continue;
      allowance = Math.max(allowance, Number(match[1]) || 0);
    }

    UNLIMITED_NAMED_SPECIAL_DUPLICATE_ALLOWANCE.lastIndex = 0;
    for (const match of ability.matchAll(UNLIMITED_NAMED_SPECIAL_DUPLICATE_ALLOWANCE)) {
      if (normalizeText(match[1]) !== specialName) continue;
      return Number.POSITIVE_INFINITY;
    }
  }

  return allowance;
}

function specialCopiesAllowed(special: CatalogCard, characters: CatalogCard[]): number {
  const inherentAllowance = namedSpecialAllowance(special, characters);
  const selfAllowanceMatch = String(special.card_effect ?? '').match(
    SELF_SPECIAL_DUPLICATE_ALLOWANCE,
  );
  const selfAllowance = selfAllowanceMatch ? Number(selfAllowanceMatch[1]) || 0 : 0;
  return 1 + Math.max(inherentAllowance, selfAllowance);
}

function copiesAllowed(group: IndexedHandCard[], characters: CatalogCard[]): number {
  const representative = group[0];
  if (
    normalizeDeckCardType(representative.entry.type) === 'special' &&
    representative.catalogCard
  ) {
    return specialCopiesAllowed(representative.catalogCard, characters);
  }
  return 1;
}

/**
 * Apply normal hand-duplicate rules, including data-driven named-Special
 * allowances on starting characters (for example, Zeus / Thunderbolt).
 */
export function analyzeDrawnHand(
  drawnCards: DeckCardEntry[],
  deckCards: DeckCardEntry[],
  cardIndex: DeckCardIndex,
): DrawHandAnalysis {
  const groups = new Map<string, IndexedHandCard[]>();

  drawnCards.forEach((entry, index) => {
    const catalogCard = resolveDeckCatalogCard(entry, cardIndex);
    const key = duplicateGroupKey(entry, catalogCard);
    const group = groups.get(key) ?? [];
    group.push({ index, entry, catalogCard });
    groups.set(key, group);
  });

  const characters = characterCards(deckCards, cardIndex);
  const duplicateCardIndexes = new Set<number>();
  let duplicateCount = 0;
  let ventureTotal = 0;

  for (const group of groups.values()) {
    const allowed = copiesAllowed(group, characters);
    const keptCards = group.slice(0, allowed);
    ventureTotal += keptCards.reduce(
      (total, card) => total + drawHandVentureValue(card.entry, cardIndex),
      0,
    );

    if (group.length > allowed) {
      duplicateCount += group.length - allowed;
      group.forEach((card) => duplicateCardIndexes.add(card.index));
    }
  }

  return { ventureTotal, duplicateCount, duplicateCardIndexes };
}

/** Premium analysis gate: admins plus authenticated users with Supporter entitlement. */
export function canAccessDrawHandAnalysis(
  role: UserRole | null | undefined,
  isSupporter = false,
): boolean {
  return role === 'ADMIN' || (role === 'USER' && isSupporter);
}
