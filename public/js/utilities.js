/**
 * Utility functions for the Excelsior Deckbuilder
 */

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
