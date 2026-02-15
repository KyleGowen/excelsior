// alternate-art-modal.js - Alternate art selection modal
// Extracted from public/index.html

// ===== showAlternateArtSelectionModal, showAlternateArtSelectionForExistingCard =====

window.showAlternateArtSelectionModal = function showAlternateArtSelectionModal(cardType, cardName, allCards) {
    // Check if this card is One Per Deck and already in deck (check all art versions)
    // Get card data from first card to check OPD status
    const firstCardData = window.availableCardsMap.get(allCards[0].id);
    const isOnePerDeck = firstCardData && (firstCardData.one_per_deck === true || firstCardData.is_one_per_deck === true);
    
    let isAlreadyInDeck = false;
    if (isOnePerDeck) {
        // Check if ANY art version of this card is already in the deck
        // For special cards, check by name + character_name
        if (cardType === 'special' && firstCardData && firstCardData.character_name) {
            isAlreadyInDeck = window.deckEditorCards.some(deckCard => {
                if (deckCard.type !== 'special') return false;
                const deckCardData = window.availableCardsMap.get(deckCard.cardId);
                if (!deckCardData) return false;
                return deckCardData.name === firstCardData.name && 
                       deckCardData.character_name === firstCardData.character_name &&
                       (deckCardData.universe || 'ERB') === (firstCardData.universe || 'ERB');
            });
        } else {
            // For other cards, check by name + universe
            const cardNameToCheck = firstCardData?.name || firstCardData?.card_name || cardName;
            const cardUniverse = firstCardData?.universe || '';
            isAlreadyInDeck = window.deckEditorCards.some(deckCard => {
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
    }
    
    // If card is already in deck and is OPD, show error and don't open modal
    if (isAlreadyInDeck && isOnePerDeck) {
        showNotification(`Cannot add more than 1 copy of "${cardName}" - One Per Deck`, 'error');
        return;
    }
    
    // Create modal overlay (uses CSS class)
    const overlay = document.createElement('div');
    overlay.className = 'alternate-art-modal';
    
    // Create modal content container (uses CSS class)
    const content = document.createElement('div');
    content.className = 'alternate-art-content';
    
    // Create title
    const title = document.createElement('h3');
    title.textContent = `Select Art for ${cardName}`;
    
    // Create card grid (uses CSS class)
    const grid = document.createElement('div');
    grid.className = 'alternate-art-options';
    
    // Sort options deterministically:
    // original art first, then alternates by image path (so numbering is stable).
    const sortedCards = [...allCards].sort((a, b) => {
        const aIsAlternate = (a.imagePath || '').includes('/alternate/');
        const bIsAlternate = (b.imagePath || '').includes('/alternate/');
        if (aIsAlternate && !bIsAlternate) return 1;
        if (!aIsAlternate && bIsAlternate) return -1;
        return String(a.imagePath || '').localeCompare(String(b.imagePath || ''), undefined, { sensitivity: 'base' });
    });

    // Add each card as an option
    sortedCards.forEach((card, index) => {
        const cardOption = document.createElement('div');
        cardOption.className = 'art-option';
        
        // Mark first card (original art) as selected by default
        if (index === 0) {
            cardOption.classList.add('selected');
        }
        
        const img = document.createElement('img');
        img.src = card.imagePath;
        img.alt = card.name;
        
        const label = document.createElement('span');
        label.textContent = index === 0 ? 'Original Art' : `Alternate Art ${index}`;
        
        cardOption.appendChild(img);
        cardOption.appendChild(label);
        
        // Add click handler - validate OPD before adding
        cardOption.addEventListener('click', () => {
            // Double-check OPD before adding (in case deck changed)
            const cardData = window.availableCardsMap.get(card.id);
            const isOPD = cardData && (cardData.one_per_deck === true || cardData.is_one_per_deck === true);
            
            if (isOPD) {
                // Check if ANY art version is already in deck
                let alreadyInDeck = false;
                if (cardType === 'special' && cardData && cardData.character_name) {
                    alreadyInDeck = window.deckEditorCards.some(deckCard => {
                        if (deckCard.type !== 'special') return false;
                        const deckCardData = window.availableCardsMap.get(deckCard.cardId);
                        if (!deckCardData) return false;
                        return deckCardData.name === cardData.name && 
                               deckCardData.character_name === cardData.character_name &&
                               (deckCardData.universe || 'ERB') === (cardData.universe || 'ERB');
                    });
                } else {
                    const cardNameToCheck = cardData?.name || cardData?.card_name || cardName;
                    const cardUniverse = cardData?.universe || '';
                    alreadyInDeck = window.deckEditorCards.some(deckCard => {
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
                
                if (alreadyInDeck) {
                    showNotification(`Cannot add more than 1 copy of "${cardName}" - One Per Deck`, 'error');
                    document.body.removeChild(overlay);
                    return;
                }
            }
            
            addCardToEditor(cardType, card.id, card.name);
            document.body.removeChild(overlay);
        });
        
        grid.appendChild(cardOption);
    });
    
    // Create actions container
    const actions = document.createElement('div');
    actions.className = 'alternate-art-actions';
    
    // Create cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => {
        document.body.removeChild(overlay);
    });
    
    actions.appendChild(cancelBtn);
    
    // Assemble modal
    content.appendChild(title);
    content.appendChild(grid);
    content.appendChild(actions);
    overlay.appendChild(content);
    
    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            document.body.removeChild(overlay);
        }
    });
    
    // Add to document
    document.body.appendChild(overlay);
};

/**
 * Show alternate art selection for existing card in deck
 * Finds all alternate arts for the given card and allows user to change the art
 */
window.showAlternateArtSelectionForExistingCard = function showAlternateArtSelectionForExistingCard(cardId, cardIndex, instanceIndex = 0) {
    if (cardIndex === null || cardIndex === undefined || !window.deckEditorCards || !window.deckEditorCards[cardIndex]) {
        console.error('Invalid card index:', cardIndex);
        return;
    }
    
    const deckCard = window.deckEditorCards[cardIndex];
    const cardType = deckCard.type;
    
    // Store the instance index on the card for use in the click handler
    deckCard.currentInstanceIndex = instanceIndex;
    
    // Use the currently selected alternate card ID for this instance if it exists, otherwise use the original cardId
    // Check per-instance array first, then fall back to single selectedAlternateCardId, then original cardId
    let currentCardId = cardId;
    if (deckCard.selectedAlternateCardIds && deckCard.selectedAlternateCardIds[instanceIndex]) {
        currentCardId = deckCard.selectedAlternateCardIds[instanceIndex];
    } else if (deckCard.selectedAlternateCardId) {
        currentCardId = deckCard.selectedAlternateCardId;
    }
    
    // Get the card from availableCardsMap (use original cardId to find base card for alternate art lookup)
    const availableCard = window.availableCardsMap.get(cardId);
    if (!availableCard) {
        console.error('Card not found in availableCardsMap:', cardId);
        return;
    }
    
    // Find all alternate arts by searching for cards with the same name/universe
    let allAlternateArts = [];
    
    if (cardType === 'character') {
        // For characters, group by name|set
        const name = (availableCard.name || '').trim();
        const set = (availableCard.set || 'ERB').trim() || 'ERB';
        
        // Search through all available cards to find matches
        // Use same logic as Card View detection: cardType || type
        window.availableCardsMap.forEach((card, id) => {
            const iterCardType = card.cardType || card.type || '';
            if ((iterCardType === 'character' || id.startsWith('char_')) && 
                (card.name || '').trim() === name && 
                (card.set || 'ERB').trim() === set) {
                allAlternateArts.push({
                    id: card.id || id,
                    imagePath: getCardImagePath(card, 'character'),
                    name: (card.name || '').trim()
                });
            }
        });
    } else if (cardType === 'special') {
        // For special cards, group by character name then card name
        const characterName = (availableCard.character || '').trim();
        const cardName = (availableCard.name || availableCard.card_name || '').trim();
        
        // Use same logic as Card View detection: cardType || type
        window.availableCardsMap.forEach((card, id) => {
            const iterCardType = card.cardType || card.type || '';
            if ((iterCardType === 'special' || id.startsWith('special_')) && 
                (card.character || '').trim() === characterName && 
                (card.name || card.card_name || '').trim() === cardName) {
                allAlternateArts.push({
                    id: card.id || id,
                    imagePath: getCardImagePath(card, 'special'),
                    name: (card.name || card.card_name || '').trim()
                });
            }
        });
    } else if (cardType === 'power') {
        // For power cards, group by value and power_type (not by set) to include all alternate arts across sets
        const value = String(availableCard.value || '').trim();
        const powerType = (availableCard.power_type || '').trim();
        
        // Use same logic as Card View detection: cardType || type
        window.availableCardsMap.forEach((card, id) => {
            const iterCardType = card.cardType || card.type || '';
            if ((iterCardType === 'power' || id.startsWith('power_')) && 
                String(card.value || '').trim() === value && 
                (card.power_type || '').trim() === powerType) {
                allAlternateArts.push({
                    id: card.id || id,
                    imagePath: getCardImagePath(card, 'power'),
                    name: `${value} - ${powerType}`
                });
            }
        });
    } else if (cardType === 'location') {
        // For locations, group by name - each alternate is a separate row with same name
        const name = (availableCard.name || '').trim();
        window.availableCardsMap.forEach((card, id) => {
            const iterCardType = card.cardType || card.type || '';
            if ((iterCardType === 'location' || id.startsWith('location_')) && 
                (card.name || '').trim() === name) {
                allAlternateArts.push({
                    id: card.id || id,
                    imagePath: getCardImagePath(card, 'location'),
                    name: (card.name || '').trim()
                });
            }
        });
    }
    
    // Deduplicate by image path - only show unique images
    const uniqueAlternateArts = [];
    const seenImagePaths = new Set();
    
    for (const art of allAlternateArts) {
        if (!seenImagePaths.has(art.imagePath)) {
            seenImagePaths.add(art.imagePath);
            uniqueAlternateArts.push(art);
        }
    }
    
    // Sort: ERB set first, then original art first, then alternates
    uniqueAlternateArts.sort((a, b) => {
        // First, prioritize ERB set cards
        const aCard = Array.from(window.availableCardsMap.values()).find(c => c.id === a.id);
        const bCard = Array.from(window.availableCardsMap.values()).find(c => c.id === b.id);
        const aSet = (aCard?.set || 'ERB').trim();
        const bSet = (bCard?.set || 'ERB').trim();
        const aIsERB = aSet === 'ERB';
        const bIsERB = bSet === 'ERB';
        
        if (aIsERB && !bIsERB) return -1; // ERB first
        if (!aIsERB && bIsERB) return 1;  // ERB first
        
        // Then sort by original vs alternate art
        const aIsAlternate = a.imagePath.includes('/alternate/');
        const bIsAlternate = b.imagePath.includes('/alternate/');
        if (aIsAlternate && !bIsAlternate) return 1;
        if (!aIsAlternate && bIsAlternate) return -1;
        
        // Finally, make alternate ordering stable and predictable
        return String(a.imagePath || '').localeCompare(String(b.imagePath || ''), undefined, { sensitivity: 'base' });
    });
    
    if (uniqueAlternateArts.length <= 1) {
        console.log('No alternate arts found for this card');
        return;
    }
    
    const cardName = availableCard.name || availableCard.card_name || 'Unknown';
    
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'alternate-art-modal';
    
    // Create modal content container
    const content = document.createElement('div');
    content.className = 'alternate-art-content';
    
    // Create title
    const title = document.createElement('h3');
    title.textContent = `Select Art for ${cardName}`;
    
    // Create card grid
    const grid = document.createElement('div');
    grid.className = 'alternate-art-options';
    
    // Find current card index in uniqueAlternateArts using the currently selected card ID
    const currentCardIndex = uniqueAlternateArts.findIndex(art => art.id === currentCardId);
    
    // Add each card as an option
    uniqueAlternateArts.forEach((card, index) => {
        const cardOption = document.createElement('div');
        cardOption.className = 'art-option';
        
        // Mark current card as selected (use currentCardId which may be selectedAlternateCardId)
        if (card.id === currentCardId || (currentCardIndex === -1 && index === 0)) {
            cardOption.classList.add('selected');
        }
        
        const img = document.createElement('img');
        img.src = card.imagePath;
        img.alt = card.name;
        
        const label = document.createElement('span');
        // Label: first non-alternate is "Original Art", alternates are numbered sequentially
        const isAlternate = card.imagePath.includes('/alternate/');
        if (!isAlternate) {
            label.textContent = 'Original Art';
        } else {
            // Count how many alternates come before this one
            let alternateCount = 0;
            for (let i = 0; i < index; i++) {
                if (uniqueAlternateArts[i].imagePath.includes('/alternate/')) {
                    alternateCount++;
                }
            }
            label.textContent = `Alternate Art ${alternateCount + 1}`;
        }
        
        cardOption.appendChild(img);
        cardOption.appendChild(label);
        
        // Add click handler to update existing card
        cardOption.addEventListener('click', () => {
            // Store the selected alternate card ID per instance
            const targetCard = window.deckEditorCards[cardIndex];
            if (!targetCard) {
                console.error(`Card at index ${cardIndex} not found!`);
                return;
            }
            
            // For locations, cardId directly identifies the selected variant (one per deck)
            if (cardType === 'location') {
                targetCard.cardId = card.id;
            } else {
                // Get the instance index that was stored when opening the modal
                const instanceIndex = targetCard.currentInstanceIndex !== undefined ? targetCard.currentInstanceIndex : 0;
                
                // Initialize selectedAlternateCardIds as an array if it doesn't exist
                if (!targetCard.selectedAlternateCardIds) {
                    targetCard.selectedAlternateCardIds = [];
                }
                
                // Store the selected alternate card ID for this specific instance
                targetCard.selectedAlternateCardIds[instanceIndex] = card.id;
                
                // Also keep selectedAlternateCardId for backward compatibility (for quantity = 1)
                if (targetCard.quantity === 1) {
                    targetCard.selectedAlternateCardId = card.id;
                }
            }
            
            // Re-render deck cards based on current view
            const deckCardsEditor = document.querySelector('.deck-cards-editor');
            if (deckCardsEditor && deckCardsEditor.classList.contains('card-view')) {
                // Card View - use renderDeckCardsCardView
                if (typeof renderDeckCardsCardView === 'function') {
                    renderDeckCardsCardView();
                }
            } else {
                // Tile View or other views - use displayDeckCardsForEditing
                displayDeckCardsForEditing();
            }
            
            // Close modal
            document.body.removeChild(overlay);
        });
        
        grid.appendChild(cardOption);
    });
    
    // Create actions container
    const actions = document.createElement('div');
    actions.className = 'alternate-art-actions';
    
    // Create cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => {
        document.body.removeChild(overlay);
    });
    
    actions.appendChild(cancelBtn);
    
    // Assemble modal
    content.appendChild(title);
    content.appendChild(grid);
    content.appendChild(actions);
    overlay.appendChild(content);
    
    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            document.body.removeChild(overlay);
        }
    });
    
    document.body.appendChild(overlay);
};


// Export all functions to window for backward compatibility
window.showAlternateArtSelectionModal = showAlternateArtSelectionModal;
window.showAlternateArtSelectionForExistingCard = showAlternateArtSelectionForExistingCard;
