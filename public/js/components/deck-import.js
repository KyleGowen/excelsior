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

        // Debug: Log characters to import
        const characterCardsToImport = cardsToImport.filter(c => c.type === 'character');
        console.log('🔍 CHARACTER IMPORT: Starting import for', characterCardsToImport.length, 'characters:', characterCardsToImport.map(c => c.name));
        
        for (const cardEntry of cardsToImport) {
            // Only process characters for now
            if (cardEntry.type !== 'character') {
                continue;
            }
            
            console.log(`🔍 CHARACTER IMPORT: Looking up "${cardEntry.name}"`);
            const cardId = findCardIdByName(cardEntry.name, cardEntry.type);
            
            if (cardId) {
                const importKey = `${cardEntry.type}_${cardId}`;
                
                // Check for duplicates
                if (alreadyInDeck.has(importKey)) {
                    console.log(`⏭️ CHARACTER IMPORT: Skipping "${cardEntry.name}" - already in deck (ID: ${cardId})`);
                    continue;
                }
                if (alreadyImported.has(importKey)) {
                    console.log(`⏭️ CHARACTER IMPORT: Skipping "${cardEntry.name}" - duplicate in import list (ID: ${cardId})`);
                    continue;
                }
                
                console.log(`✅ CHARACTER IMPORT: Found "${cardEntry.name}" -> ID: ${cardId}`);
                importList.push({
                    type: cardEntry.type,
                    cardId: cardId,
                    cardName: cardEntry.name
                });
                alreadyImported.add(importKey);
            } else {
                console.log(`❌ CHARACTER IMPORT: Could not find "${cardEntry.name}" in card map`);
                unresolvedCards.push(cardEntry.name);
            }
        }
        
        // Debug: Log final character import list
        const characterImportList = importList.filter(c => c.type === 'character');
        console.log('📋 CHARACTER IMPORT: Ready to import', characterImportList.length, 'characters:', characterImportList.map(c => `${c.cardName} (ID: ${c.cardId})`));

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
                // Card exists - increment quantity (but not for characters - they should be unique)
                if (importCard.type === 'character') {
                    // Characters shouldn't have duplicates - skip this one
                    // Validation will catch if we exceed 4 characters
                    continue;
                } else {
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
                    // Filter out the 51 card rule error during import
                    const filteredErrors = validation.errors.filter(error => {
                        if (typeof error === 'string') {
                            // Skip errors about minimum deck size / draw pile size
                            return !error.includes('cards in draw pile');
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
        console.log('🚀 CHARACTER IMPORT: Starting to add', characterCardsToAdd.length, 'characters to deck');
        console.log('🚀 CHARACTER IMPORT: Current deckEditorCards before import:', window.deckEditorCards?.length || 0, 'cards');

        for (const importCard of importList) {
            // Only process characters for now
            if (importCard.type !== 'character') {
                continue;
            }
            
            try {
                // Check card data before adding
                const cardData = window.availableCardsMap.get(importCard.cardId);
                console.log(`🔍 CHARACTER IMPORT: Card data for "${importCard.cardName}":`, {
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
                    console.log(`⚠️ CHARACTER IMPORT: "${importCard.cardName}" already exists in deck, skipping`);
                    continue;
                }
                
                // Check character count
                const characterCount = window.deckEditorCards?.filter(c => c.type === 'character').length || 0;
                if (characterCount >= 4) {
                    console.log(`⚠️ CHARACTER IMPORT: Already have 4 characters (${characterCount}), cannot add "${importCard.cardName}"`);
                    errorCount++;
                    addErrors.push(`${importCard.cardName}: Cannot add more than 4 characters`);
                    continue;
                }
                
                // Determine if we need to select an alternate image
                let selectedAlternateImage = null;
                if (cardData && cardData.alternateImages && cardData.alternateImages.length > 0) {
                    // Automatically select the first alternate image for import
                    selectedAlternateImage = cardData.alternateImages[0];
                    console.log(`🖼️ CHARACTER IMPORT: "${importCard.cardName}" has ${cardData.alternateImages.length} alternate image(s), auto-selecting first: "${selectedAlternateImage}"`);
                }
                
                console.log(`➕ CHARACTER IMPORT: Calling addCardToEditor("${importCard.type}", "${importCard.cardId}", "${importCard.cardName}", ${selectedAlternateImage ? `"${selectedAlternateImage}"` : 'null'})`);
                console.log(`📊 CHARACTER IMPORT: deckEditorCards BEFORE call:`, window.deckEditorCards?.length || 0, 'cards');
                
                // Check if addCardToEditor exists
                if (typeof addCardToEditor === 'function') {
                    // Call addCardToEditor with selected alternate image (or null if none)
                    const beforeCall = window.deckEditorCards?.length || 0;
                    await addCardToEditor(importCard.type, importCard.cardId, importCard.cardName, selectedAlternateImage);
                    const immediatelyAfter = window.deckEditorCards?.length || 0;
                    
                    console.log(`📊 CHARACTER IMPORT: deckEditorCards immediately AFTER call:`, immediatelyAfter, 'cards (was:', beforeCall, ')');
                    
                    // Wait a bit for async operations to complete
                    await new Promise(resolve => setTimeout(resolve, 100));
                    const afterDelay = window.deckEditorCards?.length || 0;
                    console.log(`📊 CHARACTER IMPORT: deckEditorCards after 100ms delay:`, afterDelay, 'cards');
                    
                    // Check if card was actually added
                    const wasAdded = window.deckEditorCards?.some(c => 
                        c.type === importCard.type && c.cardId === importCard.cardId
                    );
                    
                    console.log(`🔍 CHARACTER IMPORT: Verification for "${importCard.cardName}":`, {
                        wasAdded: wasAdded,
                        deckEditorCardsLength: window.deckEditorCards?.length || 0,
                        cardInDeck: wasAdded ? window.deckEditorCards?.find(c => c.cardId === importCard.cardId) : null
                    });
                    
                    if (wasAdded) {
                        console.log(`✅ CHARACTER IMPORT: Successfully added "${importCard.cardName}" to deck`);
                        successCount++;
                    } else {
                        console.log(`⚠️ CHARACTER IMPORT: addCardToEditor returned but "${importCard.cardName}" not found in deckEditorCards`);
                        console.log(`🔍 CHARACTER IMPORT: Current deckEditorCards:`, window.deckEditorCards);
                        console.log(`🔍 CHARACTER IMPORT: Looking for type="${importCard.type}", cardId="${importCard.cardId}"`);
                        errorCount++;
                        addErrors.push(`${importCard.cardName}: Card was not added to deck`);
                    }
                } else {
                    console.error(`❌ CHARACTER IMPORT: addCardToEditor function not available`);
                    throw new Error('addCardToEditor function not available');
                }
            } catch (error) {
                errorCount++;
                addErrors.push(`${importCard.cardName}: ${error.message}`);
                console.error(`❌ CHARACTER IMPORT: Error adding "${importCard.cardName}":`, error);
                console.error(`❌ CHARACTER IMPORT: Error stack:`, error.stack);
            }
        }
        
        console.log('📊 CHARACTER IMPORT: Final results - Success:', successCount, 'Failed:', errorCount);
        console.log('📊 CHARACTER IMPORT: Final deckEditorCards count:', window.deckEditorCards?.length || 0, 'cards');

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

    // TEMPORARY: Only extract characters for debugging
    // Characters (array of strings)
    if (Array.isArray(cardsData.characters)) {
        cardsData.characters.forEach(cardName => addCard(cardName, 'character'));
    }

    // TODO: Re-enable other card types after characters work
    // Special cards (object grouped by character name)
    // if (cardsData.special_cards && typeof cardsData.special_cards === 'object') {
    //     Object.values(cardsData.special_cards).forEach(characterCards => {
    //         if (Array.isArray(characterCards)) {
    //             characterCards.forEach(cardName => addCard(cardName, 'special'));
    //         }
    //     });
    // }

    // Locations (array of strings)
    // if (Array.isArray(cardsData.locations)) {
    //     cardsData.locations.forEach(cardName => addCard(cardName, 'location'));
    // }

    // Missions (object grouped by mission set)
    // if (cardsData.missions && typeof cardsData.missions === 'object') {
    //     Object.values(cardsData.missions).forEach(missionSetCards => {
    //         if (Array.isArray(missionSetCards)) {
    //             missionSetCards.forEach(cardName => addCard(cardName, 'mission'));
    //         }
    //     });
    // }

    // Events (object grouped by mission set)
    // if (cardsData.events && typeof cardsData.events === 'object') {
    //     Object.values(cardsData.events).forEach(eventSetCards => {
    //         if (Array.isArray(eventSetCards)) {
    //             eventSetCards.forEach(cardName => addCard(cardName, 'event'));
    //         }
    //     });
    // }

    // Aspects (array of strings)
    // if (Array.isArray(cardsData.aspects)) {
    //     cardsData.aspects.forEach(cardName => addCard(cardName, 'aspect'));
    // }

    // Advanced universe (object grouped by character)
    // if (cardsData.advanced_universe && typeof cardsData.advanced_universe === 'object') {
    //     Object.values(cardsData.advanced_universe).forEach(characterCards => {
    //         if (Array.isArray(characterCards)) {
    //             characterCards.forEach(cardName => addCard(cardName, 'advanced-universe'));
    //         }
    //     });
    // }

    // Teamwork (array of strings)
    // if (Array.isArray(cardsData.teamwork)) {
    //     cardsData.teamwork.forEach(cardName => addCard(cardName, 'teamwork'));
    // }

    // Allies (array of strings)
    // if (Array.isArray(cardsData.allies)) {
    //     cardsData.allies.forEach(cardName => addCard(cardName, 'ally-universe'));
    // }

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
 * Find card ID by name in availableCardsMap
 * Searches through the map for a card matching the name
 */
function findCardIdByName(cardName, cardType) {
    if (!window.availableCardsMap || !cardName || typeof cardName !== 'string') {
        return null;
    }

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
    let foundCard = window.availableCardsMap.get(cardName);
    if (foundCard && foundCard.id) {
        const foundName = foundCard.name || foundCard.card_name;
        const foundType = foundCard.type || foundCard.card_type;
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
        if (key.includes('_') && key !== card.id) {
            continue;
        }
        
        // Filter by card type if specified (except for power cards which are handled above)
        if (cardType && cardType !== 'power') {
            const cardTypeToMatch = card.type || card.card_type;
            if (!cardTypeToMatch) {
                continue;
            }
            // Normalize types (handle 'ally-universe' vs 'ally', etc.)
            const normalizedCardTypeToMatch = cardTypeToMatch.replace('-universe', '');
            const normalizedRequestedType = cardType.replace('-universe', '');
            if (normalizedCardTypeToMatch !== normalizedRequestedType) {
                continue;
            }
        }

        // Safely check card name - exact match required
        const cardNameMatch = (card.name && typeof card.name === 'string' && card.name === cardName) || 
                             (card.card_name && typeof card.card_name === 'string' && card.card_name === cardName);
        
        if (cardNameMatch) {
            return card.id;
        }
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
    
    // Debug: Confirm script loaded
    console.log('✅ Deck Import module loaded - importDeckFromJson available');
}

