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
    
    // Apply filters after clearing
    applyFilters();
}

function clearSpecialCardFilters() {
    // Clear special card filters
    // Add specific filter clearing logic here if needed
    applyFilters();
}

function clearAdvancedUniverseFilters() {
    // Clear advanced universe filters
    // Add specific filter clearing logic here if needed
    applyFilters();
}

function clearAspectsFilters() {
    // Clear aspects filters
    // Add specific filter clearing logic here if needed
    applyFilters();
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

function clearPowerCardFilters() {
    // Clear power card filters
    // Add specific filter clearing logic here if needed
    applyFilters();
}

// Toggle column visibility functions
function toggleFortificationsColumn() {
    const fortificationsColumn = document.querySelectorAll('.fortifications-column');
    const toggleButton = document.getElementById('toggle-fortifications');
    const toggleText = document.getElementById('fortifications-toggle-text');
    
    fortificationsColumn.forEach(col => {
        col.classList.toggle('hidden');
    });
    
    if (fortificationsColumn[0].classList.contains('hidden')) {
        toggleText.textContent = 'Show';
    } else {
        toggleText.textContent = 'Hide';
    }
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
