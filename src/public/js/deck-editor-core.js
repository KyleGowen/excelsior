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
        
        // Add body class for deck editor specific styling
        document.body.classList.add('deck-editor-active');
        
        // Show Export and Import buttons for all users (GUEST, USER, ADMIN)
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.style.display = 'inline-block';
        }
        
        const importBtn = document.getElementById('importBtn');
        if (importBtn) {
            importBtn.style.display = 'inline-block';
        }
        
        // Apply layout immediately to prevent flash
        setTimeout(() => {
            const layout = document.querySelector('.deck-editor-layout');
            const deckPane = document.querySelector('.deck-pane');
            if (layout && deckPane) {
                const layoutWidth = layout.offsetWidth;
                const deckWidth = deckPane.offsetWidth;
                const deckPercentage = (deckWidth / layoutWidth) * 100;
                
                // Apply two-column layout immediately if deck is wide enough
                if (deckPercentage >= 33) {
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
        
        // Default to 71% for deck pane (29% for available cards) for new decks
        const defaultPercentage = 71;
        const percentage = uiPrefs && uiPrefs.dividerPosition ? uiPrefs.dividerPosition : defaultPercentage;
        
        // Use a small delay to ensure the modal is rendered
        setTimeout(() => {
            const layout = document.querySelector('.deck-editor-layout');
            const deckPane = document.querySelector('.deck-pane');
            if (layout && deckPane) {
                const newWidth = (percentage / 100) * layout.offsetWidth;
                deckPane.style.flex = `0 0 ${newWidth}px`;
            }
        }, 10);
        
        // Read-only mode removed - now handled by backend flag
        
        // Title is already set to the deck name, no need to override it
        
        // Hide/show Save button based on guest status and read-only mode
        const saveButton = document.getElementById('saveDeckButton');
        if (saveButton) {
            // SECURITY: Check for read-only mode first
            if (document.body.classList.contains('read-only-mode')) {
                // Disable Save button in read-only mode
                saveButton.disabled = true;
                saveButton.style.opacity = '0.5';
                saveButton.style.cursor = 'not-allowed';
                saveButton.title = 'Save is disabled in read-only mode';
                saveButton.style.display = 'block';
            } else if (isGuestUser()) {
                // Disable Save button for guest users
                saveButton.disabled = true;
                saveButton.style.opacity = '0.5';
                saveButton.style.cursor = 'not-allowed';
                saveButton.title = 'Guests cannot save edits';
                saveButton.style.display = 'block';
            } else {
                // Enable Save button for regular users in edit mode
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
    // Note: Read-only mode is now determined by API response and ownership checks below
    
    // Handle new deck creation
    if (deckId === 'new') {
        currentDeckId = null; // No ID until saved
        currentDeckData = {
            metadata: {
                id: null,
                name: 'New Deck',
                description: '',
                created: new Date().toISOString(),
                lastModified: new Date().toISOString(),
                cardCount: 0,
                userId: getCurrentUser() ? (getCurrentUser().userId || getCurrentUser().id) : 'guest'
            },
            cards: []
        };
        window.deckEditorCards = [];
        // Read-only mode removed - now handled by backend flag
        
        // Show the deck editor modal
        document.getElementById('deckEditorModal').style.display = 'block';
            
            // Ensure search component is initialized for new deck flow as well
            if (typeof initializeDeckEditorSearch === 'function') {
                try {
                    initializeDeckEditorSearch();
                } catch (err) {
                    console.error('Failed to initialize deck editor search for new deck:', err);
                }
            }
        
        // Load available cards
        if (typeof loadAvailableCards === 'function') {
            try {
                await loadAvailableCards();
            } catch (error) {
                console.error('[DeckEditor] Error calling loadAvailableCards:', error);
            }
        } else {
            console.error('[DeckEditor] ❌ loadAvailableCards function not found!');
            console.error('[DeckEditor] Available functions:', Object.keys(window).filter(k => k.includes('load') || k.includes('card')));
        }
        
        // Update card count
        if (typeof updateDeckCardCount === 'function') {
            updateDeckCardCount();
        }
        
        // Update deck summary to set proper button states
        if (typeof updateDeckSummary === 'function') {
            updateDeckSummary(window.deckEditorCards);
        }
        
        // Set initial view based on user role for new decks
        await viewManager.applyInitialView();
        
        // Initialize background manager for new decks (admin only)
        // Use setTimeout to ensure DOM is fully ready
        setTimeout(async () => {
            if (window.deckBackgroundManager) {
                try {
                    const currentUser = getCurrentUser();
                    if (currentUser && currentUser.role === 'ADMIN') {
                        await window.deckBackgroundManager.loadBackgrounds();
                        window.deckBackgroundManager.createBackgroundButton();
                    }
                } catch (error) {
                    console.error('Error initializing background manager for new deck:', error);
                }
            }
        }, 500); // Small delay to ensure DOM is ready
        
        return;
    }
    
    currentDeckId = deckId; // Set the current deck ID
    try {
        const response = await fetch(`/api/decks/${deckId}`, {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (data.success) {
            currentDeckData = data.data;
            window.deckEditorCards = [...data.data.cards]; // Create working copy
            
            // Load background immediately from deck data (before other initialization)
            if (window.deckBackgroundManager && currentDeckData.metadata) {
                window.deckBackgroundManager.setBackgroundFromDeckData(currentDeckData.metadata);
            }
            
            // Convert database type format to frontend format
            window.deckEditorCards = window.deckEditorCards.map(card => {
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
            
            // Determine read-only mode based on URL parameter and ownership
            const urlParams = new URLSearchParams(window.location.search);
            const isReadOnlyFromQuery = urlParams.get('readonly') === 'true';
            const isDeckOwner = data.data.metadata && data.data.metadata.isOwner === true;
            
            if (isReadOnlyFromQuery) {
                // If readonly=true is in URL, always use read-only mode (regardless of ownership)
                isReadOnlyMode = true;
            } else if (data.data.metadata && data.data.metadata.isOwner !== undefined) {
                // Use API response for ownership-based read-only mode
                // Non-owners should always be in read-only mode
                isReadOnlyMode = !data.data.metadata.isOwner;
            } else {
                // Fallback: if no ownership info, assume read-only for safety
                isReadOnlyMode = true;
            }
            
            // Update the body class to reflect the correct read-only mode
            if (isReadOnlyMode) {
                document.body.classList.add('read-only-mode');
            } else {
                document.body.classList.remove('read-only-mode');
            }
            
            // Update Read-Only badge visibility
            updateReadOnlyBadge();
            
            // Update Save button state based on read-only mode
            updateSaveButtonState();
            
            // Now set up drag and drop based on the correct read-only mode
            setupDragAndDrop();
            
            // Validate and fix location count (max 1 location allowed)
            const locationCards = window.deckEditorCards.filter(card => card.type === 'location');
            if (locationCards.length > 1) {
                // Keep only the first location card
                const firstLocationIndex = window.deckEditorCards.findIndex(card => card.type === 'location');
                window.deckEditorCards = window.deckEditorCards.filter((card, index) => 
                    card.type !== 'location' || index === firstLocationIndex
                );
                showNotification(`Removed ${locationCards.length - 1} extra location card(s) - only 1 location allowed per deck`, 'warning');
            }
            
            // Set limited state from loaded deck
            isDeckLimited = currentDeckData.metadata.is_limited || false;
            
            // Update modal title
            document.getElementById('deckEditorTitle').textContent = currentDeckData.metadata.name;
            
            // Update deck title validation
            updateDeckTitleValidation(currentDeckData.cards || []);
            
            // Load available cards first, then display deck cards
            if (typeof loadAvailableCards === 'function') {
                try {
                    await loadAvailableCards();
                } catch (error) {
                    console.error('[DeckEditor] Error calling loadAvailableCards:', error);
                    console.error('[DeckEditor] Error stack:', error.stack);
                }
            } else {
                console.error('[DeckEditor] ❌ loadAvailableCards function not found!');
            }
            
            // Display deck cards after available cards are loaded
            // Apply the initial view based on user role (set during ViewManager.initialize())
            await viewManager.applyInitialView();
            
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
            
            // Initialize background manager (loads background for all users, button only for admin)
            // Use setTimeout to ensure DOM is fully ready
            setTimeout(async () => {
                if (window.deckBackgroundManager && currentDeckId) {
                    try {
                        // Pass read-only mode flag
                        // Background is already set from deck data above, just initialize UI
                        await window.deckBackgroundManager.initialize(currentDeckId, isReadOnlyMode);
                    } catch (error) {
                        console.error('Error initializing background manager:', error);
                    }
                }
            }, 500); // Small delay to ensure DOM is ready
            
            // Auto-activate special cards character filter if deck has characters
            const hasCharacters = window.deckEditorCards.some(card => card.type === 'character');
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
            console.error('Failed to load deck for editing:', data.error);
            showNotification('Deck not found or access denied: ' + data.error, 'error');
            
            // Redirect to user's deck list if deck doesn't exist or access denied
            const currentUser = getCurrentUser();
            if (currentUser) {
                setTimeout(() => {
                    window.location.href = `/users/${currentUser.userId || currentUser.id}/decks`;
                }, 2000);
            } else {
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);
            }
            return;
        }
    } catch (error) {
        console.error('❌ Error loading deck for editing:', error);
        showNotification('Failed to load deck for editing', 'error');
        
        // Redirect to user's deck list on network errors too
        const currentUser = getCurrentUser();
        if (currentUser) {
            setTimeout(() => {
                window.location.href = `/users/${currentUser.userId || currentUser.id}/decks`;
            }, 2000);
        } else {
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
        }
        return;
    }
}

// Save deck changes
async function saveDeckChanges() {
    if (!currentDeckData) {
        console.error('❌ Cannot save - no deck data loaded');
        return;
    }
    
    // SECURITY: Check if deck exists before attempting to save
    if (currentDeckId && !currentDeckData.metadata?.id) {
        console.error('🔒 SECURITY: Cannot save - deck does not exist or is invalid');
        showNotification('Cannot save: Deck not found or invalid', 'error');
        
        // Redirect to user's deck list
        const currentUser = getCurrentUser();
        if (currentUser) {
            setTimeout(() => {
                window.location.href = `/users/${currentUser.userId || currentUser.id}/decks`;
            }, 2000);
        }
        return;
    }
    
    // SECURITY: Check for read-only mode first
    if (document.body.classList.contains('read-only-mode')) {
        alert('Cannot save changes in read-only mode.');
        return;
    }
    
    // Check if user is guest - guests cannot save any changes
    if (isGuestUser()) {
        alert('Guests cannot save edits. Please log in to save deck changes.');
        return;
    }
    
    // Read-only mode removed - now handled by backend flag
    
    
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
        const cardsData = window.deckEditorCards.map(card => {
            const cardData = {
                cardType: card.type,
                cardId: card.cardId,
                quantity: card.quantity
            };
            
            // Include exclude_from_draw flag if present (for Training cards with Spartan Training Ground)
            if (card.exclude_from_draw !== undefined) {
                cardData.exclude_from_draw = card.exclude_from_draw;
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
        const validation = validateDeck(window.deckEditorCards);
        const isDeckValid = validation.errors.length === 0;
        
        // Save deck metadata (name, is_limited, is_valid, reserve_character, and background_image_path)
        const backgroundPath = window.deckBackgroundManager ? window.deckBackgroundManager.getSelectedBackground() : null;
        console.log('Saving deck with background_image_path:', backgroundPath);
        console.log('deckBackgroundManager exists:', !!window.deckBackgroundManager);
        console.log('currentDeckId:', currentDeckId);
        
        const deckUpdateData = {
            name: currentDeckData.metadata.name,
            description: '',
            is_limited: isDeckLimited,
            is_valid: isDeckValid,
            reserve_character: currentDeckData.metadata.reserve_character,
            background_image_path: backgroundPath
        };
        console.log('Deck update payload:', deckUpdateData);
        
        const updateResponse = await fetch(`/api/decks/${currentDeckId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(deckUpdateData)
        });
        
        if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            console.error('Failed to update deck metadata:', errorText);
            throw new Error('Failed to update deck metadata');
        }
        
        const updateResult = await updateResponse.json();
        console.log('Deck update response:', updateResult);
        
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

// Export deck as JSON (Available to all users)
// Function moved to deck-export.js component module
// Access via window.exportDeckAsJson() or import from deck-export.js

// Import deck from JSON (Available to all users)
// Function moved to deck-export.js component module
// Access via window.importDeckFromJson() or import from deck-export.js








// Close deck editor modal
async function closeDeckEditor() {
    // Close draw hand pane first to clear any drawn cards
    closeDrawHand();
    
    // Save UI preferences before closing
    if (currentDeckId) {
        const preferences = getCurrentUIPreferences();
        await saveUIPreferences(currentDeckId, preferences);
    }
    
    document.getElementById('deckEditorModal').style.display = 'none';
    
    // Remove body class for deck editor specific styling
    document.body.classList.remove('deck-editor-active');
    
    currentDeckId = null;
    currentDeckData = null;
    window.deckEditorCards = [];
    
    // Return to deck builder selection screen
    switchToDeckBuilder();
}

// Export Overlay Functions
// Functions moved to deck-export.js component module
// Access via window.showExportOverlay(), window.closeExportOverlay(), window.copyJsonToClipboard()
// or import from deck-export.js


// Export Overlay Functions
// Functions moved to deck-export.js component module
// Access via window.showExportOverlay(), window.closeExportOverlay(), window.copyJsonToClipboard()
// or import from deck-export.js
