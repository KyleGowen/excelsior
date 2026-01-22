// Deck selection module entrypoint
// Provides a stable `window.DeckSelection` API and preserves existing globals.

(function initDeckSelectionIndex() {
    window.DeckSelection = window.DeckSelection || {};

    window.DeckSelection.loadDecks = async function loadDecks() {
        try {
            // Ensure available cards data is loaded first for threat calculation
            await loadAvailableCardsData();

            const response = await fetch('/api/decks', {
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success) {
                await window.DeckSelection.displayDecks(data.data);
                updateDeckStats();
            }
        } catch (error) {
            console.error('Error loading decks:', error);
            document.getElementById('deck-list').innerHTML = '<div class="error">Failed to load decks</div>';
        }
    };

    window.DeckSelection.init = function init() {
        // Reserved for future deck-selection init hooks.
        // (Menu listeners are installed by deckTileMenu.js at script load.)
    };

    // Preserve existing globals used by other scripts and inline handlers
    window.loadDecks = window.DeckSelection.loadDecks;
    window.displayDecks = window.DeckSelection.displayDecks;
    window.toggleDeckTileMenu = window.DeckSelection.toggleDeckTileMenu;
    window.closeAllDeckTileMenus = window.DeckSelection.closeAllDeckTileMenus;
})();

