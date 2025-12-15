/* ========================================
 * All Cards Display Functions
 * ========================================
 * 
 * Functions for displaying all cards from all card types
 * in a unified 5-column grid layout with filtering
 * 
 * ======================================== */

// Global variable to store all loaded cards
let allCardsData = [];
let allCardsFiltered = [];

/**
 * Load all cards from all card types with performance logging
 */
async function loadAllCards() {
    const startTime = performance.now();
    const startTimestamp = new Date().toISOString();
    
    console.log('=== All Cards Load Performance ===');
    console.log('Start time:', startTimestamp);
    console.log('Loading card types...');
    
    const cardTypes = [
        { type: 'character', api: '/api/characters', nameField: 'name' },
        { type: 'special', api: '/api/special-cards', nameField: 'name' },
        { type: 'advanced-universe', api: '/api/advanced-universe', nameField: 'name' },
        { type: 'location', api: '/api/locations', nameField: 'name' },
        { type: 'aspect', api: '/api/aspects', nameField: 'card_name' },
        { type: 'mission', api: '/api/missions', nameField: 'name' },
        { type: 'event', api: '/api/events', nameField: 'name' },
        { type: 'teamwork', api: '/api/teamwork', nameField: 'card_type' },
        { type: 'ally-universe', api: '/api/ally-universe', nameField: 'card_name' },
        { type: 'training', api: '/api/training', nameField: 'card_name' },
        { type: 'basic-universe', api: '/api/basic-universe', nameField: 'card_name' },
        { type: 'power', api: '/api/power-cards', nameField: 'power_type' }
    ];
    
    const loadResults = [];
    const cardCounts = {};
    
    // Load all card types in parallel
    const loadPromises = cardTypes.map(async (cardType) => {
        const typeStartTime = performance.now();
        try {
            const response = await fetch(cardType.api);
            const data = await response.json();
            const typeEndTime = performance.now();
            const typeDuration = typeEndTime - typeStartTime;
            
            if (data.success && data.data) {
                const cards = data.data.map(card => ({
                    ...card,
                    cardType: cardType.type,
                    nameField: cardType.nameField
                }));
                
                cardCounts[cardType.type] = cards.length;
                console.log(`  ✓ ${cardType.type}: ${cards.length} cards loaded in ${typeDuration.toFixed(2)}ms`);
                
                return {
                    type: cardType.type,
                    cards: cards,
                    duration: typeDuration,
                    success: true
                };
            } else {
                console.warn(`  ✗ ${cardType.type}: Failed to load (${data.error || 'Unknown error'})`);
                return {
                    type: cardType.type,
                    cards: [],
                    duration: typeDuration,
                    success: false
                };
            }
        } catch (error) {
            const typeEndTime = performance.now();
            const typeDuration = typeEndTime - typeStartTime;
            console.error(`  ✗ ${cardType.type}: Error loading -`, error);
            return {
                type: cardType.type,
                cards: [],
                duration: typeDuration,
                success: false,
                error: error.message
            };
        }
    });
    
    const results = await Promise.all(loadPromises);
    
    // Combine all cards into single array
    allCardsData = [];
    results.forEach(result => {
        if (result.success && result.cards.length > 0) {
            allCardsData.push(...result.cards);
        }
    });
    
    const endTime = performance.now();
    const totalDuration = endTime - startTime;
    const totalCount = allCardsData.length;
    
    console.log('---');
    console.log('Total load time:', totalDuration.toFixed(2), 'ms');
    console.log('Total cards loaded:', totalCount);
    console.log('Cards by type:', cardCounts);
    console.log('=== End Performance Log ===');
    
    return allCardsData;
}

/**
 * Get card name based on card type and name field
 */
function getCardName(card) {
    if (card.nameField) {
        return card[card.nameField] || card.name || card.card_name || 'Unknown';
    }
    return card.name || card.card_name || card.card_type || 'Unknown';
}

/**
 * Get card image path based on card type
 * Uses the existing getCardImagePathForDisplay function if available
 */
function getCardImagePathForAllCards(card, cardType) {
    // Use existing function if available
    if (typeof getCardImagePathForDisplay === 'function') {
        return getCardImagePathForDisplay(card, cardType);
    }
    
    // Fallback implementation
    const imagePath = card.image_path || card.image || '';
    if (!imagePath) {
        return '/src/resources/cards/images/placeholder.webp';
    }
    
    // If it's already a full path, return it
    if (imagePath.startsWith('/src/resources/cards/images/')) {
        return imagePath;
    }
    
    // Construct full path
    return `/src/resources/cards/images/${imagePath}`;
}

/**
 * Render a single card cell
 */
function renderCardCell(card) {
    const cardName = getCardName(card);
    const cardType = card.cardType || 'character';
    const imagePath = getCardImagePathForAllCards(card, cardType);
    const escapedName = cardName.replace(/'/g, "\\'");
    
    // Check if user is ADMIN
    const isAdmin = typeof getCurrentUser === 'function' && getCurrentUser() && getCurrentUser().role === 'ADMIN';
    
    // Check if user is guest
    const isGuest = typeof isGuestUser === 'function' && isGuestUser();
    
    // Determine card type for API calls (some types need mapping)
    let apiCardType = cardType;
    if (cardType === 'advanced-universe') {
        apiCardType = 'advanced_universe';
    } else if (cardType === 'ally-universe') {
        apiCardType = 'ally_universe';
    } else if (cardType === 'basic-universe') {
        apiCardType = 'basic_universe';
    }
    
    const deckButtonDisabled = isGuest ? 'disabled style="opacity: 0.5; cursor: not-allowed;" title="Log in to add to decks..."' : '';
    const deckButtonOnClick = isGuest ? '' : `onclick="showDeckSelection('${apiCardType}', '${card.id}', '${escapedName}', this)"`;
    
    return `
        <div class="all-cards-cell" style="display: flex; flex-direction: column; align-items: center; padding: 10px; background: rgba(0, 0, 0, 0.2); border-radius: 5px;">
            <img src="${imagePath}" 
                 alt="${escapedName}" 
                 style="width: 100%; max-width: 200px; height: auto; border-radius: 5px; cursor: pointer; margin-bottom: 8px;"
                 onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiMzMzMiLz4KPHRleHQgeD0iMTAwIiB5PSIxNTAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4='; this.style.cursor='default';"
                 onmouseenter="showCardHoverModal('${imagePath}', '${escapedName}')"
                 onmouseleave="hideCardHoverModal()"
                 onclick="openModal(this)">
            <div style="font-size: 12px; color: #fff; text-align: center; margin-bottom: 8px; word-wrap: break-word; max-width: 100%;">${cardName}</div>
            <button class="add-to-deck-btn" ${deckButtonOnClick} ${deckButtonDisabled} style="margin-bottom: 4px; width: 100%;">
                +Deck
            </button>
            ${isAdmin ? `
            <button class="add-to-collection-btn" onclick="addCardToCollectionFromDatabase('${card.id}', '${apiCardType}')" style="width: 100%;">
                +Collection
            </button>
            ` : ''}
        </div>
    `;
}

/**
 * Display all cards in 5-column grid
 */
function displayAllCards(cards = null) {
    const container = document.getElementById('all-cards-grid-container');
    if (!container) {
        console.error('all-cards-grid-container not found');
        return;
    }
    
    // Use provided cards or filtered cards
    const cardsToDisplay = cards || allCardsFiltered || allCardsData;
    
    // Sort cards by set, then set_number
    const sortedCards = [...cardsToDisplay].sort((a, b) => {
        // Primary sort: set (ascending)
        const setA = (a.set || a.universe || 'ERB').toUpperCase();
        const setB = (b.set || b.universe || 'ERB').toUpperCase();
        
        if (setA !== setB) {
            return setA.localeCompare(setB);
        }
        
        // Secondary sort: set_number (ascending, numeric)
        const numA = parseInt(a.set_number || a.card_number || '0', 10) || 0;
        const numB = parseInt(b.set_number || b.card_number || '0', 10) || 0;
        
        return numA - numB;
    });
    
    // Render all cards
    container.innerHTML = sortedCards.map(card => renderCardCell(card)).join('');
    
    console.log(`Displayed ${sortedCards.length} cards in All tab`);
}

/**
 * Filter cards by enabled card types
 */
function filterAllCardsByType() {
    // Get filter state from localStorage or default to all enabled
    const filterState = JSON.parse(localStorage.getItem('all-cards-filter-state') || '{}');
    
    // Get enabled card types from filter buttons
    const enabledTypes = new Set();
    document.querySelectorAll('.card-type-filter-btn.active').forEach(btn => {
        enabledTypes.add(btn.getAttribute('data-card-type'));
    });
    
    // If no types enabled, show all (shouldn't happen, but safety check)
    if (enabledTypes.size === 0) {
        allCardsFiltered = allCardsData;
        displayAllCards();
        return;
    }
    
    // Filter cards
    allCardsFiltered = allCardsData.filter(card => {
        return enabledTypes.has(card.cardType);
    });
    
    // Update display
    displayAllCards();
}

/**
 * Initialize filter buttons
 */
function initializeAllCardsFilters() {
    // Load filter state from localStorage
    const filterState = JSON.parse(localStorage.getItem('all-cards-filter-state') || '{}');
    
    // Set initial button states
    document.querySelectorAll('.card-type-filter-btn').forEach(btn => {
        const cardType = btn.getAttribute('data-card-type');
        const isEnabled = filterState[cardType] !== false; // Default to true if not set
        
        if (isEnabled) {
            btn.classList.add('active');
            // Remove inline styles to let CSS handle styling
            btn.style.background = '';
            btn.style.color = '';
        } else {
            btn.classList.remove('active');
            // Remove inline styles to let CSS handle styling
            btn.style.background = '';
            btn.style.color = '';
        }
    });
    
    // Add click handlers
    document.querySelectorAll('.card-type-filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const cardType = this.getAttribute('data-card-type');
            const isActive = this.classList.contains('active');
            
            // Toggle state
            if (isActive) {
                this.classList.remove('active');
                // Remove inline styles to let CSS handle styling
                this.style.background = '';
                this.style.color = '';
            } else {
                this.classList.add('active');
                // Remove inline styles to let CSS handle styling
                this.style.background = '';
                this.style.color = '';
            }
            
            // Save filter state to localStorage
            const filterState = {};
            document.querySelectorAll('.card-type-filter-btn').forEach(b => {
                filterState[b.getAttribute('data-card-type')] = b.classList.contains('active');
            });
            localStorage.setItem('all-cards-filter-state', JSON.stringify(filterState));
            
            // Re-filter and re-display
            filterAllCardsByType();
        });
    });
}

/**
 * Main function to load and display all cards
 */
async function loadAndDisplayAllCards() {
    try {
        await loadAllCards();
        filterAllCardsByType();
        initializeAllCardsFilters();
    } catch (error) {
        console.error('Error loading all cards:', error);
        const container = document.getElementById('all-cards-grid-container');
        if (container) {
            container.innerHTML = '<div style="color: #fff; padding: 20px; text-align: center;">Error loading cards. Please refresh the page.</div>';
        }
    }
}

// Make functions globally available
window.loadAllCards = loadAllCards;
window.displayAllCards = displayAllCards;
window.filterAllCardsByType = filterAllCardsByType;
window.initializeAllCardsFilters = initializeAllCardsFilters;
window.loadAndDisplayAllCards = loadAndDisplayAllCards;

