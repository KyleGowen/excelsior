/* ========================================
 * DATABASE VIEW DISPLAY COMPONENT
 * ========================================
 *
 * This file contains the display and rendering functionality
 * organized as part of Step 5 of the database view refactoring project.
 *
 * Purpose: Card display, rendering, and UI updates
 * Created: Step 5 of 6-step database view refactoring project
 * Contains:
 *   - DatabaseViewDisplay class - Display management and coordination
 *   - Card rendering and display functions
 *   - UI state management and updates
 *   - Display optimization and performance
 *
 * ======================================== */

/**
 * Database View Display Component
 * Manages card display, rendering, and UI updates
 */
class DatabaseViewDisplay {
    constructor() {
        this.initialized = false;
        this.displayHandlers = new Map();
        this.displayStates = new Map();
        this.renderCache = new Map();

        // Bind methods to preserve context
        this.initialize = this.initialize.bind(this);
        this.updateDisplay = this.updateDisplay.bind(this);
        this.handleTabSwitch = this.handleTabSwitch.bind(this);
        this.handleFilterChange = this.handleFilterChange.bind(this);
    }

    /**
     * Initialize the display component
     */
    async initialize() {
        if (this.initialized) {
            console.log('Database view display already initialized');
            return;
        }

        console.log('Initializing database view display...');

        try {
            // Initialize display handlers
            this.initializeDisplayHandlers();

            // Initialize display states
            this.initializeDisplayStates();

            // Setup display event listeners
            this.setupDisplayEventListeners();

            this.initialized = true;
            console.log('Database view display initialized successfully');

        } catch (error) {
            console.error('Error initializing database view display:', error);
            throw error;
        }
    }

    /**
     * Initialize display handlers for different card types
     */
    initializeDisplayHandlers() {
        const displayHandlers = {
            'characters': {
                displayFunction: 'displayCharacters',
                containerId: 'characters-tbody',
                loadingId: 'characters-loading'
            },
            'special-cards': {
                displayFunction: 'displaySpecialCards',
                containerId: 'special-cards-tbody',
                loadingId: 'special-cards-loading'
            },
            'advanced-universe': {
                displayFunction: 'displayAdvancedUniverse',
                containerId: 'advanced-universe-tbody',
                loadingId: 'advanced-universe-loading'
            },
            'locations': {
                displayFunction: 'displayLocations',
                containerId: 'locations-tbody',
                loadingId: 'locations-loading'
            },
            'aspects': {
                displayFunction: 'displayAspects',
                containerId: 'aspects-tbody',
                loadingId: 'aspects-loading'
            },
            'missions': {
                displayFunction: 'displayMissions',
                containerId: 'missions-tbody',
                loadingId: 'missions-loading'
            },
            'events': {
                displayFunction: 'displayEvents',
                containerId: 'events-tbody',
                loadingId: 'events-loading'
            },
            'teamwork': {
                displayFunction: 'displayTeamwork',
                containerId: 'teamwork-tbody',
                loadingId: 'teamwork-loading'
            },
            'ally-universe': {
                displayFunction: 'displayAllyUniverse',
                containerId: 'ally-universe-tbody',
                loadingId: 'ally-universe-loading'
            },
            'training': {
                displayFunction: 'displayTraining',
                containerId: 'training-tbody',
                loadingId: 'training-loading'
            },
            'basic-universe': {
                displayFunction: 'displayBasicUniverse',
                containerId: 'basic-universe-tbody',
                loadingId: 'basic-universe-loading'
            },
            'power-cards': {
                displayFunction: 'displayPowerCards',
                containerId: 'power-cards-tbody',
                loadingId: 'power-cards-loading'
            },
        };

        this.displayHandlers = new Map(Object.entries(displayHandlers));
        console.log(`Initialized ${this.displayHandlers.size} display handlers`);
    }

    /**
     * Initialize display states
     */
    initializeDisplayStates() {
        this.displayHandlers.forEach((handler, dataType) => {
            this.displayStates.set(dataType, {
                loaded: false,
                lastUpdate: null,
                itemCount: 0,
                filteredCount: 0
            });
        });
    }

    /**
     * Setup display event listeners
     */
    setupDisplayEventListeners() {
        // Listen for tab switches
        document.addEventListener('databaseViewTabSwitched', this.handleTabSwitch);

        // Listen for filter changes
        document.addEventListener('databaseViewFilterChange', this.handleFilterChange);

        console.log('Database view display event listeners setup');
    }

    /**
     * Update display for a specific data type
     */
    updateDisplay(dataType, data) {
        if (!this.displayHandlers.has(dataType)) {
            console.warn(`No display handler for data type: ${dataType}`);
            return;
        }

        const handler = this.displayHandlers.get(dataType);
        const state = this.displayStates.get(dataType);

        try {
            // Show loading indicator
            this.showLoading(dataType);

            // Update display using the appropriate function
            if (window[handler.displayFunction]) {
                window[handler.displayFunction](data);
            }

            // Update state
            state.loaded = true;
            state.lastUpdate = new Date().toISOString();
            state.itemCount = Array.isArray(data) ? data.length : 0;

            // Hide loading indicator
            this.hideLoading(dataType);

            // Update statistics
            this.updateStatistics(dataType, data);

            console.log(`Display updated for ${dataType}: ${state.itemCount} items`);

        } catch (error) {
            console.error(`Error updating display for ${dataType}:`, error);
            this.hideLoading(dataType);
            this.showError(dataType, error.message);
        }
    }

    /**
     * Handle tab switch events
     */
    handleTabSwitch(event) {
        const tabName = event.detail?.tabName;
        if (!tabName) return;

        console.log(`Display component handling tab switch to: ${tabName}`);

        // Clear render cache for better performance
        this.clearRenderCache();
    }

    /**
     * Handle filter change events
     */
    handleFilterChange(filterType, filterData) {
        console.log(`Display component handling filter change for: ${filterType}`);

        // Update filtered count in state
        if (this.displayStates.has(filterType)) {
            const state = this.displayStates.get(filterType);
            state.filteredCount = filterData ? filterData.length : 0;
        }
    }

    /**
     * Show loading indicator
     */
    showLoading(dataType) {
        const handler = this.displayHandlers.get(dataType);
        if (!handler || !handler.loadingId) return;

        const loadingElement = document.getElementById(handler.loadingId);
        if (loadingElement) {
            loadingElement.style.display = 'block';
        }
    }

    /**
     * Hide loading indicator
     */
    hideLoading(dataType) {
        const handler = this.displayHandlers.get(dataType);
        if (!handler || !handler.loadingId) return;

        const loadingElement = document.getElementById(handler.loadingId);
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }

    /**
     * Show error message
     */
    showError(dataType, errorMessage) {
        const handler = this.displayHandlers.get(dataType);
        if (!handler || !handler.containerId) return;

        const container = document.getElementById(handler.containerId);
        if (container) {
            container.innerHTML = `<tr><td colspan="10" class="error">Error loading ${dataType}: ${errorMessage}</td></tr>`;
        }
    }

    /**
     * Update statistics
     */
    updateStatistics(dataType, data) {
        // Update item count in UI if statistics elements exist
        const statsElement = document.getElementById(`${dataType}-count`);
        if (statsElement && Array.isArray(data)) {
            statsElement.textContent = data.length;
        }
    }

    /**
     * Clear render cache
     */
    clearRenderCache() {
        this.renderCache.clear();
    }

    /**
     * Get display state for a data type
     */
    getDisplayState(dataType) {
        return this.displayStates.get(dataType);
    }

    /**
     * Get display handler for a data type
     */
    getDisplayHandler(dataType) {
        return this.displayHandlers.get(dataType);
    }

    /**
     * Check if data type is loaded
     */
    isDataTypeLoaded(dataType) {
        const state = this.displayStates.get(dataType);
        return state ? state.loaded : false;
    }

    /**
     * Get item count for a data type
     */
    getItemCount(dataType) {
        const state = this.displayStates.get(dataType);
        return state ? state.itemCount : 0;
    }

    /**
     * Get filtered count for a data type
     */
    getFilteredCount(dataType) {
        const state = this.displayStates.get(dataType);
        return state ? state.filteredCount : 0;
    }

    /**
     * Refresh display for a data type
     */
    async refreshDisplay(dataType) {
        if (!this.displayHandlers.has(dataType)) {
            console.warn(`No display handler for data type: ${dataType}`);
            return;
        }

        try {
            // Trigger data reload
            const handler = this.displayHandlers.get(dataType);
            if (handler.dataLoader && window[handler.dataLoader]) {
                await window[handler.dataLoader]();
            }
        } catch (error) {
            console.error(`Error refreshing display for ${dataType}:`, error);
        }
    }

    /**
     * Batch update multiple displays
     */
    async batchUpdateDisplay(updates) {
        const promises = updates.map(({ dataType, data }) => {
            return new Promise((resolve) => {
                this.updateDisplay(dataType, data);
                resolve();
            });
        });

        await Promise.all(promises);
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        // Remove event listeners
        document.removeEventListener('databaseViewTabSwitched', this.handleTabSwitch);
        document.removeEventListener('databaseViewFilterChange', this.handleFilterChange);

        // Clear handlers and states
        this.displayHandlers.clear();
        this.displayStates.clear();
        this.renderCache.clear();

        this.initialized = false;

        console.log('Database view display cleaned up');
    }
}

// Make globally available
window.DatabaseViewDisplay = DatabaseViewDisplay;
