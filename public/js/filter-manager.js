/* ========================================
 * FILTER MANAGER
 * ========================================
 *
 * This file contains the centralized filter manager for coordinating
 * all filter operations as part of Step 4 of the database view refactoring project.
 *
 * Purpose: Centralized filter coordination and management
 * Created: Step 4 of database view refactoring project
 * Contains:
 *   - Centralized filter coordination
 *   - Filter state persistence
 *   - Filter initialization management
 *   - Filter event handling
 *
 * ======================================== */

/**
 * Centralized Filter Manager
 * Coordinates all filter operations across the database view
 */
class FilterManager {
    constructor() {
        this.initialized = false;
        this.currentTab = null;
        this.filterHandlers = new Map();
        this.searchHandlers = new Map();
        this.clearHandlers = new Map();

        // Bind methods to preserve context
        this.handleTabSwitch = this.handleTabSwitch.bind(this);
        this.handleFilterChange = this.handleFilterChange.bind(this);
        this.handleSearchInput = this.handleSearchInput.bind(this);
    }

    /**
     * Initialize the filter manager
     */
    async initialize() {
        if (this.initialized) {
            console.log('Filter manager already initialized');
            return;
        }

        console.log('Initializing filter manager...');

        // Register filter handlers for different card types
        this.registerFilterHandlers();

        // Initialize filter state manager
        if (window.filterStateManager) {
            window.filterStateManager.clearAllStates();
        }

        // Initialize database view filters
        if (window.FilterInitialization) {
            window.FilterInitialization.initializeDatabaseViewFilters();
        }

        // Setup global event listeners
        this.setupGlobalEventListeners();

        this.initialized = true;
        console.log('Filter manager initialized successfully');
    }

    /**
     * Register filter handlers for different card types
     */
    registerFilterHandlers() {
        // Basic Universe filters
        this.filterHandlers.set('basic-universe', {
            apply: () => window.FilterPatterns?.applyBasicUniverseFilters(),
            clear: () => this.clearBasicUniverseFilters(),
            search: (term) => this.searchBasicUniverse(term)
        });

        // Mission filters
        this.filterHandlers.set('missions', {
            apply: () => window.FilterPatterns?.applyMissionFilters(),
            clear: () => this.clearMissionFilters(),
            search: (term) => this.searchMissions(term)
        });

        // Event filters
        this.filterHandlers.set('events', {
            apply: () => window.FilterPatterns?.applyEventFilters(),
            clear: () => this.clearEventFilters(),
            search: (term) => this.searchEvents(term)
        });

        // Character filters (from existing system)
        this.filterHandlers.set('characters', {
            apply: () => this.applyCharacterFilters(),
            clear: () => this.clearCharacterFilters(),
            search: (term) => this.searchCharacters(term)
        });

        // Location filters
        this.filterHandlers.set('locations', {
            apply: () => this.applyLocationFilters(),
            clear: () => this.clearLocationFilters(),
            search: (term) => this.searchLocations(term)
        });

        // Special card filters
        this.filterHandlers.set('special-cards', {
            apply: () => this.applySpecialCardFilters(),
            clear: () => this.clearSpecialCardFilters(),
            search: (term) => this.searchSpecialCards(term)
        });

        // Power card filters
        this.filterHandlers.set('power-cards', {
            apply: () => this.applyPowerCardFilters(),
            clear: () => this.clearPowerCardFilters(),
            search: (term) => this.searchPowerCards(term)
        });

        console.log(`Registered ${this.filterHandlers.size} filter handlers`);
    }

    /**
     * Setup global event listeners
     */
    setupGlobalEventListeners() {
        // Listen for tab switches
        document.addEventListener('tabSwitch', this.handleTabSwitch);

        // Listen for filter changes
        document.addEventListener('filterChange', this.handleFilterChange);

        // Listen for search input
        document.addEventListener('searchInput', this.handleSearchInput);
    }

    /**
     * Handle tab switch events
     */
    handleTabSwitch(event) {
        const tabName = event.detail?.tabName;
        if (!tabName) return;

        console.log(`Tab switched to: ${tabName}`);
        this.currentTab = tabName;

        // Re-initialize filters for the new tab
        if (window.FilterInitialization) {
            window.FilterInitialization.reinitializeFiltersForTab(tabName);
        }

        // Apply any existing filters for this tab
        const handler = this.filterHandlers.get(tabName);
        if (handler && handler.apply) {
            handler.apply();
        }
    }

    /**
     * Handle filter change events
     */
    handleFilterChange(event) {
        const tabName = event.detail?.tabName || this.currentTab;
        if (!tabName) return;

        const handler = this.filterHandlers.get(tabName);
        if (handler && handler.apply) {
            handler.apply();
        }
    }

    /**
     * Handle search input events
     */
    handleSearchInput(event) {
        const tabName = event.detail?.tabName || this.currentTab;
        const searchTerm = event.detail?.searchTerm;
        if (!tabName || searchTerm === undefined) return;

        const handler = this.filterHandlers.get(tabName);
        if (handler && handler.search) {
            handler.search(searchTerm);
        }
    }

    /**
     * Apply filters for a specific tab
     */
    applyFilters(tabName) {
        const handler = this.filterHandlers.get(tabName);
        if (handler && handler.apply) {
            handler.apply();
        }
    }

    /**
     * Clear filters for a specific tab
     */
    clearFilters(tabName) {
        const handler = this.filterHandlers.get(tabName);
        if (handler && handler.clear) {
            handler.clear();
        }
    }

    /**
     * Search within a specific tab
     */
    search(tabName, searchTerm) {
        const handler = this.filterHandlers.get(tabName);
        if (handler && handler.search) {
            handler.search(searchTerm);
        }
    }

    /**
     * Clear all filters across all tabs
     */
    clearAllFilters() {
        console.log('Clearing all filters...');

        for (const [tabName, handler] of this.filterHandlers) {
            if (handler.clear) {
                handler.clear();
            }
        }

        // Clear filter state
        if (window.filterStateManager) {
            window.filterStateManager.clearAllStates();
        }
    }

    /**
     * Get current filter state
     */
    getFilterState(tabName) {
        if (window.filterStateManager) {
            return window.filterStateManager.getFilterState(tabName);
        }
        return {};
    }

    /**
     * Set filter state
     */
    setFilterState(tabName, state) {
        if (window.filterStateManager) {
            window.filterStateManager.setFilterState(tabName, state);
        }
    }

    // Specific filter implementations for different card types

    /**
     * Basic Universe filter implementations
     */
    clearBasicUniverseFilters() {
        if (window.FilterUtilities) {
            window.FilterUtilities.clearFilters('#basic-universe-tab');
        }
        this.applyFilters('basic-universe');
    }

    searchBasicUniverse(searchTerm) {
        if (!searchTerm || searchTerm.length === 0) {
            this.applyFilters('basic-universe');
            return;
        }

        // Use existing search functionality
        if (window.setupBasicUniverseSearch) {
            // Trigger search through existing system
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                searchInput.value = searchTerm;
                searchInput.dispatchEvent(new Event('input'));
            }
        }
    }

    /**
     * Mission filter implementations
     */
    clearMissionFilters() {
        if (window.FilterUtilities) {
            window.FilterUtilities.clearFilters('#missions-tab');
        }
        this.applyFilters('missions');
    }

    searchMissions(searchTerm) {
        if (!searchTerm || searchTerm.length === 0) {
            this.applyFilters('missions');
            return;
        }

        // Use existing search functionality
        if (window.setupMissionSearch) {
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                searchInput.value = searchTerm;
                searchInput.dispatchEvent(new Event('input'));
            }
        }
    }

    /**
     * Event filter implementations
     */
    clearEventFilters() {
        if (window.FilterUtilities) {
            window.FilterUtilities.clearFilters('#events-tab');
        }
        this.applyFilters('events');
    }

    searchEvents(searchTerm) {
        if (!searchTerm || searchTerm.length === 0) {
            this.applyFilters('events');
            return;
        }

        // Use existing search functionality
        if (window.setupEventSearch) {
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                searchInput.value = searchTerm;
                searchInput.dispatchEvent(new Event('input'));
            }
        }
    }

    /**
     * Character filter implementations (delegate to existing system)
     */
    applyCharacterFilters() {
        if (window.applyFilters) {
            window.applyFilters();
        }
    }

    clearCharacterFilters() {
        if (window.clearAllFilters) {
            window.clearAllFilters();
        }
    }

    searchCharacters(searchTerm) {
        // Use existing character search
        if (window.filterCharactersByName) {
            window.filterCharactersByName(searchTerm);
        }
    }

    /**
     * Location filter implementations (delegate to existing system)
     */
    applyLocationFilters() {
        if (window.applyLocationFilters) {
            window.applyLocationFilters();
        }
    }

    clearLocationFilters() {
        if (window.clearLocationFilters) {
            window.clearLocationFilters();
        }
    }

    searchLocations(searchTerm) {
        // Use existing location search
        if (window.setupLocationSearch) {
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                searchInput.value = searchTerm;
                searchInput.dispatchEvent(new Event('input'));
            }
        }
    }

    /**
     * Special card filter implementations (delegate to existing system)
     */
    applySpecialCardFilters() {
        // Use existing special card filter system
        console.log('Applying special card filters');
    }

    clearSpecialCardFilters() {
        if (window.clearSpecialCardFilters) {
            window.clearSpecialCardFilters();
        }
    }

    searchSpecialCards(searchTerm) {
        if (window.setupSpecialCardSearch) {
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                searchInput.value = searchTerm;
                searchInput.dispatchEvent(new Event('input'));
            }
        }
    }

    /**
     * Power card filter implementations (delegate to existing system)
     */
    applyPowerCardFilters() {
        if (window.applyPowerCardFilters) {
            window.applyPowerCardFilters();
        }
    }

    clearPowerCardFilters() {
        if (window.clearPowerCardFilters) {
            window.clearPowerCardFilters();
        }
    }

    searchPowerCards(searchTerm) {
        if (window.setupPowerCardsSearch) {
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                searchInput.value = searchTerm;
                searchInput.dispatchEvent(new Event('input'));
            }
        }
    }
}

// Create global filter manager instance
const filterManager = new FilterManager();

// Make filter manager globally available
window.FilterManager = FilterManager;
window.filterManager = filterManager;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        filterManager.initialize();
    });
} else {
    filterManager.initialize();
}
