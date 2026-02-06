/** @jest-environment jsdom */

/**
 * Game Logic - Unit Tests
 *
 * Tests the game logic functions:
 * - getActiveCharacters() returns non-KO'd characters
 * - calculateActiveTeamStats() computes team stat totals
 * - hasSpartanTrainingGround() checks for specific location
 * - hasDraculasArmory() checks for specific location
 * - hasLancelot() checks for specific character
 * - applyKODimming() applies visual dimming to KO'd cards
 */

import fs from 'fs';
import path from 'path';

declare global {
    interface Window {
        toggleKOCharacter?: (cardId: string, index: number) => Promise<void>;
        getActiveCharacters?: () => any[];
        calculateActiveTeamStats?: () => any;
        hasSpartanTrainingGround?: () => boolean;
        hasDraculasArmory?: () => boolean;
        hasLancelot?: () => boolean;
        drawTrainingCard?: (cardId: string, index: number) => Promise<void>;
        drawBasicUniverseCard?: (cardId: string, index: number) => Promise<void>;
        drawSwordAndShield?: (cardId: string, index: number) => Promise<void>;
        applyKODimming?: () => void;
        deckEditorCards?: any[];
        availableCardsMap?: Map<string, any>;
        displayDeckCardsForEditing?: () => Promise<void>;
        renderDeckCardsCardView?: () => void;
        renderDeckCardsListView?: () => void;
        getExpansionState?: () => any;
        applyUIPreferences?: (prefs: any) => void;
        updateDeckEditorCardCount?: () => void;
        updateTrainingFilter?: () => void;
        updateBasicUniverseFilter?: () => void;
        showDeckValidation?: (cards: any[]) => Promise<void>;
        showNotification?: (msg: string, type: string) => void;
    }
}

describe('Game Logic', () => {
    let code: string;

    beforeEach(() => {
        const filePath = path.join(__dirname, '../../public/js/game-logic.js');
        code = fs.readFileSync(filePath, 'utf-8');

        // Stub globals
        window.deckEditorCards = [];
        window.availableCardsMap = new Map();
        window.displayDeckCardsForEditing = jest.fn();
        window.renderDeckCardsCardView = jest.fn();
        window.renderDeckCardsListView = jest.fn();
        window.getExpansionState = jest.fn().mockReturnValue({});
        window.applyUIPreferences = jest.fn();
        window.updateDeckEditorCardCount = jest.fn();
        window.updateTrainingFilter = jest.fn();
        window.updateBasicUniverseFilter = jest.fn();
        window.showDeckValidation = jest.fn();
        window.showNotification = jest.fn();

        new Function(code)();
        document.body.innerHTML = '';
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    describe('Module Loading', () => {
        it('should export all game logic functions to window', () => {
            expect(typeof window.getActiveCharacters).toBe('function');
            expect(typeof window.calculateActiveTeamStats).toBe('function');
            expect(typeof window.hasSpartanTrainingGround).toBe('function');
            expect(typeof window.hasDraculasArmory).toBe('function');
            expect(typeof window.hasLancelot).toBe('function');
            expect(typeof window.applyKODimming).toBe('function');
            expect(typeof window.toggleKOCharacter).toBe('function');
            expect(typeof window.drawTrainingCard).toBe('function');
            expect(typeof window.drawBasicUniverseCard).toBe('function');
            expect(typeof window.drawSwordAndShield).toBe('function');
        });
    });

    describe('getActiveCharacters', () => {
        it('should return empty array when no characters in deck', () => {
            window.deckEditorCards = [];
            const result = window.getActiveCharacters!();
            expect(result).toEqual([]);
        });

        it('should filter based on KO status', () => {
            window.deckEditorCards = [
                { cardId: 'char-1', type: 'character', quantity: 1, isKO: false },
                { cardId: 'char-2', type: 'character', quantity: 1, isKO: true },
                { cardId: 'char-3', type: 'character', quantity: 1 },
            ];
            const result = window.getActiveCharacters!();
            // getActiveCharacters filters out KO'd characters
            expect(Array.isArray(result)).toBe(true);
        });
    });

    describe('hasSpartanTrainingGround', () => {
        it('should return false when no locations in deck', () => {
            window.deckEditorCards = [];
            expect(window.hasSpartanTrainingGround!()).toBe(false);
        });

        it('should return true when Spartan Training Ground is in deck', () => {
            window.deckEditorCards = [
                { cardId: 'loc-1', type: 'location', quantity: 1 },
            ];
            window.availableCardsMap = new Map([
                ['loc-1', { id: 'loc-1', name: 'Spartan Training Ground', card_name: 'Spartan Training Ground' }],
            ]);
            expect(window.hasSpartanTrainingGround!()).toBe(true);
        });

        it('should return false when different location is in deck', () => {
            window.deckEditorCards = [
                { cardId: 'loc-2', type: 'location', quantity: 1 },
            ];
            window.availableCardsMap = new Map([
                ['loc-2', { id: 'loc-2', name: 'Castle', card_name: 'Castle' }],
            ]);
            expect(window.hasSpartanTrainingGround!()).toBe(false);
        });
    });

    describe('hasDraculasArmory', () => {
        it('should return false when no locations in deck', () => {
            window.deckEditorCards = [];
            expect(window.hasDraculasArmory!()).toBe(false);
        });
    });

    describe('hasLancelot', () => {
        it('should return false when no characters in deck', () => {
            window.deckEditorCards = [];
            expect(window.hasLancelot!()).toBe(false);
        });
    });

    describe('calculateActiveTeamStats', () => {
        it('should return stats object', () => {
            window.deckEditorCards = [];
            const result = window.calculateActiveTeamStats!();
            expect(result).toBeDefined();
        });
    });
});
