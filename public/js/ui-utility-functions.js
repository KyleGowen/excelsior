// UI Utility Functions
// Extracted from index.html as part of Phase 10E refactoring

// UI utility functions
function toggleDrawHand() {
    const drawHandSection = document.getElementById('drawHandSection');
    const drawHandBtn = document.getElementById('drawHandBtn');
    
    if (drawHandSection.style.display === 'none') {
        drawHandSection.style.display = 'block';
        drawHandBtn.textContent = 'Draw New Hand';
        drawHand();
    } else {
        drawHand();
    }
}

function closeDrawHand() {
    const drawHandSection = document.getElementById('drawHandSection');
    const drawHandBtn = document.getElementById('drawHandBtn');
    
    drawHandSection.style.display = 'none';
    drawHandBtn.textContent = 'Draw Hand';
}

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
    const currentTitle = titleElement.textContent;
    
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

function startEditingDescription() {
    // Check if in read-only mode
    if (isReadOnlyMode) {
        alert('Cannot edit deck description in read-only mode. You are viewing another user\'s deck.');
        return;
    }
    
    const descElement = document.getElementById('deckEditorDescription');
    const currentDescription = descElement.textContent;
    
    // Create textarea element
    const textarea = document.createElement('textarea');
    textarea.className = 'edit-input';
    textarea.value = currentDescription;
    textarea.placeholder = 'Enter deck description (max 200 characters)';
    textarea.rows = 2;
    textarea.style.resize = 'none';
    textarea.maxLength = 200;
    
    // Create character counter
    const counter = document.createElement('div');
    counter.className = 'character-counter';
    counter.style.cssText = 'font-size: 0.8rem; color: #bdc3c7; text-align: right; margin-top: 4px;';
    counter.textContent = `${currentDescription.length}/200`;
    
    // Replace content with textarea and counter
    descElement.innerHTML = '';
    descElement.appendChild(textarea);
    descElement.appendChild(counter);
    descElement.classList.add('editing');
    
    // Focus and select text
    textarea.focus();
    textarea.select();
    
    // Update counter on input
    textarea.addEventListener('input', () => {
        counter.textContent = `${textarea.value.length}/200`;
        if (textarea.value.length > 120) {
            counter.style.color = '#e74c3c';
        } else if (textarea.value.length > 100) {
            counter.style.color = '#f39c12';
        } else {
            counter.style.color = '#bdc3c7';
        }
    });
    
    // Handle save on blur or enter (with Ctrl/Cmd)
    textarea.addEventListener('blur', () => saveDescriptionEdit(textarea));
    textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            saveDescriptionEdit(textarea);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cancelDescriptionEdit(textarea, currentDescription);
        }
    });
}

function saveTitleEdit(input) {
    const newTitle = input.value.trim();
    const titleElement = document.getElementById('deckEditorTitle');
    
    if (newTitle && newTitle !== currentDeckData?.metadata?.name) {
        // Update the deck data
        if (currentDeckData) {
            currentDeckData.metadata.name = newTitle;
        }
        
        // Update the display
        titleElement.textContent = newTitle;
        titleElement.classList.remove('editing');
        
        // Show save indicator only for non-guest users
        if (!isGuestUser()) {
            showNotification('Title updated - remember to save changes', 'info');
        }
    } else {
        // Revert to original
        titleElement.textContent = currentDeckData?.metadata?.name || 'Edit Deck';
        titleElement.classList.remove('editing');
    }
}

function saveDescriptionEdit(textarea) {
    let newDescription = textarea.value.trim();
    
    // Truncate to 200 characters if needed
    if (newDescription.length > 200) {
        newDescription = newDescription.substring(0, 200);
    }
    
    const descElement = document.getElementById('deckEditorDescription');
    
    // Update the deck data
    if (currentDeckData) {
        currentDeckData.metadata.description = newDescription;
    }
    
    // Update the display
    if (newDescription) {
        descElement.textContent = newDescription;
        descElement.classList.remove('placeholder');
        descElement.style.display = 'block';
    } else {
        descElement.textContent = '';
        descElement.classList.add('placeholder');
        descElement.style.display = 'none';
    }
    
    descElement.classList.remove('editing');
    
    // Show save indicator only for non-guest users
    if (!isGuestUser()) {
        showNotification('Description updated - remember to save changes', 'info');
    }
}

function cancelTitleEdit(input, originalTitle) {
    const titleElement = document.getElementById('deckEditorTitle');
    titleElement.textContent = originalTitle;
    titleElement.classList.remove('editing');
}

function cancelDescriptionEdit(textarea, originalDescription) {
    const descElement = document.getElementById('deckEditorDescription');
    if (originalDescription) {
        descElement.textContent = originalDescription;
        descElement.classList.remove('placeholder');
        descElement.style.display = 'block';
    } else {
        descElement.textContent = '';
        descElement.classList.add('placeholder');
        descElement.style.display = 'none';
    }
    descElement.classList.remove('editing');
}
