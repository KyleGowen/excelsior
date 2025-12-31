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
    function positionModal(event, modal) {
        let x = event.clientX + 80;  // Larger offset to avoid cursor area
        let y = event.clientY + 80;  // Larger offset to avoid cursor area
        
        const modalWidth = 320; // Approximate modal width
        const modalHeight = 450; // Approximate modal height
        
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
     * Shows the card hover modal with an enlarged preview of the card.
     * 
     * The modal is positioned near the mouse cursor, avoiding buttons and staying
     * within the viewport. It tracks mouse movement to maintain optimal positioning.
     * 
     * @param {string} imagePath - Path to the card image file (relative or absolute)
     * @param {string} cardName - Display name of the card (currently not shown in caption)
     * 
     * @example
     * // Basic usage in HTML
     * onmouseenter="showCardHoverModal('characters/hercules.webp', 'Hercules')"
     * 
     * @example
     * // JavaScript usage
     * showCardHoverModal('characters/hercules.webp', 'Hercules');
     */
    window.showCardHoverModal = function(imagePath, cardName) {
        
        // Clear any existing hide timeout
        if (window.hoverHideTimeout) {
            clearTimeout(window.hoverHideTimeout);
            window.hoverHideTimeout = null;
        }
        
        const modal = document.getElementById('cardHoverModal');
        const image = document.getElementById('cardHoverImage');
        const caption = document.getElementById('cardHoverCaption');
        
        if (modal && image && caption) {
            image.src = imagePath;
            caption.textContent = '';
            
            // Add error handler to see if image fails to load
            image.onerror = function() {
                // Image failed to load
            };
            image.onload = function() {
                // Image loaded successfully
            };
            
            
            // Initial Positioning:
            // Uses the triggering mouse event to position modal initially
            const event = window.event || arguments.callee.caller.arguments[0];
            if (event) {
                positionModal(event, modal);
            }
            
            // Mouse Tracking:
            // Attaches mousemove listener to continuously update modal position as mouse moves
            // Listener is stored on modal element for proper cleanup in hideCardHoverModal()
            modal._mouseMoveHandler = function(e) {
                positionModal(e, modal);
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
