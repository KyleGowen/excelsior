/* ========================================
 * DATABASE VIEW CORE COMPONENT
 * ========================================
 *
 * This file contains the core database view functionality
 * organized as part of Step 5 of the database view refactoring project.
 *
 * Purpose: Core database view initialization and coordination
 * Created: Step 5 of 6-step database view refactoring project
 * Contains:
 *   - DatabaseViewCore class - Main database view controller
 *   - Core initialization and lifecycle management
 *   - Component coordination and event handling
 *
 * ======================================== */

/**
 * Core Database View Component
 * Main controller for the database view functionality
 */
class DatabaseViewCore {
    constructor() {
        this.initialized = false;
        this.currentTab = null;
        this.components = new Map();
        this.eventListeners = new Map();

        // Bind methods to preserve context
        this.initialize = this.initialize.bind(this);
        this.handleTabSwitch = this.handleTabSwitch.bind(this);
        this.handleDataLoad = this.handleDataLoad.bind(this);
    }

    /**
     * Initialize the database view core
     */
    async initialize() {
        if (this.initialized) {
            console.log('Database view core already initialized');
            return;
        }

        console.log('Initializing database view core...');

        try {
            // Initialize components
            await this.initializeComponents();

            // Setup event listeners
            this.setupEventListeners();

            // Initialize filter system
            await this.initializeFilterSystem();

            // Load initial data
            await this.loadInitialData();

            this.initialized = true;
            console.log('Database view core initialized successfully');

        } catch (error) {
            console.error('Error initializing database view core:', error);
            throw error;
        }
    }

    /**
     * Initialize all database view components
     */
    async initializeComponents() {
        // Initialize tab manager
        if (window.DatabaseViewTabs) {
            this.components.set('tabs', new window.DatabaseViewTabs());
            await this.components.get('tabs').initialize();
        }

        // Initialize search manager
        if (window.DatabaseViewSearch) {
            this.components.set('search', new window.DatabaseViewSearch());
            await this.components.get('search').initialize();
        }

        // Initialize display manager
        if (window.DatabaseViewDisplay) {
            this.components.set('display', new window.DatabaseViewDisplay());
            await this.components.get('display').initialize();
        }

        // Initialize data loading manager
        if (window.DataLoadingCore) {
            this.components.set('dataLoading', new window.DataLoadingCore());
            await this.components.get('dataLoading').initialize();
        }

        console.log(`Initialized ${this.components.size} database view components`);
    }

    /**
     * Setup event listeners for component coordination
     */
    setupEventListeners() {
        // Listen for tab switches
        document.addEventListener('databaseViewTabSwitch', this.handleTabSwitch);

        // Listen for data load events
        document.addEventListener('databaseViewDataLoad', this.handleDataLoad);

        // Listen for filter changes
        document.addEventListener('databaseViewFilterChange', this.handleFilterChange);

        console.log('Database view core event listeners setup');
    }

    /**
     * Initialize the filter system
     */
    async initializeFilterSystem() {
        if (window.filterManager) {
            await window.filterManager.initialize();
        }
    }

    /**
     * Load initial data for the database view
     */
    async loadInitialData() {
        const dataLoading = this.components.get('dataLoading');
        if (dataLoading) {
            await dataLoading.loadAllData();
        }
    }

    /**
     * Handle tab switch events
     */
    handleTabSwitch(event) {
        const tabName = event.detail?.tabName;
        if (!tabName) return;

        console.log(`Database view core handling tab switch to: ${tabName}`);
        this.currentTab = tabName;

        // Notify components of tab switch
        this.components.forEach((component, name) => {
            if (component.handleTabSwitch) {
                component.handleTabSwitch(tabName);
            }
        });
    }

    /**
     * Handle data load events
     */
    handleDataLoad(event) {
        const dataType = event.detail?.dataType;
        const data = event.detail?.data;

        if (!dataType || !data) return;

        console.log(`Database view core handling data load for: ${dataType}`);

        // Notify display component to update
        const display = this.components.get('display');
        if (display && display.updateDisplay) {
            display.updateDisplay(dataType, data);
        }
    }

    /**
     * Handle filter change events
     */
    handleFilterChange(event) {
        const filterType = event.detail?.filterType;
        const filterData = event.detail?.filterData;

        if (!filterType) return;

        console.log(`Database view core handling filter change for: ${filterType}`);

        // Notify components of filter change
        this.components.forEach((component, name) => {
            if (component.handleFilterChange) {
                component.handleFilterChange(filterType, filterData);
            }
        });
    }

    /**
     * Get a component by name
     */
    getComponent(name) {
        return this.components.get(name);
    }

    /**
     * Get current tab
     */
    getCurrentTab() {
        return this.currentTab;
    }

    /**
     * Check if core is initialized
     */
    isInitialized() {
        return this.initialized;
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        // Remove event listeners
        document.removeEventListener('databaseViewTabSwitch', this.handleTabSwitch);
        document.removeEventListener('databaseViewDataLoad', this.handleDataLoad);
        document.removeEventListener('databaseViewFilterChange', this.handleFilterChange);

        // Cleanup components
        this.components.forEach((component, name) => {
            if (component.cleanup) {
                component.cleanup();
            }
        });

        this.components.clear();
        this.initialized = false;

        console.log('Database view core cleaned up');
    }
}

// Create global instance
const databaseViewCore = new DatabaseViewCore();

// Make globally available
window.DatabaseViewCore = DatabaseViewCore;
window.databaseViewCore = databaseViewCore;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        databaseViewCore.initialize();
    });
} else {
    databaseViewCore.initialize();
}
