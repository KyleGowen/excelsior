/* ========================================
 * DATABASE VIEW TABS COMPONENT
 * ========================================
 *
 * This file contains the tab management functionality
 * organized as part of Step 5 of the database view refactoring project.
 *
 * Purpose: Tab switching, visibility, and management
 * Created: Step 5 of 6-step database view refactoring project
 * Contains:
 *   - DatabaseViewTabs class - Tab management and switching
 *   - Tab visibility and state management
 *   - Search placeholder management
 *   - Tab-specific data loading coordination
 *
 * ======================================== */

/**
 * Database View Tabs Component
 * Manages tab switching, visibility, and state
 */
class DatabaseViewTabs {
    constructor() {
        this.initialized = false;
        this.currentTab = null;
        this.tabStates = new Map();
        this.tabConfigs = new Map();

        // Bind methods to preserve context
        this.initialize = this.initialize.bind(this);
        this.switchTab = this.switchTab.bind(this);
        this.handleTabSwitch = this.handleTabSwitch.bind(this);
    }

    /**
     * Initialize the tabs component
     */
    async initialize() {
        if (this.initialized) {
            console.log('Database view tabs already initialized');
            return;
        }

        console.log('Initializing database view tabs...');

        try {
            // Initialize tab configurations
            this.initializeTabConfigs();

            // Setup tab event listeners
            this.setupTabEventListeners();

            // Initialize tab states
            this.initializeTabStates();

            this.initialized = true;
            console.log('Database view tabs initialized successfully');

        } catch (error) {
            console.error('Error initializing database view tabs:', error);
            throw error;
        }
    }

    /**
     * Initialize tab configurations
     */
    initializeTabConfigs() {
        const tabConfigs = {
            'characters': {
                hasSearch: false,
                searchPlaceholder: '',
                dataLoader: 'loadCharacters',
                searchSetup: 'setupSearch'
            },
            'special-cards': {
                hasSearch: true,
                searchPlaceholder: 'Search special cards by name, character, or effect...',
                dataLoader: 'loadSpecialCards',
                searchSetup: 'setupSpecialCardSearch'
            },
            'advanced-universe': {
                hasSearch: true,
                searchPlaceholder: 'Search advanced universe by name, character, or effect...',
                dataLoader: 'loadAdvancedUniverse',
                searchSetup: 'setupAdvancedUniverseSearch'
            },
            'locations': {
                hasSearch: true,
                searchPlaceholder: 'Search locations by name or abilities...',
                dataLoader: 'loadLocations',
                searchSetup: 'setupLocationSearch'
            },
            'aspects': {
                hasSearch: true,
                searchPlaceholder: 'Search aspects by name, type, or effect...',
                dataLoader: 'loadAspects',
                searchSetup: 'setupAspectSearch'
            },
            'missions': {
                hasSearch: true,
                searchPlaceholder: 'Search missions by name or mission set...',
                dataLoader: 'loadMissions',
                searchSetup: 'setupMissionSearch'
            },
            'events': {
                hasSearch: true,
                searchPlaceholder: 'Search events by name, mission set, or effect...',
                dataLoader: 'loadEvents',
                searchSetup: 'setupEventSearch'
            },
            'teamwork': {
                hasSearch: true,
                searchPlaceholder: 'Search teamwork by requirements or effects...',
                dataLoader: 'loadTeamwork',
                searchSetup: 'setupTeamworkSearch'
            },
            'ally-universe': {
                hasSearch: true,
                searchPlaceholder: 'Search allies by name, stat, or text...',
                dataLoader: 'loadAllyUniverse',
                searchSetup: 'setupAllyUniverseSearch'
            },
            'training': {
                hasSearch: true,
                searchPlaceholder: 'Search training by name or types...',
                dataLoader: 'loadTraining',
                searchSetup: 'setupTrainingSearch'
            },
            'basic-universe': {
                hasSearch: true,
                searchPlaceholder: 'Search basic universe by name, type, or bonus...',
                dataLoader: 'loadBasicUniverse',
                searchSetup: 'setupBasicUniverseSearch'
            },
            'power-cards': {
                hasSearch: true,
                searchPlaceholder: 'Search power cards by type or value...',
                dataLoader: 'loadPowerCards',
                searchSetup: 'setupPowerCardsSearch'
            }
        };

        this.tabConfigs = new Map(Object.entries(tabConfigs));
        console.log(`Initialized ${this.tabConfigs.size} tab configurations`);
    }

    /**
     * Setup tab event listeners
     */
    setupTabEventListeners() {
        // Listen for tab switch requests
        document.addEventListener('databaseViewTabSwitch', this.handleTabSwitch);

        console.log('Database view tabs event listeners setup');
    }

    /**
     * Initialize tab states
     */
    initializeTabStates() {
        // Initialize all tabs as hidden
        this.tabConfigs.forEach((config, tabName) => {
            this.tabStates.set(tabName, {
                visible: false,
                active: false,
                dataLoaded: false
            });
        });
    }

    /**
     * Switch to a specific tab
     */
    async switchTab(tabName) {
        if (!this.tabConfigs.has(tabName)) {
            console.warn(`Unknown tab: ${tabName}`);
            return;
        }

        console.log(`Switching to tab: ${tabName}`);

        try {
            // Clear all filters when switching tabs
            this.clearAllFilters();

            // Hide all tabs
            this.hideAllTabs();

            // Remove active class from all buttons
            this.removeActiveFromAllButtons();

            // Show selected tab
            this.showTab(tabName);

            // Update search container
            this.updateSearchContainer(tabName);

            // Add active class to selected button
            this.activateTabButton(tabName);

            // Update current tab
            this.currentTab = tabName;

            // Load tab-specific data
            await this.loadTabData(tabName);

            // Setup tab-specific search
            this.setupTabSearch(tabName);

            // Disable "Add to Deck" buttons for guest users
            this.disableAddToDeckButtons();

            // Notify other components
            this.notifyTabSwitch(tabName);

            console.log(`Successfully switched to tab: ${tabName}`);

        } catch (error) {
            console.error(`Error switching to tab ${tabName}:`, error);
            throw error;
        }
    }

    /**
     * Handle tab switch events from other components
     */
    handleTabSwitch(event) {
        const tabName = event.detail?.tabName;
        if (tabName) {
            this.switchTab(tabName);
        }
    }

    /**
     * Clear all filters globally
     */
    clearAllFilters() {
        if (window.clearAllFiltersGlobally) {
            window.clearAllFiltersGlobally();
        }
    }

    /**
     * Hide all tabs
     */
    hideAllTabs() {
        this.tabConfigs.forEach((config, tabName) => {
            const tabElement = document.getElementById(`${tabName}-tab`);
            if (tabElement) {
                tabElement.style.display = 'none';
                this.tabStates.get(tabName).visible = false;
            }
        });
    }

    /**
     * Remove active class from all tab buttons
     */
    removeActiveFromAllButtons() {
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
    }

    /**
     * Show a specific tab
     */
    showTab(tabName) {
        const tabElement = document.getElementById(`${tabName}-tab`);
        if (tabElement) {
            tabElement.style.display = 'block';
            this.tabStates.get(tabName).visible = true;
        } else {
            console.warn(`Tab element not found: ${tabName}-tab`);
        }
    }

    /**
     * Update search container visibility and placeholder
     */
    updateSearchContainer(tabName) {
        const searchContainer = document.getElementById('search-container');
        const searchInput = document.getElementById('search-input');
        const config = this.tabConfigs.get(tabName);

        if (!searchContainer || !searchInput || !config) return;

        if (config.hasSearch) {
            searchContainer.style.display = 'block';
            searchInput.placeholder = config.searchPlaceholder;
        } else {
            searchContainer.style.display = 'none';
        }
    }

    /**
     * Activate tab button
     */
    activateTabButton(tabName) {
        const selectedButton = document.querySelector(`[onclick="switchTab('${tabName}')"]`);
        if (selectedButton) {
            selectedButton.classList.add('active');
            this.tabStates.get(tabName).active = true;
        } else {
            console.warn(`Tab button not found for: ${tabName}`);
        }
    }

    /**
     * Load tab-specific data
     */
    async loadTabData(tabName) {
        const config = this.tabConfigs.get(tabName);
        if (!config || !config.dataLoader) return;

        try {
            if (window[config.dataLoader]) {
                await window[config.dataLoader]();
                this.tabStates.get(tabName).dataLoaded = true;
            }
        } catch (error) {
            console.error(`Error loading data for tab ${tabName}:`, error);
        }
    }

    /**
     * Setup tab-specific search
     */
    setupTabSearch(tabName) {
        const config = this.tabConfigs.get(tabName);
        if (!config || !config.searchSetup) return;

        try {
            if (window[config.searchSetup]) {
                window[config.searchSetup]();
            }
        } catch (error) {
            console.error(`Error setting up search for tab ${tabName}:`, error);
        }
    }

    /**
     * Disable "Add to Deck" buttons for guest users
     */
    disableAddToDeckButtons() {
        if (window.disableAddToDeckButtonsImmediate) {
            window.disableAddToDeckButtonsImmediate();
        }
    }

    /**
     * Notify other components of tab switch
     */
    notifyTabSwitch(tabName) {
        // Notify filter manager
        if (window.filterManager) {
            window.filterManager.handleTabSwitch({ detail: { tabName } });
        }

        // Dispatch custom event
        const event = new CustomEvent('databaseViewTabSwitched', {
            detail: { tabName, timestamp: new Date().toISOString() }
        });
        document.dispatchEvent(event);
    }

    /**
     * Get current tab
     */
    getCurrentTab() {
        return this.currentTab;
    }

    /**
     * Get tab state
     */
    getTabState(tabName) {
        return this.tabStates.get(tabName);
    }

    /**
     * Get tab configuration
     */
    getTabConfig(tabName) {
        return this.tabConfigs.get(tabName);
    }

    /**
     * Check if tab is visible
     */
    isTabVisible(tabName) {
        const state = this.tabStates.get(tabName);
        return state ? state.visible : false;
    }

    /**
     * Check if tab is active
     */
    isTabActive(tabName) {
        const state = this.tabStates.get(tabName);
        return state ? state.active : false;
    }

    /**
     * Check if tab data is loaded
     */
    isTabDataLoaded(tabName) {
        const state = this.tabStates.get(tabName);
        return state ? state.dataLoaded : false;
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        // Remove event listeners
        document.removeEventListener('databaseViewTabSwitch', this.handleTabSwitch);

        // Clear states and configs
        this.tabStates.clear();
        this.tabConfigs.clear();

        this.initialized = false;
        this.currentTab = null;

        console.log('Database view tabs cleaned up');
    }
}

// Make globally available
window.DatabaseViewTabs = DatabaseViewTabs;
