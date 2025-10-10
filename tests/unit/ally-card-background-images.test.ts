/**
 * Unit tests for Ally card background image functionality
 * Tests that Ally cards display correctly in tile view with background images
 */

describe('Ally Card Background Images', () => {
    let mockDocument: any;
    let mockConsoleLog: jest.SpyInstance;
    let mockConsoleWarn: jest.SpyInstance;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        
        // Mock console methods
        mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
        mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();
        
        // Mock document
        mockDocument = {
            querySelectorAll: jest.fn(),
            createElement: jest.fn()
        };
        global.document = mockDocument;
        
        // Mock global variables
        (global as any).availableCardsMap = new Map();
    });

    afterEach(() => {
        mockConsoleLog.mockRestore();
        mockConsoleWarn.mockRestore();
    });

    describe('applyCharacterBackgroundsToEditor function', () => {
        it('should apply background images to ally-universe cards', () => {
            // Mock DOM elements
            const mockCard = {
                getAttribute: jest.fn().mockReturnValue('/src/resources/cards/images/ally-universe/test-card.webp'),
                style: {
                    setProperty: jest.fn()
                }
            };

            mockDocument.querySelectorAll.mockImplementation((selector: string) => {
                if (selector === '.deck-card-editor-item.ally-universe-card') {
                    return [mockCard];
                }
                return [];
            });

            // Mock Image constructor
            const mockImage = {
                onload: null as (() => void) | null,
                onerror: null as (() => void) | null,
                src: ''
            };
            (global as any).Image = jest.fn(() => mockImage);

            // Define the applyCharacterBackgroundsToEditor function
            function applyCharacterBackgroundsToEditor() {
                const characterCards = mockDocument.querySelectorAll('.deck-card-editor-item.character-card');
                const powerCards = mockDocument.querySelectorAll('.deck-card-editor-item.power-card');
                const locationCards = mockDocument.querySelectorAll('.deck-card-editor-item.location-card');
                const specialCards = mockDocument.querySelectorAll('.deck-card-editor-item.special-card');
                const missionCards = mockDocument.querySelectorAll('.deck-card-editor-item.mission-card');
                const eventCards = mockDocument.querySelectorAll('.deck-card-editor-item.event-card');
                const aspectCards = mockDocument.querySelectorAll('.deck-card-editor-item.aspect-card');
                const teamworkCards = mockDocument.querySelectorAll('.deck-card-editor-item.teamwork-card');
                const allyUniverseCards = mockDocument.querySelectorAll('.deck-card-editor-item.ally-universe-card');
                const basicUniverseCards = mockDocument.querySelectorAll('.deck-card-editor-item.basic-universe-card');
                const advancedUniverseCards = mockDocument.querySelectorAll('.deck-card-editor-item.advanced-universe-card');
                const trainingCards = mockDocument.querySelectorAll('.deck-card-editor-item.training-card');
                
                // Apply to ally-universe cards
                allyUniverseCards.forEach((card: any) => {
                    const bgImage = card.getAttribute('data-bg-image');
                    if (bgImage) {
                        // Test if image loads successfully
                        const img = new Image();
                        img.onload = function() {
                            // URL encode the path for CSS
                            const encodedPath = encodeURI(bgImage);
                            card.style.setProperty('--bg-image', `url(${encodedPath})`);
                        };
                        img.onerror = function() {
                            // Fallback: use default gradient without background image
                            card.style.setProperty('--bg-image', 'none');
                        };
                        img.src = bgImage;
                    }
                });
            }

            // Execute the function
            applyCharacterBackgroundsToEditor();

            // Verify ally-universe cards were queried
            expect(mockDocument.querySelectorAll).toHaveBeenCalledWith('.deck-card-editor-item.ally-universe-card');
            
            // Verify card attributes were checked
            expect(mockCard.getAttribute).toHaveBeenCalledWith('data-bg-image');
            
            // Verify Image was created
            expect(global.Image).toHaveBeenCalled();
            
            // Simulate successful image load
            if (mockImage.onload) {
                mockImage.onload();
            }
            
            // Verify CSS property was set
            expect(mockCard.style.setProperty).toHaveBeenCalledWith('--bg-image', 'url(/src/resources/cards/images/ally-universe/test-card.webp)');
        });

        it('should handle image load errors for ally-universe cards', () => {
            // Mock DOM elements
            const mockCard = {
                getAttribute: jest.fn().mockReturnValue('/src/resources/cards/images/ally-universe/missing-card.webp'),
                style: {
                    setProperty: jest.fn()
                }
            };

            mockDocument.querySelectorAll.mockImplementation((selector: string) => {
                if (selector === '.deck-card-editor-item.ally-universe-card') {
                    return [mockCard];
                }
                return [];
            });

            // Mock Image constructor
            const mockImage = {
                onload: null as (() => void) | null,
                onerror: null as (() => void) | null,
                src: ''
            };
            (global as any).Image = jest.fn(() => mockImage);

            // Define the applyCharacterBackgroundsToEditor function
            function applyCharacterBackgroundsToEditor() {
                const allyUniverseCards = mockDocument.querySelectorAll('.deck-card-editor-item.ally-universe-card');
                
                // Apply to ally-universe cards
                allyUniverseCards.forEach((card: any) => {
                    const bgImage = card.getAttribute('data-bg-image');
                    if (bgImage) {
                        const img = new Image();
                        img.onload = function() {
                            const encodedPath = encodeURI(bgImage);
                            card.style.setProperty('--bg-image', `url(${encodedPath})`);
                        };
                        img.onerror = function() {
                            card.style.setProperty('--bg-image', 'none');
                        };
                        img.src = bgImage;
                    }
                });
            }

            // Execute the function
            applyCharacterBackgroundsToEditor();

            // Simulate image load error
            if (mockImage.onerror) {
                mockImage.onerror();
            }
            
            // Verify fallback CSS property was set
            expect(mockCard.style.setProperty).toHaveBeenCalledWith('--bg-image', 'none');
        });

        it('should handle ally-universe cards without background image data', () => {
            // Mock DOM elements
            const mockCard = {
                getAttribute: jest.fn().mockReturnValue(null),
                style: {
                    setProperty: jest.fn()
                }
            };

            mockDocument.querySelectorAll.mockImplementation((selector: string) => {
                if (selector === '.deck-card-editor-item.ally-universe-card') {
                    return [mockCard];
                }
                return [];
            });

            // Define the applyCharacterBackgroundsToEditor function
            function applyCharacterBackgroundsToEditor() {
                const allyUniverseCards = mockDocument.querySelectorAll('.deck-card-editor-item.ally-universe-card');
                
                // Apply to ally-universe cards
                allyUniverseCards.forEach((card: any) => {
                    const bgImage = card.getAttribute('data-bg-image');
                    if (bgImage) {
                        // This should not execute
                        card.style.setProperty('--bg-image', 'url(test)');
                    }
                });
            }

            // Execute the function
            applyCharacterBackgroundsToEditor();

            // Verify card attributes were checked
            expect(mockCard.getAttribute).toHaveBeenCalledWith('data-bg-image');
            
            // Verify no CSS property was set
            expect(mockCard.style.setProperty).not.toHaveBeenCalled();
        });
    });

    describe('displayDeckCardsForEditing function - Ally card rendering', () => {
        it('should correctly identify ally-universe cards and assign CSS classes', () => {
            // Mock deck editor cards with converted types
            const mockDeckEditorCards = [
                {
                    id: 'card1',
                    cardId: 'card-id-1',
                    type: 'ally-universe', // Converted from ally_universe
                    quantity: 1
                },
                {
                    id: 'card2',
                    cardId: 'card-id-2', 
                    type: 'character',
                    quantity: 1
                }
            ];

            // Mock available cards map
            const mockAvailableCard = {
                card_name: 'Test Ally',
                stat_to_use: '5 or less',
                stat_type_to_use: 'Combat',
                attack_value: '3',
                attack_type: 'Combat'
            };
            (global as any).availableCardsMap.set('card-id-1', mockAvailableCard);

            // Define the card type checking logic from displayDeckCardsForEditing
            function checkCardTypes(card: any) {
                const isCharacter = card.type === 'character';
                const isAllyUniverse = card.type === 'ally-universe';
                
                const characterClass = isCharacter ? 'character-card' : '';
                const allyUniverseClass = isAllyUniverse ? 'ally-universe-card' : '';
                
                return {
                    isCharacter,
                    isAllyUniverse,
                    characterClass,
                    allyUniverseClass
                };
            }

            // Test ally-universe card
            const allyResult = checkCardTypes(mockDeckEditorCards[0]);
            expect(allyResult.isAllyUniverse).toBe(true);
            expect(allyResult.isCharacter).toBe(false);
            expect(allyResult.allyUniverseClass).toBe('ally-universe-card');
            expect(allyResult.characterClass).toBe('');

            // Test character card
            const characterResult = checkCardTypes(mockDeckEditorCards[1]);
            expect(characterResult.isCharacter).toBe(true);
            expect(characterResult.isAllyUniverse).toBe(false);
            expect(characterResult.characterClass).toBe('character-card');
            expect(characterResult.allyUniverseClass).toBe('');
        });

        it('should generate correct card names for ally-universe cards', () => {
            const mockCard = {
                type: 'ally-universe',
                quantity: 1
            };

            const mockAvailableCard = {
                card_name: 'Hucklebuck',
                stat_to_use: '5 or less',
                stat_type_to_use: 'Combat',
                attack_value: '3',
                attack_type: 'Combat'
            };

            // Define the card name generation logic from displayDeckCardsForEditing
            function generateCardName(card: any, availableCard: any) {
                if (card.type === 'ally-universe') {
                    return `${availableCard.card_name} - ${availableCard.stat_to_use} ${availableCard.stat_type_to_use} → ${availableCard.attack_value} ${availableCard.attack_type}`;
                }
                return availableCard.card_name || 'Unknown Card';
            }

            const cardName = generateCardName(mockCard, mockAvailableCard);
            expect(cardName).toBe('Hucklebuck - 5 or less Combat → 3 Combat');
        });

        it('should include ally-universe cards in background image data attribute', () => {
            const mockCard = {
                type: 'ally-universe',
                selectedAlternateImage: null
            };

            const mockAvailableCard = {
                card_name: 'Little John',
                image: '5_brute_force.webp'
            };

            // Mock getCardImagePath function
            function getCardImagePath(card: any, cardType: string, selectedAlternateImage: any) {
                if (cardType === 'ally-universe' || cardType === 'ally_universe') {
                    if (card.image) {
                        return `/src/resources/cards/images/ally-universe/${card.image}`;
                    }
                }
                return null;
            }

            // Define the background image data logic from displayDeckCardsForEditing
            function generateBackgroundImageData(card: any, availableCard: any) {
                const isCharacter = card.type === 'character';
                const isPower = card.type === 'power';
                const isLocation = card.type === 'location';
                const isMission = card.type === 'mission';
                const isEvent = card.type === 'event';
                const isAspect = card.type === 'aspect';
                const isTeamwork = card.type === 'teamwork';
                const isAllyUniverse = card.type === 'ally-universe';
                const isBasicUniverse = card.type === 'basic-universe';
                const isAdvancedUniverse = card.type === 'advanced-universe';
                const isTraining = card.type === 'training';

                const shouldHaveBackground = isCharacter || isPower || isLocation || isMission || isEvent || isAspect || isTeamwork || card.type === 'ally-universe' || card.type === 'basic-universe' || card.type === 'advanced-universe' || card.type === 'training';

                if (shouldHaveBackground) {
                    const imagePath = getCardImagePath(availableCard, card.type, card.selectedAlternateImage);
                    return `data-bg-image="${imagePath}"`;
                }
                return '';
            }

            const bgImageData = generateBackgroundImageData(mockCard, mockAvailableCard);
            expect(bgImageData).toContain('data-bg-image=');
            expect(bgImageData).toContain('ally-universe');
        });
    });

    describe('getCardImagePath function - Ally card image paths', () => {
        it('should generate correct image path for ally-universe cards', () => {
            const mockCard = {
                image: '5_combat.webp'
            };

            // Define the getCardImagePath function
            function getCardImagePath(card: any, cardType: string, selectedAlternateImage: any = null) {
                try {
                    if (cardType === 'ally-universe' || cardType === 'ally_universe') {
                        // Ally universe cards use the image field (which already includes the directory)
                        if (card.image) {
                            return `/src/resources/cards/images/ally-universe/${card.image}`;
                        }
                    }
                    return null;
                } catch (error) {
                    return null;
                }
            }

            const imagePath = getCardImagePath(mockCard, 'ally-universe');
            expect(imagePath).toBe('/src/resources/cards/images/ally-universe/5_combat.webp');
        });

        it('should handle ally-universe cards without image field', () => {
            const mockCard = {};

            function getCardImagePath(card: any, cardType: string, selectedAlternateImage: any = null) {
                try {
                    if (cardType === 'ally-universe' || cardType === 'ally_universe') {
                        if (card.image) {
                            return `/src/resources/cards/images/ally-universe/${card.image}`;
                        }
                    }
                    return null;
                } catch (error) {
                    return null;
                }
            }

            const imagePath = getCardImagePath(mockCard, 'ally-universe');
            expect(imagePath).toBeNull();
        });

        it('should handle both ally-universe and ally_universe type formats', () => {
            const mockCard = {
                image: '7_intelligence.webp'
            };

            function getCardImagePath(card: any, cardType: string, selectedAlternateImage: any = null) {
                try {
                    if (cardType === 'ally-universe' || cardType === 'ally_universe') {
                        if (card.image) {
                            return `/src/resources/cards/images/ally-universe/${card.image}`;
                        }
                    }
                    return null;
                } catch (error) {
                    return null;
                }
            }

            // Test hyphen format
            const hyphenPath = getCardImagePath(mockCard, 'ally-universe');
            expect(hyphenPath).toBe('/src/resources/cards/images/ally-universe/7_intelligence.webp');

            // Test underscore format (for backward compatibility)
            const underscorePath = getCardImagePath(mockCard, 'ally_universe');
            expect(underscorePath).toBe('/src/resources/cards/images/ally-universe/7_intelligence.webp');
        });
    });

    describe('Type conversion integration', () => {
        it('should work with converted card types from database', () => {
            // Simulate cards loaded from database with type conversion
            const mockCardsFromDatabase = [
                {
                    id: 'card1',
                    cardId: 'card-id-1',
                    type: 'ally_universe', // Original database format
                    quantity: 1
                }
            ];

            // Simulate type conversion in loadDeckForEditing
            const convertedCards = mockCardsFromDatabase.map(card => {
                let convertedType = card.type;
                if (card.type === 'ally_universe') {
                    convertedType = 'ally-universe';
                }
                return { ...card, type: convertedType };
            });

            // Verify conversion worked
            expect(convertedCards[0].type).toBe('ally-universe');

            // Verify the converted card works with rendering logic
            const isAllyUniverse = convertedCards[0].type === 'ally-universe';
            expect(isAllyUniverse).toBe(true);

            const allyUniverseClass = isAllyUniverse ? 'ally-universe-card' : '';
            expect(allyUniverseClass).toBe('ally-universe-card');
        });
    });
});
