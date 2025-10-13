/* ========================================
 * PHASE 6: DATA LOADING FUNCTIONS
 * ========================================
 * 
 * This file contains API data loading and management functions
 * extracted from index.html during Phase 6 of the refactoring project.
 * 
 * Purpose: API data loading and management
 * Created: Phase 6 of 12-phase refactoring project
 * Contains:
 *   - loadDatabaseViewData() - Database view initialization
 *   - loadCharacters() - Character data loading
 *   - loadSpecialCards() - Special card data loading
 *   - All other card type loading functions
 *   - Background data loading functions
 * 
 * ======================================== */

// Load all database view data
async function loadDatabaseViewData(forceCharactersTab = false) {
    // Clear all filters globally before loading data
    clearAllFiltersGlobally();
    
    // Only force characters tab if explicitly requested
    if (forceCharactersTab) {
        // Ensure characters tab is visible before loading data
        const charactersTab = document.getElementById('characters-tab');
        charactersTab.style.display = 'block';
        
        // Set characters tab as active
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        const charactersButton = document.querySelector('[onclick="switchTab(\'characters\')"]');
        charactersButton.classList.add('active');
    }
    
    try {
        await Promise.all([
            loadCharacters(),
            loadSpecialCards(),
            loadAdvancedUniverse(),
            loadMissions(),
            loadLocations(),
            loadEvents(),
            loadAspects(),
            loadTeamwork(),
            loadAllyUniverse(),
            loadTraining(),
            loadBasicUniverse(),
            loadPowerCards(),
            loadUserDecks()
        ]);
        
        // Update all statistics after loading all data
        
        // Only switch to characters tab if explicitly requested
        if (forceCharactersTab) {
            switchTab('characters');
        }
        
    // Disable "Add to Deck" buttons for guest users immediately
    disableAddToDeckButtonsImmediate();
        
    } catch (error) {
        console.error('❌ Error loading database view data:', error);
    }
}

// Load and display characters
async function loadCharacters() {
    try {
        const response = await fetch('/api/characters');
        const data = await response.json();
        
        if (data.success) {
            
            // Small delay to ensure DOM is ready
            await new Promise(resolve => setTimeout(resolve, 10));
            
            displayCharacters(data.data);
            console.log('✅ Characters loaded and displayed successfully:', data.data.length);
        } else {
            throw new Error('Failed to load characters');
        }
    } catch (error) {
        console.error('❌ Error loading characters:', error);
        document.getElementById('characters-tbody').innerHTML = 
            '<tr><td colspan="8" class="error">Error loading characters. Please try again.</td></tr>';
    }
}

// Load and display special cards
async function loadSpecialCards() {
    try {
        const response = await fetch('/api/special-cards');
        const data = await response.json();
        
        if (data.success) {
            displaySpecialCards(data.data);
        } else {
            throw new Error('Failed to load special cards');
        }
    } catch (error) {
        console.error('Error loading special cards:', error);
        document.getElementById('special-cards-tbody').innerHTML = 
            '<tr><td colspan="5" class="error">Error loading special cards. Please try again.</td></tr>';
    }
}

// Load and display locations
async function loadLocations() {
    try {
        const response = await fetch('/api/locations');
        const data = await response.json();
        
        if (data.success) {
            displayLocations(data.data);
        } else {
            throw new Error('Failed to load locations');
        }
    } catch (error) {
        console.error('Error loading locations:', error);
        document.getElementById('locations-tbody').innerHTML = 
            '<tr><td colspan="4" class="error">Error loading locations. Please try again.</td></tr>';
    }
}
