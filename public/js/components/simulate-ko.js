/**
 * Simulate KO Feature Module
 * 
 * Encapsulates all KO (Knock Out) functionality for deck editing.
 * Allows authenticated users to mark characters as KO'd, which dims them and
 * any cards that become unusable by the remaining active characters.
 * 
 * Features:
 * - Toggle KO state for characters
 * - Calculate active team stats excluding KO'd characters
 * - Apply visual dimming to KO'd characters and unusable cards
 * - Special rule: Dim teamwork/ally cards when only one character remains
 */

(function() {
    'use strict';

    // Private state
    let koCharacters = new Set();

    /**
     * Initialize KO state (called on page load)
     */
    function init() {
        // Initialize state - always create fresh Set
        koCharacters = new Set();
        // If window.koCharacters already exists, copy its contents
        if (window.koCharacters && window.koCharacters instanceof Set) {
            window.koCharacters.forEach(id => koCharacters.add(id));
        }
        // Keep window.koCharacters in sync for backward compatibility
        window.koCharacters = koCharacters;
    }
    
    /**
     * Sync private state with window.koCharacters for backward compatibility
     */
    function syncState() {
        window.koCharacters = koCharacters;
    }

    /**
     * Get active (non-KO'd) characters from the deck
     * @param {Array} deckCards - Array of deck cards
     * @param {Map} availableCardsMap - Map of available card data
     * @returns {Array} Array of character objects with their stats
     */
    function getActiveCharacters(deckCards, availableCardsMap) {
        const characterCards = deckCards.filter(card => card.type === 'character');
        const activeCharacters = [];
        
        characterCards.forEach(card => {
            // Skip KO'd characters
            if (koCharacters.has(card.cardId)) {
                return;
            }
            
            const characterData = availableCardsMap.get(card.cardId);
            if (characterData) {
                activeCharacters.push({
                    cardId: card.cardId,
                    name: characterData.name || characterData.card_name,
                    energy: characterData.energy || 0,
                    combat: characterData.combat || 0,
                    brute_force: characterData.brute_force || 0,
                    intelligence: characterData.intelligence || 0
                });
            }
        });
        
        return activeCharacters;
    }

    /**
     * Calculate team stats (max values) from active (non-KO'd) characters
     * @param {Array} deckCards - Array of deck cards
     * @param {Map} availableCardsMap - Map of available card data
     * @returns {Object} Object with maxEnergy, maxCombat, maxBruteForce, maxIntelligence
     */
    function calculateActiveTeamStats(deckCards, availableCardsMap) {
        const activeCharacters = getActiveCharacters(deckCards, availableCardsMap);
        
        let maxEnergy = 0;
        let maxCombat = 0;
        let maxBruteForce = 0;
        let maxIntelligence = 0;
        
        activeCharacters.forEach(char => {
            // Apply special-case overrides for power card usability
            const nameLower = (char.name || '').toLowerCase();
            const effectiveEnergy = char.energy || 0;
            const effectiveCombat = char.combat || 0;
            const effectiveBrute = Math.max(char.brute_force || 0, nameLower.includes('john carter') ? 8 : 0);
            const effectiveIntel = Math.max(char.intelligence || 0, nameLower.includes('time traveler') ? 8 : 0);
            
            if (effectiveEnergy > maxEnergy) maxEnergy = effectiveEnergy;
            if (effectiveCombat > maxCombat) maxCombat = effectiveCombat;
            if (effectiveBrute > maxBruteForce) maxBruteForce = effectiveBrute;
            if (effectiveIntel > maxIntelligence) maxIntelligence = effectiveIntel;
        });
        
        return {
            maxEnergy,
            maxCombat,
            maxBruteForce,
            maxIntelligence
        };
    }

    /**
     * Check if a character is KO'd
     * @param {string} cardId - The character card ID
     * @returns {boolean} True if the character is KO'd
     */
    function isKOd(cardId) {
        return koCharacters.has(cardId);
    }

    /**
     * Toggle KO state for a character
     * @param {string} cardId - The character card ID
     * @returns {boolean} True if character is now KO'd, false if un-KO'd
     */
    function toggleKO(cardId) {
        if (koCharacters.has(cardId)) {
            // Un-KO the character
            koCharacters.delete(cardId);
            console.log(`♻️ Un-KO'd character: ${cardId}`);
            syncState();
            return false;
        } else {
            // KO the character
            koCharacters.add(cardId);
            console.log(`💀 KO'd character: ${cardId}`);
            syncState();
            return true;
        }
    }

    /**
     * Remove a character from KO state (cleanup when character is removed from deck)
     * @param {string} cardId - The character card ID
     */
    function removeCharacter(cardId) {
        if (koCharacters.has(cardId)) {
            koCharacters.delete(cardId);
            console.log(`🧹 Removed KO state for character: ${cardId}`);
            syncState();
        }
    }

    /**
     * Apply dimming to cards based on KO'd characters
     * @param {Array} deckCards - Array of deck cards
     * @param {Map} availableCardsMap - Map of available card data
     */
    function applyDimming(deckCards, availableCardsMap) {
        if (koCharacters.size === 0) {
            // No KO'd characters - remove all KO dimming
            document.querySelectorAll('.deck-card-editor-item.ko-dimmed, .deck-card-card-view-item.ko-dimmed, .deck-list-item.ko-dimmed').forEach(element => {
                element.classList.remove('ko-dimmed');
            });
            return;
        }
        
        const activeCharacters = getActiveCharacters(deckCards, availableCardsMap);
        const activeCharacterNames = activeCharacters.map(char => char.name);
        const teamStats = calculateActiveTeamStats(deckCards, availableCardsMap);
        
        // Special rule: If there is at least one KO'd character AND only one non-KO'd character remains
        // (and total characters > 1), dim teamwork and ally cards as they require multiple characters
        const allCharacterCards = deckCards.filter(card => card.type === 'character');
        const totalCharacters = allCharacterCards.length;
        const hasKOdCharacters = koCharacters.size > 0;
        const hasOnlyOneActiveCharacter = activeCharacters.length === 1;
        const shouldDimTeamworkAndAllyForSingleCharacter = totalCharacters > 1 && hasKOdCharacters && hasOnlyOneActiveCharacter;
        
        // Get all deck cards (excluding characters which are handled separately)
        // Handle tile view, card view, and list view
        const deckCardElements = document.querySelectorAll('.deck-card-editor-item[data-card-id], .deck-card-card-view-item[data-card-id], .deck-list-item[data-card-id]');
        
        deckCardElements.forEach(cardElement => {
            const cardId = cardElement.getAttribute('data-card-id');
            const cardType = cardElement.getAttribute('data-type');
            
            if (!cardId) return;
            
            // Skip characters - they're dimmed separately
            if (cardType === 'character') {
                const isKOd = koCharacters.has(cardId);
                if (isKOd) {
                    cardElement.classList.add('ko-dimmed');
                } else {
                    cardElement.classList.remove('ko-dimmed');
                }
                return;
            }
            
            const cardData = availableCardsMap.get(cardId);
            if (!cardData) {
                cardElement.classList.remove('ko-dimmed');
                return;
            }
            
            let shouldDim = false;
            
            // Check if card should be dimmed based on type
            switch (cardType) {
                case 'special':
                    // Dim special cards that are only usable by KO'd characters
                    const characterName = cardData.character || cardData.character_name;
                    const characters = cardData.characters || [];
                    const isAnyCharacter = characterName === 'Any Character' || 
                                         characters.includes('Any Character');
                    
                    if (!isAnyCharacter && characterName) {
                        // Check if this special card belongs to a KO'd character
                        const belongsToKOdCharacter = deckCards.some(deckCard => {
                            if (deckCard.type !== 'character') return false;
                            if (!koCharacters.has(deckCard.cardId)) return false;
                            
                            const charData = availableCardsMap.get(deckCard.cardId);
                            const charName = charData ? (charData.name || charData.card_name) : null;
                            return charName === characterName;
                        });
                        
                        if (belongsToKOdCharacter && !activeCharacterNames.includes(characterName)) {
                            shouldDim = true;
                        }
                    }
                    break;
                    
                case 'advanced-universe':
                case 'advanced_universe':
                    // Dim advanced universe cards that are only usable by KO'd characters
                    const auCharacterName = cardData.character;
                    if (auCharacterName && auCharacterName !== 'Any Character') {
                        const belongsToKOdCharacter = deckCards.some(deckCard => {
                            if (deckCard.type !== 'character') return false;
                            if (!koCharacters.has(deckCard.cardId)) return false;
                            
                            const charData = availableCardsMap.get(deckCard.cardId);
                            const charName = charData ? (charData.name || charData.card_name) : null;
                            return charName === auCharacterName;
                        });
                        
                        if (belongsToKOdCharacter && !activeCharacterNames.includes(auCharacterName)) {
                            shouldDim = true;
                        }
                    }
                    break;
                    
                case 'teamwork':
                    // Special rule: If only one active character remains (and total > 1 with at least one KO'd),
                    // dim all teamwork cards as they require multiple characters
                    if (shouldDimTeamworkAndAllyForSingleCharacter) {
                        console.log('🎯 Dimming teamwork card (special rule):', cardId, cardData.name || cardData.card_name || cardData.card_type);
                        shouldDim = true;
                    } else {
                        // Dim teamwork cards that the remaining team can't use
                        // Teamwork cards use 'to_use' field (e.g., "8 Intelligence", "7 Energy", "6 Any-Power")
                        const toUse = cardData.to_use || '';
                        const toUseMatch = toUse.match(/(\d+)\s+(Energy|Combat|Brute Force|Intelligence|Any-Power)/);
                        
                        if (toUseMatch) {
                            const requiredValue = parseInt(toUseMatch[1]);
                            const requiredType = toUseMatch[2];
                            let canUse = false;
                            
                            if (requiredType === 'Any-Power') {
                                // For Any-Power, check if any active character has max stat >= required value
                                const maxPower = Math.max(
                                    teamStats.maxEnergy,
                                    teamStats.maxCombat,
                                    teamStats.maxBruteForce,
                                    teamStats.maxIntelligence
                                );
                                canUse = maxPower >= requiredValue;
                            } else {
                                // For specific stat types, check if team max meets requirement
                                switch (requiredType) {
                                    case 'Energy':
                                        canUse = teamStats.maxEnergy >= requiredValue;
                                        break;
                                    case 'Combat':
                                        canUse = teamStats.maxCombat >= requiredValue;
                                        break;
                                    case 'Brute Force':
                                        canUse = teamStats.maxBruteForce >= requiredValue;
                                        break;
                                    case 'Intelligence':
                                        canUse = teamStats.maxIntelligence >= requiredValue;
                                        break;
                                }
                            }
                            
                            console.log('🎯 Teamwork card check:', {
                                cardId,
                                cardName: cardData.name || cardData.card_name || cardData.card_type,
                                toUse,
                                requiredType,
                                requiredValue,
                                canUse,
                                teamStats: {
                                    maxIntelligence: teamStats.maxIntelligence,
                                    maxEnergy: teamStats.maxEnergy,
                                    maxCombat: teamStats.maxCombat,
                                    maxBruteForce: teamStats.maxBruteForce
                                }
                            });
                            
                            if (!canUse) {
                                shouldDim = true;
                            }
                        } else {
                            console.warn('⚠️ Could not parse teamwork card to_use:', toUse, 'for card:', cardId);
                        }
                    }
                    break;
                    
                case 'ally-universe':
                case 'ally_universe':
                    // Special rule: If only one active character remains (and total > 1 with at least one KO'd),
                    // dim all ally cards as they require multiple characters
                    if (shouldDimTeamworkAndAllyForSingleCharacter) {
                        console.log('🎯 Dimming ally card (special rule):', cardId, cardData.name || cardData.card_name || cardData.card_type);
                        shouldDim = true;
                    } else {
                        // Dim ally cards that the remaining team can't use
                        // Ally cards use 'stat_to_use' (e.g., "5 or less", "7 or higher") and 'stat_type_to_use' (e.g., "Energy", "Combat")
                        const statToUse = cardData.stat_to_use || '';
                        const statTypeToUse = cardData.stat_type_to_use || '';
                        
                        // Parse the value requirement (e.g., "5 or less", "7 or higher")
                        const valueMatch = statToUse.match(/(\d+) or (less|higher)/);
                        
                        if (valueMatch && statTypeToUse) {
                            const requiredValue = parseInt(valueMatch[1]);
                            const isLessThan = valueMatch[2] === 'less';
                            let canUse = false;
                            
                            // Check if any active character meets the requirement
                            activeCharacters.forEach(char => {
                                if (canUse) return; // Already found one that can use it
                                
                                const availableChar = availableCardsMap.get(char.cardId);
                                if (!availableChar) return;
                                
                                let characterStat = 0;
                                switch (statTypeToUse) {
                                    case 'Energy':
                                        characterStat = availableChar.energy || 0;
                                        break;
                                    case 'Combat':
                                        characterStat = availableChar.combat || 0;
                                        break;
                                    case 'Brute Force':
                                        characterStat = availableChar.brute_force || 0;
                                        break;
                                    case 'Intelligence':
                                        characterStat = availableChar.intelligence || 0;
                                        break;
                                }
                                
                                // Check if the character meets the requirement
                                const usable = isLessThan ? characterStat <= requiredValue : characterStat >= requiredValue;
                                if (usable) {
                                    canUse = true;
                                }
                            });
                            
                            console.log('🎯 Ally card check:', {
                                cardId,
                                cardName: cardData.name || cardData.card_name || cardData.card_type,
                                statToUse,
                                statTypeToUse,
                                requiredValue,
                                isLessThan,
                                canUse,
                                activeCharactersCount: activeCharacters.length
                            });
                            
                            if (!canUse) {
                                shouldDim = true;
                            }
                        } else {
                            console.warn('⚠️ Could not parse ally card stat_to_use:', statToUse, 'or stat_type_to_use:', statTypeToUse, 'for card:', cardId);
                        }
                    }
                    break;
                    
                case 'training':
                    // Dim training cards that the remaining team can't use
                    // Training cards require two stats (type_1 + type_2)
                    const trainingType1 = cardData.type_1;
                    const trainingType2 = cardData.type_2;
                    const trainingValue = parseInt(cardData.value_to_use) || 0;
                    
                    if (trainingType1 && trainingType2 && trainingValue > 0) {
                        let canUse = false;
                        
                        activeCharacters.forEach(char => {
                            const nameLower = (char.name || '').toLowerCase();
                            const effectiveEnergy = char.energy || 0;
                            const effectiveCombat = char.combat || 0;
                            const effectiveBrute = Math.max(char.brute_force || 0, nameLower.includes('john carter') ? 8 : 0);
                            const effectiveIntel = Math.max(char.intelligence || 0, nameLower.includes('time traveler') ? 8 : 0);
                            
                            let type1Stat = 0;
                            let type2Stat = 0;
                            
                            switch (trainingType1) {
                                case 'Energy': type1Stat = effectiveEnergy; break;
                                case 'Combat': type1Stat = effectiveCombat; break;
                                case 'Brute Force': type1Stat = effectiveBrute; break;
                                case 'Intelligence': type1Stat = effectiveIntel; break;
                            }
                            
                            switch (trainingType2) {
                                case 'Energy': type2Stat = effectiveEnergy; break;
                                case 'Combat': type2Stat = effectiveCombat; break;
                                case 'Brute Force': type2Stat = effectiveBrute; break;
                                case 'Intelligence': type2Stat = effectiveIntel; break;
                            }
                            
                            // Card is usable if EITHER type meets the requirement
                            if (type1Stat <= trainingValue || type2Stat <= trainingValue) {
                                canUse = true;
                            }
                        });
                        
                        if (!canUse) {
                            shouldDim = true;
                        }
                    }
                    break;
                    
                case 'basic-universe':
                case 'basic_universe':
                    // Dim basic universe cards that the remaining team can't use
                    const buType = cardData.type;
                    const buValueMatch = (cardData.value_to_use || '').match(/(\d+) or greater/);
                    const buRequiredValue = buValueMatch ? parseInt(buValueMatch[1]) : 0;
                    
                    if (buType && buRequiredValue > 0) {
                        let canUse = false;
                        
                        activeCharacters.forEach(char => {
                            let characterStat = 0;
                            
                            switch (buType) {
                                case 'Energy':
                                    characterStat = char.energy || 0;
                                    break;
                                case 'Combat':
                                    characterStat = char.combat || 0;
                                    break;
                                case 'Brute Force':
                                    characterStat = char.brute_force || 0;
                                    break;
                                case 'Intelligence':
                                    characterStat = char.intelligence || 0;
                                    break;
                            }
                            
                            if (characterStat >= buRequiredValue) {
                                canUse = true;
                            }
                        });
                        
                        if (!canUse) {
                            shouldDim = true;
                        }
                    }
                    break;
                    
                case 'power':
                    // Dim power cards that the remaining team can't play
                    const powerValue = parseInt(cardData.value) || 0;
                    const powerType = cardData.power_type;
                    
                    if (powerType && powerValue > 0) {
                        let canUse = false;
                        
                        activeCharacters.forEach(char => {
                            const nameLower = (char.name || '').toLowerCase();
                            const effectiveEnergy = char.energy || 0;
                            const effectiveCombat = char.combat || 0;
                            const effectiveBrute = Math.max(char.brute_force || 0, nameLower.includes('john carter') ? 8 : 0);
                            const effectiveIntel = Math.max(char.intelligence || 0, nameLower.includes('time traveler') ? 8 : 0);
                            
                            let characterStat = 0;
                            
                            switch (powerType) {
                                case 'Energy':
                                    characterStat = effectiveEnergy;
                                    break;
                                case 'Combat':
                                    characterStat = effectiveCombat;
                                    break;
                                case 'Brute Force':
                                    characterStat = effectiveBrute;
                                    break;
                            case 'Intelligence':
                                characterStat = effectiveIntel;
                                break;
                            case 'Any-Power':
                                characterStat = Math.max(effectiveEnergy, effectiveCombat, effectiveBrute, effectiveIntel);
                                break;
                            case 'Multi-Power':
                            case 'Multi Power':
                                // Multi-Power requires sum of two highest stats
                                const stats = [effectiveEnergy, effectiveCombat, effectiveBrute, effectiveIntel].sort((a, b) => b - a);
                                characterStat = (stats[0] || 0) + (stats[1] || 0);
                                break;
                            }
                            
                            if (characterStat >= powerValue) {
                                canUse = true;
                            }
                        });
                        
                        if (!canUse) {
                            shouldDim = true;
                        }
                    }
                    break;
            }
            
            // Apply or remove dimming
            if (shouldDim) {
                cardElement.classList.add('ko-dimmed');
            } else {
                cardElement.classList.remove('ko-dimmed');
            }
        });
    }

    /**
     * Check if a single card should be dimmed based on KO'd characters
     * @param {Object} card - The card object (from deckEditorCards)
     * @param {Map} availableCardsMap - Map of available card data
     * @param {Array} deckCards - All deck cards (for context)
     * @returns {boolean} True if card should be dimmed
     */
    function shouldDimCard(card, availableCardsMap, deckCards) {
        // If no KO'd characters, nothing should be dimmed
        if (koCharacters.size === 0) {
            return false;
        }
        
        const cardId = card.cardId;
        const cardType = card.type;
        const cardData = availableCardsMap.get(cardId);
        
        if (!cardData) {
            return false;
        }
        
        // Get active characters and team stats
        const activeCharacters = getActiveCharacters(deckCards, availableCardsMap);
        const teamStats = calculateActiveTeamStats(deckCards, availableCardsMap);
        const activeCharacterNames = activeCharacters.map(char => char.name);
        
        // Special rule: If only one active character remains (and total > 1 with at least one KO'd),
        // dim teamwork and ally cards as they require multiple characters
        const allCharacterCards = deckCards.filter(c => c.type === 'character');
        const totalCharacters = allCharacterCards.length;
        const hasKOdCharacters = koCharacters.size > 0;
        const hasOnlyOneActiveCharacter = activeCharacters.length === 1;
        const shouldDimTeamworkAndAllyForSingleCharacter = totalCharacters > 1 && hasKOdCharacters && hasOnlyOneActiveCharacter;
        
        let shouldDim = false;
        
        // Check if card should be dimmed based on type
        switch (cardType) {
            case 'character':
                // Characters are dimmed if they're KO'd
                return koCharacters.has(cardId);
                
            case 'special':
                // Dim special cards that are only usable by KO'd characters
                const characterName = cardData.character || cardData.character_name;
                const characters = cardData.characters || [];
                const isAnyCharacter = characterName === 'Any Character' || 
                                     characters.includes('Any Character');
                
                if (!isAnyCharacter && characterName) {
                    const belongsToKOdCharacter = deckCards.some(deckCard => {
                        if (deckCard.type !== 'character') return false;
                        if (!koCharacters.has(deckCard.cardId)) return false;
                        
                        const charData = availableCardsMap.get(deckCard.cardId);
                        const charName = charData ? (charData.name || charData.card_name) : null;
                        return charName === characterName;
                    });
                    
                    if (belongsToKOdCharacter && !activeCharacterNames.includes(characterName)) {
                        shouldDim = true;
                    }
                }
                break;
                
            case 'advanced-universe':
            case 'advanced_universe':
                // Dim advanced universe cards that are only usable by KO'd characters
                const auCharacterName = cardData.character;
                if (auCharacterName && auCharacterName !== 'Any Character') {
                    const belongsToKOdCharacter = deckCards.some(deckCard => {
                        if (deckCard.type !== 'character') return false;
                        if (!koCharacters.has(deckCard.cardId)) return false;
                        
                        const charData = availableCardsMap.get(deckCard.cardId);
                        const charName = charData ? (charData.name || charData.card_name) : null;
                        return charName === auCharacterName;
                    });
                    
                    if (belongsToKOdCharacter && !activeCharacterNames.includes(auCharacterName)) {
                        shouldDim = true;
                    }
                }
                break;
                
            case 'teamwork':
                // Special rule: If only one active character remains, dim all teamwork cards
                if (shouldDimTeamworkAndAllyForSingleCharacter) {
                    shouldDim = true;
                } else {
                    // Dim teamwork cards that the remaining team can't use
                    const toUse = cardData.to_use || '';
                    const toUseMatch = toUse.match(/(\d+)\s+(Energy|Combat|Brute Force|Intelligence|Any-Power)/);
                    
                    if (toUseMatch) {
                        const requiredValue = parseInt(toUseMatch[1]);
                        const requiredType = toUseMatch[2];
                        let canUse = false;
                        
                        if (requiredType === 'Any-Power') {
                            const maxPower = Math.max(
                                teamStats.maxEnergy,
                                teamStats.maxCombat,
                                teamStats.maxBruteForce,
                                teamStats.maxIntelligence
                            );
                            canUse = maxPower >= requiredValue;
                        } else {
                            switch (requiredType) {
                                case 'Energy':
                                    canUse = teamStats.maxEnergy >= requiredValue;
                                    break;
                                case 'Combat':
                                    canUse = teamStats.maxCombat >= requiredValue;
                                    break;
                                case 'Brute Force':
                                    canUse = teamStats.maxBruteForce >= requiredValue;
                                    break;
                                case 'Intelligence':
                                    canUse = teamStats.maxIntelligence >= requiredValue;
                                    break;
                            }
                        }
                        
                        if (!canUse) {
                            shouldDim = true;
                        }
                    }
                }
                break;
                
            case 'ally-universe':
            case 'ally_universe':
                // Special rule: If only one active character remains, dim all ally cards
                if (shouldDimTeamworkAndAllyForSingleCharacter) {
                    shouldDim = true;
                } else {
                    // Dim ally cards that the remaining team can't use
                    const statToUse = cardData.stat_to_use || '';
                    const statTypeToUse = cardData.stat_type_to_use || '';
                    const valueMatch = statToUse.match(/(\d+) or (less|higher)/);
                    
                    if (valueMatch && statTypeToUse) {
                        const requiredValue = parseInt(valueMatch[1]);
                        const isLessThan = valueMatch[2] === 'less';
                        let canUse = false;
                        
                        activeCharacters.forEach(char => {
                            if (canUse) return;
                            
                            const availableChar = availableCardsMap.get(char.cardId);
                            if (!availableChar) return;
                            
                            let characterStat = 0;
                            switch (statTypeToUse) {
                                case 'Energy':
                                    characterStat = availableChar.energy || 0;
                                    break;
                                case 'Combat':
                                    characterStat = availableChar.combat || 0;
                                    break;
                                case 'Brute Force':
                                    characterStat = availableChar.brute_force || 0;
                                    break;
                                case 'Intelligence':
                                    characterStat = availableChar.intelligence || 0;
                                    break;
                            }
                            
                            const usable = isLessThan ? characterStat <= requiredValue : characterStat >= requiredValue;
                            if (usable) {
                                canUse = true;
                            }
                        });
                        
                        if (!canUse) {
                            shouldDim = true;
                        }
                    }
                }
                break;
                
            case 'training':
                // Dim training cards that the remaining team can't use
                const trainingType1 = cardData.type_1;
                const trainingType2 = cardData.type_2;
                const trainingValue = parseInt(cardData.value_to_use) || 0;
                
                if (trainingType1 && trainingType2 && trainingValue > 0) {
                    let canUse = false;
                    
                    activeCharacters.forEach(char => {
                        const nameLower = (char.name || '').toLowerCase();
                        const effectiveEnergy = char.energy || 0;
                        const effectiveCombat = char.combat || 0;
                        const effectiveBrute = Math.max(char.brute_force || 0, nameLower.includes('john carter') ? 8 : 0);
                        const effectiveIntel = Math.max(char.intelligence || 0, nameLower.includes('time traveler') ? 8 : 0);
                        
                        let type1Stat = 0;
                        let type2Stat = 0;
                        
                        switch (trainingType1) {
                            case 'Energy': type1Stat = effectiveEnergy; break;
                            case 'Combat': type1Stat = effectiveCombat; break;
                            case 'Brute Force': type1Stat = effectiveBrute; break;
                            case 'Intelligence': type1Stat = effectiveIntel; break;
                        }
                        
                        switch (trainingType2) {
                            case 'Energy': type2Stat = effectiveEnergy; break;
                            case 'Combat': type2Stat = effectiveCombat; break;
                            case 'Brute Force': type2Stat = effectiveBrute; break;
                            case 'Intelligence': type2Stat = effectiveIntel; break;
                        }
                        
                        if (type1Stat <= trainingValue || type2Stat <= trainingValue) {
                            canUse = true;
                        }
                    });
                    
                    if (!canUse) {
                        shouldDim = true;
                    }
                }
                break;
                
            case 'basic-universe':
            case 'basic_universe':
                // Dim basic universe cards that the remaining team can't use
                const buType = cardData.type;
                const buValueMatch = (cardData.value_to_use || '').match(/(\d+) or greater/);
                const buRequiredValue = buValueMatch ? parseInt(buValueMatch[1]) : 0;
                
                if (buType && buRequiredValue > 0) {
                    let canUse = false;
                    
                    activeCharacters.forEach(char => {
                        let characterStat = 0;
                        
                        switch (buType) {
                            case 'Energy':
                                characterStat = char.energy || 0;
                                break;
                            case 'Combat':
                                characterStat = char.combat || 0;
                                break;
                            case 'Brute Force':
                                characterStat = char.brute_force || 0;
                                break;
                            case 'Intelligence':
                                characterStat = char.intelligence || 0;
                                break;
                        }
                        
                        if (characterStat >= buRequiredValue) {
                            canUse = true;
                        }
                    });
                    
                    if (!canUse) {
                        shouldDim = true;
                    }
                }
                break;
                
            case 'power':
                // Dim power cards that the remaining team can't play
                const powerValue = parseInt(cardData.value) || 0;
                const powerType = cardData.power_type;
                
                if (powerType && powerValue > 0) {
                    let canUse = false;
                    
                    activeCharacters.forEach(char => {
                        const nameLower = (char.name || '').toLowerCase();
                        const effectiveEnergy = char.energy || 0;
                        const effectiveCombat = char.combat || 0;
                        const effectiveBrute = Math.max(char.brute_force || 0, nameLower.includes('john carter') ? 8 : 0);
                        const effectiveIntel = Math.max(char.intelligence || 0, nameLower.includes('time traveler') ? 8 : 0);
                        
                        let characterStat = 0;
                        
                        switch (powerType) {
                            case 'Energy':
                                characterStat = effectiveEnergy;
                                break;
                            case 'Combat':
                                characterStat = effectiveCombat;
                                break;
                            case 'Brute Force':
                                characterStat = effectiveBrute;
                                break;
                            case 'Intelligence':
                                characterStat = effectiveIntel;
                                break;
                            case 'Any-Power':
                                characterStat = Math.max(effectiveEnergy, effectiveCombat, effectiveBrute, effectiveIntel);
                                break;
                            case 'Multi-Power':
                            case 'Multi Power':
                                // Multi-Power requires sum of two highest stats
                                const stats = [effectiveEnergy, effectiveCombat, effectiveBrute, effectiveIntel].sort((a, b) => b - a);
                                characterStat = (stats[0] || 0) + (stats[1] || 0);
                                break;
                        }
                        
                        if (characterStat >= powerValue) {
                            canUse = true;
                        }
                    });
                    
                    if (!canUse) {
                        shouldDim = true;
                    }
                }
                break;
        }
        
        return shouldDim;
    }

    // Public API
    window.SimulateKO = {
        /**
         * Initialize the KO feature
         */
        init: init,

        /**
         * Check if a character is KO'd
         * @param {string} cardId - The character card ID
         * @returns {boolean} True if KO'd
         */
        isKOd: isKOd,

        /**
         * Check if a card should be dimmed based on KO'd characters
         * @param {Object} card - The card object (from deckEditorCards)
         * @param {Map} availableCardsMap - Map of available card data
         * @param {Array} deckCards - All deck cards (for context)
         * @returns {boolean} True if card should be dimmed
         */
        shouldDimCard(card, availableCardsMap, deckCards) {
            return shouldDimCard(card, availableCardsMap, deckCards);
        },

        /**
         * Toggle KO state for a character and trigger re-render
         * @param {string} cardId - The character card ID
         * @param {number} index - The index of the character in deckEditorCards
         * @param {Object} renderFunctions - Object with render functions: { renderCardView, renderListView, renderTileView }
         */
        async toggleKOCharacter(cardId, index, renderFunctions) {
            try {
                // Check both window.currentUser and global currentUser (which is a let variable in index.html)
                const user = window.currentUser || (typeof currentUser !== 'undefined' ? currentUser : null);
                // KO feature is available to all authenticated users
                if (!user) {
                    return;
                }
                
                // Toggle KO state (syncState is called inside toggleKO)
                toggleKO(cardId);
                
                // Preserve current view when re-rendering
                const deckCardsEditor = document.querySelector('.deck-cards-editor');
                
                // Re-render the deck in the current view mode to update button states and apply dimming
                if (deckCardsEditor && deckCardsEditor.classList.contains('card-view')) {
                    // Card View: re-render Card View
                    if (renderFunctions && renderFunctions.renderCardView) {
                        renderFunctions.renderCardView();
                    }
                } else if (deckCardsEditor && deckCardsEditor.classList.contains('list-view')) {
                    // List View: re-render List View
                    if (renderFunctions && renderFunctions.renderListView) {
                        renderFunctions.renderListView();
                    }
                } else {
                    // Tile View (default): re-render Tile View
                    if (renderFunctions && renderFunctions.renderTileView) {
                        await renderFunctions.renderTileView();
                    }
                }
                
                // Apply dimming after re-render
                setTimeout(() => {
                    applyDimming(window.deckEditorCards || [], window.availableCardsMap || new Map());
                    // Refresh draw hand if it's currently displayed
                    // Use Draw Hand module if available, otherwise fall back to global function
                    if (window.DrawHand && window.DrawHand.refresh) {
                        window.DrawHand.refresh();
                    } else if (window.drawnCards && window.drawnCards.length > 0 && typeof displayDrawnCards === 'function') {
                        displayDrawnCards(window.drawnCards);
                    }
                }, 100);
            } catch (error) {
                console.error('❌ Error in SimulateKO.toggleKOCharacter:', error);
                throw error;
            }
        },

        /**
         * Apply dimming to cards based on KO'd characters
         */
        applyDimming() {
            applyDimming(window.deckEditorCards || [], window.availableCardsMap || new Map());
        },

        /**
         * Remove a character from KO state (cleanup)
         * @param {string} cardId - The character card ID
         */
        removeCharacter: removeCharacter,

        /**
         * Get active characters (for external use if needed)
         * @returns {Array} Array of active character objects
         */
        getActiveCharacters() {
            return getActiveCharacters(window.deckEditorCards || [], window.availableCardsMap || new Map());
        },

        /**
         * Calculate active team stats (for external use if needed)
         * @returns {Object} Object with team stats
         */
        calculateActiveTeamStats() {
            return calculateActiveTeamStats(window.deckEditorCards || [], window.availableCardsMap || new Map());
        }
    };

    // Initialize on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            init();
        });
    } else {
        init();
    }
})();

