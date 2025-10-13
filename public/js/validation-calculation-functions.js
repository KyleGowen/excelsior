/* ========================================
 * PHASE 10B: VALIDATION AND CALCULATION FUNCTIONS
 * ========================================
 * 
 * This file contains deck validation and calculation functions extracted from
 * index.html during Phase 10B of the refactoring project.
 * 
 * Purpose: Deck validation and calculation functions
 * Created: Phase 10B of 12-phase refactoring project
 * Contains:
 *   - validateDeck() - Deck validation logic
 *   - calculateTotalCardCount() - Card count calculations
 *   - calculateTotalThreat() - Threat level calculations
 *   - updateDeckTitleValidation() - Title validation updates
 *   - toggleLimitedState() - Limited deck state management
 * 
 * ======================================== */

// Global variable to track limited state
let isDeckLimited = false;

// Function to validate deck according to Overpower rules
function validateDeck(deckCards) {
    const errors = [];
    const warnings = [];
    
    // Count card types
    const cardCounts = {};
    const characterCards = [];
    const eventCards = [];
    const missionCards = [];
    const locationCards = [];
    const onePerDeckCards = {};
    
    deckCards.forEach(card => {
        const type = card.type;
        cardCounts[type] = (cardCounts[type] || 0) + 1;
        
        if (type === 'character') {
            characterCards.push(card);
        } else if (type === 'event') {
            eventCards.push(card);
        } else if (type === 'mission') {
            missionCards.push(card);
        } else if (type === 'location') {
            locationCards.push(card);
        }
        
        // Track "One Per Deck" cards
        // Direct lookup using UUID
        const availableCard = availableCardsMap.get(card.cardId);
        if (availableCard && availableCard.one_per_deck) {
            const cardKey = `${card.type}_${card.cardId}`;
            onePerDeckCards[cardKey] = (onePerDeckCards[cardKey] || 0) + 1;
        }
    });
    
    // Rule 1: Exactly 4 characters
    if (characterCards.length !== DECK_RULES.EXACT_CHARACTERS) {
        errors.push(`Deck must have exactly ${DECK_RULES.EXACT_CHARACTERS} characters (${characterCards.length}/${DECK_RULES.EXACT_CHARACTERS})`);
    }
    
    // Rule 1.5: Angry Mob character restrictions
    const angryMobCharacters = characterCards.filter(card => {
        const availableCard = availableCardsMap.get(card.cardId);
        return availableCard && (availableCard.name === 'Angry Mob' || availableCard.card_name === 'Angry Mob');
    });
    
    if (angryMobCharacters.length > 0) {
        const otherCharacters = characterCards.filter(card => {
            const availableCard = availableCardsMap.get(card.cardId);
            return availableCard && availableCard.name !== 'Angry Mob' && availableCard.card_name !== 'Angry Mob';
        });
        
        if (otherCharacters.length > 0) {
            errors.push('Angry Mob cannot be used with other characters');
        }
    }
    
    // Rule 2: Exactly 0 or 1 mission may be selected
    if (missionCards.length > DECK_RULES.MAX_MISSIONS) {
        errors.push(`Deck can have at most ${DECK_RULES.MAX_MISSIONS} mission (${missionCards.length} missions)`);
    }
    
    // Rule 3: Exactly 0 or 1 event may be selected
    if (eventCards.length > DECK_RULES.MAX_EVENTS) {
        errors.push(`Deck can have at most ${DECK_RULES.MAX_EVENTS} event (${eventCards.length} events)`);
    }
    
    // Rule 4: Only 0 or 1 location may be selected
    if (locationCards.length > DECK_RULES.MAX_LOCATIONS) {
        errors.push(`Deck can have at most ${DECK_RULES.MAX_LOCATIONS} location (${locationCards.length} locations)`);
    }
    
    // Rule 5: Threat value must be less than or equal to 76
    let totalThreat = 0;
    characterCards.forEach(card => {
        // Direct lookup using UUID
        const availableCard = availableCardsMap.get(card.cardId);
        if (availableCard && availableCard.threat_level) {
            totalThreat += availableCard.threat_level;
        }
    });
    
    locationCards.forEach(card => {
        // Direct lookup using UUID
        const availableCard = availableCardsMap.get(card.cardId);
        if (availableCard && availableCard.threat_level) {
            totalThreat += availableCard.threat_level;
        }
    });
    
    if (totalThreat > DECK_RULES.MAX_TOTAL_THREAT) {
        errors.push(`Total threat level must be ≤ ${DECK_RULES.MAX_TOTAL_THREAT} (current: ${totalThreat})`);
    }
    
    // Rule 6: Deck's draw pile must have 51 cards unless there are events, then it must be 56
    const totalCards = deckCards
        .filter(card => !['mission', 'character', 'location'].includes(card.type))
        .reduce((sum, card) => sum + card.quantity, 0);
    const hasEvents = eventCards.length > 0;
    const requiredSize = hasEvents ? DECK_RULES.MIN_DECK_SIZE_WITH_EVENTS : DECK_RULES.MIN_DECK_SIZE;
    
    if (totalCards < requiredSize) {
        errors.push(`Deck must have at least ${requiredSize} cards in draw pile (${totalCards}/${requiredSize})`);
    }
    
    // Check "One Per Deck" violations
    Object.entries(onePerDeckCards).forEach(([cardKey, count]) => {
        if (count > DECK_RULES.MAX_COPIES_ONE_PER_DECK) {
            const [cardType, cardId] = cardKey.split('_');
            const availableCard = availableCardsMap.get(cardKey);
            const cardName = availableCard ? availableCard.name || availableCard.card_name : cardId;
            errors.push(`"${cardName}" can only have ${DECK_RULES.MAX_COPIES_ONE_PER_DECK} copy in deck (${count} copies)`);
        }
    });
    
    // Rule 7: Deck cannot contain unusable cards
    const characterNamesForUnusable = characterCards.map(card => {
        const availableCard = availableCardsMap.get(card.cardId);
        return availableCard ? availableCard.name || availableCard.card_name : 'Unknown';
    });
    
    // Get character stats for power/universe card validation
    const characterStats = characterCards.map(card => {
        const availableCard = availableCardsMap.get(card.cardId);
        return availableCard ? {
            name: availableCard.name || availableCard.card_name,
            energy: availableCard.energy || 0,
            combat: availableCard.combat || 0,
            brute_force: availableCard.brute_force || 0,
            intelligence: availableCard.intelligence || 0
        } : null;
    }).filter(char => char);
    
    // Get mission sets for event validation
    const missionSets = new Set();
    missionCards.forEach(card => {
        const availableCard = availableCardsMap.get(card.cardId);
        if (availableCard && availableCard.mission_set) {
            missionSets.add(availableCard.mission_set);
        }
    });
    
    deckCards.forEach(card => {
        const availableCard = availableCardsMap.get(card.cardId);
        if (!availableCard) return;
        
        const cardName = availableCard.name || availableCard.card_name || 'Unknown';
        
        // Check for unusable cards based on character requirements
        if (availableCard.unusable_with) {
            const unusableWith = availableCard.unusable_with.split(',').map(name => name.trim());
            const hasUnusableCharacter = unusableWith.some(unusableName => 
                characterNamesForUnusable.some(charName => 
                    charName.toLowerCase().includes(unusableName.toLowerCase())
                )
            );
            
            if (hasUnusableCharacter) {
                errors.push(`"${cardName}" cannot be used with ${unusableWith.join(', ')}`);
            }
        }
        
        // Check for power/universe card requirements
        if (['power', 'advanced-universe', 'ally-universe', 'basic-universe', 'training', 'teamwork'].includes(card.type)) {
            if (availableCard.requires_energy || availableCard.requires_combat || 
                availableCard.requires_brute_force || availableCard.requires_intelligence) {
                
                const requiredValue = availableCard.requires_energy || availableCard.requires_combat || 
                                    availableCard.requires_brute_force || availableCard.requires_intelligence;
                const powerType = availableCard.requires_energy ? 'Energy' : 
                                availableCard.requires_combat ? 'Combat' :
                                availableCard.requires_brute_force ? 'Brute Force' : 'Intelligence';
                
                const canUse = characterStats.some(character => {
                    const characterStat = availableCard.requires_energy ? character.energy :
                                        availableCard.requires_combat ? character.combat :
                                        availableCard.requires_brute_force ? character.brute_force :
                                        character.intelligence;
                    
                    return characterStat >= requiredValue;
                });
                
                if (!canUse) {
                    errors.push(`"${cardName}" (Universe Card) requires a character with ${requiredValue}+ ${powerType}`);
                }
            }
        }
    });
    
    return { errors, warnings, isValid: errors.length === 0 };
}

// Shared function to calculate total card count (excluding mission, character, and location cards)
function calculateTotalCardCount(deckCards) {
    return deckCards
        .filter(card => !['mission', 'character', 'location'].includes(card.type))
        .reduce((sum, card) => sum + card.quantity, 0);
}

// Function to calculate total threat level for a deck
function calculateTotalThreat(deckCards) {
    let totalThreat = 0;
    
    // Get the current reserve character ID
    const reserveCharacterId = currentDeckData && currentDeckData.metadata && currentDeckData.metadata.reserve_character;
    
    // Get character cards
    const characterCards = deckCards.filter(card => card.type === 'character');
    
    // Get location cards
    const locationCards = deckCards.filter(card => card.type === 'location');
    
    // Calculate threat from characters
    characterCards.forEach(card => {
        const character = availableCardsMap.get(card.cardId);
        if (character && character.threat_level) {
            let threatLevel = character.threat_level;
            
            // Apply reserve character adjustments
            if (card.cardId === reserveCharacterId) {
                // Victory Harben: 18 -> 20 when reserve (+2)
                if (character.name === 'Victory Harben') {
                    threatLevel = 20;
                }
                // Carson of Venus: 18 -> 19 when reserve (+1)
                else if (character.name === 'Carson of Venus') {
                    threatLevel = 19;
                }
                // Morgan Le Fay: 19 -> 20 when reserve (+1)
                else if (character.name === 'Morgan Le Fay') {
                    threatLevel = 20;
                }
            }
            
            totalThreat += threatLevel * card.quantity;
        }
    });
    
    // Calculate threat from locations
    locationCards.forEach(card => {
        const location = availableCardsMap.get(card.cardId);
        if (location && location.threat_level) {
            totalThreat += location.threat_level * card.quantity;
        }
    });
    
    return totalThreat;
}

// Function to update deck title validation badge
function updateDeckTitleValidation(deckCards) {
    const validationBadge = document.getElementById('deckTitleValidationBadge');
    if (!validationBadge) return;

    if (!deckCards || deckCards.length === 0) {
        validationBadge.textContent = '';
        validationBadge.className = 'deck-validation-badge';
        validationBadge.removeAttribute('title');
        validationBadge.onclick = null;
        return;
    }

    // If deck is marked as limited, show Limited state
    if (isDeckLimited) {
        validationBadge.textContent = 'Limited';
        validationBadge.className = 'deck-validation-badge limited';
        validationBadge.removeAttribute('title');
        validationBadge.onclick = toggleLimitedState;
        return;
    }

    const validation = validateDeck(deckCards);
    
    if (validation.errors.length > 0) {
        validationBadge.textContent = 'Not Legal';
        validationBadge.className = 'deck-validation-badge error';
        // Add tooltip with all validation errors
        const tooltipText = validation.errors.join('\n');
        validationBadge.setAttribute('title', tooltipText);
        validationBadge.onclick = toggleLimitedState;
    } else if (validation.warnings.length > 0) {
        validationBadge.textContent = 'Has Warnings';
        validationBadge.className = 'deck-validation-badge warning';
        // Add tooltip with all warnings
        const tooltipText = validation.warnings.join('\n');
        validationBadge.setAttribute('title', tooltipText);
        validationBadge.onclick = toggleLimitedState;
    } else {
        validationBadge.textContent = 'Legal';
        validationBadge.className = 'deck-validation-badge success';
        validationBadge.removeAttribute('title');
        validationBadge.onclick = toggleLimitedState;
    }
}

// Function to toggle limited state
function toggleLimitedState() {
    isDeckLimited = !isDeckLimited;
    updateDeckTitleValidation(deckEditorCards);
}
