/** Central user-facing strings for deck validation (keep in sync with client messaging where applicable). */
import { TOURNAMENT_LEGAL_THREAT_LIMIT } from '../../constants/deckRules';

export const deckValidationMessages = {
    characterCount(found: number): string {
        return `Deck must have exactly 4 characters (found ${found})`;
    },
    bannedCard(cardName: string): string {
        return `Contains Banned Card: ${cardName}`;
    },
    missionCount(found: number): string {
        return `Deck must have exactly 7 mission cards (found ${found})`;
    },
    missionSetMixed(sets: string[]): string {
        return `All mission cards must be from the same mission set (found: ${sets.join(', ')})`;
    },
    locationCount(found: number): string {
        return `Deck may have at most 1 location (found ${found})`;
    },
    battlegroundCount(found: number): string {
        return `Deck may have at most 1 battleground (found ${found})`;
    },
    threatLevel(found: number): string {
        return `Deck threat level must be ${TOURNAMENT_LEGAL_THREAT_LIMIT} or less (found ${found})`;
    },
    deckSize(required: number, found: number): string {
        return `Deck must have at least ${required} cards in draw pile (${found}/${required})`;
    },
    angryMobLimit(): string {
        return 'Only one "Angry Mob" character is allowed per deck';
    },
    unusableSpecialNeedsAngryMob(cardName: string): string {
        return `"${cardName}" requires an "Angry Mob" character in your team`;
    },
    unusableSpecialAngryMobVariant(cardName: string, variant: string): string {
        return `"${cardName}" requires an "Angry Mob (${variant})" character in your team`;
    },
    unusableSpecialNeedsCharacter(cardName: string, characterName: string): string {
        return `"${cardName}" requires character "${characterName}" in your team`;
    },
    gdaAnyCharacterNeedsBattleground(): string {
        return 'G.D.A. Any Character Special cards require the "Global Defense Agency" Battleground in your deck';
    },
    gdaAnyCharacterCannotMix(): string {
        return 'G.D.A. Any Character Special cards cannot be combined with non-G.D.A. Any Character Special cards';
    },
    erbAnyCharacterNeedsBattleground(): string {
        return 'ERB Any Character Special cards (including ERBP promos) require the "Rainbow Bridge" Battleground in your deck';
    },
    unusableEventMissionSet(cardName: string, missionSet: string): string {
        return `"${cardName}" requires mission set "${missionSet}" in your deck`;
    },
    onePerDeckViolation(cardName: string, count: number): string {
        return `"${cardName}" is limited to one per deck (found ${count})`;
    },
    unusablePower(cardName: string, value: number, powerType: string): string {
        return `"${cardName}" (Power Card) requires a character with ${value}+ ${powerType}`;
    },
    unusableUniverseGrid(cardName: string, requiredValue: number, powerType: string): string {
        return `"${cardName}" (Universe Card) requires a character with ${requiredValue}+ ${powerType}`;
    },
    unusableTraining(cardName: string, type1: string, type2: string, cap: number): string {
        return `"${cardName}" (Training) requires a character with ${type1} or ${type2} at ${cap} or less`;
    },
    unusableAllyNeedsTwoCharacters(cardName: string): string {
        return `"${cardName}" (Ally Universe) requires at least two characters on your team`;
    },
    unusableAllyStatLess(cardName: string, statType: string, requiredValue: number): string {
        return `"${cardName}" (Ally Universe) requires a character with ${statType} at ${requiredValue} or less`;
    },
    unusableAllyStatHigher(cardName: string, requiredValue: number, statType: string): string {
        return `"${cardName}" (Ally Universe) requires a character with ${requiredValue}+ ${statType}`;
    },
    unusableAdvancedNeedsCharacter(cardName: string, auChar: string): string {
        return `"${cardName}" (Advanced Universe) requires character "${auChar}" in your team`;
    },
    unusableAspectNeedsHomebase(cardName: string): string {
        return `"${cardName}" (Aspect) requires a Homebase in your deck`;
    },
    unusableAspectNeedsHomebaseNamed(cardName: string, locField: string): string {
        return `"${cardName}" (Aspect) requires Homebase "${locField}"`;
    },
    prePlacedBasicUniverseLimit(found: number, locationName = "Dracula's Armory"): string {
        return `"${locationName}" allows at most 3 pre-placed Basic Universe cards (found ${found})`;
    },
    prePlacedBasicUniverseUnique(locationName = "Dracula's Armory"): string {
        return `Pre-placed Basic Universe cards under "${locationName}" must be unique`;
    },
    prePlacedTrainingLimit(found: number, locationName = 'Spartan Training Ground'): string {
        return `"${locationName}" allows at most 3 pre-placed Training cards (found ${found})`;
    },
    prePlacedTrainingUnique(locationName = 'Spartan Training Ground'): string {
        return `Pre-placed Training cards under "${locationName}" must be unique`;
    }
} as const;
