/* ========================================
 * DECK IMPORT COMPONENT
 * ========================================
 *
 * This file contains the deck import functionality
 * for ADMIN users to import decks from JSON.
 *
 * Purpose: Standalone deck import module
 * Created: Refactored from deck-export.js
 * Contains:
 *   - importDeckFromJson() - Entry point for import
 *   - showImportOverlay() - Display import overlay
 *   - closeImportOverlay() - Close import overlay
 *   - processImportDeck() - Process and import cards
 *   - extractCardsFromImportData() - Extract cards from JSON structure
 *   - findCardIdByName() - Find card ID by name
 *
 * Dependencies:
 *   - Global: currentUser, window.availableCardsMap, window.deckEditorCards
 *   - Global: loadAvailableCards(), showNotification(), validateDeck(), addCardToEditor()
 *   - Global: currentDeckId
 *   - DOM: #importJsonOverlay, #importJsonContent, #importErrorMessages, #importJsonButton elements
 *
 * ======================================== */

/**
 * Import deck from JSON (Admin only)
 * Opens a modal for pasting exported deck JSON and imports cards into the current deck.
 */
function importDeckFromJson() {
    // Security check - only allow ADMIN users
    const currentUser = window.currentUser || (typeof getCurrentUser === 'function' ? getCurrentUser() : null);
    if (!currentUser || currentUser.role !== 'ADMIN') {
        showNotification('Access denied: Admin privileges required', 'error');
        return;
    }

    // Check if deck editor is open (for new decks, currentDeckId might be "new" or null)
    // Allow import if deck editor modal is visible, even if it's a new deck
    const deckEditorModal = document.getElementById('deckEditorModal');
    const currentDeckId = window.currentDeckId || null;
    
    // Allow import if:
    // 1. Deck editor modal is open (visible), OR
    // 2. There's a currentDeckId (including "new"), OR  
    // 3. There are cards already in the deck
    const isDeckEditorOpen = deckEditorModal && deckEditorModal.style.display !== 'none';
    const hasDeckId = currentDeckId !== null; // This includes "new" for new decks
    const hasCards = window.deckEditorCards && window.deckEditorCards.length > 0;
    
    if (!isDeckEditorOpen && !hasDeckId && !hasCards) {
        showNotification('Please open or create a deck before importing', 'error');
        return;
    }

    // Show the import overlay
    showImportOverlay();
}

/**
 * Show import overlay with textarea for JSON input
 */
function showImportOverlay() {
    const overlay = document.getElementById('importJsonOverlay');
    const textarea = document.getElementById('importJsonContent');
    const errorMessages = document.getElementById('importErrorMessages');
    const importButton = document.getElementById('importJsonButton');

    if (overlay && textarea) {
        // Clear previous content
        textarea.value = '';
        if (errorMessages) {
            errorMessages.style.display = 'none';
            errorMessages.innerHTML = '';
        }
        if (importButton) {
            importButton.disabled = false;
        }

        overlay.style.display = 'flex';

        // Add click outside to close
        overlay.onclick = function(event) {
            if (event.target === overlay) {
                closeImportOverlay();
            }
        };

        // Focus the textarea
        setTimeout(() => {
            textarea.focus();
        }, 100);
    }
}

/**
 * Close import overlay
 */
function closeImportOverlay() {
    const overlay = document.getElementById('importJsonOverlay');
    if (overlay) {
        overlay.style.display = 'none';
        overlay.onclick = null;
    }
}

/**
 * Process the imported JSON and add cards to the deck
 */
async function processImportDeck() {
    const textarea = document.getElementById('importJsonContent');
    const errorMessages = document.getElementById('importErrorMessages');
    const importButton = document.getElementById('importJsonButton');

    if (!textarea || !errorMessages || !importButton) {
        showNotification('Import UI elements not found', 'error');
        return;
    }

    const jsonText = textarea.value.trim();
    if (!jsonText) {
        errorMessages.style.display = 'block';
        errorMessages.innerHTML = '<ul><li>Please paste JSON data into the text area</li></ul>';
        return;
    }

    // Disable button during processing
    importButton.disabled = true;

    try {
        // Parse JSON
        let importData;
        try {
            importData = JSON.parse(jsonText);
        } catch (parseError) {
            errorMessages.style.display = 'block';
            errorMessages.innerHTML = `<ul><li>Invalid JSON format: ${parseError.message}</li></ul>`;
            importButton.disabled = false;
            return;
        }

        // Validate structure
        if (!importData.cards || typeof importData.cards !== 'object') {
            errorMessages.style.display = 'block';
            errorMessages.innerHTML = '<ul><li>Invalid import format: Missing "cards" section</li></ul>';
            importButton.disabled = false;
            return;
        }

        // Extract and flatten cards from the cards section
        const cardsToImport = extractCardsFromImportData(importData.cards);

        if (cardsToImport.length === 0) {
            errorMessages.style.display = 'block';
            errorMessages.innerHTML = '<ul><li>No cards found in import data</li></ul>';
            importButton.disabled = false;
            return;
        }

        // Ensure availableCardsMap is loaded
        if (!window.availableCardsMap || window.availableCardsMap.size === 0) {
            if (typeof loadAvailableCards === 'function') {
                await loadAvailableCards();
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            if (!window.availableCardsMap || window.availableCardsMap.size === 0) {
                errorMessages.style.display = 'block';
                errorMessages.innerHTML = '<ul><li>Card data not loaded. Please refresh the page and try again.</li></ul>';
                importButton.disabled = false;
                return;
            }
        }

        // Get current deck cards (preserve existing)
        const currentDeckCards = [...(window.deckEditorCards || [])];

        // Convert card names to card IDs and build import list
        // Track what we've already imported to prevent duplicates (especially for characters)
        const importList = [];
        const unresolvedCards = [];
        const alreadyImported = new Set(); // Track cardId+type combinations already in import list
        const alreadyInDeck = new Set(); // Track cardId+type combinations already in current deck

        // Build set of cards already in deck
        if (currentDeckCards && currentDeckCards.length > 0) {
            currentDeckCards.forEach(card => {
                const key = `${card.type}_${card.cardId}`;
                alreadyInDeck.add(key);
            });
        }

        // Debug: Log cards to import by type
        const characterCardsToImport = cardsToImport.filter(c => c.type === 'character');
        const specialCardsToImport = cardsToImport.filter(c => c.type === 'special');
        const locationCardsToImport = cardsToImport.filter(c => c.type === 'location');
        const missionCardsToImport = cardsToImport.filter(c => c.type === 'mission');
        const eventCardsToImport = cardsToImport.filter(c => c.type === 'event');
        const aspectCardsToImport = cardsToImport.filter(c => c.type === 'aspect');
        const advancedUniverseCardsToImport = cardsToImport.filter(c => c.type === 'advanced-universe');
        const teamworkCardsToImport = cardsToImport.filter(c => c.type === 'teamwork');
        const allyCardsToImport = cardsToImport.filter(c => c.type === 'ally-universe');
        const trainingCardsToImport = cardsToImport.filter(c => c.type === 'training');
        const basicUniverseCardsToImport = cardsToImport.filter(c => c.type === 'basic-universe');
        console.log('🔍 IMPORT: Starting import - Characters:', characterCardsToImport.length, 'Special:', specialCardsToImport.length, 'Locations:', locationCardsToImport.length, 'Missions:', missionCardsToImport.length, 'Events:', eventCardsToImport.length, 'Aspects:', aspectCardsToImport.length, 'Advanced Universe:', advancedUniverseCardsToImport.length, 'Teamwork:', teamworkCardsToImport.length, 'Allies:', allyCardsToImport.length, 'Training:', trainingCardsToImport.length, 'Basic Universe:', basicUniverseCardsToImport.length);
        
        for (const cardEntry of cardsToImport) {
            // Process characters, special cards, locations, missions, events, aspects, advanced-universe, teamwork, ally-universe, training, and basic-universe
            if (cardEntry.type !== 'character' && cardEntry.type !== 'special' && cardEntry.type !== 'location' && cardEntry.type !== 'mission' && cardEntry.type !== 'event' && cardEntry.type !== 'aspect' && cardEntry.type !== 'advanced-universe' && cardEntry.type !== 'teamwork' && cardEntry.type !== 'ally-universe' && cardEntry.type !== 'training' && cardEntry.type !== 'basic-universe') {
                continue;
            }
            
            let cardTypeLabel = 'UNKNOWN';
            if (cardEntry.type === 'character') cardTypeLabel = 'CHARACTER';
            else if (cardEntry.type === 'special') cardTypeLabel = 'SPECIAL';
            else if (cardEntry.type === 'location') cardTypeLabel = 'LOCATION';
            else if (cardEntry.type === 'mission') cardTypeLabel = 'MISSION';
            else if (cardEntry.type === 'event') cardTypeLabel = 'EVENT';
            else if (cardEntry.type === 'aspect') cardTypeLabel = 'ASPECT';
            else if (cardEntry.type === 'advanced-universe') cardTypeLabel = 'ADVANCED_UNIVERSE';
            else if (cardEntry.type === 'teamwork') cardTypeLabel = 'TEAMWORK';
            else if (cardEntry.type === 'ally-universe') cardTypeLabel = 'ALLY';
            else if (cardEntry.type === 'training') cardTypeLabel = 'TRAINING';
            else if (cardEntry.type === 'basic-universe') cardTypeLabel = 'BASIC_UNIVERSE';
            
            // For teamwork, ally, training, and basic-universe cards, use special lookup functions that match by name AND additional fields
            let cardId;
            if (cardEntry.type === 'training') {
                const type1 = cardEntry.type_1 || null;
                const type2 = cardEntry.type_2 || null;
                const bonus = cardEntry.bonus || null;
                console.log(`🔍 ${cardTypeLabel} IMPORT: Looking up "${cardEntry.name}"${type1 ? ` with type_1: "${type1}"` : ''}${type2 ? ` type_2: "${type2}"` : ''}${bonus ? ` bonus: "${bonus}"` : ' (no field info)'}`);
                cardId = findTrainingCardIdByName(cardEntry.name, type1, type2, bonus);
                
                // Debug: If not found, log available training cards with matching names
                if (!cardId) {
                    console.log(`🔍 ${cardTypeLabel} IMPORT DEBUG: Card not found, searching for training cards with name "${cardEntry.name}"`);
                    let matchingCards = [];
                    for (const [key, card] of window.availableCardsMap.entries()) {
                        if (card && (card.type === 'training' || card.card_type === 'training' || card.cardType === 'training')) {
                            const cardName = card.name || card.card_name;
                            if (cardName === cardEntry.name) {
                                matchingCards.push({
                                    key: key,
                                    id: card.id,
                                    name: cardName,
                                    type_1: card.type_1 || null,
                                    type_2: card.type_2 || null,
                                    bonus: card.bonus || null,
                                    type: card.type || card.card_type || card.cardType
                                });
                            }
                        }
                    }
                    console.log(`🔍 ${cardTypeLabel} IMPORT DEBUG: Found ${matchingCards.length} training card(s) with name "${cardEntry.name}":`, matchingCards);
                }
            } else if (cardEntry.type === 'ally-universe') {
                const statToUse = cardEntry.stat_to_use || null;
                const statTypeToUse = cardEntry.stat_type_to_use || null;
                console.log(`🔍 ${cardTypeLabel} IMPORT: Looking up "${cardEntry.name}"${statToUse ? ` with stat_to_use: "${statToUse}"` : ''}${statTypeToUse ? ` stat_type_to_use: "${statTypeToUse}"` : ' (no stat info)'}`);
                cardId = findAllyCardIdByName(cardEntry.name, statToUse, statTypeToUse);
                
                // Debug: If not found, log available ally cards with matching names
                if (!cardId) {
                    console.log(`🔍 ${cardTypeLabel} IMPORT DEBUG: Card not found, searching for ally cards with name "${cardEntry.name}"`);
                    let matchingCards = [];
                    for (const [key, card] of window.availableCardsMap.entries()) {
                        if (card && (card.type === 'ally-universe' || card.card_type === 'ally-universe' || card.cardType === 'ally-universe')) {
                            const cardName = card.name || card.card_name;
                            if (cardName === cardEntry.name) {
                                matchingCards.push({
                                    key: key,
                                    id: card.id,
                                    name: cardName,
                                    stat_to_use: card.stat_to_use || null,
                                    stat_type_to_use: card.stat_type_to_use || null,
                                    type: card.type || card.card_type || card.cardType
                                });
                            }
                        }
                    }
                    console.log(`🔍 ${cardTypeLabel} IMPORT DEBUG: Found ${matchingCards.length} ally card(s) with name "${cardEntry.name}":`, matchingCards);
                }
            } else if (cardEntry.type === 'teamwork') {
                const followupTypes = cardEntry.followup_attack_types || null;
                console.log(`🔍 ${cardTypeLabel} IMPORT: Looking up "${cardEntry.name}"${followupTypes ? ` with followup: "${followupTypes}"` : ' (no followup types)'}`);
                cardId = findTeamworkCardIdByName(cardEntry.name, followupTypes);
                
                // Debug: If not found, log available teamwork cards with matching names
                if (!cardId) {
                    console.log(`🔍 ${cardTypeLabel} IMPORT DEBUG: Card not found, searching for teamwork cards with name "${cardEntry.name}"`);
                    let matchingCards = [];
                    for (const [key, card] of window.availableCardsMap.entries()) {
                        if (card && (card.type === 'teamwork' || card.card_type === 'teamwork' || card.cardType === 'teamwork')) {
                            // For teamwork cards, check to_use field (primary name field)
                            const cardName = card.to_use || card.name || card.card_name;
                            if (cardName === cardEntry.name) {
                                matchingCards.push({
                                    key: key,
                                    id: card.id,
                                    name: cardName,
                                    to_use: card.to_use,
                                    followup_attack_types: card.followup_attack_types || card.follow_up_attack_types || null,
                                    type: card.type || card.card_type || card.cardType
                                });
                            }
                        }
                    }
                    console.log(`🔍 ${cardTypeLabel} IMPORT DEBUG: Found ${matchingCards.length} teamwork card(s) with name "${cardEntry.name}":`, matchingCards);
                    
                    // Also log all teamwork cards for debugging
                    let allTeamworkCards = [];
                    for (const [key, card] of window.availableCardsMap.entries()) {
                        if (card && (card.type === 'teamwork' || card.card_type === 'teamwork' || card.cardType === 'teamwork')) {
                            allTeamworkCards.push({
                                key: key,
                                id: card.id,
                                to_use: card.to_use,
                                name: card.name,
                                card_name: card.card_name,
                                followup_attack_types: card.followup_attack_types || card.follow_up_attack_types || null
                            });
                        }
                    }
                    console.log(`🔍 ${cardTypeLabel} IMPORT DEBUG: All teamwork cards in map (${allTeamworkCards.length} total):`, allTeamworkCards.slice(0, 10));
                }
            } else if (cardEntry.type === 'basic-universe') {
                const typeField = cardEntry.type_field || null;
                const valueToUse = cardEntry.value_to_use || null;
                const bonus = cardEntry.bonus || null;
                console.log(`🔍 ${cardTypeLabel} IMPORT: Looking up "${cardEntry.name}"${typeField ? ` with type: "${typeField}"` : ''}${valueToUse ? ` value_to_use: "${valueToUse}"` : ''}${bonus ? ` bonus: "${bonus}"` : ' (no field info)'}`);
                cardId = findBasicUniverseCardIdByName(cardEntry.name, typeField, valueToUse, bonus);
                
                // Debug: If not found, log available basic universe cards with matching names
                if (!cardId) {
                    console.log(`🔍 ${cardTypeLabel} IMPORT DEBUG: Card not found, searching for basic universe cards with name "${cardEntry.name}"`);
                    let matchingCards = [];
                    for (const [key, card] of window.availableCardsMap.entries()) {
                        if (card && (card.type === 'basic-universe' || card.card_type === 'basic-universe' || card.cardType === 'basic-universe')) {
                            const cardName = card.name || card.card_name;
                            if (cardName === cardEntry.name) {
                                matchingCards.push({
                                    key: key,
                                    id: card.id,
                                    name: cardName,
                                    type: card.type || null,
                                    value_to_use: card.value_to_use || null,
                                    bonus: card.bonus || null,
                                    cardType: card.type || card.card_type || card.cardType
                                });
                            }
                        }
                    }
                    console.log(`🔍 ${cardTypeLabel} IMPORT DEBUG: Found ${matchingCards.length} basic universe card(s) with name "${cardEntry.name}":`, matchingCards);
                }
            } else {
                console.log(`🔍 ${cardTypeLabel} IMPORT: Looking up "${cardEntry.name}"`);
                cardId = findCardIdByName(cardEntry.name, cardEntry.type);
            }
            
            // Debug: For missions/events that aren't found, try to diagnose the issue
            if ((cardEntry.type === 'mission' || cardEntry.type === 'event') && !cardId) {
                // Try searching without type filter to see if name exists
                let foundByName = null;
                for (const [key, card] of window.availableCardsMap.entries()) {
                    if (card && ((card.name && card.name === cardEntry.name) || (card.card_name && card.card_name === cardEntry.name))) {
                        foundByName = { key, card };
                        break;
                    }
                }
                if (foundByName) {
                    console.log(`🔍 ${cardTypeLabel} IMPORT: Found card by name but type mismatch:`, {
                        searchName: cardEntry.name,
                        searchType: cardEntry.type,
                        foundName: foundByName.card.name,
                        foundCardName: foundByName.card.card_name,
                        foundType: foundByName.card.type,
                        foundCardType: foundByName.card.card_type,
                        foundCardTypeProp: foundByName.card.cardType,
                        cardId: foundByName.card.id
                    });
                } else {
                    console.log(`🔍 ${cardTypeLabel} IMPORT: Card "${cardEntry.name}" not found in availableCardsMap at all`);
                }
            }
            
            if (cardId) {
                // For characters and locations: check for duplicates (can only have one of each)
                // For special cards: allow duplicates (can have multiple of same card)
                if (cardEntry.type === 'character' || cardEntry.type === 'location') {
                    const importKey = `${cardEntry.type}_${cardId}`;
                    
                    // Check for duplicates
                    if (alreadyInDeck.has(importKey)) {
                        console.log(`⏭️ ${cardTypeLabel} IMPORT: Skipping "${cardEntry.name}" - already in deck (ID: ${cardId})`);
                        continue;
                    }
                    if (alreadyImported.has(importKey)) {
                        console.log(`⏭️ ${cardTypeLabel} IMPORT: Skipping "${cardEntry.name}" - duplicate in import list (ID: ${cardId})`);
                        continue;
                    }
                    
                    alreadyImported.add(importKey);
                }
                // Special cards, missions, events, aspects, advanced-universe, teamwork, ally-universe, and training don't need duplicate checking - they can be added multiple times
                
                console.log(`✅ ${cardTypeLabel} IMPORT: Found "${cardEntry.name}" -> ID: ${cardId}`);
                importList.push({
                    type: cardEntry.type,
                    cardId: cardId,
                    cardName: cardEntry.name
                });
            } else {
                console.log(`❌ ${cardTypeLabel} IMPORT: Could not find "${cardEntry.name}" in card map`);
                unresolvedCards.push(cardEntry.name);
            }
        }
        
        // Debug: Log final import list by type
        const characterImportList = importList.filter(c => c.type === 'character');
        const specialImportList = importList.filter(c => c.type === 'special');
        const locationImportList = importList.filter(c => c.type === 'location');
        const missionImportList = importList.filter(c => c.type === 'mission');
        const eventImportList = importList.filter(c => c.type === 'event');
        const aspectImportList = importList.filter(c => c.type === 'aspect');
        const advancedUniverseImportList = importList.filter(c => c.type === 'advanced-universe');
        const teamworkImportList = importList.filter(c => c.type === 'teamwork');
        const allyImportList = importList.filter(c => c.type === 'ally-universe');
        const trainingImportList = importList.filter(c => c.type === 'training');
        const basicUniverseImportList = importList.filter(c => c.type === 'basic-universe');
        console.log('📋 IMPORT: Ready to import - Characters:', characterImportList.length, 'Special:', specialImportList.length, 'Locations:', locationImportList.length, 'Missions:', missionImportList.length, 'Events:', eventImportList.length, 'Aspects:', aspectImportList.length, 'Advanced Universe:', advancedUniverseImportList.length, 'Teamwork:', teamworkImportList.length, 'Allies:', allyImportList.length, 'Training:', trainingImportList.length, 'Basic Universe:', basicUniverseImportList.length);

        // Report unresolved cards
        if (unresolvedCards.length > 0) {
            const unresolvedList = unresolvedCards.slice(0, 10).join(', ');
            const moreText = unresolvedCards.length > 10 ? ` (and ${unresolvedCards.length - 10} more)` : '';
            errorMessages.style.display = 'block';
            errorMessages.innerHTML = `<ul><li>Could not find ${unresolvedCards.length} card(s): ${unresolvedList}${moreText}</li></ul>`;
            importButton.disabled = false;
            return;
        }

        // Validate the deck would be valid after adding all import cards
        // Create a test deck with current cards + import cards
        const testDeckCards = [];
        
        // Copy current deck cards
        currentDeckCards.forEach(card => {
            testDeckCards.push({
                type: card.type,
                cardId: card.cardId,
                quantity: card.quantity || 1
            });
        });
        
        // Add import cards to test deck (merging with existing if needed)
        for (const importCard of importList) {
            const existingIndex = testDeckCards.findIndex(
                card => card.type === importCard.type && card.cardId === importCard.cardId
            );
            
            if (existingIndex >= 0) {
                // Card exists - increment quantity (but not for characters or locations - they should be unique)
                if (importCard.type === 'character' || importCard.type === 'location') {
                    // Characters and locations shouldn't have duplicates - skip this one
                    // Validation will catch if we exceed limits
                    continue;
                } else {
                    // For special cards, missions, events, aspects, advanced-universe, teamwork, ally-universe, training, and basic-universe: increment quantity
                    testDeckCards[existingIndex].quantity += 1;
                }
            } else {
                // New card - add it
                testDeckCards.push({
                    type: importCard.type,
                    cardId: importCard.cardId,
                    quantity: 1
                });
            }
        }

        // Validate the test deck
        // Note: validateDeck expects availableCardsMap and DECK_RULES as globals
        // These should be available since validation-calculation-functions.js is loaded in the page
        if (typeof validateDeck === 'function') {
            try {
                const validation = validateDeck(testDeckCards);
                if (validation && validation.errors && validation.errors.length > 0) {
                    // Filter out validation errors that we don't want to enforce during import
                    const filteredErrors = validation.errors.filter(error => {
                        if (typeof error === 'string') {
                            // Skip errors about minimum deck size / draw pile size
                            if (error.includes('cards in draw pile')) {
                                return false;
                            }
                            // Skip errors about threat level (can be adjusted after import)
                            if (error.includes('threat level') || error.includes('Total threat')) {
                                return false;
                            }
                        }
                        return true;
                    });
                    
                    if (filteredErrors.length > 0) {
                        errorMessages.style.display = 'block';
                        errorMessages.innerHTML = '<ul>' + filteredErrors.map(error => `<li>${error}</li>`).join('') + '</ul>';
                        importButton.disabled = false;
                        return;
                    }
                }
            } catch (validationError) {
                console.error('Error during deck validation:', validationError);
                errorMessages.style.display = 'block';
                errorMessages.innerHTML = `<ul><li>Validation error: ${validationError.message}</li></ul>`;
                importButton.disabled = false;
                return;
            }
        } else {
            console.warn('validateDeck function not found - skipping validation');
        }

        // All validation passed - add cards to deck
        let successCount = 0;
        let errorCount = 0;
        const addErrors = [];
        
        const characterCardsToAdd = importList.filter(c => c.type === 'character');
        const specialCardsToAdd = importList.filter(c => c.type === 'special');
        const locationCardsToAdd = importList.filter(c => c.type === 'location');
        const missionCardsToAdd = importList.filter(c => c.type === 'mission');
        const eventCardsToAdd = importList.filter(c => c.type === 'event');
        const aspectCardsToAdd = importList.filter(c => c.type === 'aspect');
        const advancedUniverseCardsToAdd = importList.filter(c => c.type === 'advanced-universe');
        const teamworkCardsToAdd = importList.filter(c => c.type === 'teamwork');
        const allyCardsToAdd = importList.filter(c => c.type === 'ally-universe');
        const trainingCardsToAdd = importList.filter(c => c.type === 'training');
        const basicUniverseCardsToAdd = importList.filter(c => c.type === 'basic-universe');
        console.log('🚀 IMPORT: Starting to add cards - Characters:', characterCardsToAdd.length, 'Special:', specialCardsToAdd.length, 'Locations:', locationCardsToAdd.length, 'Missions:', missionCardsToAdd.length, 'Events:', eventCardsToAdd.length, 'Aspects:', aspectCardsToAdd.length, 'Advanced Universe:', advancedUniverseCardsToAdd.length, 'Teamwork:', teamworkCardsToAdd.length, 'Allies:', allyCardsToAdd.length, 'Training:', trainingCardsToAdd.length, 'Basic Universe:', basicUniverseCardsToAdd.length);
        console.log('🚀 IMPORT: Current deckEditorCards before import:', window.deckEditorCards?.length || 0, 'cards');

        for (const importCard of importList) {
            // Process characters, special cards, locations, missions, events, aspects, advanced-universe, teamwork, ally-universe, training, and basic-universe
            if (importCard.type !== 'character' && importCard.type !== 'special' && importCard.type !== 'location' && importCard.type !== 'mission' && importCard.type !== 'event' && importCard.type !== 'aspect' && importCard.type !== 'advanced-universe' && importCard.type !== 'teamwork' && importCard.type !== 'ally-universe' && importCard.type !== 'training' && importCard.type !== 'basic-universe') {
                continue;
            }
            
            let cardTypeLabel = 'UNKNOWN';
            if (importCard.type === 'character') cardTypeLabel = 'CHARACTER';
            else if (importCard.type === 'special') cardTypeLabel = 'SPECIAL';
            else if (importCard.type === 'location') cardTypeLabel = 'LOCATION';
            else if (importCard.type === 'mission') cardTypeLabel = 'MISSION';
            else if (importCard.type === 'event') cardTypeLabel = 'EVENT';
            else if (importCard.type === 'aspect') cardTypeLabel = 'ASPECT';
            else if (importCard.type === 'advanced-universe') cardTypeLabel = 'ADVANCED_UNIVERSE';
            else if (importCard.type === 'teamwork') cardTypeLabel = 'TEAMWORK';
            else if (importCard.type === 'ally-universe') cardTypeLabel = 'ALLY';
            else if (importCard.type === 'training') cardTypeLabel = 'TRAINING';
            else if (importCard.type === 'basic-universe') cardTypeLabel = 'BASIC_UNIVERSE';
            
            try {
                // Check card data before adding
                const cardData = window.availableCardsMap.get(importCard.cardId);
                
                // Character-specific checks
                if (importCard.type === 'character') {
                    console.log(`🔍 ${cardTypeLabel} IMPORT: Card data for "${importCard.cardName}":`, {
                        hasCardData: !!cardData,
                        hasAlternateImages: cardData?.alternateImages?.length > 0,
                        alternateImageCount: cardData?.alternateImages?.length || 0,
                        currentDeckCards: window.deckEditorCards?.length || 0,
                        currentCharacters: window.deckEditorCards?.filter(c => c.type === 'character').length || 0
                    });
                    
                    // Check if character already exists
                    const existingCharacter = window.deckEditorCards?.find(c => 
                        c.type === 'character' && c.cardId === importCard.cardId
                    );
                    if (existingCharacter) {
                        console.log(`⚠️ ${cardTypeLabel} IMPORT: "${importCard.cardName}" already exists in deck, skipping`);
                        continue;
                    }
                    
                    // Check character count
                    const characterCount = window.deckEditorCards?.filter(c => c.type === 'character').length || 0;
                    if (characterCount >= 4) {
                        console.log(`⚠️ ${cardTypeLabel} IMPORT: Already have 4 characters (${characterCount}), cannot add "${importCard.cardName}"`);
                        errorCount++;
                        addErrors.push(`${importCard.cardName}: Cannot add more than 4 characters`);
                        continue;
                    }
                    
                    // Determine if we need to select an alternate image
                    let selectedAlternateImage = null;
                    if (cardData && cardData.alternateImages && cardData.alternateImages.length > 0) {
                        // Automatically select the first alternate image for import (default art)
                        selectedAlternateImage = cardData.alternateImages[0];
                        console.log(`🖼️ ${cardTypeLabel} IMPORT: "${importCard.cardName}" has ${cardData.alternateImages.length} alternate image(s), auto-selecting first (default): "${selectedAlternateImage}"`);
                    }
                    
                    console.log(`➕ ${cardTypeLabel} IMPORT: Calling addCardToEditor("${importCard.type}", "${importCard.cardId}", "${importCard.cardName}", ${selectedAlternateImage ? `"${selectedAlternateImage}"` : 'null'})`);
                    
                    // Check if addCardToEditor exists
                    if (typeof addCardToEditor === 'function') {
                        // Call addCardToEditor with selected alternate image (or null if none)
                        await addCardToEditor(importCard.type, importCard.cardId, importCard.cardName, selectedAlternateImage);
                        
                        // Wait a bit for async operations to complete
                        await new Promise(resolve => setTimeout(resolve, 100));
                        
                        // Check if card was actually added
                        const wasAdded = window.deckEditorCards?.some(c => 
                            c.type === importCard.type && c.cardId === importCard.cardId
                        );
                        
                        if (wasAdded) {
                            console.log(`✅ ${cardTypeLabel} IMPORT: Successfully added "${importCard.cardName}" to deck`);
                            successCount++;
                        } else {
                            console.log(`⚠️ ${cardTypeLabel} IMPORT: addCardToEditor returned but "${importCard.cardName}" not found in deckEditorCards`);
                            errorCount++;
                            addErrors.push(`${importCard.cardName}: Card was not added to deck`);
                        }
                    } else {
                        console.error(`❌ ${cardTypeLabel} IMPORT: addCardToEditor function not available`);
                        throw new Error('addCardToEditor function not available');
                    }
                } else if (importCard.type === 'special') {
                    // Special cards can be added directly (no duplicate checking needed)
                    // But we should auto-select default art if alternate images exist
                    let selectedAlternateImage = null;
                    if (cardData && cardData.alternateImages && cardData.alternateImages.length > 0) {
                        // Automatically select the first alternate image for import (default art)
                        selectedAlternateImage = cardData.alternateImages[0];
                        console.log(`🖼️ ${cardTypeLabel} IMPORT: "${importCard.cardName}" has ${cardData.alternateImages.length} alternate image(s), auto-selecting first (default): "${selectedAlternateImage}"`);
                    }
                    
                    console.log(`➕ ${cardTypeLabel} IMPORT: Calling addCardToEditor("${importCard.type}", "${importCard.cardId}", "${importCard.cardName}", ${selectedAlternateImage ? `"${selectedAlternateImage}"` : 'null'})`);
                    
                    // Check if addCardToEditor exists
                    if (typeof addCardToEditor === 'function') {
                        // Pass selected alternate image (or null if none) - same as characters
                        await addCardToEditor(importCard.type, importCard.cardId, importCard.cardName, selectedAlternateImage);
                        
                        // Wait a bit for async operations to complete
                        await new Promise(resolve => setTimeout(resolve, 100));
                        
                        // Check if card was actually added (special cards can have duplicates, so we just check if it exists)
                        const wasAdded = window.deckEditorCards?.some(c => 
                            c.type === importCard.type && c.cardId === importCard.cardId
                        );
                        
                        if (wasAdded) {
                            console.log(`✅ ${cardTypeLabel} IMPORT: Successfully added "${importCard.cardName}" to deck`);
                            successCount++;
                        } else {
                            console.log(`⚠️ ${cardTypeLabel} IMPORT: addCardToEditor returned but "${importCard.cardName}" not found in deckEditorCards`);
                            errorCount++;
                            addErrors.push(`${importCard.cardName}: Card was not added to deck`);
                        }
                    } else {
                        console.error(`❌ ${cardTypeLabel} IMPORT: addCardToEditor function not available`);
                        throw new Error('addCardToEditor function not available');
                    }
                } else if (importCard.type === 'location') {
                    // Location-specific checks
                    console.log(`🔍 ${cardTypeLabel} IMPORT: Card data for "${importCard.cardName}":`, {
                        hasCardData: !!cardData,
                        hasAlternateImages: cardData?.alternateImages?.length > 0,
                        alternateImageCount: cardData?.alternateImages?.length || 0,
                        currentDeckCards: window.deckEditorCards?.length || 0,
                        currentLocations: window.deckEditorCards?.filter(c => c.type === 'location').length || 0
                    });
                    
                    // Check if location already exists
                    const existingLocation = window.deckEditorCards?.find(c => 
                        c.type === 'location' && c.cardId === importCard.cardId
                    );
                    if (existingLocation) {
                        console.log(`⚠️ ${cardTypeLabel} IMPORT: "${importCard.cardName}" already exists in deck, skipping`);
                        continue;
                    }
                    
                    // Check location count (max 1 location allowed)
                    const locationCount = window.deckEditorCards?.filter(c => c.type === 'location').length || 0;
                    if (locationCount >= 1) {
                        console.log(`⚠️ ${cardTypeLabel} IMPORT: Already have 1 location (${locationCount}), cannot add "${importCard.cardName}"`);
                        errorCount++;
                        addErrors.push(`${importCard.cardName}: Cannot add more than 1 location`);
                        continue;
                    }
                    
                    // Determine if we need to select an alternate image
                    let selectedAlternateImage = null;
                    if (cardData && cardData.alternateImages && cardData.alternateImages.length > 0) {
                        // Automatically select the first alternate image for import (default art)
                        selectedAlternateImage = cardData.alternateImages[0];
                        console.log(`🖼️ ${cardTypeLabel} IMPORT: "${importCard.cardName}" has ${cardData.alternateImages.length} alternate image(s), auto-selecting first (default): "${selectedAlternateImage}"`);
                    }
                    
                    console.log(`➕ ${cardTypeLabel} IMPORT: Calling addCardToEditor("${importCard.type}", "${importCard.cardId}", "${importCard.cardName}", ${selectedAlternateImage ? `"${selectedAlternateImage}"` : 'null'})`);
                    
                    // Check if addCardToEditor exists
                    if (typeof addCardToEditor === 'function') {
                        // Call addCardToEditor with selected alternate image (or null if none)
                        await addCardToEditor(importCard.type, importCard.cardId, importCard.cardName, selectedAlternateImage);
                        
                        // Wait a bit for async operations to complete
                        await new Promise(resolve => setTimeout(resolve, 100));
                        
                        // Check if card was actually added
                        const wasAdded = window.deckEditorCards?.some(c => 
                            c.type === importCard.type && c.cardId === importCard.cardId
                        );
                        
                        if (wasAdded) {
                            console.log(`✅ ${cardTypeLabel} IMPORT: Successfully added "${importCard.cardName}" to deck`);
                            successCount++;
                        } else {
                            console.log(`⚠️ ${cardTypeLabel} IMPORT: addCardToEditor returned but "${importCard.cardName}" not found in deckEditorCards`);
                            errorCount++;
                            addErrors.push(`${importCard.cardName}: Card was not added to deck`);
                        }
                    } else {
                        console.error(`❌ ${cardTypeLabel} IMPORT: addCardToEditor function not available`);
                        throw new Error('addCardToEditor function not available');
                    }
                } else if (importCard.type === 'mission' || importCard.type === 'event' || importCard.type === 'aspect' || importCard.type === 'advanced-universe' || importCard.type === 'teamwork' || importCard.type === 'ally-universe' || importCard.type === 'training' || importCard.type === 'basic-universe') {
                    // Mission, event, aspect, advanced-universe, teamwork, ally-universe, training, and basic-universe cards can be added directly (no duplicate checking needed, similar to special cards)
                    // But we should auto-select default art if alternate images exist
                    let selectedAlternateImage = null;
                    if (cardData && cardData.alternateImages && cardData.alternateImages.length > 0) {
                        // Automatically select the first alternate image for import (default art)
                        selectedAlternateImage = cardData.alternateImages[0];
                        console.log(`🖼️ ${cardTypeLabel} IMPORT: "${importCard.cardName}" has ${cardData.alternateImages.length} alternate image(s), auto-selecting first (default): "${selectedAlternateImage}"`);
                    }
                    
                    console.log(`➕ ${cardTypeLabel} IMPORT: Calling addCardToEditor("${importCard.type}", "${importCard.cardId}", "${importCard.cardName}", ${selectedAlternateImage ? `"${selectedAlternateImage}"` : 'null'})`);
                    
                    // Check if addCardToEditor exists
                    if (typeof addCardToEditor === 'function') {
                        // Pass selected alternate image (or null if none) - same as special cards
                        await addCardToEditor(importCard.type, importCard.cardId, importCard.cardName, selectedAlternateImage);
                        
                        // Wait a bit for async operations to complete
                        await new Promise(resolve => setTimeout(resolve, 100));
                        
                        // Check if card was actually added (missions, events, aspects, advanced-universe, teamwork, ally-universe, training, and basic-universe can have duplicates, so we just check if it exists)
                        const wasAdded = window.deckEditorCards?.some(c => 
                            c.type === importCard.type && c.cardId === importCard.cardId
                        );
                        
                        if (wasAdded) {
                            console.log(`✅ ${cardTypeLabel} IMPORT: Successfully added "${importCard.cardName}" to deck`);
                            successCount++;
                        } else {
                            console.log(`⚠️ ${cardTypeLabel} IMPORT: addCardToEditor returned but "${importCard.cardName}" not found in deckEditorCards`);
                            errorCount++;
                            addErrors.push(`${importCard.cardName}: Card was not added to deck`);
                        }
                    } else {
                        console.error(`❌ ${cardTypeLabel} IMPORT: addCardToEditor function not available`);
                        throw new Error('addCardToEditor function not available');
                    }
                }
            } catch (error) {
                errorCount++;
                addErrors.push(`${importCard.cardName}: ${error.message}`);
                console.error(`❌ ${cardTypeLabel} IMPORT: Error adding "${importCard.cardName}":`, error);
                console.error(`❌ ${cardTypeLabel} IMPORT: Error stack:`, error.stack);
            }
        }
        
        console.log('📊 IMPORT: Final results - Success:', successCount, 'Failed:', errorCount);
        console.log('📊 IMPORT: Final deckEditorCards count:', window.deckEditorCards?.length || 0, 'cards');
        
        // Debug: Check what basic-universe cards are in deckEditorCards
        const basicUniverseInDeck = window.deckEditorCards.filter(c => c.type === 'basic-universe' || c.type === 'basic_universe');
        console.log('🔍 IMPORT DEBUG: Basic universe cards in deckEditorCards:', basicUniverseInDeck.length);
        if (basicUniverseInDeck.length > 0) {
            console.log('🔍 IMPORT DEBUG: Basic universe cards details:');
            basicUniverseInDeck.forEach((card, idx) => {
                console.log(`🔍 IMPORT DEBUG: Basic universe card ${idx + 1}:`, {
                    type: card.type,
                    cardId: card.cardId,
                    cardName: card.cardName,
                    quantity: card.quantity,
                    fullCard: card
                });
                
                // Try to look it up in availableCardsMap
                const lookedUp = window.availableCardsMap.get(card.cardId);
                console.log(`🔍 IMPORT DEBUG: Lookup result for cardId "${card.cardId}":`, {
                    found: !!lookedUp,
                    cardName: lookedUp?.card_name || lookedUp?.name || 'NOT FOUND',
                    cardId: lookedUp?.id,
                    type: lookedUp?.type || lookedUp?.cardType || lookedUp?.card_type
                });
                
                // Try alternate keys
                const altKey1 = window.availableCardsMap.get(`basic-universe_${card.cardId}`);
                const altKey2 = window.availableCardsMap.get(`basic_universe_${card.cardId}`);
                console.log(`🔍 IMPORT DEBUG: Alternate key lookups:`, {
                    [`basic-universe_${card.cardId}`]: !!altKey1,
                    [`basic_universe_${card.cardId}`]: !!altKey2
                });
                
                // List all keys in map that contain this cardId
                const matchingKeys = Array.from(window.availableCardsMap.keys()).filter(k => k.includes(card.cardId));
                console.log(`🔍 IMPORT DEBUG: All keys containing cardId "${card.cardId}":`, matchingKeys);
            });
        } else {
            console.log('⚠️ IMPORT DEBUG: No basic-universe cards found in deckEditorCards after import!');
            console.log('🔍 IMPORT DEBUG: All card types in deckEditorCards:', [...new Set(window.deckEditorCards.map(c => c.type))]);
        }

        // Show results
        if (errorCount > 0) {
            errorMessages.style.display = 'block';
            errorMessages.innerHTML = '<ul>' + 
                `<li>Successfully imported ${successCount} card(s)</li>` +
                addErrors.map(error => `<li>${error}</li>`).join('') +
                '</ul>';
        } else {
            // Success - close overlay
            closeImportOverlay();
            showNotification(`Successfully imported ${successCount} card(s)`, 'success');
            
            // Respect current deck view; only re-render the active one
            const viewModeEl = document.getElementById('viewMode');
            const currentViewMode = viewModeEl ? viewModeEl.value : null;
            console.log('🔄 IMPORT DEBUG: Triggering deck re-render after import. Current view mode:', currentViewMode || 'unknown');

            if (currentViewMode === 'card') {
                if (typeof renderDeckCardsCardView === 'function') {
                    console.log('🔄 IMPORT DEBUG: Re-rendering Card View');
                    renderDeckCardsCardView();
                }
            } else if (currentViewMode === 'list') {
                if (typeof renderDeckCardsListView === 'function') {
                    console.log('🔄 IMPORT DEBUG: Re-rendering List View');
                    renderDeckCardsListView();
                }
            } else {
                // Fallback: prefer Card View if available
                if (typeof renderDeckCardsCardView === 'function') {
                    console.log('🔄 IMPORT DEBUG: Unknown view mode, defaulting to Card View');
                    renderDeckCardsCardView();
                }
            }
            
            // Check again after render
            setTimeout(() => {
                const basicUniverseAfterRender = window.deckEditorCards.filter(c => c.type === 'basic-universe' || c.type === 'basic_universe');
                console.log('🔄 IMPORT DEBUG: Basic universe cards count after render:', basicUniverseAfterRender.length);
                
                // Check if basic-universe section exists in DOM
                const basicUniverseSection = document.querySelector('[data-type="basic-universe"]');
                console.log('🔄 IMPORT DEBUG: Basic-universe section in DOM:', !!basicUniverseSection);
                if (basicUniverseSection) {
                    const cardsInSection = basicUniverseSection.querySelectorAll('.deck-card-card-view-item, .deck-card-editor-item');
                    console.log('🔄 IMPORT DEBUG: Cards rendered in basic-universe section:', cardsInSection.length);
                }
            }, 500);
        }

    } catch (error) {
        console.error('Error processing import:', error);
        errorMessages.style.display = 'block';
        errorMessages.innerHTML = `<ul><li>Error processing import: ${error.message}</li></ul>`;
    } finally {
        importButton.disabled = false;
    }
}

/**
 * Extract cards from import data structure and flatten into array
 * Handles all card categories: characters, special_cards (grouped by character), 
 * missions/events (grouped by mission set), advanced_universe (grouped by character), etc.
 */
function extractCardsFromImportData(cardsData) {
    const result = [];

    // Helper to add card with type
    const addCard = (cardName, cardType) => {
        if (cardName && typeof cardName === 'string') {
            result.push({ name: cardName.trim(), type: cardType });
        }
    };

    // Characters (array of strings)
    if (Array.isArray(cardsData.characters)) {
        cardsData.characters.forEach(cardName => addCard(cardName, 'character'));
    }

    // Special cards (object grouped by character name)
    if (cardsData.special_cards && typeof cardsData.special_cards === 'object') {
        Object.values(cardsData.special_cards).forEach(characterCards => {
            if (Array.isArray(characterCards)) {
                characterCards.forEach(cardName => addCard(cardName, 'special'));
            }
        });
    }

    // Locations (array of strings)
    if (Array.isArray(cardsData.locations)) {
        cardsData.locations.forEach(cardName => addCard(cardName, 'location'));
    }

    // Missions (object grouped by mission set)
    if (cardsData.missions && typeof cardsData.missions === 'object') {
        Object.values(cardsData.missions).forEach(missionSetCards => {
            if (Array.isArray(missionSetCards)) {
                missionSetCards.forEach(cardName => addCard(cardName, 'mission'));
            }
        });
    }

    // Events (object grouped by mission set)
    if (cardsData.events && typeof cardsData.events === 'object') {
        Object.values(cardsData.events).forEach(eventSetCards => {
            if (Array.isArray(eventSetCards)) {
                eventSetCards.forEach(cardName => addCard(cardName, 'event'));
            }
        });
    }

    // Aspects (array of strings)
    if (Array.isArray(cardsData.aspects)) {
        cardsData.aspects.forEach(cardName => addCard(cardName, 'aspect'));
    }

    // Advanced universe (object grouped by character)
    if (cardsData.advanced_universe && typeof cardsData.advanced_universe === 'object') {
        Object.values(cardsData.advanced_universe).forEach(characterCards => {
            if (Array.isArray(characterCards)) {
                characterCards.forEach(cardName => addCard(cardName, 'advanced-universe'));
            }
        });
    }

    // Teamwork (array of strings, format: "6 Combat - Brute Force + Intelligence")
    if (Array.isArray(cardsData.teamwork)) {
        cardsData.teamwork.forEach(cardName => {
            if (cardName && typeof cardName === 'string') {
                // Parse teamwork card name to extract base name and followup_attack_types
                // Format: "6 Combat - Brute Force + Intelligence" or just "6 Combat"
                const trimmedName = cardName.trim();
                const dashIndex = trimmedName.indexOf(' - ');
                
                if (dashIndex > 0) {
                    // Has followup_attack_types
                    const baseName = trimmedName.substring(0, dashIndex).trim();
                    const followupTypes = trimmedName.substring(dashIndex + 3).trim();
                    result.push({ 
                        name: baseName, 
                        type: 'teamwork',
                        followup_attack_types: followupTypes
                    });
                } else {
                    // No followup_attack_types, just the base name
                    result.push({ name: trimmedName, type: 'teamwork' });
                }
            }
        });
    }

    // Allies (array of strings, format: "Little John - 5 or less Brute Force")
    if (Array.isArray(cardsData.allies)) {
        cardsData.allies.forEach(cardName => {
            if (cardName && typeof cardName === 'string') {
                // Parse ally card name to extract base name, stat_to_use, and stat_type_to_use
                // Format: "Little John - 5 or less Brute Force" or "Little John - Combat" or just "Little John"
                const trimmedName = cardName.trim();
                const dashIndex = trimmedName.indexOf(' - ');
                
                if (dashIndex > 0) {
                    // Has stat information after dash
                    const baseName = trimmedName.substring(0, dashIndex).trim();
                    const statInfo = trimmedName.substring(dashIndex + 3).trim();
                    
                    // Split stat_info into stat_to_use and stat_type_to_use
                    // stat_type_to_use can be: "Energy", "Combat", "Brute Force", "Intelligence"
                    // stat_to_use can be: "5 or less", "7 or higher", "3", etc.
                    // Check for two-word stat type first ("Brute Force"), then single-word ones
                    const statTypes = ['Brute Force', 'Energy', 'Combat', 'Intelligence']; // Order matters - two-word first
                    let statTypeToUse = null;
                    let statToUse = null;
                    
                    // Try to find a stat type at the end (check two-word types first)
                    for (const statType of statTypes) {
                        if (statInfo.endsWith(` ${statType}`) || statInfo === statType) {
                            statTypeToUse = statType;
                            const remaining = statInfo.substring(0, statInfo.length - statType.length).trim();
                            statToUse = remaining || null;
                            break;
                        }
                    }
                    
                    // If no stat type found, treat entire string as stat_type_to_use or stat_to_use
                    if (!statTypeToUse) {
                        // Check if it's just a stat type
                        if (statTypes.includes(statInfo)) {
                            statTypeToUse = statInfo;
                        } else {
                            // Otherwise treat as stat_to_use only
                            statToUse = statInfo;
                        }
                    }
                    
                    result.push({ 
                        name: baseName, 
                        type: 'ally-universe',
                        stat_to_use: statToUse,
                        stat_type_to_use: statTypeToUse
                    });
                } else {
                    // No stat information, just the base name
                    result.push({ name: trimmedName, type: 'ally-universe' });
                }
            }
        });
    }

    // Training (array of strings, format: "Training (Leonidas) - Combat Intelligence +4")
    if (Array.isArray(cardsData.training)) {
        console.log(`📥 EXTRACT: Found ${cardsData.training.length} training card(s) in JSON:`, cardsData.training);
        cardsData.training.forEach(cardName => {
            if (cardName && typeof cardName === 'string') {
                // Parse training card name to extract base name, type_1, type_2, and bonus
                // Format: "Training (Leonidas) - Combat Intelligence +4" or "Training (Leonidas) - Combat +4" or just "Training (Leonidas)"
                const trimmedName = cardName.trim();
                const dashIndex = trimmedName.indexOf(' - ');
                
                if (dashIndex > 0) {
                    // Has additional information after dash
                    const baseName = trimmedName.substring(0, dashIndex).trim();
                    const suffix = trimmedName.substring(dashIndex + 3).trim();
                    console.log(`📥 EXTRACT: Parsing training card "${trimmedName}" -> baseName: "${baseName}", suffix: "${suffix}"`);
                    
                    // Parse suffix to extract type_1, type_2, and bonus
                    // Format: "Combat Intelligence +4" or "Combat +4" or "+4" or just "Combat Intelligence"
                    // Bonus is typically at the end and starts with + or - followed by a number
                    const bonusMatch = suffix.match(/^(.+?)\s*([+-]\d+)$/);
                    let typesString = suffix;
                    let bonus = null;
                    
                    if (bonusMatch) {
                        // Found bonus at the end
                        typesString = bonusMatch[1].trim();
                        bonus = bonusMatch[2].trim();
                    } else if (/^[+-]\d+$/.test(suffix.trim())) {
                        // Entire suffix is just bonus
                        typesString = '';
                        bonus = suffix.trim();
                    }
                    
                    // Parse types string to extract type_1 and type_2
                    // Stat types can be: Energy, Combat, Brute Force, Intelligence
                    // "Brute Force" is two words, so check for it first
                    const statTypes = ['Brute Force', 'Energy', 'Combat', 'Intelligence']; // Order matters - two-word first
                    let type1 = null;
                    let type2 = null;
                    
                    if (typesString && typesString.trim()) {
                        const trimmedTypes = typesString.trim();
                        
                        // Try to find stat types in the string
                        // First check for "Brute Force" (two-word type)
                        if (trimmedTypes.startsWith('Brute Force')) {
                            type1 = 'Brute Force';
                            const remaining = trimmedTypes.substring(12).trim(); // Remove "Brute Force" (12 chars)
                            if (remaining) {
                                // Check if remaining is another stat type
                                for (const statType of statTypes) {
                                    if (remaining === statType || remaining.startsWith(statType + ' ') || remaining === statType) {
                                        type2 = statType;
                                        break;
                                    }
                                }
                                // If no match found, try matching by word
                                if (!type2) {
                                    const remainingWords = remaining.split(/\s+/);
                                    if (remainingWords.length > 0 && statTypes.includes(remainingWords[0])) {
                                        type2 = remainingWords[0];
                                    }
                                }
                            }
                        } else {
                            // No "Brute Force" at start, try to find first stat type
                            const words = trimmedTypes.split(/\s+/);
                            
                            // Find first stat type
                            let firstTypeIndex = -1;
                            let firstType = null;
                            
                            // Check if first word is a stat type
                            if (words.length > 0 && statTypes.includes(words[0])) {
                                firstTypeIndex = 0;
                                firstType = words[0];
                            }
                            
                            if (firstType) {
                                type1 = firstType;
                                // Get remaining after first type
                                const afterFirstType = trimmedTypes.substring(firstType.length).trim();
                                
                                if (afterFirstType) {
                                    // Check for "Brute Force" in remaining
                                    if (afterFirstType.startsWith('Brute Force')) {
                                        type2 = 'Brute Force';
                                    } else {
                                        // Try to find another stat type
                                        for (const statType of statTypes) {
                                            if (afterFirstType === statType || afterFirstType.startsWith(statType + ' ')) {
                                                type2 = statType;
                                                break;
                                            }
                                        }
                                        // If no match, try by first word
                                        if (!type2 && words.length > 1) {
                                            const secondWord = words[1];
                                            if (statTypes.includes(secondWord)) {
                                                type2 = secondWord;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    
                    const extractedCard = { 
                        name: baseName, 
                        type: 'training',
                        type_1: type1,
                        type_2: type2,
                        bonus: bonus
                    };
                    console.log(`📥 EXTRACT: Extracted training card:`, extractedCard);
                    result.push(extractedCard);
                } else {
                    // No additional information, just the base name
                    const extractedCard = { name: trimmedName, type: 'training' };
                    console.log(`📥 EXTRACT: Extracted training card (no fields):`, extractedCard);
                    result.push(extractedCard);
                }
            }
        });
    }

    // Basic universe (array of strings, format: "Secret Identity - Intelligence 6 or greater +2")
    if (Array.isArray(cardsData.basic_universe)) {
        cardsData.basic_universe.forEach(cardName => {
            if (cardName && typeof cardName === 'string') {
                // Parse basic universe card name to extract base name, type, value_to_use, and bonus
                // Format: "Secret Identity - Intelligence 6 or greater +2" or "Secret Identity - Intelligence 6 or greater" or just "Secret Identity"
                const trimmedName = cardName.trim();
                const dashIndex = trimmedName.indexOf(' - ');
                
                if (dashIndex > 0) {
                    // Has additional information after dash
                    const baseName = trimmedName.substring(0, dashIndex).trim();
                    const suffix = trimmedName.substring(dashIndex + 3).trim();
                    console.log(`📥 EXTRACT: Parsing basic universe card "${trimmedName}" -> baseName: "${baseName}", suffix: "${suffix}"`);
                    
                    // Parse suffix to extract type, value_to_use, and bonus
                    // Format: "Intelligence 6 or greater +2" or "Intelligence 6 or greater" or "Intelligence +2" or just "Intelligence"
                    // Bonus is typically at the end and starts with + or - followed by a number
                    const bonusMatch = suffix.match(/^(.+?)\s*([+-]\d+)$/);
                    let statInfo = suffix;
                    let bonus = null;
                    
                    if (bonusMatch) {
                        // Found bonus at the end
                        statInfo = bonusMatch[1].trim();
                        bonus = bonusMatch[2].trim();
                    } else if (/^[+-]\d+$/.test(suffix.trim())) {
                        // Entire suffix is just bonus
                        statInfo = '';
                        bonus = suffix.trim();
                    }
                    
                    // Parse statInfo to extract type and value_to_use
                    // Stat types can be: Energy, Combat, Brute Force, Intelligence, Any-Power
                    // "Brute Force" is two words, so check for it first
                    const statTypes = ['Brute Force', 'Any-Power', 'Energy', 'Combat', 'Intelligence']; // Order matters - two-word first
                    let type = null;
                    let valueToUse = null;
                    
                    if (statInfo && statInfo.trim()) {
                        const trimmedStatInfo = statInfo.trim();
                        
                        // Try to find stat type at the start
                        for (const statType of statTypes) {
                            if (trimmedStatInfo.startsWith(statType)) {
                                type = statType;
                                const remaining = trimmedStatInfo.substring(statType.length).trim();
                                valueToUse = remaining || null;
                                break;
                            }
                        }
                        
                        // If no type found at start, try checking if entire string is a stat type
                        if (!type && statTypes.includes(trimmedStatInfo)) {
                            type = trimmedStatInfo;
                        } else if (!type) {
                            // No type found, treat entire string as value_to_use
                            valueToUse = trimmedStatInfo;
                        }
                    }
                    
                    const extractedCard = { 
                        name: baseName, 
                        type: 'basic-universe',
                        type_field: type,
                        value_to_use: valueToUse,
                        bonus: bonus
                    };
                    console.log(`📥 EXTRACT: Extracted basic universe card:`, extractedCard);
                    result.push(extractedCard);
                } else {
                    // No additional information, just the base name
                    const extractedCard = { name: trimmedName, type: 'basic-universe' };
                    console.log(`📥 EXTRACT: Extracted basic universe card (no fields):`, extractedCard);
                    result.push(extractedCard);
                }
            }
        });
    }

    // Power cards (array of strings, format: "5 - Energy")
    // if (Array.isArray(cardsData.power_cards)) {
    //     cardsData.power_cards.forEach(cardName => addCard(cardName, 'power'));
    // }

    return result;
}

/**
 * Find teamwork card ID by name and followup_attack_types
 * Searches for a teamwork card matching both the base name and followup_attack_types
 * @param {string} cardName - The base card name (e.g., "6 Combat")
 * @param {string} followupTypes - The followup_attack_types value (e.g., "Brute Force + Energy")
 * @returns {string|null} Card ID if found, null otherwise
 */
function findTeamworkCardIdByName(cardName, followupTypes) {
    if (!window.availableCardsMap || !cardName || typeof cardName !== 'string') {
        return null;
    }
    
    // Search through all cards to find matching teamwork card
    for (const [key, card] of window.availableCardsMap.entries()) {
        // Skip if key or card is undefined/null
        if (!key || !card) {
            continue;
        }
        
        // Additional safety check: ensure card has expected properties
        if (!card.id) {
            continue;
        }
        
        // Check if this is a teamwork card
        // Cards are stored with cardType set by loadAvailableCards, also check type and card_type
        const cardType = card.cardType || card.type || card.card_type;
        if (!cardType || cardType !== 'teamwork') {
            continue;
        }
        
        // Check name match
        // For teamwork cards, the name is stored in the 'to_use' field, not 'name'
        // Also check name and card_name as fallbacks
        const cardToUse = card.to_use || null;
        const cardNameField = card.name || null;
        const cardCardName = card.card_name || null;
        const cardNameMatch = (cardToUse && typeof cardToUse === 'string' && cardToUse === cardName) ||
                             (cardNameField && typeof cardNameField === 'string' && cardNameField === cardName) ||
                             (cardCardName && typeof cardCardName === 'string' && cardCardName === cardName);
        
        if (!cardNameMatch) {
            continue; // Name doesn't match
        }
        
        // Check followup_attack_types match (check both field name variations)
        const cardFollowupTypes = card.followup_attack_types || card.follow_up_attack_types;
        
        if (followupTypes) {
            // If followupTypes is provided, must match exactly
            if (cardFollowupTypes && typeof cardFollowupTypes === 'string' && 
                cardFollowupTypes.trim() === followupTypes.trim()) {
                return card.id;
            }
        } else {
            // If no followupTypes provided, match cards that also have no followup_attack_types
            if (!cardFollowupTypes || (typeof cardFollowupTypes === 'string' && !cardFollowupTypes.trim())) {
                return card.id;
            }
        }
    }
    
    return null;
}

/**
 * Find ally card ID by name, stat_to_use, and stat_type_to_use
 * Searches for an ally card matching the name and stat requirements
 * @param {string} cardName - The base card name (e.g., "Little John")
 * @param {string|null} statToUse - The stat_to_use value (e.g., "5 or less", "3")
 * @param {string|null} statTypeToUse - The stat_type_to_use value (e.g., "Brute Force", "Combat")
 * @returns {string|null} Card ID if found, null otherwise
 */
function findAllyCardIdByName(cardName, statToUse, statTypeToUse) {
    if (!window.availableCardsMap || !cardName || typeof cardName !== 'string') {
        return null;
    }
    
    // Search through all cards to find matching ally card
    for (const [key, card] of window.availableCardsMap.entries()) {
        // Skip if key or card is undefined/null
        if (!key || !card) {
            continue;
        }
        
        // Additional safety check: ensure card has expected properties
        if (!card.id) {
            continue;
        }
        
        // Check if this is an ally card
        const cardType = card.cardType || card.type || card.card_type;
        if (!cardType || (cardType !== 'ally-universe' && cardType !== 'ally_universe')) {
            continue;
        }
        
        // Check name match (ally cards use name or card_name)
        const cardNameMatch = (card.name && typeof card.name === 'string' && card.name === cardName) ||
                             (card.card_name && typeof card.card_name === 'string' && card.card_name === cardName);
        
        if (!cardNameMatch) {
            continue; // Name doesn't match
        }
        
        // Check stat_to_use and stat_type_to_use match
        const cardStatToUse = card.stat_to_use;
        const cardStatTypeToUse = card.stat_type_to_use;
        
        // Normalize stat_type_to_use for comparison (trim and handle case)
        const normalizeStatType = (statType) => {
            if (!statType || typeof statType !== 'string') return null;
            return statType.trim();
        };
        
        const normalizedCardStatType = normalizeStatType(cardStatTypeToUse);
        const normalizedSearchStatType = normalizeStatType(statTypeToUse);
        
        // Normalize stat_to_use for comparison
        const normalizeStatToUse = (stat) => {
            if (stat === null || stat === undefined) return null;
            if (typeof stat === 'string') return stat.trim();
            return String(stat).trim();
        };
        
        const normalizedCardStatToUse = normalizeStatToUse(cardStatToUse);
        const normalizedSearchStatToUse = normalizeStatToUse(statToUse);
        
        // Match logic:
        // If both stat_to_use and stat_type_to_use are provided, both must match
        // If only stat_type_to_use is provided, it must match
        // If only stat_to_use is provided, it must match
        // If neither is provided, match cards with neither
        if (statToUse !== null && statTypeToUse !== null) {
            // Both provided - both must match
            if (normalizedCardStatToUse === normalizedSearchStatToUse &&
                normalizedCardStatType === normalizedSearchStatType) {
                return card.id;
            }
        } else if (statTypeToUse !== null) {
            // Only stat_type_to_use provided
            if (normalizedCardStatType === normalizedSearchStatType) {
                return card.id;
            }
        } else if (statToUse !== null) {
            // Only stat_to_use provided
            if (normalizedCardStatToUse === normalizedSearchStatToUse) {
                return card.id;
            }
        } else {
            // Neither provided - match cards with neither
            if (!normalizedCardStatToUse && !normalizedCardStatType) {
                return card.id;
            }
        }
    }
    
    return null;
}

/**
 * Find training card ID by name, type_1, type_2, and bonus
 * Searches for a training card matching the name and all specified fields
 * @param {string} cardName - The base card name (e.g., "Training (Leonidas)")
 * @param {string|null} type1 - The type_1 value (e.g., "Combat")
 * @param {string|null} type2 - The type_2 value (e.g., "Intelligence")
 * @param {string|null} bonus - The bonus value (e.g., "+4")
 * @returns {string|null} Card ID if found, null otherwise
 */
function findTrainingCardIdByName(cardName, type1, type2, bonus) {
    if (!window.availableCardsMap || !cardName || typeof cardName !== 'string') {
        console.log(`❌ TRAINING LOOKUP: Invalid input - cardName: ${cardName}, map exists: ${!!window.availableCardsMap}`);
        return null;
    }
    
    console.log(`🔍 TRAINING LOOKUP: Searching for "${cardName}" with type_1: ${type1 || 'null'}, type_2: ${type2 || 'null'}, bonus: ${bonus || 'null'}`);
    
    // Count total training cards in map for debugging
    let totalTrainingCards = 0;
    let matchingNameCards = [];
    
    // Search through all cards to find matching training card
    for (const [key, card] of window.availableCardsMap.entries()) {
        // Skip if key or card is undefined/null
        if (!key || !card) {
            continue;
        }
        
        // Additional safety check: ensure card has expected properties
        if (!card.id) {
            continue;
        }
        
        // Check if this is a training card
        const cardType = card.cardType || card.type || card.card_type;
        if (!cardType || cardType !== 'training') {
            continue;
        }
        
        totalTrainingCards++;
        
        // Check name match (training cards use name or card_name)
        const cardNameMatch = (card.name && typeof card.name === 'string' && card.name === cardName) ||
                             (card.card_name && typeof card.card_name === 'string' && card.card_name === cardName);
        
        if (cardNameMatch) {
            matchingNameCards.push({
                id: card.id,
                name: card.name || 'undefined',
                card_name: card.card_name || 'undefined',
                type_1: card.type_1 || 'null',
                type_2: card.type_2 || 'null',
                bonus: card.bonus || 'null',
                cardType: cardType,
                key: key
            });
        }
        
        if (!cardNameMatch) {
            continue; // Name doesn't match
        }
        
        // Check type_1, type_2, and bonus match
        const cardType1 = card.type_1;
        const cardType2 = card.type_2;
        const cardBonus = card.bonus;
        
        // Normalize values for comparison (trim)
        const normalize = (value) => {
            if (!value || typeof value !== 'string') return null;
            return value.trim();
        };
        
        const normalizedCardType1 = normalize(cardType1);
        const normalizedCardType2 = normalize(cardType2);
        const normalizedCardBonus = normalize(cardBonus);
        const normalizedSearchType1 = normalize(type1);
        const normalizedSearchType2 = normalize(type2);
        const normalizedSearchBonus = normalize(bonus);
        
        // Match logic:
        // If all fields are provided, all must match
        // If only some fields are provided, only those must match
        // If no fields are provided, match cards with no fields
        if (type1 !== null && type2 !== null && bonus !== null) {
            // All three provided - all must match
            if (normalizedCardType1 === normalizedSearchType1 &&
                normalizedCardType2 === normalizedSearchType2 &&
                normalizedCardBonus === normalizedSearchBonus) {
                console.log(`✅ TRAINING LOOKUP: Found match for "${cardName}" (all fields) - ID: ${card.id}`);
                return card.id;
            }
        } else if (type1 !== null && type2 !== null) {
            // Only types provided - both must match
            if (normalizedCardType1 === normalizedSearchType1 &&
                normalizedCardType2 === normalizedSearchType2) {
                console.log(`✅ TRAINING LOOKUP: Found match for "${cardName}" (type_1 + type_2) - ID: ${card.id}`);
                return card.id;
            }
        } else if (type1 !== null && bonus !== null) {
            // type_1 and bonus provided
            if (normalizedCardType1 === normalizedSearchType1 &&
                normalizedCardBonus === normalizedSearchBonus) {
                console.log(`✅ TRAINING LOOKUP: Found match for "${cardName}" (type_1 + bonus) - ID: ${card.id}`);
                return card.id;
            }
        } else if (type2 !== null && bonus !== null) {
            // type_2 and bonus provided
            if (normalizedCardType2 === normalizedSearchType2 &&
                normalizedCardBonus === normalizedSearchBonus) {
                console.log(`✅ TRAINING LOOKUP: Found match for "${cardName}" (type_2 + bonus) - ID: ${card.id}`);
                return card.id;
            }
        } else if (type1 !== null) {
            // Only type_1 provided
            if (normalizedCardType1 === normalizedSearchType1) {
                console.log(`✅ TRAINING LOOKUP: Found match for "${cardName}" (type_1 only) - ID: ${card.id}`);
                return card.id;
            }
        } else if (type2 !== null) {
            // Only type_2 provided
            if (normalizedCardType2 === normalizedSearchType2) {
                console.log(`✅ TRAINING LOOKUP: Found match for "${cardName}" (type_2 only) - ID: ${card.id}`);
                return card.id;
            }
        } else if (bonus !== null) {
            // Only bonus provided
            if (normalizedCardBonus === normalizedSearchBonus) {
                console.log(`✅ TRAINING LOOKUP: Found match for "${cardName}" (bonus only) - ID: ${card.id}`);
                return card.id;
            }
        } else {
            // No fields provided - match cards with no fields
            if (!normalizedCardType1 && !normalizedCardType2 && !normalizedCardBonus) {
                console.log(`✅ TRAINING LOOKUP: Found match for "${cardName}" (no fields) - ID: ${card.id}`);
                return card.id;
            }
        }
    }
    
    // Debug: Log summary if no match found
    if (matchingNameCards.length === 0) {
        console.log(`❌ TRAINING LOOKUP: No cards found with name "${cardName}". Total training cards in map: ${totalTrainingCards}`);
    } else {
        console.log(`⚠️ TRAINING LOOKUP: Found ${matchingNameCards.length} card(s) with matching name but fields didn't match:`, matchingNameCards);
        console.log(`⚠️ TRAINING LOOKUP: Search criteria - type_1: "${type1 || 'null'}", type_2: "${type2 || 'null'}", bonus: "${bonus || 'null'}"`);
    }
    
    return null;
}

/**
 * Find basic universe card ID by name, type, value_to_use, and bonus
 * Searches for a basic universe card matching the name and all specified fields
 * @param {string} cardName - The base card name (e.g., "Secret Identity")
 * @param {string|null} typeField - The type value (e.g., "Intelligence", "Combat", "Energy", "Brute Force")
 * @param {string|null} valueToUse - The value_to_use value (e.g., "6 or greater", "7 or greater")
 * @param {string|null} bonus - The bonus value (e.g., "+2", "+3")
 * @returns {string|null} Card ID if found, null otherwise
 */
function findBasicUniverseCardIdByName(cardName, typeField, valueToUse, bonus) {
    if (!window.availableCardsMap || !cardName || typeof cardName !== 'string') {
        console.log(`❌ BASIC_UNIVERSE LOOKUP: Invalid input - cardName: ${cardName}, map exists: ${!!window.availableCardsMap}`);
        return null;
    }
    
    console.log(`🔍 BASIC_UNIVERSE LOOKUP: Searching for "${cardName}" with type: ${typeField || 'null'}, value_to_use: ${valueToUse || 'null'}, bonus: ${bonus || 'null'}`);
    
    // Count total basic universe cards in map for debugging
    let totalBasicUniverseCards = 0;
    let matchingNameCards = [];
    
    // Search through all cards to find matching basic universe card
    for (const [key, card] of window.availableCardsMap.entries()) {
        // Skip if key or card is undefined/null
        if (!key || !card) {
            continue;
        }
        
        // Additional safety check: ensure card has expected properties
        if (!card.id) {
            continue;
        }
        
        // Check if this is a basic universe card
        const cardType = card.cardType || card.type || card.card_type;
        if (!cardType || (cardType !== 'basic-universe' && cardType !== 'basic_universe')) {
            continue;
        }
        
        totalBasicUniverseCards++;
        
        // Check name match (basic universe cards use name or card_name)
        const cardNameMatch = (card.name && typeof card.name === 'string' && card.name === cardName) ||
                             (card.card_name && typeof card.card_name === 'string' && card.card_name === cardName);
        
        if (cardNameMatch) {
            matchingNameCards.push({
                id: card.id,
                name: card.name || 'undefined',
                card_name: card.card_name || 'undefined',
                type: card.type || 'null',
                value_to_use: card.value_to_use || 'null',
                bonus: card.bonus || 'null',
                cardType: cardType,
                key: key
            });
        }
        
        if (!cardNameMatch) {
            continue; // Name doesn't match
        }
        
        // Check type, value_to_use, and bonus match
        const cardTypeField = card.type;
        const cardValueToUse = card.value_to_use;
        const cardBonus = card.bonus;
        
        // Normalize values for comparison (trim)
        const normalize = (value) => {
            if (!value || typeof value !== 'string') return null;
            return value.trim();
        };
        
        const normalizedCardType = normalize(cardTypeField);
        const normalizedCardValueToUse = normalize(cardValueToUse);
        const normalizedCardBonus = normalize(cardBonus);
        const normalizedSearchType = normalize(typeField);
        const normalizedSearchValueToUse = normalize(valueToUse);
        const normalizedSearchBonus = normalize(bonus);
        
        // Match logic:
        // If all fields are provided, all must match
        // If only some fields are provided, only those must match
        // If no fields are provided, match cards with no fields
        if (typeField !== null && valueToUse !== null && bonus !== null) {
            // All three provided - all must match
            if (normalizedCardType === normalizedSearchType &&
                normalizedCardValueToUse === normalizedSearchValueToUse &&
                normalizedCardBonus === normalizedSearchBonus) {
                console.log(`✅ BASIC_UNIVERSE LOOKUP: Found match for "${cardName}" (all fields) - ID: ${card.id}`);
                return card.id;
            }
        } else if (typeField !== null && valueToUse !== null) {
            // Only type and value_to_use provided - both must match
            if (normalizedCardType === normalizedSearchType &&
                normalizedCardValueToUse === normalizedSearchValueToUse) {
                console.log(`✅ BASIC_UNIVERSE LOOKUP: Found match for "${cardName}" (type + value_to_use) - ID: ${card.id}`);
                return card.id;
            }
        } else if (typeField !== null && bonus !== null) {
            // type and bonus provided
            if (normalizedCardType === normalizedSearchType &&
                normalizedCardBonus === normalizedSearchBonus) {
                console.log(`✅ BASIC_UNIVERSE LOOKUP: Found match for "${cardName}" (type + bonus) - ID: ${card.id}`);
                return card.id;
            }
        } else if (valueToUse !== null && bonus !== null) {
            // value_to_use and bonus provided
            if (normalizedCardValueToUse === normalizedSearchValueToUse &&
                normalizedCardBonus === normalizedSearchBonus) {
                console.log(`✅ BASIC_UNIVERSE LOOKUP: Found match for "${cardName}" (value_to_use + bonus) - ID: ${card.id}`);
                return card.id;
            }
        } else if (typeField !== null) {
            // Only type provided
            if (normalizedCardType === normalizedSearchType) {
                console.log(`✅ BASIC_UNIVERSE LOOKUP: Found match for "${cardName}" (type only) - ID: ${card.id}`);
                return card.id;
            }
        } else if (valueToUse !== null) {
            // Only value_to_use provided
            if (normalizedCardValueToUse === normalizedSearchValueToUse) {
                console.log(`✅ BASIC_UNIVERSE LOOKUP: Found match for "${cardName}" (value_to_use only) - ID: ${card.id}`);
                return card.id;
            }
        } else if (bonus !== null) {
            // Only bonus provided
            if (normalizedCardBonus === normalizedSearchBonus) {
                console.log(`✅ BASIC_UNIVERSE LOOKUP: Found match for "${cardName}" (bonus only) - ID: ${card.id}`);
                return card.id;
            }
        } else {
            // No fields provided - match cards with no fields, or match first card with matching name
            if (!normalizedCardType && !normalizedCardValueToUse && !normalizedCardBonus) {
                console.log(`✅ BASIC_UNIVERSE LOOKUP: Found match for "${cardName}" (no fields) - ID: ${card.id}`);
                return card.id;
            } else {
                // If no fields provided but card has fields, still match (name-only match)
                console.log(`✅ BASIC_UNIVERSE LOOKUP: Found match for "${cardName}" (name only, card has fields) - ID: ${card.id}`);
                return card.id;
            }
        }
    }
    
    // Debug: Log summary if no match found
    if (matchingNameCards.length === 0) {
        console.log(`❌ BASIC_UNIVERSE LOOKUP: No cards found with name "${cardName}". Total basic universe cards in map: ${totalBasicUniverseCards}`);
    } else {
        console.log(`⚠️ BASIC_UNIVERSE LOOKUP: Found ${matchingNameCards.length} card(s) with matching name but fields didn't match:`, matchingNameCards);
        console.log(`⚠️ BASIC_UNIVERSE LOOKUP: Search criteria - type: "${typeField || 'null'}", value_to_use: "${valueToUse || 'null'}", bonus: "${bonus || 'null'}"`);
    }
    
    return null;
}

/**
 * Find card ID by name in availableCardsMap
 * Searches through the map for a card matching the name
 */
function findCardIdByName(cardName, cardType) {
    if (!window.availableCardsMap || !cardName || typeof cardName !== 'string') {
        return null;
    }

    // For teamwork cards, match by name AND followup_attack_types
    // This is handled by findTeamworkCardIdByName function
    // (see findCardIdByName usage for teamwork cards)
    
    // For power cards, parse the formatted name (e.g., "5 - Energy")
    if (cardType === 'power') {
        const powerMatch = cardName.match(/^(\d+)\s*-\s*(.+)$/);
        if (powerMatch) {
            const value = parseInt(powerMatch[1], 10);
            const powerType = powerMatch[2].trim();
            
            // Search through all cards to find matching power card
            for (const [key, card] of window.availableCardsMap.entries()) {
                // Skip if key or card is undefined/null, or key is not a string
                // Must check typeof first to avoid calling methods on non-strings
                if (!key || !card || typeof key !== 'string') {
                    continue;
                }
                
                // Additional safety check: ensure card has expected properties
                if (!card.id || typeof card.id !== 'string') {
                    continue;
                }
                
                // Skip prefixed keys (e.g., "power_123") - only if key doesn't match card.id
                if (key.includes('_') && key !== card.id) {
                    continue;
                }
                
                // Check if this is a power card with matching value and type
                if (card.value === value && 
                    card.power_type && 
                    typeof card.power_type === 'string' &&
                    card.power_type.trim() === powerType) {
                    return card.id;
                }
            }
        }
    }

    // Direct name lookup (cards are stored by name in the map)
    // Try both name and card_name as keys (missions use card_name)
    let foundCard = window.availableCardsMap.get(cardName);
    if (!foundCard) {
        // Try looking through entries to find by card_name if direct lookup failed
        for (const [key, card] of window.availableCardsMap.entries()) {
            if (card && (card.card_name === cardName || card.name === cardName)) {
                // Found by card_name - check if type matches
                const foundType = card.type || card.card_type || card.cardType;
                if (cardType) {
                    const normalizedFoundType = foundType ? foundType.replace('-universe', '') : null;
                    const normalizedCardType = cardType.replace('-universe', '');
                    if (normalizedFoundType === normalizedCardType) {
                        foundCard = card;
                        break;
                    }
                } else {
                    foundCard = card;
                    break;
                }
            }
        }
    }
    
    if (foundCard && foundCard.id) {
        const foundName = foundCard.name || foundCard.card_name;
        const foundType = foundCard.type || foundCard.card_type || foundCard.cardType;
        // Type mapping: 'ally-universe' -> 'ally', etc.
        const normalizedFoundType = foundType ? foundType.replace('-universe', '') : null;
        const normalizedCardType = cardType ? cardType.replace('-universe', '') : null;
        
        if (foundName === cardName && 
            (!cardType || !normalizedFoundType || !normalizedCardType || normalizedFoundType === normalizedCardType)) {
            return foundCard.id;
        }
    }

    // Search through all cards in the map by name
    for (const [key, card] of window.availableCardsMap.entries()) {
        // Skip if key or card is undefined/null, or key is not a string
        // Must check typeof first to avoid calling methods on non-strings
        if (!key || !card || typeof key !== 'string') {
            continue;
        }
        
        // Additional safety check: ensure card has expected properties
        if (!card.id || typeof card.id !== 'string') {
            continue;
        }
        
        // Skip prefixed keys (e.g., "character_123") - only if key doesn't match card.id
        // BUT: allow prefixed keys that match the pattern for the card type we're looking for
        // (e.g., "mission_123" when looking for missions)
        if (key.includes('_') && key !== card.id) {
            // Check if this is a prefixed key for the card type we're looking for
            if (cardType && cardType !== 'power') {
                const prefixedPattern = `${cardType}_${card.id}`;
                if (key !== prefixedPattern) {
                    continue; // Skip this prefixed key
                }
                // This is the correct prefixed key for our search type - continue processing
            } else {
                continue; // No cardType specified, skip all prefixed keys
            }
        }
        
        // Safely check card name first - exact match required
        // Check both name and card_name fields (missions use card_name, events use name)
        const cardNameMatch = (card.name && typeof card.name === 'string' && card.name === cardName) || 
                             (card.card_name && typeof card.card_name === 'string' && card.card_name === cardName);
        
        if (!cardNameMatch) {
            continue; // Name doesn't match, skip this card
        }
        
        // If name matches, check type if specified (except for power cards which are handled above)
        if (cardType && cardType !== 'power') {
            const cardTypeToMatch = card.type || card.card_type || card.cardType;
            if (cardTypeToMatch) {
                // Normalize types (handle 'ally-universe' vs 'ally', etc.)
                const normalizedCardTypeToMatch = cardTypeToMatch.replace('-universe', '');
                const normalizedRequestedType = cardType.replace('-universe', '');
                if (normalizedCardTypeToMatch !== normalizedRequestedType) {
                    continue; // Type doesn't match
                }
            } else {
                // Card has no type field - check if we matched by prefixed key or cardType
                // If cardType matches what we're looking for, allow it
                if (card.cardType && card.cardType === cardType) {
                    // cardType matches - allow it
                } else if (!card.cardType) {
                    // No type information at all - allow match if name matched (fallback for legacy data)
                    // This helps with cards that might not have type properly set
                } else {
                    continue; // cardType doesn't match
                }
            }
        }
        
        // Name matches (and type matches if specified) - return the card ID
        return card.id;
    }

    return null;
}

// Export functions to window object for backward compatibility
// This allows existing code and tests to continue using these functions
if (typeof window !== 'undefined') {
    window.importDeckFromJson = importDeckFromJson;
    window.showImportOverlay = showImportOverlay;
    window.closeImportOverlay = closeImportOverlay;
    window.processImportDeck = processImportDeck;
    window.extractCardsFromImportData = extractCardsFromImportData;
    window.findCardIdByName = findCardIdByName;
    window.findTeamworkCardIdByName = findTeamworkCardIdByName;
    window.findAllyCardIdByName = findAllyCardIdByName;
    window.findTrainingCardIdByName = findTrainingCardIdByName;
    window.findBasicUniverseCardIdByName = findBasicUniverseCardIdByName;
    
    // Debug: Confirm script loaded
    console.log('✅ Deck Import module loaded - importDeckFromJson available');
}

