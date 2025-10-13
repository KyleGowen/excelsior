/* ========================================
 * PHASE 10C: REMAINING UTILITY FUNCTIONS
 * ========================================
 * 
 * This file contains remaining utility and helper functions extracted from
 * index.html during Phase 10C of the refactoring project.
 * 
 * Purpose: Remaining utility and helper functions
 * Created: Phase 10C of 12-phase refactoring project
 * Contains:
 *   - getCardName() - Card name extraction
 *   - formatCardType() - Card type formatting
 *   - displayCardSearchResults() - Search result display
 *   - getCardBounds() - Card boundary calculations
 *   - clearSelection() - Selection clearing
 *   - onPointerMove() / onPointerUp() - Pointer event handling
 *   - attachDragListeners() - Drag listener attachment
 * 
 * ======================================== */

// Card management functions
function getCardName(card) {
    // TODO: This should fetch the actual card name from the database
    // For now, return a placeholder
    return `${formatCardType(card.type)} Card ${card.cardId}`;
}

function formatCardType(type) {
    return type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function displayCardSearchResults(cards) {
    const cardResults = document.getElementById('cardResults');
    
    if (cards.length === 0) {
        cardResults.innerHTML = '<div style="text-align: center; color: #bdc3c7; padding: 20px;">No cards found</div>';
        return;
    }

    cardResults.innerHTML = cards.map(card => `
        <div class="card-result-item">
            <div class="card-result-info">
                <div class="card-result-name">${card.displayName}</div>
                <div class="card-result-type">${formatCardType(card.type)}</div>
            </div>
            <button class="add-card-btn" onclick="addCardToDeck('${card.type}', '${card.id}')">
                ${card.type === 'character' ? 'Add to Deck' : 'Add to Deck (+)'}
            </button>
        </div>
    `).join('');
}

// Screenshot drag and drop utility functions
function getCardBounds(card) {
    const container = document.querySelector('.screenshot-draggable-container');
    if (!container) return null;
    
    const rect = card.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    return {
        left: rect.left - containerRect.left,
        top: rect.top - containerRect.top,
        right: rect.right - containerRect.left,
        bottom: rect.bottom - containerRect.top,
        width: rect.width,
        height: rect.height
    };
}

function clearSelection() {
    const selectedCards = window.selectedCards || new Set();
    selectedCards.forEach(c => c.classList.remove('selected'));
    selectedCards.clear();
}

function onPointerMove(e) {
    const container = document.querySelector('.screenshot-draggable-container');
    if (!container) return;
    
    const activeCard = window.activeCard;
    const isMarqueeSelecting = window.isMarqueeSelecting;
    const selectionRect = window.selectionRect;
    const marqueeStartX = window.marqueeStartX;
    const marqueeStartY = window.marqueeStartY;
    const selectedCards = window.selectedCards || new Set();
    
    console.log('onPointerMove called, activeCard:', activeCard);
    const rect = container.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);

    if (isMarqueeSelecting && selectionRect) {
        const currentX = clientX - rect.left;
        const currentY = clientY - rect.top;
        const left = Math.min(currentX, marqueeStartX);
        const top = Math.min(currentY, marqueeStartY);
        const width = Math.abs(currentX - marqueeStartX);
        const height = Math.abs(currentY - marqueeStartY);
        selectionRect.style.left = left + 'px';
        selectionRect.style.top = top + 'px';
        selectionRect.style.width = width + 'px';
        selectionRect.style.height = height + 'px';

        // Update selection set by overlap
        clearSelection();
        container.querySelectorAll('.screenshot-draggable-card').forEach(card => {
            const b = getCardBounds(card);
            const overlaps = !(b.left > left + width || b.right < left || b.top > top + height || b.bottom < top);
            if (overlaps) {
                card.classList.add('selected');
                selectedCards.add(card);
            }
        });
        return;
    }

    if (!activeCard) {
        console.log('No activeCard, returning');
        return;
    }
    console.log('ActiveCard found, proceeding with drag');
    e.preventDefault(); // Prevent text selection or other default browser behavior
    // Position cards by their visual center, maintaining the click offset
    const cardWidth = 140;  // Container width
    const cardHeight = 200; // Container height
    const offsetX = window.offsetX || 0;
    const offsetY = window.offsetY || 0;
    const initialPositions = window.initialPositions || new Map();
    
    // Calculate new position
    const newX = clientX - rect.left - offsetX - cardWidth/2;
    const newY = clientY - rect.top - offsetY - cardHeight/2;
    
    // Snap to grid
    const gridSize = 50;
    const gridOffsetX = 0;
    const gridOffsetY = 0;
    const snappedX = Math.round((newX - gridOffsetX) / gridSize) * gridSize + gridOffsetX;
    const snappedY = Math.round((newY - gridOffsetY) / gridSize) * gridSize + gridOffsetY;
    
    // Apply position to active card and any selected cards
    const toMove = selectedCards.size > 0 && selectedCards.has(activeCard) ? Array.from(selectedCards) : [activeCard];
    toMove.forEach(cardToMove => {
        const initialPos = initialPositions.get(cardToMove);
        if (initialPos) {
            const deltaX = snappedX - (initialPos.x + cardWidth/2);
            const deltaY = snappedY - (initialPos.y + cardHeight/2);
            cardToMove.style.left = (initialPos.x + deltaX) + 'px';
            cardToMove.style.top = (initialPos.y + deltaY) + 'px';
        }
    });
}

function onPointerUp(e) {
    const activeCard = window.activeCard;
    const isMarqueeSelecting = window.isMarqueeSelecting;
    const selectionRect = window.selectionRect;
    const container = document.querySelector('.screenshot-draggable-container');
    
    console.log('onPointerUp called, activeCard:', activeCard);
    if (isMarqueeSelecting) {
        window.isMarqueeSelecting = false;
        if (selectionRect && selectionRect.parentNode) selectionRect.parentNode.removeChild(selectionRect);
        window.selectionRect = null;
        container.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        return;
    }

    if (activeCard) {
        activeCard.classList.remove('dragging');
        window.activeCard = null;
        container.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
    }
}

function attachDragListeners() {
    const container = document.querySelector('.screenshot-draggable-container');
    if (!container) return;
    
    const cards = container.querySelectorAll('.screenshot-draggable-card');
    cards.forEach(card => {
        // Skip if already has listeners attached
        if (card.hasAttribute('data-drag-attached')) {
            return;
        }
        
        // Disable native drag
        card.setAttribute('draggable', 'false');
        card.setAttribute('data-drag-attached', 'true');

        card.addEventListener('pointerdown', (e) => {
            console.log('Card pointerdown event triggered');
            const selectedCards = window.selectedCards || new Set();
            const isShift = e.shiftKey;
            if (!isShift && !card.classList.contains('selected')) {
                clearSelection();
            }
            if (isShift) {
                // Toggle selection
                if (card.classList.contains('selected')) {
                    card.classList.remove('selected');
                    selectedCards.delete(card);
                } else {
                    card.classList.add('selected');
                    selectedCards.add(card);
                }
            }

            window.activeCard = card;
            const rect = card.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            // For unrotated container (140x200)
            const cardWidth = 140;  // Container width
            const cardHeight = 200; // Container height
            // Calculate offset from click point to container center
            const centerX = rect.left + cardWidth/2;
            const centerY = rect.top + cardHeight/2;
            window.offsetX = (e.clientX || (e.touches && e.touches[0].clientX)) - centerX;
            window.offsetY = (e.clientY || (e.touches && e.touches[0].clientY)) - centerY;
                
            // Store initial positions for group dragging
            const initialPositions = new Map();
            const toMove = selectedCards.size > 0 && selectedCards.has(card) ? Array.from(selectedCards) : [card];
            toMove.forEach(cardToMove => {
                const bounds = getCardBounds(cardToMove);
                initialPositions.set(cardToMove, { x: bounds.left, y: bounds.top });
            });
            window.initialPositions = initialPositions;
            
            card.classList.add('dragging');
            container.addEventListener('pointermove', onPointerMove);
            window.addEventListener('pointerup', onPointerUp);
        });
    });
}
