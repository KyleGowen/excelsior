/* ========================================
 * PHASE 4: DECK EDITOR FUNCTIONS
 * ========================================
 * 
 * This file contains basic deck editor functionality extracted from
 * index.html during Phase 4 of the refactoring project.
 * 
 * Purpose: Basic deck editor functionality
 * Created: Phase 4 of 12-phase refactoring project
 * Contains:
 *   - disableAddToDeckButtons() - Guest user button handling
 *   - toggleOnePerDeckColumn() - Column visibility toggle
 *   - Basic deck editor utilities
 * 
 * ======================================== */

/**
 * Disable add to deck buttons for guest users
 */
function disableAddToDeckButtons() {
    if (isGuestUser()) {
        const addToDeckButtons = document.querySelectorAll('.add-to-deck-btn');
        addToDeckButtons.forEach(button => {
            button.disabled = true;
            button.style.opacity = '0.5';
            button.style.cursor = 'not-allowed';
            button.title = 'Log in to add to decks...';
            // Also add a data attribute for debugging
            button.setAttribute('data-guest-disabled', 'true');
        });
    }
}



/**
 * Close the create deck modal and reset form
 */
function closeCreateDeckModal() {
    document.getElementById('createDeckModal').style.display = 'none';
    document.getElementById('createDeckForm').reset();
    document.getElementById('selectedCharacters').innerHTML = '';
    selectedCharacterIds = [];
}
