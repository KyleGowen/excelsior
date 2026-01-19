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
    
    // Sort all cards primarily by "character / group name" (ignoring leading "The"),
    // then by card display name, then by database set + set_number for stable ordering.
    //
    // This matches the rest of the UI's alphabetization expectations (e.g. "The Mummy" under M).
    const compareText =
        (typeof window !== 'undefined' &&
            window.Alphabetization &&
            typeof window.Alphabetization.compare === 'function')
            ? window.Alphabetization.compare
            : (a, b) => String(a ?? '').localeCompare(String(b ?? ''));

    function isAnyCharacterName(value) {
        return String(value ?? '').trim().toLowerCase() === 'any character';
    }

    // Sorting rule: when sorting by character/group name, "Any Character" always comes last.
    function compareCharacterNames(a, b) {
        const aIsAny = isAnyCharacterName(a);
        const bIsAny = isAnyCharacterName(b);
        if (aIsAny !== bIsAny) return aIsAny ? 1 : -1;
        return compareText(a, b);
    }

    function getGroupNameForSorting(card) {
        if (!card) return '';
        // Many card types (special cards in particular) expose their owning character as `character`.
        // Prefer that when available so specials sort/group under the character name.
        if (card.character) return String(card.character).trim();
        if (card.character_name) return String(card.character_name).trim();
        // Character cards: name is the character name.
        if (card.cardType === 'character' && card.name) return String(card.name).trim();
        // Fallback: whatever we display as the card name.
        return String(getCardName(card)).trim();
    }

    allCardsData.sort((a, b) => {
        const groupCmp = compareCharacterNames(getGroupNameForSorting(a), getGroupNameForSorting(b));
        if (groupCmp !== 0) return groupCmp;

        const nameCmp = compareText(getCardName(a), getCardName(b));
        if (nameCmp !== 0) return nameCmp;

        // Stable tie-breakers: set + set_number (so order doesn't "jump" between reloads)
        const setA = String(a?.set || a?.universe || 'ERB').trim();
        const setB = String(b?.set || b?.universe || 'ERB').trim();
        const setCmp = compareText(setA, setB);
        if (setCmp !== 0) return setCmp;

        const numAStr = String(a?.set_number || '').trim();
        const numBStr = String(b?.set_number || '').trim();
        const aHasNum = !!numAStr;
        const bHasNum = !!numBStr;
        if (aHasNum !== bHasNum) return aHasNum ? -1 : 1;
        if (aHasNum && bHasNum) {
            const numA = parseInt(numAStr, 10);
            const numB = parseInt(numBStr, 10);
            if (Number.isFinite(numA) && Number.isFinite(numB) && numA !== numB) return numA - numB;
        }

        return 0;
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
    if (!card) {
        return 'Unknown Card';
    }
    
    const cardType = card.cardType || '';
    
    // For power cards, format as "value - power_type"
    if (cardType === 'power') {
        const value = card.value || '';
        const powerType = card.power_type || '';
        if (value && powerType) {
            return `${value} - ${powerType}`;
        }
        return card.name || card.power_type || 'Power Card';
    }
    
    // For missions, use card_name (mapped from name) or name
    if (cardType === 'mission') {
        return card.card_name || card.name || 'Mission';
    }
    
    // For aspects, use card_name (mapped from name) or name
    if (cardType === 'aspect') {
        return card.card_name || card.name || 'Aspect';
    }
    
    // For training, ally-universe, basic-universe - use card_name (mapped from name) or name
    if (cardType === 'training' || cardType === 'ally-universe' || cardType === 'basic-universe') {
        return card.card_name || card.name || 'Card';
    }
    
    // For advanced-universe, use name
    if (cardType === 'advanced-universe') {
        return card.name || 'Advanced Universe';
    }
    
    // For teamwork, use name
    if (cardType === 'teamwork') {
        return card.name || card.card_type || 'Teamwork';
    }
    
    // For characters, special cards, events, locations - use name
    // Default: try name first (most common), then card_name, then card_type
    return card.name || card.card_name || card.card_type || 'Unknown Card';
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
    // Extract card name - try multiple approaches
    let cardName = 'Unknown Card';
    
    if (card) {
        // Direct field access based on card type
        if (card.name) {
            cardName = card.name;
        } else if (card.card_name) {
            cardName = card.card_name;
        } else if (card.cardType === 'power' && card.value && card.power_type) {
            cardName = `${card.value} - ${card.power_type}`;
        } else if (card.card_type) {
            cardName = card.card_type;
        }
    }
    
    // Fallback to getCardName function if still unknown
    if (cardName === 'Unknown Card' && typeof getCardName === 'function') {
        cardName = getCardName(card);
    }
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
    
    // Add onload handler to detect horizontal orientation
    const imageOnLoad = `
        (function(img) {
            if (img.complete && img.naturalWidth && img.naturalHeight) {
                if (img.naturalWidth > img.naturalHeight) {
                    img.classList.add('horizontal-card');
                }
            } else {
                img.onload = function() {
                    if (this.naturalWidth > this.naturalHeight) {
                        this.classList.add('horizontal-card');
                    }
                };
            }
        })(this);
    `;
    
    return `
        <div class="all-cards-cell">
            <div class="card-image-wrapper">
                <img src="${imagePath}" 
                     alt="${escapedName}" 
                     onload="${imageOnLoad}"
                     onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiMzMzMiLz4KPHRleHQgeD0iMTAwIiB5PSIxNTAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4='; this.style.cursor='default';"
                     onmouseenter="showCardHoverModal('${imagePath}', '${escapedName}')"
                     onmouseleave="hideCardHoverModal()"
                     onclick="openModal(this)">
            </div>
            <div class="card-content-bottom">
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
    
    // Cards are already sorted by set -> set_number in loadAllCards()
    // Just use the filtered cards directly (they maintain the sort order)
    const sortedCards = cardsToDisplay;
    
    // Debug: Log first few sorted cards to verify sorting
    if (sortedCards.length > 0) {
        console.log('First 10 sorted cards (set -> set_number):');
        sortedCards.slice(0, 10).forEach((card, idx) => {
            const setName = card.set || card.universe || 'ERB';
            const setNum = card.set_number || '0';
            const cardName = getCardName(card);
            const cardType = card.cardType || 'unknown';
            console.log(`  ${idx + 1}. [${setName}] ${setNum} - ${cardName} (${cardType})`);
        });
    }
    
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

// Make functions and data globally available
window.loadAllCards = loadAllCards;
window.displayAllCards = displayAllCards;
window.filterAllCardsByType = filterAllCardsByType;
window.initializeAllCardsFilters = initializeAllCardsFilters;
window.loadAndDisplayAllCards = loadAndDisplayAllCards;
window.getCardName = getCardName;
// Expose allCardsData for debugging
Object.defineProperty(window, 'allCardsData', {
    get: function() { return allCardsData; },
    set: function(value) { allCardsData = value; }
});

