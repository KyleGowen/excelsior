import { DeckCard } from '../types';
import { CardRepository } from '../repository/CardRepository';

export interface ValidationError {
    rule: string;
    message: string;
}

export class DeckValidationService {
    constructor(private cardRepository: CardRepository) {}

    /**
     * Validate a deck for all Overpower rules including unusable cards
     */
    async validateDeck(cards: DeckCard[]): Promise<ValidationError[]> {
        const errors: ValidationError[] = [];
        
        // Get all available cards for validation
        const [
            allCharacters,
            allSpecialCards,
            allPowerCards,
            allMissions,
            allEvents,
            allLocations,
            allAspects,
            allAdvancedUniverse,
            allTeamwork,
            allAllyUniverse,
            allTraining,
            allBasicUniverse
        ] = await Promise.all([
            this.cardRepository.getAllCharacters(),
            this.cardRepository.getAllSpecialCards(),
            this.cardRepository.getAllPowerCards(),
            this.cardRepository.getAllMissions(),
            this.cardRepository.getAllEvents(),
            this.cardRepository.getAllLocations(),
            this.cardRepository.getAllAspects(),
            this.cardRepository.getAllAdvancedUniverse(),
            this.cardRepository.getAllTeamwork(),
            this.cardRepository.getAllAllyUniverse(),
            this.cardRepository.getAllTraining(),
            this.cardRepository.getAllBasicUniverse()
        ]);

        const availableCardsMap = new Map();
        
        // Build a map of available cards for quick lookup
        allCharacters.forEach(card => {
            const key = `character_${card.id}`;
            availableCardsMap.set(key, { ...card, type: 'character' });
        });
        allSpecialCards.forEach(card => {
            const key = `special_${card.id}`;
            availableCardsMap.set(key, { ...card, type: 'special' });
        });
        allPowerCards.forEach(card => {
            const key = `power_${card.id}`;
            availableCardsMap.set(key, { ...card, type: 'power' });
        });
        allMissions.forEach(card => {
            const key = `mission_${card.id}`;
            availableCardsMap.set(key, { ...card, type: 'mission' });
        });
        allEvents.forEach(card => {
            const key = `event_${card.id}`;
            availableCardsMap.set(key, { ...card, type: 'event' });
        });
        allLocations.forEach(card => {
            const key = `location_${card.id}`;
            availableCardsMap.set(key, { ...card, type: 'location' });
        });
        allAspects.forEach(card => {
            const key = `aspect_${card.id}`;
            availableCardsMap.set(key, { ...card, type: 'aspect' });
        });
        allAdvancedUniverse.forEach(card => {
            const key = `advanced_universe_${card.id}`;
            availableCardsMap.set(key, { ...card, type: 'advanced_universe' });
        });
        allTeamwork.forEach(card => {
            const key = `teamwork_${card.id}`;
            availableCardsMap.set(key, { ...card, type: 'teamwork' });
        });
        allAllyUniverse.forEach(card => {
            const key = `ally_universe_${card.id}`;
            availableCardsMap.set(key, { ...card, type: 'ally_universe' });
        });
        allTraining.forEach(card => {
            const key = `training_${card.id}`;
            availableCardsMap.set(key, { ...card, type: 'training' });
        });
        allBasicUniverse.forEach(card => {
            const key = `basic_universe_${card.id}`;
            availableCardsMap.set(key, { ...card, type: 'basic_universe' });
        });

        // Rule 1: Exactly 4 characters
        const characterCards = cards.filter(card => card.type === 'character');
        const characterCount = characterCards.reduce((sum, card) => sum + (card.quantity || 1), 0);
        if (characterCount !== 4) {
            errors.push({
                rule: 'character_count',
                message: `Deck must have exactly 4 characters (found ${characterCount})`
            });
        }

        // Rule 2: 7 mission cards of the same mission set
        const missionCards = cards.filter(card => card.type === 'mission');
        const missionCount = missionCards.reduce((sum, card) => sum + (card.quantity || 1), 0);
        if (missionCount !== 7) {
            errors.push({
                rule: 'mission_count',
                message: `Deck must have exactly 7 mission cards (found ${missionCount})`
            });
        } else {
            // Check if all missions are from the same set
            const missionSets = new Set();
            missionCards.forEach(card => {
                const availableCard = availableCardsMap.get(`${card.type}_${card.cardId}`);
                if (availableCard && availableCard.mission_set) {
                    missionSets.add(availableCard.mission_set);
                }
            });
            if (missionSets.size > 1) {
                errors.push({
                    rule: 'mission_set',
                    message: `All mission cards must be from the same mission set (found: ${Array.from(missionSets).join(', ')})`
                });
            }
        }

        // Rule 3: Only 0 or 1 location
        const locationCards = cards.filter(card => card.type === 'location');
        const locationCount = locationCards.reduce((sum, card) => sum + (card.quantity || 1), 0);
        if (locationCount > 1) {
            errors.push({
                rule: 'location_count',
                message: `Deck may have at most 1 location (found ${locationCount})`
            });
        }

        // Rule 4: Threat value must be <= 76
        let totalThreat = 0;
        characterCards.forEach(card => {
            const availableCard = availableCardsMap.get(`${card.type}_${card.cardId}`);
            if (availableCard && availableCard.threat) {
                totalThreat += availableCard.threat * card.quantity;
            }
        });
        if (totalThreat > 76) {
            errors.push({
                rule: 'threat_level',
                message: `Deck threat level must be 76 or less (found ${totalThreat})`
            });
        }

        // Rule 5: Deck size must be at least 51 (or 56 with events)
        const eventCards = cards.filter(card => card.type === 'event');
        const requiredSize = eventCards.length > 0 ? 56 : 51;
        const totalCards = cards.reduce((sum, card) => sum + card.quantity, 0);
        if (totalCards < requiredSize) {
            errors.push({
                rule: 'deck_size',
                message: `Deck must have at least ${requiredSize} cards (found ${totalCards})`
            });
        }

        // Rule 6: Special cards must be for selected characters or "Any Character"
        const deckSpecialCards = cards.filter(card => card.type === 'special');
        const characterNames = characterCards.map(card => {
            const availableCard = availableCardsMap.get(`${card.type}_${card.cardId}`);
            return availableCard ? availableCard.name : 'Unknown';
        });

        // Check for Angry Mob characters (special rule)
        const angryMobCharacters = characterNames.filter(name => name.startsWith('Angry Mob'));
        if (angryMobCharacters.length > 1) {
            errors.push({
                rule: 'angry_mob_limit',
                message: 'Only one "Angry Mob" character is allowed per deck'
            });
        }

        for (const card of deckSpecialCards) {
            const availableCard = availableCardsMap.get(`${card.type}_${card.cardId}`);
            if (!availableCard) continue;

            const cardName = availableCard.name || 'Unknown Card';
            const characterName = availableCard.character_name;

            if (characterName && characterName !== 'Any Character') {
                // Handle Angry Mob special cards
                if (characterName.startsWith('Angry Mob')) {
                    if (angryMobCharacters.length === 0) {
                        errors.push({
                            rule: 'unusable_special',
                            message: `"${cardName}" requires an "Angry Mob" character in your team`
                        });
                    } else {
                        // Check if it's a subtype-specific special
                        const hasColon = characterName.includes(':');
                        if (hasColon) {
                            const subtype = characterName.split(':')[1].trim();
                            const hasMatchingSubtype = angryMobCharacters.some(char => char.includes(subtype));
                            if (!hasMatchingSubtype) {
                                errors.push({
                                    rule: 'unusable_special',
                                    message: `"${cardName}" requires an "Angry Mob: ${subtype}" character in your team`
                                });
                            }
                        }
                    }
                } else {
                    // Regular character special validation
                    if (!characterNames.includes(characterName)) {
                        errors.push({
                            rule: 'unusable_special',
                            message: `"${cardName}" requires character "${characterName}" in your team`
                        });
                    }
                }
            }
        }

        // Rule 7: Events must be from the same mission set as missions
        for (const card of eventCards) {
            const availableCard = availableCardsMap.get(`${card.type}_${card.cardId}`);
            if (!availableCard) continue;

            const cardName = availableCard.name || 'Unknown Card';
            const missionSet = availableCard.mission_set;

            if (missionSet && missionSet !== 'Any-Mission') {
                const missionSets = new Set();
                missionCards.forEach(missionCard => {
                    const missionAvailableCard = availableCardsMap.get(`${missionCard.type}_${missionCard.cardId}`);
                    if (missionAvailableCard && missionAvailableCard.mission_set) {
                        missionSets.add(missionAvailableCard.mission_set);
                    }
                });

                if (missionSets.size > 0 && !missionSets.has(missionSet)) {
                    errors.push({
                        rule: 'unusable_event',
                        message: `"${cardName}" requires mission set "${missionSet}" in your deck`
                    });
                }
            }
        }

        // Rule 8: One-per-deck cards validation
        const onePerDeckCards: { [key: string]: number } = {};
        for (const card of cards) {
            const availableCard = availableCardsMap.get(`${card.type}_${card.cardId}`);
            const isOnePerDeck = availableCard && (availableCard.one_per_deck === true || availableCard.is_one_per_deck === true);
            if (isOnePerDeck) {
                const cardKey = `${card.type}_${card.cardId}`;
                onePerDeckCards[cardKey] = (onePerDeckCards[cardKey] || 0) + (card.quantity || 1);
            }
        }
        
        for (const [cardKey, count] of Object.entries(onePerDeckCards)) {
            if (count > 1) {
                const [type, cardId] = cardKey.split('_', 2);
                const availableCard = availableCardsMap.get(cardKey);
                const cardName = availableCard ? availableCard.name : cardId;
                errors.push({
                    rule: 'one_per_deck_violation',
                    message: `"${cardName}" is limited to one per deck (found ${count})`
                });
            }
        }

        // Rule 9: Power and universe cards must be usable by characters
        const deckPowerCards = cards.filter(card => card.type === 'power');
        const universeCards = cards.filter(card => 
            ['basic_universe', 'advanced_universe', 'teamwork', 'ally_universe', 'training'].includes(card.type)
        );

        // Get character stats for validation
        const characterStats = characterCards.map(card => {
            const availableCard = availableCardsMap.get(`${card.type}_${card.cardId}`);
            return availableCard ? {
                name: availableCard.name,
                energy: availableCard.energy || 0,
                combat: availableCard.combat || 0,
                brute_force: availableCard.brute_force || 0,
                intelligence: availableCard.intelligence || 0
            } : null;
        }).filter((char): char is NonNullable<typeof char> => char !== null);

        // Validate power cards
        for (const card of deckPowerCards) {
            const availableCard = availableCardsMap.get(`${card.type}_${card.cardId}`);
            if (!availableCard) continue;

            const cardName = availableCard.name || 'Unknown Card';
            const powerType = availableCard.power_type;
            const value = availableCard.value;

            if (powerType && value) {
                const canUse = characterStats.some(char => {
                    let characterStat = 0;
                    
                    switch (powerType) {
                        case 'Energy':
                            characterStat = char.energy;
                            break;
                        case 'Combat':
                            characterStat = char.combat;
                            break;
                        case 'Brute Force':
                            characterStat = char.brute_force;
                            break;
                        case 'Intelligence':
                            characterStat = char.intelligence;
                            break;
                        case 'Any-Power':
                        case 'Multi-Power':
                        case 'Multi Power':
                            characterStat = Math.max(char.energy, char.combat, char.brute_force, char.intelligence);
                            break;
                    }
                    
                    return characterStat >= value;
                });

                if (!canUse) {
                    errors.push({
                        rule: 'unusable_power',
                        message: `"${cardName}" (Power Card) requires a character with ${value}+ ${powerType}`
                    });
                }
            }
        }

        // Validate universe cards
        for (const card of universeCards) {
            const availableCard = availableCardsMap.get(`${card.type}_${card.cardId}`);
            if (!availableCard) continue;

            const cardName = availableCard.name || 'Unknown Card';
            const toUse = availableCard.to_use;

            if (toUse) {
                const toUseMatch = toUse.match(/(\d+)\s+(Energy|Combat|Brute Force|Intelligence|Any-Power)/);
                if (toUseMatch) {
                    const requiredValue = parseInt(toUseMatch[1]);
                    const powerType = toUseMatch[2];
                    
                    const canUse = characterStats.some(char => {
                        let characterStat = 0;
                        
                        switch (powerType) {
                            case 'Energy':
                                characterStat = char.energy;
                                break;
                            case 'Combat':
                                characterStat = char.combat;
                                break;
                            case 'Brute Force':
                                characterStat = char.brute_force;
                                break;
                            case 'Intelligence':
                                characterStat = char.intelligence;
                                break;
                            case 'Any-Power':
                                characterStat = Math.max(char.energy, char.combat, char.brute_force, char.intelligence);
                                break;
                        }
                        
                        return characterStat >= requiredValue;
                    });

                    if (!canUse) {
                        errors.push({
                            rule: 'unusable_universe',
                            message: `"${cardName}" (Universe Card) requires a character with ${requiredValue}+ ${powerType}`
                        });
                    }
                }
            }
        }

        return errors;
    }
}
