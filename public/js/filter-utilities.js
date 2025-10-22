/* ========================================
 * FILTER UTILITIES
 * ========================================
 *
 * This file contains common filter utility functions and patterns
 * extracted as part of Step 4 of the database view refactoring project.
 *
 * Purpose: Common filter utilities and standardized patterns
 * Created: Step 4 of database view refactoring project
 * Contains:
 *   - Filter state management utilities
 *   - Common filter patterns and helpers
 *   - Standardized filter initialization
 *   - Filter persistence utilities
 *
 * ======================================== */

/**
 * Filter state management utilities
 */
class FilterStateManager {
    constructor() {
        this.filterStates = new Map();
        this.initialized = false;
    }

    /**
     * Initialize filter state for a specific tab/card type
     */
    initializeFilterState(tabId, defaultState = {}) {
        if (!this.filterStates.has(tabId)) {
            this.filterStates.set(tabId, {
                checkboxes: {},
                inputs: {},
                selects: {},
                ...defaultState
            });
        }
    }

    /**
     * Get filter state for a specific tab
     */
    getFilterState(tabId) {
        return this.filterStates.get(tabId) || {};
    }

    /**
     * Set filter state for a specific tab
     */
    setFilterState(tabId, state) {
        this.filterStates.set(tabId, { ...this.getFilterState(tabId), ...state });
    }

    /**
     * Clear all filter states
     */
    clearAllStates() {
        this.filterStates.clear();
    }

    /**
     * Mark as initialized
     */
    markInitialized() {
        this.initialized = true;
    }

    /**
     * Check if filters are initialized
     */
    isInitialized() {
        return this.initialized;
    }
}

// Global filter state manager instance
const filterStateManager = new FilterStateManager();

/**
 * Common filter utility functions
 */
class FilterUtilities {
    /**
     * Initialize checkboxes with default state
     */
    static initializeCheckboxes(containerSelector, defaultChecked = true) {
        const container = document.querySelector(containerSelector);
        if (!container) {
            console.warn(`Container not found: ${containerSelector}`);
            return;
        }

        const checkboxes = container.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = defaultChecked;
        });

        console.log(`Initialized ${checkboxes.length} checkboxes in ${containerSelector}`);
    }

    /**
     * Get selected checkbox values
     */
    static getSelectedCheckboxValues(containerSelector) {
        const container = document.querySelector(containerSelector);
        if (!container) return [];

        return Array.from(container.querySelectorAll('input[type="checkbox"]:checked'))
            .map(cb => cb.value);
    }

    /**
     * Get numeric filter values
     */
    static getNumericFilterValues(minSelector, maxSelector) {
        const minElement = document.querySelector(minSelector);
        const maxElement = document.querySelector(maxSelector);

        return {
            min: minElement ? parseInt(minElement.value) || null : null,
            max: maxElement ? parseInt(maxElement.value) || null : null
        };
    }

    /**
     * Apply numeric filter to data
     */
    static applyNumericFilter(data, field, min, max) {
        return data.filter(item => {
            const value = item[field];
            if (value === null || value === undefined) return false;

            if (min !== null && value < min) return false;
            if (max !== null && value > max) return false;

            return true;
        });
    }

    /**
     * Apply checkbox filter to data
     */
    static applyCheckboxFilter(data, field, selectedValues) {
        if (selectedValues.length === 0) return data;
        return data.filter(item => selectedValues.includes(item[field]));
    }

    /**
     * Apply text search filter to data
     */
    static applyTextSearchFilter(data, searchTerm, fields) {
        if (!searchTerm || searchTerm.length === 0) return data;

        const term = searchTerm.toLowerCase();
        return data.filter(item => {
            return fields.some(field => {
                const value = item[field];
                return value && String(value).toLowerCase().includes(term);
            });
        });
    }

    /**
     * Clear all filters in a container
     */
    static clearFilters(containerSelector) {
        const container = document.querySelector(containerSelector);
        if (!container) return;

        // Clear checkboxes
        const checkboxes = container.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = true; // Default to checked
        });

        // Clear text inputs
        const textInputs = container.querySelectorAll('input[type="text"], input[type="number"]');
        textInputs.forEach(input => {
            input.value = '';
        });

        // Clear selects
        const selects = container.querySelectorAll('select');
        selects.forEach(select => {
            select.selectedIndex = 0;
        });
    }

    /**
     * Setup event listeners for filter elements
     */
    static setupFilterEventListeners(containerSelector, callback) {
        const container = document.querySelector(containerSelector);
        if (!container) return;

        // Setup checkbox listeners
        const checkboxes = container.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', callback);
        });

        // Setup input listeners
        const inputs = container.querySelectorAll('input[type="text"], input[type="number"]');
        inputs.forEach(input => {
            input.addEventListener('input', callback);
        });

        // Setup select listeners
        const selects = container.querySelectorAll('select');
        selects.forEach(select => {
            select.addEventListener('change', callback);
        });
    }

    /**
     * Debounce function for performance
     */
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

/**
 * Standardized filter patterns for different card types
 */
class FilterPatterns {
    /**
     * Basic universe filter pattern
     */
    static async applyBasicUniverseFilters() {
        try {
            // Use cached data if available, otherwise fetch from API
            let data;
            if (window.basicUniverseData) {
                data = window.basicUniverseData;
            } else {
                const response = await fetch('/api/basic-universe');
                data = await response.json();
                if (!data.success) return;
                // Cache the data for future use
                window.basicUniverseData = data;
            }

            let filtered = data.data;

            // Apply type filter - get selected types directly from DOM
            const selectedTypes = Array.from(document.querySelectorAll('#basic-universe-tab input[type="checkbox"]:checked'))
                .map(cb => cb.value);
            console.log('Selected types for filtering:', selectedTypes);
            if (selectedTypes.length > 0) {
                filtered = filtered.filter(item => selectedTypes.includes(item.type));
                console.log('Filtered cards count:', filtered.length);
            }

            // Apply value to use filter
            const valueFilter = FilterUtilities.getNumericFilterValues('#basic-universe-value-min', '#basic-universe-value-max');
            filtered = FilterUtilities.applyNumericFilter(filtered, 'value_to_use', valueFilter.min, valueFilter.max);

            // Apply bonus filter
            const bonusFilter = FilterUtilities.getNumericFilterValues('#basic-universe-bonus-min', '#basic-universe-bonus-max');
            filtered = FilterUtilities.applyNumericFilter(filtered, 'bonus', bonusFilter.min, bonusFilter.max);

            // Display results
            if (window.displayBasicUniverse) {
                window.displayBasicUniverse(filtered);
            }
        } catch (error) {
            console.error('Error applying basic universe filters:', error);
        }
    }

    /**
     * Mission filter pattern
     */
    static applyMissionFilters() {
        const selectedMissionSets = FilterUtilities.getSelectedCheckboxValues('#missions-tab input[type="checkbox"]');

        if (selectedMissionSets.length === 0) {
            const tbody = document.getElementById('missions-tbody');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="3" class="no-results">No mission sets selected</td></tr>';
            }
            return;
        }

        const missions = window.missionsData || [];
        const filtered = FilterUtilities.applyCheckboxFilter(missions, 'mission_set', selectedMissionSets);

        if (window.displayMissions) {
            window.displayMissions(filtered);
        }
    }

    /**
     * Event filter pattern
     */
    static applyEventFilters() {
        const selectedMissionSets = FilterUtilities.getSelectedCheckboxValues('#events-tab input[type="checkbox"]');

        if (selectedMissionSets.length === 0) {
            const tbody = document.getElementById('events-tbody');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="5" class="no-results">No mission sets selected</td></tr>';
            }
            return;
        }

        const events = window.eventsData || [];
        const filtered = FilterUtilities.applyCheckboxFilter(events, 'mission_set', selectedMissionSets);

        if (window.displayEvents) {
            window.displayEvents(filtered);
        }
    }
}

/**
 * Filter initialization utilities
 */
class FilterInitialization {
    /**
     * Initialize all filters for database view
     */
    static initializeDatabaseViewFilters() {
        console.log('Initializing database view filters...');

        // Initialize basic universe filters
        this.initializeBasicUniverseFilters();

        // Initialize mission filters
        this.initializeMissionFilters();

        // Initialize event filters
        this.initializeEventFilters();

        // Mark as initialized
        filterStateManager.markInitialized();

        console.log('Database view filters initialized successfully');
    }

    /**
     * Initialize basic universe filters
     */
    static initializeBasicUniverseFilters() {
        const tabId = 'basic-universe';

        // Initialize filter state
        filterStateManager.initializeFilterState(tabId, {
            checkboxes: { defaultChecked: true }
        });

        // Initialize checkboxes to checked by default
        FilterUtilities.initializeCheckboxes('#basic-universe-tab', true);

        // Setup event listeners
        FilterUtilities.setupFilterEventListeners('#basic-universe-tab',
            FilterUtilities.debounce(FilterPatterns.applyBasicUniverseFilters, 300)
        );

        console.log('Basic universe filters initialized');
    }

    /**
     * Initialize mission filters
     */
    static initializeMissionFilters() {
        const tabId = 'missions';

        // Initialize filter state
        filterStateManager.initializeFilterState(tabId, {
            checkboxes: { defaultChecked: true }
        });

        // Initialize checkboxes to checked by default
        FilterUtilities.initializeCheckboxes('#missions-tab', true);

        // Setup event listeners
        FilterUtilities.setupFilterEventListeners('#missions-tab', FilterPatterns.applyMissionFilters);

        console.log('Mission filters initialized');
    }

    /**
     * Initialize event filters
     */
    static initializeEventFilters() {
        const tabId = 'events';

        // Initialize filter state
        filterStateManager.initializeFilterState(tabId, {
            checkboxes: { defaultChecked: true }
        });

        // Initialize checkboxes to checked by default
        FilterUtilities.initializeCheckboxes('#events-tab', true);

        // Setup event listeners
        FilterUtilities.setupFilterEventListeners('#events-tab', FilterPatterns.applyEventFilters);

        console.log('Event filters initialized');
    }

    /**
     * Re-initialize filters when tab is switched
     */
    static reinitializeFiltersForTab(tabName) {
        console.log(`Re-initializing filters for tab: ${tabName}`);

        switch (tabName) {
            case 'basic-universe':
                this.initializeBasicUniverseFilters();
                break;
            case 'missions':
                this.initializeMissionFilters();
                break;
            case 'events':
                this.initializeEventFilters();
                break;
            default:
                console.log(`No specific filter initialization for tab: ${tabName}`);
        }
    }
}

// Make classes globally available
window.FilterStateManager = FilterStateManager;
window.FilterUtilities = FilterUtilities;
window.FilterPatterns = FilterPatterns;
window.FilterInitialization = FilterInitialization;
window.filterStateManager = filterStateManager;
