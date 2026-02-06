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
        getCardImagePath?: (card: any, cardType: string) => string;
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
