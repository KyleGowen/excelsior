// deck-editor-layout.js - Deck editor layout and resizable divider
// Extracted from public/index.html

// ===== enforce layout functions, setupLayoutObserver =====

function enforceListViewHorizontalLayout() {
    const deckCardsEditor = document.getElementById('deckCardsEditor');
    if (!deckCardsEditor || !deckCardsEditor.classList.contains('list-view')) {
        return;
    }
    
    // Layout enforcement always active
    
    const listItems = deckCardsEditor.querySelectorAll('.deck-list-item');
    listItems.forEach(item => {
        // Allow list items to shrink like tiles
        item.style.setProperty('display', 'flex', 'important');
        item.style.setProperty('flex-direction', 'row', 'important');
        item.style.setProperty('flex-wrap', 'nowrap', 'important');
        item.style.setProperty('width', '100%', 'important');
        item.style.setProperty('min-width', '0', 'important');
        item.style.setProperty('box-sizing', 'border-box', 'important');
        item.style.setProperty('align-items', 'center', 'important');
        item.style.setProperty('justify-content', 'flex-start', 'important');
        
        // Force child elements to be shrinkable
        const quantity = item.querySelector('.deck-list-item-quantity');
        const name = item.querySelector('.deck-list-item-name');
        const actions = item.querySelector('.deck-list-item-actions');
        
        if (quantity) {
            quantity.style.setProperty('display', 'inline-block', 'important');
            quantity.style.setProperty('white-space', 'nowrap', 'important');
            // CRITICAL: Fixed width to prevent layout shifts when quantity changes from 1 to 2 digits
            quantity.style.setProperty('min-width', '40px', 'important');
            quantity.style.setProperty('width', '40px', 'important');
            quantity.style.setProperty('text-align', 'right', 'important');
            quantity.style.setProperty('flex', '0 0 40px', 'important');
            quantity.style.setProperty('box-sizing', 'border-box', 'important');
            
            // Debug logging for quantity width changes
            const currentWidth = quantity.offsetWidth;
            const currentText = quantity.textContent.trim();
        }
        if (name) {
            name.style.setProperty('display', 'inline-block', 'important');
            name.style.setProperty('white-space', 'nowrap', 'important');
            name.style.setProperty('flex', '1 1 auto', 'important');
            name.style.setProperty('min-width', '0', 'important');
        }
        if (actions) {
            actions.style.setProperty('display', 'flex', 'important');
            actions.style.setProperty('flex-direction', 'row', 'important');
            actions.style.setProperty('flex-wrap', 'nowrap', 'important');
            actions.style.setProperty('align-items', 'center', 'important');
            actions.style.setProperty('min-width', '0', 'important');
            actions.style.setProperty('flex', '0 0 auto', 'important');
        }
    });
    
    // Force multiple reflows to ensure the layout is applied
    deckCardsEditor.offsetHeight;
    deckCardsEditor.offsetWidth;
    deckCardsEditor.scrollHeight;
}

// Ultra-aggressive layout enforcement function
async function ultraAggressiveLayoutEnforcement() {
    const deckCardsEditor = document.getElementById('deckCardsEditor');
    if (!deckCardsEditor || !deckCardsEditor.classList.contains('list-view')) {
        return;
    }
    
    // Layout enforcement always active
    
    // Don't call enforceTwoColumnLayoutInListView here - let the main layout system handle it
    // enforceTwoColumnLayoutInListView();
    
    // Run enforcement multiple times with different timing
    enforceListViewHorizontalLayout();
    
    setTimeout(() => {
        enforceListViewHorizontalLayout();
    }, 0);
    
    setTimeout(() => {
        enforceListViewHorizontalLayout();
    }, 1);
    
    setTimeout(() => {
        enforceListViewHorizontalLayout();
    }, 5);
    
    setTimeout(() => {
        enforceListViewHorizontalLayout();
    }, 10);
    
    setTimeout(() => {
        enforceListViewHorizontalLayout();
    }, 25);
    
    setTimeout(() => {
        enforceListViewHorizontalLayout();
    }, 50);
    
    setTimeout(() => {
        enforceListViewHorizontalLayout();
    }, 100);
    
    setTimeout(() => {
        enforceListViewHorizontalLayout();
    }, 200);
}

// Function to enforce exactly 2 columns in list view
function enforceTwoColumnLayoutInListView() {
    const deckCardsEditor = document.getElementById('deckCardsEditor');
    if (!deckCardsEditor || !deckCardsEditor.classList.contains('list-view')) {
        return;
    }
    
    // Enforcing two-column layout for list view
    
    // List view ALWAYS uses exactly 2 columns - no responsive behavior
    // Force exactly 2 columns with CSS
    deckCardsEditor.style.setProperty('display', 'flex', 'important');
    deckCardsEditor.style.setProperty('gap', '20px', 'important');
    deckCardsEditor.style.setProperty('align-items', 'flex-start', 'important');
    deckCardsEditor.style.setProperty('flex-direction', 'row', 'important');
    
    // Ensure we have exactly 2 columns
    const columns = deckCardsEditor.querySelectorAll('.deck-column');
    // Found deck-column elements
    if (columns.length !== 2) {
        // Recreating layout (not exactly 2 columns)
        // If we don't have exactly 2 columns, recreate the layout
        createTwoColumnLayout();
    }
    
    // Force each column to be exactly 50% width
    const finalColumns = deckCardsEditor.querySelectorAll('.deck-column');
    finalColumns.forEach((column, index) => {
        // Setting column styles
        column.style.setProperty('flex', '1', 'important');
        column.style.setProperty('display', 'flex', 'important');
        column.style.setProperty('flex-direction', 'column', 'important');
        column.style.setProperty('gap', '20px', 'important');
        
        // Log the computed styles
        const computedStyle = window.getComputedStyle(column);
        // Column computed styles logged for debugging
    });
}

// Set up MutationObserver to watch for layout changes
let layoutObserver = null;
function setupLayoutObserver() {
    const deckCardsEditor = document.getElementById('deckCardsEditor');
    if (!deckCardsEditor) return;
    
    if (layoutObserver) {
        layoutObserver.disconnect();
    }
    
    layoutObserver = new MutationObserver((mutations) => {
        let shouldEnforce = false;
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' || mutation.type === 'attributes') {
                shouldEnforce = true;
            }
        });
        
        if (shouldEnforce && deckCardsEditor.classList.contains('list-view')) {
            setTimeout(() => {
                enforceListViewHorizontalLayout();
            }, 10);
        }
    });
    
    layoutObserver.observe(deckCardsEditor, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
    });
}


// ===== initializeResizableDivider through restoreSliderPosition =====

function initializeResizableDivider() {
    const divider = document.getElementById('resizableDivider');
    const deckPane = document.querySelector('.deck-pane');
    const cardSelectorPane = document.querySelector('.card-selector-pane');
    const layout = document.querySelector('.deck-editor-layout');
    
    
    if (!divider || !deckPane || !cardSelectorPane || !layout) {
        return;
    }
    
    
    

    let isResizing = false;
    let startX = 0;
    let startDeckWidth = 0;

    divider.addEventListener('mousedown', (e) => {
        // SECURITY: Block divider dragging in read-only mode
        if (document.body.classList.contains('read-only-mode')) {
            console.log('🔒 SECURITY: Blocking divider drag in read-only mode');
            e.preventDefault();
            return;
        }
        
        // SECURITY: Check if user owns this deck before allowing divider dragging
        // Allow divider dragging for new decks (no currentDeckData or no metadata)
        if (currentDeckData && currentDeckData.metadata && currentDeckData.metadata.isOwner === false) {
            console.log('🔒 SECURITY: Blocking divider drag - user does not own this deck');
            e.preventDefault();
            return;
        }
        
        isResizing = true;
        startX = e.clientX;
        startDeckWidth = deckPane.offsetWidth;
        
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        
        e.preventDefault();
    });

    function handleMouseMove(e) {
        if (!isResizing) return;
        
        const deltaX = e.clientX - startX;
        const newDeckWidth = startDeckWidth + deltaX;
        const layoutWidth = layout.offsetWidth;
        const dividerWidth = divider.offsetWidth;
        const availableWidth = layoutWidth - dividerWidth;
        
        // Calculate minimum widths (23% of total width)
        const minWidth = availableWidth * 0.23;
        const maxWidth = availableWidth * 0.77;
        
        // Constrain the new width
        const constrainedWidth = Math.max(minWidth, Math.min(maxWidth, newDeckWidth));
        const deckPercentage = (constrainedWidth / layoutWidth) * 100;
        
        
        // Update the flex-basis to maintain the width
        deckPane.style.flex = `0 0 ${constrainedWidth}px`;
        cardSelectorPane.style.flex = '1';
        
        // Update layout during dragging with throttling to prevent stuttering
        updateDeckLayoutThrottled(constrainedWidth, layoutWidth);
        
        // Store the slider position for persistence
        storeSliderPosition(constrainedWidth, layoutWidth);
    }

    function handleMouseUp() {
        isResizing = false;
        
        // Clear any pending throttled updates
        if (layoutUpdateTimeout) {
            clearTimeout(layoutUpdateTimeout);
            layoutUpdateTimeout = null;
        }
        
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    }

    // Prevent text selection while dragging
    divider.addEventListener('selectstart', (e) => {
        e.preventDefault();
    });
}

// Throttled version of updateDeckLayout to prevent stuttering during drag
let layoutUpdateTimeout;
function updateDeckLayoutThrottled(deckWidth, totalWidth) {
    // Clear any pending update
    if (layoutUpdateTimeout) {
        clearTimeout(layoutUpdateTimeout);
    }
    
    // Update immediately but throttle subsequent calls
    updateDeckLayout(deckWidth, totalWidth);
    
    // Set a small delay before allowing the next update
    layoutUpdateTimeout = setTimeout(() => {
        layoutUpdateTimeout = null;
    }, 16); // ~60fps throttling
}

// Update deck layout based on width
function updateDeckLayout(deckWidth, totalWidth) {
    const deckCardsEditor = document.querySelector('.deck-cards-editor');
    if (!deckCardsEditor) return;
    
    const deckPercentage = (deckWidth / totalWidth) * 100;
    const isListView = deckCardsEditor.classList.contains('list-view');
    const isCardView = deckCardsEditor.classList.contains('card-view');
    const hasTwoColumn = deckCardsEditor.classList.contains('two-column');
    
    
    if (isListView) {
        // List view: always keep two columns; only widths shrink/expand
        
        manageDeckLayout('addClass', { className: 'two-column' });
        createTwoColumnLayout();
    } else if (isCardView) {
        // Card view: completely independent - remove any layout classes that interfere
        // Card View manages its own layout internally
        manageDeckLayout('removeClass', { className: 'two-column' });
    } else {
        // Tile view: normal responsive behavior
        
        if (deckPercentage >= 33) {
            
            manageDeckLayout('addClass', { className: 'two-column' });
            createTwoColumnLayout();
        } else {
            
            manageDeckLayout('removeClass', { className: 'two-column' });
            restoreSingleColumnLayout();
        }
    }
    
    // Log final state
    const finalHasTwoColumn = deckCardsEditor.classList.contains('two-column');
    
}

// Generic layout management function to consolidate duplicate patterns
function manageDeckLayout(action, options = {}) {
    const deckCardsEditor = document.querySelector('.deck-cards-editor');
    if (!deckCardsEditor) return;
    
    switch (action) {
        case 'addClass':
            if (options.className) {
                deckCardsEditor.classList.add(options.className);
            }
            break;
        case 'removeClass':
            if (options.className) {
                deckCardsEditor.classList.remove(options.className);
            }
            break;
        case 'toggleClass':
            if (options.className) {
                deckCardsEditor.classList.toggle(options.className);
            }
            break;
        case 'setLayout':
            if (options.layout) {
                // Remove all layout classes first
                deckCardsEditor.classList.remove('one-column', 'two-column', 'three-column', 'four-column', 'list-view');
                // Add the specified layout class
                deckCardsEditor.classList.add(options.layout);
            }
            break;
        case 'hasClass':
            return options.className ? deckCardsEditor.classList.contains(options.className) : false;
        default:
            console.warn('Unknown layout action:', action);
    }
}

function createTwoColumnLayout() {
    const deckCardsEditor = document.querySelector('.deck-cards-editor');
    if (!deckCardsEditor) return;
    
    // Don't apply two-column layout to Card View
    if (deckCardsEditor.classList.contains('card-view')) {
        return;
    }
    
    
    // If already in two-column mode, don't redistribute - keep categories stable
    if (deckCardsEditor.querySelector('.deck-column')) {
        
        return; // Don't redistribute existing content to prevent shaking
    }
    
    const sections = Array.from(deckCardsEditor.children);
    
    if (sections.length === 0) return;
    
    // Create exactly two columns - never more, never less
    const leftColumn = document.createElement('div');
    leftColumn.className = 'deck-column';
    const rightColumn = document.createElement('div');
    rightColumn.className = 'deck-column';
    
    // Distribute sections between exactly 2 columns
    // Left column gets the first half (with carry-over), right column gets the second half
    const totalSections = sections.length;
    const leftColumnCount = Math.ceil(totalSections / 2);
    
    sections.forEach((section, index) => {
        if (index < leftColumnCount) {
            leftColumn.appendChild(section);
        } else {
            rightColumn.appendChild(section);
        }
    });
    
    
    // Clear and add exactly 2 columns
    deckCardsEditor.innerHTML = '';
    deckCardsEditor.appendChild(leftColumn);
    deckCardsEditor.appendChild(rightColumn);
    
    // Ensure the layout is exactly 2 columns with CSS
    deckCardsEditor.style.setProperty('display', 'flex', 'important');
    deckCardsEditor.style.setProperty('gap', '20px', 'important');
    deckCardsEditor.style.setProperty('align-items', 'flex-start', 'important');
    
    // Log the final column widths
    setTimeout(() => {
        const finalColumns = deckCardsEditor.querySelectorAll('.deck-column');
    }, 10);
}

function restoreSingleColumnLayout() {
    const deckCardsEditor = document.querySelector('.deck-cards-editor');
    if (!deckCardsEditor) return;
    
    
    const columns = deckCardsEditor.querySelectorAll('.deck-column');
    
    if (columns.length === 0) return;
    
    // Move all sections back to main container
    const allSections = [];
    columns.forEach(column => {
        
        allSections.push(...Array.from(column.children));
    });
    
    // Clear and add sections back
    deckCardsEditor.innerHTML = '';
    allSections.forEach(section => {
        deckCardsEditor.appendChild(section);
    });
    
}

// Force character cards to single column layout (only in edit mode)
function forceCharacterSingleColumnLayout() {
    // Layout enforcement always active
    
    // Find all character sections
    const characterSections = document.querySelectorAll('#deck-type-character, .deck-type-section[data-type="character"]');
    
    characterSections.forEach((section, index) => {
        
        // Find the cards container within this section
        const cardsContainer = section.querySelector('.deck-type-cards');
        if (cardsContainer) {
            
            // Force single column layout
            cardsContainer.style.setProperty('grid-template-columns', '1fr', 'important');
            cardsContainer.style.gridTemplateColumns = '1fr';
            
            // Also add a class to make it more specific
            cardsContainer.classList.add('force-single-column');
            
        }
    });
    
    // Also check for any containers with character cards
    const containersWithCharacterCards = document.querySelectorAll('.deck-type-cards:has(.character-card), .deck-type-cards:has(.deck-card-editor-item.character-card)');
    
    containersWithCharacterCards.forEach((container, index) => {
        container.style.setProperty('grid-template-columns', '1fr', 'important');
        container.style.gridTemplateColumns = '1fr';
        container.classList.add('force-single-column');
    });
}

// Store slider position for persistence
function storeSliderPosition(deckWidth, totalWidth) {
    if (currentDeckId) {
        // SECURITY: Block saving slider position in read-only mode
        if (document.body.classList.contains('read-only-mode')) {
            console.log('🔒 SECURITY: Blocking slider position save in read-only mode');
            return;
        }
        
        // SECURITY: Check if user owns this deck before saving slider position
        if (currentDeckData && currentDeckData.metadata && !currentDeckData.metadata.isOwner) {
            console.log('🔒 SECURITY: Blocking slider position save - user does not own this deck');
            return;
        }
        
        const percentage = (deckWidth / totalWidth) * 100;
        localStorage.setItem(`slider_position_${currentDeckId}`, percentage.toString());
        
        // Also save UI preferences to database
        const preferences = getCurrentUIPreferences();
        saveUIPreferences(currentDeckId, preferences);
    }
}

// Restore slider position from storage
function restoreSliderPosition() {
    if (currentDeckId) {
        // Check if position has already been set (to avoid overriding initial position)
        const existingDeckPane = document.querySelector('.deck-pane');
        if (existingDeckPane && existingDeckPane.style.flex && existingDeckPane.style.flex !== '1') {
            return;
        }
        
        // Check for UI preferences first, then localStorage, then default to 65%
        let percentage = 65; // Default to 65%
        let savedPosition = null; // Declare savedPosition in the proper scope
        
        // Check if we have UI preferences with divider position
        const restorePrefs = currentDeckData
            ? (currentDeckData.ui_preferences || (currentDeckData.metadata && currentDeckData.metadata.ui_preferences))
            : null;
        if (restorePrefs && restorePrefs.dividerPosition) {
            percentage = restorePrefs.dividerPosition;
        } else {
            // Fall back to localStorage
            savedPosition = localStorage.getItem(`slider_position_${currentDeckId}`);
            percentage = savedPosition ? parseFloat(savedPosition) : 65;
        }
        const layout = document.querySelector('.deck-editor-layout');
        const deckPane = document.querySelector('.deck-pane');
        const cardSelectorPane = document.querySelector('.card-selector-pane');
        
        if (layout && deckPane && cardSelectorPane) {
            const layoutWidth = layout.offsetWidth;
            const dividerWidth = 4; // Width of the divider
            const availableWidth = layoutWidth - dividerWidth;
            const minWidth = availableWidth * 0.23;
            const maxWidth = availableWidth * 0.77;
            
            // Calculate desired width from percentage
            const desiredWidth = (percentage / 100) * layoutWidth;
            const constrainedWidth = Math.max(minWidth, Math.min(maxWidth, desiredWidth));
            
            // Apply the position
            deckPane.style.flex = `0 0 ${constrainedWidth}px`;
            cardSelectorPane.style.flex = '1';
            
            // Check if we should use two-column layout
            updateDeckLayout(constrainedWidth, layoutWidth);
            
            // Store the position if it was the default
            if (!savedPosition) {
                storeSliderPosition(constrainedWidth, layoutWidth);
            }
        }
    }
}


// Export all functions to window for backward compatibility
window.initializeResizableDivider = initializeResizableDivider;
window.updateDeckLayoutThrottled = updateDeckLayoutThrottled;
window.updateDeckLayout = updateDeckLayout;
window.manageDeckLayout = manageDeckLayout;
window.createTwoColumnLayout = createTwoColumnLayout;
window.restoreSingleColumnLayout = restoreSingleColumnLayout;
window.forceCharacterSingleColumnLayout = forceCharacterSingleColumnLayout;
window.storeSliderPosition = storeSliderPosition;
window.restoreSliderPosition = restoreSliderPosition;
window.enforceListViewHorizontalLayout = enforceListViewHorizontalLayout;
window.ultraAggressiveLayoutEnforcement = ultraAggressiveLayoutEnforcement;
window.enforceTwoColumnLayoutInListView = enforceTwoColumnLayoutInListView;
window.setupLayoutObserver = setupLayoutObserver;
