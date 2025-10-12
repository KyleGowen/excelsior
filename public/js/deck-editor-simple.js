/**
 * Simple Deck Editor Functions
 * Starting with basic, self-contained functions
 */

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
 * Toggle visibility of one per deck column
 */
function toggleOnePerDeckColumn() {
    const onePerDeckColumn = document.querySelectorAll('.one-per-deck-column');
    const toggleButton = document.getElementById('toggle-one-per-deck');
    const toggleText = document.getElementById('one-per-deck-toggle-text');
    
    onePerDeckColumn.forEach(col => {
        col.classList.toggle('hidden');
    });
    
    if (onePerDeckColumn[0].classList.contains('hidden')) {
        toggleText.textContent = 'Show';
    } else {
        toggleText.textContent = 'Hide';
    }
}

/**
 * Toggle visibility of one per deck advanced column
 */
function toggleOnePerDeckAdvancedColumn() {
    const onePerDeckAdvancedColumn = document.querySelectorAll('.one-per-deck-advanced-column');
    const toggleButton = document.getElementById('toggle-one-per-deck-advanced');
    const toggleText = document.getElementById('one-per-deck-advanced-toggle-text');
    
    onePerDeckAdvancedColumn.forEach(col => {
        col.classList.toggle('hidden');
    });
    
    if (onePerDeckAdvancedColumn[0].classList.contains('hidden')) {
        toggleText.textContent = 'Show';
    } else {
        toggleText.textContent = 'Hide';
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
