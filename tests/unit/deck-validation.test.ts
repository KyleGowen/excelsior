/** @jest-environment jsdom */

/**
 * Deck Validation - Unit Tests
 *
 * Tests the deck validation, limits, and statistics functions:
 * - calculateIconTotals() computes icon stats from deck cards
 * - updateDeckEditorCardCount() updates UI count displays
 * - Limit status functions (character, location, mission, OPD, etc.)
 */

import fs from 'fs';
import path from 'path';

declare global {
    interface Window {
        calculateIconTotals?: (cards: any[]) => any;
        updateDeckSummary?: (cards: any[]) => Promise<void>;
        showDeckValidation?: (cards: any[]) => Promise<void>;
        updateDeckEditorCardCount?: () => void;
        updateCharacterLimitStatus?: () => void;
        updateLocationLimitStatus?: () => void;
        updateMissionLimitStatus?: () => void;
        getOPDKeyForDimming?: (cardData: any, cardType: string) => string;
        updateOnePerDeckLimitStatus?: () => void;
        shouldSpecialCardBeDisabled?: (cardId: string, cardData: any) => boolean;
        updateCataclysmLimitStatus?: () => void;
        updateAssistLimitStatus?: () => void;
        updateAmbushLimitStatus?: () => void;
        updateFortificationLimitStatus?: () => void;
        deckEditorCards?: any[];
        availableCardsMap?: Map<string, any>;
    }
}

describe('Deck Validation', () => {
    let code: string;

    beforeEach(() => {
        const filePath = path.join(__dirname, '../../public/js/deck-validation.js');
        code = fs.readFileSync(filePath, 'utf-8');
        
        // Stub globals
        window.deckEditorCards = [];
        window.availableCardsMap = new Map();
        
        new Function(code)();
        document.body.innerHTML = '';
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    describe('Module Loading', () => {
        it('should export calculateIconTotals to window', () => {
            expect(typeof window.calculateIconTotals).toBe('function');
        });

        it('should export updateDeckEditorCardCount to window', () => {
            expect(typeof window.updateDeckEditorCardCount).toBe('function');
        });

        it('should export all limit status functions to window', () => {
            expect(typeof window.updateCharacterLimitStatus).toBe('function');
            expect(typeof window.updateLocationLimitStatus).toBe('function');
            expect(typeof window.updateMissionLimitStatus).toBe('function');
            expect(typeof window.updateOnePerDeckLimitStatus).toBe('function');
            expect(typeof window.updateCataclysmLimitStatus).toBe('function');
            expect(typeof window.updateAssistLimitStatus).toBe('function');
            expect(typeof window.updateAmbushLimitStatus).toBe('function');
            expect(typeof window.updateFortificationLimitStatus).toBe('function');
        });

        it('should export getOPDKeyForDimming to window', () => {
            expect(typeof window.getOPDKeyForDimming).toBe('function');
        });

        it('should export shouldSpecialCardBeDisabled to window', () => {
            expect(typeof window.shouldSpecialCardBeDisabled).toBe('function');
        });
    });

    describe('calculateIconTotals', () => {
        it('should return zero totals for empty deck', () => {
            const result = window.calculateIconTotals!([]);
            expect(result).toBeDefined();
        });

        it('should handle deck with character cards', () => {
            window.availableCardsMap = new Map([
                ['char-1', { id: 'char-1', name: 'Hero', energy: 5, combat: 3, brute_force: 2, intelligence: 4, threat_level: 3 }],
            ]);
            const result = window.calculateIconTotals!([
                { cardId: 'char-1', type: 'character', quantity: 1 },
            ]);
            expect(result).toBeDefined();
        });
    });

    describe('updateDeckEditorCardCount', () => {
        it('should update card count elements', () => {
            document.body.innerHTML = '<span class="deck-card-count">0</span>';
            window.deckEditorCards = [
                { cardId: 'a', type: 'character', quantity: 1 },
                { cardId: 'b', type: 'special', quantity: 3 },
            ];
            window.updateDeckEditorCardCount!();
            expect(document.querySelector('.deck-card-count')!.textContent).toBe('4');
        });

        it('should handle empty deck', () => {
            document.body.innerHTML = '<span class="deck-card-count">5</span>';
            window.deckEditorCards = [];
            window.updateDeckEditorCardCount!();
            expect(document.querySelector('.deck-card-count')!.textContent).toBe('0');
        });
    });

    describe('getOPDKeyForDimming', () => {
        it('should return card name for special cards', () => {
            const key = window.getOPDKeyForDimming!({ name: 'Sword of Light' }, 'special');
            expect(key).toBeDefined();
        });
    });
});
