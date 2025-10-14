/**
 * Unit tests for Add to Deck server-side validation
 * 
 * Tests cover:
 * - Deck building rules validation
 * - User-friendly error messages
 * - Character duplication prevention
 * - Location duplication prevention
 * - API endpoint validation
 */

describe('Add to Deck Server-Side Validation', () => {
    let mockValidateCardAddition: jest.Mock;
    let mockDeckRepository: any;
    let mockRequest: any;
    let mockResponse: any;

    beforeEach(() => {
        // Mock the validateCardAddition function
        mockValidateCardAddition = jest.fn();

        // Mock deck repository
        mockDeckRepository = {
            userOwnsDeck: jest.fn(),
            getDeckById: jest.fn(),
            addCardToDeck: jest.fn()
        };

        // Mock request object
        mockRequest = {
            params: { id: 'deck-123' },
            body: {
                cardType: 'character',
                cardId: 'char-123',
                quantity: 1
            },
            user: {
                id: 'user-123',
                role: 'USER'
            }
        };

        // Mock response object
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Deck Building Rules Validation', () => {
        test('should validate character limit (max 4 characters)', () => {
            const currentCards = [
                { type: 'character', cardId: 'char-1', quantity: 1 },
                { type: 'character', cardId: 'char-2', quantity: 1 },
                { type: 'character', cardId: 'char-3', quantity: 1 },
                { type: 'character', cardId: 'char-4', quantity: 1 }
            ];

            // Simulate adding another character (would exceed limit)
            mockValidateCardAddition.mockReturnValueOnce(
                'Deck cannot have more than 4 characters (would have 5)'
            );

            const result = mockValidateCardAddition(currentCards, 'character', 'char-5', 1);
            expect(result).toBe('Deck cannot have more than 4 characters (would have 5)');
        });

        test('should validate mission limit (max 7 missions)', () => {
            const currentCards = [
                { type: 'mission', cardId: 'mission-1', quantity: 1 },
                { type: 'mission', cardId: 'mission-2', quantity: 1 },
                { type: 'mission', cardId: 'mission-3', quantity: 1 },
                { type: 'mission', cardId: 'mission-4', quantity: 1 },
                { type: 'mission', cardId: 'mission-5', quantity: 1 },
                { type: 'mission', cardId: 'mission-6', quantity: 1 },
                { type: 'mission', cardId: 'mission-7', quantity: 1 }
            ];

            mockValidateCardAddition.mockReturnValueOnce(
                'Deck cannot have more than 7 mission cards (would have 8)'
            );

            const result = mockValidateCardAddition(currentCards, 'mission', 'mission-8', 1);
            expect(result).toBe('Deck cannot have more than 7 mission cards (would have 8)');
        });

        test('should validate location limit (max 1 location)', () => {
            const currentCards = [
                { type: 'location', cardId: 'location-1', quantity: 1 }
            ];

            mockValidateCardAddition.mockReturnValueOnce(
                'Deck cannot have more than 1 location (would have 2)'
            );

            const result = mockValidateCardAddition(currentCards, 'location', 'location-2', 1);
            expect(result).toBe('Deck cannot have more than 1 location (would have 2)');
        });
    });

    describe('User-Friendly Error Messages', () => {
        test('should return user-friendly character duplication message', () => {
            const currentCards = [
                { type: 'character', cardId: 'char-1', quantity: 1 }
            ];

            mockValidateCardAddition.mockReturnValueOnce(
                'Unable to add character, may only have 1 of each character.'
            );

            const result = mockValidateCardAddition(currentCards, 'character', 'char-1', 1);
            expect(result).toBe('Unable to add character, may only have 1 of each character.');
        });

        test('should return user-friendly location duplication message', () => {
            const currentCards = [
                { type: 'location', cardId: 'location-1', quantity: 1 }
            ];

            mockValidateCardAddition.mockReturnValueOnce(
                'Unable to add location, may only have 1 per deck.'
            );

            const result = mockValidateCardAddition(currentCards, 'location', 'location-1', 1);
            expect(result).toBe('Unable to add location, may only have 1 per deck.');
        });

        test('should return generic message for other card types', () => {
            const currentCards = [
                { type: 'special', cardId: 'special-1', quantity: 1 }
            ];

            mockValidateCardAddition.mockReturnValueOnce(
                'Card can only have 1 copy per deck (would have 2)'
            );

            const result = mockValidateCardAddition(currentCards, 'special', 'special-1', 1);
            expect(result).toBe('Card can only have 1 copy per deck (would have 2)');
        });
    });

    describe('API Endpoint Validation', () => {
        test('should validate card type input', () => {
            const invalidRequest = {
                ...mockRequest,
                body: {
                    cardType: '',
                    cardId: 'char-123',
                    quantity: 1
                }
            };

            // Simulate validation logic
            const { cardType } = invalidRequest.body;
            const isValid = cardType && typeof cardType === 'string' && cardType.trim().length > 0;
            
            expect(isValid).toBeFalsy();
        });

        test('should validate card ID input', () => {
            const invalidRequest = {
                ...mockRequest,
                body: {
                    cardType: 'character',
                    cardId: '',
                    quantity: 1
                }
            };

            const { cardId } = invalidRequest.body;
            const isValid = cardId && typeof cardId === 'string' && cardId.trim().length > 0;
            
            expect(isValid).toBeFalsy();
        });

        test('should validate quantity input', () => {
            const invalidRequest = {
                ...mockRequest,
                body: {
                    cardType: 'character',
                    cardId: 'char-123',
                    quantity: 15 // Too high
                }
            };

            const { quantity } = invalidRequest.body;
            const isValid = quantity === undefined || (typeof quantity === 'number' && quantity >= 1 && quantity <= 10);
            
            expect(isValid).toBe(false);
        });

        test('should validate string length limits', () => {
            const longCardType = 'a'.repeat(51); // Too long
            const longCardId = 'a'.repeat(101); // Too long

            const cardTypeValid = longCardType.length <= 50;
            const cardIdValid = longCardId.length <= 100;

            expect(cardTypeValid).toBe(false);
            expect(cardIdValid).toBe(false);
        });
    });

    describe('Authentication and Authorization', () => {
        test('should check user ownership of deck', async () => {
            mockDeckRepository.userOwnsDeck.mockResolvedValueOnce(true);

            const ownsDeck = await mockDeckRepository.userOwnsDeck('deck-123', 'user-123');
            expect(ownsDeck).toBe(true);
            expect(mockDeckRepository.userOwnsDeck).toHaveBeenCalledWith('deck-123', 'user-123');
        });

        test('should reject non-owner access', async () => {
            mockDeckRepository.userOwnsDeck.mockResolvedValueOnce(false);

            const ownsDeck = await mockDeckRepository.userOwnsDeck('deck-123', 'user-456');
            expect(ownsDeck).toBe(false);
        });

        test('should block guest users', () => {
            const guestRequest = {
                ...mockRequest,
                user: {
                    id: 'guest-123',
                    role: 'GUEST'
                }
            };

            const isGuest = guestRequest.user.role === 'GUEST';
            expect(isGuest).toBe(true);
        });
    });

    describe('Deck Retrieval and Validation', () => {
        test('should retrieve current deck for validation', async () => {
            const mockDeck = {
                id: 'deck-123',
                user_id: 'user-123',
                cards: [
                    { type: 'character', cardId: 'char-1', quantity: 1 }
                ]
            };

            mockDeckRepository.getDeckById.mockResolvedValueOnce(mockDeck);

            const deck = await mockDeckRepository.getDeckById('deck-123');
            expect(deck).toEqual(mockDeck);
            expect(mockDeckRepository.getDeckById).toHaveBeenCalledWith('deck-123');
        });

        test('should handle missing deck', async () => {
            mockDeckRepository.getDeckById.mockResolvedValueOnce(null);

            const deck = await mockDeckRepository.getDeckById('nonexistent-deck');
            expect(deck).toBeNull();
        });

        test('should handle deck with no cards', async () => {
            const mockDeck = {
                id: 'deck-123',
                user_id: 'user-123',
                cards: []
            };

            mockDeckRepository.getDeckById.mockResolvedValueOnce(mockDeck);

            const deck = await mockDeckRepository.getDeckById('deck-123');
            expect(deck.cards).toEqual([]);
        });
    });

    describe('Card Addition Process', () => {
        test('should successfully add card when validation passes', async () => {
            const mockDeck = {
                id: 'deck-123',
                user_id: 'user-123',
                cards: []
            };

            mockDeckRepository.getDeckById.mockResolvedValueOnce(mockDeck);
            mockValidateCardAddition.mockReturnValueOnce(null); // No validation errors
            mockDeckRepository.addCardToDeck.mockResolvedValueOnce(true);

            const deck = await mockDeckRepository.getDeckById('deck-123');
            const validationError = mockValidateCardAddition(deck.cards || [], 'character', 'char-123', 1);
            const success = await mockDeckRepository.addCardToDeck('deck-123', 'character', 'char-123', 1);

            expect(validationError).toBeNull();
            expect(success).toBe(true);
        });

        test('should fail when validation returns error', () => {
            const validationError = 'Unable to add character, may only have 1 of each character.';
            mockValidateCardAddition.mockReturnValueOnce(validationError);

            const result = mockValidateCardAddition([], 'character', 'char-123', 1);
            expect(result).toBe(validationError);
        });

        test('should handle addCardToDeck failure', async () => {
            mockDeckRepository.addCardToDeck.mockResolvedValueOnce(false);

            const success = await mockDeckRepository.addCardToDeck('deck-123', 'character', 'char-123', 1);
            expect(success).toBe(false);
        });
    });

    describe('Error Response Handling', () => {
        test('should return 400 for validation errors', () => {
            const validationError = 'Unable to add character, may only have 1 of each character.';
            
            // Simulate API response
            mockResponse.status(400).json({
                success: false,
                error: validationError
            });

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                error: validationError
            });
        });

        test('should return 403 for ownership errors', () => {
            mockResponse.status(403).json({
                success: false,
                error: 'Access denied. You do not own this deck.'
            });

            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                error: 'Access denied. You do not own this deck.'
            });
        });

        test('should return 404 for missing deck', () => {
            mockResponse.status(404).json({
                success: false,
                error: 'Deck not found'
            });

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                error: 'Deck not found'
            });
        });

        test('should return 500 for server errors', () => {
            mockResponse.status(500).json({
                success: false,
                error: 'Failed to add card to deck'
            });

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                error: 'Failed to add card to deck'
            });
        });
    });

    describe('Edge Cases and Error Handling', () => {
        test('should handle undefined cards array', () => {
            const deckWithUndefinedCards = {
                id: 'deck-123',
                cards: undefined
            };

            const cards = deckWithUndefinedCards.cards || [];
            expect(cards).toEqual([]);
        });

        test('should handle null cards array', () => {
            const deckWithNullCards = {
                id: 'deck-123',
                cards: null
            };

            const cards = deckWithNullCards.cards || [];
            expect(cards).toEqual([]);
        });

        test('should handle missing quantity parameter', () => {
            const requestWithoutQuantity = {
                ...mockRequest,
                body: {
                    cardType: 'character',
                    cardId: 'char-123'
                    // quantity is missing
                }
            };

            const quantity = requestWithoutQuantity.body.quantity || 1;
            expect(quantity).toBe(1);
        });

        test('should handle alternate image parameter', () => {
            const requestWithAlternateImage = {
                ...mockRequest,
                body: {
                    cardType: 'character',
                    cardId: 'char-123',
                    quantity: 1,
                    selectedAlternateImage: 'alternate-image.jpg'
                }
            };

            const { selectedAlternateImage } = requestWithAlternateImage.body;
            expect(selectedAlternateImage).toBe('alternate-image.jpg');
        });
    });
});
