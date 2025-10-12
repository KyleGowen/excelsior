/**
 * Deck Management Functions
 * Core functionality for loading, creating, and managing decks
 */

// Global variable for user decks
let userDecks = [];

/**
 * Load user decks from the API
 */
async function loadUserDecks() {
    try {
        // Check if user is authenticated first
        const currentUser = getCurrentUser();
        if (!currentUser) {
            console.log('No authenticated user, skipping deck load');
            return;
        }

        const response = await fetch('/api/decks', {
            credentials: 'include'
        });
        const data = await response.json();
        if (data.success) {
            userDecks = data.data;
            if (userDecks.length > 0) {
            }
        } else {
            console.error('Failed to load decks:', data.error);
        }
    } catch (error) {
        console.error('Error loading user decks:', error);
    }
}

/**
 * Show deck selection menu for adding cards to decks
 */
async function showDeckSelection(cardType, cardId, cardName, buttonElement) {
    console.log('showDeckSelection called with:', { cardType, cardId, cardName });
    console.log('Current userDecks:', userDecks);
    
    // Check if user is authenticated
    const currentUser = getCurrentUser();
    if (!currentUser) {
        showNotification('Please log in to add cards to decks', 'error');
        return;
    }
    
    // Load user decks if not already loaded
    if (userDecks.length === 0) {
        await loadUserDecks();
    }
    
    // Check if user has any decks
    if (userDecks.length === 0) {
        showNotification('You need to create a deck first', 'error');
        return;
    }
    
    // Create and show deck selection menu
    createDeckSelectionMenu(cardType, cardId, cardName, buttonElement);
}

/**
 * Create deck selection menu
 */
function createDeckSelectionMenu(cardType, cardId, cardName, buttonElement) {
    // Remove any existing menu
    const existingMenu = document.getElementById('deck-selection-menu');
    if (existingMenu) {
        existingMenu.remove();
    }
    
    // Get button position for menu placement
    const buttonRect = buttonElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Calculate menu position
    let top = buttonRect.bottom + 5;
    let left = buttonRect.left;
    
    // Adjust position if menu would go off screen
    if (left + 200 > viewportWidth) {
        left = viewportWidth - 200 - 10;
    }
    if (top + 300 > viewportHeight) {
        top = buttonRect.top - 300 - 5;
    }
    
    // Estimate menu height based on number of decks
    const estimatedHeight = Math.min(userDecks.length * 50 + 100, 300); // rough estimate
    
    // Create menu element
    const menu = document.createElement('div');
    menu.id = 'deck-selection-menu';
    menu.className = 'deck-selection-menu';
    menu.style.cssText = `
        position: fixed;
        top: ${top}px;
        left: ${left}px;
        width: 200px;
        max-height: ${estimatedHeight}px;
        background: #2a2a3e;
        border: 1px solid #444;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        overflow-y: auto;
        padding: 10px;
    `;
    
    // Add title
    const title = document.createElement('div');
    title.className = 'deck-selection-title';
    title.textContent = 'Add to Deck:';
    title.style.cssText = `
        color: #fff;
        font-weight: bold;
        margin-bottom: 10px;
        padding-bottom: 5px;
        border-bottom: 1px solid #444;
    `;
    menu.appendChild(title);
    
    // Add deck options
    userDecks.forEach(deck => {
        const deckOption = document.createElement('div');
        deckOption.className = 'deck-option';
        deckOption.textContent = deck.name;
        deckOption.style.cssText = `
            color: #fff;
            padding: 8px 12px;
            cursor: pointer;
            border-radius: 4px;
            margin-bottom: 2px;
            transition: background-color 0.2s;
        `;
        
        // Add hover effect
        deckOption.addEventListener('mouseenter', () => {
            deckOption.style.backgroundColor = '#3a3a4e';
        });
        deckOption.addEventListener('mouseleave', () => {
            deckOption.style.backgroundColor = 'transparent';
        });
        
        // Add click handler
        deckOption.addEventListener('click', async () => {
            await addCardToDatabaseDeck(deck.id, cardType, cardId, cardName);
            menu.remove();
        });
        
        menu.appendChild(deckOption);
    });
    
    // Add close button
    const closeButton = document.createElement('div');
    closeButton.textContent = 'Cancel';
    closeButton.style.cssText = `
        color: #888;
        padding: 8px 12px;
        cursor: pointer;
        border-radius: 4px;
        margin-top: 5px;
        text-align: center;
        border-top: 1px solid #444;
    `;
    closeButton.addEventListener('click', () => {
        menu.remove();
    });
    menu.appendChild(closeButton);
    
    // Add menu to document
    document.body.appendChild(menu);
    
    // Close menu when clicking outside
    const closeMenuOnClickOutside = (event) => {
        if (!menu.contains(event.target) && event.target !== buttonElement) {
            menu.remove();
            document.removeEventListener('click', closeMenuOnClickOutside);
        }
    };
    
    // Use setTimeout to avoid immediate closure
    setTimeout(() => {
        document.addEventListener('click', closeMenuOnClickOutside);
    }, 100);
}

/**
 * Add card to a database deck
 */
async function addCardToDatabaseDeck(deckId, cardType, cardId, cardName) {
    try {
        const response = await fetch(`/api/decks/${deckId}/cards`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                cardType: cardType,
                cardId: cardId,
                quantity: 1
            })
        });
        
        if (response.ok) {
            showNotification(`Added ${cardName} to deck`, 'success');
        } else {
            const errorData = await response.json();
            showNotification(`Failed to add card: ${errorData.error || 'Unknown error'}`, 'error');
        }
    } catch (error) {
        console.error('Error adding card to deck:', error);
        showNotification('Failed to add card to deck', 'error');
    }
}
