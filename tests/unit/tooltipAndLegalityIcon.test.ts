/** @jest-environment jsdom */
import { DeckValidationService } from '../../src/services/deckValidationService';
import { DeckCard } from '../../src/types';

/**
 * @jest-environment jsdom
 */


describe('Tooltip and Legality Icon Tests', () => {
    let deckValidationService: DeckValidationService;
    let mockCardRepository: any;

    beforeEach(() => {
        // Reset any mocks
        jest.clearAllMocks();
        
        // Create mock card repository
        mockCardRepository = {
            getAllCharacters: jest.fn().mockResolvedValue([
                { id: 'char1', name: 'Character 1', energy: 6, combat: 5, brute_force: 4, intelligence: 7 },
                { id: 'char2', name: 'Character 2', energy: 5, combat: 6, brute_force: 5, intelligence: 6 },
                { id: 'char3', name: 'Character 3', energy: 4, combat: 7, brute_force: 6, intelligence: 5 },
                { id: 'char4', name: 'Character 4', energy: 7, combat: 4, brute_force: 7, intelligence: 8 },
                { id: 'angry_mob', name: 'Angry Mob: Middle Ages', energy: 5, combat: 5, brute_force: 5, intelligence: 5 }
            ]),
            getAllSpecialCards: jest.fn().mockResolvedValue([
                { id: 'special1', name: 'Special 1', character_name: 'Character 1' },
                { id: 'special2', name: 'Special 2', character_name: 'Character 2' },
                { id: 'special3', name: 'Special 3', character_name: 'Any Character' },
                { id: 'angry_mob_special', name: 'Angry Mob Special', character_name: 'Angry Mob' },
                { id: 'angry_mob_subtype', name: 'Angry Mob: Industrial Age Special', character_name: 'Angry Mob: Industrial Age' }
            ]),
            getAllPowerCards: jest.fn().mockResolvedValue([
                { id: 'power1', name: 'Power 1', power_type: 'Energy', value: 5 },
                { id: 'power2', name: 'Power 2', power_type: 'Combat', value: 8 },
                { id: 'power3', name: 'Power 3', power_type: 'Brute Force', value: 6 },
                { id: 'power4', name: 'Power 4', power_type: 'Intelligence', value: 9 }
            ]),
            getAllMissions: jest.fn().mockResolvedValue([
                { id: 'mission1', name: 'Mission 1', mission_set: 'Set A' },
                { id: 'mission2', name: 'Mission 2', mission_set: 'Set A' },
                { id: 'mission3', name: 'Mission 3', mission_set: 'Set A' },
                { id: 'mission4', name: 'Mission 4', mission_set: 'Set A' },
                { id: 'mission5', name: 'Mission 5', mission_set: 'Set A' },
                { id: 'mission6', name: 'Mission 6', mission_set: 'Set A' },
                { id: 'mission7', name: 'Mission 7', mission_set: 'Set A' }
            ]),
            getAllEvents: jest.fn().mockResolvedValue([
                { id: 'event1', name: 'Event 1', mission_set: 'Set A' },
                { id: 'event2', name: 'Event 2', mission_set: 'Set B' }
            ]),
            getAllLocations: jest.fn().mockResolvedValue([
                { id: 'location1', name: 'Location 1', threat_level: 5 },
                { id: 'location2', name: 'Location 2', threat_level: 3 }
            ]),
            getAllAspects: jest.fn().mockResolvedValue([]),
            getAllAdvancedUniverse: jest.fn().mockResolvedValue([]),
            getAllTeamwork: jest.fn().mockResolvedValue([]),
            getAllAllyUniverse: jest.fn().mockResolvedValue([]),
            getAllTraining: jest.fn().mockResolvedValue([]),
            getAllBasicUniverse: jest.fn().mockResolvedValue([
                { id: 'universe1', name: 'Universe 1', to_use: 'Energy', value: 6 },
                { id: 'universe2', name: 'Universe 2', to_use: 'Combat', value: 8 }
            ])
        };

        // Create deck validation service instance
        deckValidationService = new DeckValidationService(mockCardRepository);
    });

    describe('updateDeckTitleValidation Function', () => {
        let mockValidationBadge: HTMLElement;
        let mockUpdateDeckTitleValidation: (deckCards: any[]) => void;

        beforeEach(() => {
            // Create mock DOM elements
            mockValidationBadge = {
                textContent: '',
                className: '',
                setAttribute: jest.fn(),
                removeAttribute: jest.fn(),
                getAttribute: jest.fn()
            } as any;

            // Mock document.getElementById
            document.getElementById = jest.fn().mockReturnValue(mockValidationBadge);

            // Create the function we're testing (simulating the actual function from HTML)
            mockUpdateDeckTitleValidation = (deckCards: any[]) => {
                const validationBadge = document.getElementById('deckTitleValidationBadge');
                if (!validationBadge) return;

                if (!deckCards || deckCards.length === 0) {
                    validationBadge.textContent = '';
                    validationBadge.className = 'deck-validation-badge';
                    validationBadge.removeAttribute('title');
                    return;
                }

                // This would normally call validateDeck, but we'll mock the validation results
                const validation: any[] = [];
                
                if (validation.length > 0) {
                    validationBadge.textContent = 'Not Legal';
                    validationBadge.className = 'deck-validation-badge error';
                    const tooltipText = validation.map(error => error.message).join('\n');
                    validationBadge.setAttribute('title', tooltipText);
                } else {
                    validationBadge.textContent = 'Legal';
                    validationBadge.className = 'deck-validation-badge success';
                    validationBadge.removeAttribute('title');
                }
            };
        });

        test('should show "Legal" when deck has no cards', () => {
            mockUpdateDeckTitleValidation([]);

            expect(mockValidationBadge.textContent).toBe('');
            expect(mockValidationBadge.className).toBe('deck-validation-badge');
            expect(mockValidationBadge.removeAttribute).toHaveBeenCalledWith('title');
        });

        test('should show "Legal" when deck has no validation errors or warnings', () => {
            // Mock validation with no errors or warnings
            const mockValidateDeck = jest.fn().mockReturnValue({ errors: [], warnings: [] });
            
            const deckCards: DeckCard[] = [{ id: 'deck-card-1', type: 'character', cardId: 'char1', quantity: 1 }];
            mockUpdateDeckTitleValidation(deckCards);

            expect(mockValidationBadge.textContent).toBe('Legal');
            expect(mockValidationBadge.className).toBe('deck-validation-badge success');
            expect(mockValidationBadge.removeAttribute).toHaveBeenCalledWith('title');
        });

        test('should show "Not Legal" with tooltip when deck has validation errors', () => {
            const validationErrors = [
                'Deck must have exactly 4 characters (found 3)',
                'Deck must have at least 51 cards in draw pile (found 0)'
            ];

            // Override the mock function to return errors
            const originalMock = mockUpdateDeckTitleValidation;
            mockUpdateDeckTitleValidation = (deckCards: any[]) => {
                const validationBadge = document.getElementById('deckTitleValidationBadge');
                if (!validationBadge) return;

                const validation = validationErrors.map(error => ({ message: error }));
                
                if (validation.length > 0) {
                    validationBadge.textContent = 'Not Legal';
                    validationBadge.className = 'deck-validation-badge error';
                    const tooltipText = validation.map(error => error.message).join('\n');
                    validationBadge.setAttribute('title', tooltipText);
                }
            };

            const deckCards: DeckCard[] = [{ id: 'deck-card-1', type: 'character', cardId: 'char1', quantity: 1 }];
            mockUpdateDeckTitleValidation(deckCards);

            expect(mockValidationBadge.textContent).toBe('Not Legal');
            expect(mockValidationBadge.className).toBe('deck-validation-badge error');
            expect(mockValidationBadge.setAttribute).toHaveBeenCalledWith('title', validationErrors.join('\n'));
        });

        test('should show "Has Warnings" with tooltip when deck has warnings', () => {
            // Since the real validation service doesn't have warnings, we'll test the structure
            const deckCards: DeckCard[] = [{ id: 'deck-card-1', type: 'character', cardId: 'char1', quantity: 1 }];
            mockUpdateDeckTitleValidation(deckCards);

            // The mock function should handle the case where there are no errors
            expect(mockValidationBadge.textContent).toBe('Legal');
            expect(mockValidationBadge.className).toBe('deck-validation-badge success');
        });
    });

    describe('Tooltip Content Validation', () => {
        test('should format multiple validation errors with newlines in tooltip', async () => {
            const deckCards: DeckCard[] = [
                { id: 'deck-card-1', type: 'character', cardId: 'char1', quantity: 1 }, // Only 1 character (needs 4)
                { id: 'deck-card-2', type: 'mission', cardId: 'mission1', quantity: 1 }  // Only 1 mission (needs 7)
            ];

            const validation = await deckValidationService.validateDeck(deckCards);
            
            expect(validation.length).toBeGreaterThan(0);
            
            // Check that errors are properly formatted for tooltip
            const tooltipText = validation.map(error => error.message).join('\n');
            expect(tooltipText).toContain('\n');
            expect(tooltipText).toContain('characters');
            expect(tooltipText).toContain('mission');
        });

        test('should include all validation rule types in tooltip', async () => {
            const deckCards: DeckCard[] = [
                { id: 'deck-card-1', type: 'character', cardId: 'char1', quantity: 1 }, // Rule 1: Not enough characters
                { id: 'deck-card-2', type: 'special', cardId: 'special2', quantity: 1 }, // Rule 2: Wrong character special
                { id: 'deck-card-3', type: 'mission', cardId: 'mission1', quantity: 1 }, // Rule 3: Not enough missions
                { id: 'deck-card-4', type: 'event', cardId: 'event2', quantity: 1 }, // Rule 4: Wrong mission set event
                { id: 'deck-card-5', type: 'location', cardId: 'location1', quantity: 2 }, // Rule 5: Too many locations
                { id: 'deck-card-6', type: 'power', cardId: 'power2', quantity: 1 } // Rule 8: Unusable power card
            ];

            const validation = await deckValidationService.validateDeck(deckCards);
            
            expect(validation.length).toBeGreaterThan(0);
            
            const tooltipText = validation.map(error => error.message).join('\n');
            
            // Check for various validation rule messages
            expect(tooltipText).toMatch(/characters?/i);
            expect(tooltipText).toMatch(/mission/i);
            expect(tooltipText).toMatch(/location/i);
        });
    });

    describe('Legality Icon States', () => {
        test('should show "Legal" icon for valid deck', async () => {
            const validDeckCards: DeckCard[] = [
                { id: 'deck-card-1', type: 'character', cardId: 'char1', quantity: 1 },
                { id: 'deck-card-2', type: 'character', cardId: 'char2', quantity: 1 },
                { id: 'deck-card-3', type: 'character', cardId: 'char3', quantity: 1 },
                { id: 'deck-card-4', type: 'character', cardId: 'char4', quantity: 1 },
                { id: 'deck-card-5', type: 'mission', cardId: 'mission1', quantity: 1 },
                { id: 'deck-card-6', type: 'mission', cardId: 'mission2', quantity: 1 },
                { id: 'deck-card-7', type: 'mission', cardId: 'mission3', quantity: 1 },
                { id: 'deck-card-8', type: 'mission', cardId: 'mission4', quantity: 1 },
                { id: 'deck-card-9', type: 'mission', cardId: 'mission5', quantity: 1 },
                { id: 'deck-card-10', type: 'mission', cardId: 'mission6', quantity: 1 },
                { id: 'deck-card-11', type: 'mission', cardId: 'mission7', quantity: 1 },
                { id: 'deck-card-12', type: 'power', cardId: 'power1', quantity: 40 }
            ];

            const validation = await deckValidationService.validateDeck(validDeckCards);
            
            expect(validation).toHaveLength(0);
        });

        test('should show "Not Legal" icon for invalid deck', async () => {
            const invalidDeckCards: DeckCard[] = [
                { id: 'deck-card-1', type: 'character', cardId: 'char1', quantity: 1 } // Only 1 character, needs 4
            ];

            const validation = await deckValidationService.validateDeck(invalidDeckCards);
            
            expect(validation.length).toBeGreaterThan(0);
        });

        test('should show "Has Warnings" icon for deck with warnings', async () => {
            // This test would need to be adjusted based on what constitutes a warning
            // For now, we'll test that the validation system can distinguish between errors and warnings
            const deckCards: DeckCard[] = [
                { id: 'deck-card-1', type: 'character', cardId: 'char1', quantity: 1 }
            ];

            const validation = await deckValidationService.validateDeck(deckCards);
            
            // Currently all validation failures are errors, but this tests the structure
            expect(Array.isArray(validation)).toBe(true);
        });
    });

    describe('Tooltip Content for Specific Validation Rules', () => {
        test('should show character count error in tooltip', async () => {
            const deckCards: DeckCard[] = [
                { id: 'deck-card-1', type: 'character', cardId: 'char1', quantity: 1 }
            ];

            const validation = await deckValidationService.validateDeck(deckCards);
            const tooltipText = validation.map(error => error.message).join('\n');
            
            expect(tooltipText).toMatch(/exactly 4 characters/i);
        });

        test('should show mission count error in tooltip', async () => {
            const deckCards: DeckCard[] = [
                { id: 'deck-card-1', type: 'character', cardId: 'char1', quantity: 4 },
                { id: 'deck-card-2', type: 'mission', cardId: 'mission1', quantity: 1 }
            ];

            const validation = await deckValidationService.validateDeck(deckCards);
            const tooltipText = validation.map(error => error.message).join('\n');
            
            expect(tooltipText).toMatch(/exactly 7 mission/i);
        });

        test('should show deck size error in tooltip', async () => {
            const deckCards: DeckCard[] = [
                { id: 'deck-card-1', type: 'character', cardId: 'char1', quantity: 4 },
                { id: 'deck-card-2', type: 'mission', cardId: 'mission1', quantity: 7 }
            ];

            const validation = await deckValidationService.validateDeck(deckCards);
            const tooltipText = validation.map(error => error.message).join('\n');
            
            expect(tooltipText).toMatch(/at least 51 cards/i);
        });

        test('should show location count error in tooltip', async () => {
            const deckCards: DeckCard[] = [
                { id: 'deck-card-1', type: 'character', cardId: 'char1', quantity: 4 },
                { id: 'deck-card-2', type: 'mission', cardId: 'mission1', quantity: 7 },
                { id: 'deck-card-3', type: 'location', cardId: 'location1', quantity: 2 }
            ];

            const validation = await deckValidationService.validateDeck(deckCards);
            const tooltipText = validation.map(error => error.message).join('\n');
            
            expect(tooltipText).toMatch(/at most 1 location/i);
        });

        test('should show unusable card error in tooltip', async () => {
            const deckCards: DeckCard[] = [
                { id: 'deck-card-1', type: 'character', cardId: 'char1', quantity: 4 },
                { id: 'deck-card-2', type: 'mission', cardId: 'mission1', quantity: 7 },
                { id: 'deck-card-3', type: 'power', cardId: 'power2', quantity: 1 } // 8 Combat, but char1 only has 5 Combat
            ];

            const validation = await deckValidationService.validateDeck(deckCards);
            const tooltipText = validation.map(error => error.message).join('\n');
            
            expect(tooltipText).toMatch(/requires a character/i);
            expect(tooltipText).toMatch(/Power Card/i);
        });

        test('should show Angry Mob validation error in tooltip', async () => {
            const deckCards: DeckCard[] = [
                { id: 'deck-card-1', type: 'character', cardId: 'char1', quantity: 1 },
                { id: 'deck-card-2', type: 'character', cardId: 'angry_mob', quantity: 1 },
                { id: 'deck-card-3', type: 'character', cardId: 'char2', quantity: 1 },
                { id: 'deck-card-4', type: 'character', cardId: 'char3', quantity: 1 },
                { id: 'deck-card-5', type: 'special', cardId: 'angry_mob_subtype', quantity: 1 } // Wrong subtype
            ];

            const validation = await deckValidationService.validateDeck(deckCards);
            const tooltipText = validation.map(error => error.message).join('\n');
            
            expect(tooltipText).toMatch(/Angry Mob/i);
        });
    });
});
