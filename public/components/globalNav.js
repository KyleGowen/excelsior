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
        const displayName = (currentUser.username === 'guest' || currentUser.name === 'guest') 
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
        const displayName = (currentUser.username === 'guest' || currentUser.name === 'guest') 
            ? 'Guest' 
            : (currentUser.username || currentUser.name || 'User');
        const usernameElement = document.getElementById('currentUsername');
        if (usernameElement) {
            usernameElement.textContent = displayName;
        }
    }
}
