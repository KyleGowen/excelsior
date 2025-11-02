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
        console.log('🔍 IMPORT: Starting import - Characters:', characterCardsToImport.length, 'Special:', specialCardsToImport.length, 'Locations:', locationCardsToImport.length, 'Missions:', missionCardsToImport.length, 'Events:', eventCardsToImport.length, 'Aspects:', aspectCardsToImport.length, 'Advanced Universe:', advancedUniverseCardsToImport.length, 'Teamwork:', teamworkCardsToImport.length, 'Allies:', allyCardsToImport.length);
        
        for (const cardEntry of cardsToImport) {
            // Process characters, special cards, locations, missions, events, aspects, advanced-universe, teamwork, and ally-universe
            if (cardEntry.type !== 'character' && cardEntry.type !== 'special' && cardEntry.type !== 'location' && cardEntry.type !== 'mission' && cardEntry.type !== 'event' && cardEntry.type !== 'aspect' && cardEntry.type !== 'advanced-universe' && cardEntry.type !== 'teamwork' && cardEntry.type !== 'ally-universe') {
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
            
            // For teamwork and ally cards, use special lookup functions that match by name AND additional fields
            let cardId;
            if (cardEntry.type === 'ally-universe') {
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
                // Special cards, missions, events, aspects, advanced-universe, teamwork, and ally-universe don't need duplicate checking - they can be added multiple times
                
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
        console.log('📋 IMPORT: Ready to import - Characters:', characterImportList.length, 'Special:', specialImportList.length, 'Locations:', locationImportList.length, 'Missions:', missionImportList.length, 'Events:', eventImportList.length, 'Aspects:', aspectImportList.length, 'Advanced Universe:', advancedUniverseImportList.length, 'Teamwork:', teamworkImportList.length, 'Allies:', allyImportList.length);

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
                    // For special cards, missions, events, aspects, advanced-universe, teamwork, and ally-universe: increment quantity
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
        console.log('🚀 IMPORT: Starting to add cards - Characters:', characterCardsToAdd.length, 'Special:', specialCardsToAdd.length, 'Locations:', locationCardsToAdd.length, 'Missions:', missionCardsToAdd.length, 'Events:', eventCardsToAdd.length, 'Aspects:', aspectCardsToAdd.length, 'Advanced Universe:', advancedUniverseCardsToAdd.length, 'Teamwork:', teamworkCardsToAdd.length, 'Allies:', allyCardsToAdd.length);
        console.log('🚀 IMPORT: Current deckEditorCards before import:', window.deckEditorCards?.length || 0, 'cards');

        for (const importCard of importList) {
            // Process characters, special cards, locations, missions, events, aspects, advanced-universe, teamwork, and ally-universe
            if (importCard.type !== 'character' && importCard.type !== 'special' && importCard.type !== 'location' && importCard.type !== 'mission' && importCard.type !== 'event' && importCard.type !== 'aspect' && importCard.type !== 'advanced-universe' && importCard.type !== 'teamwork' && importCard.type !== 'ally-universe') {
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
                } else if (importCard.type === 'mission' || importCard.type === 'event' || importCard.type === 'aspect' || importCard.type === 'advanced-universe' || importCard.type === 'teamwork' || importCard.type === 'ally-universe') {
                    // Mission, event, aspect, advanced-universe, teamwork, and ally-universe cards can be added directly (no duplicate checking needed, similar to special cards)
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
                        
                        // Check if card was actually added (missions, events, aspects, advanced-universe, teamwork, and ally-universe can have duplicates, so we just check if it exists)
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

    // Training (array of strings)
    // if (Array.isArray(cardsData.training)) {
    //     cardsData.training.forEach(cardName => addCard(cardName, 'training'));
    // }

    // Basic universe (array of strings)
    // if (Array.isArray(cardsData.basic_universe)) {
    //     cardsData.basic_universe.forEach(cardName => addCard(cardName, 'basic-universe'));
    // }

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
    
    // Debug: Confirm script loaded
    console.log('✅ Deck Import module loaded - importDeckFromJson available');
}

