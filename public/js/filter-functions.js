/* ========================================
 * PHASE 11C & 12: FILTER FUNCTIONS
 * ========================================
 * 
 * This file contains filter-related functions and utilities extracted from
 * index.html during Phase 11C and 12 of the refactoring project.
 * 
 * Purpose: Filter-related functions and utilities
 * Created: Phase 11C & 12 of 12-phase refactoring project
 * Contains:
 *   - isGuestUser() - Guest user detection
 *   - clearLocationFilters() - Location filter clearing
 *   - clearSpecialCardFilters() - Special card filter clearing
 *   - clearAdvancedUniverseFilters() - Advanced universe filter clearing
 *   - clearAspectsFilters() - Aspects filter clearing
 *   - clearMissionsFilters() - Missions filter clearing
 *   - clearEventsFilters() - Events filter clearing
 *   - clearTeamworkFilters() - Teamwork filter clearing
 *   - clearAllyUniverseFilters() - Ally universe filter clearing
 *   - clearTrainingFilters() - Training filter clearing
 *   - clearBasicUniverseFilters() - Basic universe filter clearing
 *   - clearPowerCardFilters() - Power card filter clearing
 *   - toggleFortificationsColumn() - Fortifications column toggle
 *   - ensureTwoPaneLayout() - Two-pane layout enforcement
 *   - updateDeckStats() - Deck statistics updates
 *   - toggleCategory() - Category toggle functionality
 * 
 * ======================================== */

// User utility functions
function isGuestUser() {
    const currentUser = getCurrentUser();
    const isGuest = currentUser && currentUser.role === 'GUEST';
    return isGuest;
}

// Clear filter functions for different card types
function clearLocationFilters() {
    // Clear location-specific filters
    const locationThreatMin = document.getElementById('location-threat-min');
    const locationThreatMax = document.getElementById('location-threat-max');
    
    if (locationThreatMin) locationThreatMin.value = '';
    if (locationThreatMax) locationThreatMax.value = '';
    
    // Clear location special ability search input
    const abilitySearchInput = document.querySelector('#locations-table .header-filter[data-column="special_ability"]');
    if (abilitySearchInput) {
        abilitySearchInput.value = '';
    }
    
    // Reload all locations
    if (typeof loadLocations === 'function') {
        loadLocations();
    }
}

function clearSpecialCardFilters() {
    // Clear special card search inputs
    const nameSearchInput = document.querySelector('#special-cards-table .header-filter[data-column="name"]');
    const characterSearchInput = document.querySelector('#special-cards-table .header-filter[data-column="character"]');
    const effectSearchInput = document.querySelector('#special-cards-table .header-filter[data-column="card_effect"]');
    
    if (nameSearchInput) nameSearchInput.value = '';
    if (characterSearchInput) characterSearchInput.value = '';
    if (effectSearchInput) effectSearchInput.value = '';
    
    // Reload all special cards
    if (typeof loadSpecialCards === 'function') {
        loadSpecialCards();
    }
}

function clearAdvancedUniverseFilters() {
    // Clear advanced universe character search input
    const characterSearchInput = document.querySelector('#advanced-universe-table .header-filter[data-column="character"]');
    if (characterSearchInput) {
        characterSearchInput.value = '';
    }

    // Clear advanced universe card effect search input
    const effectSearchInput = document.querySelector('#advanced-universe-table .header-filter[data-column="card_effect"]');
    if (effectSearchInput) {
        effectSearchInput.value = '';
    }
    
    // Reload all advanced universe cards
    if (typeof loadAdvancedUniverse === 'function') {
        loadAdvancedUniverse();
    }
}

function clearAspectsFilters() {
    // Clear aspects search inputs
    const nameSearchInput = document.querySelector('#aspects-table .header-filter[data-column="card_name"]');
    const locationSearchInput = document.querySelector('#aspects-table .header-filter[data-column="location"]');
    const effectSearchInput = document.querySelector('#aspects-table .header-filter[data-column="card_effect"]');

    if (nameSearchInput) nameSearchInput.value = '';
    if (locationSearchInput) locationSearchInput.value = '';
    if (effectSearchInput) effectSearchInput.value = '';

    // Reload all aspects
    if (typeof loadAspects === 'function') {
        loadAspects();
    }
}


function clearMissionsFilters() {
    // Clear missions filters
    // Add specific filter clearing logic here if needed
    applyFilters();
}

function clearEventsFilters() {
    // Clear events filters
    // Add specific filter clearing logic here if needed
    applyFilters();
}

function clearTeamworkFilters() {
    // Clear teamwork filters
    // Add specific filter clearing logic here if needed
    applyFilters();
}

function clearAllyUniverseFilters() {
    // Clear ally universe filters
    // Add specific filter clearing logic here if needed
    applyFilters();
}

function clearTrainingFilters() {
    // Clear training filters
    // Add specific filter clearing logic here if needed
    applyFilters();
}

function clearBasicUniverseFilters() {
    // Clear basic universe filters
    // Add specific filter clearing logic here if needed
    applyFilters();
}

// Simple debounce utility
function debounce(func, wait) {
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

// Power Cards filtering functions
window.applyPowerCardFilters = async function applyPowerCardFilters() {
    try {
        const resp = await fetch('/api/power-cards');
        const data = await resp.json();
        if (!data.success) return;

        let filtered = data.data;

        // Filter by power type
        const selectedTypes = Array.from(document.querySelectorAll('#power-cards-tab input[type="checkbox"]:checked'))
            .map(cb => cb.value);
        console.log('Selected power types for filtering:', selectedTypes);

        // If no types are selected, show no cards
        if (selectedTypes.length === 0) {
            filtered = [];
            console.log('No power types selected - showing no cards');
        } else {
            filtered = filtered.filter(card => selectedTypes.includes(card.power_type));
            console.log('Filtered power cards count:', filtered.length);
        }

        // Filter by value range
        const minValue = document.getElementById('power-value-min');
        const maxValue = document.getElementById('power-value-max');
        
        if (minValue && minValue.value && !isNaN(minValue.value)) {
            filtered = filtered.filter(card => card.value >= parseInt(minValue.value));
        }
        if (maxValue && maxValue.value && !isNaN(maxValue.value)) {
            filtered = filtered.filter(card => card.value <= parseInt(maxValue.value));
        }

        // Display results
        if (window.displayPowerCards) {
            window.displayPowerCards(filtered);
        } else {
            console.error('displayPowerCards function not found');
        }
    } catch (err) {
        console.error('Error applying power card filters:', err);
    }
}

window.setupPowerCardsSearch = function setupPowerCardsSearch() {
    // Initialize checkboxes to checked by default
    const checkboxes = document.querySelectorAll('#power-cards-tab input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = true;
        checkbox.addEventListener('change', applyPowerCardFilters);
    });

    // Add event listeners for value range inputs
    const minValue = document.getElementById('power-value-min');
    const maxValue = document.getElementById('power-value-max');
    
    if (minValue) {
        minValue.addEventListener('input', debounce(applyPowerCardFilters, 300));
    }
    if (maxValue) {
        maxValue.addEventListener('input', debounce(applyPowerCardFilters, 300));
    }

    // Initial filter application
    applyPowerCardFilters();
}

window.clearPowerCardFilters = function clearPowerCardFilters() {
    // Reset all checkboxes to checked
    const checkboxes = document.querySelectorAll('#power-cards-tab input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = true;
    });

    // Clear value range inputs
    const minValue = document.getElementById('power-value-min');
    const maxValue = document.getElementById('power-value-max');
    
    if (minValue) minValue.value = '';
    if (maxValue) maxValue.value = '';

    // Reapply filters
    applyPowerCardFilters();
}


// Layout utility functions
function ensureTwoPaneLayout() {
    const layout = document.querySelector('.deck-editor-layout');
    if (layout) {
        // Only add the class if we're not in read-only mode
        if (!isReadOnlyMode) {
            layout.classList.add('force-two-pane');
        } else {
            layout.classList.remove('force-two-pane');
        }
    }
}

// Deck utility functions
function updateDeckStats() {
    // Statistics elements were removed as requested, so this function is now a no-op
    // but we keep it to avoid breaking other functions that call it
}

// UI utility functions
function toggleCategory(headerElement) {
    const category = headerElement.closest('.card-category');
    const content = category.querySelector('.card-category-content');
    const icon = headerElement.querySelector('.collapse-icon');
    
    if (headerElement.classList.contains('collapsed')) {
        // Expand
        headerElement.classList.remove('collapsed');
        content.classList.remove('collapsed');
        content.classList.add('expanded');
        icon.textContent = '▼';
    } else {
        // Collapse
        headerElement.classList.add('collapsed');
        content.classList.add('collapsed');
        content.classList.remove('expanded');
        icon.textContent = '▶';
    }
}
