// Authentication and App Initialization Functions
// Extracted from index.html for better modularity

/**
 * Show the login modal and hide main application views
 * Ensures login modal exists before showing it
 */
async function showLoginModal() {
    // Ensure login modal exists before trying to show it
    let loginModal = document.getElementById('loginModal');
    
    if (!loginModal) {
        // Login modal doesn't exist, try to load it
        if (typeof loadLoginTemplate === 'function') {
            await loadLoginTemplate();
        } else if (typeof window.loadLoginTemplate === 'function') {
            await window.loadLoginTemplate();
        } else {
            // Fallback: create basic login modal if loading fails
            if (typeof createFallbackLoginModal === 'function') {
                createFallbackLoginModal();
            } else if (typeof window.createFallbackLoginModal === 'function') {
                window.createFallbackLoginModal();
            } else {
                // Last resort: create minimal login modal inline
                const fallbackHTML = `
                    <div id="loginModal" class="login-modal" style="display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 9999; justify-content: center; align-items: center;">
                        <div class="login-modal-content" style="background: #2c3e50; padding: 30px; border-radius: 10px; max-width: 400px; width: 90%;">
                            <div class="login-header" style="text-align: center; margin-bottom: 20px;">
                                <h2 style="color: #ecf0f1; margin: 0;">Please Log In</h2>
                            </div>
                            <form id="loginForm" class="login-form">
                                <div class="form-group" style="margin-bottom: 15px;">
                                    <label for="username" style="display: block; color: #ecf0f1; margin-bottom: 5px;">Username</label>
                                    <input type="text" id="username" name="username" autocomplete="username" required style="width: 100%; padding: 10px; border-radius: 5px; border: 1px solid #34495e; background: #34495e; color: #ecf0f1;">
                                </div>
                                <div class="form-group" style="margin-bottom: 15px;">
                                    <label for="password" style="display: block; color: #ecf0f1; margin-bottom: 5px;">Password</label>
                                    <input type="password" id="password" name="password" autocomplete="current-password" required style="width: 100%; padding: 10px; border-radius: 5px; border: 1px solid #34495e; background: #34495e; color: #ecf0f1;">
                                </div>
                                <div id="loginError" class="error-message" style="display: none; color: #e74c3c; margin-bottom: 10px;"></div>
                                <button type="submit" class="login-btn" style="width: 100%; padding: 12px; background: #4ecdc4; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; margin-bottom: 10px;">Log In</button>
                            </form>
                            <button type="button" id="guestLoginBtn" class="guest-btn" style="width: 100%; padding: 10px; background: transparent; color: #4ecdc4; border: 1px solid #4ecdc4; border-radius: 5px; cursor: pointer;">Continue as Guest</button>
                        </div>
                    </div>
                `;
                document.body.insertAdjacentHTML('afterbegin', fallbackHTML);
                
                // Setup event listeners for the fallback modal
                const loginForm = document.getElementById('loginForm');
                const guestLoginBtn = document.getElementById('guestLoginBtn');
                if (loginForm) {
                    loginForm.addEventListener('submit', async (e) => {
                        e.preventDefault();
                        const username = document.getElementById('username').value;
                        const password = document.getElementById('password').value;
                        if (typeof login === 'function') {
                            await login(username, password);
                        } else if (typeof window.login === 'function') {
                            await window.login(username, password);
                        }
                    });
                }
                if (guestLoginBtn) {
                    guestLoginBtn.addEventListener('click', async () => {
                        if (typeof login === 'function') {
                            await login('guest', 'guest');
                        } else if (typeof window.login === 'function') {
                            await window.login('guest', 'guest');
                        }
                    });
                }
            }
        }
        
        // Try to get the modal again after loading
        loginModal = document.getElementById('loginModal');
    }
    
    // Show the login modal if it exists
    if (loginModal) {
        loginModal.style.display = 'flex';
    }
    
    // Hide main application views
    const mainContainer = document.getElementById('mainContainer');
    if (mainContainer) mainContainer.style.display = 'none';
    
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
