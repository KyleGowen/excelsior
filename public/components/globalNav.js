// Global Navigation Component JavaScript

// Client-side navigation functions
function switchToDatabaseView() {
    // Update URL without page reload
    const currentUser = getCurrentUser();
    const userId = currentUser ? (currentUser.userId || currentUser.id) : 'guest';
    history.pushState({view: 'database'}, '', `/users/${userId}/decks`);
    
    // Update button states
    document.getElementById('databaseViewBtn').classList.add('active');
    document.getElementById('deckBuilderBtn').classList.remove('active');
    
    // Show database view, hide deck builder
    document.getElementById('database-view').style.display = 'block';
    document.getElementById('deck-builder').style.display = 'none';
    
    // Show database statistics and hide deck statistics
    const databaseStats = document.getElementById('database-stats');
    const deckStats = document.getElementById('deck-stats');
    const createDeckSection = document.getElementById('createDeckSection');
    
    if (databaseStats) databaseStats.style.display = 'grid';
    if (deckStats) deckStats.style.display = 'none';
    if (createDeckSection) createDeckSection.style.display = 'none';
    
    // Load database data if not already loaded
    if (document.getElementById('total-characters') && document.getElementById('total-characters').textContent === '-') {
        if (typeof loadDatabaseViewData === 'function') {
            loadDatabaseViewData();
        }
    }
}

function switchToDeckBuilder() {
    console.log('🔍 DEBUG: switchToDeckBuilder called');
    
    // Update URL without page reload
    const currentUser = getCurrentUser();
    const userId = currentUser ? (currentUser.userId || currentUser.id) : 'guest';
    history.pushState({view: 'deckbuilder'}, '', `/users/${userId}/decks`);
    
    // Update button states
    document.getElementById('deckBuilderBtn').classList.add('active');
    document.getElementById('databaseViewBtn').classList.remove('active');
    
    // Show deck builder, hide database view
    document.getElementById('deck-builder').style.display = 'block';
    document.getElementById('database-view').style.display = 'none';
    
    // Show deck statistics and hide database statistics
    const databaseStats = document.getElementById('database-stats');
    const deckStats = document.getElementById('deck-stats');
    const createDeckSection = document.getElementById('createDeckSection');
    
    console.log('🔍 DEBUG: createDeckSection element:', createDeckSection);
    
    if (databaseStats) databaseStats.style.display = 'none';
    if (deckStats) deckStats.style.display = 'grid';
    if (createDeckSection) {
        console.log('🔍 DEBUG: Setting createDeckSection to display: flex');
        createDeckSection.style.display = 'flex';
    } else {
        console.log('❌ DEBUG: createDeckSection element not found!');
    }
    
    // Ensure username is displayed when switching back to deck builder
    if (currentUser) {
        const displayName = (currentUser.role === 'GUEST') 
            ? 'Guest' 
            : (currentUser.username || currentUser.name || 'User');
        const usernameElement = document.getElementById('currentUsername');
        if (usernameElement) {
            usernameElement.textContent = displayName;
        }
    }
    
    // Load deck data if not already loaded
    if (document.getElementById('total-decks') && document.getElementById('total-decks').textContent === '-') {
        if (typeof loadDeckBuilderData === 'function') {
            loadDeckBuilderData();
        } else if (typeof loadDecks === 'function') {
            loadDecks();
        }
    }
}

function createNewDeck() {
    console.log('🔍 DEBUG: createNewDeck called');
    
    // Clear any existing deck data
    if (typeof currentDeckId !== 'undefined') {
        currentDeckId = null;
    }
    if (typeof currentDeckData !== 'undefined') {
        currentDeckData = null;
    }
    if (typeof deckEditorCards !== 'undefined') {
        deckEditorCards = [];
    }
    
    // Show the deck editor with blank deck
    if (typeof showDeckEditor === 'function') {
        showDeckEditor();
        
        // Initialize with blank deck data
        if (typeof initializeBlankDeck === 'function') {
            initializeBlankDeck();
        } else {
            // Fallback: manually set up blank deck
            const titleElement = document.getElementById('deckEditorTitle');
            const descriptionElement = document.getElementById('deckEditorDescription');
            
            if (titleElement) {
                titleElement.textContent = 'New Deck';
                titleElement.contentEditable = 'true';
            }
            
            if (descriptionElement) {
                descriptionElement.textContent = 'Click to add description';
                descriptionElement.style.display = 'block';
                descriptionElement.classList.add('placeholder');
            }
            
            // Clear any existing cards
            const deckCardsContainer = document.getElementById('deckCardsContainer');
            if (deckCardsContainer) {
                deckCardsContainer.innerHTML = '<div class="no-cards-message">No cards in this deck yet. Drag cards from the right panel to add them!</div>';
            }
            
            // Load available cards if function exists
            if (typeof loadAvailableCards === 'function') {
                loadAvailableCards();
            }
        }
    } else {
        console.error('showDeckEditor function not found');
    }
}

// Initialize global navigation
function initializeGlobalNav() {
    console.log('🔍 DEBUG: initializeGlobalNav called');
    
    // Check if createDeckSection exists
    const createDeckSection = document.getElementById('createDeckSection');
    console.log('🔍 DEBUG: createDeckSection found during init:', createDeckSection);
    
    // Set up logout button functionality
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            // Clear session and redirect to login
            if (typeof logout === 'function') {
                logout();
            } else {
                // Fallback logout functionality
                fetch('/api/auth/logout', { method: 'POST' })
                    .then(() => {
                        window.location.href = '/';
                    })
                    .catch(() => {
                        window.location.href = '/';
                    });
            }
        });
    }
    
    // Set up browser back/forward navigation
    window.addEventListener('popstate', function(event) {
        if (event.state && event.state.view === 'database') {
            switchToDatabaseView();
        } else {
            switchToDeckBuilder();
        }
    });
    
    // Initialize user welcome message
    updateUserWelcome();
}

// Update user welcome message
function updateUserWelcome() {
    const currentUser = getCurrentUser();
    if (currentUser) {
        const displayName = (currentUser.role === 'GUEST') 
            ? 'Guest' 
            : (currentUser.username || currentUser.name || 'User');
        const usernameElement = document.getElementById('currentUsername');
        if (usernameElement) {
            usernameElement.textContent = displayName;
        }
    }
}
