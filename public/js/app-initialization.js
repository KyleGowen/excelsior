// App Initialization Functions
// Extracted from index.html for better modularity

// Load and initialize global navigation component
async function loadGlobalNav() {
    try {
        const response = await fetch('/components/globalNav.html');
        const html = await response.text();
        document.getElementById('globalNav').innerHTML = html;
        
        // Initialize the global navigation
        initializeGlobalNav();
    } catch (error) {
        console.error('Failed to load global navigation:', error);
    }
}

// Show main application interface
function showMainApp() {
    document.getElementById('loginModal').style.display = 'none';
    // Display "Guest" with capital G for guest users, otherwise use the username/name
    const displayName = (currentUser.role === 'GUEST') 
        ? 'Guest' 
        : (currentUser.username || currentUser.name || 'User');
    document.getElementById('currentUsername').textContent = displayName;
    
    // Hide database view by default to avoid flash and switch directly to deck builder
    const databaseView = document.getElementById('database-view');
    if (databaseView) databaseView.style.display = 'none';

    // Load core data in background to keep transition smooth
    loadMainAppDataInBackground();

    // Show deck builder smoothly
    if (typeof switchToDeckBuilder === 'function') {
        switchToDeckBuilder();
    } else {
        const deckBuilder = document.getElementById('deck-builder');
        if (deckBuilder) deckBuilder.style.display = 'block';
    }

    // Disable "Add to Deck" buttons for guest users immediately
    disableAddToDeckButtonsImmediate();
}

// Load main app data in background without showing the UI
function loadMainAppDataInBackground() {
    // Load user decks
    loadUserDecks();
    // Load database view data (this will populate the global variables)
    loadDatabaseViewData();
}

// Load user-specific data
async function loadUserData() {
    // Load user-specific data
    loadCharacters();
    loadSpecialCards();
    loadAdvancedUniverse();
    loadMissions();
    loadLocations();
    loadEvents();
    loadAspects();
    loadTeamwork();
    loadAllyUniverse();
    loadTraining();
    loadBasicUniverse();
    loadPowerCards();
    loadDecks();
}
