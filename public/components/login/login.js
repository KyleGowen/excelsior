/**
 * Login Component
 * Handles login modal display, form submission, and guest login functionality
 */

/**
 * Load login HTML template and inject into body
 */
async function loadLoginTemplate() {
    // Check if login modal already exists
    if (document.getElementById('loginModal')) {
        return; // Already loaded
    }
    
    try {
        const response = await fetch('/components/login/login.html');
        const html = await response.text();
        
        // Inject HTML at the beginning of body
        document.body.insertAdjacentHTML('afterbegin', html);
        
        // Setup event listeners after HTML is loaded
        setupLoginEventListeners();
    } catch (error) {
        console.error('Error loading login template:', error);
        // Fallback: create basic login modal structure
        createFallbackLoginModal();
        setupLoginEventListeners();
    }
}

/**
 * Create fallback login modal if template loading fails
 */
function createFallbackLoginModal() {
    const fallbackHTML = `
        <div id="loginModal" class="login-modal">
            <div class="login-modal-content">
                <div class="login-header">
                    <img src="/src/resources/images/logo/logo5.png" alt="Excelsior Deckbuilder" style="max-width: 300px; height: auto; display: block; margin: 0 auto;" data-click-handler="handleLoginLogoClick">
                </div>
                <form id="loginForm" class="login-form">
                    <div class="form-group">
                        <label for="username">Username</label>
                        <input type="text" id="username" name="username" autocomplete="username" required>
                    </div>
                    <div class="form-group">
                        <label for="password">Password</label>
                        <input type="password" id="password" name="password" autocomplete="current-password" required>
                    </div>
                    <div id="loginError" class="error-message" style="display: none;"></div>
                    <button type="submit" class="login-btn">Log In</button>
                </form>
                <button type="button" id="guestLoginBtn" class="guest-btn">Continue as Guest</button>
                <div class="login-contact" aria-label="Contact">
                    For questions or account creation requests, email
                    <a class="login-contact-link" href="mailto:kyle@excelsior.cards">kyle@excelsior.cards</a>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('afterbegin', fallbackHTML);
}

/**
 * Initialize login component
 * Sets up event listeners for login form and guest login button
 */
function initializeLoginComponent() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', async () => {
            await loadLoginTemplate();
        });
    } else {
        loadLoginTemplate();
    }
}

/**
 * Setup event listeners for login form and guest login button
 */
function setupLoginEventListeners() {
    const loginForm = document.getElementById('loginForm');
    const guestLoginBtn = document.getElementById('guestLoginBtn');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginSubmit);
    }
    
    if (guestLoginBtn) {
        guestLoginBtn.addEventListener('click', handleGuestLogin);
    }
}

/**
 * Handle login form submission
 * @param {Event} e - Form submit event
 */
async function handleLoginSubmit(e) {
    e.preventDefault();
    
    // Use hideLoginError from auth-app-init.js (don't define our own to avoid recursion)
    if (typeof window.hideLoginError === 'function') {
        window.hideLoginError();
    }
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        // Use showLoginError from auth-app-init.js
        if (typeof window.showLoginError === 'function') {
            window.showLoginError('Please enter both username and password');
        } else {
            const errorDiv = document.getElementById('loginError');
            if (errorDiv) {
                errorDiv.textContent = 'Please enter both username and password';
                errorDiv.style.display = 'block';
            }
        }
        return;
    }
    
    // Use the login function from auth-app-init.js
    const loginFn = typeof login === 'function' ? login : (typeof window.login === 'function' ? window.login : null);
    if (loginFn) {
        await loginFn(username, password);
    } else {
        console.error('Login function not available');
        if (typeof window.showLoginError === 'function') {
            window.showLoginError('Login functionality not available');
        }
    }
}

/**
 * Handle guest login button click
 */
async function handleGuestLogin() {
    // Use hideLoginError from auth-app-init.js (don't define our own to avoid recursion)
    if (typeof window.hideLoginError === 'function') {
        window.hideLoginError();
    }
    
    // Use the login function from auth-app-init.js
    const loginFn = typeof login === 'function' ? login : (typeof window.login === 'function' ? window.login : null);
    if (loginFn) {
        await loginFn('guest', 'guest');
    } else {
        console.error('Login function not available');
        if (typeof window.showLoginError === 'function') {
            window.showLoginError('Guest login functionality not available');
        }
    }
}

// Note: showLoginError and hideLoginError are defined in auth-app-init.js
// We don't redefine them here to avoid recursion issues

// Initialize login component when script loads
initializeLoginComponent();

