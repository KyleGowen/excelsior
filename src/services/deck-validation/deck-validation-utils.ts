import type { DeckCard } from '../../types';
import type { DeckValidationContext } from './deck-validation-context';
import type { CharacterStatRow } from './deck-validation-context';

/** API / editor deck rows use hyphenated types; map keys use underscores. */
export function deckCardTypeKeyPrefix(type: string): string {
    return type.replace(/-/g, '_');
}

export function deckCardMapKey(card: Pick<DeckCard, 'type' | 'cardId'>): string {
    return `${deckCardTypeKeyPrefix(card.type)}_${card.cardId}`;
}

/** True when the deck contains a Battleground whose catalog name matches `name` (exact). */
export function deckHasBattlegroundNamed(ctx: DeckValidationContext, name: string): boolean {
    return ctx.battlegroundCards.some((battleground) => {
        const available = ctx.availableCardsMap.get(deckCardMapKey(battleground));
        const battlegroundName = String(
            (available?.name as string) || (available?.card_name as string) || ''
        ).trim();
        return battlegroundName === name;
    });
}

/** True when the deck contains a Location whose catalog name matches `name` (exact). */
export function deckHasLocationNamed(ctx: DeckValidationContext, name: string): boolean {
    return ctx.locationCards.some((location) => {
        const available = ctx.availableCardsMap.get(deckCardMapKey(location));
        const locationName = String(
            (available?.name as string) || (available?.card_name as string) || ''
        ).trim();
        return locationName === name;
    });
}

export function isAnyCharacterSpecial(special: {
    character?: string;
    character_name?: string;
    characters?: string[];
}): boolean {
    return specialLinkedCharacterName(special).toLowerCase() === 'any character';
}

export function characterThreatValue(availableCard: { threat?: number; threat_level?: number }): number {
    const t = availableCard.threat ?? availableCard.threat_level;
    return typeof t === 'number' ? t : 0;
}

/** Multi Power cards are legal in any Venture deck; no character-stat grid gate. DB uses `Multi Power` or legacy `Multi-Power`. */
export function isMultiPowerPowerCardType(powerType: string): boolean {
    return powerType === 'Multi Power' || powerType === 'Multi-Power';
}

export function statForPowerType(
    char: { energy: number; combat: number; brute_force: number; intelligence: number },
    powerType: string
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

function baseCharacterName(name: string): string {
    return name.split(' (')[0].trim().toLowerCase();
}

function teamHasCharacterNamed(characterNames: string[], expectedName: string): boolean {
    const normalizedExpected = expectedName.toLowerCase();
    return characterNames.some(name => baseCharacterName(name) === normalizedExpected);
}

/** Alpha may use only level 6 and 7 Intelligence Power cards when Walkers: Herd started on her team. */
export function hasAlphaIntelligencePowerCardAllowance(
    characterName: string,
    startingCharacterNames: string[],
    powerType: string,
    value: number
): boolean {
    return (
        baseCharacterName(characterName) === 'alpha and the whisperers' &&
        teamHasCharacterNamed(startingCharacterNames, 'Walkers: Herd') &&
        powerType === 'Intelligence' &&
        (value === 6 || value === 7)
    );
}

/** Apply starting-team inherent abilities that change a character's effective grid. */
export function effectiveTeamCharacterStats(characterStats: CharacterStatRow[]): CharacterStatRow[] {
    const characterNames = characterStats.map(character => character.name);
    const michonneConditionMet =
        teamHasCharacterNamed(characterNames, 'Rick Grimes') &&
        teamHasCharacterNamed(characterNames, 'Alexandria');

    return characterStats.map(character => {
        if (baseCharacterName(character.name) !== 'michonne' || !michonneConditionMet) {
            return character;
        }
        return {
            ...character,
            combat: Math.max(character.combat, 8)
        };
    });
}

type CharacterStatGrid = {
    energy: number;
    combat: number;
    brute_force: number;
    intelligence: number;
};

/**
 * Training cards use type_1 / type_2 with "N or less" from value_to_use.
 * For Any-Power, that means at least one of Energy / Combat / Brute Force / Intelligence is at or below the cap
 * (not the highest stat — Power/Teamwork "Any-Power" still use {@link statForPowerType} = max for at-least checks).
 */
export function trainingTypeAtOrBelowCap(char: CharacterStatGrid, powerType: string, cap: number): boolean {
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

/**
 * Skybound collectors 349–374 are the G.D.A.-branded Any Character subset.
 * Collector identity is stable across environments while database UUIDs are not.
 */
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

export function teamHasSpecialCharacter(characterNames: string[], linkedName: string, extras: string[]): boolean {
    if (characterNames.includes(linkedName)) return true;
    return extras.some((e) => characterNames.includes(e));
}

export function normalizeAngryMobVariant(v: string): string {
    return v.toLowerCase().replace(/\s+/g, ' ').trim().replace(/s$/, '');
}
