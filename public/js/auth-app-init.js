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

/**
 * Check authentication status using the auth service
 * @returns {Promise<Object>} Authentication result with user and read-only mode
 */
async function checkAuthentication() {
    const authResult = await window.authService.checkAuthentication();
    currentUser = authResult.currentUser;
    isReadOnlyMode = authResult.isReadOnlyMode;
    return authResult;
}

/**
 * Login user with username and password
 * @param {string} username - User's username
 * @param {string} password - User's password
 */
async function login(username, password) {
    const result = await window.authService.login({ username, password });
    if (result.success) {
        currentUser = result.data;
        
        // Update user welcome message and show/hide Create User button based on role
        if (typeof updateUserWelcome === 'function') {
            updateUserWelcome();
        }
        
        // Redirect to user's deck page
        window.location.href = `/users/${currentUser.userId}/decks`;
    } else {
        showLoginError(result.error || 'Login failed');
    }
}

/**
 * Logout current user and redirect to home page
 */
async function logout() {
    await window.authService.logout();
    currentUser = null;
    // Hide main UI immediately to prevent flash before redirect
    const mainContainer = document.getElementById('mainContainer');
    if (mainContainer) mainContainer.style.display = 'none';
    const databaseView = document.getElementById('database-view');
    const deckBuilder = document.getElementById('deck-builder');
    if (databaseView) databaseView.style.display = 'none';
    if (deckBuilder) deckBuilder.style.display = 'none';
    // Redirect to root page
    window.location.href = '/';
}
