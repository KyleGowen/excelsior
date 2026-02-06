// deck-card-operations.js - Deck card add/remove/modify operations
// Extracted from public/index.html

// ===== changeCardQuantity, removeCardFromDeck =====

async function changeCardQuantity(cardId, change) {
    if (!currentDeckId) return;
    
    try {
        const response = await fetch(`/api/decks/${currentDeckId}/cards`, {
            method: change > 0 ? 'POST' : 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                cardType: 'character', // TODO: Get actual card type
                cardId: cardId,
                quantity: Math.abs(change)
            })
        });

        const data = await response.json();
        if (data.success) {
            // Reload deck details to show updated quantities
            loadDeckDetails(currentDeckId);
            // Refresh deck list
            loadDecks();
        } else {
            showNotification('Failed to update card quantity: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Error updating card quantity:', error);
        showNotification('Failed to update card quantity', 'error');
    }
}


// ===== addCardToDeck =====

async function addCardToDeck(cardType, cardId) {
    if (!currentDeckId) {
        showNotification('No deck selected', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/api/decks/${currentDeckId}/cards`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                cardType,
                cardId,
                quantity: 1
            })
        });

        const data = await response.json();
        if (data.success) {
            showNotification('Card added to deck!', 'success');
            // Reload deck details
            loadDeckDetails(currentDeckId);
            // Refresh deck list
            loadDecks();
            // Close add cards modal
            closeAddCardsModal();
        } else {
            showNotification('Failed to add card: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Error adding card to deck:', error);
        showNotification('Failed to add card to deck', 'error');
    }
}


// ===== addAllMissionSetCards, addAllPowerCards =====

function addAllMissionSetCards(missionSetName, cards) {
    console.log(`Adding all cards from mission set: ${missionSetName}`, cards);
    
    // Check mission limit first
    const currentMissionCount = window.deckEditorCards
        .filter(card => card.type === 'mission')
        .reduce((total, card) => total + card.quantity, 0);
    
    if (currentMissionCount >= 7) {
        showNotification('Cannot add more missions. Mission limit reached (max 7)', 'error');
        return;
    }
    
    let addedCount = 0;
    
    cards.forEach(card => {
        // Check if card is already in deck
        const existingCard = window.deckEditorCards.find(deckCard => 
            deckCard.type === 'mission' && deckCard.cardId === card.id
        );
        
        // Check if we've reached the limit
        if (currentMissionCount + addedCount >= 7) {
            showNotification(`Mission limit reached (max 7). Only added ${addedCount} cards from ${missionSetName}`, 'warning');
            return;
        }
        
        if (!existingCard) {
            addCardToEditor('mission', card.id, card.card_name || card.name);
            addedCount++;
        }
    });
    
    if (addedCount > 0) {
        showNotification(`Added ${addedCount} cards from ${missionSetName}`, 'success');
    } else {
        showNotification(`All cards from ${missionSetName} are already in the deck`, 'info');
    }
}

function addAllPowerCards(powerType, cards) {
    console.log(`Adding all ${powerType} power cards:`, cards);
    
    let addedCount = 0;
    
    cards.forEach(card => {
        // Check if card is already in deck
        const existingCard = window.deckEditorCards.find(deckCard => 
            deckCard.type === 'power' && deckCard.cardId === card.id
        );
        
        if (!existingCard) {
            addCardToEditor('power', card.id, `${card.value} - ${card.power_type}`);
            addedCount++;
        }
    });
    
    if (addedCount > 0) {
        showNotification(`Added ${addedCount} ${powerType} power cards to deck`, 'success');
    } else {
        showNotification(`All ${powerType} power cards are already in the deck`, 'info');
    }
}


// ===== removeCardFromEditor through addAllAdvancedUniverseCardsForCharacter =====

async function removeCardFromEditor(index) {
    console.log('🗑️ removeCardFromEditor called with index:', index);
    console.log('📊 Before removal - deckEditorCards:', window.deckEditorCards);
    
    const layout = document.querySelector('.deck-editor-layout');
    const deckPane = document.querySelector('.deck-pane');
    const cardSelectorPane = document.querySelector('.card-selector-pane');
    
    // Read-only mode removed - now handled by backend flag
    
    // Capture current expansion state before re-rendering
    const currentExpansionState = getExpansionState();
    
    // Capture current scroll position before re-rendering
    const deckCardsEditor = document.querySelector('.deck-cards-editor');
    const currentScrollTop = deckCardsEditor ? deckCardsEditor.scrollTop : 0;
    
    const removedCard = window.deckEditorCards[index];
    
    // If removing a character, also remove it from KO set
    if (removedCard && removedCard.type === 'character' && window.SimulateKO) {
        window.SimulateKO.removeCharacter(removedCard.cardId);
    }
    
    window.deckEditorCards.splice(index, 1);
    
    // Preserve current view when removing cards
    if (deckCardsEditor && deckCardsEditor.classList.contains('card-view')) {
        // Card View: re-render Card View
        renderDeckCardsCardView();
    } else if (deckCardsEditor && deckCardsEditor.classList.contains('list-view')) {
        // List View: re-render List View
        renderDeckCardsListView();
    } else {
        // Tile View (default): re-render Tile View
        await displayDeckCardsForEditing();
    }
    
    // Restore scroll position after re-rendering
    if (deckCardsEditor) {
        deckCardsEditor.scrollTop = currentScrollTop;
    }
    
    // Ultra-aggressive layout enforcement
    ultraAggressiveLayoutEnforcement();
    
    // Check layout after removal and enforcement
    setTimeout(() => {
        // Force layout enforcement if needed
        ensureTwoPaneLayout();
    }, 100);
    
    // Restore the expansion state after re-rendering
    applyUIPreferences({ expansionState: currentExpansionState });
    updateDeckEditorCardCount();
    
    // Update character limit status without affecting collapse state
    updateCharacterLimitStatus();
    
    // Update location limit status without affecting collapse state
    updateLocationLimitStatus();
    
    // Update mission limit status without affecting collapse state
    updateMissionLimitStatus();
    
    // Update location limit status without affecting collapse state
    updateLocationLimitStatus();
    
    // Update One Per Deck limit status
    updateOnePerDeckLimitStatus();
    
    // Update Cataclysm limit status
    updateCataclysmLimitStatus();
    
    // Update Assist limit status
    updateAssistLimitStatus();
    updateAmbushLimitStatus();
    updateFortificationLimitStatus();
    
    // Update special cards filter if it's active
    updateSpecialCardsFilter();
    
    // Update advanced universe filter if it's active
    updateAdvancedUniverseFilter();
    
    // Update power cards filter if it's active
    updatePowerCardsFilter();
    
    // Update basic universe filter if it's active
    updateBasicUniverseFilter();
    
    // Update teamwork filter if it's active
    updateTeamworkFilter();
    
    // Update training filter if it's active
    updateTrainingFilter();
    
    // Update ally universe filter if it's active
    updateAllyUniverseFilter();
    
    
    // Validate deck after removing card
    await showDeckValidation(window.deckEditorCards);
}

async function removeOneCardFromEditor(index) {
    console.log('🗑️ removeOneCardFromEditor called with index:', index);
    console.log('📊 Before removal - deckEditorCards:', window.deckEditorCards);
    
    if (window.deckEditorCards[index]) {
        // Capture current expansion state before re-rendering
        const currentExpansionState = getExpansionState();
        
        // Capture current scroll position before re-rendering
        const deckCardsEditor = document.querySelector('.deck-cards-editor');
        const currentScrollTop = deckCardsEditor ? deckCardsEditor.scrollTop : 0;
        
        if (window.deckEditorCards[index].quantity > 1) {
            // If there are multiple cards, decrease quantity by 1
            window.deckEditorCards[index].quantity -= 1;
        } else {
            // If there's only 1 card, remove the entire card
            window.deckEditorCards.splice(index, 1);
        }
        
        // Re-render the current view instead of always using Tile View
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
        
        // Restore scroll position after re-rendering with a small delay to ensure DOM is fully updated
        setTimeout(() => {
            if (deckCardsEditor) {
                deckCardsEditor.scrollTop = currentScrollTop;
            }
        }, 10);
        
        // Ultra-aggressive layout enforcement
        ultraAggressiveLayoutEnforcement();
        
        // Restore the expansion state after re-rendering
        applyUIPreferences({ expansionState: currentExpansionState });
        updateDeckEditorCardCount();
        
        // Update character limit status without affecting collapse state
        updateCharacterLimitStatus();
    
    // Update location limit status without affecting collapse state
    updateLocationLimitStatus();
        
        // Update location limit status without affecting collapse state
        updateLocationLimitStatus();
        
        // Update mission limit status without affecting collapse state
        updateMissionLimitStatus();
        
        // Update One Per Deck limit status
        updateOnePerDeckLimitStatus();
        
        // Update special cards filter if it's active
        updateSpecialCardsFilter();
        
        // Update advanced universe filter if it's active
        updateAdvancedUniverseFilter();
        
        // Update power cards filter if it's active
        updatePowerCardsFilter();
        
        // Update basic universe filter if it's active
        updateBasicUniverseFilter();
        
        // Update teamwork filter if it's active
        updateTeamworkFilter();
        
        // Update training filter if it's active
        updateTrainingFilter();
        
        // Update ally universe filter if it's active
        updateAllyUniverseFilter();
        
        // Validate deck after removing card
        await showDeckValidation(window.deckEditorCards);
        
        // Preserve scroll position after card changes
        setTimeout(() => {
            // Don't change scroll position when adding/removing cards
            // The user should stay where they were
        }, 50);
    }
}

async function addOneCardToEditor(index) {
    if (window.deckEditorCards[index]) {
        // Capture current expansion state before re-rendering
        const currentExpansionState = getExpansionState();
        
        // Capture current scroll position before re-rendering
        const deckCardsEditor = document.querySelector('.deck-cards-editor');
        const currentScrollTop = deckCardsEditor ? deckCardsEditor.scrollTop : 0;
        
        // Check "One Per Deck" limit before increasing quantity
        const card = window.deckEditorCards[index];
        const cardData = window.availableCardsMap.get(card.cardId);
        const isOnePerDeck = cardData && (cardData.one_per_deck === true || cardData.is_one_per_deck === true);
        if (isOnePerDeck) {
            const cardName = cardData.name || cardData.card_name || 'Unknown Card';
            showNotification(`Cannot add more than 1 copy of "${cardName}" - One Per Deck`, 'error');
            return;
        }
        
        // Check Cataclysm limit before increasing quantity
        const isCataclysm = cardData && cardData.is_cataclysm === true;
        if (isCataclysm) {
            console.log('🚫 Card is cataclysm, blocking quantity increase');
            showNotification(`Cannot add more than 1 Cataclysm to a deck`, 'error');
            return;
        }
        
        // Increase quantity by 1
        window.deckEditorCards[index].quantity += 1;
        
        // Re-render the current view instead of always using Tile View
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
        
        // Restore scroll position after re-rendering with a small delay to ensure DOM is fully updated
        setTimeout(() => {
            if (deckCardsEditor) {
                deckCardsEditor.scrollTop = currentScrollTop;
            }
        }, 10);
        
        // Ultra-aggressive layout enforcement
        ultraAggressiveLayoutEnforcement();
        
        // Additional enforcement for list view to prevent 4-column layout
        if (deckCardsEditor && deckCardsEditor.classList.contains('list-view')) {
            // Don't call enforceTwoColumnLayoutInListView here - let the main layout system handle it
            // enforceTwoColumnLayoutInListView();
        }
        
        // Restore the expansion state after re-rendering
        applyUIPreferences({ expansionState: currentExpansionState });
        updateDeckEditorCardCount();
        
        // Update character limit status without affecting collapse state
        updateCharacterLimitStatus();
    
    // Update location limit status without affecting collapse state
    updateLocationLimitStatus();
        
        // Update location limit status without affecting collapse state
        updateLocationLimitStatus();
        
        // Update mission limit status without affecting collapse state
        updateMissionLimitStatus();
        
        // Update One Per Deck limit status
        updateOnePerDeckLimitStatus();
        
        // Update special cards filter if it's active
        updateSpecialCardsFilter();
        
        // Update advanced universe filter if it's active
        updateAdvancedUniverseFilter();
        
        // Update power cards filter if it's active
        updatePowerCardsFilter();
        
        // Update basic universe filter if it's active
        updateBasicUniverseFilter();
        
        // Update teamwork filter if it's active
        updateTeamworkFilter();
        
        // Update training filter if it's active
        updateTrainingFilter();
        
        // Update ally universe filter if it's active
        updateAllyUniverseFilter();
        
        // Validate deck after adding card
        await showDeckValidation(window.deckEditorCards);
        
        // Preserve scroll position after card changes
        setTimeout(() => {
            // Don't change scroll position when adding/removing cards
            // The user should stay where they were
        }, 50);
    }
}

async function removeAllMissionsFromDeck() {
    const missionCount = window.deckEditorCards.filter(card => card.type === 'mission').length;
    
    if (missionCount === 0) {
        showNotification('No missions to remove', 'info');
        return;
    }
    
    // Capture current expansion state before re-rendering
    const currentExpansionState = getExpansionState();
    
    // Capture current scroll position before re-rendering
    const deckCardsEditor = document.querySelector('.deck-cards-editor');
    const currentScrollTop = deckCardsEditor ? deckCardsEditor.scrollTop : 0;
    
    // Remove all mission cards
    window.deckEditorCards = window.deckEditorCards.filter(card => card.type !== 'mission');
    
    await displayDeckCardsForEditing();
    
    // Restore scroll position after re-rendering
    if (deckCardsEditor) {
        deckCardsEditor.scrollTop = currentScrollTop;
    }
    
    // Restore the expansion state after re-rendering
    applyUIPreferences({ expansionState: currentExpansionState });
    updateDeckEditorCardCount();
    
    // Update mission limit status
    updateMissionLimitStatus();
    
    // Update One Per Deck limit status
    updateOnePerDeckLimitStatus();
    
    // Update Cataclysm limit status
    updateCataclysmLimitStatus();
    
    // Update Assist limit status
    updateAssistLimitStatus();
    updateAmbushLimitStatus();
    updateFortificationLimitStatus();
    
    // Update special cards filter if it's active
    updateSpecialCardsFilter();
    
    // Update advanced universe filter if it's active
    updateAdvancedUniverseFilter();
    
    // Update power cards filter if it's active
    updatePowerCardsFilter();
    
    // Update basic universe filter if it's active
    updateBasicUniverseFilter();
    
    // Update teamwork filter if it's active
    updateTeamworkFilter();
    
    // Update training filter if it's active
    updateTrainingFilter();
    
    // Update ally universe filter if it's active
    updateAllyUniverseFilter();
    
    
    // Validate deck after removing missions
    await showDeckValidation(window.deckEditorCards);
    
    showNotification(`Removed ${missionCount} mission cards from deck`, 'success');
}

async function removeAllCardsFromDeck(cardType) {
    const cardCount = window.deckEditorCards.filter(card => card.type === cardType).length;
    
    if (cardCount === 0) {
        showNotification(`No ${cardType} cards to remove`, 'info');
        return;
    }
    
    // Capture current expansion state before re-rendering
    const currentExpansionState = getExpansionState();
    
    // Capture current scroll position before re-rendering
    const deckCardsEditor = document.querySelector('.deck-cards-editor');
    const currentScrollTop = deckCardsEditor ? deckCardsEditor.scrollTop : 0;
    
    // Remove all cards of this type
    window.deckEditorCards = window.deckEditorCards.filter(card => card.type !== cardType);
    
    await displayDeckCardsForEditing();
    
    // Restore scroll position after re-rendering
    if (deckCardsEditor) {
        deckCardsEditor.scrollTop = currentScrollTop;
    }
    
    // Restore the expansion state after re-rendering
    applyUIPreferences({ expansionState: currentExpansionState });
    updateDeckEditorCardCount();
    
    // Update character limit status if removing characters
    if (cardType === 'character') {
        updateCharacterLimitStatus();
    
    // Update location limit status without affecting collapse state
    updateLocationLimitStatus();
        
        // Update location limit status without affecting collapse state
        updateLocationLimitStatus();
    }
    
    // Update location limit status if removing locations
    if (cardType === 'location') {
        updateLocationLimitStatus();
    }
    
    // Update mission limit status if removing missions
    if (cardType === 'mission') {
        updateMissionLimitStatus();
    }
    
    // Update One Per Deck limit status
    updateOnePerDeckLimitStatus();
    
    // Update Cataclysm limit status
    updateCataclysmLimitStatus();
    
    // Update Assist limit status
    updateAssistLimitStatus();
    updateAmbushLimitStatus();
    updateFortificationLimitStatus();
    
    // Update special cards filter if it's active
    updateSpecialCardsFilter();
    
    // Update advanced universe filter if it's active
    updateAdvancedUniverseFilter();
    
    // Update power cards filter if it's active
    updatePowerCardsFilter();
    
    // Update basic universe filter if it's active
    updateBasicUniverseFilter();
    
    // Update teamwork filter if it's active
    updateTeamworkFilter();
    
    // Update training filter if it's active
    updateTrainingFilter();
    
    // Update ally universe filter if it's active
    updateAllyUniverseFilter();
    
    
    // Validate deck after removing cards
    await showDeckValidation(window.deckEditorCards);
    
    const typeName = formatCardType(cardType);
    showNotification(`Removed ${cardCount} ${typeName.toLowerCase()} from deck`, 'success');
}

async function removeUnusableSpecialCards() {
    // Get all selected characters
    const selectedCharacters = window.deckEditorCards.filter(card => card.type === 'character');
    
    if (selectedCharacters.length === 0) {
        showNotification('No characters selected - cannot determine usable special cards', 'info');
        return;
    }
    
    // Get character names
    const characterNames = selectedCharacters.map(charCard => {
        // Direct lookup using UUID
        const availableCard = window.availableCardsMap.get(charCard.cardId);
        return availableCard ? (availableCard.name || availableCard.card_name) : null;
    }).filter(name => name);
    
    // Get all special cards
    const specialCards = window.deckEditorCards.filter(card => card.type === 'special');
    
    if (specialCards.length === 0) {
        showNotification('No special cards to check', 'info');
        return;
    }
    
    // Find unusable special cards (those that don't belong to any selected character)
    const unusableCards = specialCards.filter(specialCard => {
        // Direct lookup using UUID
        const availableCard = window.availableCardsMap.get(specialCard.cardId);
        if (!availableCard) return true; // Remove if card not found
        
        // Check if this is an "Any Character" special card - these should never be removed
        const isAnyCharacter = availableCard.character === 'Any Character' || 
                             availableCard.character_name === 'Any Character' ||
                             (availableCard.characters && availableCard.characters.includes('Any Character'));
        
        if (isAnyCharacter) {
            return false; // Don't remove "Any Character" cards
        }
        
        // Check if this special card belongs to any selected character
        const belongsToCharacter = characterNames.some(charName => {
            const specialCharacter = availableCard.character || availableCard.character_name || '';
            
            // Handle "Any Character" specials
            if (specialCharacter === 'Any Character') {
                return true;
            }
            
            // Handle Angry Mob variants
            if (specialCharacter.startsWith('Angry Mob') && charName.startsWith('Angry Mob')) {
                // Generic "Angry Mob" specials can be used by any Angry Mob variant
                if (specialCharacter === 'Angry Mob') {
                    return true;
                }
                
                // Variant-specific specials (e.g., "Angry Mob: Middle Ages" or "Angry Mob - Middle Ages")
                const hasVariantQualifier = specialCharacter.includes(':') || specialCharacter.includes(' - ');
                if (hasVariantQualifier) {
                    // Extract variant from special card
                    const separator = specialCharacter.includes(':') ? ':' : ' - ';
                    const specialVariant = specialCharacter.split(separator)[1].trim();
                    
                    // Extract variant from character name (e.g., "Middle Ages" from "Angry Mob (Middle Ages)")
                    const charVariantMatch = charName.match(/\(([^)]+)\)/);
                    if (!charVariantMatch) return false;
                    const charVariant = charVariantMatch[1].trim();
                    
                    // Normalize for comparison (handle pluralization and case)
                    const normalize = (v) => v.toLowerCase().replace(/\s+/g, ' ').trim().replace(/s$/, '');
                    return normalize(specialVariant) === normalize(charVariant);
                }
                
                return false;
            }
            
            // Regular character matching
            return specialCharacter === charName || 
                   (availableCard.characters && availableCard.characters.includes(charName));
        });
        
        return !belongsToCharacter;
    });
    
    if (unusableCards.length === 0) {
        showNotification('All special cards are usable with selected characters', 'info');
        return;
    }
    
    // Remove unusable special cards
    const unusableIndices = unusableCards.map(card => 
        window.deckEditorCards.findIndex(deckCard => 
            deckCard.type === card.type && deckCard.cardId === card.cardId
        )
    ).sort((a, b) => b - a); // Sort in descending order to remove from end first
    
    // Capture current expansion state before re-rendering
    const currentExpansionState = getExpansionState();
    
    unusableIndices.forEach(index => {
        window.deckEditorCards.splice(index, 1);
    });
    
    // Check if we're in Card View and render accordingly
    const deckCardsEditor = document.getElementById('deckCardsEditor');
    if (deckCardsEditor && deckCardsEditor.classList.contains('card-view')) {
        renderDeckCardsCardView();
    } else {
        await displayDeckCardsForEditing();
    }
    
    // Restore the expansion state after re-rendering
    applyUIPreferences({ expansionState: currentExpansionState });
    updateDeckEditorCardCount();
    
    // Update special cards filter if it's active
    updateSpecialCardsFilter();
    
    
    // Validate deck after removing cards
    await showDeckValidation(window.deckEditorCards);
    
    showNotification(`Removed ${unusableCards.length} unusable special cards`, 'success');
}

async function removeUnusableEvents() {
    // Get mission sets from current deck missions
    const deckMissionCards = window.deckEditorCards.filter(card => card.type === 'mission');
    const deckMissionSets = new Set();
    
    deckMissionCards.forEach(card => {
        const mission = window.availableCardsMap.get(card.cardId);
        if (mission && mission.mission_set) {
            deckMissionSets.add(mission.mission_set);
        }
    });
    
    // Get all event cards
    const eventCards = window.deckEditorCards.filter(card => card.type === 'event');
    
    if (eventCards.length === 0) {
        showNotification('No event cards to check', 'info');
        return;
    }
    
    // If no missions selected, all events are considered usable
    if (deckMissionSets.size === 0) {
        showNotification('No missions selected - all events are considered usable', 'info');
        return;
    }
    
    // Find unusable event cards (those whose mission_set doesn't match any deck mission set)
    const unusableCards = eventCards.filter(eventCard => {
        const availableCard = window.availableCardsMap.get(eventCard.cardId);
        if (!availableCard) return true; // Remove if card not found
        
        const eventMissionSet = availableCard.mission_set;
        return !eventMissionSet || !deckMissionSets.has(eventMissionSet);
    });
    
    if (unusableCards.length === 0) {
        showNotification('All event cards are usable with selected missions', 'info');
        return;
    }
    
    // Remove unusable event cards
    const unusableIndices = unusableCards.map(card => 
        window.deckEditorCards.findIndex(deckCard => 
            deckCard.type === card.type && deckCard.cardId === card.cardId
        )
    ).sort((a, b) => b - a); // Sort in descending order to remove from end first
    
    // Capture current expansion state before re-rendering
    const currentExpansionState = getExpansionState();
    
    unusableIndices.forEach(index => {
        window.deckEditorCards.splice(index, 1);
    });
    
    // Check if we're in Card View and render accordingly
    const deckCardsEditor = document.getElementById('deckCardsEditor');
    if (deckCardsEditor && deckCardsEditor.classList.contains('card-view')) {
        renderDeckCardsCardView();
    } else {
        await displayDeckCardsForEditing();
    }
    
    // Restore the expansion state after re-rendering
    applyUIPreferences({ expansionState: currentExpansionState });
    updateDeckEditorCardCount();
    
    // Validate deck after removing cards
    await showDeckValidation(window.deckEditorCards);
    
    showNotification(`Removed ${unusableCards.length} unusable event cards`, 'success');
}

async function removeUnusableAdvancedUniverse() {
    // Get all selected characters
    const selectedCharacters = window.deckEditorCards.filter(card => card.type === 'character');
    
    if (selectedCharacters.length === 0) {
        showNotification('No characters selected - cannot determine usable advanced universe cards', 'info');
        return;
    }
    
    // Get character names
    const characterNames = selectedCharacters.map(charCard => {
        const availableCard = window.availableCardsMap.get(charCard.cardId);
        return availableCard ? (availableCard.name || availableCard.card_name) : null;
    }).filter(name => name);
    
    // Get all advanced universe cards
    const advancedUniverseCards = window.deckEditorCards.filter(card => 
        card.type === 'advanced-universe' || card.type === 'advanced_universe'
    );
    
    if (advancedUniverseCards.length === 0) {
        showNotification('No advanced universe cards to check', 'info');
        return;
    }
    
    // Find unusable advanced universe cards (those that belong to KO'd characters or don't belong to any selected character)
    const unusableCards = advancedUniverseCards.filter(card => {
        const availableCard = window.availableCardsMap.get(card.cardId);
        if (!availableCard) return true; // Remove if card not found
        
        const characterName = availableCard.character;
        if (!characterName || characterName === 'Any Character') {
            return false; // Don't remove "Any Character" cards
        }
        
        // Check if this card belongs to any selected character
        return !characterNames.includes(characterName);
    });
    
    if (unusableCards.length === 0) {
        showNotification('All advanced universe cards are usable with selected characters', 'info');
        return;
    }
    
    // Remove unusable cards
    const unusableIndices = unusableCards.map(card => 
        window.deckEditorCards.findIndex(deckCard => 
            deckCard.type === card.type && deckCard.cardId === card.cardId
        )
    ).sort((a, b) => b - a);
    
    const currentExpansionState = getExpansionState();
    
    unusableIndices.forEach(index => {
        window.deckEditorCards.splice(index, 1);
    });
    
    // Check if we're in Card View and render accordingly
    const deckCardsEditor = document.getElementById('deckCardsEditor');
    if (deckCardsEditor && deckCardsEditor.classList.contains('card-view')) {
        renderDeckCardsCardView();
    } else {
        await displayDeckCardsForEditing();
    }
    
    applyUIPreferences({ expansionState: currentExpansionState });
    updateDeckEditorCardCount();
    await showDeckValidation(window.deckEditorCards);
    
    showNotification(`Removed ${unusableCards.length} unusable advanced universe cards`, 'success');
}

async function removeUnusableTraining() {
    // Get all selected characters
    const selectedCharacters = window.deckEditorCards.filter(card => card.type === 'character');
    
    if (selectedCharacters.length === 0) {
        showNotification('No characters selected - cannot determine usable training cards', 'info');
        return;
    }
    
    // Get active characters with stats
    const activeCharacters = selectedCharacters.map(charCard => {
        const availableCard = window.availableCardsMap.get(charCard.cardId);
        if (!availableCard) return null;
        
        const nameLower = (availableCard.name || availableCard.card_name || '').toLowerCase();
        return {
            cardId: charCard.cardId,
            name: availableCard.name || availableCard.card_name,
            energy: availableCard.energy || 0,
            combat: availableCard.combat || 0,
            brute_force: Math.max(availableCard.brute_force || 0, nameLower.includes('john carter') ? 8 : 0),
            intelligence: Math.max(availableCard.intelligence || 0, nameLower.includes('time traveler') ? 8 : 0)
        };
    }).filter(char => char !== null);
    
    // Get all training cards
    const trainingCards = window.deckEditorCards.filter(card => card.type === 'training');
    
    if (trainingCards.length === 0) {
        showNotification('No training cards to check', 'info');
        return;
    }
    
    // Find unusable training cards (those that no active character can use)
    const unusableCards = trainingCards.filter(card => {
        const availableCard = window.availableCardsMap.get(card.cardId);
        if (!availableCard) return true;
        
        const type1 = availableCard.type_1;
        const type2 = availableCard.type_2;
        const valueToUse = parseInt(availableCard.value_to_use) || 0;
        
        if (!type1 || !type2 || valueToUse <= 0) return false; // Skip invalid cards
        
        // Check if any active character can use this training card
        let canUse = false;
        activeCharacters.forEach(char => {
            if (canUse) return;
            
            let type1Stat = 0;
            let type2Stat = 0;
            
            switch (type1) {
                case 'Energy': type1Stat = char.energy; break;
                case 'Combat': type1Stat = char.combat; break;
                case 'Brute Force': type1Stat = char.brute_force; break;
                case 'Intelligence': type1Stat = char.intelligence; break;
            }
            
            switch (type2) {
                case 'Energy': type2Stat = char.energy; break;
                case 'Combat': type2Stat = char.combat; break;
                case 'Brute Force': type2Stat = char.brute_force; break;
                case 'Intelligence': type2Stat = char.intelligence; break;
            }
            
            // Card is usable if EITHER type meets the requirement (value_to_use or less)
            if (type1Stat <= valueToUse || type2Stat <= valueToUse) {
                canUse = true;
            }
        });
        
        return !canUse;
    });
    
    if (unusableCards.length === 0) {
        showNotification('All training cards are usable with selected characters', 'info');
        return;
    }
    
    // Remove unusable cards
    const unusableIndices = unusableCards.map(card => 
        window.deckEditorCards.findIndex(deckCard => 
            deckCard.type === card.type && deckCard.cardId === card.cardId
        )
    ).sort((a, b) => b - a);
    
    const currentExpansionState = getExpansionState();
    
    unusableIndices.forEach(index => {
        window.deckEditorCards.splice(index, 1);
    });
    
    // Check if we're in Card View and render accordingly
    const deckCardsEditor = document.getElementById('deckCardsEditor');
    if (deckCardsEditor && deckCardsEditor.classList.contains('card-view')) {
        renderDeckCardsCardView();
    } else {
        await displayDeckCardsForEditing();
    }
    
    applyUIPreferences({ expansionState: currentExpansionState });
    updateDeckEditorCardCount();
    await showDeckValidation(window.deckEditorCards);
    
    showNotification(`Removed ${unusableCards.length} unusable training cards`, 'success');
}

async function removeUnusableAllyUniverse() {
    // Get all selected characters
    const selectedCharacters = window.deckEditorCards.filter(card => card.type === 'character');
    
    if (selectedCharacters.length === 0) {
        showNotification('No characters selected - cannot determine usable ally universe cards', 'info');
        return;
    }
    
    // Get active characters with stats
    const activeCharacters = selectedCharacters.map(charCard => {
        const availableCard = window.availableCardsMap.get(charCard.cardId);
        if (!availableCard) return null;
        
        return {
            cardId: charCard.cardId,
            name: availableCard.name || availableCard.card_name,
            energy: availableCard.energy || 0,
            combat: availableCard.combat || 0,
            brute_force: availableCard.brute_force || 0,
            intelligence: availableCard.intelligence || 0
        };
    }).filter(char => char !== null);
    
    // Get all ally universe cards
    const allyCards = window.deckEditorCards.filter(card => 
        card.type === 'ally-universe' || card.type === 'ally_universe'
    );
    
    if (allyCards.length === 0) {
        showNotification('No ally universe cards to check', 'info');
        return;
    }
    
    // Special rule: If only one character, all ally cards are unusable (they require multiple characters)
    const shouldDimAllAlly = selectedCharacters.length === 1;
    
    // Find unusable ally cards
    const unusableCards = allyCards.filter(card => {
        if (shouldDimAllAlly) return true;
        
        const availableCard = window.availableCardsMap.get(card.cardId);
        if (!availableCard) return true;
        
        const statToUse = availableCard.stat_to_use || '';
        const statTypeToUse = availableCard.stat_type_to_use || '';
        const valueMatch = statToUse.match(/(\d+) or (less|higher)/);
        
        if (!valueMatch || !statTypeToUse) return false; // Skip invalid cards
        
        const requiredValue = parseInt(valueMatch[1]);
        const isLessThan = valueMatch[2] === 'less';
        
        // Check if any active character meets the requirement
        let canUse = false;
        activeCharacters.forEach(char => {
            if (canUse) return;
            
            let characterStat = 0;
            switch (statTypeToUse) {
                case 'Energy': characterStat = char.energy; break;
                case 'Combat': characterStat = char.combat; break;
                case 'Brute Force': characterStat = char.brute_force; break;
                case 'Intelligence': characterStat = char.intelligence; break;
            }
            
            const usable = isLessThan ? characterStat <= requiredValue : characterStat >= requiredValue;
            if (usable) {
                canUse = true;
            }
        });
        
        return !canUse;
    });
    
    if (unusableCards.length === 0) {
        showNotification('All ally universe cards are usable with selected characters', 'info');
        return;
    }
    
    // Remove unusable cards
    const unusableIndices = unusableCards.map(card => 
        window.deckEditorCards.findIndex(deckCard => 
            deckCard.type === card.type && deckCard.cardId === card.cardId
        )
    ).sort((a, b) => b - a);
    
    const currentExpansionState = getExpansionState();
    
    unusableIndices.forEach(index => {
        window.deckEditorCards.splice(index, 1);
    });
    
    // Check if we're in Card View and render accordingly
    const deckCardsEditor = document.getElementById('deckCardsEditor');
    if (deckCardsEditor && deckCardsEditor.classList.contains('card-view')) {
        renderDeckCardsCardView();
    } else {
        await displayDeckCardsForEditing();
    }
    
    applyUIPreferences({ expansionState: currentExpansionState });
    updateDeckEditorCardCount();
    await showDeckValidation(window.deckEditorCards);
    
    showNotification(`Removed ${unusableCards.length} unusable ally universe cards`, 'success');
}

async function removeUnusableBasicUniverse() {
    // Get all selected characters
    const selectedCharacters = window.deckEditorCards.filter(card => card.type === 'character');
    
    if (selectedCharacters.length === 0) {
        showNotification('No characters selected - cannot determine usable basic universe cards', 'info');
        return;
    }
    
    // Get active characters with stats
    const activeCharacters = selectedCharacters.map(charCard => {
        const availableCard = window.availableCardsMap.get(charCard.cardId);
        if (!availableCard) return null;
        
        return {
            cardId: charCard.cardId,
            name: availableCard.name || availableCard.card_name,
            energy: availableCard.energy || 0,
            combat: availableCard.combat || 0,
            brute_force: availableCard.brute_force || 0,
            intelligence: availableCard.intelligence || 0
        };
    }).filter(char => char !== null);
    
    // Get all basic universe cards
    const basicCards = window.deckEditorCards.filter(card => 
        card.type === 'basic-universe' || card.type === 'basic_universe'
    );
    
    if (basicCards.length === 0) {
        showNotification('No basic universe cards to check', 'info');
        return;
    }
    
    // Find unusable basic universe cards (those that no active character can use)
    const unusableCards = basicCards.filter(card => {
        const availableCard = window.availableCardsMap.get(card.cardId);
        if (!availableCard) return true;
        
        const buType = availableCard.type;
        const buValueMatch = (availableCard.value_to_use || '').match(/(\d+) or greater/);
        const buRequiredValue = buValueMatch ? parseInt(buValueMatch[1]) : 0;
        
        if (!buType || buRequiredValue <= 0) return false; // Skip invalid cards
        
        // Check if any active character meets the requirement
        let canUse = false;
        activeCharacters.forEach(char => {
            if (canUse) return;
            
            let characterStat = 0;
            switch (buType) {
                case 'Energy': characterStat = char.energy; break;
                case 'Combat': characterStat = char.combat; break;
                case 'Brute Force': characterStat = char.brute_force; break;
                case 'Intelligence': characterStat = char.intelligence; break;
            }
            
            if (characterStat >= buRequiredValue) {
                canUse = true;
            }
        });
        
        return !canUse;
    });
    
    if (unusableCards.length === 0) {
        showNotification('All basic universe cards are usable with selected characters', 'info');
        return;
    }
    
    // Remove unusable cards
    const unusableIndices = unusableCards.map(card => 
        window.deckEditorCards.findIndex(deckCard => 
            deckCard.type === card.type && deckCard.cardId === card.cardId
        )
    ).sort((a, b) => b - a);
    
    const currentExpansionState = getExpansionState();
    
    unusableIndices.forEach(index => {
        window.deckEditorCards.splice(index, 1);
    });
    
    // Check if we're in Card View and render accordingly
    const deckCardsEditor = document.getElementById('deckCardsEditor');
    if (deckCardsEditor && deckCardsEditor.classList.contains('card-view')) {
        renderDeckCardsCardView();
    } else {
        await displayDeckCardsForEditing();
    }
    
    applyUIPreferences({ expansionState: currentExpansionState });
    updateDeckEditorCardCount();
    await showDeckValidation(window.deckEditorCards);
    
    showNotification(`Removed ${unusableCards.length} unusable basic universe cards`, 'success');
}

async function removeUnusablePowerCards() {
    // Get all selected characters
    const selectedCharacters = window.deckEditorCards.filter(card => card.type === 'character');
    
    if (selectedCharacters.length === 0) {
        showNotification('No characters selected - cannot determine usable power cards', 'info');
        return;
    }
    
    // Get active characters with stats
    const activeCharacters = selectedCharacters.map(charCard => {
        const availableCard = window.availableCardsMap.get(charCard.cardId);
        if (!availableCard) return null;
        
        const nameLower = (availableCard.name || availableCard.card_name || '').toLowerCase();
        return {
            cardId: charCard.cardId,
            name: availableCard.name || availableCard.card_name,
            energy: availableCard.energy || 0,
            combat: availableCard.combat || 0,
            brute_force: Math.max(availableCard.brute_force || 0, nameLower.includes('john carter') ? 8 : 0),
            intelligence: Math.max(availableCard.intelligence || 0, nameLower.includes('time traveler') ? 8 : 0)
        };
    }).filter(char => char !== null);
    
    // Get all power cards
    const powerCards = window.deckEditorCards.filter(card => card.type === 'power');
    
    if (powerCards.length === 0) {
        showNotification('No power cards to check', 'info');
        return;
    }
    
    // Find unusable power cards (those that no active character can play)
    const unusableCards = powerCards.filter(card => {
        const availableCard = window.availableCardsMap.get(card.cardId);
        if (!availableCard) return true;
        
        const powerValue = parseInt(availableCard.value) || 0;
        const powerType = availableCard.power_type;
        
        if (!powerType || powerValue <= 0) return false; // Skip invalid cards
        
        // Check if any active character can play this power card
        let canUse = false;
        activeCharacters.forEach(char => {
            if (canUse) return;
            
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
                case 'Multi-Power':
                case 'Multi Power':
                    // Multi-Power requires sum of two highest stats
                    const stats = [char.energy, char.combat, char.brute_force, char.intelligence].sort((a, b) => b - a);
                    characterStat = (stats[0] || 0) + (stats[1] || 0);
                    break;
            }
            
            if (characterStat >= powerValue) {
                canUse = true;
            }
        });
        
        return !canUse;
    });
    
    if (unusableCards.length === 0) {
        showNotification('All power cards are usable with selected characters', 'info');
        return;
    }
    
    // Remove unusable cards
    const unusableIndices = unusableCards.map(card => 
        window.deckEditorCards.findIndex(deckCard => 
            deckCard.type === card.type && deckCard.cardId === card.cardId
        )
    ).sort((a, b) => b - a);
    
    const currentExpansionState = getExpansionState();
    
    unusableIndices.forEach(index => {
        window.deckEditorCards.splice(index, 1);
    });
    
    // Check if we're in Card View and render accordingly
    const deckCardsEditor = document.getElementById('deckCardsEditor');
    if (deckCardsEditor && deckCardsEditor.classList.contains('card-view')) {
        renderDeckCardsCardView();
    } else {
        await displayDeckCardsForEditing();
    }
    
    applyUIPreferences({ expansionState: currentExpansionState });
    updateDeckEditorCardCount();
    await showDeckValidation(window.deckEditorCards);
    
    showNotification(`Removed ${unusableCards.length} unusable power cards`, 'success');
}

function addAllSpecialCardsForCharacter(characterName) {
    console.log(`Adding all special cards for character: ${characterName}`);
    
    // Fetch special cards data to get the cards for this character
    fetch('/api/special-cards')
        .then(response => response.json())
        .then(data => {
            if (!data.success || !data.data) {
                showNotification('Error loading special cards', 'error');
                return;
            }
            
            // Filter cards for the specific character
            const characterCards = data.data.filter(card => {
                const specialCharacter = card.character || card.character_name || '';
                
                // Handle "Any Character" specials - only include them when clicking "Any Character" Add All
                if (specialCharacter === 'Any Character') {
                    return characterName === 'Any Character';
                }
                
                // Handle Angry Mob variants
                if (specialCharacter.startsWith('Angry Mob') && characterName.startsWith('Angry Mob')) {
                    // Generic "Angry Mob" specials can be used by any Angry Mob variant
                    if (specialCharacter === 'Angry Mob') {
                        return true;
                    }
                    
                    // Variant-specific specials (e.g., "Angry Mob: Middle Ages" or "Angry Mob - Middle Ages")
                    const hasVariantQualifier = specialCharacter.includes(':') || specialCharacter.includes(' - ');
                    if (hasVariantQualifier) {
                        // Extract variant from special card
                        const separator = specialCharacter.includes(':') ? ':' : ' - ';
                        const specialVariant = specialCharacter.split(separator)[1].trim();
                        
                        // Extract variant from character name (e.g., "Middle Ages" from "Angry Mob (Middle Ages)")
                        const charVariantMatch = characterName.match(/\(([^)]+)\)/);
                        if (!charVariantMatch) return false;
                        const charVariant = charVariantMatch[1].trim();
                        
                        // Normalize for comparison (handle pluralization and case)
                        const normalize = (v) => v.toLowerCase().replace(/\s+/g, ' ').trim().replace(/s$/, '');
                        return normalize(specialVariant) === normalize(charVariant);
                    }
                    
                    return false;
                }
                
                // Regular character matching
                return specialCharacter === characterName;
            });
            
            if (characterCards.length === 0) {
                showNotification(`No special cards found for ${characterName}`, 'info');
                return;
            }
            
            let addedCount = 0;
            
            characterCards.forEach(card => {
                // Check if card is already in deck
                const existingCard = window.deckEditorCards.find(deckCard => 
                    deckCard.type === 'special' && deckCard.cardId === card.id
                );
                
                if (!existingCard) {
                    addCardToEditor('special', card.id, card.name || card.card_name);
                    addedCount++;
                }
            });
            
            if (addedCount === 0) {
                showNotification(`All special cards for ${characterName} are already in the deck`, 'info');
            } else {
                showNotification(`Added ${addedCount} special cards for ${characterName} to deck`, 'success');
            }
        })
        .catch(error => {
            console.error('Error fetching special cards:', error);
            showNotification('Error loading special cards', 'error');
        });
}

function addAllAdvancedUniverseCardsForCharacter(characterName) {
    console.log(`Adding all advanced universe cards for character: ${characterName}`);
    
    // Fetch advanced universe cards data to get the cards for this character
    fetch('/api/advanced-universe')
        .then(response => response.json())
        .then(data => {
            if (!data.success || !data.data) {
                showNotification('Error loading advanced universe cards', 'error');
                return;
            }
            
            // Filter cards for the specific character
            const characterCards = data.data.filter(card => 
                (card.character || 'Any Character') === characterName
            );
            
            if (characterCards.length === 0) {
                showNotification(`No advanced universe cards found for ${characterName}`, 'info');
                return;
            }
            
            let addedCount = 0;
            
            characterCards.forEach(card => {
                // Check if card is already in deck
                const existingCard = window.deckEditorCards.find(deckCard => 
                    deckCard.type === 'advanced-universe' && deckCard.cardId === card.id
                );
                
                if (!existingCard) {
                    addCardToEditor('advanced-universe', card.id, card.name || card.card_name);
                    addedCount++;
                }
            });
            
            if (addedCount === 0) {
                showNotification(`All advanced universe cards for ${characterName} are already in the deck`, 'info');
            } else {
                showNotification(`Added ${addedCount} advanced universe cards for ${characterName} to deck`, 'success');
            }
        })
        .catch(error => {
            console.error('Error fetching advanced universe cards:', error);
            showNotification('Error loading advanced universe cards', 'error');
        });
}


// ===== addCardToEditor =====

async function addCardToEditor(cardType, cardId, cardName) {
    try {
        // Check character limit before adding
        if (cardType === 'character') {
            // Check if we already have this character in the deck
            const existingCharacter = window.deckEditorCards.find(card => card.type === 'character' && card.cardId === cardId);
            
            if (existingCharacter) {
                showNotification('This character is already in your deck', 'error');
                return;
            }
            
            // Check if we already have 4 different characters
            const uniqueCharacterCount = window.deckEditorCards
                .filter(card => card.type === 'character')
                .length;
            
            if (uniqueCharacterCount >= 4) {
                showNotification('Cannot add more than 4 different characters to a deck', 'error');
                return;
            }
        
        
        // Auto-activate special cards character filter when character is added
        setTimeout(async () => {
            const filterCheckbox = document.getElementById('specialCardsCharacterFilter');
            if (filterCheckbox && !filterCheckbox.checked) {
                filterCheckbox.checked = true;
                await toggleSpecialCardsCharacterFilter();
            }
        }, 100); // Small delay to ensure DOM is updated
    }
    
    // Check location limit before adding
    if (cardType === 'location') {
        // Check if we already have a location in the deck
        const existingLocation = window.deckEditorCards.find(card => card.type === 'location');
        
        if (existingLocation) {
            showNotification('Cannot add more than 1 location to a deck', 'error');
            return;
        }
    }
    
    // Check "One Per Deck" limit for all card types
    const cardData = window.availableCardsMap.get(cardId);
    const isOnePerDeck = cardData && (cardData.one_per_deck === true || cardData.is_one_per_deck === true);
    if (isOnePerDeck) {
        // Check if ANY art version of this card is already in the deck
        // For special cards, check by name + character_name + universe
        let existingOnePerDeckCard = null;
        if (cardType === 'special' && cardData && cardData.character_name) {
            existingOnePerDeckCard = window.deckEditorCards.find(deckCard => {
                if (deckCard.type !== 'special') return false;
                const deckCardData = window.availableCardsMap.get(deckCard.cardId);
                if (!deckCardData) return false;
                return deckCardData.name === cardData.name && 
                       deckCardData.character_name === cardData.character_name &&
                       (deckCardData.universe || 'ERB') === (cardData.universe || 'ERB');
            });
        } else {
            // For other cards, check by name + universe
            const cardNameToCheck = cardData?.name || cardData?.card_name || cardName;
            const cardUniverse = cardData?.universe || '';
            existingOnePerDeckCard = window.deckEditorCards.find(deckCard => {
                if (deckCard.type !== cardType) return false;
                const deckCardData = window.availableCardsMap.get(deckCard.cardId);
                if (!deckCardData) return false;
                const deckCardName = deckCardData.name || deckCardData.card_name || '';
                const deckCardUniverse = deckCardData.universe || '';
                if (cardUniverse && deckCardUniverse) {
                    return deckCardName === cardNameToCheck && deckCardUniverse === cardUniverse;
                }
                return deckCardName === cardNameToCheck;
            });
        }
        
        if (existingOnePerDeckCard) {
            showNotification(`Cannot add more than 1 copy of "${cardName}" - One Per Deck`, 'error');
            return;
        }
    }
    
    // Check Cataclysm limit for special cards
    const isCataclysm = cardData && cardData.is_cataclysm === true;
    if (isCataclysm) {
        // Check if we already have any cataclysm card in the deck
        const hasExistingCataclysm = window.deckEditorCards.some(card => {
            const cardData = window.availableCardsMap.get(card.cardId);
            return cardData && cardData.is_cataclysm === true;
        });
        
        if (hasExistingCataclysm) {
            showNotification(`Cannot add more than 1 Cataclysm to a deck`, 'error');
            return;
        }
    }
    
    // Check Assist limit for special cards
    const isAssist = cardData && cardData.is_assist === true;
    if (isAssist) {
        // Check if we already have any assist card in the deck
        const hasExistingAssist = window.deckEditorCards.some(card => {
            const cardData = window.availableCardsMap.get(card.cardId);
            return cardData && cardData.is_assist === true;
        });
        
        if (hasExistingAssist) {
            showNotification(`Cannot add more than 1 Assist to a deck`, 'error');
            return;
        }
    }
    
    // Check Ambush limit for special cards
    const isAmbush = cardData && cardData.is_ambush === true;
    if (isAmbush) {
        // Check if we already have any ambush card in the deck
        const hasExistingAmbush = window.deckEditorCards.some(card => {
            const cardData = window.availableCardsMap.get(card.cardId);
            return cardData && cardData.is_ambush === true;
        });
        
        if (hasExistingAmbush) {
            showNotification(`Cannot add more than 1 Ambush to a deck`, 'error');
            return;
        }
    }
    
    // Check Fortification limit for aspect cards
    const isFortification = cardData && cardData.is_fortification === true;
    if (isFortification) {
        // Check if we already have any fortification card in the deck
        const hasExistingFortification = window.deckEditorCards.some(card => {
            const cardData = window.availableCardsMap.get(card.cardId);
            return cardData && cardData.is_fortification === true;
        });
        
        if (hasExistingFortification) {
            showNotification(`Cannot add more than 1 Fortification to a deck`, 'error');
            return;
        }
    }
    
    // Check mission limit before adding
    if (cardType === 'mission') {
        const currentMissionCount = window.deckEditorCards
            .filter(card => card.type === 'mission')
            .reduce((total, card) => total + card.quantity, 0);
        
        if (currentMissionCount >= 7) {
            showNotification('Cannot add more than 7 missions to a deck', 'error');
            return;
        }
    }
    
    
    // Convert cardType to internal format for comparison
    let internalCardType = cardType;
    if (cardType === 'ally-universe') {
        internalCardType = 'ally_universe';
    } else if (cardType === 'basic-universe') {
        internalCardType = 'basic_universe';
    } else if (cardType === 'advanced-universe') {
        internalCardType = 'advanced_universe';
    }
    
    // Check if card already exists in deck (use frontend format for consistency)
    const existingCardIndex = window.deckEditorCards.findIndex(card => 
        card.type === cardType && card.cardId === cardId
    );
    
    if (existingCardIndex >= 0) {
        // For characters, don't allow adding duplicates
        if (cardType === 'character') {
            showNotification('This character is already in your deck', 'error');
            return;
        }
        
        // Check if this is a "One Per Deck" card
        const card = window.availableCardsMap.get(cardId);
        const isOnePerDeck = card && (card.one_per_deck === true || card.is_one_per_deck === true);
        if (isOnePerDeck) {
            showNotification(`Cannot add more than 1 copy of "${cardName}" - One Per Deck`, 'error');
            return;
        }
        
        // For other card types, increase quantity
        window.deckEditorCards[existingCardIndex].quantity += 1;
        // Show notification for adding additional copies
            showNotification(`Added another copy of ${cardName}`, 'success');
    } else {
        // Add new card (use frontend format for consistency with display function)
        const newCard = {
            id: `deckcard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: cardType,
            cardId: cardId,
            quantity: 1
        };
    window.deckEditorCards.push(newCard);
        
        // Show notification for adding first copy
        if (cardType !== 'character') {
            showNotification(`Added ${cardName} to deck`, 'success');
        }
    }
    
    // Preserve current expansion state when adding cards
    lastAddedCardType = cardType;
    
    // Capture current expansion state before re-rendering
    const currentExpansionState = getExpansionState();
    
    // Re-render the current view instead of always using Tile View
    const deckCardsEditor = document.querySelector('.deck-cards-editor');
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
    
    // Enforce horizontal layout in list view after adding card
    if (true) {
        setTimeout(() => {
            enforceListViewHorizontalLayout();
            // Don't call enforceTwoColumnLayoutInListView here - let the main layout system handle it
            // enforceTwoColumnLayoutInListView();
        }, 10);
    }
    
    // Restore the expansion state after re-rendering
    applyUIPreferences({ expansionState: currentExpansionState });
    updateDeckEditorCardCount();
    
    // Update character limit status without affecting collapse state
    updateCharacterLimitStatus();
    
    // Update location limit status without affecting collapse state
    updateLocationLimitStatus();
    
    // Update mission limit status without affecting collapse state
    updateMissionLimitStatus();
    
    // Update location limit status without affecting collapse state
    updateLocationLimitStatus();
    
    // Update One Per Deck limit status
    updateOnePerDeckLimitStatus();
    
    // Update Cataclysm limit status
    updateCataclysmLimitStatus();
    
    // Update Assist limit status
    updateAssistLimitStatus();
    updateAmbushLimitStatus();
    updateFortificationLimitStatus();
    
    // Update special cards filter if it's active
    updateSpecialCardsFilter();
    
    // Update advanced universe filter if it's active
    updateAdvancedUniverseFilter();
    
    // Update power cards filter if it's active
    updatePowerCardsFilter();
    
    // Update basic universe filter if it's active
    updateBasicUniverseFilter();
    
    // Update teamwork filter if it's active
    updateTeamworkFilter();
    
    // Update training filter if it's active
    updateTrainingFilter();
    
    // Update ally universe filter if it's active
    updateAllyUniverseFilter();
    
    
    // Validate deck after adding card
    await showDeckValidation(window.deckEditorCards);
    
    // Force layout recalculation after adding card
    requestAnimationFrame(() => {
        const deckCardsEditor = document.getElementById('deckCardsEditor');
        if (deckCardsEditor) {
            // Trigger a reflow to ensure proper layout
            deckCardsEditor.offsetHeight;
        }
    });
    } catch (error) {
        console.error('❌ Error in addCardToEditor:', error);
    }
}


// Export all functions to window for backward compatibility
window.changeCardQuantity = changeCardQuantity;
window.removeCardFromDeck = removeCardFromDeck;
window.addCardToDeck = addCardToDeck;
window.addAllMissionSetCards = addAllMissionSetCards;
window.addAllPowerCards = addAllPowerCards;
window.removeCardFromEditor = removeCardFromEditor;
window.removeOneCardFromEditor = removeOneCardFromEditor;
window.addOneCardToEditor = addOneCardToEditor;
window.removeAllMissionsFromDeck = removeAllMissionsFromDeck;
window.removeAllCardsFromDeck = removeAllCardsFromDeck;
window.removeUnusableSpecialCards = removeUnusableSpecialCards;
window.removeUnusableEvents = removeUnusableEvents;
window.removeUnusableAdvancedUniverse = removeUnusableAdvancedUniverse;
window.removeUnusableTraining = removeUnusableTraining;
window.removeUnusableAllyUniverse = removeUnusableAllyUniverse;
window.removeUnusableBasicUniverse = removeUnusableBasicUniverse;
window.removeUnusablePowerCards = removeUnusablePowerCards;
window.addAllSpecialCardsForCharacter = addAllSpecialCardsForCharacter;
window.addAllAdvancedUniverseCardsForCharacter = addAllAdvancedUniverseCardsForCharacter;
window.addCardToEditor = addCardToEditor;
