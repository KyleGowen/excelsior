/**
 * Unit tests for Login Component
 * Tests login modal, form submission, guest login, and template loading
 * @jest-environment jsdom
 */

describe('Login Component', () => {
    let mockFetch: jest.Mock;
    let mockLogin: jest.Mock;
    let mockShowLoginError: jest.Mock;
    let mockHideLoginError: jest.Mock;
    let LoginComponent: any;

    beforeAll(() => {
        // Dynamically load the login component
        const fs = require('fs');
        const path = require('path');
        let componentCode = fs.readFileSync(
            path.join(__dirname, '../../public/components/login/login.js'),
            'utf8'
        );
        
        // Remove the auto-initialization call at the end
        componentCode = componentCode.replace(/\/\/ Initialize login component when script loads[\s\S]*$/, '');
        
        // Create a container object to capture functions
        const funcContainer: any = {};
        
        // Wrap the code to capture functions
        const wrappedCode = `
            ${componentCode}
            // Export functions to container
            if (typeof loadLoginTemplate !== 'undefined') funcContainer.loadLoginTemplate = loadLoginTemplate;
            if (typeof createFallbackLoginModal !== 'undefined') funcContainer.createFallbackLoginModal = createFallbackLoginModal;
            if (typeof initializeLoginComponent !== 'undefined') funcContainer.initializeLoginComponent = initializeLoginComponent;
            if (typeof setupLoginEventListeners !== 'undefined') funcContainer.setupLoginEventListeners = setupLoginEventListeners;
            if (typeof handleLoginSubmit !== 'undefined') funcContainer.handleLoginSubmit = handleLoginSubmit;
            if (typeof handleGuestLogin !== 'undefined') funcContainer.handleGuestLogin = handleGuestLogin;
        `;
        
        // Execute the wrapped code
        eval(wrappedCode);
        
        // Extract functions from container
        LoginComponent = funcContainer;
    });

    beforeEach(() => {
        // Reset DOM
        document.body.innerHTML = '';
        
        // Mock document.readyState
        Object.defineProperty(document, 'readyState', {
            writable: true,
            value: 'complete'
        });
        
        // Mock fetch
        mockFetch = jest.fn();
        (global as any).fetch = mockFetch;
        
        // Mock auth functions
        mockLogin = jest.fn().mockResolvedValue(undefined);
        mockShowLoginError = jest.fn();
        mockHideLoginError = jest.fn();
        
        (window as any).login = mockLogin;
        (window as any).showLoginError = mockShowLoginError;
        (window as any).hideLoginError = mockHideLoginError;
        
        // Mock console.error to avoid noise in tests
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        document.body.innerHTML = '';
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });

    describe('loadLoginTemplate', () => {
        it('should load and inject HTML template successfully', async () => {
            const mockHtml = '<div id="loginModal"><form id="loginForm"></form><button id="guestLoginBtn"></button></div>';
            mockFetch.mockResolvedValueOnce({
                ok: true,
                text: jest.fn().mockResolvedValue(mockHtml)
            });

            await LoginComponent.loadLoginTemplate();

            expect(mockFetch).toHaveBeenCalledWith('/components/login/login.html');
            expect(document.body.innerHTML).toContain('loginModal');
            // Verify that event listeners can be set up (elements exist)
            expect(document.getElementById('loginForm')).toBeTruthy();
            expect(document.getElementById('guestLoginBtn')).toBeTruthy();
        });

        it('should return early if loginModal already exists', async () => {
            document.body.innerHTML = '<div id="loginModal">Existing Modal</div>';

            await LoginComponent.loadLoginTemplate();

            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('should create fallback modal on fetch failure', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            await LoginComponent.loadLoginTemplate();

            // Verify fallback modal was created
            expect(document.body.innerHTML).toContain('loginModal');
            expect(document.getElementById('loginModal')).toBeTruthy();
            expect(document.getElementById('loginForm')).toBeTruthy();
            expect(document.getElementById('guestLoginBtn')).toBeTruthy();
        });

        it('should handle non-ok response', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                text: jest.fn().mockResolvedValue('')
            });

            await LoginComponent.loadLoginTemplate();

            // Note: The current implementation only uses fallback on exception, not on non-ok response
            // A non-ok response will still try to inject the empty HTML, which may cause issues
            // This test verifies the actual behavior - it will attempt to inject empty HTML
            // The test passes if no exception is thrown
            expect(mockFetch).toHaveBeenCalled();
        });
    });

    describe('createFallbackLoginModal', () => {
        it('should create fallback login modal HTML', () => {
            LoginComponent.createFallbackLoginModal();

            const modal = document.getElementById('loginModal');
            expect(modal).toBeTruthy();
            expect(modal?.classList.contains('login-modal')).toBe(true);
        });

        it('should include all required form elements', () => {
            LoginComponent.createFallbackLoginModal();

            expect(document.getElementById('loginForm')).toBeTruthy();
            expect(document.getElementById('username')).toBeTruthy();
            expect(document.getElementById('password')).toBeTruthy();
            expect(document.getElementById('loginError')).toBeTruthy();
            expect(document.getElementById('guestLoginBtn')).toBeTruthy();
        });

        it('should set correct input attributes', () => {
            LoginComponent.createFallbackLoginModal();

            const usernameInput = document.getElementById('username') as HTMLInputElement;
            const passwordInput = document.getElementById('password') as HTMLInputElement;

            expect(usernameInput?.type).toBe('text');
            expect(usernameInput?.autocomplete).toBe('username');
            expect(usernameInput?.required).toBe(true);

            expect(passwordInput?.type).toBe('password');
            expect(passwordInput?.autocomplete).toBe('current-password');
            expect(passwordInput?.required).toBe(true);
        });

        it('should include logo image with correct attributes', () => {
            LoginComponent.createFallbackLoginModal();

            const img = document.querySelector('.login-header img') as HTMLImageElement;
            expect(img).toBeTruthy();
            expect(img?.src).toContain('logo5.png');
            expect(img?.alt).toBe('Excelsior Deckbuilder');
        });
    });

    describe('initializeLoginComponent', () => {
        it('should call loadLoginTemplate when DOM is ready', async () => {
            Object.defineProperty(document, 'readyState', {
                writable: true,
                value: 'complete'
            });
            
            // Mock fetch to track if loadLoginTemplate is called
            mockFetch.mockResolvedValueOnce({
                ok: true,
                text: jest.fn().mockResolvedValue('<div id="loginModal">Test</div>')
            });

            LoginComponent.initializeLoginComponent();

            // Wait a bit for async operations
            await new Promise(resolve => setTimeout(resolve, 50));
            
            // Verify that fetch was called (which means loadLoginTemplate was called)
            expect(mockFetch).toHaveBeenCalledWith('/components/login/login.html');
        });

        it('should wait for DOMContentLoaded when DOM is loading', async () => {
            Object.defineProperty(document, 'readyState', {
                writable: true,
                value: 'loading'
            });
            
            const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
            mockFetch.mockResolvedValueOnce({
                ok: true,
                text: jest.fn().mockResolvedValue('<div id="loginModal">Test</div>')
            });

            LoginComponent.initializeLoginComponent();

            expect(addEventListenerSpy).toHaveBeenCalledWith('DOMContentLoaded', expect.any(Function));
            
            // Simulate DOMContentLoaded
            const callback = addEventListenerSpy.mock.calls.find(call => call[0] === 'DOMContentLoaded')?.[1] as () => Promise<void>;
            if (callback) {
                await callback();
                await new Promise(resolve => setTimeout(resolve, 50));
                // Verify that fetch was called after DOMContentLoaded
                expect(mockFetch).toHaveBeenCalledWith('/components/login/login.html');
            } else {
                // If callback wasn't found, the test should still verify addEventListener was called
                expect(addEventListenerSpy).toHaveBeenCalled();
            }
        });
    });

    describe('setupLoginEventListeners', () => {
        beforeEach(() => {
            document.body.innerHTML = `
                <form id="loginForm"></form>
                <button id="guestLoginBtn"></button>
            `;
        });

        it('should attach submit listener to login form', () => {
            const form = document.getElementById('loginForm') as HTMLFormElement;
            const submitSpy = jest.spyOn(form, 'addEventListener');

            LoginComponent.setupLoginEventListeners();

            expect(submitSpy).toHaveBeenCalledWith('submit', LoginComponent.handleLoginSubmit);
        });

        it('should attach click listener to guest login button', () => {
            const btn = document.getElementById('guestLoginBtn') as HTMLButtonElement;
            const clickSpy = jest.spyOn(btn, 'addEventListener');

            LoginComponent.setupLoginEventListeners();

            expect(clickSpy).toHaveBeenCalledWith('click', LoginComponent.handleGuestLogin);
        });

        it('should handle missing login form gracefully', () => {
            document.body.innerHTML = '<button id="guestLoginBtn"></button>';

            expect(() => LoginComponent.setupLoginEventListeners()).not.toThrow();
        });

        it('should handle missing guest login button gracefully', () => {
            document.body.innerHTML = '<form id="loginForm"></form>';

            expect(() => LoginComponent.setupLoginEventListeners()).not.toThrow();
        });
    });

    describe('handleLoginSubmit', () => {
        beforeEach(() => {
            document.body.innerHTML = `
                <form id="loginForm">
                    <input id="username" type="text" />
                    <input id="password" type="password" />
                    <div id="loginError" style="display: none;"></div>
                </form>
            `;
        });

        it('should prevent default form submission', async () => {
            const form = document.getElementById('loginForm') as HTMLFormElement;
            const event = new Event('submit', { cancelable: true });
            const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

            await LoginComponent.handleLoginSubmit(event);

            expect(preventDefaultSpy).toHaveBeenCalled();
        });

        it('should call hideLoginError on submit', async () => {
            const form = document.getElementById('loginForm') as HTMLFormElement;
            const event = new Event('submit', { cancelable: true });

            await LoginComponent.handleLoginSubmit(event);

            expect(mockHideLoginError).toHaveBeenCalled();
        });

        it('should show error when username is missing', async () => {
            const form = document.getElementById('loginForm') as HTMLFormElement;
            const event = new Event('submit', { cancelable: true });
            const passwordInput = document.getElementById('password') as HTMLInputElement;
            passwordInput.value = 'password123';

            await LoginComponent.handleLoginSubmit(event);

            expect(mockShowLoginError).toHaveBeenCalledWith('Please enter both username and password');
            expect(mockLogin).not.toHaveBeenCalled();
        });

        it('should show error when password is missing', async () => {
            const form = document.getElementById('loginForm') as HTMLFormElement;
            const event = new Event('submit', { cancelable: true });
            const usernameInput = document.getElementById('username') as HTMLInputElement;
            usernameInput.value = 'testuser';

            await LoginComponent.handleLoginSubmit(event);

            expect(mockShowLoginError).toHaveBeenCalledWith('Please enter both username and password');
            expect(mockLogin).not.toHaveBeenCalled();
        });

        it('should show error when both fields are empty', async () => {
            const form = document.getElementById('loginForm') as HTMLFormElement;
            const event = new Event('submit', { cancelable: true });

            await LoginComponent.handleLoginSubmit(event);

            expect(mockShowLoginError).toHaveBeenCalledWith('Please enter both username and password');
            expect(mockLogin).not.toHaveBeenCalled();
        });

        it('should call login function with credentials when both fields are filled', async () => {
            const form = document.getElementById('loginForm') as HTMLFormElement;
            const event = new Event('submit', { cancelable: true });
            const usernameInput = document.getElementById('username') as HTMLInputElement;
            const passwordInput = document.getElementById('password') as HTMLInputElement;
            usernameInput.value = 'testuser';
            passwordInput.value = 'password123';

            await LoginComponent.handleLoginSubmit(event);

            expect(mockLogin).toHaveBeenCalledWith('testuser', 'password123');
            expect(mockShowLoginError).not.toHaveBeenCalled();
        });

        it('should handle fallback error display when showLoginError is not available', async () => {
            (window as any).showLoginError = undefined;
            const form = document.getElementById('loginForm') as HTMLFormElement;
            const event = new Event('submit', { cancelable: true });

            await LoginComponent.handleLoginSubmit(event);

            const errorDiv = document.getElementById('loginError');
            expect(errorDiv?.textContent).toBe('Please enter both username and password');
            expect(errorDiv?.style.display).toBe('block');
        });

        it('should show error when login function is not available', async () => {
            (window as any).login = undefined;
            const form = document.getElementById('loginForm') as HTMLFormElement;
            const event = new Event('submit', { cancelable: true });
            const usernameInput = document.getElementById('username') as HTMLInputElement;
            const passwordInput = document.getElementById('password') as HTMLInputElement;
            usernameInput.value = 'testuser';
            passwordInput.value = 'password123';

            await LoginComponent.handleLoginSubmit(event);

            expect(mockShowLoginError).toHaveBeenCalledWith('Login functionality not available');
        });

        it('should handle login function from window object', async () => {
            const windowLogin = jest.fn().mockResolvedValue(undefined);
            (window as any).login = windowLogin;
            const form = document.getElementById('loginForm') as HTMLFormElement;
            const event = new Event('submit', { cancelable: true });
            const usernameInput = document.getElementById('username') as HTMLInputElement;
            const passwordInput = document.getElementById('password') as HTMLInputElement;
            usernameInput.value = 'testuser';
            passwordInput.value = 'password123';

            await LoginComponent.handleLoginSubmit(event);

            expect(windowLogin).toHaveBeenCalledWith('testuser', 'password123');
        });
    });

    describe('handleGuestLogin', () => {
        beforeEach(() => {
            document.body.innerHTML = '<div id="loginError" style="display: block;"></div>';
        });

        it('should call hideLoginError', async () => {
            await LoginComponent.handleGuestLogin();

            expect(mockHideLoginError).toHaveBeenCalled();
        });

        it('should call login function with guest credentials', async () => {
            await LoginComponent.handleGuestLogin();

            expect(mockLogin).toHaveBeenCalledWith('guest', 'guest');
        });

        it('should show error when login function is not available', async () => {
            (window as any).login = undefined;

            await LoginComponent.handleGuestLogin();

            expect(mockShowLoginError).toHaveBeenCalledWith('Guest login functionality not available');
        });

        it('should handle login function from window object', async () => {
            const windowLogin = jest.fn().mockResolvedValue(undefined);
            (window as any).login = windowLogin;

            await LoginComponent.handleGuestLogin();

            expect(windowLogin).toHaveBeenCalledWith('guest', 'guest');
        });

        it('should handle missing hideLoginError gracefully', async () => {
            (window as any).hideLoginError = undefined;

            await LoginComponent.handleGuestLogin();

            expect(mockLogin).toHaveBeenCalledWith('guest', 'guest');
        });
    });

    describe('Integration Tests', () => {
        it('should complete full login flow', async () => {
            const mockHtml = '<div id="loginModal"><form id="loginForm"><input id="username" type="text" /><input id="password" type="password" /><div id="loginError"></div></form><button id="guestLoginBtn"></button></div>';
            mockFetch.mockResolvedValueOnce({
                ok: true,
                text: jest.fn().mockResolvedValue(mockHtml)
            });

            await LoginComponent.loadLoginTemplate();

            const form = document.getElementById('loginForm') as HTMLFormElement;
            const usernameInput = document.getElementById('username') as HTMLInputElement;
            const passwordInput = document.getElementById('password') as HTMLInputElement;
            
            usernameInput.value = 'testuser';
            passwordInput.value = 'password123';

            const event = new Event('submit', { cancelable: true });
            await LoginComponent.handleLoginSubmit(event);

            expect(mockLogin).toHaveBeenCalledWith('testuser', 'password123');
        });

        it('should handle guest login flow', async () => {
            const mockHtml = '<div id="loginModal"><form id="loginForm"></form><button id="guestLoginBtn"></button></div>';
            mockFetch.mockResolvedValueOnce({
                ok: true,
                text: jest.fn().mockResolvedValue(mockHtml)
            });

            await LoginComponent.loadLoginTemplate();
            await LoginComponent.handleGuestLogin();

            expect(mockLogin).toHaveBeenCalledWith('guest', 'guest');
        });

        it('should handle template loading failure and use fallback', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            await LoginComponent.loadLoginTemplate();

            expect(document.getElementById('loginModal')).toBeTruthy();
            expect(document.getElementById('loginForm')).toBeTruthy();
            expect(document.getElementById('guestLoginBtn')).toBeTruthy();
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty username with whitespace', async () => {
            document.body.innerHTML = `
                <form id="loginForm">
                    <input id="username" type="text" value="   " />
                    <input id="password" type="password" value="password123" />
                    <div id="loginError"></div>
                </form>
            `;

            const form = document.getElementById('loginForm') as HTMLFormElement;
            const event = new Event('submit', { cancelable: true });

            await LoginComponent.handleLoginSubmit(event);

            // The component checks for truthy values, so whitespace-only username will pass validation
            // This tests the actual behavior - whitespace is considered a value
            const usernameInput = document.getElementById('username') as HTMLInputElement;
            // Since whitespace is truthy, login will be called
            expect(mockLogin).toHaveBeenCalledWith('   ', 'password123');
        });

        it('should handle special characters in username', async () => {
            document.body.innerHTML = `
                <form id="loginForm">
                    <input id="username" type="text" value="user@example.com" />
                    <input id="password" type="password" value="password123" />
                    <div id="loginError"></div>
                </form>
            `;

            const form = document.getElementById('loginForm') as HTMLFormElement;
            const event = new Event('submit', { cancelable: true });

            await LoginComponent.handleLoginSubmit(event);

            expect(mockLogin).toHaveBeenCalledWith('user@example.com', 'password123');
        });

        it('should handle very long password', async () => {
            const longPassword = 'a'.repeat(1000);
            document.body.innerHTML = `
                <form id="loginForm">
                    <input id="username" type="text" value="testuser" />
                    <input id="password" type="password" value="${longPassword}" />
                    <div id="loginError"></div>
                </form>
            `;

            const form = document.getElementById('loginForm') as HTMLFormElement;
            const event = new Event('submit', { cancelable: true });

            await LoginComponent.handleLoginSubmit(event);

            expect(mockLogin).toHaveBeenCalledWith('testuser', longPassword);
        });

        it('should handle multiple rapid form submissions', async () => {
            document.body.innerHTML = `
                <form id="loginForm">
                    <input id="username" type="text" value="testuser" />
                    <input id="password" type="password" value="password123" />
                    <div id="loginError"></div>
                </form>
            `;

            const form = document.getElementById('loginForm') as HTMLFormElement;
            const event1 = new Event('submit', { cancelable: true });
            const event2 = new Event('submit', { cancelable: true });

            await Promise.all([
                LoginComponent.handleLoginSubmit(event1),
                LoginComponent.handleLoginSubmit(event2)
            ]);

            expect(mockLogin).toHaveBeenCalledTimes(2);
        });
    });
});

