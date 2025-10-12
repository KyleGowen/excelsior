// Deck Editor Core Functions
// Extracted from index.html for better modularity

// Show deck editor modal
function showDeckEditor() {
    try {
        const modal = document.getElementById('deckEditorModal');
        if (!modal) {
            console.error('deckEditorModal not found');
            return;
        }
        modal.style.display = 'flex';
        
        // Apply layout immediately to prevent flash
        setTimeout(() => {
            const layout = document.querySelector('.deck-editor-layout');
            const deckPane = document.querySelector('.deck-pane');
            if (layout && deckPane) {
                const layoutWidth = layout.offsetWidth;
                const deckWidth = deckPane.offsetWidth;
                const deckPercentage = (deckWidth / layoutWidth) * 100;
                
                // Apply two-column layout immediately if deck is wide enough
                if (deckPercentage >= 33 && !isReadOnlyMode) {
                    const deckCardsEditor = document.querySelector('.deck-cards-editor');
                    if (deckCardsEditor && !manageDeckLayout('hasClass', { className: 'list-view' })) {
                        manageDeckLayout('addClass', { className: 'two-column' });
                        createTwoColumnLayout();
                    }
                }
            }
        }, 10); // Very short delay to ensure elements are rendered
        
        // Ensure the deck editor starts scrolled to the top
        setTimeout(() => {
            const deckCardsEditor = document.querySelector('.deck-cards-editor');
            if (deckCardsEditor) {
                deckCardsEditor.scrollTop = 0;
            }
        }, 50);
        
        // Set initial divider position immediately to prevent 50% flash
        const uiPrefs = currentDeckData
            ? (currentDeckData.ui_preferences || (currentDeckData.metadata && currentDeckData.metadata.ui_preferences))
            : null;
        if (uiPrefs && uiPrefs.dividerPosition) {
            const percentage = uiPrefs.dividerPosition;
            // Use a small delay to ensure the modal is rendered
            setTimeout(() => {
                const layout = document.querySelector('.deck-editor-layout');
                const deckPane = document.querySelector('.deck-pane');
                if (layout && deckPane) {
                    const newWidth = (percentage / 100) * layout.offsetWidth;
                    deckPane.style.flex = `0 0 ${newWidth}px`;
                }
            }, 10);
        }
        
        // Add/remove read-only-mode class to modal
        if (isReadOnlyMode) {
            modal.classList.add('read-only-mode');
            
        } else {
            modal.classList.remove('read-only-mode');
        }
        
        // Show/hide read-only indicator
        const readOnlyIndicator = document.getElementById('readOnlyIndicator');
        if (readOnlyIndicator) {
            readOnlyIndicator.style.display = isReadOnlyMode ? 'block' : 'none';
        }
        
        // Make title and description non-editable in read-only mode
        const titleElement = document.getElementById('deckEditorTitle');
        const descriptionElement = document.getElementById('deckEditorDescription');
        
        if (isReadOnlyMode) {
            // Remove editable classes and click handlers
            if (titleElement) {
                titleElement.classList.remove('editable-title');
                titleElement.style.cursor = 'default';
                titleElement.onclick = null;
            }
            if (descriptionElement) {
                descriptionElement.classList.remove('editable-description');
                descriptionElement.style.cursor = 'default';
                descriptionElement.onclick = null;
            }
        } else {
            // Restore editable classes and click handlers
            if (titleElement) {
                titleElement.classList.add('editable-title');
                titleElement.style.cursor = 'pointer';
                titleElement.onclick = startEditingTitle;
            }
            if (descriptionElement) {
                descriptionElement.classList.add('editable-description');
                descriptionElement.style.cursor = 'pointer';
                descriptionElement.onclick = startEditingDescription;
            }
        }
        
        // Title is already set to the deck name, no need to override it
        
        // Hide/show Save button based on mode and guest status
        const saveButton = document.getElementById('saveDeckButton');
        if (saveButton) {
            if (isReadOnlyMode) {
                saveButton.style.display = 'none';
            } else if (isGuestUser()) {
                // Disable Save button for guest users
                saveButton.disabled = true;
                saveButton.style.opacity = '0.5';
                saveButton.style.cursor = 'not-allowed';
                saveButton.title = 'Guests cannot save edits..';
                saveButton.style.display = 'block';
            } else {
                // Enable Save button for regular users
                saveButton.disabled = false;
                saveButton.style.opacity = '1';
                saveButton.style.cursor = 'pointer';
                saveButton.title = '';
                saveButton.style.display = 'block';
            }
        }
        
        // Don't set up drag and drop immediately - wait for API response to determine read-only mode
        // setupDragAndDrop() will be called after loadDeckForEditing() completes
        
        // Initialize deck editor search
        initializeDeckEditorSearch();
        
        // Initialize the resizable divider after the modal is shown
        setTimeout(() => {
            initializeResizableDivider();
            // Restore slider position after a short delay to ensure layout is ready
            setTimeout(() => {
                restoreSliderPosition();
                // Also check initial layout
                const layout = document.querySelector('.deck-editor-layout');
                const deckPane = document.querySelector('.deck-pane');
                if (layout && deckPane) {
                    updateDeckLayout(deckPane.offsetWidth, layout.offsetWidth);
                }
                // Only ensure layout if it appears broken
                if (layout && window.getComputedStyle(layout).flexDirection !== 'row') {
                    ensureTwoPaneLayout();
                }
            }, 200);
        }, 100);
    } catch (error) {
        console.error('Error in showDeckEditor:', error);
    }
}

// Close deck editor modal
async function closeDeckEditor() {
    // Save UI preferences before closing
    if (currentDeckId) {
        const preferences = getCurrentUIPreferences();
        await saveUIPreferences(currentDeckId, preferences);
    }
    
    document.getElementById('deckEditorModal').style.display = 'none';
    currentDeckId = null;
    currentDeckData = null;
    deckEditorCards = [];
    
    // Return to deck builder selection screen
    switchToDeckBuilder();
}
