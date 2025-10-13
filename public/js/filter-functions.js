// Filter Functions
// Extracted from index.html for better modularity

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
