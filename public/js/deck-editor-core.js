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

// Load deck for editing
async function loadDeckForEditing(deckId, urlUserId = null, isReadOnly = false) {
    console.log('loadDeckForEditing called with deckId:', deckId);
    currentDeckId = deckId; // Set the current deck ID
    try {
        const response = await fetch(`/api/decks/${deckId}`, {
            credentials: 'include'
        });
        const data = await response.json();
        console.log('Deck data loaded:', data);
        
        if (data.success) {
            currentDeckData = data.data;
            deckEditorCards = [...data.data.cards]; // Create working copy
            
            // Convert database type format to frontend format
            deckEditorCards = deckEditorCards.map(card => {
                let convertedType = card.type;
                if (card.type === 'ally_universe') {
                    convertedType = 'ally-universe';
                } else if (card.type === 'basic_universe') {
                    convertedType = 'basic-universe';
                } else if (card.type === 'advanced_universe') {
                    convertedType = 'advanced-universe';
                }
                return { ...card, type: convertedType };
            });
            
            console.log('Working copy created:', deckEditorCards);
            
            // Check if readonly=true query parameter is set - this takes precedence
            const urlParams = new URLSearchParams(window.location.search);
            const isReadOnlyFromQuery = urlParams.get('readonly') === 'true';
            
            if (isReadOnlyFromQuery) {
                // Force read-only mode when readonly=true query parameter is present
                isReadOnlyMode = true;
                console.log('Forcing read-only mode due to readonly=true query parameter');
            } else if (data.data.metadata && data.data.metadata.isOwner !== undefined) {
                // Only use API response if no readonly query parameter is set
                isReadOnlyMode = !data.data.metadata.isOwner;
                console.log('Updated read-only mode from API:', isReadOnlyMode, 'isOwner:', data.data.metadata.isOwner);
            }
            
            // Update the body class to reflect the correct read-only mode
            document.body.classList.toggle('read-only-mode', isReadOnlyMode);
            
            // Update the modal class as well
            const modal = document.getElementById('deckEditorModal');
            if (modal) {
                modal.classList.toggle('read-only-mode', isReadOnlyMode);
            }
            
            // Now set up drag and drop based on the correct read-only mode
            setupDragAndDrop();
            
            // Validate and fix location count (max 1 location allowed)
            const locationCards = deckEditorCards.filter(card => card.type === 'location');
            if (locationCards.length > 1) {
                console.log(`Found ${locationCards.length} location cards, removing extra ones`);
                // Keep only the first location card
                const firstLocationIndex = deckEditorCards.findIndex(card => card.type === 'location');
                deckEditorCards = deckEditorCards.filter((card, index) => 
                    card.type !== 'location' || index === firstLocationIndex
                );
                showNotification(`Removed ${locationCards.length - 1} extra location card(s) - only 1 location allowed per deck`, 'warning');
            }
            
            // Set limited state from loaded deck
            isDeckLimited = currentDeckData.metadata.is_limited || false;
            
            // Update modal title and description
            document.getElementById('deckEditorTitle').textContent = currentDeckData.metadata.name;
            
            // Update deck title validation
            updateDeckTitleValidation(currentDeckData.cards || []);
            const descriptionElement = document.getElementById('deckEditorDescription');
            if (currentDeckData.metadata.description) {
                descriptionElement.textContent = currentDeckData.metadata.description;
                descriptionElement.classList.remove('placeholder');
                descriptionElement.style.display = 'block';
            } else {
                descriptionElement.textContent = 'Click to add description';
                descriptionElement.classList.add('placeholder');
                descriptionElement.style.display = 'block';
            }
            
            // Load available cards first, then display deck cards
            await loadAvailableCards();
            
            // Display deck cards after available cards are loaded
            await displayDeckCardsForEditing();
            
            // Ensure scroll container can show all content after deck is displayed
            setTimeout(() => {
                ensureScrollContainerCanShowAllContent();
                
                // Also check if any collapsed headers are cut off and fix them
                const collapsedHeaders = document.querySelectorAll('.deck-type-header.collapsed');
                collapsedHeaders.forEach(header => {
                    ensureCollapsedHeaderIsVisible(header);
                });
            }, 100);
            
            // Load UI preferences from database AFTER deck cards are displayed
            const uiPreferences = await loadUIPreferences(deckId);
            applyUIPreferences(uiPreferences);
            
            // Force character cards to single column layout
            setTimeout(() => {
                forceCharacterSingleColumnLayout();
            }, 200);
            
            // Also run it immediately as a backup
            forceCharacterSingleColumnLayout();
            
            // Set up layout observer if in list view
            const deckCardsEditor = document.getElementById('deckCardsEditor');
            if (deckCardsEditor && deckCardsEditor.classList.contains('list-view')) {
                setupLayoutObserver();
            }
            
            // Update card count
            updateDeckEditorCardCount();
            
            // Auto-activate special cards character filter if deck has characters
            const hasCharacters = deckEditorCards.some(card => card.type === 'character');
            if (hasCharacters) {
                setTimeout(async () => {
                    const filterCheckbox = document.getElementById('specialCardsCharacterFilter');
                    if (filterCheckbox && !filterCheckbox.checked) {
                        filterCheckbox.checked = true;
                        await toggleSpecialCardsCharacterFilter();
                    }
                }, 100); // Small delay to ensure DOM is updated
            }
        } else {
            showNotification('Failed to load deck for editing: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Error loading deck for editing:', error);
        showNotification('Failed to load deck for editing', 'error');
    }
}

// Save deck changes
async function saveDeckChanges() {
    
    if (!currentDeckData) return;
    
    // Check if user is guest - guests cannot save any changes
    if (isGuestUser()) {
        alert('Guests cannot save edits. Please log in to save deck changes.');
        return;
    }
    
    // Check if in read-only mode
    if (isReadOnlyMode) {
        alert('Cannot save changes in read-only mode. You are viewing another user\'s deck.');
        return;
    }
    
    
    try {
        let deckId = currentDeckId;
        
        // If this is the first save (no deckId), create the deck first
        if (!deckId) {
            const createResponse = await fetch('/api/decks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    name: currentDeckData.metadata.name,
                    description: currentDeckData.metadata.description || '',
                    ui_preferences: currentDeckData.ui_preferences
                })
            });
            
            if (!createResponse.ok) {
                const errorData = await createResponse.json();
                throw new Error(errorData.error || 'Failed to create deck');
            }
            
            const createData = await createResponse.json();
            if (!createData.success) {
                throw new Error(createData.error || 'Failed to create deck');
            }
            
            // Update the deck ID and data with the response
            deckId = createData.data.id;
            currentDeckId = deckId;
            currentDeckData.metadata.id = deckId;
            currentDeckData.metadata.created = createData.data.created_at;
            currentDeckData.metadata.lastModified = createData.data.updated_at;
            
            // Update URL to include the new deck ID for sharing
            const currentUser = getCurrentUser();
            const userId = currentUser ? (currentUser.userId || currentUser.id || 'guest') : 'guest';
            const newUrl = `/users/${userId}/decks/${currentDeckId}`;
            window.history.pushState({ deckId: currentDeckId, userId }, '', newUrl);
            
        }
        
        // Prepare cards data for bulk replacement
        const cardsData = deckEditorCards.map(card => {
            const cardData = {
                cardType: card.type,
                cardId: card.cardId,
                quantity: card.quantity
            };
            
            // Include selectedAlternateImage if it exists
            if (card.selectedAlternateImage) {
                cardData.selectedAlternateImage = card.selectedAlternateImage;
            }
            
            return cardData;
        });
        
        // Bulk replace all cards in one atomic operation
        const replaceResponse = await fetch(`/api/decks/${deckId}/cards`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ cards: cardsData })
        });
        
        if (!replaceResponse.ok) {
            throw new Error('Failed to save deck cards');
        }
        
        // Check validation status before saving
        const validation = validateDeck(deckEditorCards);
        const isDeckValid = validation.errors.length === 0;
        
        // Save deck metadata (name, description, is_limited, is_valid, and reserve_character)
        await fetch(`/api/decks/${currentDeckId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                name: currentDeckData.metadata.name,
                description: currentDeckData.metadata.description || '',
                is_limited: isDeckLimited,
                is_valid: isDeckValid,
                reserve_character: currentDeckData.metadata.reserve_character
            })
        });
        
        // Save expansion state
        saveDeckExpansionState();
        
        // Save UI preferences to database
        const preferences = getCurrentUIPreferences();
        await saveUIPreferences(currentDeckId, preferences);
        
        // Show appropriate notification based on validation status
        if (isDeckValid) {
            showNotification('Deck changes saved successfully!', 'success');
        } else {
            showNotification('Deck saved with validation errors - not legal for tournament play', 'warning');
        }
        
        // Don't close the editor - just refresh the deck list
        loadDecks();
        
    } catch (error) {
        console.error('Error saving deck changes:', error);
        showNotification('Failed to save deck changes', 'error');
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
