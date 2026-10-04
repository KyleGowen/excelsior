import type { CharacterStatRow } from './types';

/** Multi Power cards are legal in any Venture deck; no character-stat grid gate. */
export function isMultiPowerPowerCardType(powerType: string): boolean {
  return powerType === 'Multi Power' || powerType === 'Multi-Power';
}

export function statForPowerType(
  char: Pick<CharacterStatRow, 'energy' | 'combat' | 'brute_force' | 'intelligence'>,
  powerType: string,
): number {
  switch (powerType) {
    case 'Energy':
      return char.energy;
    case 'Combat':
      return char.combat;
    case 'Brute Force':
      return char.brute_force;
    case 'Intelligence':
      return char.intelligence;
    case 'Any-Power':
      return Math.max(char.energy, char.combat, char.brute_force, char.intelligence);
    default:
      return 0;
  }
}

/**
 * Training cards use type_1 / type_2 with "N or less" from value_to_use.
 * Any-Power means at least one primary stat is at or below the cap.
 */
export function trainingTypeAtOrBelowCap(
  char: Pick<CharacterStatRow, 'energy' | 'combat' | 'brute_force' | 'intelligence'>,
  powerType: string,
  cap: number,
): boolean {
  if (powerType === 'Any-Power') {
    return (
      char.energy <= cap ||
      char.combat <= cap ||
      char.brute_force <= cap ||
      char.intelligence <= cap
    );
  }
  return statForPowerType(char, powerType) <= cap;
}

export function specialLinkedCharacterName(special: {
  character?: string;
  character_name?: string;
  characters?: string[];
}): string {
  const primary = (special.character || special.character_name || '').trim();
  if (primary) return primary;
  if (Array.isArray(special.characters) && special.characters.length > 0) {
    return special.characters[0].trim();
  }
  return '';
}

export const GLOBAL_DEFENSE_AGENCY_BATTLEGROUND_NAME = 'Global Defense Agency';

/** Skybound collectors 349–374 are the G.D.A.-branded Any Character subset. */
export function isGdaAnyCharacterSpecial(special: {
  set?: unknown;
  set_number?: unknown;
  character?: string;
  character_name?: string;
  characters?: string[];
}): boolean {
  if (String(special.set ?? '').trim().toUpperCase() !== 'SKY') return false;
  if (specialLinkedCharacterName(special) !== 'Any Character') return false;
  const collectorMatch = String(special.set_number ?? '').trim().match(/^(\d+)/);
  if (!collectorMatch) return false;
  const collectorNumber = Number.parseInt(collectorMatch[1], 10);
  return collectorNumber >= 349 && collectorNumber <= 374;
}

export function teamHasSpecialCharacter(
  characterNames: string[],
  linkedName: string,
  extras: string[],
): boolean {
  if (characterNames.includes(linkedName)) return true;
  if (extras.some((e) => characterNames.includes(e))) return true;

  // Legacy hide-unusable: match alt-art deck names via base name before " ("
  return characterNames.some((deckName) => {
    const deckNameClean = deckName.split(' (')[0].trim();
    return deckNameClean === linkedName;
  });
}

export function normalizeAngryMobVariant(v: string): string {
  return v.toLowerCase().replace(/\s+/g, ' ').trim().replace(/s$/, '');
}

function baseCharacterName(name: string): string {
  return name.split(' (')[0].trim().toLowerCase();
}

function teamHasCharacterNamed(characterNames: string[], expectedName: string): boolean {
  const normalizedExpected = expectedName.toLowerCase();
  return characterNames.some((name) => baseCharacterName(name) === normalizedExpected);
}

/** Alpha may use only level 6 and 7 Intelligence Power cards when Walkers: Herd started on her team. */
export function hasAlphaIntelligencePowerCardAllowance(
  characterName: string,
  startingCharacterNames: string[],
  powerType: string,
  value: number,
): boolean {
  return (
    baseCharacterName(characterName) === 'alpha and the whisperers'
    && teamHasCharacterNamed(startingCharacterNames, 'Walkers: Herd')
    && powerType === 'Intelligence'
    && (value === 6 || value === 7)
  );
}

function effectiveStartingTeamGridStats(
  char: CharacterStatRow,
  startingCharacterNames: string[],
): CharacterStatRow {
  const michonneConditionMet =
    baseCharacterName(char.name) === 'michonne'
    && teamHasCharacterNamed(startingCharacterNames, 'Rick Grimes')
    && teamHasCharacterNamed(startingCharacterNames, 'Alexandria');
  return {
    ...char,
    combat: Math.max(char.combat || 0, michonneConditionMet ? 8 : 0),
  };
}

/** Power-card overrides plus starting-team grid conditions. */
export function effectiveCharacterStats(
  char: CharacterStatRow,
  startingCharacterNames: string[] = [char.name],
): CharacterStatRow {
  const nameLower = char.name.toLowerCase();
  return {
    ...effectiveStartingTeamGridStats(char, startingCharacterNames),
    brute_force: Math.max(char.brute_force || 0, nameLower.includes('john carter') ? 8 : 0),
    intelligence: Math.max(char.intelligence || 0, nameLower.includes('time traveler') ? 8 : 0),
  };
}

export function effectiveTeamCharacterStats(characterStats: CharacterStatRow[]): CharacterStatRow[] {
  const startingCharacterNames = characterStats.map((character) => character.name);
  return characterStats.map((character) =>
    effectiveStartingTeamGridStats(character, startingCharacterNames));
}

export function statForPowerTypeWithSpecialCases(
  char: CharacterStatRow,
  powerType: string,
  startingCharacterNames: string[] = [char.name],
): number {
  return statForPowerType(effectiveCharacterStats(char, startingCharacterNames), powerType);
}
