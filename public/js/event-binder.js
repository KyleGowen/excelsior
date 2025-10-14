/* ========================================
 * PHASE 11B: EVENT BINDER
 * ========================================
 * 
 * This file contains centralized event binding for data attributes
 * created during Phase 11B of the refactoring project.
 * 
 * Purpose: Centralized event binding for data attributes
 * Created: Phase 11B of 12-phase refactoring project
 * Contains: JavaScript logic to dynamically attach event listeners based on data attributes
 * 
 * ======================================== */
class EventBinder {
    constructor() {
        this.initialized = false;
    }

    // Initialize event binding for the entire document
    init() {
        if (this.initialized) return;
        
        // Bind events for existing elements
        this.bindEvents(document);
        
        // Set up mutation observer for dynamically added elements
        this.setupMutationObserver();
        
        this.initialized = true;
    }

    // Bind events for a specific container
    bindEvents(container) {
        // Handle click events
        const clickElements = container.querySelectorAll('[data-click-handler]');
        clickElements.forEach(element => {
            const handler = element.getAttribute('data-click-handler');
            const tab = element.getAttribute('data-tab');
            
            element.addEventListener('click', (e) => {
                e.preventDefault();
                if (typeof window[handler] === 'function') {
                    if (tab) {
                        window[handler](tab);
                    } else {
                        window[handler]();
                    }
                } else {
                    console.warn(`Handler function '${handler}' not found`);
                }
            });
        });

        // Handle edit events
        const editElements = container.querySelectorAll('[data-edit-handler]');
        editElements.forEach(element => {
            const handler = element.getAttribute('data-edit-handler');
            element.addEventListener('click', (e) => {
                e.preventDefault();
                if (typeof window[handler] === 'function') {
                    window[handler]();
                } else {
                    console.warn(`Handler function '${handler}' not found`);
                }
            });
        });

        // Handle modal close events
        const modals = container.querySelectorAll('[data-close-handler]');
        modals.forEach(modal => {
            const handler = modal.getAttribute('data-close-handler');
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    if (typeof window[handler] === 'function') {
                        window[handler]();
                    } else {
                        console.warn(`Handler function '${handler}' not found`);
                    }
                }
            });
        });

        // Handle stop propagation
        const stopPropElements = container.querySelectorAll('[data-stop-propagation="true"]');
        stopPropElements.forEach(element => {
            element.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        });
    }

    // Set up mutation observer to handle dynamically added elements
    setupMutationObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) { // Element node
                            this.bindEvents(node);
                        }
                    });
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
}

// Global event binder instance
window.eventBinder = new EventBinder();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.eventBinder.init();
});

// Handle login logo click
window.handleLoginLogoClick = function() {
    console.log('Login logo clicked');
    event.preventDefault();
    event.stopPropagation();
    return false;
};
