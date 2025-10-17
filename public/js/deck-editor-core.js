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
        
        // Show/hide Export button based on admin role
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            if (currentUser && currentUser.role === 'ADMIN') {
                exportBtn.style.display = 'inline-block';
            } else {
                exportBtn.style.display = 'none';
            }
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
        
        // Default to 67% for deck pane (33% for available cards) for new decks
        const defaultPercentage = 67;
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
                console.log('🔒 SECURITY: Save button disabled in read-only mode');
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
    console.log('🔄 loadDeckForEditing called with:', { deckId, urlUserId, isReadOnly });
    
    // Note: Read-only mode is now determined by API response and ownership checks below
    
    // Handle new deck creation
    if (deckId === 'new') {
        console.log('Initializing new deck');
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
        deckEditorCards = [];
        // Read-only mode removed - now handled by backend flag
        
        // Show the deck editor modal
        document.getElementById('deckEditorModal').style.display = 'block';
        
        // Load available cards
        if (typeof loadAvailableCards === 'function') {
            loadAvailableCards();
        }
        
        // Update card count
        if (typeof updateDeckCardCount === 'function') {
            updateDeckCardCount();
        }
        
        // Update deck summary to set proper button states
        if (typeof updateDeckSummary === 'function') {
            updateDeckSummary(deckEditorCards);
        }
        
        return;
    }
    
    currentDeckId = deckId; // Set the current deck ID
    try {
        console.log('🌐 Fetching deck data from API...');
        const response = await fetch(`/api/decks/${deckId}`, {
            credentials: 'include'
        });
        console.log('📡 API response status:', response.status);
        const data = await response.json();
        console.log('📦 API response data:', data);
        
        if (data.success) {
            console.log('✅ Deck data loaded successfully');
            currentDeckData = data.data;
            deckEditorCards = [...data.data.cards]; // Create working copy
            console.log('🎴 Deck cards loaded:', deckEditorCards.length, 'cards');
            
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
            
            // CRITICAL SECURITY FIX: Check if readonly=true query parameter is set - this takes precedence
            const urlParams = new URLSearchParams(window.location.search);
            const isReadOnlyFromQuery = urlParams.get('readonly') === 'true';
            
            if (isReadOnlyFromQuery) {
                // Force read-only mode when readonly=true query parameter is present
                isReadOnlyMode = true;
                console.log('🔒 SECURITY: Forcing read-only mode due to readonly=true query parameter');
            } else if (data.data.metadata && data.data.metadata.isOwner !== undefined) {
                // Only use API response if no readonly query parameter is set
                isReadOnlyMode = !data.data.metadata.isOwner;
                console.log('🔒 SECURITY: Updated read-only mode from API:', isReadOnlyMode, 'isOwner:', data.data.metadata.isOwner);
            } else {
                // Fallback: if no ownership info, assume read-only for safety
                isReadOnlyMode = true;
                console.log('🔒 SECURITY: No ownership info available, defaulting to read-only mode for safety');
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
    console.log('💾 saveDeckChanges called');
    console.log('📊 Current state:', {
        currentDeckId,
        currentDeckData: currentDeckData ? 'loaded' : 'not loaded',
        deckEditorCards: deckEditorCards ? deckEditorCards.length : 0
    });
    
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
        console.log('🔒 SECURITY: Blocking saveDeckChanges in read-only mode');
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

// Export deck as JSON (Admin only)
function exportDeckAsJson() {
    // Security check - only allow ADMIN users
    if (!currentUser || currentUser.role !== 'ADMIN') {
        showNotification('Access denied: Admin privileges required', 'error');
        return;
    }
    
    // Check if modal is already open - if so, close it
    const modal = document.getElementById('exportJsonModal');
    if (modal && modal.style.display === 'flex') {
        closeExportJsonModal();
        return;
    }
    
    try {
        // Get current deck data
        const deckName = document.getElementById('deckNameInput')?.value || 'Untitled Deck';
        const deckDescription = document.getElementById('deckDescriptionInput')?.value || '';
        
        // Calculate deck statistics
        const totalCards = deckEditorCards
            .filter(card => !['mission', 'character', 'location'].includes(card.type))
            .reduce((sum, card) => sum + card.quantity, 0);
        
        const characterCards = deckEditorCards.filter(card => card.type === 'character');
        const locationCards = deckEditorCards.filter(card => card.type === 'location');
        
        let maxEnergy = 0, maxCombat = 0, maxBruteForce = 0, maxIntelligence = 0;
        let totalThreat = 0;
        
        if (characterCards.length > 0) {
            maxEnergy = Math.max(...characterCards.map(card => {
                const availableCard = availableCardsMap.get(card.cardId);
                return availableCard ? (availableCard.energy || 0) : 0;
            }));
            maxCombat = Math.max(...characterCards.map(card => {
                const availableCard = availableCardsMap.get(card.cardId);
                return availableCard ? (availableCard.combat || 0) : 0;
            }));
            maxBruteForce = Math.max(...characterCards.map(card => {
                const availableCard = availableCardsMap.get(card.cardId);
                return availableCard ? (availableCard.brute_force || 0) : 0;
            }));
            maxIntelligence = Math.max(...characterCards.map(card => {
                const availableCard = availableCardsMap.get(card.cardId);
                return availableCard ? (availableCard.intelligence || 0) : 0;
            }));
        }
        
        if (locationCards.length > 0) {
            totalThreat = locationCards.reduce((sum, card) => {
                const availableCard = availableCardsMap.get(card.cardId);
                return sum + (availableCard ? (availableCard.threat_level || 0) : 0);
            }, 0);
        }
        
        // Helper function to get card name from availableCardsMap
        const getCardNameFromMap = (card) => {
            const availableCard = availableCardsMap.get(card.cardId);
            if (availableCard) {
                // Handle different card types
                if (card.type === 'power') {
                    return `${availableCard.value} - ${availableCard.power_type}`;
                } else if (card.type === 'teamwork') {
                    return `${availableCard.to_use} -> ${availableCard.followup_attack_types} (${availableCard.first_attack_bonus}/${availableCard.second_attack_bonus})`;
                } else if (card.type === 'ally_universe') {
                    return `${availableCard.card_name} - ${availableCard.stat_to_use} ${availableCard.stat_type_to_use} → ${availableCard.attack_value} ${availableCard.attack_type}`;
                } else if (card.type === 'basic_universe') {
                    return `${availableCard.card_name} - ${availableCard.type} (${availableCard.value_to_use} → ${availableCard.bonus})`;
                } else if (card.type === 'training') {
                    return `${availableCard.card_name.replace(/^Training \(/, '').replace(/\)$/, '')} - ${availableCard.type_1} + ${availableCard.type_2} (${availableCard.value_to_use} → ${availableCard.bonus})`;
                } else {
                    return availableCard.name || availableCard.card_name || 'Unknown Card';
                }
            }
            return 'Unknown Card';
        };

        // Organize cards by category
        const cardCategories = {
            characters: deckEditorCards.filter(card => card.type === 'character').map(card => getCardNameFromMap(card)),
            special_cards: deckEditorCards.filter(card => card.type === 'special').map(card => getCardNameFromMap(card)),
            locations: deckEditorCards.filter(card => card.type === 'location').map(card => getCardNameFromMap(card)),
            missions: deckEditorCards.filter(card => card.type === 'mission').map(card => getCardNameFromMap(card)),
            events: deckEditorCards.filter(card => card.type === 'event').map(card => getCardNameFromMap(card)),
            aspects: deckEditorCards.filter(card => card.type === 'aspect').map(card => getCardNameFromMap(card)),
            advanced_universe: deckEditorCards.filter(card => card.type === 'advanced_universe').map(card => getCardNameFromMap(card)),
            teamwork: deckEditorCards.filter(card => card.type === 'teamwork').map(card => getCardNameFromMap(card)),
            allies: deckEditorCards.filter(card => card.type === 'ally').map(card => getCardNameFromMap(card)),
            training: deckEditorCards.filter(card => card.type === 'training').map(card => getCardNameFromMap(card)),
            basic_universe: deckEditorCards.filter(card => card.type === 'basic_universe').map(card => getCardNameFromMap(card)),
            power_cards: deckEditorCards.filter(card => card.type === 'power').map(card => getCardNameFromMap(card))
        };
        
        // Create export data structure
        const exportData = {
            deck_metadata: {
                name: deckName,
                description: deckDescription,
                total_cards: totalCards,
                max_energy: maxEnergy,
                max_combat: maxCombat,
                max_brute_force: maxBruteForce,
                max_intelligence: maxIntelligence,
                total_threat: totalThreat,
                export_timestamp: new Date().toISOString(),
                exported_by: currentUser.name || currentUser.username || 'Admin'
            },
            card_categories: cardCategories
        };
        
        // Show JSON in popup modal
        const jsonString = JSON.stringify(exportData, null, 2);
        showExportJsonModal(jsonString);
        
    } catch (error) {
        console.error('Error exporting deck:', error);
        showNotification('Error exporting deck: ' + error.message, 'error');
    }
}

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
    deckEditorCards = [];
    
    // Return to deck builder selection screen
    switchToDeckBuilder();
}

// Export JSON Modal Functions
function showExportJsonModal(jsonString) {
    const modal = document.getElementById('exportJsonModal');
    const content = document.getElementById('jsonContent');
    const exportBtn = document.getElementById('exportBtn');
    
    if (modal && content && exportBtn) {
        content.textContent = jsonString;
        
        // Position modal tightly below the Export button
        const exportBtnRect = exportBtn.getBoundingClientRect();
        const modalWidth = 600; // Smaller width for tighter positioning
        const modalHeight = Math.min(window.innerHeight * 0.6, 500); // Smaller height
        
        // Position directly below the Export button, aligned to its left edge
        let left = exportBtnRect.left;
        
        // Ensure modal doesn't go off-screen to the right
        if (left + modalWidth > window.innerWidth - 10) {
            left = window.innerWidth - modalWidth - 10;
        }
        
        // Position tightly below the Export button (minimal spacing)
        const top = exportBtnRect.bottom + 2;
        
        // If modal would go off bottom of screen, position it above the button
        let finalTop = top;
        if (top + modalHeight > window.innerHeight - 10) {
            finalTop = exportBtnRect.top - modalHeight - 2;
        }
        
        modal.style.position = 'fixed';
        modal.style.left = left + 'px';
        modal.style.top = finalTop + 'px';
        modal.style.width = modalWidth + 'px';
        modal.style.display = 'flex';
        
        // Store the JSON string for copying
        modal.dataset.jsonString = jsonString;

        // Add click outside to close
        modal.onclick = function(event) {
            if (event.target === modal) {
                closeExportJsonModal();
            }
        };
    }
}

function closeExportJsonModal() {
    const modal = document.getElementById('exportJsonModal');
    if (modal) {
        modal.style.display = 'none';
        modal.onclick = null;
    }
}

function copyJsonToClipboard() {
    const modal = document.getElementById('exportJsonModal');
    const jsonString = modal?.dataset.jsonString;
    
    if (jsonString) {
        navigator.clipboard.writeText(jsonString).then(() => {
            // Show temporary feedback
            const copyBtn = document.getElementById('copyJsonBtn');
            const originalTitle = copyBtn.title;
            copyBtn.title = 'Copied!';
            copyBtn.style.background = '#4CAF50';
            copyBtn.style.borderColor = '#4CAF50';
            
            setTimeout(() => {
                copyBtn.title = originalTitle;
                copyBtn.style.background = '#333333';
                copyBtn.style.borderColor = '#555555';
            }, 1000);
        }).catch(err => {
            console.error('Failed to copy JSON: ', err);
            alert('Failed to copy to clipboard');
        });
    }
}
