import type { CatalogCard, CatalogType } from '../api/types';
import { catalogTypeSupportsHideUnusables } from './catalogTypesWithUsability';
import {
  GLOBAL_DEFENSE_AGENCY_BATTLEGROUND_NAME,
  hasAlphaIntelligencePowerCardAllowance,
  isGdaAnyCharacterSpecial,
  isMultiPowerPowerCardType,
  normalizeAngryMobVariant,
  specialLinkedCharacterName,
  statForPowerType,
  statForPowerTypeWithSpecialCases,
  teamHasSpecialCharacter,
  trainingTypeAtOrBelowCap,
} from './deckUsabilityUtils';
import type { DeckUsabilityContext } from './types';

function isSpecialCardUsable(card: CatalogCard, ctx: DeckUsabilityContext): boolean {
  const characterName = specialLinkedCharacterName(card);
  const extraChars = Array.isArray(card.characters)
    ? (card.characters as string[])
    : [];

  if (!characterName || characterName === 'Any Character') {
    if (isGdaAnyCharacterSpecial(card)) {
      return (
        ctx.battlegroundName === GLOBAL_DEFENSE_AGENCY_BATTLEGROUND_NAME
        && !ctx.hasNonGdaAnyCharacterSpecial
      );
    }
    if (characterName === 'Any Character' && ctx.hasGdaAnyCharacterSpecial) return false;
    return true;
  }

  if (characterName.startsWith('Angry Mob')) {
    if (ctx.angryMobCharacterNames.length === 0) return false;

    const hasVariantQualifier =
      characterName.includes(':') || characterName.includes(' - ');
    if (!hasVariantQualifier) return true;

    const separator = characterName.includes(':') ? ':' : ' - ';
    const specialVariant = characterName.split(separator)[1]?.trim() ?? '';
    const normalizedSpecialVariant = normalizeAngryMobVariant(specialVariant);

    return ctx.angryMobCharacterNames.some((charName) => {
      const variantMatch = charName.match(/\(([^)]+)\)/);
      if (!variantMatch) return false;
      return normalizeAngryMobVariant(variantMatch[1]) === normalizedSpecialVariant;
    });
  }

  return teamHasSpecialCharacter(ctx.characterNames, characterName, extraChars);
}

function isAdvancedUniverseUsable(card: CatalogCard, ctx: DeckUsabilityContext): boolean {
  const auChar = String(card.character ?? '').trim();
  if (!auChar || auChar === 'Any Character') return true;
  return ctx.characterNames.includes(auChar);
}

function isPowerCardUsable(card: CatalogCard, ctx: DeckUsabilityContext): boolean {
  const powerType = String(card.power_type ?? '');
  const value = card.value as number | undefined;

  if (!powerType || value == null) return true;
  if (isMultiPowerPowerCardType(powerType)) return true;

  return ctx.characterStats.some(
    (char) => (
      statForPowerTypeWithSpecialCases(char, powerType, ctx.characterNames) >= value
      || hasAlphaIntelligencePowerCardAllowance(
        char.name,
        ctx.characterNames,
        powerType,
        value,
      )
    ),
  );
}

function isTeamworkUsable(card: CatalogCard, ctx: DeckUsabilityContext): boolean {
  const toUse = String(card.to_use ?? '');
  const toUseMatch = toUse.match(/(\d+)\s+(Energy|Combat|Brute Force|Intelligence|Any-Power)/);
  if (!toUseMatch) return true;

  const requiredValue = parseInt(toUseMatch[1], 10);
  const powerType = toUseMatch[2];

  return ctx.characterStats.some((char) => statForPowerType(char, powerType) >= requiredValue);
}

function isBasicUniverseUsable(card: CatalogCard, ctx: DeckUsabilityContext): boolean {
  if (ctx.characterNames.includes('Glenn')) return true;

  const buType = String(card.type ?? card.basic_skill_type ?? '');
  const buMatch = String(card.value_to_use ?? '').match(/(\d+)\s*or\s*greater/i);
  const requiredValue = buMatch ? parseInt(buMatch[1], 10) : 0;

  if (!buType || requiredValue <= 0) return true;

  return ctx.characterStats.some((char) => statForPowerType(char, buType) >= requiredValue);
}

function isTrainingUsable(card: CatalogCard, ctx: DeckUsabilityContext): boolean {
  const type1 = String(card.type_1 ?? '');
  const type2 = String(card.type_2 ?? '');
  const valueMatch = String(card.value_to_use ?? '').match(/(\d+)/);
  const cap = valueMatch ? parseInt(valueMatch[1], 10) : 0;

  if (!type1 || !type2 || cap <= 0) return true;

  return ctx.characterStats.some(
    (char) =>
      trainingTypeAtOrBelowCap(char, type1, cap) || trainingTypeAtOrBelowCap(char, type2, cap),
  );
}

function isAllyUniverseUsable(card: CatalogCard, ctx: DeckUsabilityContext): boolean {
  const statToUse = String(card.stat_to_use ?? '');
  const statTypeToUse = String(card.stat_type_to_use ?? '');
  const valueMatch = statToUse.match(/(\d+)\s+or\s+(less|higher)/i);
  if (!valueMatch || !statTypeToUse) return true;

  const requiredValue = parseInt(valueMatch[1], 10);
  const isLessThan = valueMatch[2].toLowerCase() === 'less';

  return ctx.characterStats.some((char) => {
    const characterStat = statForPowerType(char, statTypeToUse);
    return isLessThan ? characterStat <= requiredValue : characterStat >= requiredValue;
  });
}

function isEventUsable(card: CatalogCard, ctx: DeckUsabilityContext): boolean {
  const missionSet = String(card.mission_set ?? '').trim();

  if (!missionSet || missionSet === 'Any-Mission') return true;
  if (ctx.missionSets.size === 0) return true;

  return ctx.missionSets.has(missionSet);
}

function isAspectUsable(card: CatalogCard, ctx: DeckUsabilityContext): boolean {
  if (!ctx.homebaseName) return false;

  const locField = String(card.location ?? '').trim();
  if (!locField) return true;

  const anyHomebase =
    /^any\s*homebase$/i.test(locField) || locField.toLowerCase().includes('any homebase');
  if (anyHomebase) return true;

  return locField.toLowerCase() === ctx.homebaseName.toLowerCase();
}

export function isCatalogCardUsable(
  card: CatalogCard,
  catalogType: CatalogType,
  ctx: DeckUsabilityContext,
): boolean {
  if (!catalogTypeSupportsHideUnusables(catalogType)) {
    return true;
  }

  switch (catalogType) {
    case 'special-cards':
      return isSpecialCardUsable(card, ctx);
    case 'advanced-universe':
      return isAdvancedUniverseUsable(card, ctx);
    case 'power-cards':
      return isPowerCardUsable(card, ctx);
    case 'teamwork':
      return isTeamworkUsable(card, ctx);
    case 'basic-universe':
      return isBasicUniverseUsable(card, ctx);
    case 'training':
      return isTrainingUsable(card, ctx);
    case 'ally-universe':
      return isAllyUniverseUsable(card, ctx);
    case 'events':
      return isEventUsable(card, ctx);
    case 'aspects':
      return isAspectUsable(card, ctx);
    default:
      return true;
  }
}
