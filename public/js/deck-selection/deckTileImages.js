// Deck tile image/path helpers
// Extracted from public/index.html to reduce inline script size.

(function initDeckTileImages() {
    window.DeckSelection = window.DeckSelection || {};

    // Helper function to get deck-card image path (characters + locations)
    // deck.cards entries include `defaultImage` for fast display when available.
    window.DeckSelection.getDeckCardImagePath = (card) => {
        if (!card) return null;

        if (card.defaultImage) {
            // Some cards store a prefixed path (e.g., "characters/foo.webp" or "locations/foo.webp")
            // while others store only the filename (e.g., "spartan_training_ground.webp").
            const defaultImage = String(card.defaultImage);
            if (defaultImage.includes('/')) {
                return `/src/resources/cards/images/${defaultImage}`;
            }
            if (card.type === 'location') {
                return `/src/resources/cards/images/locations/${defaultImage}`;
            }
            if (card.type === 'character') {
                return `/src/resources/cards/images/characters/${defaultImage}`;
            }
            if (card.type === 'mission') {
                return `/src/resources/cards/images/missions/${defaultImage}`;
            }
            // Fallback for any other type (should be rare in deck list metadata)
            return `/src/resources/cards/images/${defaultImage}`;
        }

        // Fallback: construct from card name
        const cardName = (card.name || '').toLowerCase();
        if (!cardName) return null;

        const snakeCaseName = cardName.replace(/[^a-z0-9]/g, '_');
        if (card.type === 'location') {
            return `/src/resources/cards/images/locations/${snakeCaseName}.webp`;
        }
        if (card.type === 'mission') {
            return `/src/resources/cards/images/missions/${snakeCaseName}.webp`;
        }
        return `/src/resources/cards/images/characters/${snakeCaseName}.webp`;
    };

    // Optional deck background image (same path format used by deck editor background manager)
    window.DeckSelection.getDeckTileBackgroundInfo = (backgroundImagePath) => {
        const deckTileBackgroundPath = backgroundImagePath || null;
        const deckTileBackgroundUrl = deckTileBackgroundPath
            ? `/${String(deckTileBackgroundPath).replace(/'/g, '%27')}`
            : null;
        const deckTileBackgroundClass = deckTileBackgroundUrl ? ' deck-tile--has-bg' : '';
        const deckTileBackgroundStyle = deckTileBackgroundUrl
            ? ` style="--deck-tile-bg: url('${deckTileBackgroundUrl}')"`
            : '';

        return {
            deckTileBackgroundUrl,
            deckTileBackgroundClass,
            deckTileBackgroundStyle,
        };
    };
})();

