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
    
    // Define default UI preferences
    const defaultUIPreferences = {
        "viewMode": "tile",
        "expansionState": {
            "event": true, "power": true, "aspect": true, "mission": true, "special": true,
            "location": true, "teamwork": true, "training": true, "character": true,
            "ally_universe": true, "basic_universe": true, "advanced_universe": true
        },
        "dividerPosition": 65.86319218241043,
        "powerCardsSortMode": "type",
        "characterGroupExpansionState": {}
    };

    // Clear any existing deck data and set up a new blank deck client-side
    if (typeof currentDeckId !== 'undefined') {
        currentDeckId = null; // No ID until saved
    }
    if (typeof currentDeckData !== 'undefined') {
        const currentUser = getCurrentUser();
        currentDeckData = {
            metadata: {
                id: null, // No ID until saved
                name: 'New Deck',
                description: '',
                created: new Date().toISOString(), // Client-side timestamp
                lastModified: new Date().toISOString(), // Client-side timestamp
                cardCount: 0,
                userId: currentUser ? (currentUser.userId || currentUser.id) : 'guest',
                ui_preferences: defaultUIPreferences
            },
            cards: []
        };
    }
    if (typeof deckEditorCards !== 'undefined') {
        deckEditorCards = [];
    }

    // Update URL to indicate we're creating a new deck
    const currentUser = getCurrentUser();
    const userId = currentUser ? (currentUser.userId || currentUser.id) : 'guest';
    const newUrl = `/users/${userId}/decks/new`;
    window.history.pushState({ newDeck: true, userId }, '', newUrl);
    console.log('🔍 Updated URL to:', newUrl);

    // Show the deck editor with the blank deck
    if (typeof showDeckEditor === 'function') {
        showDeckEditor();
        
        // Set up the deck editor with the new blank deck data
        const titleElement = document.getElementById('deckEditorTitle');
        const descriptionElement = document.getElementById('deckEditorDescription');
        
        if (titleElement) {
            titleElement.textContent = currentDeckData.metadata.name;
            titleElement.contentEditable = 'true';
        }
        
        if (descriptionElement) {
            descriptionElement.textContent = currentDeckData.metadata.description || 'Click to add description';
            descriptionElement.style.display = 'block';
            if (!currentDeckData.metadata.description) {
                descriptionElement.classList.add('placeholder');
            }
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
        
        // Update card count
        if (typeof updateDeckCardCount === 'function') {
            updateDeckCardCount();
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
        
        // Show/hide Create User button based on role
        const createUserContainer = document.getElementById('createUserContainer');
        if (createUserContainer) {
            if (currentUser.role === 'ADMIN') {
                createUserContainer.style.display = 'inline-block';
            } else {
                createUserContainer.style.display = 'none';
            }
        }
    }
}

// Create User functionality
function toggleCreateUserDropdown() {
    const dropdown = document.getElementById('createUserDropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
        
        // Close dropdown when clicking outside
        if (dropdown.classList.contains('show')) {
            document.addEventListener('click', closeCreateUserDropdownOnOutsideClick);
        } else {
            document.removeEventListener('click', closeCreateUserDropdownOnOutsideClick);
        }
    }
}

function closeCreateUserDropdown() {
    const dropdown = document.getElementById('createUserDropdown');
    if (dropdown) {
        dropdown.classList.remove('show');
        document.removeEventListener('click', closeCreateUserDropdownOnOutsideClick);
        
        // Clear form
        const form = document.getElementById('createUserForm');
        if (form) {
            form.reset();
        }
    }
}

function closeCreateUserDropdownOnOutsideClick(event) {
    const container = document.getElementById('createUserContainer');
    const dropdown = document.getElementById('createUserDropdown');
    
    if (container && dropdown && !container.contains(event.target)) {
        closeCreateUserDropdown();
    }
}

async function createUser(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const username = formData.get('username');
    const password = formData.get('password');
    
    if (!username || !password) {
        alert('Please fill in all fields');
        return;
    }
    
    try {
        const response = await fetch('/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                username: username,
                password: password
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            alert(`User "${username}" created successfully!`);
            closeCreateUserDropdown();
        } else {
            alert(`Error creating user: ${data.error || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Error creating user:', error);
        alert('Error creating user. Please try again.');
    }
}
