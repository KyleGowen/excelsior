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
            // Also detect if cardId is an alternate art and set selectedAlternateCardId accordingly
            window.deckEditorCards = window.deckEditorCards.map(card => {
                let convertedType = card.type;
                if (card.type === 'ally_universe') {
                    convertedType = 'ally-universe';
                } else if (card.type === 'basic_universe') {
                    convertedType = 'basic-universe';
                } else if (card.type === 'advanced_universe') {
                    convertedType = 'advanced-universe';
                }
                
                const convertedCard = { ...card, type: convertedType };
                
                // Note: We'll process alternate art detection after availableCardsMap is loaded
                // This will be done in a separate step after loadAvailableCards completes
                
                return convertedCard;
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
            
            // After available cards are loaded, process deck cards to detect alternate art selections
            // If a cardId is an alternate art card, find the base card and set selectedAlternateCardId
            if (window.availableCardsMap && window.deckEditorCards) {
                window.deckEditorCards = window.deckEditorCards.map(card => {
                    // Check if this cardId corresponds to an alternate art card
                    const cardData = window.availableCardsMap.get(card.cardId);
                    if (!cardData) {
                        console.warn('[DeckEditor] Card not found in availableCardsMap:', card.cardId);
                        return card;
                    }
                    
                    // Check if this is an alternate art by checking image path
                    const imagePath = cardData.image_path || cardData.image || '';
                    const isAlternateArt = imagePath && imagePath.includes('/alternate/');
                    
                    console.log('[DeckEditor] Processing card for alternate art detection:', {
                        cardId: card.cardId,
                        cardType: card.type,
                        imagePath: imagePath,
                        isAlternateArt: isAlternateArt,
                        hasSelectedAlternateCardId: !!card.selectedAlternateCardId
                    });
                    
                    if (isAlternateArt) {
                        // This cardId is an alternate art, find the base card
                        let baseCardId = null;
                        let baseCard = null;
                        
                        // Find base card by searching for cards with same name/universe but non-alternate image
                        if (card.type === 'character') {
                            const name = (cardData.name || '').trim();
                            const set = (cardData.set || 'ERB').trim() || 'ERB';
                            
                            window.availableCardsMap.forEach((candidateCard, candidateId) => {
                                const candidateType = candidateCard.cardType || candidateCard.type || '';
                                if ((candidateType === 'character' || candidateId.startsWith('char_')) &&
                                    (candidateCard.name || '').trim() === name &&
                                    (candidateCard.set || 'ERB').trim() === set) {
                                    const candidateImagePath = candidateCard.image_path || candidateCard.image || '';
                                    if (!candidateImagePath.includes('/alternate/')) {
                                        baseCardId = candidateId;
                                        baseCard = candidateCard;
                                    }
                                }
                            });
                        } else if (card.type === 'special') {
                            const name = (cardData.name || '').trim();
                            const characterName = (cardData.character_name || '').trim();
                            const universe = (cardData.universe || 'ERB').trim() || 'ERB';
                            
                            window.availableCardsMap.forEach((candidateCard, candidateId) => {
                                const candidateType = candidateCard.cardType || candidateCard.type || '';
                                if ((candidateType === 'special' || candidateId.startsWith('special_')) &&
                                    (candidateCard.name || '').trim() === name &&
                                    (candidateCard.character_name || '').trim() === characterName &&
                                    (candidateCard.universe || 'ERB').trim() === universe) {
                                    const candidateImagePath = candidateCard.image_path || candidateCard.image || '';
                                    if (!candidateImagePath.includes('/alternate/')) {
                                        baseCardId = candidateId;
                                        baseCard = candidateCard;
                                    }
                                }
                            });
                        } else if (card.type === 'power') {
                            const value = String(cardData.value || '').trim();
                            const powerType = (cardData.power_type || '').trim();
                            
                            window.availableCardsMap.forEach((candidateCard, candidateId) => {
                                const candidateType = candidateCard.cardType || candidateCard.type || '';
                                if ((candidateType === 'power' || candidateId.startsWith('power_')) &&
                                    String(candidateCard.value || '').trim() === value &&
                                    (candidateCard.power_type || '').trim() === powerType) {
                                    const candidateImagePath = candidateCard.image_path || candidateCard.image || '';
                                    if (!candidateImagePath.includes('/alternate/')) {
                                        baseCardId = candidateId;
                                        baseCard = candidateCard;
                                    }
                                }
                            });
                        }
                        
                        if (baseCardId && baseCard) {
                            // Found base card, set selectedAlternateCardId to the alternate card ID
                            console.log('[DeckEditor] Detected alternate art card, setting selectedAlternateCardId:', {
                                originalCardId: card.cardId,
                                baseCardId: baseCardId,
                                alternateCardId: card.cardId,
                                cardType: card.type
                            });
                            
                            return {
                                ...card,
                                cardId: baseCardId, // Use base card ID for grouping
                                selectedAlternateCardId: card.cardId, // Store alternate card ID as selected
                                // For quantity > 1, initialize selectedAlternateCardIds array
                                selectedAlternateCardIds: card.quantity > 1 ? Array(card.quantity).fill(card.cardId) : undefined
                            };
                        } else {
                            // Could not find base card - this might mean the cardId IS the base card
                            // or it's an alternate art but we can't find the base
                            // In this case, keep the cardId as-is but still set selectedAlternateCardId
                            // This handles edge cases where alternate arts might not have a clear base
                            console.warn('[DeckEditor] Could not find base card for alternate art, keeping cardId as-is:', {
                                cardId: card.cardId,
                                cardType: card.type,
                                imagePath: imagePath
                            });
                            
                            // Still set selectedAlternateCardId to indicate this is the selected art
                            // The cardId might already be correct (alternate art card ID)
                            return {
                                ...card,
                                selectedAlternateCardId: card.cardId, // Mark as selected
                                selectedAlternateCardIds: card.quantity > 1 ? Array(card.quantity).fill(card.cardId) : undefined
                            };
                        }
                    }
                    
                    return card;
                });
                
                // Consolidate multiple entries for the same base card with different alternate arts
                // Only consolidate if there are actually multiple entries for the same base card
                // Group by base cardId (after alternate art detection) and type
                const cardGroups = new Map();
                
                window.deckEditorCards.forEach(card => {
                    const key = `${card.type}_${card.cardId}`;
                    if (!cardGroups.has(key)) {
                        cardGroups.set(key, []);
                    }
                    cardGroups.get(key).push(card);
                });
                
                // Only consolidate if there are multiple entries for the same base card
                const needsConsolidation = Array.from(cardGroups.values()).some(group => group.length > 1);
                
                if (needsConsolidation) {
                    const consolidatedCards = new Map();
                    
                    cardGroups.forEach((group, key) => {
                        if (group.length === 1) {
                            // Single entry, no consolidation needed - just ensure selectedAlternateCardIds is set if needed
                            const card = group[0];
                            const alternateId = card.selectedAlternateCardId || card.cardId;
                            
                            if (card.quantity > 1 && !card.selectedAlternateCardIds) {
                                // Initialize array if quantity > 1
                                card.selectedAlternateCardIds = Array(card.quantity).fill(alternateId);
                                card.selectedAlternateCardId = undefined; // Clear single ID when using array
                            } else if (card.quantity === 1 && !card.selectedAlternateCardId && alternateId !== card.cardId) {
                                // Set selectedAlternateCardId if we have an alternate
                                card.selectedAlternateCardId = alternateId;
                            }
                            
                            consolidatedCards.set(key, card);
                        } else {
                            // Multiple entries - consolidate them
                            const firstCard = group[0];
                            const consolidated = {
                                ...firstCard,
                                quantity: 0,
                                selectedAlternateCardIds: []
                            };
                            
                            group.forEach(entry => {
                                consolidated.quantity += entry.quantity;
                                const alternateId = entry.selectedAlternateCardId || entry.cardId;
                                
                                // Add alternate ID for each instance
                                for (let i = 0; i < entry.quantity; i++) {
                                    consolidated.selectedAlternateCardIds.push(alternateId);
                                }
                            });
                            
                            // Set selectedAlternateCardId only if quantity is 1
                            if (consolidated.quantity === 1 && consolidated.selectedAlternateCardIds.length > 0) {
                                consolidated.selectedAlternateCardId = consolidated.selectedAlternateCardIds[0];
                            } else {
                                consolidated.selectedAlternateCardId = undefined;
                            }
                            
                            consolidatedCards.set(key, consolidated);
                        }
                    });
                    
                    const beforeConsolidation = window.deckEditorCards.length;
                    window.deckEditorCards = Array.from(consolidatedCards.values());
                    
                    console.log('[DeckEditor] Consolidated deck cards after alternate art detection:', {
                        beforeConsolidation,
                        afterConsolidation: window.deckEditorCards.length,
                        cards: window.deckEditorCards.map(c => ({
                            type: c.type,
                            cardId: c.cardId,
                            quantity: c.quantity,
                            selectedAlternateCardId: c.selectedAlternateCardId,
                            selectedAlternateCardIds: c.selectedAlternateCardIds
                        }))
                    });
                } else {
                    // No consolidation needed, but ensure selectedAlternateCardId is set correctly
                    window.deckEditorCards = window.deckEditorCards.map(card => {
                        if (card.selectedAlternateCardId) {
                            // Already set, ensure selectedAlternateCardIds is initialized if quantity > 1
                            if (card.quantity > 1 && !card.selectedAlternateCardIds) {
                                card.selectedAlternateCardIds = Array(card.quantity).fill(card.selectedAlternateCardId);
                                card.selectedAlternateCardId = undefined;
                            }
                        }
                        return card;
                    });
                }
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
            
            // Update card count
            updateDeckEditorCardCount();
            
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
        // For cards with quantity > 1, we need to create separate entries for each instance
        // since each instance can have a different alternate art selection
        const cardsData = [];
        
        window.deckEditorCards.forEach(card => {
            // Determine which card ID(s) to save based on alternate art selections
            // Priority: selectedAlternateCardIds array > selectedAlternateCardId > cardId
            
            // Check if we have per-instance alternate selections
            const hasPerInstanceSelections = card.selectedAlternateCardIds && 
                                            Array.isArray(card.selectedAlternateCardIds) && 
                                            card.selectedAlternateCardIds.length > 0 &&
                                            card.selectedAlternateCardIds.some(id => id !== undefined && id !== null);
            
            if (hasPerInstanceSelections && card.quantity > 1) {
                // Helper function to extract UUID from cardId (removes prefixes like "character_")
                const extractUUID = (cardId) => {
                    if (!cardId) return null;
                    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                    if (uuidPattern.test(cardId)) return cardId;
                    const prefixedMatch = cardId.match(/^[a-z]+_([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i);
                    if (prefixedMatch && prefixedMatch[1]) return prefixedMatch[1];
                    const parts = cardId.split('_');
                    for (let i = 1; i < parts.length; i++) {
                        const candidate = parts.slice(i).join('_');
                        if (uuidPattern.test(candidate)) return candidate;
                    }
                    return cardId;
                };
                
                // Create an entry for each instance with its specific alternate art
                for (let i = 0; i < card.quantity; i++) {
                    // Use the selected alternate card ID for this instance, or fall back to selectedAlternateCardId or base cardId
                    const rawCardIdForInstance = (card.selectedAlternateCardIds[i] !== undefined && card.selectedAlternateCardIds[i] !== null)
                        ? card.selectedAlternateCardIds[i]
                        : (card.selectedAlternateCardId || card.cardId);
                    
                    // Extract UUID from card ID (remove prefixes)
                    const cardIdForInstance = extractUUID(rawCardIdForInstance);
                    
                    const instanceData = {
                        cardType: card.type,
                        cardId: cardIdForInstance,
                        quantity: 1
                    };
                    
                    // Include exclude_from_draw flag if present
                    if (card.exclude_from_draw !== undefined) {
                        instanceData.exclude_from_draw = card.exclude_from_draw;
                    }
                    
                    cardsData.push(instanceData);
                }
            } else {
                // Single instance or all instances use the same art
                // Use selectedAlternateCardId if present, otherwise use cardId
                // If cardId itself is an alternate art (detected during load), use it
                // Extract UUID from card ID (remove prefixes like "character_", "power_", etc.)
                const extractUUID = (cardId) => {
                    if (!cardId) return null;
                    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                    if (uuidPattern.test(cardId)) return cardId;
                    const prefixedMatch = cardId.match(/^[a-z]+_([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i);
                    if (prefixedMatch && prefixedMatch[1]) return prefixedMatch[1];
                    const parts = cardId.split('_');
                    for (let i = 1; i < parts.length; i++) {
                        const candidate = parts.slice(i).join('_');
                        if (uuidPattern.test(candidate)) return candidate;
                    }
                    return cardId;
                };
                
                const rawCardIdToSave = card.selectedAlternateCardId || card.cardId;
                const cardIdToSave = extractUUID(rawCardIdToSave);
                
                console.log('💾 [saveDeckChanges] Preparing single card entry:', {
                    type: card.type,
                    cardId: card.cardId,
                    selectedAlternateCardId: card.selectedAlternateCardId,
                    rawCardIdToSave: rawCardIdToSave,
                    cardIdToSave: cardIdToSave,
                    quantity: card.quantity
                });
                
                const cardData = {
                    cardType: card.type,
                    cardId: cardIdToSave,
                    quantity: card.quantity
                };
                
                // Include exclude_from_draw flag if present (for Training cards with Spartan Training Ground)
                if (card.exclude_from_draw !== undefined) {
                    cardData.exclude_from_draw = card.exclude_from_draw;
                }
                
                cardsData.push(cardData);
            }
        });
        
        console.log('💾 [saveDeckChanges] Prepared cards data:', {
            totalCards: cardsData.length,
            cards: cardsData.map(c => ({ type: c.cardType, id: c.cardId, qty: c.quantity }))
        });
        
        // Bulk replace all cards in one atomic operation
        const cardsEndpoint = `/api/decks/${deckId}/cards`;
        console.log('💾 [saveDeckChanges] Saving cards to endpoint:', cardsEndpoint);
        console.log('💾 [saveDeckChanges] deckId:', deckId, 'currentDeckId:', currentDeckId);
        
        const replaceResponse = await fetch(cardsEndpoint, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ cards: cardsData })
        });
        
        if (!replaceResponse.ok) {
            const errorText = await replaceResponse.text();
            console.error('💾 [saveDeckChanges] Failed to save deck cards:', {
                status: replaceResponse.status,
                statusText: replaceResponse.statusText,
                error: errorText,
                endpoint: cardsEndpoint
            });
            throw new Error(`Failed to save deck cards: ${replaceResponse.status} ${replaceResponse.statusText}`);
        }
        
        // Check validation status before saving
        const validation = validateDeck(window.deckEditorCards);
        const isDeckValid = validation.errors.length === 0;
        
        // Update reserve_character to use alternate card ID if the reserved character has alternate art selected
        let reserveCharacterToSave = currentDeckData.metadata.reserve_character;
        if (reserveCharacterToSave) {
            // Helper function to extract UUID from cardId (removes prefixes like "character_")
            const extractUUID = (cardId) => {
                if (!cardId) return null;
                
                // First check if it's already a pure UUID (matches UUID pattern exactly)
                const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                if (uuidPattern.test(cardId)) {
                    return cardId;
                }
                
                // If it has a prefix like "character_", extract the UUID part
                // Pattern: "character_" followed by UUID
                const prefixedMatch = cardId.match(/^[a-z]+_([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i);
                if (prefixedMatch && prefixedMatch[1]) {
                    return prefixedMatch[1];
                }
                
                // Try splitting by underscore and checking if any part is a UUID
                const parts = cardId.split('_');
                for (let i = 1; i < parts.length; i++) {
                    const candidate = parts.slice(i).join('_');
                    if (uuidPattern.test(candidate)) {
                        return candidate;
                    }
                }
                
                // If no UUID pattern found, return as-is (might be a legacy ID)
                return cardId;
            };
            
            // Normalize the reserve_character ID (remove prefix if present)
            reserveCharacterToSave = extractUUID(reserveCharacterToSave);
            
            // Find the character card that matches the reserve_character ID (compare normalized)
            const reservedCharacterCard = window.deckEditorCards.find(card => {
                if (card.type !== 'character') return false;
                const normalizedCardId = extractUUID(card.cardId);
                return normalizedCardId === reserveCharacterToSave || card.cardId === reserveCharacterToSave;
            });
            
            if (reservedCharacterCard) {
                // If this character has alternate art selected, use the alternate card ID
                const alternateCardId = reservedCharacterCard.selectedAlternateCardId || 
                                      (reservedCharacterCard.selectedAlternateCardIds && reservedCharacterCard.selectedAlternateCardIds[0]) ||
                                      null;
                
                if (alternateCardId) {
                    // Normalize alternate card ID as well
                    const normalizedAlternateId = extractUUID(alternateCardId);
                    if (normalizedAlternateId && normalizedAlternateId !== reserveCharacterToSave) {
                        console.log('💾 [saveDeckChanges] Updating reserve_character to use alternate art:', {
                            baseCardId: reserveCharacterToSave,
                            alternateCardId: normalizedAlternateId
                        });
                        reserveCharacterToSave = normalizedAlternateId;
                    }
                }
            } else {
                // Reserve character not found in deck - might have been removed
                // Check if it matches any alternate card IDs (normalized)
                for (const card of window.deckEditorCards) {
                    if (card.type === 'character') {
                        const normalizedCardId = extractUUID(card.cardId);
                        const normalizedAlternateId = card.selectedAlternateCardId ? extractUUID(card.selectedAlternateCardId) : null;
                        
                        if (normalizedAlternateId === reserveCharacterToSave || normalizedCardId === reserveCharacterToSave ||
                            (card.selectedAlternateCardIds && card.selectedAlternateCardIds.some(id => extractUUID(id) === reserveCharacterToSave))) {
                            // Reserve character matches an alternate card ID, keep it as-is
                            console.log('💾 [saveDeckChanges] Reserve character matches alternate card ID, keeping:', reserveCharacterToSave);
                            break;
                        }
                    }
                }
            }
        }
        
        // Save deck metadata (name, is_limited, is_valid, reserve_character, and background_image_path)
        const backgroundPath = window.deckBackgroundManager ? window.deckBackgroundManager.getSelectedBackground() : null;
        console.log('Saving deck with background_image_path:', backgroundPath);
        console.log('deckBackgroundManager exists:', !!window.deckBackgroundManager);
        console.log('currentDeckId:', currentDeckId);
        console.log('💾 [saveDeckChanges] Saving reserve_character:', reserveCharacterToSave);
        
        const updateResponse = await fetch(`/api/decks/${currentDeckId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                name: currentDeckData.metadata.name,
                description: '',
                is_limited: isDeckLimited,
                is_valid: isDeckValid,
                reserve_character: reserveCharacterToSave,
                background_image_path: backgroundPath
            })
        });
        
        if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            console.error('Failed to update deck metadata:', errorText);
            throw new Error('Failed to update deck metadata');
        }
        
        const updateResult = await updateResponse.json();
        console.log('Deck update response:', updateResult);
        
        // Update background manager after save
        if (updateResult.success && window.deckBackgroundManager) {
            const savedBackground = updateResult.data?.metadata?.background_image_path;
            if (savedBackground !== undefined) {
                window.deckBackgroundManager.updateSelectedBackground(savedBackground);
            }
        }
        
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
