/* ========================================
 * DATABASE VIEW JAVASCRIPT FUNCTIONS
 * ========================================
 *
 * This file contains database view-specific JavaScript functions
 * extracted from index.html during Step 3 of the database view refactoring.
 *
 * Purpose: Database view tab switching, filtering, and UI management
 * Created: Step 3 of 6-step database view refactoring project
 * Contains:
 *   - switchTab() - Main tab switching functionality
 *   - All clear*Filters() functions for each card type
 *   - All toggle*Column() functions for column visibility
 *   - Database view-specific search and filter functions
 *
 * ======================================== */

/**
 * Main tab switching function for database view
 * Handles tab visibility, search setup, and data loading
 */
function switchTab(tabName) {
    // Use new component structure if available
    if (window.databaseViewCore && window.databaseViewCore.isInitialized()) {
        const tabsComponent = window.databaseViewCore.getComponent('tabs');
        if (tabsComponent) {
            return tabsComponent.switchTab(tabName);
        }
    }

    // Fallback to original implementation
    return switchTabFallback(tabName);
}

/**
 * Fallback tab switching implementation
 * Original implementation for backward compatibility
 */
function switchTabFallback(tabName) {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];

    // Removed overly aggressive tab switching protection

    // Add a global flag to track if we're in the middle of a filter interaction
    if (window.isFilterInteraction) {

        // If we're in a filter interaction and trying to switch to characters, block it
        if (tabName === 'characters') {
            return; // Block the tab switch
        }
    }

    // Also check if this is a call to switch to characters tab
    if (tabName === 'characters') {

        // Check if this is happening after a filter interaction
    }

    // Clear all filters when switching tabs
    clearAllFiltersGlobally();

    // Hide all tabs
    document.getElementById('characters-tab').style.display = 'none';
    document.getElementById('special-cards-tab').style.display = 'none';
    document.getElementById('advanced-universe-tab').style.display = 'none';
    document.getElementById('missions-tab').style.display = 'none';
    document.getElementById('locations-tab').style.display = 'none';
    document.getElementById('aspects-tab').style.display = 'none';
    document.getElementById('events-tab').style.display = 'none';
    document.getElementById('teamwork-tab').style.display = 'none';
    document.getElementById('ally-universe-tab').style.display = 'none';
    document.getElementById('training-tab').style.display = 'none';
    document.getElementById('basic-universe-tab').style.display = 'none';
    document.getElementById('power-cards-tab').style.display = 'none';
    document.getElementById('character-plus-tab').style.display = 'none';

    // Show search container for all tabs including characters
    const searchContainer = document.getElementById('search-container');
    if (searchContainer) {
        searchContainer.style.display = 'block';
    }

    // Remove active class from all buttons
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));

    // Add active class to the selected tab button
    const selectedButton = document.querySelector(`[onclick="switchTab('${tabName}')"]`);
    if (selectedButton) {
        selectedButton.classList.add('active');
    } else {
        console.warn(`Tab button for '${tabName}' not found`);
    }

    // Show selected tab
    const selectedTab = document.getElementById(tabName + '-tab');
    if (selectedTab) {
        selectedTab.style.display = 'block';
    } else {
        console.warn(`Tab '${tabName}' not found`);
    }

    // Update search placeholder for all tabs
    const searchInput = document.getElementById('search-input');
    if (tabName === 'characters') {
        searchInput.placeholder = 'Search characters by name or abilities...';
    } else if (tabName === 'special-cards') {
        searchInput.placeholder = 'Search special cards by name, character, or effect...';
    } else if (tabName === 'advanced-universe') {
            searchInput.placeholder = 'Search advanced universe by name, character, or effect...';
        } else if (tabName === 'locations') {
            searchInput.placeholder = 'Search locations by name or abilities...';
        } else if (tabName === 'aspects') {
            searchInput.placeholder = 'Search aspects by name, type, or effect...';
        } else if (tabName === 'missions') {
            searchInput.placeholder = 'Search missions by name or mission set...';
        } else if (tabName === 'events') {
            searchInput.placeholder = 'Search events by name, mission set, or effect...';
        } else if (tabName === 'teamwork') {
            searchInput.placeholder = 'Search teamwork by requirements or effects...';
        } else if (tabName === 'ally-universe') {
            searchInput.placeholder = 'Search allies by name, stat, or text...';
        } else if (tabName === 'training') {
            searchInput.placeholder = 'Search training by name or types...';
        } else if (tabName === 'basic-universe') {
            searchInput.placeholder = 'Search basic universe by name, type, or bonus...';
        } else if (tabName === 'power-cards') {
            searchInput.placeholder = 'Search power cards by type or value...';
        } else if (tabName === 'character-plus') {
            // Hide search container for character-plus tab
            if (searchContainer) {
                searchContainer.style.display = 'none';
            }
        }

    // Add active class to selected tab button programmatically-safe
    const selectedTabButton = document.querySelector(`[onclick="switchTab('${tabName}')"]`);
    if (selectedTabButton) {
        selectedTabButton.classList.add('active');
    }

    // Notify filter manager of tab switch
    if (window.filterManager) {
        window.filterManager.handleTabSwitch({ detail: { tabName } });
    }

    // Update search functionality and reload data based on tab
    if (tabName === 'characters') {
        setupSearch();
        loadCharacters();
    } else if (tabName === 'special-cards') {
        setupSpecialCardSearch();
        loadSpecialCards();
    } else if (tabName === 'advanced-universe') {
        setupAdvancedUniverseSearch();
        loadAdvancedUniverse();
    } else if (tabName === 'locations') {
        setupLocationSearch();
        loadLocations();
    } else if (tabName === 'aspects') {
        setupAspectSearch();
        loadAspects();
    } else if (tabName === 'missions') {
        setupMissionSearch();
        loadMissions();
    } else if (tabName === 'events') {
        setupEventSearch();
        loadEvents();
    } else if (tabName === 'teamwork') {
        setupTeamworkSearch();
        loadTeamwork();
    } else if (tabName === 'ally-universe') {
        setupAllyUniverseSearch();
        loadAllyUniverse();
    } else if (tabName === 'training') {
        setupTrainingSearch();
        loadTraining();
    } else if (tabName === 'basic-universe') {
        setupBasicUniverseSearch();
        loadBasicUniverse();
    } else if (tabName === 'power-cards') {
        setupPowerCardsSearch();
        loadPowerCards();
    } else if (tabName === 'character-plus') {
        // No search setup needed for character-plus
        loadCharacterPlus();
    }

    // Disable "Add to Deck" buttons for guest users immediately
    disableAddToDeckButtonsImmediate();
}

/* ========================================
 * FILTER CLEARING FUNCTIONS
 * ======================================== */

/**
 * Clear location-specific filters
 */
function clearLocationFilters() {
    // Clear location-specific filters
    const locationThreatMin = document.getElementById('location-threat-min');
    const locationThreatMax = document.getElementById('location-threat-max');

    if (locationThreatMin) locationThreatMin.value = '';
    if (locationThreatMax) locationThreatMax.value = '';

    // Reload locations
    loadLocations();
}

/**
 * Clear special card filters
 */
function clearSpecialCardFilters() {
    // Clear special card filters
    // Add specific filter clearing logic here if needed
    applyFilters();
}

/**
 * Clear advanced universe filters
 */
function clearAdvancedUniverseFilters() {
    // Clear advanced universe filters
    // Add specific filter clearing logic here if needed
    applyFilters();
}

/**
 * Clear aspects filters
 */
function clearAspectsFilters() {
    // Clear aspects filters
    // Add specific filter clearing logic here if needed
    applyFilters();
}

/**
 * Clear missions filters
 */
function clearMissionsFilters() {
    // Clear missions filters
    // Add specific filter clearing logic here if needed
    applyFilters();
}

/**
 * Clear events filters
 */
function clearEventsFilters() {
    // Clear events filters
    // Add specific filter clearing logic here if needed
    applyFilters();
}

/**
 * Clear teamwork filters
 */
function clearTeamworkFilters() {
    // Clear teamwork filters
    // Add specific filter clearing logic here if needed
    applyFilters();
}

/**
 * Clear ally universe filters
 */
function clearAllyUniverseFilters() {
    // Clear ally universe filters
    // Add specific filter clearing logic here if needed
    applyFilters();
}

/**
 * Clear training filters
 */
function clearTrainingFilters() {
    // Clear training filters
    // Add specific filter clearing logic here if needed
    applyFilters();
}

/**
 * Clear basic universe filters
 * Now delegates to the new filter system
 */
function clearBasicUniverseFilters() {
    if (window.filterManager) {
        window.filterManager.clearFilters('basic-universe');
    } else {
        console.warn('New filter system not available, using fallback');
        clearBasicUniverseFiltersFallback();
    }
}

/**
 * Fallback clear basic universe filters implementation
 * (kept for backward compatibility)
 */
function clearBasicUniverseFiltersFallback() {
    // Clear all filter inputs
    const checkboxes = document.querySelectorAll('#basic-universe-tab input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = true; // Default to checked
    });

    const valueMin = document.getElementById('basic-universe-value-min');
    const valueMax = document.getElementById('basic-universe-value-max');
    const bonusMin = document.getElementById('basic-universe-bonus-min');
    const bonusMax = document.getElementById('basic-universe-bonus-max');

    if (valueMin) valueMin.value = '';
    if (valueMax) valueMax.value = '';
    if (bonusMin) bonusMin.value = '';
    if (bonusMax) bonusMax.value = '';

    // Apply filters after clearing
    applyBasicUniverseFilters();
}

/**
 * Clear power card filters
 */
function clearPowerCardFilters() {
    // Clear power card filters
    // Add specific filter clearing logic here if needed
    applyFilters();
}

/* ========================================
 * COLUMN TOGGLE FUNCTIONS
 * ======================================== */



/* ========================================
 * DATABASE VIEW SPECIFIC FUNCTIONS
 * ======================================== */

/**
 * Load and display basic universe cards
 */
async function loadBasicUniverse() {
    try {
        const resp = await fetch('/api/basic-universe');
        const data = await resp.json();
        if (data.success) displayBasicUniverse(data.data);
    } catch (e) {
        console.error('Error loading basic universe:', e);
    }
}

/**
 * Display basic universe cards in the table
 */
function displayBasicUniverse(cards) {
    const tbody = document.getElementById('basic-universe-tbody');
    if (!cards || cards.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">No basic universe cards found</td></tr>';
        return;
    }

    // Sort basic universe cards by type, then value_to_use, then bonus
    const preferredOrder = ['Energy', 'Combat', 'Brute Force', 'Intelligence', 'Any-Power'];
    const sortedCards = cards.sort((a, b) => {
        // First sort by type using OverPower order
        const aTypeIndex = preferredOrder.indexOf(a.type);
        const bTypeIndex = preferredOrder.indexOf(b.type);

        if (aTypeIndex !== bTypeIndex) {
            return aTypeIndex - bTypeIndex;
        }

        // Then by value_to_use (ascending)
        if (a.value_to_use !== b.value_to_use) {
            return a.value_to_use - b.value_to_use;
        }

        // Finally by bonus (ascending)
        return a.bonus - b.bonus;
    });

    tbody.innerHTML = sortedCards.map(card => `
        <tr>
            <td>${card.name}</td>
            <td>${card.type}</td>
            <td>${card.value_to_use}</td>
            <td>${card.bonus}</td>
            <td>${card.text || ''}</td>
            <td>
                <button class="add-to-deck-btn" onclick="addCardToDeck('basic-universe', '${card.id}', 1)">
                    Add to Deck
                </button>
            </td>
        </tr>
    `).join('');
}

/**
 * Apply basic universe filters
 * Now delegates to the new filter system
 */
async function applyBasicUniverseFilters() {
    if (window.FilterPatterns && window.FilterPatterns.applyBasicUniverseFilters) {
        await window.FilterPatterns.applyBasicUniverseFilters();
    } else {
        console.warn('New filter system not available, using fallback');
        await applyBasicUniverseFiltersFallback();
    }
}

/**
 * Fallback basic universe filter implementation
 * (kept for backward compatibility)
 */
async function applyBasicUniverseFiltersFallback() {
    try {
        const resp = await fetch('/api/basic-universe');
        const data = await resp.json();
        if (!data.success) return;

        let filtered = data.data;

        // Filter by type
        const selectedTypes = Array.from(document.querySelectorAll('#basic-universe-tab input[type="checkbox"]:checked'))
            .map(cb => cb.value);

        if (selectedTypes.length > 0) {
            filtered = filtered.filter(card => selectedTypes.includes(card.type));
        }

        // Filter by value to use
        const valueMin = document.getElementById('basic-universe-value-min');
        const valueMax = document.getElementById('basic-universe-value-max');

        if (valueMin && valueMin.value !== '') {
            filtered = filtered.filter(card => card.value_to_use >= parseInt(valueMin.value));
        }

        if (valueMax && valueMax.value !== '') {
            filtered = filtered.filter(card => card.value_to_use <= parseInt(valueMax.value));
        }

        // Filter by bonus
        const bonusMin = document.getElementById('basic-universe-bonus-min');
        const bonusMax = document.getElementById('basic-universe-bonus-max');

        if (bonusMin && bonusMin.value !== '') {
            filtered = filtered.filter(card => card.bonus >= parseInt(bonusMin.value));
        }

        if (bonusMax && bonusMax.value !== '') {
            filtered = filtered.filter(card => card.bonus <= parseInt(bonusMax.value));
        }

        displayBasicUniverse(filtered);
    } catch (error) {
        console.error('Error applying basic universe filters:', error);
    }
}

/**
 * Toggle basic universe character filter
 */
async function toggleBasicUniverseCharacterFilter() {
    const filterCheckbox = document.getElementById('basicUniverseCharacterFilter');
    if (!filterCheckbox) {
        console.error('Basic universe character filter checkbox not found');
        return;
    }

    const isChecked = filterCheckbox.checked;

    // Find the basic universe category
    const allCategories = document.querySelectorAll('.card-category');
    let basicUniverseCategory = null;

    for (let category of allCategories) {
        const categoryHeader = category.querySelector('.card-category-header');
        if (categoryHeader && categoryHeader.textContent.includes('Basic Universe')) {
            basicUniverseCategory = category;
            break;
        }
    }

    if (!basicUniverseCategory) {
        console.error('Basic universe category not found');
        return;
    }

    // Get all basic universe cards
    const basicUniverseCards = basicUniverseCategory.querySelectorAll('.card-item');

    if (isChecked) {
        // Show only cards that match the selected character
        const selectedCharacter = getSelectedCharacter();
        if (selectedCharacter) {
            basicUniverseCards.forEach(card => {
                const cardElement = card.querySelector('.card-name');
                if (cardElement) {
                    const cardName = cardElement.textContent.toLowerCase();
                    const characterName = selectedCharacter.toLowerCase();

                    // Show cards that match the character name or are generic
                    if (cardName.includes(characterName) ||
                        cardName.includes('any') ||
                        cardName.includes('generic') ||
                        cardName.includes('universal')) {
                        card.style.display = 'block';
                    } else {
                        card.style.display = 'none';
                    }
                }
            });
        }
    } else {
        // Show all basic universe cards
        basicUniverseCards.forEach(card => {
            card.style.display = 'block';
        });
    }
}

/**
 * Update basic universe filter
 */
function updateBasicUniverseFilter() {
    const filterCheckbox = document.getElementById('basicUniverseCharacterFilter');
    if (filterCheckbox && filterCheckbox.checked) {
        toggleBasicUniverseCharacterFilter();
    }
}

/**
 * Toggle teamwork character filter
 */
async function toggleTeamworkCharacterFilter() {
    const filterCheckbox = document.getElementById('teamworkCharacterFilter');
    if (!filterCheckbox) {
        console.error('Teamwork character filter checkbox not found');
        return;
    }

    const isChecked = filterCheckbox.checked;

    // Find the teamwork category
    const allCategories = document.querySelectorAll('.card-category');
    let teamworkCategory = null;

    for (let category of allCategories) {
        const categoryHeader = category.querySelector('.card-category-header');
        if (categoryHeader && categoryHeader.textContent.includes('Teamwork')) {
            teamworkCategory = category;
            break;
        }
    }

    if (!teamworkCategory) {
        console.error('Teamwork category not found');
        return;
    }

    // Get all teamwork cards
    const teamworkCards = teamworkCategory.querySelectorAll('.card-item');

    if (isChecked) {
        // Show only cards that match the selected character
        const selectedCharacter = getSelectedCharacter();
        if (selectedCharacter) {
            teamworkCards.forEach(card => {
                const cardElement = card.querySelector('.card-name');
                if (cardElement) {
                    const cardName = cardElement.textContent.toLowerCase();
                    const characterName = selectedCharacter.toLowerCase();

                    // Show cards that match the character name or are generic
                    if (cardName.includes(characterName) ||
                        cardName.includes('any') ||
                        cardName.includes('generic') ||
                        cardName.includes('universal')) {
                        card.style.display = 'block';
                    } else {
                        card.style.display = 'none';
                    }
                }
            });
        }
    } else {
        // Show all teamwork cards
        teamworkCards.forEach(card => {
            card.style.display = 'block';
        });
    }
}

/**
 * Update teamwork filter
 */
function updateTeamworkFilter() {
    const filterCheckbox = document.getElementById('teamworkCharacterFilter');
    if (filterCheckbox && filterCheckbox.checked) {
        toggleTeamworkCharacterFilter();
    }
}

/* ========================================
 * INITIALIZATION
 * ======================================== */

// Make functions globally available
window.switchTab = switchTab;
window.switchTabFallback = switchTabFallback;
window.clearLocationFilters = clearLocationFilters;
window.clearSpecialCardFilters = clearSpecialCardFilters;
window.clearAdvancedUniverseFilters = clearAdvancedUniverseFilters;
window.clearAspectsFilters = clearAspectsFilters;
window.clearMissionsFilters = clearMissionsFilters;
window.clearEventsFilters = clearEventsFilters;
window.clearTeamworkFilters = clearTeamworkFilters;
window.clearAllyUniverseFilters = clearAllyUniverseFilters;
window.clearTrainingFilters = clearTrainingFilters;
window.clearBasicUniverseFilters = clearBasicUniverseFilters;
window.clearPowerCardFilters = clearPowerCardFilters;
window.loadBasicUniverse = loadBasicUniverse;
window.displayBasicUniverse = displayBasicUniverse;
window.applyBasicUniverseFilters = applyBasicUniverseFilters;
window.toggleBasicUniverseCharacterFilter = toggleBasicUniverseCharacterFilter;
window.updateBasicUniverseFilter = updateBasicUniverseFilter;
window.toggleTeamworkCharacterFilter = toggleTeamworkCharacterFilter;
window.updateTeamworkFilter = updateTeamworkFilter;
