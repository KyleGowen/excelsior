// Layout and Drag-Drop Functions
// Extracted from public/index.html for better organization

// Global variables for drag and drop
let draggedCardIndex = null;
let draggedCardType = null;
let draggedCardElement = null;
let dropTargetIndex = null;
let dropPosition = null; // 'above' or 'below'
let isDragging = false; // Track if currently dragging

// Setup drag and drop functionality
function setupDragAndDrop() {
    console.log('setupDragAndDrop called');
    
    // Skip drag and drop setup in read-only mode
    if (isReadOnlyMode) {
        console.log('Skipping drag and drop setup - read-only mode');
        return;
    }
    
    try {
        const deckCardsEditor = document.getElementById('deckCardsEditor');
        if (!deckCardsEditor) {
            console.error('deckCardsEditor element not found');
            return;
        }
        
        console.log('Setting up drag and drop for deckCardsEditor');
    
        // Drag over effects
        deckCardsEditor.addEventListener('dragover', (e) => {
            e.preventDefault();
            deckCardsEditor.classList.add('drag-over');
        });
        
        deckCardsEditor.addEventListener('dragleave', () => {
            deckCardsEditor.classList.remove('drag-over');
        });
        
        // Drop handling
        deckCardsEditor.addEventListener('drop', (e) => {
            e.preventDefault();
            deckCardsEditor.classList.remove('drag-over');
            
            const cardType = e.dataTransfer.getData('text/plain').split('|')[0];
            const cardId = e.dataTransfer.getData('text/plain').split('|')[1];
            const cardName = e.dataTransfer.getData('text/plain').split('|')[2];
            
            if (cardType && cardId) {
                addCardToEditor(cardType, cardId, cardName);
            }
        });
        
        // Setup card item drag events
        document.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('card-item')) {
                e.target.classList.add('dragging');
                const cardType = e.target.dataset.type;
                const cardId = e.target.dataset.id;
                const cardName = e.target.dataset.name;
                e.dataTransfer.setData('text/plain', `${cardType}|${cardId}|${cardName}`);
            }
        });
        
        document.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('card-item')) {
                e.target.classList.remove('dragging');
            }
        });
        
        console.log('Drag and drop setup complete');
    } catch (error) {
        console.error('Error in setupDragAndDrop:', error);
    }
}

// Function to handle plus button clicks
function handlePlusButtonClick(event, cardType, cardId, cardName) {
    event.stopPropagation(); // Prevent drag event
    addCardToEditor(cardType, cardId, cardName);
}

// Function to handle card clicks
function handleCardClick(event, cardType, cardId, cardName) {
    // Only add card if it's not disabled and the click wasn't on the plus button
    if (event.target.classList.contains('card-item-plus')) {
        return; // Let the plus button handle its own click
    }
    
    // Check if the card is disabled
    const cardElement = event.currentTarget;
    if (cardElement.classList.contains('disabled')) {
        return; // Don't add disabled cards
    }
    
    // Add the card to the editor
    addCardToEditor(cardType, cardId, cardName);
}

// Enhanced drag and drop functionality for deck cards
function handleDeckCardDragStart(event) {
    draggedCardIndex = parseInt(event.target.dataset.index);
    draggedCardType = deckEditorCards[draggedCardIndex].type;
    draggedCardElement = event.target;
    isDragging = true;
    
    // Hide any existing hover modal immediately
    console.log('About to hide modal in drag start');
    hideCardHoverModal();
    
    event.target.classList.add('dragging');
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', draggedCardIndex.toString());
    
    console.log('Drag started:', draggedCardIndex, draggedCardType, 'isDragging set to:', isDragging);
    
    // Update the visual layout
    updateDragLayout();
}

function handleDeckCardDragEnd(event) {
    console.log('Drag ended, cleaning up');
    
    // Clean up all drag classes
    document.querySelectorAll('.deck-card-editor-item, .deck-type-section').forEach(el => {
        el.classList.remove('drag-over', 'drag-target', 'drag-above', 'drag-below', 'drag-placeholder', 'drag-space');
        el.style.transform = '';
    });
    
    // Remove any drag space elements
    document.querySelectorAll('.drag-space').forEach(el => {
        el.remove();
    });
    
    // Reset drag state
    draggedCardIndex = null;
    draggedCardType = null;
    draggedCardElement = null;
    dropTargetIndex = null;
    dropPosition = null;
    isDragging = false;
    
    console.log('Drag cleanup complete, isDragging set to:', isDragging);
}

function handleDeckCardDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    
    const targetCard = event.target.closest('.deck-card-editor-item');
    const targetSection = event.target.closest('.deck-type-section');
    
    if (targetCard && targetCard !== draggedCardElement) {
        const targetIndex = parseInt(targetCard.dataset.index);
        
        // Check if targetIndex is valid and card exists
        if (isNaN(targetIndex) || !deckEditorCards[targetIndex]) {
            console.log('Invalid target index:', targetIndex, 'deckEditorCards length:', deckEditorCards.length);
            return;
        }
        
        const targetType = deckEditorCards[targetIndex].type;
        
        console.log('Drag over card:', targetIndex, targetType, 'dragged type:', draggedCardType);
        
        // Only allow reordering within the same card type
        if (draggedCardType === targetType) {
            // Determine drop position based on mouse position
            const rect = targetCard.getBoundingClientRect();
            const cardCenterY = rect.top + rect.height / 2;
            const mouseY = event.clientY;
            
            dropTargetIndex = targetIndex;
            dropPosition = mouseY < cardCenterY ? 'above' : 'below';
            
            console.log('Drop position:', dropPosition, 'target:', dropTargetIndex);
            
            updateDragLayout();
        }
    } else if (targetSection) {
        // Highlight the section if it contains cards of the same type
        const sectionCards = targetSection.querySelectorAll('.deck-card-editor-item');
        const hasMatchingType = Array.from(sectionCards).some(card => {
            const cardIndex = parseInt(card.dataset.index);
            return deckEditorCards[cardIndex].type === draggedCardType;
        });
        
        if (hasMatchingType) {
            targetSection.classList.add('drag-over');
        }
    }
}

function handleDeckCardDrop(event) {
    event.preventDefault();
    
    console.log('Drop event:', dropTargetIndex, draggedCardIndex, dropPosition);
    
    if (dropTargetIndex !== null && draggedCardIndex !== dropTargetIndex) {
        // Calculate the actual target index based on drop position
        let actualTargetIndex = dropTargetIndex;
        if (dropPosition === 'below') {
            actualTargetIndex = dropTargetIndex + 1;
        }
        
        console.log('Reordering from', draggedCardIndex, 'to', actualTargetIndex);
        reorderDeckCards(draggedCardIndex, actualTargetIndex);
    }
    
    // Clean up all drag classes
    document.querySelectorAll('.deck-card-editor-item, .deck-type-section').forEach(el => {
        el.classList.remove('drag-over', 'drag-target', 'drag-above', 'drag-below', 'drag-placeholder', 'drag-space');
        el.style.transform = '';
    });
    
    // Remove any drag space elements
    document.querySelectorAll('.drag-space').forEach(el => {
        el.remove();
    });
}

// Handle drag over available cards section (for removing cards from deck)
function handleAvailableCardDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    
    // Add visual feedback to show this is a drop zone
    const targetSection = event.target.closest('.card-category-content');
    if (targetSection) {
        targetSection.classList.add('available-drop-zone');
    }
}

// Handle drag leave from available cards section
function handleAvailableCardDragLeave(event) {
    // Only remove the visual feedback if we're actually leaving the section
    const targetSection = event.target.closest('.card-category-content');
    const relatedTarget = event.relatedTarget;
    
    if (targetSection && (!relatedTarget || !targetSection.contains(relatedTarget))) {
        targetSection.classList.remove('available-drop-zone');
    }
}

// Handle drop on available cards section (remove card from deck)
function handleAvailableCardDrop(event) {
    event.preventDefault();
    
    // Remove visual feedback
    const targetSection = event.target.closest('.card-category-content');
    if (targetSection) {
        targetSection.classList.remove('available-drop-zone');
    }
    
    // Check if we have a valid dragged card from deck content
    if (draggedCardIndex !== null && draggedCardIndex >= 0 && draggedCardIndex < deckEditorCards.length) {
        // Capture current expansion state before re-rendering
        const currentExpansionState = getExpansionState();
        
        // Remove the card from the deck
        deckEditorCards.splice(draggedCardIndex, 1);
        
        // Refresh the display
        displayDeckCardsForEditing();
        
        // Restore the expansion state after re-rendering
        applyUIPreferences({ expansionState: currentExpansionState });
        updateDeckEditorCardCount();
        
        // Update character limit status
        updateCharacterLimitStatus();
        
        console.log('Card removed from deck via drag to available cards');
    }
    
    // Clean up
    draggedCardIndex = null;
    draggedCardType = null;
    draggedCardElement = null;
    dropTargetIndex = null;
    dropPosition = null;
}

function updateDragLayout() {
    if (draggedCardIndex === null || draggedCardType === null) return;
    
    // Find all cards of the same type
    const sameTypeCards = [];
    deckEditorCards.forEach((card, index) => {
        if (card && card.type === draggedCardType && index !== draggedCardIndex) {
            const element = document.querySelector(`[data-index="${index}"]`);
            if (element) {
                sameTypeCards.push({ index, element });
            }
        }
    });
    
    // Remove any existing drag spaces
    document.querySelectorAll('.drag-space').forEach(el => {
        el.remove();
    });
    
    // Add visual effects to show where the card will be dropped
    sameTypeCards.forEach(({ index, element }) => {
        if (dropTargetIndex !== null) {
            if (index === dropTargetIndex) {
                if (dropPosition === 'above') {
                    element.classList.add('drag-above');
                } else if (dropPosition === 'below') {
                    element.classList.add('drag-below');
                }
            }
        }
    });
}

function reorderDeckCards(fromIndex, toIndex) {
    // Get the card being moved
    const cardToMove = deckEditorCards[fromIndex];
    
    // Remove the card from its current position
    deckEditorCards.splice(fromIndex, 1);
    
    // Adjust the target index if we're moving down
    const adjustedToIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;
    
    // Capture current expansion state before re-rendering
    const currentExpansionState = getExpansionState();
    
    // Insert the card at the new position
    deckEditorCards.splice(adjustedToIndex, 0, cardToMove);
    
    // Refresh the display
    displayDeckCardsForEditing();
    
    // Restore the expansion state after re-rendering
    applyUIPreferences({ expansionState: currentExpansionState });
    
    // Save the deck
    saveDeck();
}
