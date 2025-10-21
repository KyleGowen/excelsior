/* ========================================
 * DATABASE VIEW SEARCH COMPONENT
 * ========================================
 *
 * This file contains the search functionality
 * organized as part of Step 5 of the database view refactoring project.
 *
 * Purpose: Search functionality and management
 * Created: Step 5 of 6-step database view refactoring project
 * Contains:
 *   - DatabaseViewSearch class - Search management and coordination
 *   - Search input handling and debouncing
 *   - Search result filtering and display
 *   - Search state management
 *
 * ======================================== */

/**
 * Database View Search Component
 * Manages search functionality across all tabs
 */
class DatabaseViewSearch {
    constructor() {
        this.initialized = false;
        this.currentSearchTerm = '';
        this.searchHandlers = new Map();
        this.debounceTimeout = null;
        this.debounceDelay = 300;

        // Bind methods to preserve context
        this.initialize = this.initialize.bind(this);
        this.handleSearchInput = this.handleSearchInput.bind(this);
        this.handleTabSwitch = this.handleTabSwitch.bind(this);
        this.performSearch = this.performSearch.bind(this);
    }

    /**
     * Initialize the search component
     */
    async initialize() {
        if (this.initialized) {
            console.log('Database view search already initialized');
            return;
        }

        console.log('Initializing database view search...');

        try {
            // Initialize search handlers
            this.initializeSearchHandlers();

            // Setup search event listeners
            this.setupSearchEventListeners();

            // Initialize search input
            this.initializeSearchInput();

            this.initialized = true;
            console.log('Database view search initialized successfully');

        } catch (error) {
            console.error('Error initializing database view search:', error);
            throw error;
        }
    }

    /**
     * Initialize search handlers for different tabs
     */
    initializeSearchHandlers() {
        const searchHandlers = {
            'characters': {
                searchFunction: 'filterCharactersByName',
                clearFunction: 'clearCharacterSearch'
            },
            'special-cards': {
                searchFunction: 'filterSpecialCardsByName',
                clearFunction: 'clearSpecialCardSearch'
            },
            'advanced-universe': {
                searchFunction: 'filterAdvancedUniverseByName',
                clearFunction: 'clearAdvancedUniverseSearch'
            },
            'locations': {
                searchFunction: 'filterLocationsByName',
                clearFunction: 'clearLocationSearch'
            },
            'aspects': {
                searchFunction: 'filterAspectsByName',
                clearFunction: 'clearAspectSearch'
            },
            'missions': {
                searchFunction: 'filterMissionsByName',
                clearFunction: 'clearMissionSearch'
            },
            'events': {
                searchFunction: 'filterEventsByName',
                clearFunction: 'clearEventSearch'
            },
            'teamwork': {
                searchFunction: 'filterTeamworkByName',
                clearFunction: 'clearTeamworkSearch'
            },
            'ally-universe': {
                searchFunction: 'filterAllyUniverseByName',
                clearFunction: 'clearAllyUniverseSearch'
            },
            'training': {
                searchFunction: 'filterTrainingByName',
                clearFunction: 'clearTrainingSearch'
            },
            'basic-universe': {
                searchFunction: 'filterBasicUniverseByName',
                clearFunction: 'clearBasicUniverseSearch'
            },
            'power-cards': {
                searchFunction: 'filterPowerCardsByName',
                clearFunction: 'clearPowerCardsSearch'
            }
        };

        this.searchHandlers = new Map(Object.entries(searchHandlers));
        console.log(`Initialized ${this.searchHandlers.size} search handlers`);
    }

    /**
     * Setup search event listeners
     */
    setupSearchEventListeners() {
        // Listen for tab switches to update search context
        document.addEventListener('databaseViewTabSwitched', this.handleTabSwitch);

        console.log('Database view search event listeners setup');
    }

    /**
     * Initialize search input
     */
    initializeSearchInput() {
        const searchInput = document.getElementById('search-input');
        if (!searchInput) {
            console.warn('Search input element not found');
            return;
        }

        // Add input event listener with debouncing
        searchInput.addEventListener('input', this.handleSearchInput);

        // Add keydown event listener for Enter key
        searchInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                this.performSearch();
            }
        });

        console.log('Search input initialized');
    }

    /**
     * Handle search input with debouncing
     */
    handleSearchInput(event) {
        const searchTerm = event.target.value.trim();

        // Clear existing timeout
        if (this.debounceTimeout) {
            clearTimeout(this.debounceTimeout);
        }

        // Set new timeout for debounced search
        this.debounceTimeout = setTimeout(() => {
            this.currentSearchTerm = searchTerm;
            this.performSearch();
        }, this.debounceDelay);
    }

    /**
     * Handle tab switch events
     */
    handleTabSwitch(event) {
        const tabName = event.detail?.tabName;
        if (!tabName) return;

        console.log(`Search component handling tab switch to: ${tabName}`);

        // Clear current search when switching tabs
        this.clearSearch();
    }

    /**
     * Perform search for current tab
     */
    performSearch() {
        const currentTab = this.getCurrentTab();
        if (!currentTab) {
            console.warn('No current tab for search');
            return;
        }

        const handler = this.searchHandlers.get(currentTab);
        if (!handler) {
            console.warn(`No search handler for tab: ${currentTab}`);
            return;
        }

        try {
            if (this.currentSearchTerm) {
                // Perform search
                if (window[handler.searchFunction]) {
                    window[handler.searchFunction](this.currentSearchTerm);
                }
            } else {
                // Clear search
                if (window[handler.clearFunction]) {
                    window[handler.clearFunction]();
                }
            }
        } catch (error) {
            console.error(`Error performing search for tab ${currentTab}:`, error);
        }
    }

    /**
     * Clear current search
     */
    clearSearch() {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.value = '';
        }

        this.currentSearchTerm = '';

        // Clear debounce timeout
        if (this.debounceTimeout) {
            clearTimeout(this.debounceTimeout);
            this.debounceTimeout = null;
        }
    }

    /**
     * Get current tab from database view core
     */
    getCurrentTab() {
        if (window.databaseViewCore) {
            return window.databaseViewCore.getCurrentTab();
        }
        return null;
    }

    /**
     * Set search term programmatically
     */
    setSearchTerm(searchTerm) {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.value = searchTerm;
            this.currentSearchTerm = searchTerm;
            this.performSearch();
        }
    }

    /**
     * Get current search term
     */
    getCurrentSearchTerm() {
        return this.currentSearchTerm;
    }

    /**
     * Check if search is active
     */
    isSearchActive() {
        return this.currentSearchTerm.length > 0;
    }

    /**
     * Get search handler for a specific tab
     */
    getSearchHandler(tabName) {
        return this.searchHandlers.get(tabName);
    }

    /**
     * Update search placeholder for current tab
     */
    updateSearchPlaceholder(tabName) {
        const searchInput = document.getElementById('search-input');
        if (!searchInput) return;

        const handler = this.searchHandlers.get(tabName);
        if (handler && handler.placeholder) {
            searchInput.placeholder = handler.placeholder;
        }
    }

    /**
     * Enable search for a tab
     */
    enableSearch(tabName) {
        const searchContainer = document.getElementById('search-container');
        if (searchContainer) {
            searchContainer.style.display = 'block';
        }
    }

    /**
     * Disable search for a tab
     */
    disableSearch(tabName) {
        const searchContainer = document.getElementById('search-container');
        if (searchContainer) {
            searchContainer.style.display = 'none';
        }
    }

    /**
     * Set debounce delay
     */
    setDebounceDelay(delay) {
        this.debounceDelay = delay;
    }

    /**
     * Get debounce delay
     */
    getDebounceDelay() {
        return this.debounceDelay;
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        // Remove event listeners
        document.removeEventListener('databaseViewTabSwitched', this.handleTabSwitch);

        // Clear search input listener
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.removeEventListener('input', this.handleSearchInput);
        }

        // Clear debounce timeout
        if (this.debounceTimeout) {
            clearTimeout(this.debounceTimeout);
            this.debounceTimeout = null;
        }

        // Clear handlers
        this.searchHandlers.clear();

        this.initialized = false;
        this.currentSearchTerm = '';

        console.log('Database view search cleaned up');
    }
}

// Make globally available
window.DatabaseViewSearch = DatabaseViewSearch;
