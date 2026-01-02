/**
 * Card Hover Modal Module
 * Extracted from public/index.html for better organization
 * 
 * Provides global functions for displaying card previews on hover.
 * Functions are attached to window object for backward compatibility.
 */

(function() {
    'use strict';
    
    /**
     * Positions the modal based on mouse position and button avoidance logic.
     * 
     * Algorithm:
     * 1. Start with mouse position + 80px offset
     * 2. Detect nearby buttons and reposition to avoid them
     * 3. Ensure minimum 100px distance from cursor
     * 4. Constrain to viewport boundaries
     * 
     * Button avoidance priority:
     * - Left of button → Below button → Above button → Right of button
     * 
     * @param {MouseEvent} event - Mouse event containing clientX/clientY coordinates
     * @param {HTMLElement} modal - The modal element to position
     * @private
     */
    function positionModal(event, modal, cardType) {
        let x = event.clientX + 80;  // Larger offset to avoid cursor area
        let y = event.clientY + 80;  // Larger offset to avoid cursor area
        
        // Adjust modal dimensions based on card orientation
        // Horizontal cards (locations, characters, events) are wider
        const isHorizontalCard = cardType === 'location' || cardType === 'character' || cardType === 'event';
        const modalWidth = isHorizontalCard ? 503 : 365; // Wider for horizontal cards (483px image + 20px padding)
        const modalHeight = isHorizontalCard ? 365 : 503; // Shorter for horizontal cards
        
        // Button Avoidance Logic:
        // Detects nearby interactive buttons and repositions modal to avoid overlap.
        // Uses different buffer zones: 120px for deck/collection cards, 60px for plus buttons.
        // Priority order: left → below → above → right
        // Check if we're near any buttons and adjust position
        const target = event.target;
        const cardElement = target.closest('.deck-card-editor-item, .card-item, .collection-card-item');
        if (cardElement) {
            // Handle collection view cards
            if (cardElement.classList.contains('collection-card-item')) {
                // Check for actions container first (similar to deck editor)
                const actionsContainer = cardElement.querySelector('.collection-card-actions, .collection-quantity-control');
                if (actionsContainer) {
                    const rect = actionsContainer.getBoundingClientRect();
                    
                    // If mouse is near the actions area, position modal to avoid it
                    if (event.clientX > rect.left - 100 && event.clientY > rect.top - 100) {
                        // Try positioning to the left first with larger offset
                        x = event.clientX - modalWidth - 80;
                        y = event.clientY + 50;
                        
                        // If that would go off screen, try positioning below and to the right
                        if (x < 10) {
                            x = event.clientX + 80;
                            y = event.clientY + modalHeight + 50;
                        }
                    }
                }
                
                // Check for quantity buttons in collection view
                const buttons = cardElement.querySelectorAll('.collection-quantity-btn');
                let buttonAvoided = false;
                
                buttons.forEach(button => {
                    const buttonRect = button.getBoundingClientRect();
                    
                    // Check if mouse is near the button area (larger detection zone)
                    const buffer = 120; // Larger buffer zone for detection
                    if (event.clientX > buttonRect.left - buffer && event.clientX < buttonRect.right + buffer &&
                        event.clientY > buttonRect.top - buffer && event.clientY < buttonRect.bottom + buffer) {
                        
                        // Position modal to the left of the button with large offset
                        x = buttonRect.left - modalWidth - 80;
                        y = buttonRect.top - modalHeight / 2;
                        
                        // If that goes off screen, try positioning below with large offset
                        if (x < 10) {
                            x = buttonRect.right + 80;
                            y = buttonRect.top - modalHeight / 2;
                        }
                        
                        // If still off screen, try positioning above
                        if (y < 10) {
                            x = buttonRect.left - modalWidth / 2;
                            y = buttonRect.top - modalHeight - 80;
                        }
                        
                        // If still off screen, try positioning to the right
                        if (x + modalWidth > window.innerWidth - 10) {
                            x = buttonRect.left - modalWidth - 80;
                            y = buttonRect.bottom + 80;
                        }
                        
                        buttonAvoided = true;
                    }
                });
                
                // If no button was avoided, use default positioning but check for overlap
                if (!buttonAvoided) {
                    buttons.forEach(button => {
                        const buttonRect = button.getBoundingClientRect();
                        
                        // If modal would overlap with button, move it away
                        if (x < buttonRect.right + 20 && x + modalWidth > buttonRect.left - 20 &&
                            y < buttonRect.bottom + 20 && y + modalHeight > buttonRect.top - 20) {
                            // Try positioning to the left of the button with larger offset
                            x = buttonRect.left - modalWidth - 80;
                            y = buttonRect.top - modalHeight / 2;
                            
                            // If that goes off screen, try positioning below with larger offset
                            if (x < 10) {
                                x = buttonRect.right + 80;
                                y = buttonRect.bottom + 80;
                            }
                        }
                    });
                }
            }
            
            // Handle deck editor cards
            if (cardElement.classList.contains('deck-card-editor-item')) {
                // Check for any buttons in the deck editor card element first
                const buttons = cardElement.querySelectorAll('.quantity-btn, .remove-all-btn, .reserve-btn');
                let buttonAvoided = false;
                
                buttons.forEach(button => {
                    const buttonRect = button.getBoundingClientRect();
                    
                    // Check if mouse is near the button area (larger detection zone)
                    const buffer = 120; // Larger buffer zone for detection
                    if (event.clientX > buttonRect.left - buffer && event.clientX < buttonRect.right + buffer &&
                        event.clientY > buttonRect.top - buffer && event.clientY < buttonRect.bottom + buffer) {
                        
                        // Position modal to the left of the button with large offset
                        x = buttonRect.left - modalWidth - 80;
                        y = buttonRect.top - modalHeight / 2;
                        
                        // If that goes off screen, try positioning below with large offset
                        if (x < 10) {
                            x = buttonRect.right + 80;
                            y = buttonRect.top - modalHeight / 2;
                        }
                        
                        // If still off screen, try positioning above
                        if (y < 10) {
                            x = buttonRect.left - modalWidth / 2;
                            y = buttonRect.top - modalHeight - 80;
                        }
                        
                        // If still off screen, try positioning to the right
                        if (x + modalWidth > window.innerWidth - 10) {
                            x = buttonRect.left - modalWidth - 80;
                            y = buttonRect.bottom + 80;
                        }
                        
                        buttonAvoided = true;
                    }
                });
                
                // If no button was avoided, use default positioning but check for overlap
                if (!buttonAvoided) {
                    buttons.forEach(button => {
                        const buttonRect = button.getBoundingClientRect();
                        
                        // If modal would overlap with button, move it away
                        if (x < buttonRect.right + 20 && x + modalWidth > buttonRect.left - 20 &&
                            y < buttonRect.bottom + 20 && y + modalHeight > buttonRect.top - 20) {
                            // Try positioning to the left of the button with larger offset
                            x = buttonRect.left - modalWidth - 80;
                            y = buttonRect.top - modalHeight / 2;
                            
                            // If that goes off screen, try positioning below with larger offset
                            if (x < 10) {
                                x = buttonRect.right + 80;
                                y = buttonRect.bottom + 80;
                            }
                        }
                    });
                }
            }
            
            // Handle available cards (card-item)
            if (cardElement.classList.contains('card-item')) {
                // Check for plus button in available cards
                const plusButton = cardElement.querySelector('.card-item-plus');
                if (plusButton) {
                    const buttonRect = plusButton.getBoundingClientRect();
                    
                    // Always position modal to avoid plus button area with larger buffer
                    const buffer = 60; // Larger buffer zone
                    if (event.clientX > buttonRect.left - buffer && event.clientX < buttonRect.right + buffer &&
                        event.clientY > buttonRect.top - buffer && event.clientY < buttonRect.bottom + buffer) {
                        
                        // Position to the left of the plus button with larger offset
                        x = buttonRect.left - modalWidth - 80;
                        y = buttonRect.top - modalHeight / 2;
                        
                        // If that goes off screen, try positioning below with larger offset
                        if (x < 10) {
                            x = buttonRect.left + 80;
                            y = buttonRect.bottom + 80;
                        }
                        
                        // If still off screen, try positioning above
                        if (y + modalHeight > window.innerHeight - 10) {
                            y = buttonRect.top - modalHeight - 80;
                        }
                    }
                }
            }
        }
        
        // Minimum Distance Check:
        // Ensures modal maintains at least 100px distance from cursor to avoid blocking view
        const minDistanceFromCursor = 100; // Increased distance
        if (Math.abs(x - event.clientX) < minDistanceFromCursor) {
            x = event.clientX + minDistanceFromCursor;
        }
        if (Math.abs(y - event.clientY) < minDistanceFromCursor) {
            y = event.clientY + minDistanceFromCursor;
        }
        
        // Viewport Boundary Constraints:
        // Keeps modal fully visible by constraining to viewport edges with 10px padding
        // Ensure modal doesn't go off screen
        if (x < 10) x = 10;
        if (y < 10) y = 10;
        if (x + modalWidth > window.innerWidth - 10) {
            x = window.innerWidth - modalWidth - 10;
        }
        if (y + modalHeight > window.innerHeight - 10) {
            y = window.innerHeight - modalHeight - 10;
        }
        
        modal.style.left = x + 'px';
        modal.style.top = y + 'px';
    }
    
    /**
     * Calculates combinations C(n, k) = n! / (k! * (n-k)!)
     * Uses iterative approach to avoid factorial overflow
     * 
     * @param {number} n - Total items
     * @param {number} k - Items to choose
     * @returns {number} Number of combinations
     * @private
     */
    function combinations(n, k) {
        if (k > n || k < 0 || n < 0) return 0;
        if (k === 0 || k === n) return 1;
        if (k > n - k) k = n - k; // Use symmetry
        
        let result = 1;
        for (let i = 0; i < k; i++) {
            result = result * (n - i) / (i + 1);
        }
        return Math.round(result);
    }
    
    /**
     * Builds the draw pile array from deckEditorCards
     * Excludes characters, locations, missions, and cards with exclude_from_draw: true
     * 
     * @returns {Array} Array of card objects in the draw pile (expanded by quantity)
     * @private
     */
    function getDrawPile() {
        if (!window.deckEditorCards) return [];
        
        const drawPile = [];
        window.deckEditorCards.forEach(card => {
            if (card.type !== 'character' && card.type !== 'location' && card.type !== 'mission') {
                // Skip cards that are excluded from draw hand
                if (card.exclude_from_draw === true) {
                    return;
                }
                // Add each copy of the card to the draw pile
                for (let i = 0; i < (card.quantity || 1); i++) {
                    drawPile.push(card);
                }
            }
        });
        return drawPile;
    }
    
    /**
     * Determines hand size for duplicate probability calculations
     * Hand size is always 8 cards - this is when duplicates are determined.
     * Note: The "Draw Hand" feature draws 9 cards to simulate event card replacement,
     * but duplicate determination happens with the initial 8-card hand.
     * 
     * @returns {number} Hand size (always 8)
     * @private
     */
    function getHandSize() {
        // Hand size is always 8 for duplicate calculations
        // The 9th card in Draw Hand feature is just for simulation of event replacement
        return 8;
    }
    
    /**
     * Checks if two cards are considered duplicates based on card type rules
     * 
     * @param {Object} card1 - First card object
     * @param {Object} card2 - Second card object
     * @param {string} cardType - Type of card ('special', 'teamwork', 'power', 'event', etc.)
     * @returns {boolean} True if cards are duplicates
     * @private
     */
    function isDuplicate(card1, card2, cardType) {
        if (!card1 || !card2) return false;
        
        // Get card data from availableCardsMap
        const card1Data = window.availableCardsMap ? window.availableCardsMap.get(card1.cardId) : null;
        const card2Data = window.availableCardsMap ? window.availableCardsMap.get(card2.cardId) : null;
        
        switch (cardType) {
            case 'special':
                // Special cards: same character AND same cardId
                const char1 = card1Data ? (card1Data.character || card1Data.character_name) : null;
                const char2 = card2Data ? (card2Data.character || card2Data.character_name) : null;
                // Both cards must have the same cardId AND same character
                return card1.cardId === card2.cardId && char1 !== null && char2 !== null && char1 === char2;
                
            case 'teamwork':
                // Teamwork cards: same to_use AND same followup_attack_types
                const toUse1 = card1Data ? (card1Data.to_use || null) : null;
                const toUse2 = card2Data ? (card2Data.to_use || null) : null;
                const followup1 = card1Data ? (card1Data.followup_attack_types || card1Data.follow_up_attack_types || null) : null;
                const followup2 = card2Data ? (card2Data.followup_attack_types || card2Data.follow_up_attack_types || null) : null;
                return toUse1 === toUse2 && followup1 === followup2 && toUse1 !== null;
                
            case 'power':
                // Power cards: same value (regardless of power type)
                const value1 = card1Data ? (card1Data.value || null) : null;
                const value2 = card2Data ? (card2Data.value || null) : null;
                return value1 === value2 && value1 !== null;
                
            case 'event':
                // All events are duplicates of each other
                return card1.type === 'event' && card2.type === 'event';
                
            default:
                // Other universe cards (ally-universe, basic-universe, training, aspect, advanced-universe): exact same cardId
                return card1.cardId === card2.cardId;
        }
    }
    
    /**
     * Calculates the probability that drawing a hand would contain duplicates
     * Uses hypergeometric distribution
     * 
     * @param {string} cardId - ID of the hovered card
     * @param {string} cardType - Type of the hovered card
     * @returns {number} Probability as percentage (0-100), or null if calculation not possible
     * @private
     */
    function calculateDuplicateProbability(cardId, cardType) {
        const drawPile = getDrawPile();
        const handSize = getHandSize();
        
        // Edge cases
        if (drawPile.length === 0) return null;
        if (drawPile.length < handSize) {
            // If draw pile is smaller than hand size, probability is 100% if duplicates exist
            const duplicateCount = drawPile.filter(card => {
                const hoveredCard = window.deckEditorCards?.find(c => c.cardId === cardId && c.type === cardType);
                return hoveredCard && isDuplicate(card, hoveredCard, cardType);
            }).length;
            return duplicateCount > 0 ? 100 : 0;
        }
        
        // Find the hovered card in deckEditorCards
        const hoveredCard = window.deckEditorCards?.find(c => c.cardId === cardId && c.type === cardType);
        if (!hoveredCard) return null;
        
        // Count duplicate cards in draw pile
        let duplicateCount = 0;
        
        if (cardType === 'event') {
            // For events, count all event cards (all events are duplicates)
            duplicateCount = drawPile.filter(card => card.type === 'event').length;
            
            // Probability of drawing 2+ events
            // P(2+ events) = 1 - P(0 events) - P(1 event)
            const totalCards = drawPile.length;
            const nonEventCards = totalCards - duplicateCount;
            
            if (duplicateCount < 2) return 0;
            
            // P(0 events) = C(nonEventCards, handSize) / C(totalCards, handSize)
            const prob0Events = combinations(nonEventCards, handSize) / combinations(totalCards, handSize);
            
            // P(1 event) = E * C(nonEventCards, handSize-1) / C(totalCards, handSize)
            const prob1Event = duplicateCount * combinations(nonEventCards, handSize - 1) / combinations(totalCards, handSize);
            
            const prob = 1 - prob0Events - prob1Event;
            return Math.max(0, Math.min(100, prob * 100));
        } else {
            // For power cards, count ALL power cards with the same value (all are duplicates)
            // For other card types, count cards that would be duplicates
            let totalDuplicateCards;
            let hoveredCardCopies;
            
            if (cardType === 'power') {
                // For power cards, all cards with the same value are duplicates
                const hoveredCardData = window.availableCardsMap ? window.availableCardsMap.get(hoveredCard.cardId) : null;
                const hoveredValue = hoveredCardData ? (hoveredCardData.value || null) : null;
                if (hoveredValue !== null) {
                    // Count ALL power cards with the same value (this is the total duplicate count)
                    totalDuplicateCards = drawPile.filter(card => {
                        if (card.type !== 'power') return false;
                        const cardData = window.availableCardsMap ? window.availableCardsMap.get(card.cardId) : null;
                        return cardData && cardData.value === hoveredValue;
                    }).length;
                    hoveredCardCopies = totalDuplicateCards; // Same count for power cards
                } else {
                    // Fallback to cardId matching if value is not available
                    hoveredCardCopies = drawPile.filter(card => 
                        card.cardId === hoveredCard.cardId && card.type === hoveredCard.type
                    ).length;
                    totalDuplicateCards = hoveredCardCopies;
                }
            } else {
                // For other card types, count cards that would be duplicates
                // Exclude the hovered card itself from the count (a card can't be a duplicate of itself)
                duplicateCount = drawPile.filter(card => {
                    // Skip if this is the same card instance
                    if (card.cardId === hoveredCard.cardId && card.type === hoveredCard.type) {
                        return false;
                    }
                    return isDuplicate(card, hoveredCard, cardType);
                }).length;
                
                // Count copies of the hovered card itself
                hoveredCardCopies = drawPile.filter(card => 
                    card.cardId === hoveredCard.cardId && card.type === hoveredCard.type
                ).length;
                
                // Calculate total number of duplicate cards (including the hovered card itself)
                totalDuplicateCards = duplicateCount + hoveredCardCopies;
            }
            
            // If there are 2+ duplicate cards total, calculate probability of drawing 2+
            if (totalDuplicateCards >= 2) {
                // Calculate probability of drawing 2+ duplicate cards
                // P(2+ duplicates) = 1 - P(0 duplicates) - P(1 duplicate)
                const totalCards = drawPile.length;
                const nonDuplicateCards = totalCards - totalDuplicateCards;
                
                // P(0 duplicates) = C(nonDuplicateCards, handSize) / C(totalCards, handSize)
                const prob0Duplicates = combinations(nonDuplicateCards, handSize) / combinations(totalCards, handSize);
                
                // P(1 duplicate) = totalDuplicateCards * C(nonDuplicateCards, handSize-1) / C(totalCards, handSize)
                const prob1Duplicate = totalDuplicateCards * combinations(nonDuplicateCards, handSize - 1) / combinations(totalCards, handSize);
                
                const prob = 1 - prob0Duplicates - prob1Duplicate;
                return Math.max(0, Math.min(100, prob * 100));
            } else {
                // No other duplicate cards, only multiple copies of the same card
                // If there's only 1 copy, no duplicates possible
                if (hoveredCardCopies <= 1) return 0;
                
                // Calculate probability of drawing BOTH (or all) copies
                // P(drawing 2+ copies) = 1 - P(0 copies) - P(1 copy)
                const totalCards = drawPile.length;
                const nonCardCopies = totalCards - hoveredCardCopies;
                
                // P(0 copies) = C(nonCardCopies, handSize) / C(totalCards, handSize)
                const prob0Copies = combinations(nonCardCopies, handSize) / combinations(totalCards, handSize);
                
                // P(1 copy) = C(hoveredCardCopies, 1) * C(nonCardCopies, handSize-1) / C(totalCards, handSize)
                const prob1Copy = combinations(hoveredCardCopies, 1) * combinations(nonCardCopies, handSize - 1) / combinations(totalCards, handSize);
                
                const prob = 1 - prob0Copies - prob1Copy;
                return Math.max(0, Math.min(100, prob * 100));
            }
        }
    }
    
    /**
     * Calculates the probability of drawing a duplicate after placing one copy in the first hand
     * Assumes:
     * - One copy is already placed on the board
     * - A hand of 8 cards has been drawn
     * - One of those 8 cards was the placed copy
     * - Calculates probability of drawing at least 1 duplicate from remaining draw pile
     * 
     * @param {string} cardId - ID of the hovered card
     * @param {string} cardType - Type of the hovered card
     * @returns {number} Probability as percentage (0-100), or null if calculation not possible
     * @private
     */
    function calculatePlacedFirstHandDuplicateProbability(cardId, cardType) {
        const drawPile = getDrawPile();
        const handSize = getHandSize();
        
        // Edge cases
        if (drawPile.length === 0) return null;
        
        // Find the hovered card in deckEditorCards
        const hoveredCard = window.deckEditorCards?.find(c => c.cardId === cardId && c.type === cardType);
        if (!hoveredCard) return null;
        
        // Get total duplicate count (reuse logic from calculateDuplicateProbability)
        let totalDuplicateCards;
        let hoveredCardCopies;
        
        if (cardType === 'event') {
            // For events, count all event cards
            totalDuplicateCards = drawPile.filter(card => card.type === 'event').length;
            hoveredCardCopies = totalDuplicateCards;
        } else if (cardType === 'power') {
            // For power cards, count ALL power cards with the same value
            const hoveredCardData = window.availableCardsMap ? window.availableCardsMap.get(hoveredCard.cardId) : null;
            const hoveredValue = hoveredCardData ? (hoveredCardData.value || null) : null;
            if (hoveredValue !== null) {
                totalDuplicateCards = drawPile.filter(card => {
                    if (card.type !== 'power') return false;
                    const cardData = window.availableCardsMap ? window.availableCardsMap.get(card.cardId) : null;
                    return cardData && cardData.value === hoveredValue;
                }).length;
                hoveredCardCopies = totalDuplicateCards;
            } else {
                // Fallback to cardId matching if value is not available
                hoveredCardCopies = drawPile.filter(card => 
                    card.cardId === hoveredCard.cardId && card.type === hoveredCard.type
                ).length;
                totalDuplicateCards = hoveredCardCopies;
            }
        } else {
            // For other card types, count duplicates
            const duplicateCount = drawPile.filter(card => {
                if (card.cardId === hoveredCard.cardId && card.type === hoveredCard.type) {
                    return false;
                }
                return isDuplicate(card, hoveredCard, cardType);
            }).length;
            
            hoveredCardCopies = drawPile.filter(card => 
                card.cardId === hoveredCard.cardId && card.type === hoveredCard.type
            ).length;
            
            totalDuplicateCards = duplicateCount + hoveredCardCopies;
        }
        
        // If there are fewer than 2 duplicates, return 0%
        if (totalDuplicateCards < 2) return 0;
        
        // Calculate remaining draw pile after first hand (8 cards drawn, 1 duplicate placed)
        const originalDrawPileSize = drawPile.length;
        const remainingDrawPileSize = originalDrawPileSize - 8;
        const remainingDuplicates = totalDuplicateCards - 1;
        
        // Edge cases
        if (remainingDrawPileSize <= 0) return null;
        if (remainingDuplicates < 1) return 0;
        if (remainingDrawPileSize < handSize) {
            // If remaining pile is smaller than hand size, check if duplicates exist
            return remainingDuplicates > 0 ? 100 : 0;
        }
        
        // Calculate probability of drawing at least 1 duplicate from remaining pile
        // P(at least 1 duplicate) = 1 - P(0 duplicates)
        // P(0 duplicates) = C(nonDuplicates, handSize) / C(remainingDrawPileSize, handSize)
        const nonDuplicates = remainingDrawPileSize - remainingDuplicates;
        
        // P(0 duplicates) = C(nonDuplicates, handSize) / C(remainingDrawPileSize, handSize)
        const prob0Duplicates = combinations(nonDuplicates, handSize) / combinations(remainingDrawPileSize, handSize);
        
        // P(at least 1 duplicate) = 1 - P(0 duplicates)
        const prob = 1 - prob0Duplicates;
        return Math.max(0, Math.min(100, prob * 100));
    }
    
    /**
     * Shows the card hover modal with an enlarged preview of the card.
     * 
     * The modal is positioned near the mouse cursor, avoiding buttons and staying
     * within the viewport. It tracks mouse movement to maintain optimal positioning.
     * 
     * @param {string} imagePath - Path to the card image file (relative or absolute)
     * @param {string} cardName - Display name of the card (currently not shown in caption)
     * @param {string} [cardId] - Optional card ID for statistics display
     * @param {string} [cardType] - Optional card type for statistics display
     * 
     * @example
     * // Basic usage in HTML
     * onmouseenter="showCardHoverModal('characters/hercules.webp', 'Hercules')"
     * 
     * @example
     * // JavaScript usage with statistics
     * showCardHoverModal('characters/hercules.webp', 'Hercules', 'char-123', 'character');
     */
    window.showCardHoverModal = function(imagePath, cardName, cardId, cardType) {
        
        // Clear any existing hide timeout
        if (window.hoverHideTimeout) {
            clearTimeout(window.hoverHideTimeout);
            window.hoverHideTimeout = null;
        }
        
        const modal = document.getElementById('cardHoverModal');
        const image = document.getElementById('cardHoverImage');
        const caption = document.getElementById('cardHoverCaption');
        const stats = document.getElementById('cardHoverStats');
        
        if (modal && image && caption) {
            // Set card type data attribute for CSS styling
            if (cardType) {
                modal.setAttribute('data-card-type', cardType);
            } else {
                modal.removeAttribute('data-card-type');
            }
            image.src = imagePath;
            caption.textContent = '';
            
            // Add error handler to see if image fails to load
            image.onerror = function() {
                // Image failed to load
            };
            image.onload = function() {
                // Image loaded successfully
            };
            
            // Statistics Display Logic
            // Only show statistics for ADMIN users
            const isAdmin = typeof getCurrentUser === 'function' && getCurrentUser() && getCurrentUser().role === 'ADMIN';
            
            if (stats && cardId && cardType && window.deckEditorCards && isAdmin) {
                // Get card name from availableCardsMap
                const availableCard = window.availableCardsMap ? window.availableCardsMap.get(cardId) : null;
                const dbCardName = availableCard ? (availableCard.name || availableCard.card_name || cardName) : cardName;
                
                // Check if card is character, location, or mission (show threat level instead of count)
                if (cardType === 'character' || cardType === 'location' || cardType === 'mission') {
                    // For missions, only show card name (no threat level)
                    if (cardType === 'mission') {
                        stats.innerHTML = `<div class="card-hover-stats-name">${dbCardName}</div>`;
                        stats.style.display = 'block';
                    } else {
                        // For characters and locations, show threat level
                        // Get threat level from availableCard
                        // For locations, threat_level can be 0 or null/undefined, so we default to 0 if null/undefined
                        let threatLevel = availableCard ? (availableCard.threat_level !== null && availableCard.threat_level !== undefined ? availableCard.threat_level : (cardType === 'location' ? 0 : null)) : (cardType === 'location' ? 0 : null);
                        
                        // Apply reserve character adjustments for characters
                        if (cardType === 'character' && threatLevel !== null && threatLevel !== undefined && threatLevel > 0 && window.currentDeckData) {
                            const reserveCharacterId = window.currentDeckData.metadata?.reserve_character;
                            if (cardId === reserveCharacterId && availableCard) {
                                // Victory Harben: 18 -> 20 when reserve (+2)
                                if (availableCard.name === 'Victory Harben') {
                                    threatLevel = 20;
                                }
                                // Carson of Venus: 18 -> 19 when reserve (+1)
                                else if (availableCard.name === 'Carson of Venus') {
                                    threatLevel = 19;
                                }
                                // Morgan Le Fay: 19 -> 20 when reserve (+1)
                                else if (availableCard.name === 'Morgan Le Fay') {
                                    threatLevel = 20;
                                }
                            }
                        }
                        
                        // Display threat level (show even if 0, but hide if null/undefined for characters)
                        if (threatLevel !== null && threatLevel !== undefined) {
                            stats.innerHTML = `<div class="card-hover-stats-name">${dbCardName}</div><div class="card-hover-stats-count">Threat: ${threatLevel}</div>`;
                            stats.style.display = 'block';
                        } else {
                            stats.style.display = 'none';
                        }
                    }
                } else {
                    // For draw pile cards, show count format
                    // Calculate draw pile size (exclude characters, locations, and missions)
                    const drawPileSize = window.deckEditorCards
                        .filter(card => !['character', 'location', 'mission'].includes(card.type))
                        .reduce((sum, card) => sum + (card.quantity || 1), 0);
                    
                    // Special handling for event cards
                    if (cardType === 'event') {
                        // Count all event cards in the deck
                        const totalEventCount = window.deckEditorCards
                            .filter(card => card.type === 'event')
                            .reduce((sum, card) => sum + (card.quantity || 1), 0);
                        
                        // Calculate duplicate probability
                        const duplicateProb = calculateDuplicateProbability(cardId, cardType);
                        
                        // Display statistics: "{number of events} Events / {cards in draw pile} Cards in Draw Pile"
                        // Note: Event cards cannot be placed, so we don't show "placed first hand" statistic
                        if (totalEventCount > 0) {
                            let statsHtml = `<div class="card-hover-stats-name">${dbCardName}</div><div class="card-hover-stats-count">${totalEventCount} Events / ${drawPileSize} Cards in Draw Pile</div>`;
                            if (duplicateProb !== null && duplicateProb !== undefined) {
                                statsHtml += `<div class="card-hover-stats-count">Duplication Risk: ${duplicateProb.toFixed(1)}% of Hands</div>`;
                            }
                            stats.innerHTML = statsHtml;
                            stats.style.display = 'block';
                        } else {
                            stats.style.display = 'none';
                        }
                    } else if (['special', 'ally-universe', 'basic-universe', 'training', 'aspect', 'advanced-universe'].includes(cardType)) {
                        // Special handling for special, ally-universe, basic-universe, training, aspect, and advanced-universe cards
                        // Calculate total count in deck (sum quantities for matching cardId and type)
                        const totalCount = window.deckEditorCards
                            .filter(card => card.cardId === cardId && card.type === cardType)
                            .reduce((sum, card) => sum + (card.quantity || 1), 0);
                        
                        // Calculate duplicate probability
                        const duplicateProb = calculateDuplicateProbability(cardId, cardType);
                        const placedFirstHandProb = calculatePlacedFirstHandDuplicateProbability(cardId, cardType);
                        
                        // Display statistics: "{number of copies} Copy/Copies / {Cards in draw pile} Cards in Draw Pile"
                        if (totalCount > 0) {
                            const copyText = totalCount === 1 ? 'Copy' : 'Copies';
                            let statsHtml = `<div class="card-hover-stats-name">${dbCardName}</div><div class="card-hover-stats-count">${totalCount} ${copyText} / ${drawPileSize} Cards in Draw Pile</div>`;
                            if (duplicateProb !== null && duplicateProb !== undefined) {
                                statsHtml += `<div class="card-hover-stats-count">Duplication Risk: ${duplicateProb.toFixed(1)}% of Hands</div>`;
                            }
                            if (placedFirstHandProb !== null && placedFirstHandProb !== undefined) {
                                statsHtml += `<div class="card-hover-stats-count">Chance to duplicate if placed first hand: ${placedFirstHandProb.toFixed(1)}% of Hands</div>`;
                            }
                            stats.innerHTML = statsHtml;
                            stats.style.display = 'block';
                        } else {
                            stats.style.display = 'none';
                        }
                    } else if (cardType === 'power') {
                        // Special handling for power cards
                        // Get the value of this power card
                        const powerValue = availableCard ? (availableCard.value || null) : null;
                        
                        if (powerValue !== null) {
                            // Count all power cards with the same value
                            const powerCardsWithSameValue = window.deckEditorCards
                                .filter(card => {
                                    if (card.type !== 'power') return false;
                                    const cardData = window.availableCardsMap ? window.availableCardsMap.get(card.cardId) : null;
                                    return cardData && cardData.value === powerValue;
                                })
                                .reduce((sum, card) => sum + (card.quantity || 1), 0);
                            
                            // Calculate duplicate probability
                            const duplicateProb = calculateDuplicateProbability(cardId, cardType);
                            const placedFirstHandProb = calculatePlacedFirstHandDuplicateProbability(cardId, cardType);
                            
                            // Display statistics: "{number of power cards with this value} Power Cards of Value {value} / {num cards in draw pile} Cards in Draw Pile"
                            if (powerCardsWithSameValue > 0) {
                                let statsHtml = `<div class="card-hover-stats-name">${dbCardName}</div><div class="card-hover-stats-count">${powerCardsWithSameValue} Power Cards of Value ${powerValue} / ${drawPileSize} Cards in Draw Pile</div>`;
                                if (duplicateProb !== null && duplicateProb !== undefined) {
                                    statsHtml += `<div class="card-hover-stats-count">Duplication Risk: ${duplicateProb.toFixed(1)}% of Hands</div>`;
                                }
                                if (placedFirstHandProb !== null && placedFirstHandProb !== undefined) {
                                    statsHtml += `<div class="card-hover-stats-count">Chance to duplicate if placed first hand: ${placedFirstHandProb.toFixed(1)}% of Hands</div>`;
                                }
                                stats.innerHTML = statsHtml;
                                stats.style.display = 'block';
                            } else {
                                stats.style.display = 'none';
                            }
                        } else {
                            // Fallback to regular count format if value is not available
                            const totalCount = window.deckEditorCards
                                .filter(card => card.cardId === cardId && card.type === cardType)
                                .reduce((sum, card) => sum + (card.quantity || 1), 0);
                            
                            // Calculate duplicate probability
                            const duplicateProb = calculateDuplicateProbability(cardId, cardType);
                            const placedFirstHandProb = calculatePlacedFirstHandDuplicateProbability(cardId, cardType);
                            
                            if (totalCount > 0) {
                                let statsHtml = `<div class="card-hover-stats-name">${dbCardName}</div><div class="card-hover-stats-count">${totalCount}/${drawPileSize}</div>`;
                                if (duplicateProb !== null && duplicateProb !== undefined) {
                                    statsHtml += `<div class="card-hover-stats-count">Duplication Risk: ${duplicateProb.toFixed(1)}% of Hands</div>`;
                                }
                                if (placedFirstHandProb !== null && placedFirstHandProb !== undefined) {
                                    statsHtml += `<div class="card-hover-stats-count">Chance to duplicate if placed first hand: ${placedFirstHandProb.toFixed(1)}% of Hands</div>`;
                                }
                                stats.innerHTML = statsHtml;
                                stats.style.display = 'block';
                            } else {
                                stats.style.display = 'none';
                            }
                        }
                    } else {
                        // For other draw pile cards (teamwork), show count format
                        // Calculate total count in deck (sum quantities for matching cardId and type)
                        const totalCount = window.deckEditorCards
                            .filter(card => card.cardId === cardId && card.type === cardType)
                            .reduce((sum, card) => sum + (card.quantity || 1), 0);
                        
                        // Calculate duplicate probability
                        const duplicateProb = calculateDuplicateProbability(cardId, cardType);
                        const placedFirstHandProb = calculatePlacedFirstHandDuplicateProbability(cardId, cardType);
                        
                        // Display statistics
                        if (totalCount > 0) {
                            // Format: Card name on first line (left-aligned), count on second line
                            let statsHtml = `<div class="card-hover-stats-name">${dbCardName}</div><div class="card-hover-stats-count">${totalCount}/${drawPileSize}</div>`;
                            if (duplicateProb !== null && duplicateProb !== undefined) {
                                statsHtml += `<div class="card-hover-stats-count">Duplication Risk: ${duplicateProb.toFixed(1)}% of Hands</div>`;
                            }
                            if (placedFirstHandProb !== null && placedFirstHandProb !== undefined) {
                                statsHtml += `<div class="card-hover-stats-count">Chance to duplicate if placed first hand: ${placedFirstHandProb.toFixed(1)}% of Hands</div>`;
                            }
                            stats.innerHTML = statsHtml;
                            stats.style.display = 'block';
                        } else {
                            stats.style.display = 'none';
                        }
                    }
                }
            } else {
                // Hide stats if cardId/type not provided or not in deck editor context
                if (stats) stats.style.display = 'none';
            }
            
            
            // Initial Positioning:
            // Uses the triggering mouse event to position modal initially
            const event = window.event || arguments.callee.caller.arguments[0];
            if (event) {
                positionModal(event, modal, cardType);
            }
            
            // Mouse Tracking:
            // Attaches mousemove listener to continuously update modal position as mouse moves
            // Listener is stored on modal element for proper cleanup in hideCardHoverModal()
            // Store cardType on modal for use in mousemove handler
            modal._cardType = cardType;
            modal._mouseMoveHandler = function(e) {
                positionModal(e, modal, modal._cardType);
            };
            document.addEventListener('mousemove', modal._mouseMoveHandler);
            
            // Display Modal:
            // Shows modal immediately after positioning and setting up tracking
            modal.style.display = 'block';
        }
    };

    /**
     * Hides the card hover modal with a delay to prevent rapid show/hide cycles.
     * 
     * Uses a 100ms timeout to prevent flickering when the mouse moves quickly
     * between cards. Cleans up the mousemove event listener when hiding.
     * 
     * @example
     * // Basic usage in HTML
     * onmouseleave="hideCardHoverModal()"
     * 
     * @example
     * // JavaScript usage
     * hideCardHoverModal();
     */
    window.hideCardHoverModal = function() {
        // Always hide the modal, regardless of drag state
        
        // Delay Mechanism:
        // 100ms timeout prevents flickering when mouse moves quickly between cards
        // If showCardHoverModal() is called again before timeout completes, timeout is cleared
        if (window.hoverHideTimeout) {
            clearTimeout(window.hoverHideTimeout);
        }
        
        window.hoverHideTimeout = setTimeout(() => {
            const modal = document.getElementById('cardHoverModal');
            if (modal) {
                // Cleanup: Remove mousemove listener to prevent memory leaks
                if (modal._mouseMoveHandler) {
                    document.removeEventListener('mousemove', modal._mouseMoveHandler);
                    modal._mouseMoveHandler = null;
                }
                modal.style.display = 'none';
            }
        }, 100);
    };
})();
