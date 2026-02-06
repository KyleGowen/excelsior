// deck-validation.js - Deck validation, limits, and statistics
// Extracted from public/index.html

// ===== calculateIconTotals, updateDeckSummary, showDeckValidation =====

function calculateIconTotals(deckCards) {
    const totals = {
        'Energy': 0,
        'Combat': 0,
        'Brute Force': 0,
        'Intelligence': 0
    };
    
    const iconTypes = ['Energy', 'Combat', 'Brute Force', 'Intelligence'];
    
    // Only process card types that should contribute to icon totals
    const allowedTypes = ['special', 'aspect', 'ally-universe', 'ally_universe', 'teamwork', 'power'];
    
    deckCards.forEach(card => {
        // Skip card types that don't contribute to icon totals
        if (!allowedTypes.includes(card.type)) {
            return;
        }
        
        const availableCard = window.availableCardsMap.get(card.cardId);
        if (!availableCard) return;
        
        const quantity = card.quantity || 1;
        let icons = [];
        
        // Determine icons based on card type, using same logic as list view
        if (card.type === 'power') {
            // Power cards: use power_type field
            const type = String(availableCard.power_type || '').trim();
            const isMulti = /multi\s*-?power/i.test(type);
            
            if (type === 'Any-Power') {
                // Any-Power doesn't count toward icon totals
                icons = [];
            } else if (isMulti) {
                // Multi Power counts as all 4 types
                icons = ['Energy', 'Combat', 'Brute Force', 'Intelligence'];
            } else {
                // Single type power card
                const matchedType = iconTypes.find(t => t === type);
                if (matchedType) {
                    icons = [matchedType];
                }
            }
        } else if (card.type === 'teamwork') {
            // Teamwork cards: use to_use field
            const src = String(availableCard.to_use || '');
            const isAny = /Any-?Power/i.test(src);
            
            if (isAny) {
                // Any-Power doesn't count toward icon totals
                icons = [];
            } else {
                // Match Energy, Combat, Brute Force, Intelligence from to_use string
                icons = iconTypes.filter(t => {
                    const regex = new RegExp(t, 'i');
                    return regex.test(src);
                });
            }
        } else if (card.type === 'ally-universe' || card.type === 'ally_universe') {
            // Ally-universe cards: use stat_type_to_use field
            const src = String(availableCard.stat_type_to_use || '');
            const matchedType = iconTypes.find(t => {
                const regex = new RegExp(t, 'i');
                return regex.test(src);
            });
            if (matchedType) {
                icons = [matchedType];
            }
        } else {
            // For other card types (special, aspect, etc.): use icons array
            icons = Array.isArray(availableCard.icons) ? availableCard.icons : [];
            // Filter to only count the 4 main icon types
            icons = icons.filter(icon => iconTypes.includes(icon));
        }
        
        // Count each icon type, multiplied by quantity
        icons.forEach(icon => {
            if (totals.hasOwnProperty(icon)) {
                totals[icon] += quantity;
            }
        });
    });
    
    return totals;
}

// Function to update deck summary with stats and validation
async function updateDeckSummary(deckCards) {
    // DEBUG: Check font sizes after update and force apply
    setTimeout(() => {
        const statLabels = document.querySelectorAll('.deck-summary-stats .stat-label');
        const statValues = document.querySelectorAll('.deck-summary-stats .stat-value');
        if (statLabels.length > 0) {
            // Force apply font size to ALL labels
            statLabels.forEach(l => {
                l.style.setProperty('font-size', '0.65rem', 'important');
            });
        }
        if (statValues.length > 0) {
            // Force apply font size to ALL values
            statValues.forEach(v => {
                v.style.setProperty('font-size', '0.85rem', 'important');
            });
        }
    }, 100);
    
    // Update total card count using shared function
    const totalCards = calculateTotalCardCount(deckCards);
    
    // Check if deck size is invalid to determine display format
    const eventCards = deckCards.filter(card => card.type === 'event');
    const hasEvents = eventCards.length > 0;
    const minSize = hasEvents ? DECK_RULES.MIN_DECK_SIZE_WITH_EVENTS : DECK_RULES.MIN_DECK_SIZE;
    
    let totalCardsDisplay;
    if (totalCards < minSize) {
        totalCardsDisplay = `${totalCards}/${minSize}`;
    } else {
        totalCardsDisplay = totalCards.toString();
    }
    
    document.getElementById('deckTotalCards').textContent = totalCardsDisplay;
    
    // Enable/disable Draw Hand button based on playable cards
    // Use Draw Hand module if available, otherwise use original implementation
    if (window.DrawHand && window.DrawHand.updateButtonState) {
        window.DrawHand.updateButtonState(deckCards);
    } else {
        // Fallback to original implementation (for backward compatibility during transition)
        const drawHandBtn = document.getElementById('drawHandBtn');
        
        if (drawHandBtn) {
            // Count playable cards (excluding characters, locations, missions)
            const playableCardsCount = deckCards
                .filter(card => card.type !== 'character' && card.type !== 'location' && card.type !== 'mission')
                .reduce((sum, card) => sum + card.quantity, 0);
            
            
            if (playableCardsCount >= 8) {
                drawHandBtn.disabled = false;
                drawHandBtn.style.opacity = "1";
                drawHandBtn.style.cursor = "pointer";
                drawHandBtn.title = ""; // Remove tooltip when enabled
            } else {
                drawHandBtn.disabled = true;
                drawHandBtn.style.opacity = "0.5";
                drawHandBtn.style.cursor = "not-allowed";
                drawHandBtn.title = "Deck must contain at least 8 playable cards."; // Add tooltip when disabled
            }
            
        }
    }            
    // Calculate maximum character stats and total threat level
    const characterCards = deckCards.filter(card => card.type === 'character');
    const locationCards = deckCards.filter(card => card.type === 'location');
    let maxEnergy = 0, maxCombat = 0, maxBruteForce = 0, maxIntelligence = 0;
    
    // Calculate character stats
    if (characterCards.length > 0) {
        characterCards.forEach(card => {
            const characterData = window.availableCardsMap.get(card.cardId);
            if (characterData) {
                if (characterData.energy > maxEnergy) maxEnergy = characterData.energy;
                if (characterData.combat > maxCombat) maxCombat = characterData.combat;
                if (characterData.brute_force > maxBruteForce) maxBruteForce = characterData.brute_force;
                if (characterData.intelligence > maxIntelligence) maxIntelligence = characterData.intelligence;
            }
        });
    }
    
    // Use the shared calculateTotalThreat function for consistent threat calculation
    const totalThreat = calculateTotalThreat(deckCards);
    
    document.getElementById('deckMaxEnergy').textContent = maxEnergy;
    document.getElementById('deckMaxCombat').textContent = maxCombat;
    document.getElementById('deckMaxBruteForce').textContent = maxBruteForce;
    document.getElementById('deckMaxIntelligence').textContent = maxIntelligence;
    
    // Display total threat with denominator if it exceeds maximum
    let totalThreatDisplay;
    if (totalThreat > DECK_RULES.MAX_TOTAL_THREAT) {
        totalThreatDisplay = `${totalThreat}/${DECK_RULES.MAX_TOTAL_THREAT}`;
    } else {
        totalThreatDisplay = totalThreat.toString();
    }
    document.getElementById('deckTotalThreat').textContent = totalThreatDisplay;
    
    // Calculate total icon counts
    const iconTotals = calculateIconTotals(deckCards);
    document.getElementById('deckTotalEnergy').textContent = iconTotals.Energy || 0;
    document.getElementById('deckTotalCombat').textContent = iconTotals.Combat || 0;
    document.getElementById('deckTotalBruteForce').textContent = iconTotals['Brute Force'] || 0;
    document.getElementById('deckTotalIntelligence').textContent = iconTotals.Intelligence || 0;
    
    // Update validation in summary
    // Validation errors are now shown in tooltips on the deck title badge
    // Clear any existing validation display in the summary
    const summaryValidationContainer = document.getElementById('deckSummaryValidation');
    if (summaryValidationContainer) {
        summaryValidationContainer.innerHTML = '';
    }
}

// Function to show deck validation results
async function showDeckValidation(deckCards) {
    // Update the deck summary (this now handles all validation display)
    await updateDeckSummary(deckCards);
    
    // Update the deck title validation badge
    updateDeckTitleValidation(deckCards);
    
    // Always allow saving, but show validation status
    const saveButton = document.querySelector('.deck-editor-actions .save-btn');
    if (saveButton) {
        saveButton.disabled = false;
        saveButton.textContent = 'Save';
    }
}


// ===== updateDeckEditorCardCount =====

function updateDeckEditorCardCount() {
    const totalCards = window.deckEditorCards.reduce((total, card) => total + card.quantity, 0);
    const characterCount = window.deckEditorCards.filter(card => card.type === 'character').length;
    const powerCardCount = window.deckEditorCards.filter(card => card.type === 'power').reduce((total, card) => total + card.quantity, 0);
    const specialCardCount = window.deckEditorCards.filter(card => card.type === 'special').reduce((total, card) => total + card.quantity, 0);
    
    // Update any card count displays in the deck editor
    const cardCountElements = document.querySelectorAll('.deck-card-count');
    cardCountElements.forEach(element => {
        element.textContent = totalCards;
    });
    
}


// ===== updateCharacterLimitStatus through updateAmbushLimitStatus =====

function updateCharacterLimitStatus() {
    const characterCards = document.querySelectorAll('.card-item.character-card');
    const uniqueCharacterCount = window.deckEditorCards
        .filter(card => card.type === 'character')
        .length;
    
    characterCards.forEach((card, index) => {
        try {
            const cardId = card.dataset.id;
            const cardName = card.querySelector('.character-name')?.textContent?.trim() || 'Unknown';
            
            // Check if this specific card OR any alternate art is in the deck
            // Get all cards in the group from data-all-cards attribute
            const allCardsJson = card.getAttribute('data-all-cards');
            let isExistingCharacter = false;
            
            if (allCardsJson && allCardsJson.trim() !== '') {
                try {
                    const allCards = JSON.parse(allCardsJson.replace(/&quot;/g, '"'));
                    // Check if any card in the group (all alternate arts) is in the deck
                    isExistingCharacter = window.deckEditorCards.some(deckCard => 
                        deckCard.type === 'character' && allCards.some(ac => ac.id === deckCard.cardId)
                    );
                } catch (e) {
                    // Fallback to checking just this card ID
                    isExistingCharacter = window.deckEditorCards.some(deckCard => 
                        deckCard.type === 'character' && deckCard.cardId === cardId
                    );
                }
            } else {
                // Fallback: check just this card ID
                isExistingCharacter = window.deckEditorCards.some(deckCard => 
                    deckCard.type === 'character' && deckCard.cardId === cardId
                );
            }
        
            // Disable if we have 4 different characters OR if this character (or any alternate art) is already in the deck
            const shouldDisable = uniqueCharacterCount >= 4 || isExistingCharacter;
        
            if (shouldDisable) {
                card.classList.add('disabled');
                card.setAttribute('draggable', 'false');
                if (isExistingCharacter) {
                    card.title = 'This character is already in your deck';
                } else {
                    card.title = 'Character limit reached (max 4 different characters)';
                }
            } else {
                card.classList.remove('disabled');
                card.setAttribute('draggable', 'true');
                card.title = '';
            }
        } catch (error) {
            console.error(`Error processing character card ${index + 1}:`, error);
        }
    });
}

// Function to update just the location limit status without affecting collapse state
function updateLocationLimitStatus() {
    const locationCards = document.querySelectorAll('.card-item.location-card');
    const currentLocationCount = window.deckEditorCards
        .filter(card => card.type === 'location')
        .length;
    
    locationCards.forEach((card, index) => {
        try {
            const cardId = card.dataset.id;
            const cardName = card.querySelector('.location-name')?.textContent?.trim() || 'Unknown';
            
            const isExistingLocation = window.deckEditorCards.some(deckCard => 
                deckCard.type === 'location' && deckCard.cardId === cardId
            );
        
            // Disable if we have 1 location OR if this location is already in the deck
            const shouldDisable = currentLocationCount >= 1 || isExistingLocation;
        
            if (shouldDisable) {
                card.classList.add('disabled');
                card.setAttribute('draggable', 'false');
                if (isExistingLocation) {
                    card.title = 'This location is already in your deck';
                } else {
                    card.title = 'Location limit reached (max 1 location)';
                }
            } else {
                card.classList.remove('disabled');
                card.setAttribute('draggable', 'true');
                card.title = '';
            }
        } catch (error) {
            console.error(`Error processing location card ${index + 1}:`, error);
        }
    });
}


// Function to update just the mission limit status without affecting collapse state
function updateMissionLimitStatus() {
    const missionCards = document.querySelectorAll('.card-item[data-type="mission"]');
    const currentMissionCount = window.deckEditorCards
        .filter(card => card.type === 'mission')
        .reduce((total, card) => total + card.quantity, 0);
    
    const isMissionLimitReached = currentMissionCount >= 7;
    
    missionCards.forEach(card => {
        if (isMissionLimitReached) {
            card.classList.add('disabled');
            card.setAttribute('draggable', 'false');
            card.title = 'Mission limit reached (max 7)';
        } else {
            card.classList.remove('disabled');
            card.setAttribute('draggable', 'true');
            card.title = '';
        }
    });
}

// Helper function to generate OPD key that groups all art versions
function getOPDKeyForDimming(cardData, cardType) {
    if (!cardData) return null;
    
    // For special cards, use name + character_name + universe to group all art versions
    if (cardType === 'special' && cardData.character_name) {
        const universe = cardData.universe || 'ERB';
        return `${cardType}_${cardData.name}_${cardData.character_name}_${universe}`;
    }
    
    // For other cards, use name + universe to group all art versions
    const name = cardData.name || cardData.card_name || '';
    const universe = cardData.universe || '';
    if (universe) {
        return `${cardType}_${name}_${universe}`;
    }
    return `${cardType}_${name}`;
}

// Function to update One Per Deck card dimming status
function updateOnePerDeckLimitStatus() {
    // Get all One Per Deck cards currently in the deck (using OPD keys to group art versions)
    const onePerDeckKeysInDeck = new Set();
    window.deckEditorCards.forEach(card => {
        let cardData = window.availableCardsMap.get(card.cardId);
        
        // Try alternate key formats for universe cards if direct lookup fails
        if (!cardData && (card.type === 'basic-universe' || card.type === 'basic_universe' || 
                          card.type === 'ally-universe' || card.type === 'ally_universe' ||
                          card.type === 'advanced-universe' || card.type === 'advanced_universe')) {
            const normalizedType = (card.type === 'basic_universe' || card.type === 'basic-universe') ? 'basic-universe' : 
                                  (card.type === 'ally_universe' || card.type === 'ally-universe') ? 'ally-universe' :
                                  'advanced-universe';
            cardData = window.availableCardsMap.get(`${normalizedType}_${card.cardId}`) ||
                      window.availableCardsMap.get(`${card.type}_${card.cardId}`);
        }
        
        if (cardData && (cardData.one_per_deck === true || cardData.is_one_per_deck === true)) {
            const opdKey = getOPDKeyForDimming(cardData, card.type);
            if (opdKey) {
                onePerDeckKeysInDeck.add(opdKey);
            }
        }
    });
    
    // Update all card items for all card types
    const allCardItems = document.querySelectorAll('.card-item[data-id]');
    
    allCardItems.forEach(cardElement => {
        const cardId = cardElement.getAttribute('data-id');
        const cardType = cardElement.getAttribute('data-type');
        
        if (cardId) {
            let cardData = window.availableCardsMap.get(cardId);
            
            // Try alternate key formats for universe cards if direct lookup fails
            if (!cardData && (cardType === 'basic-universe' || cardType === 'basic_universe' || 
                              cardType === 'ally-universe' || cardType === 'ally_universe' ||
                              cardType === 'advanced-universe' || cardType === 'advanced_universe')) {
                const normalizedType = (cardType === 'basic_universe' || cardType === 'basic-universe') ? 'basic-universe' : 
                                      (cardType === 'ally_universe' || cardType === 'ally-universe') ? 'ally-universe' :
                                      'advanced-universe';
                cardData = window.availableCardsMap.get(`${normalizedType}_${cardId}`) ||
                          window.availableCardsMap.get(`${cardType}_${cardId}`);
            }
            
            const isOnePerDeck = cardData && (cardData.one_per_deck === true || cardData.is_one_per_deck === true);
            const opdKey = isOnePerDeck ? getOPDKeyForDimming(cardData, cardType) : null;
            const isInDeck = opdKey ? onePerDeckKeysInDeck.has(opdKey) : false;
            
            // For basic-universe cards, also check if the card is in deckEditorCards by matching cardId and type
            let isBasicUniverseInDeck = false;
            if (cardType === 'basic-universe' || cardType === 'basic_universe') {
                isBasicUniverseInDeck = window.deckEditorCards.some(deckCard => 
                    (deckCard.type === 'basic-universe' || deckCard.type === 'basic_universe') && 
                    deckCard.cardId === cardId
                );
            }
            
            if (isOnePerDeck && isInDeck) {
                // This is a One Per Deck card that's already in the deck - dim it
                if (!cardElement.classList.contains('disabled')) {
                    cardElement.classList.add('disabled');
                    cardElement.setAttribute('draggable', 'false');
                    cardElement.title = 'One Per Deck - already in deck';
                }
            } else if (cardType !== 'character' && cardType !== 'mission' && cardType !== 'location') {
                // Only update non-character/non-mission/non-location cards here
                // Character, mission, and location dimming is handled by updateCharacterLimitStatus(), updateMissionLimitStatus(), and updateLocationLimitStatus()
                
                // CRITICAL: For special cards, check if they should remain disabled for OTHER reasons
                // (Assist, Ambush, Cataclysm) before removing the disabled class
                if (cardType === 'special' && cardData) {
                    // Check if this special card should remain disabled for Assist/Ambush/Cataclysm reasons
                    const shouldRemainDisabled = shouldSpecialCardBeDisabled(cardId, cardData);
                    if (cardElement.classList.contains('disabled') && !shouldRemainDisabled) {
                        // Only un-dim if it's not disabled for other reasons
                        cardElement.classList.remove('disabled');
                        cardElement.setAttribute('draggable', 'true');
                        cardElement.title = '';
                    }
                } else if (cardElement.classList.contains('disabled')) {
                    // For non-special cards, un-dim normally
                    cardElement.classList.remove('disabled');
                    cardElement.setAttribute('draggable', 'true');
                    cardElement.title = '';
                }
            }
        }
    });
}

// Helper function to check if a special card should be disabled for ANY reason
// This must be defined BEFORE the dimming functions that use it
function shouldSpecialCardBeDisabled(cardId, cardData) {
    if (!cardData) return false;
    
    // Check Assist limit
    const assistCardsInDeck = new Set();
    window.deckEditorCards.forEach(card => {
        const deckCardData = window.availableCardsMap.get(card.cardId);
        if (deckCardData && deckCardData.is_assist === true) {
            assistCardsInDeck.add(card.cardId);
        }
    });
    const isAssist = cardData.is_assist === true;
    const isAssistInDeck = assistCardsInDeck.has(cardId);
    const hasOtherAssist = assistCardsInDeck.size > 0;
    if (isAssist && (isAssistInDeck || hasOtherAssist)) {
        return true;
    }
    
    // Check Ambush limit
    const ambushCardsInDeck = new Set();
    window.deckEditorCards.forEach(card => {
        const deckCardData = window.availableCardsMap.get(card.cardId);
        if (deckCardData && deckCardData.is_ambush === true) {
            ambushCardsInDeck.add(card.cardId);
        }
    });
    const isAmbush = cardData.is_ambush === true;
    const isAmbushInDeck = ambushCardsInDeck.has(cardId);
    const hasOtherAmbush = ambushCardsInDeck.size > 0;
    if (isAmbush && (isAmbushInDeck || hasOtherAmbush)) {
        return true;
    }
    
    // Check Cataclysm limit
    const cataclysmCardsInDeck = new Set();
    window.deckEditorCards.forEach(card => {
        const deckCardData = window.availableCardsMap.get(card.cardId);
        if (deckCardData && deckCardData.is_cataclysm === true) {
            cataclysmCardsInDeck.add(card.cardId);
        }
    });
    const isCataclysm = cardData.is_cataclysm === true;
    const isCataclysmInDeck = cataclysmCardsInDeck.has(cardId);
    const hasOtherCataclysm = cataclysmCardsInDeck.size > 0;
    if (isCataclysm && (isCataclysmInDeck || hasOtherCataclysm)) {
        return true;
    }
    
    return false;
}

// Function to update Cataclysm card dimming status
function updateCataclysmLimitStatus() {
    // Get all Cataclysm cards currently in the deck
    const cataclysmCardsInDeck = new Set();
    window.deckEditorCards.forEach(card => {
        const cardData = window.availableCardsMap.get(card.cardId);
        if (cardData && cardData.is_cataclysm === true) {
            cataclysmCardsInDeck.add(card.cardId);
        }
    });
    
    // Update all special card items for cataclysm dimming
    const specialCardItems = document.querySelectorAll('.card-item[data-type="special"][data-id]');
    specialCardItems.forEach(cardElement => {
        const cardId = cardElement.getAttribute('data-id');
        
        if (cardId) {
            const cardData = window.availableCardsMap.get(cardId);
            const isCataclysm = cardData && cardData.is_cataclysm === true;
            
            if (isCataclysm) {
                // This is a Cataclysm card - check if it should be dimmed
                const isInDeck = cataclysmCardsInDeck.has(cardId);
                const hasOtherCataclysm = cataclysmCardsInDeck.size > 0;
                
                if (isInDeck || hasOtherCataclysm) {
                    // This is a Cataclysm card and either it's in the deck or another cataclysm is in the deck - dim it
                    cardElement.classList.add('disabled');
                    cardElement.setAttribute('draggable', 'false');
                    if (isInDeck) {
                        cardElement.title = 'Cataclysm - already in deck';
                    } else {
                        cardElement.title = 'Cataclysm - another cataclysm already selected';
                    }
                } else {
                    // This is a Cataclysm card but no cataclysm is in the deck
                    // Only enable it if it's not disabled for OTHER reasons (Assist, Ambush, etc.)
                    if (!shouldSpecialCardBeDisabled(cardId, cardData)) {
                        cardElement.classList.remove('disabled');
                        cardElement.setAttribute('draggable', 'true');
                        cardElement.title = '';
                    }
                }
            }
            // If it's not a Cataclysm card, don't touch it - let other functions handle it
        }
    });
}

// Function to update Assist card dimming status
function updateAssistLimitStatus() {
    // Get all Assist cards currently in the deck
    const assistCardsInDeck = new Set();
    window.deckEditorCards.forEach(card => {
        const cardData = window.availableCardsMap.get(card.cardId);
        if (cardData && cardData.is_assist === true) {
            assistCardsInDeck.add(card.cardId);
        }
    });
    
    // Update all special card items for assist dimming
    const specialCardItems = document.querySelectorAll('.card-item[data-type="special"][data-id]');
    
    specialCardItems.forEach(cardElement => {
        const cardId = cardElement.getAttribute('data-id');
        
        if (cardId) {
            const cardData = window.availableCardsMap.get(cardId);
            const isAssist = cardData && cardData.is_assist === true;
            const isAmbush = cardData && cardData.is_ambush === true;
            
            // CRITICAL: Only process Assist cards, skip Ambush cards entirely
            if (isAssist) {
                // This is an Assist card - check if it should be dimmed
                const isInDeck = assistCardsInDeck.has(cardId);
                const hasOtherAssist = assistCardsInDeck.size > 0;
                
                if (isInDeck || hasOtherAssist) {
                    // This is an Assist card and either it's in the deck or another assist is in the deck - dim it
                    cardElement.classList.add('disabled');
                    cardElement.setAttribute('draggable', 'false');
                    if (isInDeck) {
                        cardElement.title = 'Assist - already in deck';
                    } else {
                        cardElement.title = 'Assist - another assist already selected';
                    }
                } else {
                    // This is an Assist card but no assist is in the deck
                    // Only enable it if it's not disabled for OTHER reasons (Ambush, Cataclysm, etc.)
                    const shouldBeDisabled = shouldSpecialCardBeDisabled(cardId, cardData);
                    if (!shouldBeDisabled) {
                        cardElement.classList.remove('disabled');
                        cardElement.setAttribute('draggable', 'true');
                        cardElement.title = '';
                    }
                }
            }
            // If it's not an Assist card, don't touch it - let other functions handle it
        }
    });
}

// Function to update Ambush card dimming status
function updateAmbushLimitStatus() {
    // Get all Ambush cards currently in the deck
    const ambushCardsInDeck = new Set();
    window.deckEditorCards.forEach(card => {
        const cardData = window.availableCardsMap.get(card.cardId);
        if (cardData && cardData.is_ambush === true) {
            ambushCardsInDeck.add(card.cardId);
        }
    });
    
    // Update all special card items for ambush dimming
    const specialCardItems = document.querySelectorAll('.card-item[data-type="special"][data-id]');
    
    if (specialCardItems && specialCardItems.forEach) {
        specialCardItems.forEach(cardElement => {
            const cardId = cardElement.getAttribute('data-id');
            
            if (cardId) {
                const cardData = window.availableCardsMap.get(cardId);
                const isAmbush = cardData && cardData.is_ambush === true;
                
                // CRITICAL: Only process Ambush cards, skip Assist cards entirely
                if (isAmbush) {
                    // This is an Ambush card - check if it should be dimmed
                    const isInDeck = ambushCardsInDeck.has(cardId);
                    const hasOtherAmbush = ambushCardsInDeck.size > 0;
                    
                    if (isInDeck || hasOtherAmbush) {
                        // This is an Ambush card and either it's in the deck or another ambush is in the deck - dim it
                        cardElement.classList.add('disabled');
                        cardElement.setAttribute('draggable', 'false');
                        if (isInDeck) {
                            cardElement.title = 'Ambush - already in deck';
                        } else {
                            cardElement.title = 'Ambush - another ambush already selected';
                        }
                    } else {
                        // This is an Ambush card but no ambush is in the deck
                        // Only enable it if it's not disabled for OTHER reasons (Assist, Cataclysm, etc.)
                        const shouldBeDisabled = shouldSpecialCardBeDisabled(cardId, cardData);
                        if (!shouldBeDisabled) {
                            cardElement.classList.remove('disabled');
                            cardElement.setAttribute('draggable', 'true');
                            cardElement.title = '';
                        }
                    }
                }
                // If it's not an Ambush card, don't touch it - let other functions handle it
            }
        });
    }
}


// ===== updateFortificationLimitStatus =====

function updateFortificationLimitStatus() {
    // Get all Fortification cards currently in the deck
    const fortificationCardsInDeck = new Set();
    window.deckEditorCards.forEach(card => {
        const cardData = window.availableCardsMap.get(card.cardId);
        if (cardData && cardData.is_fortification === true) {
            fortificationCardsInDeck.add(card.cardId);
        }
    });
    
    // Update all aspect card items for fortification dimming
    const aspectCardItems = document.querySelectorAll('.card-item[data-type="aspect"][data-id]');
    if (aspectCardItems && aspectCardItems.forEach) {
        aspectCardItems.forEach(cardElement => {
            const cardId = cardElement.getAttribute('data-id');
            
            if (cardId) {
                const cardData = window.availableCardsMap.get(cardId);
                const isFortification = cardData && cardData.is_fortification === true;
                const isInDeck = fortificationCardsInDeck.has(cardId);
                const hasOtherFortification = fortificationCardsInDeck.size > 0;
                
                if (isFortification && (isInDeck || hasOtherFortification)) {
                    // This is a Fortification card and either it's in the deck or another fortification is in the deck - dim it
                    cardElement.classList.add('disabled');
                    cardElement.setAttribute('draggable', 'false');
                    if (isInDeck) {
                        cardElement.title = 'Fortification - already in deck';
                    } else {
                        cardElement.title = 'Fortification - another fortification already selected';
                    }
                } else if (isFortification && !hasOtherFortification) {
                    // This is a Fortification card but no fortification is in the deck - enable it
                    cardElement.classList.remove('disabled');
                    cardElement.setAttribute('draggable', 'true');
                    cardElement.title = '';
                }
            }
        });
    }
}


// Export all functions to window for backward compatibility
window.calculateIconTotals = calculateIconTotals;
window.updateDeckSummary = updateDeckSummary;
window.showDeckValidation = showDeckValidation;
window.updateDeckEditorCardCount = updateDeckEditorCardCount;
window.updateCharacterLimitStatus = updateCharacterLimitStatus;
window.updateLocationLimitStatus = updateLocationLimitStatus;
window.updateMissionLimitStatus = updateMissionLimitStatus;
window.getOPDKeyForDimming = getOPDKeyForDimming;
window.updateOnePerDeckLimitStatus = updateOnePerDeckLimitStatus;
window.shouldSpecialCardBeDisabled = shouldSpecialCardBeDisabled;
window.updateCataclysmLimitStatus = updateCataclysmLimitStatus;
window.updateAssistLimitStatus = updateAssistLimitStatus;
window.updateAmbushLimitStatus = updateAmbushLimitStatus;
window.updateFortificationLimitStatus = updateFortificationLimitStatus;
