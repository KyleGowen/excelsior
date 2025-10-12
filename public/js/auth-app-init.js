// Authentication and App Initialization Functions
// Extracted from index.html for better modularity

/**
 * Show the login modal and hide main application views
 */
function showLoginModal() {
    document.getElementById('loginModal').style.display = 'flex';
    document.getElementById('mainContainer').style.display = 'none';
    // Ensure app views are hidden to avoid flash when returning to login
    const databaseView = document.getElementById('database-view');
    const deckBuilder = document.getElementById('deck-builder');
    if (databaseView) databaseView.style.display = 'none';
    if (deckBuilder) deckBuilder.style.display = 'none';
}

/**
 * Display login error message to user
 * @param {string} message - Error message to display
 */
function showLoginError(message) {
    const errorDiv = document.getElementById('loginError');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

/**
 * Hide login error message
 */
function hideLoginError() {
    document.getElementById('loginError').style.display = 'none';
}
