// card-image-utils.js - Card image path utilities and ID mapping
// Extracted from public/index.html

// ===== mapDatabaseIdToDeckCardId, mapCardIdToDatabaseId, mapImagePathToActualFile, getCardImagePath =====

function mapDatabaseIdToDeckCardId(databaseId, cardType) {
    // This function is deprecated after UUID migration
    // We'll use a different approach based on card names or other attributes
    return null;
}

// Helper function to map card IDs to database IDs
// DEPRECATED: This function is no longer needed after UUID migration
// deck_cards.card_id now contains UUIDs that can be looked up directly
function mapCardIdToDatabaseId(cardId, cardType) {
    // This function is deprecated after UUID migration
    // deck_cards.card_id now contains UUIDs that can be looked up directly
    return null;
}

// Helper function to map database image paths to actual file paths
function mapImagePathToActualFile(imagePath) {
    if (!imagePath) return imagePath;
    
    // For all card types, the database now contains the full directory structure
    // like "characters/angry_mob_industrial_age.webp", "missions/the-warlord-of-mars/a_fighting_man_of_mars.webp", etc.
    // So we need to return the path after the first directory to preserve the directory structure
    
    // Check for common card type prefixes
    const prefixes = ['characters/', 'missions/', 'specials/', 'locations/', 'events/', 'aspects/', 'power-cards/', 'teamwork-universe/', 'ally-universe/', 'training-universe/', 'basic-universe/', 'advanced-universe/'];
    
    for (const prefix of prefixes) {
        if (imagePath.startsWith(prefix)) {
            return imagePath.substring(prefix.length);
        }
    }
    
    // Fallback: if no prefix matches, preserve the path as-is (may contain subdirs like alternate/)
    return imagePath;
}

// Convert full-res path to thumbnail path (character images only).
// e.g. /src/resources/cards/images/characters/foo.webp → .../characters/thumb/foo.webp
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

// Helper function to get card image path
// options: { useThumbnail: boolean } - when true, return thumbnail path for character images
function getCardImagePath(card, cardType, options) {
    const useThumbnail = options && options.useThumbnail === true;
    function maybeThumbnail(path) {
        if (useThumbnail && cardType === 'character' && path && path.startsWith('/src/resources/cards/images/characters/') && !path.includes('/thumb/')) {
            return toThumbnailPath(path);
        }
        return path;
    }
    try {
        // After migration, alternate cards are separate cards, so we just use the card's image_path or image
        // Check for card.image_path first (for collection cards)
        if (card.image_path && typeof card.image_path === 'string' && card.image_path.trim() !== '') {
            const imagePath = card.image_path.trim();
            
            // If it's already a full path, use it directly
            if (imagePath.startsWith('/src/resources/cards/images/')) {
                return maybeThumbnail(imagePath);
            }
            
            // If it's just a filename, construct the full path based on card type
            if (!imagePath.includes('/')) {
                switch (cardType) {
                    case 'character':
                        return maybeThumbnail(`/src/resources/cards/images/characters/${imagePath}`);
                    case 'special':
                        return `/src/resources/cards/images/specials/${imagePath}`;
                    case 'power':
                        return `/src/resources/cards/images/power-cards/${imagePath}`;
                    case 'location':
                        return `/src/resources/cards/images/locations/${imagePath}`;
                    case 'mission':
                        return `/src/resources/cards/images/missions/${imagePath}`;
                    case 'event':
                        return `/src/resources/cards/images/events/${imagePath}`;
                    case 'aspect':
                        return `/src/resources/cards/images/aspects/${imagePath}`;
                    case 'advanced_universe':
                        return `/src/resources/cards/images/advanced-universe/${imagePath}`;
                    case 'teamwork':
                        return `/src/resources/cards/images/teamwork-universe/${imagePath}`;
                    case 'ally_universe':
                        return `/src/resources/cards/images/ally-universe/${imagePath}`;
                    case 'training':
                        return `/src/resources/cards/images/training-universe/${imagePath}`;
                    case 'basic_universe':
                        return `/src/resources/cards/images/basic-universe/${imagePath}`;
                    default:
                        return '/src/resources/cards/images/placeholder.webp';
                }
            }
            
            // If it has a partial path, construct full path
            if (imagePath.includes('/') && !imagePath.startsWith('/')) {
                return maybeThumbnail(`/src/resources/cards/images/${imagePath}`);
            }
            
            return maybeThumbnail(imagePath);
        }
        
        // Use card.image field (from database image_path column)
        if (card.image) {
            const actualImagePath = mapImagePathToActualFile(card.image);
            
            // Construct full path based on card type
            switch (cardType) {
                case 'character':
                    return maybeThumbnail(`/src/resources/cards/images/characters/${actualImagePath}`);
                case 'special':
                    return `/src/resources/cards/images/specials/${actualImagePath}`;
                case 'power':
                    return `/src/resources/cards/images/power-cards/${actualImagePath}`;
                case 'location':
                    return `/src/resources/cards/images/locations/${actualImagePath}`;
                case 'mission':
                    return `/src/resources/cards/images/missions/${actualImagePath}`;
                case 'event':
                    return `/src/resources/cards/images/events/${actualImagePath}`;
                case 'aspect':
                    return `/src/resources/cards/images/aspects/${actualImagePath}`;
                case 'advanced-universe':
                case 'advanced_universe':
                    return `/src/resources/cards/images/advanced-universe/${actualImagePath}`;
                case 'teamwork':
                    return `/src/resources/cards/images/teamwork-universe/${actualImagePath}`;
                case 'ally-universe':
                case 'ally_universe':
                    return `/src/resources/cards/images/ally-universe/${actualImagePath}`;
                case 'training':
                    return `/src/resources/cards/images/training-universe/${actualImagePath}`;
                case 'basic-universe':
                case 'basic_universe':
                    return `/src/resources/cards/images/basic-universe/${actualImagePath}`;
                default:
                    return '/src/resources/cards/images/placeholder.webp';
            }
        }
        
        // Fallback: try to construct from name for characters
        if (cardType === 'character') {
            const characterName = card.name || card.card_name || '';
            if (characterName) {
                const snakeCaseName = characterName.toLowerCase().replace(/[^a-z0-9]/g, '_');
                return maybeThumbnail(`/src/resources/cards/images/characters/${snakeCaseName}.webp`);
            }
        }
        
        // If no image field found, return a placeholder
        return `/src/resources/cards/images/placeholder.webp`;
    } catch (error) {
        console.error('Error getting card image path:', error);
        return `/src/resources/cards/images/placeholder.webp`;
    }
}
// Helper function to load available cards data for lookup

// Export all functions to window for backward compatibility
window.mapDatabaseIdToDeckCardId = mapDatabaseIdToDeckCardId;
window.mapCardIdToDatabaseId = mapCardIdToDatabaseId;
window.mapImagePathToActualFile = mapImagePathToActualFile;
window.toThumbnailPath = toThumbnailPath;
window.getCardImagePath = getCardImagePath;
