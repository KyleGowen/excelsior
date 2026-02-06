// game-logic.js - Game logic (KO, drawing, team stats)
// Extracted from public/index.html

// ===== toggleKOCharacter through applyKODimming =====

async function toggleKOCharacter(cardId, index) {
    try {
        if (!window.SimulateKO) {
            console.error('SimulateKO module not loaded');
            return;
        }
        console.log('🔘 toggleKOCharacter called:', cardId, index);
        await window.SimulateKO.toggleKOCharacter(cardId, index, {
            renderCardView: renderDeckCardsCardView,
            renderListView: renderDeckCardsListView,
            renderTileView: displayDeckCardsForEditing
        });
    } catch (error) {
        console.error('Error in toggleKOCharacter:', error);
    }
}

function getActiveCharacters() {
    if (!window.SimulateKO) {
        return [];
    }
    return window.SimulateKO.getActiveCharacters();
}

function calculateActiveTeamStats() {
    if (!window.SimulateKO) {
        return { maxEnergy: 0, maxCombat: 0, maxBruteForce: 0, maxIntelligence: 0 };
    }
    return window.SimulateKO.calculateActiveTeamStats();
}

/**
 * Check if Spartan Training Ground location is in the deck
 * @returns {boolean} True if Spartan Training Ground is present
 */
function hasSpartanTrainingGround() {
    if (!window.deckEditorCards || !window.availableCardsMap) {
        return false;
    }
    
    return window.deckEditorCards.some(card => {
        if (card.type !== 'location') return false;
        const locationData = window.availableCardsMap.get(card.cardId);
        return locationData && (locationData.name === 'Spartan Training Ground' || locationData.card_name === 'Spartan Training Ground');
    });
}

/**
 * Check if Dracula's Armory location is in the deck
 * @returns {boolean} True if Dracula's Armory is present
 */
function hasDraculasArmory() {
    if (!window.deckEditorCards || !window.availableCardsMap) {
        return false;
    }
    
    return window.deckEditorCards.some(card => {
        if (card.type !== 'location') return false;
        const locationData = window.availableCardsMap.get(card.cardId);
        return locationData && (locationData.name === "Dracula's Armory" || locationData.card_name === "Dracula's Armory");
    });
}

/**
 * Check if Lancelot character is in the deck
 * @returns {boolean} True if Lancelot is present
 */
function hasLancelot() {
    if (!window.deckEditorCards || !window.availableCardsMap) {
        return false;
    }
    
    return window.deckEditorCards.some(card => {
        if (card.type !== 'character') return false;
        const characterData = window.availableCardsMap.get(card.cardId);
        return characterData && (characterData.name === 'Lancelot' || card.cardId === 'character_lancelot' || card.cardId.includes('lancelot'));
    });
}

/**
 * Toggle exclude_from_draw flag for a Training card (Pre-Placed button)
 * @param {string} cardId - The card ID
 * @param {number} index - The index of the card in deckEditorCards
 */
async function drawTrainingCard(cardId, index) {
    try {
        const card = window.deckEditorCards[index];
        
        // Validate card exists and is a Training card
        if (!card || card.cardId !== cardId || card.type !== 'training') {
            console.warn('drawTrainingCard: Card not found or not a Training card', { cardId, index });
            return;
        }
        
        // Toggle exclude_from_draw flag
        // If undefined or false, set to true; if true, set to false
        card.exclude_from_draw = card.exclude_from_draw === true ? false : true;
        
        // Capture current expansion state before re-rendering
        const currentExpansionState = getExpansionState();
        
        // Capture current scroll position before re-rendering
        const deckCardsEditor = document.querySelector('.deck-cards-editor');
        const currentScrollTop = deckCardsEditor ? deckCardsEditor.scrollTop : 0;
        
        // Re-render the current view
        if (deckCardsEditor && deckCardsEditor.classList.contains('card-view')) {
            // Card View is active - re-render Card View
            await renderDeckCardsCardView();
        } else if (deckCardsEditor && deckCardsEditor.classList.contains('list-view')) {
            // List View is active - re-render List View
            await renderDeckCardsListView();
        } else {
            // Tile View is active - re-render Tile View
            await displayDeckCardsForEditing();
        }
        
        // Restore scroll position after re-rendering
        setTimeout(() => {
            if (deckCardsEditor) {
                deckCardsEditor.scrollTop = currentScrollTop;
            }
        }, 10);
        
        // Restore the expansion state after re-rendering
        applyUIPreferences({ expansionState: currentExpansionState });
        
        // Show notification
        const cardData = window.availableCardsMap.get(cardId);
        const cardName = cardData ? (cardData.name || cardData.card_name || cardId) : cardId;
        const message = card.exclude_from_draw 
            ? `"${cardName}" marked as Pre-Placed (excluded from Draw Hand)`
            : `"${cardName}" included in Draw Hand`;
        showNotification(message, 'success');
        
        // Update deck validation
        await showDeckValidation(window.deckEditorCards);
    } catch (error) {
        console.error('Error in drawTrainingCard:', error);
        showNotification('Error toggling Pre-Placed status', 'error');
    }
}

/**
 * Toggle exclude_from_draw flag for a Basic Universe card (Pre-Placed button)
 * @param {string} cardId - The card ID
 * @param {number} index - The index of the card in deckEditorCards
 */
async function drawBasicUniverseCard(cardId, index) {
    try {
        const card = window.deckEditorCards[index];
        
        // Validate card exists and is a Basic Universe card
        if (!card || card.cardId !== cardId || card.type !== 'basic-universe') {
            console.warn('drawBasicUniverseCard: Card not found or not a Basic Universe card', { cardId, index });
            return;
        }
        
        // Toggle exclude_from_draw flag
        // If undefined or false, set to true; if true, set to false
        card.exclude_from_draw = card.exclude_from_draw === true ? false : true;
        
        // Capture current expansion state before re-rendering
        const currentExpansionState = getExpansionState();
        
        // Capture current scroll position before re-rendering
        const deckCardsEditor = document.querySelector('.deck-cards-editor');
        const currentScrollTop = deckCardsEditor ? deckCardsEditor.scrollTop : 0;
        
        // Re-render the current view
        if (deckCardsEditor && deckCardsEditor.classList.contains('card-view')) {
            // Card View is active - re-render Card View
            await renderDeckCardsCardView();
        } else if (deckCardsEditor && deckCardsEditor.classList.contains('list-view')) {
            // List View is active - re-render List View
            await renderDeckCardsListView();
        } else {
            // Tile View is active - re-render Tile View
            await displayDeckCardsForEditing();
        }
        
        // Restore scroll position after re-rendering
        setTimeout(() => {
            if (deckCardsEditor) {
                deckCardsEditor.scrollTop = currentScrollTop;
            }
        }, 10);
        
        // Restore the expansion state after re-rendering
        applyUIPreferences({ expansionState: currentExpansionState });
        
        // Show notification
        const cardData = window.availableCardsMap.get(cardId);
        const cardName = cardData ? (cardData.name || cardData.card_name || cardId) : cardId;
        const message = card.exclude_from_draw 
            ? `"${cardName}" marked as Pre-Placed (excluded from Draw Hand)`
            : `"${cardName}" included in Draw Hand`;
        showNotification(message, 'success');
        
        // Update deck validation
        await showDeckValidation(window.deckEditorCards);
    } catch (error) {
        console.error('Error in drawBasicUniverseCard:', error);
        showNotification('Error toggling Pre-Placed status', 'error');
    }
}

/**
 * Toggle exclude_from_draw flag for Sword and Shield special card (Pre-Placed button)
 * @param {string} cardId - The card ID
 * @param {number} index - The index of the card in deckEditorCards
 */
async function drawSwordAndShield(cardId, index) {
    try {
        const card = window.deckEditorCards[index];
        
        // Validate card exists and is Sword and Shield special card
        if (!card || card.cardId !== cardId || card.type !== 'special') {
            console.warn('drawSwordAndShield: Card not found or not a special card', { cardId, index });
            return;
        }
        
        // Verify it's actually Sword and Shield
        const cardData = window.availableCardsMap.get(cardId);
        const cardName = cardData ? (cardData.name || cardData.card_name || '') : '';
        if (cardName !== 'Sword and Shield' && !cardId.includes('sword_and_shield') && !cardId.includes('sword-and-shield')) {
            console.warn('drawSwordAndShield: Card is not Sword and Shield', { cardId, cardName, index });
            return;
        }
        
        // Toggle exclude_from_draw flag
        // If undefined or false, set to true; if true, set to false
        card.exclude_from_draw = card.exclude_from_draw === true ? false : true;
        
        // Capture current expansion state before re-rendering
        const currentExpansionState = getExpansionState();
        
        // Capture current scroll position before re-rendering
        const deckCardsEditor = document.querySelector('.deck-cards-editor');
        const currentScrollTop = deckCardsEditor ? deckCardsEditor.scrollTop : 0;
        
        // Re-render the current view
        if (deckCardsEditor && deckCardsEditor.classList.contains('card-view')) {
            // Card View is active - re-render Card View
            await renderDeckCardsCardView();
        } else if (deckCardsEditor && deckCardsEditor.classList.contains('list-view')) {
            // List View is active - re-render List View
            await renderDeckCardsListView();
        } else {
            // Tile View is active - re-render Tile View
            await displayDeckCardsForEditing();
        }
        
        // Restore scroll position after re-rendering
        setTimeout(() => {
            if (deckCardsEditor) {
                deckCardsEditor.scrollTop = currentScrollTop;
            }
        }, 10);
        
        // Restore the expansion state after re-rendering
        applyUIPreferences({ expansionState: currentExpansionState });
        
        // Show notification
        const displayName = cardName || cardId;
        const message = card.exclude_from_draw 
            ? `"${displayName}" marked as Pre-Placed (excluded from Draw Hand)`
            : `"${displayName}" included in Draw Hand`;
        showNotification(message, 'success');
        
        // Update deck validation
        await showDeckValidation(window.deckEditorCards);
    } catch (error) {
        console.error('Error in drawSwordAndShield:', error);
        showNotification('Error toggling Pre-Placed status', 'error');
    }
}

function applyKODimming() {
    if (!window.SimulateKO) {
        return;
    }
    window.SimulateKO.applyDimming();
}


// Export all functions to window for backward compatibility
window.toggleKOCharacter = toggleKOCharacter;
window.getActiveCharacters = getActiveCharacters;
window.calculateActiveTeamStats = calculateActiveTeamStats;
window.hasSpartanTrainingGround = hasSpartanTrainingGround;
window.hasDraculasArmory = hasDraculasArmory;
window.hasLancelot = hasLancelot;
window.drawTrainingCard = drawTrainingCard;
window.drawBasicUniverseCard = drawBasicUniverseCard;
window.drawSwordAndShield = drawSwordAndShield;
window.applyKODimming = applyKODimming;
