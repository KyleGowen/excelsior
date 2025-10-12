/**
 * Search and Filter Functions
 * Starting with simple, self-contained functions
 */

/**
 * Clear all filters globally
 */
function clearAllFiltersGlobally() {
    if (isClearingFilters) {
        return;
    }
    
    isClearingFilters = true;
    
    // Clear all text search inputs
    const headerFilters = document.querySelectorAll('.header-filter');
    headerFilters.forEach(input => {
        input.value = '';
    });
    
    // Clear all numeric filters
    const filterInputs = document.querySelectorAll('.filter-input');
    filterInputs.forEach(input => {
        input.value = '';
    });
    
    // Clear all checkboxes
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    
    isClearingFilters = false;
}

/**
 * Generic clear filters function to replace all specific clear*Filters() functions
 */
function clearFilters(loadFunction) {
    clearAllFiltersGlobally();
    if (typeof loadFunction === 'function') {
        loadFunction();
    }
}

/**
 * Clear all filters and reload characters
 */
function clearAllFilters() {
    // Use the global clear function
    clearAllFiltersGlobally();
    
    // Reload all characters
    loadCharacters();
}
