// Deck tile image/path helpers
// Extracted from public/index.html to reduce inline script size.

(function initDeckTileImages() {
    window.DeckSelection = window.DeckSelection || {};

    // Convert full-res character path to thumbnail path (mirrors card-image-utils.js).
    // e.g. .../characters/foo.webp → .../characters/thumb/foo.webp
    // e.g. .../characters/alternate/bar.png → .../characters/thumb/alternate/bar.webp
    function toThumbnailPath(fullPath) {
        if (!fullPath || typeof fullPath !== 'string') return fullPath;
        const base = '/src/resources/cards/images/characters/';
        if (!fullPath.startsWith(base)) return fullPath;
        const afterChars = fullPath.slice(base.length);
        const lastSlash = afterChars.lastIndexOf('/');
        const dir = lastSlash >= 0 ? afterChars.slice(0, lastSlash + 1) : '';
        const filename = lastSlash >= 0 ? afterChars.slice(lastSlash + 1) : afterChars;
        const baseName = filename.replace(/\.[^.]+$/, '');
        return base + 'thumb/' + dir + baseName + '.webp';
    }

    function maybeThumbnailForCharacter(imagePath, card) {
        if (card.type === 'character' && imagePath && imagePath.startsWith('/src/resources/cards/images/characters/') && !imagePath.includes('/thumb/')) {
            return toThumbnailPath(imagePath);
        }
        return imagePath;
    }

    // Helper function to get deck-card image path (characters + locations)
    // deck.cards entries include `defaultImage` for fast display when available.
    // Character images use thumbnails for faster deck selection load (especially in production).
    window.DeckSelection.getDeckCardImagePath = (card) => {
        if (!card) return null;

        if (card.defaultImage) {
            // Some cards store a prefixed path (e.g., "characters/foo.webp" or "locations/foo.webp")
            // while others store only the filename (e.g., "spartan_training_ground.webp").
            // For locations, image_path may include subdirs like "alternate/221_b_baker_st.png".
            const defaultImage = String(card.defaultImage);
            if (card.type === 'location') {
                return `/src/resources/cards/images/locations/${defaultImage}`;
            }
            if (defaultImage.includes('/')) {
                const path = `/src/resources/cards/images/${defaultImage}`;
                return maybeThumbnailForCharacter(path, card);
            }
            if (card.type === 'character') {
                const path = `/src/resources/cards/images/characters/${defaultImage}`;
                return maybeThumbnailForCharacter(path, card);
            }
            if (card.type === 'mission') {
                return `/src/resources/cards/images/missions/${defaultImage}`;
            }
            // Fallback for any other type (should be rare in deck list metadata)
            const path = `/src/resources/cards/images/${defaultImage}`;
            return maybeThumbnailForCharacter(path, card);
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
        const path = `/src/resources/cards/images/characters/${snakeCaseName}.webp`;
        return maybeThumbnailForCharacter(path, card);
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

