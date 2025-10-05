// Global Navigation Component JavaScript

// Global flag to prevent multiple switchToDeckBuilder calls during new deck creation
let isCreatingNewDeck = false;

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
    
    // Update URL without page reload, but preserve /new if we're creating a new deck
    const currentUser = getCurrentUser();
    const userId = currentUser ? (currentUser.userId || currentUser.id) : 'guest';
    const currentUrl = window.location.pathname;
    const isCreatingNewDeck = currentUrl.includes('/decks/new');
    
    let newUrl = `/users/${userId}/decks`;
    if (isCreatingNewDeck) {
        newUrl = `/users/${userId}/decks/new`;
    }
    
    console.log('🔍 DEBUG: switchToDeckBuilder - preserving URL:', newUrl, 'isCreatingNewDeck:', isCreatingNewDeck);
    history.pushState({view: 'deckbuilder'}, '', newUrl);
    
    // Update button states
    document.getElementById('deckBuilderBtn').classList.add('active');
    document.getElementById('databaseViewBtn').classList.remove('active');
    
    // Show deck builder, hide database view
    const deckBuilderEl = document.getElementById('deck-builder');
    if (deckBuilderEl) {
        deckBuilderEl.style.display = 'block';
        // Fade in smoothly to avoid flash
        requestAnimationFrame(() => {
            deckBuilderEl.style.opacity = '1';
        });
    }
    const databaseViewEl = document.getElementById('database-view');
    if (databaseViewEl) {
        databaseViewEl.style.display = 'none';
    }
    
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
    
    // Load deck data if not already loaded, but not if we're creating a new deck
    const historyState = window.history.state;
    const isCreatingNewDeckCheck = isCreatingNewDeck || currentUrl.includes('/decks/new') || (historyState && historyState.newDeck);
    
    console.log('🔍 DEBUG: switchToDeckBuilder - currentUrl:', currentUrl, 'historyState:', historyState, 'isCreatingNewDeck:', isCreatingNewDeckCheck);
    
    if (!isCreatingNewDeckCheck && document.getElementById('total-decks') && document.getElementById('total-decks').textContent === '-') {
        console.log('🔍 DEBUG: switchToDeckBuilder - loading deck data');
        if (typeof loadDeckBuilderData === 'function') {
            loadDeckBuilderData();
        } else if (typeof loadDecks === 'function') {
            loadDecks();
        }
    } else {
        console.log('🔍 DEBUG: switchToDeckBuilder - skipping deck data load (new deck creation or already loaded)');
    }
}

function createNewDeck() {
    console.log('🔍 DEBUG: createNewDeck called');
    isCreatingNewDeck = true;
    
    // Define default UI preferences
    const defaultUIPreferences = {
        "viewMode": "tile",
        "expansionState": {
            "event": true, "power": true, "aspect": true, "mission": true, "special": true,
            "location": true, "teamwork": true, "training": true, "character": true,
            "ally_universe": true, "basic_universe": true, "advanced_universe": true
        },
        "dividerPosition": 65,
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
    window.history.pushState({ newDeck: true, userId, view: 'deckbuilder' }, '', newUrl);
    console.log('🔍 Updated URL to:', newUrl);

    // Show the deck editor with the blank deck
    if (typeof showDeckEditor === 'function') {
        console.log('🔍 DEBUG: About to call showDeckEditor for new deck');
        
        // Clear any existing cards BEFORE showing the editor
        const deckCardsContainer = document.getElementById('deckCardsContainer');
        if (deckCardsContainer) {
            deckCardsContainer.innerHTML = '<div class="no-cards-message">No cards in this deck yet. Drag cards from the right panel to add them!</div>';
        }
        
        // Also clear the deckCardsEditor element if it exists
        const deckCardsEditor = document.getElementById('deckCardsEditor');
        if (deckCardsEditor) {
            deckCardsEditor.innerHTML = '<div class="empty-deck-message"><p>No cards in this deck yet.</p><p>Drag cards from the right panel to add them!</p></div>';
        }
        
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
        
        // Load available cards if function exists
        if (typeof loadAvailableCards === 'function') {
            loadAvailableCards();
        }
        
        // Update card count
        if (typeof updateDeckCardCount === 'function') {
            updateDeckCardCount();
        }
        
        // Reset the flag after a short delay to allow the deck editor to fully initialize
        setTimeout(() => {
            isCreatingNewDeck = false;
            console.log('🔍 DEBUG: Reset isCreatingNewDeck flag');
        }, 1000);
    } else {
        console.error('showDeckEditor function not found');
    }
}

// Initialize global navigation
function initializeGlobalNav() {
    console.log('🔍 DEBUG: initializeGlobalNav called');
    
    // Initialize user menu
    setupUserMenu();
    
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
        } else if (event.state && event.state.newDeck) {
            // Don't call switchToDeckBuilder for new deck creation
            console.log('🔍 DEBUG: popstate for new deck, not calling switchToDeckBuilder');
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
        const displayName = (currentUser.role === 'GUEST') ? 'Guest' : (currentUser.username || currentUser.name || 'User');
        const usernameElement = document.getElementById('currentUsername');
        if (usernameElement) usernameElement.textContent = displayName;
        buildUserMenuOptions(currentUser);
    }
}

function setupUserMenu() {
    const toggle = document.getElementById('userMenuToggle');
    const dropdown = document.getElementById('userMenuDropdown');
    if (!toggle || !dropdown) return;
    // Listener not added here because inline onclick handles it.
}

function toggleUserMenu(event) {
    if (event) {
        if (typeof event.preventDefault === 'function') event.preventDefault();
        if (typeof event.stopPropagation === 'function') event.stopPropagation();
    }
    const toggle = document.getElementById('userMenuToggle');
    const dropdown = document.getElementById('userMenuDropdown');
    if (!toggle || !dropdown) return;
    const isOpen = dropdown.classList.toggle('show');
    console.log('🔍 DEBUG: toggleUserMenu clicked, isOpen =', isOpen);
    toggle.classList.toggle('open', isOpen);
    if (isOpen) {
        document.addEventListener('click', closeUserMenuOnOutsideClick);
    } else {
        document.removeEventListener('click', closeUserMenuOnOutsideClick);
    }
}

function closeUserMenuOnOutsideClick(e) {
    const menu = document.getElementById('userMenu');
    const dropdown = document.getElementById('userMenuDropdown');
    const toggle = document.getElementById('userMenuToggle');
    if (menu && !menu.contains(e.target)) {
        dropdown.classList.remove('show');
        if (toggle) toggle.classList.remove('open');
        document.removeEventListener('click', closeUserMenuOnOutsideClick);
    }
}

function buildUserMenuOptions(user) {
    const dropdown = document.getElementById('userMenuDropdown');
    if (!dropdown) return;
    dropdown.innerHTML = '';

    // + Create Deck - available to USER and ADMIN
    if (user.role !== 'GUEST') {
        dropdown.appendChild(createUserMenuItem('+ Create Deck', () => { closeUserMenu(); createNewDeck(); }));
    }
    // + Create User - ADMIN only
    if (user.role === 'ADMIN') {
        dropdown.appendChild(createUserMenuItem('+ Create User', () => { closeUserMenu(); toggleCreateUserDropdown(); }));
    }
    // Change Password - USER and ADMIN (placeholder handler)
    if (user.role !== 'GUEST') {
        dropdown.appendChild(createUserMenuItem('Change Password', () => { closeUserMenu(); alert('Change Password coming soon'); }));
    }
    // Log Out - everyone
    dropdown.appendChild(createUserMenuItem('Log Out', () => { closeUserMenu(); const btn = document.getElementById('logoutBtn'); if (btn) btn.click(); }));
}

function createUserMenuItem(label, onClick) {
    const btn = document.createElement('button');
    btn.className = 'user-menu-item';
    btn.textContent = label;
    btn.onclick = onClick;
    return btn;
}

function closeUserMenu() {
    const dropdown = document.getElementById('userMenuDropdown');
    const toggle = document.getElementById('userMenuToggle');
    if (dropdown) dropdown.classList.remove('show');
    if (toggle) toggle.classList.remove('open');
    document.removeEventListener('click', closeUserMenuOnOutsideClick);
}

// Expose handlers globally for inline HTML usage and sanity
// (Some pages may load this script earlier/later; this ensures availability)
window.toggleUserMenu = toggleUserMenu;
window.closeUserMenu = closeUserMenu;
window.toggleCreateUserDropdown = toggleCreateUserDropdown;
window.closeCreateUserDropdown = closeCreateUserDropdown;
window.createUser = createUser;

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
