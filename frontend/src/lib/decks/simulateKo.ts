import type { CatalogCard, DeckCardEntry } from '../api/types';
import { specialCardMatchesCharacter } from '../catalog/characterStacks';
import type { CharacterStatRow } from '../deck-usability/types';
import {
  effectiveCharacterStats,
  hasAlphaIntelligencePowerCardAllowance,
  specialLinkedCharacterName,
  statForPowerType,
  trainingTypeAtOrBelowCap,
} from '../deck-usability/deckUsabilityUtils';
import {
  type DeckCardIndex,
  type DeckCardLookup,
  resolveDeckCatalogCard,
} from './deckCardCatalog';

export type { DeckCardIndex } from './deckCardCatalog';

export interface ActiveCharacter {
  cardId: string;
  name: string;
  energy: number;
  combat: number;
  brute_force: number;
  intelligence: number;
}

export interface KoTeamStats {
  maxEnergy: number;
  maxCombat: number;
  maxBruteForce: number;
  maxIntelligence: number;
}

export interface KoDimmingContext {
  koCharacterIds: Set<string>;
  activeCharacters: ActiveCharacter[];
  activeCharacterNames: string[];
  startingCharacterNames: string[];
  teamStats: KoTeamStats;
  shouldDimTeamworkAndAllyForSingleCharacter: boolean;
  deckCards: DeckCardEntry[];
  cardIndex: Map<string, CatalogCard>;
}

function resolveCatalogCard(
  entry: DeckCardLookup,
  cardIndex: DeckCardIndex,
): CatalogCard | undefined {
  return resolveDeckCatalogCard(entry, cardIndex);
}

function characterStatRow(card: CatalogCard, cardId: string): ActiveCharacter {
  return {
    cardId,
    name: String(card.name ?? card.card_name ?? 'Unknown'),
    energy: Number(card.energy) || 0,
    combat: Number(card.combat) || 0,
    brute_force: Number(card.brute_force) || 0,
    intelligence: Number(card.intelligence) || 0,
  };
}

function getActiveCharacters(
  deckCards: DeckCardEntry[],
  cardIndex: DeckCardIndex,
  koCharacterIds: Set<string>,
): ActiveCharacter[] {
  const activeCharacters: ActiveCharacter[] = [];

  for (const card of deckCards) {
    if (card.type !== 'character' || koCharacterIds.has(card.cardId)) continue;
    const catalogCard = resolveCatalogCard(card, cardIndex);
    if (!catalogCard) continue;
    activeCharacters.push(characterStatRow(catalogCard, card.cardId));
  }

  return activeCharacters;
}

function sumOfTwoHighestStats(
  char: Pick<CharacterStatRow, 'energy' | 'combat' | 'brute_force' | 'intelligence'>,
): number {
  const stats = [char.energy, char.combat, char.brute_force, char.intelligence].sort(
    (a, b) => b - a,
  );
  return (stats[0] || 0) + (stats[1] || 0);
}

function effectiveStatsForPowerTraining(
  char: ActiveCharacter,
  startingCharacterNames: string[],
): CharacterStatRow {
  return effectiveCharacterStats(char, startingCharacterNames);
}

function maxTeamStatForTeamwork(teamStats: KoTeamStats, requiredType: string): number {
  if (requiredType === 'Any-Power') {
    return Math.max(
      teamStats.maxEnergy,
      teamStats.maxCombat,
      teamStats.maxBruteForce,
      teamStats.maxIntelligence,
    );
  }
  switch (requiredType) {
    case 'Energy':
      return teamStats.maxEnergy;
    case 'Combat':
      return teamStats.maxCombat;
    case 'Brute Force':
      return teamStats.maxBruteForce;
    case 'Intelligence':
      return teamStats.maxIntelligence;
    default:
      return 0;
  }
}

export function toggleKoCharacterId(ids: Set<string>, cardId: string): Set<string> {
  const next = new Set(ids);
  if (next.has(cardId)) {
    next.delete(cardId);
  } else {
    next.add(cardId);
  }
  return next;
}

export function pruneKoCharacterIds(
  ids: Set<string>,
  deckCards: DeckCardEntry[],
): Set<string> {
  const characterIds = new Set(
    deckCards.filter((c) => c.type === 'character').map((c) => c.cardId),
  );
  const next = new Set<string>();
  ids.forEach((id) => {
    if (characterIds.has(id)) next.add(id);
  });
  return next;
}

export function isKoCharacter(koCharacterIds: Set<string>, cardId: string): boolean {
  return koCharacterIds.has(cardId);
}

export function buildKoDimmingContext(
  deckCards: DeckCardEntry[],
  cardIndex: DeckCardIndex,
  koCharacterIds: Set<string>,
): KoDimmingContext {
  const startingCharacterNames = deckCards
    .filter((card) => card.type === 'character')
    .flatMap((card) => {
      const catalogCard = resolveCatalogCard(card, cardIndex);
      return catalogCard
        ? [String(catalogCard.name ?? catalogCard.card_name ?? 'Unknown')]
        : [];
    });
  const activeCharacters = getActiveCharacters(deckCards, cardIndex, koCharacterIds);
  const activeCharacterNames = activeCharacters.map((char) => char.name);
  const teamStats = calculateActiveTeamStatsFromCharacters(
    activeCharacters,
    startingCharacterNames,
  );
  const totalCharacters = deckCards.filter((card) => card.type === 'character').length;
  const hasKOdCharacters = koCharacterIds.size > 0;
  const hasOnlyOneActiveCharacter = activeCharacters.length === 1;
  const shouldDimTeamworkAndAllyForSingleCharacter =
    totalCharacters > 1 && hasKOdCharacters && hasOnlyOneActiveCharacter;

  return {
    koCharacterIds,
    activeCharacters,
    activeCharacterNames,
    startingCharacterNames,
    teamStats,
    shouldDimTeamworkAndAllyForSingleCharacter,
    deckCards,
    cardIndex,
  };
}

function calculateActiveTeamStatsFromCharacters(
  activeCharacters: ActiveCharacter[],
  startingCharacterNames: string[],
): KoTeamStats {
  let maxEnergy = 0;
  let maxCombat = 0;
  let maxBruteForce = 0;
  let maxIntelligence = 0;

  for (const char of activeCharacters) {
    const eff = effectiveStatsForPowerTraining(char, startingCharacterNames);
    if (eff.energy > maxEnergy) maxEnergy = eff.energy;
    if (eff.combat > maxCombat) maxCombat = eff.combat;
    if (eff.brute_force > maxBruteForce) maxBruteForce = eff.brute_force;
    if (eff.intelligence > maxIntelligence) maxIntelligence = eff.intelligence;
  }

  return { maxEnergy, maxCombat, maxBruteForce, maxIntelligence };
}

export function calculateActiveTeamStats(ctx: KoDimmingContext): {
  energy: number;
  combat: number;
  bruteForce: number;
  intelligence: number;
} {
  return {
    energy: ctx.teamStats.maxEnergy,
    combat: ctx.teamStats.maxCombat,
    bruteForce: ctx.teamStats.maxBruteForce,
    intelligence: ctx.teamStats.maxIntelligence,
  };
}

function shouldDimNamedCharacterCard(ctx: KoDimmingContext, characterName: string): boolean {
  if (!characterName || characterName === 'Any Character') {
    return false;
  }

  const { deckCards, cardIndex, activeCharacterNames, koCharacterIds } = ctx;
  const belongsToKOdCharacter = deckCards.some((deckCard) => {
    if (deckCard.type !== 'character' || !koCharacterIds.has(deckCard.cardId)) return false;
    const charData = resolveCatalogCard(deckCard, cardIndex);
    const charName = charData ? String(charData.name ?? charData.card_name ?? '') : '';
    return charName === characterName;
  });

  return belongsToKOdCharacter && !activeCharacterNames.includes(characterName);
}

function shouldDimSpecialCard(ctx: KoDimmingContext, cardData: CatalogCard): boolean {
  const belongsToKOdCharacter = ctx.deckCards.some((deckCard) => {
    if (deckCard.type !== 'character' || !ctx.koCharacterIds.has(deckCard.cardId)) {
      return false;
    }
    const character = resolveCatalogCard(deckCard, ctx.cardIndex);
    const characterName = character
      ? String(character.name ?? character.card_name ?? '')
      : '';
    return specialCardMatchesCharacter(cardData, characterName);
  });
  const belongsToActiveCharacter = ctx.activeCharacterNames.some((characterName) =>
    specialCardMatchesCharacter(cardData, characterName),
  );

  return belongsToKOdCharacter && !belongsToActiveCharacter;
}

function dimTeamworkCard(cardData: CatalogCard, ctx: KoDimmingContext): boolean {
  if (ctx.shouldDimTeamworkAndAllyForSingleCharacter) {
    return true;
  }

  const toUse = String(cardData.to_use ?? '');
  const toUseMatch = toUse.match(/(\d+)\s+(Energy|Combat|Brute Force|Intelligence|Any-Power)/);
  if (!toUseMatch) return false;

  const requiredValue = parseInt(toUseMatch[1], 10);
  const requiredType = toUseMatch[2];
  const maxStat = maxTeamStatForTeamwork(ctx.teamStats, requiredType);
  return maxStat < requiredValue;
}

function dimAllyCard(cardData: CatalogCard, ctx: KoDimmingContext): boolean {
  if (ctx.shouldDimTeamworkAndAllyForSingleCharacter) {
    return true;
  }

  const statToUse = String(cardData.stat_to_use ?? '');
  const statTypeToUse = String(cardData.stat_type_to_use ?? '');
  const valueMatch = statToUse.match(/(\d+)\s+or\s+(less|higher)/i);
  if (!valueMatch || !statTypeToUse) return false;

  const requiredValue = parseInt(valueMatch[1], 10);
  const isLessThan = valueMatch[2].toLowerCase() === 'less';

  const canUse = ctx.activeCharacters.some((char) => {
    const characterStat = statForPowerType(
      effectiveStatsForPowerTraining(char, ctx.startingCharacterNames),
      statTypeToUse,
    );
    return isLessThan ? characterStat <= requiredValue : characterStat >= requiredValue;
  });

  return !canUse;
}

function dimTrainingCard(cardData: CatalogCard, ctx: KoDimmingContext): boolean {
  const trainingType1 = String(cardData.type_1 ?? '');
  const trainingType2 = String(cardData.type_2 ?? '');
  const trainingValue = parseInt(String(cardData.value_to_use ?? ''), 10) || 0;
  if (!trainingType1 || !trainingType2 || trainingValue <= 0) return false;

  const canUse = ctx.activeCharacters.some((char) => {
    const eff = effectiveStatsForPowerTraining(char, ctx.startingCharacterNames);
    return (
      trainingTypeAtOrBelowCap(eff, trainingType1, trainingValue) ||
      trainingTypeAtOrBelowCap(eff, trainingType2, trainingValue)
    );
  });

  return !canUse;
}

function dimBasicUniverseCard(cardData: CatalogCard, ctx: KoDimmingContext): boolean {
  const buType = String(cardData.type ?? '');
  const buValueMatch = String(cardData.value_to_use ?? '').match(/(\d+)\s*or\s*greater/i);
  const buRequiredValue = buValueMatch ? parseInt(buValueMatch[1], 10) : 0;
  if (!buType || buRequiredValue <= 0) return false;

  const canUse = ctx.activeCharacters.some((char) => {
    const characterStat = statForPowerType(
      effectiveStatsForPowerTraining(char, ctx.startingCharacterNames),
      buType,
    );
    return characterStat >= buRequiredValue;
  });

  return !canUse;
}

function dimPowerCard(cardData: CatalogCard, ctx: KoDimmingContext): boolean {
  const powerValue = parseInt(String(cardData.value ?? ''), 10) || 0;
  const powerType = String(cardData.power_type ?? '');
  if (!powerType || powerValue <= 0) return false;

  const canUse = ctx.activeCharacters.some((char) => {
    if (
      hasAlphaIntelligencePowerCardAllowance(
        char.name,
        ctx.startingCharacterNames,
        powerType,
        powerValue,
      )
    ) {
      return true;
    }

    const eff = effectiveStatsForPowerTraining(char, ctx.startingCharacterNames);
    let characterStat = 0;

    switch (powerType) {
      case 'Energy':
        characterStat = eff.energy;
        break;
      case 'Combat':
        characterStat = eff.combat;
        break;
      case 'Brute Force':
        characterStat = eff.brute_force;
        break;
      case 'Intelligence':
        characterStat = eff.intelligence;
        break;
      case 'Any-Power':
        characterStat = Math.max(eff.energy, eff.combat, eff.brute_force, eff.intelligence);
        break;
      case 'Multi-Power':
      case 'Multi Power':
        characterStat = sumOfTwoHighestStats(eff);
        break;
      default:
        break;
    }

    return characterStat >= powerValue;
  });

  return !canUse;
}

function normalizeKoDeckType(deckType: string): string {
  if (deckType === 'advanced_universe') return 'advanced-universe';
  if (deckType === 'basic_universe') return 'basic-universe';
  if (deckType === 'ally_universe') return 'ally-universe';
  return deckType;
}

function shouldDimNonCharacterByType(
  deckType: string,
  cardData: CatalogCard,
  ctx: KoDimmingContext,
): boolean {
  const normalized = normalizeKoDeckType(deckType);

  switch (normalized) {
    case 'special': {
      const characterName = specialLinkedCharacterName(cardData);
      const characters = Array.isArray(cardData.characters)
        ? (cardData.characters as string[])
        : [];
      const isAnyCharacter =
        characterName === 'Any Character' || characters.includes('Any Character');
      if (isAnyCharacter || !characterName) return false;
      return shouldDimSpecialCard(ctx, cardData);
    }
    case 'advanced-universe': {
      const auCharacterName = String(cardData.character ?? '').trim();
      if (!auCharacterName || auCharacterName === 'Any Character') return false;
      return shouldDimNamedCharacterCard(ctx, auCharacterName);
    }
    case 'teamwork':
      return dimTeamworkCard(cardData, ctx);
    case 'ally-universe':
      return dimAllyCard(cardData, ctx);
    case 'training':
      return dimTrainingCard(cardData, ctx);
    case 'basic-universe':
      return dimBasicUniverseCard(cardData, ctx);
    case 'power':
      return dimPowerCard(cardData, ctx);
    default:
      return false;
  }
}

export function shouldDimDeckCard(
  entry: DeckCardEntry,
  catalogCard: CatalogCard | undefined,
  ctx: KoDimmingContext,
): boolean {
  if (ctx.koCharacterIds.size === 0) return false;
  if (!catalogCard) return false;

  if (entry.type === 'character') {
    return ctx.koCharacterIds.has(entry.cardId);
  }

  return shouldDimNonCharacterByType(entry.type, catalogCard, ctx);
}
