/* ========================================
 * PHASE 2: JAVASCRIPT EXTRACTION
 * ========================================
 * 
 * This file contains core utility functions and app initialization code
 * extracted from index.html during Phase 2 of the refactoring project.
 * 
 * Purpose: Core utility functions and app initialization
 * Created: Phase 2 of 12-phase refactoring project
 * Contains:
 *   - debounce() function for performance optimization
 *   - App initialization functions
 *   - Global variable declarations
 *   - Core utility functions
 * 
 * ======================================== */

// Utility function
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

// Get current user from authentication service
function getCurrentUser() {
    return window.authService.getCurrentUser();
}
