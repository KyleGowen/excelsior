/** @jest-environment jsdom */

/**
 * Draw Hand KO Dimming - Full Coverage Tests
 * 
 * Tests the KO dimming feature in the draw hand pane:
 * - shouldDimCard method functionality
 * - displayDrawnCards applying dimming
 * - All card types and edge cases
 */

import fs from 'fs';
import path from 'path';

// Extend Window interface for test globals
declare global {
    interface Window {
        SimulateKO?: {
            init: () => void;
            shouldDimCard: (card: any, availableCardsMap: Map<string, any>, deckCards: any[]) => boolean;
            isKOd: (cardId: string) => boolean;
            toggleKOCharacter: (cardId: string, index: number, renderFunctions: any) => Promise<void>;
            applyDimming: () => void;
            removeCharacter: (cardId: string) => void;
            getActiveCharacters: () => any[];
            calculateActiveTeamStats: () => any;
        };
        availableCardsMap?: Map<string, any>;
        deckEditorCards?: any[];
        koCharacters?: Set<string>;
        getCardImagePath?: (card: any, type: string, alternateImage?: string) => string;
    }
}

// Polyfill for TextEncoder/TextDecoder if needed
if (typeof global.TextEncoder === 'undefined') {
    const { TextEncoder, TextDecoder } = require('util');
    global.TextEncoder = TextEncoder;
    global.TextDecoder = TextDecoder;
}

describe('Draw Hand KO Dimming - Full Coverage', () => {
    let simulateKOCode: string;
    let mockAvailableCardsMap: Map<string, any>;
    let mockDeckEditorCards: any[];
    
    beforeEach(() => {
        // Load the actual simulate-ko.js file
        const simulateKOPath = path.join(__dirname, '../../public/js/components/simulate-ko.js');
        simulateKOCode = fs.readFileSync(simulateKOPath, 'utf-8');
        
        // Execute the module code
        new Function(simulateKOCode)();
        
        // Setup mock data
        mockAvailableCardsMap = new Map();
        mockDeckEditorCards = [];
        
        // Setup window globals
        (window as any).availableCardsMap = mockAvailableCardsMap;
        (window as any).deckEditorCards = mockDeckEditorCards;
        (window as any).koCharacters = new Set();
        
        // Initialize SimulateKO (must be done after setting globals)
        if (window.SimulateKO) {
            window.SimulateKO.init();
        }
        
        // Ensure koCharacters is synced
        if (window.SimulateKO && (window as any).koCharacters) {
            ((window as any).koCharacters as Set<string>).clear();
        }
    });

    afterEach(() => {
        // Cleanup
        delete (window as any).SimulateKO;
        delete (window as any).availableCardsMap;
        delete (window as any).deckEditorCards;
        delete (window as any).koCharacters;
    });

    describe('shouldDimCard - Character Cards', () => {
        it('should return true for KO\'d characters', () => {
            const characterCard = {
                cardId: 'char-1',
                type: 'character',
                quantity: 1
            };
            
            const characterData = {
                id: 'char-1',
                name: 'Leonidas',
                energy: 8,
                combat: 8,
                brute_force: 5,
                intelligence: 4
            };
            
            mockAvailableCardsMap.set('char-1', characterData);
            mockDeckEditorCards.push(characterCard);
            
            // KO the character - manually add to set
            ((window as any).koCharacters as Set<string>).add('char-1');
            // Sync with SimulateKO
            if (window.SimulateKO) {
                window.SimulateKO.init();
            }
            
            const shouldDim = window.SimulateKO?.shouldDimCard(
                characterCard,
                mockAvailableCardsMap,
                mockDeckEditorCards
            );
            
            expect(shouldDim).toBe(true);
        });

        it('should return false for non-KO\'d characters', () => {
            const characterCard = {
                cardId: 'char-1',
                type: 'character',
                quantity: 1
            };
            
            const characterData = {
                id: 'char-1',
                name: 'Leonidas',
                energy: 8,
                combat: 8,
                brute_force: 5,
                intelligence: 4
            };
            
            mockAvailableCardsMap.set('char-1', characterData);
            mockDeckEditorCards.push(characterCard);
            
            const shouldDim = window.SimulateKO?.shouldDimCard(
                characterCard,
                mockAvailableCardsMap,
                mockDeckEditorCards
            );
            
            expect(shouldDim).toBe(false);
        });
    });

    describe('shouldDimCard - Special Cards', () => {
        it('should dim special cards belonging to KO\'d characters', () => {
            const characterCard = {
                cardId: 'char-1',
                type: 'character',
                quantity: 1
            };
            
            const specialCard = {
                cardId: 'special-1',
                type: 'special',
                quantity: 1
            };
            
            const characterData = {
                id: 'char-1',
                name: 'Leonidas',
                energy: 8,
                combat: 8
            };
            
            const specialData = {
                id: 'special-1',
                name: 'Spartan Shield',
                character: 'Leonidas'
            };
            
            mockAvailableCardsMap.set('char-1', characterData);
            mockAvailableCardsMap.set('special-1', specialData);
            mockDeckEditorCards.push(characterCard, specialCard);
            
            // KO the character
            ((window as any).koCharacters as Set<string>).add('char-1');
            
            const shouldDim = window.SimulateKO?.shouldDimCard(
                specialCard,
                mockAvailableCardsMap,
                mockDeckEditorCards
            );
            
            expect(shouldDim).toBe(true);
        });

        it('should not dim special cards belonging to active characters', () => {
            const characterCard = {
                cardId: 'char-1',
                type: 'character',
                quantity: 1
            };
            
            const specialCard = {
                cardId: 'special-1',
                type: 'special',
                quantity: 1
            };
            
            const characterData = {
                id: 'char-1',
                name: 'Leonidas',
                energy: 8,
                combat: 8
            };
            
            const specialData = {
                id: 'special-1',
                name: 'Spartan Shield',
                character: 'Leonidas'
            };
            
            mockAvailableCardsMap.set('char-1', characterData);
            mockAvailableCardsMap.set('special-1', specialData);
            mockDeckEditorCards.push(characterCard, specialCard);
            
            const shouldDim = window.SimulateKO?.shouldDimCard(
                specialCard,
                mockAvailableCardsMap,
                mockDeckEditorCards
            );
            
            expect(shouldDim).toBe(false);
        });

        it('should not dim "Any Character" special cards', () => {
            const specialCard = {
                cardId: 'special-1',
                type: 'special',
                quantity: 1
            };
            
            const specialData = {
                id: 'special-1',
                name: 'Universal Power',
                character: 'Any Character'
            };
            
            mockAvailableCardsMap.set('special-1', specialData);
            mockDeckEditorCards.push(specialCard);
            
            // KO all characters
            const charCard = {
                cardId: 'char-1',
                type: 'character',
                quantity: 1
            };
            mockDeckEditorCards.push(charCard);
            (window.koCharacters as Set<string>).add('char-1');
            
            const shouldDim = window.SimulateKO?.shouldDimCard(
                specialCard,
                mockAvailableCardsMap,
                mockDeckEditorCards
            );
            
            expect(shouldDim).toBe(false);
        });
    });

    describe('shouldDimCard - Teamwork Cards', () => {
        it('should dim teamwork cards when team cannot meet stat requirement after KO', () => {
            const char1 = {
                cardId: 'char-1',
                type: 'character',
                quantity: 1
            };
            
            const char2 = {
                cardId: 'char-2',
                type: 'character',
                quantity: 1
            };
            
            const teamworkCard = {
                cardId: 'teamwork-1',
                type: 'teamwork',
                quantity: 1
            };
            
            const char1Data = {
                id: 'char-1',
                name: 'Leonidas',
                energy: 4,
                combat: 4,
                brute_force: 3,
                intelligence: 2
            };
            
            const char2Data = {
                id: 'char-2',
                name: 'King Arthur',
                energy: 4,
                combat: 4,
                brute_force: 3,
                intelligence: 2
            };
            
            const teamworkData = {
                id: 'teamwork-1',
                name: '8 Combat',
                to_use: '8 Combat'
            };
            
            mockAvailableCardsMap.set('char-1', char1Data);
            mockAvailableCardsMap.set('char-2', char2Data);
            mockAvailableCardsMap.set('teamwork-1', teamworkData);
            mockDeckEditorCards.push(char1, char2, teamworkCard);
            
            // KO one character - now only char1 remains with 4 Combat, can't use 8 Combat
            ((window as any).koCharacters as Set<string>).add('char-2');
            
            const shouldDim = window.SimulateKO?.shouldDimCard(
                teamworkCard,
                mockAvailableCardsMap,
                mockDeckEditorCards
            );
            
            expect(shouldDim).toBe(true);
        });

        it('should not dim teamwork cards when team can meet stat requirement', () => {
            const characterCard = {
                cardId: 'char-1',
                type: 'character',
                quantity: 1
            };
            
            const teamworkCard = {
                cardId: 'teamwork-1',
                type: 'teamwork',
                quantity: 1
            };
            
            const characterData = {
                id: 'char-1',
                name: 'Leonidas',
                energy: 4,
                combat: 8,
                brute_force: 3,
                intelligence: 2
            };
            
            const teamworkData = {
                id: 'teamwork-1',
                name: '8 Combat',
                to_use: '8 Combat'
            };
            
            mockAvailableCardsMap.set('char-1', characterData);
            mockAvailableCardsMap.set('teamwork-1', teamworkData);
            mockDeckEditorCards.push(characterCard, teamworkCard);
            
            const shouldDim = window.SimulateKO?.shouldDimCard(
                teamworkCard,
                mockAvailableCardsMap,
                mockDeckEditorCards
            );
            
            expect(shouldDim).toBe(false);
        });

        it('should dim teamwork cards when only one active character remains (special rule)', () => {
            const char1 = {
                cardId: 'char-1',
                type: 'character',
                quantity: 1
            };
            
            const char2 = {
                cardId: 'char-2',
                type: 'character',
                quantity: 1
            };
            
            const teamworkCard = {
                cardId: 'teamwork-1',
                type: 'teamwork',
                quantity: 1
            };
            
            const char1Data = {
                id: 'char-1',
                name: 'Leonidas',
                energy: 8,
                combat: 8
            };
            
            const char2Data = {
                id: 'char-2',
                name: 'King Arthur',
                energy: 7,
                combat: 7
            };
            
            const teamworkData = {
                id: 'teamwork-1',
                name: '6 Combat',
                to_use: '6 Combat'
            };
            
            mockAvailableCardsMap.set('char-1', char1Data);
            mockAvailableCardsMap.set('char-2', char2Data);
            mockAvailableCardsMap.set('teamwork-1', teamworkData);
            mockDeckEditorCards.push(char1, char2, teamworkCard);
            
            // KO one character, leaving only one active
            ((window as any).koCharacters as Set<string>).add('char-2');
            
            const shouldDim = window.SimulateKO?.shouldDimCard(
                teamworkCard,
                mockAvailableCardsMap,
                mockDeckEditorCards
            );
            
            expect(shouldDim).toBe(true);
        });

        it('should handle Any-Power teamwork cards', () => {
            const char1 = {
                cardId: 'char-1',
                type: 'character',
                quantity: 1
            };
            
            const char2 = {
                cardId: 'char-2',
                type: 'character',
                quantity: 1
            };
            
            const teamworkCard = {
                cardId: 'teamwork-1',
                type: 'teamwork',
                quantity: 1
            };
            
            const char1Data = {
                id: 'char-1',
                name: 'Leonidas',
                energy: 4,
                combat: 4,
                brute_force: 3,
                intelligence: 2
            };
            
            const char2Data = {
                id: 'char-2',
                name: 'King Arthur',
                energy: 8,
                combat: 8,
                brute_force: 5,
                intelligence: 4
            };
            
            const teamworkData = {
                id: 'teamwork-1',
                name: '8 Any-Power',
                to_use: '8 Any-Power'
            };
            
            mockAvailableCardsMap.set('char-1', char1Data);
            mockAvailableCardsMap.set('char-2', char2Data);
            mockAvailableCardsMap.set('teamwork-1', teamworkData);
            mockDeckEditorCards.push(char1, char2, teamworkCard);
            
            // KO the character with high stats - now only char1 remains with max 4, need 8
            ((window as any).koCharacters as Set<string>).add('char-2');
            
            const shouldDim = window.SimulateKO?.shouldDimCard(
                teamworkCard,
                mockAvailableCardsMap,
                mockDeckEditorCards
            );
            
            expect(shouldDim).toBe(true); // Max stat is 4, need 8
        });
    });

    describe('shouldDimCard - Ally Cards', () => {
        it('should not dim ally cards when active character meets requirement', () => {
            const char1 = {
                cardId: 'char-1',
                type: 'character',
                quantity: 1
            };
            
            const char2 = {
                cardId: 'char-2',
                type: 'character',
                quantity: 1
            };
            
            const char3 = {
                cardId: 'char-3',
                type: 'character',
                quantity: 1
            };
            
            const allyCard = {
                cardId: 'ally-1',
                type: 'ally-universe',
                quantity: 1
            };
            
            const char1Data = {
                id: 'char-1',
                name: 'Leonidas',
                energy: 4,
                combat: 4,
                brute_force: 3,
                intelligence: 2
            };
            
            const char2Data = {
                id: 'char-2',
                name: 'King Arthur',
                energy: 4,
                combat: 4,
                brute_force: 3,
                intelligence: 2
            };
            
            const char3Data = {
                id: 'char-3',
                name: 'Merlin',
                energy: 4,
                combat: 4,
                brute_force: 3,
                intelligence: 2
            };
            
            const allyData = {
                id: 'ally-1',
                name: 'Little John',
                stat_to_use: '5 or less',
                stat_type_to_use: 'Combat'
            };
            
            mockAvailableCardsMap.set('char-1', char1Data);
            mockAvailableCardsMap.set('char-2', char2Data);
            mockAvailableCardsMap.set('char-3', char3Data);
            mockAvailableCardsMap.set('ally-1', allyData);
            mockDeckEditorCards.push(char1, char2, char3, allyCard);
            
            // KO one character - 2 active characters remain, so special rule doesn't apply
            // char1 has 4 Combat, which is <= 5, so should not dim
            ((window as any).koCharacters as Set<string>).add('char-3');
            
            const shouldDim = window.SimulateKO?.shouldDimCard(
                allyCard,
                mockAvailableCardsMap,
                mockDeckEditorCards
            );
            
            expect(shouldDim).toBe(false);
        });

        it('should dim ally cards with "or higher" requirement when stat is too low', () => {
            const char1 = {
                cardId: 'char-1',
                type: 'character',
                quantity: 1
            };
            
            const char2 = {
                cardId: 'char-2',
                type: 'character',
                quantity: 1
            };
            
            const allyCard = {
                cardId: 'ally-1',
                type: 'ally-universe',
                quantity: 1
            };
            
            const char1Data = {
                id: 'char-1',
                name: 'Leonidas',
                energy: 4,
                combat: 4,
                brute_force: 3,
                intelligence: 2
            };
            
            const char2Data = {
                id: 'char-2',
                name: 'King Arthur',
                energy: 8,
                combat: 4,
                brute_force: 3,
                intelligence: 2
            };
            
            const allyData = {
                id: 'ally-1',
                name: 'Hera',
                stat_to_use: '7 or higher',
                stat_type_to_use: 'Energy'
            };
            
            mockAvailableCardsMap.set('char-1', char1Data);
            mockAvailableCardsMap.set('char-2', char2Data);
            mockAvailableCardsMap.set('ally-1', allyData);
            mockDeckEditorCards.push(char1, char2, allyCard);
            
            // KO the character with 8 Energy - now only char1 remains with 4 Energy, need 7 or higher, so should dim
            ((window as any).koCharacters as Set<string>).add('char-2');
            
            const shouldDim = window.SimulateKO?.shouldDimCard(
                allyCard,
                mockAvailableCardsMap,
                mockDeckEditorCards
            );
            
            expect(shouldDim).toBe(true);
        });

        it('should dim ally cards when only one active character remains (special rule)', () => {
            const char1 = {
                cardId: 'char-1',
                type: 'character',
                quantity: 1
            };
            
            const char2 = {
                cardId: 'char-2',
                type: 'character',
                quantity: 1
            };
            
            const allyCard = {
                cardId: 'ally-1',
                type: 'ally-universe',
                quantity: 1
            };
            
            const char1Data = {
                id: 'char-1',
                name: 'Leonidas',
                energy: 8,
                combat: 8
            };
            
            const char2Data = {
                id: 'char-2',
                name: 'King Arthur',
                energy: 7,
                combat: 7
            };
            
            const allyData = {
                id: 'ally-1',
                name: 'Little John',
                stat_to_use: '5 or less',
                stat_type_to_use: 'Combat'
            };
            
            mockAvailableCardsMap.set('char-1', char1Data);
            mockAvailableCardsMap.set('char-2', char2Data);
            mockAvailableCardsMap.set('ally-1', allyData);
            mockDeckEditorCards.push(char1, char2, allyCard);
            
            // KO one character, leaving only one active
            ((window as any).koCharacters as Set<string>).add('char-2');
            
            const shouldDim = window.SimulateKO?.shouldDimCard(
                allyCard,
                mockAvailableCardsMap,
                mockDeckEditorCards
            );
            
            expect(shouldDim).toBe(true);
        });
    });

    describe('shouldDimCard - Power Cards', () => {
        it('should dim power cards when team cannot meet requirement after KO', () => {
            const char1 = {
                cardId: 'char-1',
                type: 'character',
                quantity: 1
            };
            
            const char2 = {
                cardId: 'char-2',
                type: 'character',
                quantity: 1
            };
            
            const powerCard = {
                cardId: 'power-1',
                type: 'power',
                quantity: 1
            };
            
            const char1Data = {
                id: 'char-1',
                name: 'Leonidas',
                card_name: 'Leonidas',
                energy: 4,
                combat: 4,
                brute_force: 3,
                intelligence: 2
            };
            
            const char2Data = {
                id: 'char-2',
                name: 'King Arthur',
                card_name: 'King Arthur',
                energy: 8,
                combat: 4,
                brute_force: 3,
                intelligence: 2
            };
            
            const powerData = {
                id: 'power-1',
                name: '8 - Energy',
                value: '8',
                power_type: 'Energy'
            };
            
            mockAvailableCardsMap.set('char-1', char1Data);
            mockAvailableCardsMap.set('char-2', char2Data);
            mockAvailableCardsMap.set('power-1', powerData);
            mockDeckEditorCards.push(char1, char2, powerCard);
            
            // KO the character with 8 Energy - now only char1 remains with 4 Energy, can't use 8 Energy
            ((window as any).koCharacters as Set<string>).add('char-2');
            
            const shouldDim = window.SimulateKO?.shouldDimCard(
                powerCard,
                mockAvailableCardsMap,
                mockDeckEditorCards
            );
            
            expect(shouldDim).toBe(true);
        });

        it('should handle Any-Power cards correctly', () => {
            const characterCard = {
                cardId: 'char-1',
                type: 'character',
                quantity: 1
            };
            
            const powerCard = {
                cardId: 'power-1',
                type: 'power',
                quantity: 1
            };
            
            const characterData = {
                id: 'char-1',
                name: 'Leonidas',
                energy: 4,
                combat: 8,
                brute_force: 3,
                intelligence: 2
            };
            
            const powerData = {
                id: 'power-1',
                name: '8 - Any-Power',
                value: '8',
                power_type: 'Any-Power'
            };
            
            mockAvailableCardsMap.set('char-1', characterData);
            mockAvailableCardsMap.set('power-1', powerData);
            mockDeckEditorCards.push(characterCard, powerCard);
            
            // Max stat is 8, so should not dim
            const shouldDim = window.SimulateKO?.shouldDimCard(
                powerCard,
                mockAvailableCardsMap,
                mockDeckEditorCards
            );
            
            expect(shouldDim).toBe(false);
        });

        it('should handle Multi-Power cards correctly', () => {
            const char1 = {
                cardId: 'char-1',
                type: 'character',
                quantity: 1
            };
            
            const char2 = {
                cardId: 'char-2',
                type: 'character',
                quantity: 1
            };
            
            const powerCard = {
                cardId: 'power-1',
                type: 'power',
                quantity: 1
            };
            
            const char1Data = {
                id: 'char-1',
                name: 'Leonidas',
                card_name: 'Leonidas',
                energy: 5,
                combat: 4,
                brute_force: 3,
                intelligence: 2
            };
            
            const char2Data = {
                id: 'char-2',
                name: 'King Arthur',
                card_name: 'King Arthur',
                energy: 8,
                combat: 8,
                brute_force: 5,
                intelligence: 4
            };
            
            const powerData = {
                id: 'power-1',
                name: '10 - Multi Power',
                value: '10',
                power_type: 'Multi-Power'
            };
            
            mockAvailableCardsMap.set('char-1', char1Data);
            mockAvailableCardsMap.set('char-2', char2Data);
            mockAvailableCardsMap.set('power-1', powerData);
            mockDeckEditorCards.push(char1, char2, powerCard);
            
            // KO the character with high stats - now only char1 remains
            // Multi-Power requires sum of two highest stats
            // Character has: Energy 5, Combat 4, Brute Force 3, Intelligence 2
            // Two highest: 5 + 4 = 9, need 10, so should dim
            ((window as any).koCharacters as Set<string>).add('char-2');
            
            const shouldDim = window.SimulateKO?.shouldDimCard(
                powerCard,
                mockAvailableCardsMap,
                mockDeckEditorCards
            );
            
            expect(shouldDim).toBe(true);
        });

        it('should handle Multi Power cards with space variant correctly', () => {
            const char1 = {
                cardId: 'char-1',
                type: 'character',
                quantity: 1
            };
            
            const char2 = {
                cardId: 'char-2',
                type: 'character',
                quantity: 1
            };
            
            const powerCard = {
                cardId: 'power-1',
                type: 'power',
                quantity: 1
            };
            
            const char1Data = {
                id: 'char-1',
                name: 'Leonidas',
                card_name: 'Leonidas',
                energy: 5,
                combat: 4,
                brute_force: 3,
                intelligence: 2
            };
            
            const char2Data = {
                id: 'char-2',
                name: 'King Arthur',
                card_name: 'King Arthur',
                energy: 8,
                combat: 8,
                brute_force: 5,
                intelligence: 4
            };
            
            const powerData = {
                id: 'power-1',
                name: '10 - Multi Power',
                value: '10',
                power_type: 'Multi Power'  // Space variant
            };
            
            mockAvailableCardsMap.set('char-1', char1Data);
            mockAvailableCardsMap.set('char-2', char2Data);
            mockAvailableCardsMap.set('power-1', powerData);
            mockDeckEditorCards.push(char1, char2, powerCard);
            
            // KO the character with high stats - now only char1 remains
            // Multi Power requires sum of two highest stats
            // Character has: Energy 5, Combat 4, Brute Force 3, Intelligence 2
            // Two highest: 5 + 4 = 9, need 10, so should dim
            ((window as any).koCharacters as Set<string>).add('char-2');
            
            const shouldDim = window.SimulateKO?.shouldDimCard(
                powerCard,
                mockAvailableCardsMap,
                mockDeckEditorCards
            );
            
            expect(shouldDim).toBe(true);
        });

        it('should verify Multi-Power uses sum of two highest stats (not Math.max like Any-Power)', () => {
            // This test verifies the fix: Multi-Power should use sum of two highest,
            // not Math.max. A character with stats [8, 4, 3, 2] can use:
            // - Any-Power 8: Math.max(8,4,3,2) = 8 >= 8 ✓
            // - Multi-Power 10: sum(8,4) = 12 >= 10 ✓
            // - Multi-Power 13: sum(8,4) = 12 < 13 ✗
            const char1 = {
                cardId: 'char-1',
                type: 'character',
                quantity: 1
            };
            
            const char2 = {
                cardId: 'char-2',
                type: 'character',
                quantity: 1
            };
            
            const anyPowerCard = {
                cardId: 'power-any',
                type: 'power',
                quantity: 1
            };
            
            const multiPowerCard = {
                cardId: 'power-multi',
                type: 'power',
                quantity: 1
            };
            
            const char1Data = {
                id: 'char-1',
                name: 'Test Character',
                energy: 8,
                combat: 4,
                brute_force: 3,
                intelligence: 2
            };
            
            const char2Data = {
                id: 'char-2',
                name: 'Other Character',
                energy: 10,
                combat: 10,
                brute_force: 10,
                intelligence: 10
            };
            
            const anyPowerData = {
                id: 'power-any',
                name: '8 - Any-Power',
                value: '8',
                power_type: 'Any-Power'
            };
            
            const multiPowerData = {
                id: 'power-multi',
                name: '13 - Multi-Power',
                value: '13',
                power_type: 'Multi-Power'
            };
            
            mockAvailableCardsMap.set('char-1', char1Data);
            mockAvailableCardsMap.set('char-2', char2Data);
            mockAvailableCardsMap.set('power-any', anyPowerData);
            mockAvailableCardsMap.set('power-multi', multiPowerData);
            mockDeckEditorCards.push(char1, char2, anyPowerCard, multiPowerCard);
            
            // KO char2 so only char1 remains (stats: 8,4,3,2)
            ((window as any).koCharacters as Set<string>).add('char-2');
            
            // Any-Power: Math.max(8,4,3,2) = 8 >= 8, should NOT dim
            const anyPowerShouldDim = window.SimulateKO?.shouldDimCard(
                anyPowerCard,
                mockAvailableCardsMap,
                mockDeckEditorCards
            );
            expect(anyPowerShouldDim).toBe(false);
            
            // Multi-Power: sum(8,4) = 12 < 13, should dim
            const multiPowerShouldDim = window.SimulateKO?.shouldDimCard(
                multiPowerCard,
                mockAvailableCardsMap,
                mockDeckEditorCards
            );
            expect(multiPowerShouldDim).toBe(true);
        });

        it('should not dim Multi-Power cards when character can meet requirement with sum of two highest', () => {
            const char1 = {
                cardId: 'char-1',
                type: 'character',
                quantity: 1
            };
            
            const char2 = {
                cardId: 'char-2',
                type: 'character',
                quantity: 1
            };
            
            const powerCard = {
                cardId: 'power-1',
                type: 'power',
                quantity: 1
            };
            
            const char1Data = {
                id: 'char-1',
                name: 'Leonidas',
                energy: 6,
                combat: 5,
                brute_force: 4,
                intelligence: 3
            };
            
            const char2Data = {
                id: 'char-2',
                name: 'King Arthur',
                energy: 8,
                combat: 8,
                brute_force: 5,
                intelligence: 4
            };
            
            const powerData = {
                id: 'power-1',
                name: '10 - Multi-Power',
                value: '10',
                power_type: 'Multi-Power'
            };
            
            mockAvailableCardsMap.set('char-1', char1Data);
            mockAvailableCardsMap.set('char-2', char2Data);
            mockAvailableCardsMap.set('power-1', powerData);
            mockDeckEditorCards.push(char1, char2, powerCard);
            
            // KO char2, char1 remains
            // Character has: Energy 6, Combat 5, Brute Force 4, Intelligence 3
            // Two highest: 6 + 5 = 11 >= 10, so should NOT dim
            ((window as any).koCharacters as Set<string>).add('char-2');
            
            const shouldDim = window.SimulateKO?.shouldDimCard(
                powerCard,
                mockAvailableCardsMap,
                mockDeckEditorCards
            );
            
            expect(shouldDim).toBe(false);
        });

        it('should apply John Carter override for Brute Force', () => {
            const characterCard = {
                cardId: 'char-1',
                type: 'character',
                quantity: 1
            };
            
            const powerCard = {
                cardId: 'power-1',
                type: 'power',
                quantity: 1
            };
            
            const characterData = {
                id: 'char-1',
                name: 'John Carter',
                energy: 4,
                combat: 4,
                brute_force: 5,
                intelligence: 2
            };
            
            const powerData = {
                id: 'power-1',
                name: '8 - Brute Force',
                value: '8',
                power_type: 'Brute Force'
            };
            
            mockAvailableCardsMap.set('char-1', characterData);
            mockAvailableCardsMap.set('power-1', powerData);
            mockDeckEditorCards.push(characterCard, powerCard);
            
            // John Carter should have effective 8 Brute Force, so should not dim
            const shouldDim = window.SimulateKO?.shouldDimCard(
                powerCard,
                mockAvailableCardsMap,
                mockDeckEditorCards
            );
            
            expect(shouldDim).toBe(false);
        });
    });

    describe('shouldDimCard - Training Cards', () => {
        it('should dim training cards when no character can use them after KO', () => {
            const char1 = {
                cardId: 'char-1',
                type: 'character',
                quantity: 1
            };
            
            const char2 = {
                cardId: 'char-2',
                type: 'character',
                quantity: 1
            };
            
            const trainingCard = {
                cardId: 'training-1',
                type: 'training',
                quantity: 1
            };
            
            const char1Data = {
                id: 'char-1',
                name: 'Leonidas',
                card_name: 'Leonidas',
                energy: 8,
                combat: 8,
                brute_force: 5,
                intelligence: 4
            };
            
            const char2Data = {
                id: 'char-2',
                name: 'King Arthur',
                card_name: 'King Arthur',
                energy: 4,
                combat: 4,
                brute_force: 3,
                intelligence: 2
            };
            
            const trainingData = {
                id: 'training-1',
                name: 'Training (Leonidas)',
                type_1: 'Energy',
                type_2: 'Combat',
                value_to_use: '5'
            };
            
            mockAvailableCardsMap.set('char-1', char1Data);
            mockAvailableCardsMap.set('char-2', char2Data);
            mockAvailableCardsMap.set('training-1', trainingData);
            mockDeckEditorCards.push(char1, char2, trainingCard);
            
            // KO the character with low stats - now only char1 remains
            // Training cards are usable if EITHER stat is <= value
            // Both stats (8, 8) are > 5, so no character can use it, should dim
            ((window as any).koCharacters as Set<string>).add('char-2');
            
            const shouldDim = window.SimulateKO?.shouldDimCard(
                trainingCard,
                mockAvailableCardsMap,
                mockDeckEditorCards
            );
            
            expect(shouldDim).toBe(true);
        });

        it('should not dim training cards when a character can use them', () => {
            const characterCard = {
                cardId: 'char-1',
                type: 'character',
                quantity: 1
            };
            
            const trainingCard = {
                cardId: 'training-1',
                type: 'training',
                quantity: 1
            };
            
            const characterData = {
                id: 'char-1',
                name: 'Leonidas',
                energy: 4,
                combat: 8,
                brute_force: 5,
                intelligence: 4
            };
            
            const trainingData = {
                id: 'training-1',
                name: 'Training (Leonidas)',
                type_1: 'Energy',
                type_2: 'Combat',
                value_to_use: '5'
            };
            
            mockAvailableCardsMap.set('char-1', characterData);
            mockAvailableCardsMap.set('training-1', trainingData);
            mockDeckEditorCards.push(characterCard, trainingCard);
            
            // Energy (4) is <= 5, so should not dim
            const shouldDim = window.SimulateKO?.shouldDimCard(
                trainingCard,
                mockAvailableCardsMap,
                mockDeckEditorCards
            );
            
            expect(shouldDim).toBe(false);
        });
    });

    describe('shouldDimCard - Basic Universe Cards', () => {
        it('should dim basic universe cards when requirement not met after KO', () => {
            const char1 = {
                cardId: 'char-1',
                type: 'character',
                quantity: 1
            };
            
            const char2 = {
                cardId: 'char-2',
                type: 'character',
                quantity: 1
            };
            
            const basicCard = {
                cardId: 'basic-1',
                type: 'basic-universe',
                quantity: 1
            };
            
            const char1Data = {
                id: 'char-1',
                name: 'Leonidas',
                card_name: 'Leonidas',
                energy: 4,
                combat: 4,
                brute_force: 0,
                intelligence: 0
            };
            
            const char2Data = {
                id: 'char-2',
                name: 'King Arthur',
                card_name: 'King Arthur',
                energy: 4,
                combat: 8,
                brute_force: 0,
                intelligence: 0
            };
            
            const basicData = {
                id: 'basic-1',
                name: 'Rapier',
                type: 'Combat',
                value_to_use: '7 or greater'
            };
            
            mockAvailableCardsMap.set('char-1', char1Data);
            mockAvailableCardsMap.set('char-2', char2Data);
            mockAvailableCardsMap.set('basic-1', basicData);
            mockDeckEditorCards.push(char1, char2, basicCard);
            
            // KO the character with 8 Combat - now only char1 remains with 4 Combat, need 7, so should dim
            ((window as any).koCharacters as Set<string>).add('char-2');
            
            const shouldDim = window.SimulateKO?.shouldDimCard(
                basicCard,
                mockAvailableCardsMap,
                mockDeckEditorCards
            );
            
            expect(shouldDim).toBe(true);
        });
    });

    describe('shouldDimCard - Edge Cases', () => {
        it('should return false when no KO\'d characters exist', () => {
            const characterCard = {
                cardId: 'char-1',
                type: 'character',
                quantity: 1
            };
            
            const specialCard = {
                cardId: 'special-1',
                type: 'special',
                quantity: 1
            };
            
            const characterData = {
                id: 'char-1',
                name: 'Leonidas',
                energy: 8
            };
            
            const specialData = {
                id: 'special-1',
                name: 'Spartan Shield',
                character: 'Leonidas'
            };
            
            mockAvailableCardsMap.set('char-1', characterData);
            mockAvailableCardsMap.set('special-1', specialData);
            mockDeckEditorCards.push(characterCard, specialCard);
            
            // No KO'd characters
            ((window as any).koCharacters as Set<string>).clear();
            
            const shouldDim = window.SimulateKO?.shouldDimCard(
                specialCard,
                mockAvailableCardsMap,
                mockDeckEditorCards
            );
            
            expect(shouldDim).toBe(false);
        });

        it('should return false when card data is missing', () => {
            const card = {
                cardId: 'missing-card',
                type: 'special',
                quantity: 1
            };
            
            mockDeckEditorCards.push(card);
            
            const shouldDim = window.SimulateKO?.shouldDimCard(
                card,
                mockAvailableCardsMap,
                mockDeckEditorCards
            );
            
            expect(shouldDim).toBe(false);
        });

        it('should handle empty deck', () => {
            const card = {
                cardId: 'card-1',
                type: 'special',
                quantity: 1
            };
            
            const cardData = {
                id: 'card-1',
                name: 'Test Card'
            };
            
            mockAvailableCardsMap.set('card-1', cardData);
            
            const shouldDim = window.SimulateKO?.shouldDimCard(
                card,
                mockAvailableCardsMap,
                []
            );
            
            expect(shouldDim).toBe(false);
        });

        it('should handle single character deck (should not dim teamwork/ally for single character)', () => {
            const characterCard = {
                cardId: 'char-1',
                type: 'character',
                quantity: 1
            };
            
            const teamworkCard = {
                cardId: 'teamwork-1',
                type: 'teamwork',
                quantity: 1
            };
            
            const characterData = {
                id: 'char-1',
                name: 'Leonidas',
                energy: 8,
                combat: 8
            };
            
            const teamworkData = {
                id: 'teamwork-1',
                name: '6 Combat',
                to_use: '6 Combat'
            };
            
            mockAvailableCardsMap.set('char-1', characterData);
            mockAvailableCardsMap.set('teamwork-1', teamworkData);
            mockDeckEditorCards.push(characterCard, teamworkCard);
            
            // Single character, no KO'd characters - should check normal stat requirement
            const shouldDim = window.SimulateKO?.shouldDimCard(
                teamworkCard,
                mockAvailableCardsMap,
                mockDeckEditorCards
            );
            
            expect(shouldDim).toBe(false); // Character has 8 Combat, can use 6 Combat
        });
    });

    describe('displayDrawnCards Integration', () => {
        beforeEach(() => {
            document.body.innerHTML = `
                <div id="drawHandContent"></div>
            `;
        });

        it('should apply ko-dimmed class to cards that should be dimmed', () => {
            const characterCard = {
                cardId: 'char-1',
                type: 'character',
                quantity: 1
            };
            
            const specialCard = {
                cardId: 'special-1',
                type: 'special',
                quantity: 1
            };
            
            const characterData = {
                id: 'char-1',
                name: 'Leonidas',
                energy: 8,
                combat: 8
            };
            
            const specialData = {
                id: 'special-1',
                name: 'Spartan Shield',
                character: 'Leonidas',
                card_name: 'Spartan Shield'
            };
            
            mockAvailableCardsMap.set('char-1', characterData);
            mockAvailableCardsMap.set('special-1', specialData);
            mockDeckEditorCards.push(characterCard, specialCard);
            
            // KO the character
            ((window as any).koCharacters as Set<string>).add('char-1');
            
            // Mock getCardImagePath
            (window as any).getCardImagePath = jest.fn(() => '/path/to/image.webp');
            
            // Create displayDrawnCards function
            const displayDrawnCards = (cards: any[]) => {
                const drawHandContent = document.getElementById('drawHandContent');
                if (!drawHandContent) return;
                
                drawHandContent.innerHTML = '';
                
                cards.forEach((card) => {
                    const cardElement = document.createElement('div');
                    cardElement.className = 'drawn-card';
                    cardElement.dataset.cardId = card.cardId;
                    
                    // Check if card should be dimmed
                    if (window.SimulateKO && window.SimulateKO.shouldDimCard) {
                        const shouldDim = window.SimulateKO.shouldDimCard(
                            card,
                            window.availableCardsMap || new Map(),
                            window.deckEditorCards || []
                        );
                        if (shouldDim) {
                            cardElement.classList.add('ko-dimmed');
                        }
                    }
                    
                    drawHandContent.appendChild(cardElement);
                });
            };
            
            displayDrawnCards([specialCard]);
            
            const cardElement = document.querySelector('.drawn-card');
            expect(cardElement).toBeTruthy();
            expect(cardElement?.classList.contains('ko-dimmed')).toBe(true);
        });

        it('should not apply ko-dimmed class to cards that should not be dimmed', () => {
            const characterCard = {
                cardId: 'char-1',
                type: 'character',
                quantity: 1
            };
            
            const specialCard = {
                cardId: 'special-1',
                type: 'special',
                quantity: 1
            };
            
            const characterData = {
                id: 'char-1',
                name: 'Leonidas',
                energy: 8,
                combat: 8
            };
            
            const specialData = {
                id: 'special-1',
                name: 'Spartan Shield',
                character: 'Leonidas',
                card_name: 'Spartan Shield'
            };
            
            mockAvailableCardsMap.set('char-1', characterData);
            mockAvailableCardsMap.set('special-1', specialData);
            mockDeckEditorCards.push(characterCard, specialCard);
            
            // Character is not KO'd
            
            // Mock getCardImagePath
            (window as any).getCardImagePath = jest.fn(() => '/path/to/image.webp');
            
            // Create displayDrawnCards function
            const displayDrawnCards = (cards: any[]) => {
                const drawHandContent = document.getElementById('drawHandContent');
                if (!drawHandContent) return;
                
                drawHandContent.innerHTML = '';
                
                cards.forEach((card) => {
                    const cardElement = document.createElement('div');
                    cardElement.className = 'drawn-card';
                    cardElement.dataset.cardId = card.cardId;
                    
                    // Check if card should be dimmed
                    if (window.SimulateKO && window.SimulateKO.shouldDimCard) {
                        const shouldDim = window.SimulateKO.shouldDimCard(
                            card,
                            window.availableCardsMap || new Map(),
                            window.deckEditorCards || []
                        );
                        if (shouldDim) {
                            cardElement.classList.add('ko-dimmed');
                        }
                    }
                    
                    drawHandContent.appendChild(cardElement);
                });
            };
            
            displayDrawnCards([specialCard]);
            
            const cardElement = document.querySelector('.drawn-card');
            expect(cardElement).toBeTruthy();
            expect(cardElement?.classList.contains('ko-dimmed')).toBe(false);
        });
    });
});

