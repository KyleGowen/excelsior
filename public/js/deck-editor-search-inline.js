// deck-editor-search-inline.js - Deck editor inline search
// Extracted from public/index.html

// ===== initializeDeckEditorSearch through addCardToDeckFromSearch =====

function initializeDeckEditorSearch() {
    const searchInput = document.getElementById('deckEditorSearchInput');
    const searchResults = document.getElementById('deckEditorSearchResults');
    if (!searchInput || !searchResults) { console.error('🔍 Deck editor search elements not found!'); return; }

    if (window.DeckEditorSearch && window.CardSearchService) {
        // Prefer refactored component
        window.deckEditorSearchComponent = new window.DeckEditorSearch({
            input: searchInput,
            results: searchResults,
            onSelect: ({ id, type, name }) => {
                if (typeof addCardToDeckFromSearch === 'function') {
                    addCardToDeckFromSearch(id, type, name);
                }
            }
        });
        window.deckEditorSearchComponent.mount();
        return;
    }

    // Fallback to legacy wiring if component is unavailable
    searchInput.addEventListener('input', handleDeckEditorSearch);
    searchInput.addEventListener('focus', showDeckEditorSearchResults);
    searchInput.addEventListener('blur', () => { setTimeout(() => { hideDeckEditorSearchResults(); }, 200); });
    document.addEventListener('click', (e) => { if (!e.target.closest('.deck-editor-search-container')) { hideDeckEditorSearchResults(); } });
}
// Handle search input
async function handleDeckEditorSearch(e) {
    const searchTerm = e.target.value.trim().toLowerCase();
    const searchResults = document.getElementById('deckEditorSearchResults');
    
    if (searchTerm.length < 2) {
        hideDeckEditorSearchResults();
        return;
    }

    // Clear previous timeout
    if (deckEditorSearchTimeout) {
        clearTimeout(deckEditorSearchTimeout);
    }

    // Debounce search
    deckEditorSearchTimeout = setTimeout(async () => {
        try {
            const results = await searchAllCards(searchTerm);
            displayDeckEditorSearchResults(results);
        } catch (error) {
            console.error('🔍 Search error:', error);
            hideDeckEditorSearchResults();
        }
    }, 300);
}

// Search all card types
async function searchAllCards(searchTerm) {
    const results = [];
    
    try {
        // Search characters
        const charactersResponse = await fetch('/api/characters');
        const characters = await charactersResponse.json();
        if (characters.success) {
            characters.data.forEach(char => {
                if (char.name && char.name.toLowerCase().includes(searchTerm)) {
                    results.push({
                        id: char.id,
                        name: char.name,
                        type: 'character',
                        image: `/src/resources/cards/images/${char.image}`,
                        character: null
                    });
                }
            });
        }

        // Search special cards
        const specialResponse = await fetch('/api/special-cards');
        const specialCards = await specialResponse.json();
        if (specialCards.success) {
            specialCards.data.forEach(card => {
                
                // Check if card name contains search term
                const nameMatch = card.name && card.name.toLowerCase().includes(searchTerm);
                
                // Check if character field contains search term
                const characterMatch = card.character && card.character.toLowerCase().includes(searchTerm);
                
                // Check if character field exactly matches search term (for character-specific searches)
                const exactCharacterMatch = card.character && card.character.toLowerCase() === searchTerm.toLowerCase();
                
                const typeMatch = searchTerm === 'special';
                if (nameMatch || characterMatch || exactCharacterMatch || typeMatch) {
                    results.push({
                        id: card.id,
                        name: card.name,
                        type: 'special',
                        image: `/src/resources/cards/images/${card.image}`,
                        character: card.character
                    });
                }
            });
        }


        // Search missions
        const missionsResponse = await fetch('/api/missions');
        const missions = await missionsResponse.json();
        if (missions.success) {
            missions.data.forEach(mission => {
                // Check if card name contains search term
                const nameMatch = mission.card_name && mission.card_name.toLowerCase().includes(searchTerm);
                
                // Check if mission set contains search term
                const setMatch = mission.mission_set && mission.mission_set.toLowerCase().includes(searchTerm);
                
                // Check for exact type match
                const typeMatch = searchTerm === 'mission' || searchTerm === 'missions';
                
                if (nameMatch || setMatch || typeMatch) {
                    results.push({
                        id: mission.id,
                        name: mission.card_name,
                        type: 'mission',
                        image: `/src/resources/cards/images/${mission.image}`,
                        character: mission.mission_set
                    });
                }
            });
        }

        // Search events
        const eventsResponse = await fetch('/api/events');
        const events = await eventsResponse.json();
        if (events.success) {
            events.data.forEach(event => {
                // Check if event name contains search term
                const nameMatch = event.name && event.name.toLowerCase().includes(searchTerm);
                
                // Check if mission set contains search term
                const setMatch = event.mission_set && event.mission_set.toLowerCase().includes(searchTerm);
                
                // Check for exact type match
                const typeMatch = searchTerm === 'event' || searchTerm === 'events';
                
                if (nameMatch || setMatch || typeMatch) {
                    results.push({
                        id: event.id,
                        name: event.name,
                        type: 'event',
                        image: `/src/resources/cards/images/${event.image}`,
                        character: event.mission_set
                    });
                }
            });
        }

        // Search aspects
        const aspectsResponse = await fetch('/api/aspects');
        const aspects = await aspectsResponse.json();
        if (aspects.success) {
            aspects.data.forEach(aspect => {
                if (aspect.card_name && aspect.card_name.toLowerCase().includes(searchTerm)) {
                    results.push({
                        id: aspect.id,
                        name: aspect.card_name,
                        type: 'aspect',
                        image: `/src/resources/cards/images/${aspect.image}`,
                        character: null
                    });
                }
            });
        }

        // Search advanced universe
        const advancedResponse = await fetch('/api/advanced-universe');
        const advancedCards = await advancedResponse.json();
        if (advancedCards.success) {
            advancedCards.data.forEach(card => {
                const nameMatch = card.name && card.name.toLowerCase().includes(searchTerm);
                const characterMatch = card.character && card.character.toLowerCase().includes(searchTerm);
                const exactCharacterMatch = card.character && card.character.toLowerCase() === searchTerm.toLowerCase();
                
                const typeMatch = searchTerm === 'advanced';
                if (nameMatch || characterMatch || exactCharacterMatch || typeMatch) {
                    results.push({
                        id: card.id,
                        name: card.name,
                        type: 'advanced-universe',
                        image: `/src/resources/cards/images/${card.image}`,
                        character: card.character
                    });
                }
            });
        }

        // Search teamwork
        const teamworkResponse = await fetch('/api/teamwork');
        const teamworkCards = await teamworkResponse.json();
        if (teamworkCards.success) {
            teamworkCards.data.forEach(card => {
                const nameMatch = card.name && card.name.toLowerCase().includes(searchTerm);
                const characterMatch = card.character && card.character.toLowerCase().includes(searchTerm);
                const exactCharacterMatch = card.character && card.character.toLowerCase() === searchTerm.toLowerCase();
                const typeMatch = searchTerm === 'teamwork';                        
                if (nameMatch || characterMatch || exactCharacterMatch || typeMatch) {
                    results.push({
                        id: card.id,
                        name: card.to_use,
                        type: 'teamwork',
                        image: `/src/resources/cards/images/${card.image}`,
                        character: card.character
                    });
                }
            });
        }

        // Search ally universe
        const allyResponse = await fetch('/api/ally-universe');
        const allyCards = await allyResponse.json();
        if (allyCards.success) {
            allyCards.data.forEach(card => {
                const nameMatch = card.card_name && card.card_name.toLowerCase().includes(searchTerm);
                
                const typeMatch = searchTerm === 'ally';
                if (nameMatch || typeMatch) {
                    results.push({
                        id: card.id,
                        name: card.card_name,
                        type: 'ally-universe',
                        image: `/src/resources/cards/images/${card.image}`,
                        character: null
                    });
                }
            });
        }

        // Search training
        const trainingResponse = await fetch('/api/training');
        const trainingCards = await trainingResponse.json();
        if (trainingCards.success) {
            trainingCards.data.forEach(card => {
                const nameMatch = card.card_name && card.card_name.toLowerCase().includes(searchTerm);
                
                const typeMatch = searchTerm === 'training';
                if (nameMatch || typeMatch) {
                    results.push({
                        id: card.id,
                        name: card.card_name,
                        type: 'training',
                        image: `/src/resources/cards/images/${card.image}`,
                        character: null
                    });
                }
            });
        }

        // Search basic universe
        const basicResponse = await fetch('/api/basic-universe');
        const basicCards = await basicResponse.json();
        if (basicCards.success) {
            basicCards.data.forEach(card => {
                const nameMatch = card.card_name && card.card_name.toLowerCase().includes(searchTerm);
                
                const typeMatch = searchTerm === 'basic';
                if (nameMatch || typeMatch) {
                    results.push({
                        id: card.id,
                        name: card.card_name,
                        type: 'basic-universe',
                        image: `/src/resources/cards/images/${card.image}`,
                        character: null
                    });
                }
            });
        }

        // Search power cards
        const powerResponse = await fetch('/api/power-cards');
        const powerCards = await powerResponse.json();
        if (powerCards.success) {
            powerCards.data.forEach(card => {
                if (card.power_type && card.power_type.toLowerCase().includes(searchTerm) || searchTerm === 'power card') {
                    results.push({
                        id: card.id,
                        name: card.power_type,
                        type: 'power',
                        image: `/src/resources/cards/images/${card.image}`,
                        character: null
                    });
                }
            });
        }

        // Search locations
        const locationResponse = await fetch('/api/locations');
        const locationCards = await locationResponse.json();
        if (locationCards.success) {
            locationCards.data.forEach(card => {
                const nameMatch = card.name && card.name.toLowerCase().includes(searchTerm);
                const typeMatch = searchTerm === 'location';
                
                if (nameMatch || typeMatch) {
                    results.push({
                        id: card.id,
                        name: card.name,
                        type: 'location',
                        image: `/src/resources/cards/images/locations/${card.image}`,
                        character: null
                    });
                }
            });
        }
    } catch (error) {
        console.error('Error searching cards:', error);
    }

    
    // Sort results by name and limit to 20
    const filteredResults = results
        .filter(result => result.name && result.name.trim()) // Filter out results with empty names
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, 20);
        
    return filteredResults;
}

// Display search results
function displayDeckEditorSearchResults(results) {
    const searchResults = document.getElementById('deckEditorSearchResults');
    
    if (results.length === 0) {
        searchResults.innerHTML = '<div class="deck-editor-search-result">No cards found</div>';
    } else {
        const htmlContent = results.map(card => `
            <div class="deck-editor-search-result" 
                 onclick="addCardToDeckFromSearch('${card.id}', '${card.type}', '${card.name.replace(/'/g, "\\'")}')"
                 onmouseenter="showCardHoverModal('${card.image}', '${card.name.replace(/'/g, "\\'")}')"
                 onmouseleave="hideCardHoverModal()">
                <div class="deck-editor-search-result-image" style="background-image: url('${card.image}')"></div>
                <div class="deck-editor-search-result-info">
                    <div class="deck-editor-search-result-name">${card.name}</div>
                    <div class="deck-editor-search-result-type">${formatCardType(card.type)}</div>
                    ${card.character ? `<div class="deck-editor-search-result-character">${card.character}</div>` : ''}
                </div>
            </div>
        `).join('');
        
        searchResults.innerHTML = htmlContent;
    }
    
    showDeckEditorSearchResults();
}

// Show search results
function showDeckEditorSearchResults() {
    const searchResults = document.getElementById('deckEditorSearchResults');
    if (searchResults) {
        searchResults.style.display = 'block';
    } else {
        console.error('🔍 Search results element not found!');
    }
}

// Hide search results
function hideDeckEditorSearchResults() {
    const searchResults = document.getElementById('deckEditorSearchResults');
    if (searchResults) {
        searchResults.style.display = 'none';
    }
}

// Toast notification function
// showToast function moved to external file

// Add card to deck from search
async function addCardToDeckFromSearch(cardId, cardType, cardName) {
    // Read-only mode removed - now handled by backend flag
    
    // Check if we're creating a new deck (no currentDeckId)
    if (!currentDeckId) {
        // For new decks, use addCardToEditor to add to local window.deckEditorCards array
        // Adding card to new deck via addCardToEditor
        
        // Use the card name passed as parameter, or fallback to availableCardsMap
        let finalCardName = cardName;
        if (!finalCardName && availableCardsMap) {
            const cardData = window.availableCardsMap.get(cardId);
            finalCardName = cardData ? cardData.name : 'Unknown Card';
        }
        if (!finalCardName) {
            finalCardName = 'Unknown Card';
        }
        
        // Check if addCardToEditor function exists
        if (typeof addCardToEditor === 'function') {
            try {
                await addCardToEditor(cardType, cardId, finalCardName);
            } catch (error) {
                console.error('addCardToEditor failed:', error);
                showToast('Failed to add card to deck: ' + error.message, 'error');
                return;
            }
        } else {
            console.error('addCardToEditor function does not exist!');
            showToast('addCardToEditor function not found', 'error');
            return;
        }
        
        // Clear search and hide results
        const searchInput = document.getElementById('deckEditorSearchInput');
        if (searchInput) {
            searchInput.value = '';
        }
        hideDeckEditorSearchResults();
        
        // Show success message
        showToast('Card added to deck!', 'success');
        return;
    }

    try {
        const requestBody = {
            cardId: cardId,
            cardType: cardType
        };
        
        // Add the card to the deck
        const response = await fetch(`/api/decks/${currentDeckId}/cards`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (response.ok) {
            // Clear search and hide results
            const searchInput = document.getElementById('deckEditorSearchInput');
            if (searchInput) {
                searchInput.value = '';
            }
            hideDeckEditorSearchResults();
            
            // Reload deck cards
            await loadDeckForEditing(currentDeckId);
            
            // Force character single column layout after reload
            setTimeout(() => {
                forceCharacterSingleColumnLayout();
            }, 100);
            
            // Show success message
            showToast('Card added to deck!', 'success');
        } else {
            console.error('🔍 API Error Response:', response.status, response.statusText);
            const error = await response.json();
            console.error('🔍 API Error Details:', error);
            showToast(error.error || 'Failed to add card to deck', 'error');
        }
    } catch (error) {
        console.error('Error adding card to deck:', error);
        showToast('Failed to add card to deck', 'error');
    }
}


// Export all functions to window for backward compatibility
window.initializeDeckEditorSearch = initializeDeckEditorSearch;
window.handleDeckEditorSearch = handleDeckEditorSearch;
window.searchAllCards = searchAllCards;
window.displayDeckEditorSearchResults = displayDeckEditorSearchResults;
window.showDeckEditorSearchResults = showDeckEditorSearchResults;
window.hideDeckEditorSearchResults = hideDeckEditorSearchResults;
window.addCardToDeckFromSearch = addCardToDeckFromSearch;
