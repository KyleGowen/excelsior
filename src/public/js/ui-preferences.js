// ui-preferences.js - UI preferences management
// Extracted from public/index.html

// ===== loadUIPreferences through applyUIPreferences =====

async function loadUIPreferences(deckId) {
    // Skip loading UI preferences for guest users
    if (isGuestUser()) {
        return {};
    }
    
    try {
        const response = await fetch(`/api/decks/${deckId}/ui-preferences`, {
            credentials: 'include'
        });
        const data = await response.json();
        
        console.log('Loaded UI preferences from database:', data);
        
        if (data.success) {
            return data.data || {};
        } else {
            console.warn('Failed to load UI preferences:', data.error);
            return {};
        }
    } catch (error) {
        console.error('Error loading UI preferences:', error);
        return {};
    }
}

// Debouncing mechanism for UI preferences saves
let saveUIPreferencesTimeout = null;

// Save UI preferences to database
async function saveUIPreferences(deckId, preferences) {
    // Skip saving UI preferences for guest users
    if (isGuestUser()) {
        return;
    }
    
    // SECURITY: Block saving UI preferences in read-only mode
    if (document.body.classList.contains('read-only-mode')) {
        console.log('🔒 SECURITY: Blocking UI preferences save in read-only mode');
        return;
    }
    
    // SECURITY: Check if user owns this deck before saving UI preferences
    if (currentDeckData && currentDeckData.metadata && !currentDeckData.metadata.isOwner) {
        console.log('🔒 SECURITY: Blocking UI preferences save - user does not own this deck');
        return;
    }
    
    // Debounce UI preference saves to prevent rate limiting
    if (saveUIPreferencesTimeout) {
        clearTimeout(saveUIPreferencesTimeout);
    }
    
    saveUIPreferencesTimeout = setTimeout(async () => {
        try {
        const response = await fetch(`/api/decks/${deckId}/ui-preferences`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(preferences)
        });
        
            const data = await response.json();
            if (!data.success) {
                console.warn('Failed to save UI preferences:', data.error);
            }
        } catch (error) {
            console.error('Error saving UI preferences:', error);
        }
    }, 500); // Debounce for 500ms
}

// Get current UI preferences object
function getCurrentUIPreferences() {
    const deckCardsEditor = document.getElementById('deckCardsEditor');
    const isListView = deckCardsEditor && deckCardsEditor.classList.contains('list-view');
    const isCardView = deckCardsEditor && deckCardsEditor.classList.contains('card-view');
    
    let viewMode = 'tile'; // default
    if (isListView) {
        viewMode = 'list';
    } else if (isCardView) {
        // Don't save 'card' viewMode to backend - it's admin-only and not supported by API
        // Card View will be restored automatically for admin users on page load
        viewMode = 'tile';
    }
    
    return {
        dividerPosition: getDividerPosition(),
        expansionState: getExpansionState(),
        powerCardsSortMode: powerCardsSortMode,
        viewMode: viewMode,
        characterGroupExpansionState: characterGroupExpansionState
    };
}

// Get current divider position as percentage
function getDividerPosition() {
    const deckPane = document.querySelector('.deck-pane');
    const layout = document.querySelector('.deck-editor-layout');
    if (deckPane && layout) {
        return (deckPane.offsetWidth / layout.offsetWidth) * 100;
    }
    return 50; // Default to 50%
}

// Get current expansion state
function getExpansionState() {
    const state = {};
    const categories = ['character', 'location', 'mission', 'event', 'special', 'aspect', 'advanced_universe', 'teamwork', 'ally_universe', 'training', 'basic_universe', 'power'];
    
    categories.forEach(category => {
        // Check deck editor sections (deck-type-${category})
        const cardsDiv = document.getElementById(`deck-type-${category}`);
        
        if (cardsDiv) {
            const section = cardsDiv.closest('.deck-type-section');
            const header = section ? section.querySelector('.deck-type-header') : null;
            
        if (header) {
            state[category] = !header.classList.contains('collapsed');
            } else {
                // Fallback: check if cards div is visible
                state[category] = cardsDiv.style.display !== 'none';
            }
        } else {
            // Fallback: use the global deckEditorExpansionState, default to true if not set
            state[category] = deckEditorExpansionState[category] !== undefined ? deckEditorExpansionState[category] : true;
        }
    });
    
    return state;
}

// Apply UI preferences to the interface
async function applyUIPreferences(preferences) {
    // Apply divider position
    if (preferences.dividerPosition) {
        const layout = document.querySelector('.deck-editor-layout');
        if (layout) {
            const deckPane = document.querySelector('.deck-pane');
            if (deckPane) {
                const newWidth = (preferences.dividerPosition / 100) * layout.offsetWidth;
                deckPane.style.width = `${newWidth}px`;
            }
        }
    }

    // Apply expansion state
    if (preferences.expansionState) {
        // Update the global deckEditorExpansionState to match database preferences
        deckEditorExpansionState = { ...preferences.expansionState };
        
        // Apply the expansion state to deck editor sections
        Object.entries(preferences.expansionState).forEach(([category, isExpanded]) => {
            // Handle deck editor sections (deck-type-${category})
            const cardsDiv = document.getElementById(`deck-type-${category}`);
            if (cardsDiv) {
                const section = cardsDiv.closest('.deck-type-section');
                const header = section ? section.querySelector('.deck-type-header') : null;
                const toggle = header ? header.querySelector('.deck-type-toggle') : null;
                
                if (cardsDiv && header && toggle) {
                if (isExpanded) {
                        cardsDiv.style.display = 'block';
                        toggle.textContent = '▼';
                    header.classList.remove('collapsed');
                } else {
                        cardsDiv.style.display = 'none';
                        toggle.textContent = '▶';
                    header.classList.add('collapsed');
                    }
                }
            }
        });
    }

    // Apply power cards sort mode
    if (preferences.powerCardsSortMode) {
        powerCardsSortMode = preferences.powerCardsSortMode;
        const sortButton = document.getElementById('powerCardsSortToggle');
        if (sortButton) {
            sortButton.textContent = powerCardsSortMode === 'value' ? 'Sort by Type' : 'Sort by Value';
        }
    }

    // Apply character group expansion state
    if (preferences.characterGroupExpansionState) {
        Object.assign(characterGroupExpansionState, preferences.characterGroupExpansionState);
    }

    // Apply view mode (list, tile, or card)
    if (preferences.viewMode) {
        const deckCardsEditor = document.getElementById('deckCardsEditor');
        const listViewBtn = document.getElementById('listViewBtn');
        
        if (deckCardsEditor && listViewBtn) {
            if (preferences.viewMode === 'card') {
                // Apply card view for all users
                manageDeckLayout('removeClass', { className: 'list-view' });
                manageDeckLayout('addClass', { className: 'card-view' });
                listViewBtn.textContent = 'List View';
                // Re-render in card view
                renderDeckCardsCardView();
            } else if (preferences.viewMode === 'list') {
                manageDeckLayout('addClass', { className: 'list-view' });
                manageDeckLayout('removeClass', { className: 'card-view' });
                listViewBtn.textContent = 'Tile View';
                // Re-render in list view
                renderDeckCardsListView();
            } else {
                // Default to tile view - but check if Card View is already set
                if (deckCardsEditor.classList.contains('card-view')) {
                    // Card View is already set, don't override it
                    return;
                }
                
                manageDeckLayout('removeClass', { className: 'list-view' });
                manageDeckLayout('removeClass', { className: 'card-view' });
                listViewBtn.textContent = 'Card View';
                // Re-render in tile view
                await displayDeckCardsForEditing();
            }
        }
    } else {
        // No viewMode in preferences - check if Card View is already set
        const deckCardsEditor = document.getElementById('deckCardsEditor');
        const listViewBtn = document.getElementById('listViewBtn');
        
        if (deckCardsEditor && listViewBtn) {
            // Check if Card View is already set
            if (deckCardsEditor.classList.contains('card-view')) {
                // Card View is already set, don't override it
                return;
            }
        }
    }
}


// ===== saveDeckExpansionState through loadCharacterGroupExpansionState =====

function saveDeckExpansionState() {
    if (currentDeckId) {
        // SECURITY: Check if user owns this deck before saving expansion state
        if (currentDeckData && currentDeckData.metadata && !currentDeckData.metadata.isOwner) {
            console.log('🔒 SECURITY: Blocking expansion state save - user does not own this deck');
            return;
        }
        
        console.log('Saving expansion state for deck:', currentDeckId, 'state:', deckEditorExpansionState);
        localStorage.setItem(`deckExpansionState_${currentDeckId}`, JSON.stringify(deckEditorExpansionState));
        
        // Also save UI preferences to database
        const preferences = getCurrentUIPreferences();
        saveUIPreferences(currentDeckId, preferences);
    }
}

// Load deck expansion state from localStorage
function loadDeckExpansionState() {
    if (currentDeckId) {
        const savedState = localStorage.getItem(`deckExpansionState_${currentDeckId}`);
        console.log('Loading expansion state for deck:', currentDeckId, 'saved state:', savedState);
        if (savedState) {
            try {
                deckEditorExpansionState = JSON.parse(savedState);
                console.log('Loaded expansion state:', deckEditorExpansionState);
            } catch (error) {
                console.error('Error loading deck expansion state:', error);
                deckEditorExpansionState = {};
            }
        } else {
            console.log('No saved expansion state found, using empty object');
            deckEditorExpansionState = {};
        }
    } else {
        console.log('No currentDeckId, using empty expansion state');
        deckEditorExpansionState = {};
    }
}

// Save character group expansion state to localStorage
function saveCharacterGroupExpansionState() {
    if (currentDeckId) {
        // Character group expansion state is UI-only and should be saved for all users
        localStorage.setItem(`characterGroupExpansionState_${currentDeckId}`, JSON.stringify(characterGroupExpansionState));
        
        // Also save UI preferences to database (this will be blocked by saveUIPreferences if needed)
        const preferences = getCurrentUIPreferences();
        saveUIPreferences(currentDeckId, preferences);
    }
}

// Load character group expansion state from localStorage
function loadCharacterGroupExpansionState() {
    if (currentDeckId) {
        const savedState = localStorage.getItem(`characterGroupExpansionState_${currentDeckId}`);
        if (savedState) {
            try {
                characterGroupExpansionState = JSON.parse(savedState);
            } catch (error) {
                console.error('Error loading character group expansion state:', error);
                characterGroupExpansionState = {};
            }
        } else {
            characterGroupExpansionState = {};
        }
    } else {
        characterGroupExpansionState = {};
    }
}


// Export all functions to window for backward compatibility
window.loadUIPreferences = loadUIPreferences;
window.saveUIPreferences = saveUIPreferences;
window.getCurrentUIPreferences = getCurrentUIPreferences;
window.getDividerPosition = getDividerPosition;
window.getExpansionState = getExpansionState;
window.applyUIPreferences = applyUIPreferences;
window.saveDeckExpansionState = saveDeckExpansionState;
window.loadDeckExpansionState = loadDeckExpansionState;
window.saveCharacterGroupExpansionState = saveCharacterGroupExpansionState;
window.loadCharacterGroupExpansionState = loadCharacterGroupExpansionState;
