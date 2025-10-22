/* ========================================
 * DATA LOADING CORE COMPONENT
 * ========================================
 *
 * This file contains the core data loading functionality
 * organized as part of Step 5 of the database view refactoring project.
 *
 * Purpose: Core data loading coordination and management
 * Created: Step 5 of 6-step database view refactoring project
 * Contains:
 *   - DataLoadingCore class - Core data loading coordination
 *   - Data loading orchestration and error handling
 *   - Loading state management and progress tracking
 *   - Data caching and optimization
 *
 * ======================================== */

// Global variable for filter clearing state
let isClearingFilters = false;

/**
 * Data Loading Core Component
 * Coordinates all data loading operations for the database view
 */
class DataLoadingCore {
    constructor() {
        this.initialized = false;
        this.loadingStates = new Map();
        this.dataCache = new Map();
        this.loadingPromises = new Map();
        this.loadingHandlers = new Map();

        // Bind methods to preserve context
        this.initialize = this.initialize.bind(this);
        this.loadAllData = this.loadAllData.bind(this);
        this.loadData = this.loadData.bind(this);
        this.handleDataLoad = this.handleDataLoad.bind(this);
    }

    /**
     * Initialize the data loading core
     */
    async initialize() {
        if (this.initialized) {
            console.log('Data loading core already initialized');
            return;
        }

        console.log('Initializing data loading core...');

        try {
            // Initialize loading handlers
            this.initializeLoadingHandlers();

            // Initialize loading states
            this.initializeLoadingStates();

            // Setup data loading event listeners
            this.setupDataLoadingEventListeners();

            this.initialized = true;
            console.log('Data loading core initialized successfully');

        } catch (error) {
            console.error('Error initializing data loading core:', error);
            throw error;
        }
    }

    /**
     * Initialize loading handlers for different data types
     */
    initializeLoadingHandlers() {
        const loadingHandlers = {
            'characters': {
                loadFunction: 'loadCharacters',
                cacheKey: 'characters',
                priority: 1
            },
            'special-cards': {
                loadFunction: 'loadSpecialCards',
                cacheKey: 'special-cards',
                priority: 2
            },
            'advanced-universe': {
                loadFunction: 'loadAdvancedUniverse',
                cacheKey: 'advanced-universe',
                priority: 3
            },
            'locations': {
                loadFunction: 'loadLocations',
                cacheKey: 'locations',
                priority: 4
            },
            'aspects': {
                loadFunction: 'loadAspects',
                cacheKey: 'aspects',
                priority: 5
            },
            'missions': {
                loadFunction: 'loadMissions',
                cacheKey: 'missions',
                priority: 6
            },
            'events': {
                loadFunction: 'loadEvents',
                cacheKey: 'events',
                priority: 7
            },
            'teamwork': {
                loadFunction: 'loadTeamwork',
                cacheKey: 'teamwork',
                priority: 8
            },
            'ally-universe': {
                loadFunction: 'loadAllyUniverse',
                cacheKey: 'ally-universe',
                priority: 9
            },
            'training': {
                loadFunction: 'loadTraining',
                cacheKey: 'training',
                priority: 10
            },
            'basic-universe': {
                loadFunction: 'loadBasicUniverse',
                cacheKey: 'basic-universe',
                priority: 11
            },
            'power-cards': {
                loadFunction: 'loadPowerCards',
                cacheKey: 'power-cards',
                priority: 12
            },
            'user-decks': {
                loadFunction: 'loadUserDecks',
                cacheKey: 'user-decks',
                priority: 13
            }
        };

        this.loadingHandlers = new Map(Object.entries(loadingHandlers));
        console.log(`Initialized ${this.loadingHandlers.size} loading handlers`);
    }

    /**
     * Initialize loading states
     */
    initializeLoadingStates() {
        this.loadingHandlers.forEach((handler, dataType) => {
            this.loadingStates.set(dataType, {
                loading: false,
                loaded: false,
                error: null,
                lastLoad: null,
                retryCount: 0
            });
        });
    }

    /**
     * Setup data loading event listeners
     */
    setupDataLoadingEventListeners() {
        // Listen for data load requests
        document.addEventListener('dataLoadRequest', this.handleDataLoad);

        console.log('Data loading core event listeners setup');
    }

    /**
     * Load all data for the database view
     */
    async loadAllData(forceReload = false) {
        console.log('Loading all database view data...');

        try {
            // Clear all filters globally before loading data
            this.clearAllFiltersGlobally();

            // Get loading handlers sorted by priority
            const sortedHandlers = Array.from(this.loadingHandlers.entries())
                .sort(([, a], [, b]) => a.priority - b.priority);

            // Load data in parallel for better performance
            const loadPromises = sortedHandlers.map(([dataType, handler]) => {
                return this.loadData(dataType, forceReload);
            });

            // Wait for all data to load
            await Promise.all(loadPromises);

            // Update statistics after all data is loaded
            this.updateStatistics();

            console.log('All database view data loaded successfully');

        } catch (error) {
            console.error('Error loading all database view data:', error);
            throw error;
        }
    }

    /**
     * Load data for a specific type
     */
    async loadData(dataType, forceReload = false) {
        const handler = this.loadingHandlers.get(dataType);
        if (!handler) {
            console.warn(`No loading handler for data type: ${dataType}`);
            return;
        }

        const state = this.loadingStates.get(dataType);
        if (!state) {
            console.warn(`No loading state for data type: ${dataType}`);
            return;
        }

        // Check if already loading
        if (state.loading) {
            console.log(`Data type ${dataType} is already loading`);
            return this.loadingPromises.get(dataType);
        }

        // Check if already loaded and not forcing reload
        if (state.loaded && !forceReload && this.dataCache.has(handler.cacheKey)) {
            console.log(`Data type ${dataType} already loaded, using cache`);
            return this.dataCache.get(handler.cacheKey);
        }

        try {
            // Set loading state
            state.loading = true;
            state.error = null;

            console.log(`Loading data for ${dataType}...`);

            // Create loading promise
            const loadPromise = this.executeDataLoad(dataType, handler);
            this.loadingPromises.set(dataType, loadPromise);

            // Execute the load
            const data = await loadPromise;

            // Update state
            state.loading = false;
            state.loaded = true;
            state.lastLoad = new Date().toISOString();
            state.retryCount = 0;

            // Cache the data
            this.dataCache.set(handler.cacheKey, data);

            // Notify other components
            this.notifyDataLoaded(dataType, data);

            console.log(`Data loaded successfully for ${dataType}: ${Array.isArray(data) ? data.length : 'N/A'} items`);

            return data;

        } catch (error) {
            // Update error state
            state.loading = false;
            state.error = error.message;
            state.retryCount++;

            console.error(`Error loading data for ${dataType}:`, error);

            // Notify other components of error
            this.notifyDataLoadError(dataType, error);

            throw error;
        } finally {
            // Clean up loading promise
            this.loadingPromises.delete(dataType);
        }
    }

    /**
     * Execute data load for a specific type
     */
    async executeDataLoad(dataType, handler) {
        if (!window[handler.loadFunction]) {
            throw new Error(`Load function not found: ${handler.loadFunction}`);
        }

        // Execute the load function
        const result = await window[handler.loadFunction]();

        // Return the result (could be data or undefined for side-effect functions)
        return result;
    }

    /**
     * Handle data load requests from other components
     */
    handleDataLoad(event) {
        const dataType = event.detail?.dataType;
        const forceReload = event.detail?.forceReload || false;

        if (dataType) {
            this.loadData(dataType, forceReload);
        }
    }

    /**
     * Clear all filters globally
     */
    clearAllFiltersGlobally() {
        if (window.clearAllFiltersGlobally) {
            window.clearAllFiltersGlobally();
        }
    }

    /**
     * Update statistics after data loading
     */
    updateStatistics() {
        // Update statistics display if available
        if (window.updateAllStatistics) {
            window.updateAllStatistics();
        }
    }

    /**
     * Notify other components that data has been loaded
     */
    notifyDataLoaded(dataType, data) {
        const event = new CustomEvent('databaseViewDataLoad', {
            detail: { dataType, data, timestamp: new Date().toISOString() }
        });
        document.dispatchEvent(event);
    }

    /**
     * Notify other components of data load error
     */
    notifyDataLoadError(dataType, error) {
        const event = new CustomEvent('databaseViewDataLoadError', {
            detail: { dataType, error: error.message, timestamp: new Date().toISOString() }
        });
        document.dispatchEvent(event);
    }

    /**
     * Get loading state for a data type
     */
    getLoadingState(dataType) {
        return this.loadingStates.get(dataType);
    }

    /**
     * Get cached data for a data type
     */
    getCachedData(dataType) {
        const handler = this.loadingHandlers.get(dataType);
        if (handler) {
            return this.dataCache.get(handler.cacheKey);
        }
        return null;
    }

    /**
     * Check if data type is loaded
     */
    isDataTypeLoaded(dataType) {
        const state = this.loadingStates.get(dataType);
        return state ? state.loaded : false;
    }

    /**
     * Check if data type is loading
     */
    isDataTypeLoading(dataType) {
        const state = this.loadingStates.get(dataType);
        return state ? state.loading : false;
    }

    /**
     * Get error for a data type
     */
    getDataTypeError(dataType) {
        const state = this.loadingStates.get(dataType);
        return state ? state.error : null;
    }

    /**
     * Clear cache for a data type
     */
    clearCache(dataType) {
        const handler = this.loadingHandlers.get(dataType);
        if (handler) {
            this.dataCache.delete(handler.cacheKey);
        }
    }

    /**
     * Clear all caches
     */
    clearAllCaches() {
        this.dataCache.clear();
    }

    /**
     * Retry loading for a data type
     */
    async retryLoad(dataType) {
        const state = this.loadingStates.get(dataType);
        if (state && state.retryCount < 3) {
            console.log(`Retrying load for ${dataType} (attempt ${state.retryCount + 1})`);
            return this.loadData(dataType, true);
        }
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        // Remove event listeners
        document.removeEventListener('dataLoadRequest', this.handleDataLoad);

        // Clear loading promises
        this.loadingPromises.clear();

        // Clear handlers, states, and cache
        this.loadingHandlers.clear();
        this.loadingStates.clear();
        this.dataCache.clear();

        this.initialized = false;

        console.log('Data loading core cleaned up');
    }
}

// Make globally available
window.DataLoadingCore = DataLoadingCore;
