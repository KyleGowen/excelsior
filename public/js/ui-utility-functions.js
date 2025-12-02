/* ========================================
 * PHASE 9: UI UTILITY FUNCTIONS
 * ========================================
 * 
 * This file contains UI interactions and utility functions extracted from
 * index.html during Phase 9 of the refactoring project.
 * 
 * Purpose: UI interactions and utility functions
 * Created: Phase 9 of 12-phase refactoring project
 * Contains:
 *   - showToast() - Toast notifications
 *   - startEditingTitle() / saveTitleEdit() - Title editing
 *   - cancelTitleEdit() - Edit cancellation
 *   - toggleDrawHand() - Draw hand toggle (delegates to DrawHand module)
 *   - closeDrawHand() - Draw hand close (delegates to DrawHand module)
 *   - screenshotView() - Screenshot functionality
 * 
 * Note: Draw Hand functionality is now handled by the DrawHand module
 * (public/js/components/draw-hand.js). These functions are thin wrappers
 * for backward compatibility.
 * 
 * ======================================== */

// UI utility functions
function toggleDrawHand() {
    // Draw Hand functionality is now handled by the Draw Hand module
    if (window.DrawHand && window.DrawHand.toggle) {
        window.DrawHand.toggle();
    } else {
        console.warn('Draw Hand module not loaded');
    }
}

function closeDrawHand() {
    // Draw Hand functionality is now handled by the Draw Hand module
    if (window.DrawHand && window.DrawHand.close) {
        window.DrawHand.close();
    } else {
        console.warn('Draw Hand module not loaded');
    }
}

// Expose functions on window for event binder (data-click-handler)
window.toggleDrawHand = toggleDrawHand;
window.closeDrawHand = closeDrawHand;

function toggleScreenshotView() {
    const screenshotViewSection = document.getElementById('screenshotViewSection');
    const screenshotViewBtn = document.getElementById('screenshotViewBtn');
    const deckPane = document.querySelector('.deck-pane');
    const availablePane = document.querySelector('.available-pane');
    
    if (screenshotViewSection.style.display === 'none') {
        // Show screenshot view
        screenshotViewSection.style.display = 'flex';
        screenshotViewBtn.textContent = 'Exit Screenshot';
        
        // Hide original panes
        if (deckPane) deckPane.style.display = 'none';
        if (availablePane) availablePane.style.display = 'none';
        
        // Generate screenshot content
        generateScreenshotContent();
    } else {
        // Hide screenshot view
        closeScreenshotView();
    }
}

function closeScreenshotView() {
    const screenshotViewSection = document.getElementById('screenshotViewSection');
    const screenshotViewBtn = document.getElementById('screenshotViewBtn');
    const deckPane = document.querySelector('.deck-pane');
    const availablePane = document.querySelector('.available-pane');
    
    screenshotViewSection.style.display = 'none';
    screenshotViewBtn.textContent = 'Screenshot View';
    
    // Show original panes
    if (deckPane) deckPane.style.display = 'flex';
    if (availablePane) availablePane.style.display = 'flex';
}

function showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // Style the toast
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4ecdc4' : type === 'error' ? '#ff6b6b' : '#333'};
        color: white;
        padding: 12px 20px;
        border-radius: 4px;
        z-index: 10000;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

function startEditingTitle() {
    // Check if in read-only mode
    if (isReadOnlyMode) {
        alert('Cannot edit deck title in read-only mode. You are viewing another user\'s deck.');
        return;
    }
    
    const titleElement = document.getElementById('deckEditorTitle');
    // Get the title from currentDeckData instead of textContent to ensure consistency
    const currentTitle = currentDeckData?.metadata?.name || titleElement.textContent || 'Edit Deck';
    
    // Create input element
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'edit-input';
    input.value = currentTitle;
    input.placeholder = 'Enter deck title';
    
    // Replace content with input
    titleElement.innerHTML = '';
    titleElement.appendChild(input);
    titleElement.classList.add('editing');
    
    // Focus and select text
    input.focus();
    input.select();
    
    // Handle save on blur or enter
    input.addEventListener('blur', () => saveTitleEdit(input));
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveTitleEdit(input);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cancelTitleEdit(input, currentTitle);
        }
    });
}

function saveTitleEdit(input) {
    const newTitle = input.value.trim();
    const titleElement = document.getElementById('deckEditorTitle');

    // Always update the display with the current input value
    titleElement.textContent = newTitle || currentDeckData?.metadata?.name || 'Edit Deck';
    titleElement.classList.remove('editing');

    // Only update deck data and show notification if the title actually changed
    if (newTitle && newTitle !== currentDeckData?.metadata?.name) {
        // Update the deck data
        if (currentDeckData) {
            currentDeckData.metadata.name = newTitle;
        }

        // Show save indicator only for non-guest users
        if (!isGuestUser()) {
            showNotification('Title updated - remember to save changes', 'info');
        }
    }
}

function cancelTitleEdit(input, originalTitle) {
    const titleElement = document.getElementById('deckEditorTitle');
    titleElement.textContent = originalTitle;
    titleElement.classList.remove('editing');
}


