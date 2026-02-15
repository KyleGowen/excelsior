/** @jest-environment jsdom */

/**
 * Card Image Utilities - Unit Tests
 *
 * Tests the card image path utilities and ID mapping functions:
 * - mapImagePathToActualFile() normalizes image paths
 * - getCardImagePath() returns correct image paths for different card types
 * - mapDatabaseIdToDeckCardId() converts database IDs to deck card IDs
 * - mapCardIdToDatabaseId() converts deck card IDs to database IDs
 */

import fs from 'fs';
import path from 'path';

declare global {
    interface Window {
        mapImagePathToActualFile?: (imagePath: string) => string;
        getCardImagePath?: (card: any, cardType: string, options?: { useThumbnail?: boolean }) => string;
        toThumbnailPath?: (fullPath: string) => string;
        mapDatabaseIdToDeckCardId?: (databaseId: string, cardType: string) => string;
        mapCardIdToDatabaseId?: (cardId: string, cardType: string) => string;
    }
}

describe('Card Image Utilities', () => {
    let code: string;

    beforeEach(() => {
        const filePath = path.join(__dirname, '../../public/js/card-image-utils.js');
        code = fs.readFileSync(filePath, 'utf-8');
        new Function(code)();
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    describe('Module Loading', () => {
        it('should export mapImagePathToActualFile to window', () => {
            expect(typeof window.mapImagePathToActualFile).toBe('function');
        });

        it('should export getCardImagePath to window', () => {
            expect(typeof window.getCardImagePath).toBe('function');
        });

        it('should export mapDatabaseIdToDeckCardId to window', () => {
            expect(typeof window.mapDatabaseIdToDeckCardId).toBe('function');
        });

        it('should export mapCardIdToDatabaseId to window', () => {
            expect(typeof window.mapCardIdToDatabaseId).toBe('function');
        });

        it('should export toThumbnailPath to window', () => {
            expect(typeof window.toThumbnailPath).toBe('function');
        });
    });

    describe('toThumbnailPath', () => {
        it('should convert character path to thumbnail path', () => {
            const fullPath = '/src/resources/cards/images/characters/hero.webp';
            const result = window.toThumbnailPath!(fullPath);
            expect(result).toBe('/src/resources/cards/images/characters/thumb/hero.webp');
        });

        it('should convert alternate character path to thumbnail path with webp extension', () => {
            const fullPath = '/src/resources/cards/images/characters/alternate/bar.png';
            const result = window.toThumbnailPath!(fullPath);
            expect(result).toBe('/src/resources/cards/images/characters/thumb/alternate/bar.webp');
        });

        it('should return path unchanged for non-character paths', () => {
            const fullPath = '/src/resources/cards/images/specials/foo.webp';
            const result = window.toThumbnailPath!(fullPath);
            expect(result).toBe(fullPath);
        });
    });

    describe('mapImagePathToActualFile', () => {
        it('should return the input path when no mapping applies', () => {
            const result = window.mapImagePathToActualFile!('some-image.png');
            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
        });

        it('should handle empty string input', () => {
            const result = window.mapImagePathToActualFile!('');
            expect(result).toBeDefined();
        });

        it('should preserve alternate/ subpath for location images', () => {
            const result = window.mapImagePathToActualFile!('alternate/221_b_baker_st.png');
            expect(result).toBe('alternate/221_b_baker_st.png');
        });

        it('should strip characters/ prefix when present', () => {
            const result = window.mapImagePathToActualFile!('characters/hero.webp');
            expect(result).toBe('hero.webp');
        });
    });

    describe('getCardImagePath', () => {
        it('should return a path for character cards', () => {
            const card = { id: '1', name: 'Hero', image: 'hero.png' };
            const result = window.getCardImagePath!(card, 'character');
            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
        });

        it('should return a path for special cards', () => {
            const card = { id: '1', name: 'Shield', image: 'shield.png' };
            const result = window.getCardImagePath!(card, 'special');
            expect(result).toBeDefined();
        });

        it('should return a path for mission cards', () => {
            const card = { id: '1', name: 'Quest', image: 'quest.png' };
            const result = window.getCardImagePath!(card, 'mission');
            expect(result).toBeDefined();
        });

        it('should return thumbnail path for character when useThumbnail is true', () => {
            const card = { id: '1', name: 'Hero', image: 'characters/hero.webp' };
            const result = window.getCardImagePath!(card, 'character', { useThumbnail: true });
            expect(result).toContain('/thumb/');
            expect(result).toContain('hero.webp');
        });

        it('should return full path for character when useThumbnail is false', () => {
            const card = { id: '1', name: 'Hero', image: 'characters/hero.webp' };
            const result = window.getCardImagePath!(card, 'character', { useThumbnail: false });
            expect(result).not.toContain('/thumb/');
        });

        it('should accept undefined options (backward compatibility)', () => {
            const card = { id: '1', name: 'Hero', image: 'hero.webp' };
            const result = window.getCardImagePath!(card, 'character');
            expect(result).toBeDefined();
        });

        it('should return correct path for location with alternate subfolder', () => {
            const card = { id: '1', name: '221-B Baker St.', image: 'alternate/221_b_baker_st.png' };
            const result = window.getCardImagePath!(card, 'location');
            expect(result).toBe('/src/resources/cards/images/locations/alternate/221_b_baker_st.png');
        });

        it('should return correct path for location with default image', () => {
            const card = { id: '1', name: '221-B Baker St.', image: '221_b_baker_st.webp' };
            const result = window.getCardImagePath!(card, 'location');
            expect(result).toBe('/src/resources/cards/images/locations/221_b_baker_st.webp');
        });
    });

    describe('mapDatabaseIdToDeckCardId', () => {
        it('should return the database ID as-is for character type', () => {
            const result = window.mapDatabaseIdToDeckCardId!('abc-123', 'character');
            expect(result).toBeDefined();
        });
    });

    describe('mapCardIdToDatabaseId', () => {
        it('should return the card ID as-is for character type', () => {
            const result = window.mapCardIdToDatabaseId!('abc-123', 'character');
            expect(result).toBeDefined();
        });
    });
});
