/**
 * Draw Hand Feature Module
 * 
 * Encapsulates all Draw Hand functionality for deck editing.
 * Allows users to draw a random hand of 8 cards (9 if events are present)
 * from their deck, excluding characters, locations, and missions.
 * 
 * Features:
 * - Draw random hand from playable cards
 * - Drag and drop reordering of drawn cards
 * - Integration with KO feature for dimming unusable cards
 * - Button state management based on playable card count
 * 
 * Dependencies:
 * - window.deckEditorCards - Deck cards array
 * - window.availableCardsMap - Card data map
 * - window.SimulateKO - KO feature integration (for dimming)
 * - getCardImagePath() - Global function for card image paths
 * 
 * Public API (window.DrawHand):
 * - init() - Initialize module state
 * - drawHand() - Draw a new random hand
 * - displayDrawnCards(cards) - Display cards in draw hand pane
 * - toggle() - Toggle draw hand pane visibility
 * - close() - Close draw hand pane
 * - updateButtonState(deckCards) - Update button enable/disable state
 * - getDrawnCards() - Get current drawn cards array
 * - refresh() - Refresh display (used by KO feature)
 * 
 * Usage:
 * ```javascript
 * // Draw a new hand
 * window.DrawHand.drawHand();
 * 
 * // Toggle pane visibility
 * window.DrawHand.toggle();
 * 
 * // Update button state when deck changes
 * window.DrawHand.updateButtonState(deckCards);
 * ```
 * 
 * @module DrawHand
 * @since Draw Hand refactoring (Phase 1-6)
 */

(function() {
    'use strict';

    // Private state
    let drawnCards = [];
    let draggedIndex = null;

    /**
     * Initialize Draw Hand module (called on page load)
     */
    function init() {
        // Initialize state
        drawnCards = [];
        draggedIndex = null;
        
        // Maintain window.drawnCards for backward compatibility
        window.drawnCards = drawnCards;
    }

    /**
     * Draw a random hand from the deck
     * Filters out characters, locations, and missions
     * Draws 8 cards, or 9 if event cards are present
     * 
     * @public
     * @function drawHand
     */
    function drawHand() {
        const deckCards = window.deckEditorCards || [];
        
        // Filter out characters, locations, and missions to create draw pile
        // Also filter out cards with exclude_from_draw: true
        const drawPile = [];
        deckCards.forEach(card => {
            if (card.type !== 'character' && card.type !== 'location' && card.type !== 'mission') {
                // Skip cards that are excluded from draw hand
                if (card.exclude_from_draw === true) {
                    return;
                }
                // Add each copy of the card to the draw pile
                for (let i = 0; i < card.quantity; i++) {
                    drawPile.push(card);
                }
            }
        });

        // Draw 8 random cards, then check for event cards to determine if we need a 9th
        const newDrawnCards = [];
        const usedIndices = new Set();
        const targetHandSize = 8;
        
        // Safety check: don't try to draw more cards than available
        const maxCardsToDraw = Math.min(targetHandSize, drawPile.length);
        
        // Prevent infinite loop: break if we've tried too many times
        let attempts = 0;
        const maxAttempts = drawPile.length * 10; // Reasonable limit
        
        while (newDrawnCards.length < maxCardsToDraw && attempts < maxAttempts) {
            attempts++;
            const randomIndex = Math.floor(Math.random() * drawPile.length);
            if (!usedIndices.has(randomIndex)) {
                usedIndices.add(randomIndex);
                newDrawnCards.push(drawPile[randomIndex]);
            }
        }

        // Check if we have any event cards and draw a 9th card if so (maximum 9 cards total)
        const hasEventCards = newDrawnCards.some(card => card.type === 'event');
        if (hasEventCards && drawPile.length > 8 && newDrawnCards.length < 9 && newDrawnCards.length < drawPile.length) {
            // Draw exactly one more card to make it 9 total (never more than 9)
            let eventAttempts = 0;
            const maxEventAttempts = drawPile.length * 2;
            while (newDrawnCards.length < 9 && eventAttempts < maxEventAttempts) {
                eventAttempts++;
                const randomIndex = Math.floor(Math.random() * drawPile.length);
                if (!usedIndices.has(randomIndex)) {
                    usedIndices.add(randomIndex);
                    newDrawnCards.push(drawPile[randomIndex]);
                    break; // Only draw one additional card
                }
            }
        }

        // Store drawn cards globally for drag and drop (backward compatibility)
        drawnCards = newDrawnCards;
        window.drawnCards = drawnCards;
        
        // Display the drawn cards
        displayDrawnCards(drawnCards);
    }

    /**
     * Display drawn cards in the draw hand pane
     * Includes KO dimming integration with SimulateKO module
     * 
     * @public
     * @function displayDrawnCards
     * @param {Array} cards - Array of card objects to display
     */
    function displayDrawnCards(cards) {
        const drawHandContent = document.getElementById('drawHandContent');
        if (!drawHandContent) {
            console.warn('Draw hand content element not found');
            return;
        }
        
        // Update internal state
        drawnCards = cards || [];
        window.drawnCards = drawnCards;
        
        drawHandContent.innerHTML = '';

        cards.forEach((card, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'drawn-card';
            cardElement.draggable = true;
            cardElement.dataset.index = index;
            
            // Add event-card class for horizontal orientation
            if (card.type === 'event') {
                cardElement.classList.add('event-card');
            }
            
            // Check if card should be dimmed based on KO'd characters
            // Integration with SimulateKO module for KO dimming
            if (window.SimulateKO && window.SimulateKO.shouldDimCard) {
                const shouldDim = window.SimulateKO.shouldDimCard(
                    card, 
                    window.availableCardsMap || new Map(), 
                    window.deckEditorCards || []
                );
                if (shouldDim) {
                    cardElement.classList.add('ko-dimmed');
                }
            }
            
            // Get the card image path
            const availableCard = window.availableCardsMap && window.availableCardsMap.get(card.cardId);
            if (availableCard) {
                const imagePath = getCardImagePath(availableCard, card.type);
                cardElement.style.backgroundImage = `url('${imagePath}')`;
                
                // Add hover tooltip
                cardElement.title = availableCard.name || availableCard.card_name || card.name || 'Unknown Card';
            } else {
                // Fallback for unknown cards
                cardElement.style.backgroundImage = 'url("/src/resources/cards/images/placeholder.webp")';
                cardElement.title = 'Unknown Card';
            }
            
            // Add drag and drop event listeners
            cardElement.addEventListener('dragstart', handleDragStart);
            cardElement.addEventListener('dragend', handleDragEnd);
            cardElement.addEventListener('dragover', handleDragOver);
            cardElement.addEventListener('drop', handleDrop);
            
            drawHandContent.appendChild(cardElement);
        });
        
        // Add drag and drop to the container
        drawHandContent.addEventListener('dragover', handleContainerDragOver);
        drawHandContent.addEventListener('drop', handleContainerDrop);
    }

    /**
     * Handle drag start event for drawn cards
     */
    function handleDragStart(e) {
        draggedIndex = parseInt(e.target.dataset.index);
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.target.outerHTML);
        
        // Add visual feedback to other cards
        const allCards = document.querySelectorAll('.drawn-card');
        allCards.forEach((card, index) => {
            if (index !== draggedIndex) {
                card.classList.add('drag-target');
            }
        });
    }

    /**
     * Handle drag end event for drawn cards
     */
    function handleDragEnd(e) {
        e.target.classList.remove('dragging');
        draggedIndex = null;
        
        // Remove visual feedback from all cards
        const allCards = document.querySelectorAll('.drawn-card');
        allCards.forEach(card => {
            card.classList.remove('drag-target');
        });
    }

    /**
     * Handle drag over event for drawn cards
     */
    function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    /**
     * Handle drop event for drawn cards (reordering)
     */
    function handleDrop(e) {
        e.preventDefault();
        const targetIndex = parseInt(e.target.dataset.index);
        
        if (draggedIndex !== null && targetIndex !== null && draggedIndex !== targetIndex) {
            // Swap the cards
            const temp = drawnCards[draggedIndex];
            drawnCards[draggedIndex] = drawnCards[targetIndex];
            drawnCards[targetIndex] = temp;
            
            // Update global state for backward compatibility
            window.drawnCards = drawnCards;
            
            // Re-render the cards
            displayDrawnCards(drawnCards);
        }
    }

    /**
     * Handle drag over event for container
     */
    function handleContainerDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        e.target.classList.add('drag-over');
    }

    /**
     * Handle drop event for container
     */
    function handleContainerDrop(e) {
        e.preventDefault();
        e.target.classList.remove('drag-over');
    }

    /**
     * Toggle draw hand pane visibility
     * Shows pane and draws hand if hidden, or draws new hand if visible
     * 
     * @public
     * @function toggle
     */
    function toggle() {
        const drawHandSection = document.getElementById('drawHandSection');
        const drawHandBtn = document.getElementById('drawHandBtn');
        
        if (!drawHandSection || !drawHandBtn) {
            console.warn('Draw hand elements not found');
            return;
        }
        
        if (drawHandSection.style.display === 'none' || !drawHandSection.style.display) {
            drawHandSection.style.display = 'block';
            // Keep label stable to avoid header button reflow when the pane opens
            drawHandBtn.textContent = 'Draw Hand';
            drawHand();
        } else {
            drawHand();
        }
    }

    /**
     * Close draw hand pane
     * Hides the pane and resets button text
     * 
     * @public
     * @function close
     */
    function close() {
        const drawHandSection = document.getElementById('drawHandSection');
        const drawHandBtn = document.getElementById('drawHandBtn');
        
        if (!drawHandSection || !drawHandBtn) {
            console.warn('Draw hand elements not found');
            return;
        }
        
        drawHandSection.style.display = 'none';
        drawHandBtn.textContent = 'Draw Hand';
    }

    /**
     * Update button state based on playable card count
     * Button is enabled when deck has 8+ playable cards
     * 
     * @public
     * @function updateButtonState
     * @param {Array} deckCards - Array of deck cards
     */
    function updateButtonState(deckCards) {
        const drawHandBtn = document.getElementById('drawHandBtn');
        
        if (!drawHandBtn) {
            return;
        }
        
        // Count playable cards (excluding characters, locations, missions)
        const playableCardsCount = (deckCards || [])
            .filter(card => card.type !== 'character' && card.type !== 'location' && card.type !== 'mission')
            .reduce((sum, card) => sum + (card.quantity || 0), 0);
        
        if (playableCardsCount >= 8) {
            drawHandBtn.disabled = false;
            drawHandBtn.style.opacity = "1";
            drawHandBtn.style.cursor = "pointer";
            drawHandBtn.title = ""; // Remove tooltip when enabled
        } else {
            drawHandBtn.disabled = true;
            drawHandBtn.style.opacity = "0.5";
            drawHandBtn.style.cursor = "not-allowed";
            drawHandBtn.title = "Deck must contain at least 8 playable cards."; // Add tooltip when disabled
        }
    }

    /**
     * Get current drawn cards (for compatibility)
     * 
     * @public
     * @function getDrawnCards
     * @returns {Array} Array of currently drawn cards
     */
    function getDrawnCards() {
        return drawnCards;
    }

    /**
     * Refresh draw hand display (used by KO feature)
     * Re-displays current drawn cards with updated dimming
     * Called automatically when characters are KO'd/un-KO'd
     * 
     * @public
     * @function refresh
     */
    function refresh() {
        // Use private drawnCards if available, otherwise fall back to window.drawnCards
        const cardsToDisplay = (drawnCards && drawnCards.length > 0) ? drawnCards : (window.drawnCards || []);
        if (cardsToDisplay && cardsToDisplay.length > 0) {
            displayDrawnCards(cardsToDisplay);
        }
    }

    // Public API
    window.DrawHand = {
        init: init,
        drawHand: drawHand,
        displayDrawnCards: displayDrawnCards,
        toggle: toggle,
        close: close,
        updateButtonState: updateButtonState,
        getDrawnCards: getDrawnCards,
        refresh: refresh
    };

    // Initialize on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Maintain backward compatibility - expose displayDrawnCards globally
    // This is used by the KO feature to refresh the draw hand
    window.displayDrawnCards = function(cards) {
        displayDrawnCards(cards);
        // Update internal state
        drawnCards = cards;
        window.drawnCards = cards;
    };

})();

