// Deck tile action menu (ellipsis) behavior
// Extracted from public/index.html to reduce inline script size.

(function initDeckTileMenu() {
    window.DeckSelection = window.DeckSelection || {};

    window.DeckSelection.closeAllDeckTileMenus = function closeAllDeckTileMenus() {
        document.querySelectorAll('.deck-tile-menu-dropdown.show').forEach(menu => menu.classList.remove('show'));
        document.querySelectorAll('.deck-tile-menu-button.open').forEach(btn => {
            btn.classList.remove('open');
            btn.setAttribute('aria-expanded', 'false');
        });
    };

    window.DeckSelection.toggleDeckTileMenu = function toggleDeckTileMenu(event, deckId) {
        event.preventDefault();
        event.stopPropagation();

        const menu = document.getElementById(`deckTileMenu-${deckId}`);
        if (!menu) return;

        const button = event.currentTarget;
        const isOpen = menu.classList.contains('show');

        window.DeckSelection.closeAllDeckTileMenus();

        if (!isOpen) {
            menu.classList.add('show');
            if (button && button.classList) {
                button.classList.add('open');
                button.setAttribute('aria-expanded', 'true');
            }
        }
    };

    // Close menus on outside click
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.deck-tile-menu')) {
            window.DeckSelection.closeAllDeckTileMenus();
        }
    });

    // Close menus on escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            window.DeckSelection.closeAllDeckTileMenus();
        }
    });
})();

