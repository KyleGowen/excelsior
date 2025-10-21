import { DeckValidationService } from '../../src/services/deckValidationService';
import { CardRepository } from '../../src/repository/CardRepository';
import { DeckCard, Character, SpecialCard, PowerCard, Mission } from '../../src/types';

// Mock the CardRepository
const mockCardRepository: jest.Mocked<CardRepository> = {
    getAllCharacters: jest.fn(),
    getAllSpecialCards: jest.fn(),
    getAllPowerCards: jest.fn(),
    getAllMissions: jest.fn(),
    getAllEvents: jest.fn(),
    getAllLocations: jest.fn(),
    getAllAspects: jest.fn(),
    getAllAdvancedUniverse: jest.fn(),
    getAllTeamwork: jest.fn(),
    getAllAllyUniverse: jest.fn(),
    getAllTraining: jest.fn(),
    getAllBasicUniverse: jest.fn(),
    getCharacterById: jest.fn(),
    getSpecialCardById: jest.fn(),
    getPowerCardById: jest.fn(),
    getMissionById: jest.fn(),
    getEventById: jest.fn(),
    getLocationById: jest.fn(),
    getAspectById: jest.fn(),
    getAdvancedUniverseById: jest.fn(),
    getTeamworkById: jest.fn(),
    getAllyUniverseById: jest.fn(),
    getTrainingById: jest.fn(),
    getBasicUniverseById: jest.fn(),
    initialize: jest.fn(),
    getCharacterEffectiveImage: jest.fn(),
    getSpecialCardEffectiveImage: jest.fn(),
    getPowerCardEffectiveImage: jest.fn(),
    getCardStats: jest.fn()
};

describe('DeckValidationService - One Per Deck Validation', () => {
    let validationService: DeckValidationService;

    beforeEach(() => {
        jest.clearAllMocks();
        validationService = new DeckValidationService(mockCardRepository);
    });

    describe('one-per-deck validation', () => {
        it('should pass validation when no one-per-deck cards are duplicated', async () => {
            // Mock card data with one-per-deck cards
            const mockCharacter: Character = {
                id: 'char1',
                name: 'Character 1',
                energy: 5,
                combat: 5,
                brute_force: 5,
                intelligence: 5,
                threat_level: 5,
                special_abilities: '',
                image: 'char1.jpg'
            };
            
            const mockSpecial: SpecialCard = {
                id: 'special1',
                name: 'One Per Deck Special',
                card_type: 'Special',
                character: 'Any Character',
                card_effect: 'Test effect',
                image: 'special1.jpg',
                is_cataclysm: false,
                is_assist: false,
        is_ambush: false,
                one_per_deck: true
            };
            
            const mockPower: PowerCard = {
                id: 'power1',
                name: 'One Per Deck Power',
                power_type: 'Energy',
                value: 3,
                image: 'power1.jpg',
                one_per_deck: true
            };
            
            const mockMission: Mission = {
                id: 'mission1',
                mission_set: 'Test Set',
                card_name: 'Mission 1',
                image: 'mission1.jpg'
            };

            // Mock repository responses
            mockCardRepository.getAllCharacters.mockResolvedValue([mockCharacter]);
            mockCardRepository.getAllSpecialCards.mockResolvedValue([mockSpecial]);
            mockCardRepository.getAllPowerCards.mockResolvedValue([mockPower]);
            mockCardRepository.getAllMissions.mockResolvedValue([mockMission]);
            mockCardRepository.getAllEvents.mockResolvedValue([]);
            mockCardRepository.getAllLocations.mockResolvedValue([]);
            mockCardRepository.getAllAspects.mockResolvedValue([]);
            mockCardRepository.getAllAdvancedUniverse.mockResolvedValue([]);
            mockCardRepository.getAllTeamwork.mockResolvedValue([]);
            mockCardRepository.getAllAllyUniverse.mockResolvedValue([]);
            mockCardRepository.getAllTraining.mockResolvedValue([]);
            mockCardRepository.getAllBasicUniverse.mockResolvedValue([]);

            // Deck with one copy of each one-per-deck card
            const deckCards: DeckCard[] = [
                { id: 'deck-char1', type: 'character', cardId: 'char1', quantity: 1 },
                { id: 'deck-special1', type: 'special', cardId: 'special1', quantity: 1 },
                { id: 'deck-power1', type: 'power', cardId: 'power1', quantity: 1 },
                { id: 'deck-mission1', type: 'mission', cardId: 'mission1', quantity: 7 } // 7 missions to satisfy mission rule
            ];

            const errors = await validationService.validateDeck(deckCards);

            // Should not have one-per-deck violations
            const onePerDeckErrors = errors.filter(error => error.rule === 'one_per_deck_violation');
            expect(onePerDeckErrors).toHaveLength(0);
        });

        it('should fail validation when one-per-deck cards are duplicated', async () => {
            // Mock card data with one-per-deck cards
            const mockCharacter: Character = {
                id: 'char1',
                name: 'Character 1',
                energy: 5,
                combat: 5,
                brute_force: 5,
                intelligence: 5,
                threat_level: 5,
                special_abilities: '',
                image: 'char1.jpg'
            };
            
            const mockSpecial: SpecialCard = {
                id: 'special1',
                name: 'One Per Deck Special',
                card_type: 'Special',
                character: 'Any Character',
                card_effect: 'Test effect',
                image: 'special1.jpg',
                is_cataclysm: false,
                is_assist: false,
        is_ambush: false,
                one_per_deck: true
            };
            
            const mockPower: PowerCard = {
                id: 'power1',
                name: 'One Per Deck Power',
                power_type: 'Energy',
                value: 3,
                image: 'power1.jpg',
                one_per_deck: true
            };
            
            const mockMission: Mission = {
                id: 'mission1',
                mission_set: 'Test Set',
                card_name: 'Mission 1',
                image: 'mission1.jpg'
            };

            // Mock repository responses
            mockCardRepository.getAllCharacters.mockResolvedValue([mockCharacter]);
            mockCardRepository.getAllSpecialCards.mockResolvedValue([mockSpecial]);
            mockCardRepository.getAllPowerCards.mockResolvedValue([mockPower]);
            mockCardRepository.getAllMissions.mockResolvedValue([mockMission]);
            mockCardRepository.getAllEvents.mockResolvedValue([]);
            mockCardRepository.getAllLocations.mockResolvedValue([]);
            mockCardRepository.getAllAspects.mockResolvedValue([]);
            mockCardRepository.getAllAdvancedUniverse.mockResolvedValue([]);
            mockCardRepository.getAllTeamwork.mockResolvedValue([]);
            mockCardRepository.getAllAllyUniverse.mockResolvedValue([]);
            mockCardRepository.getAllTraining.mockResolvedValue([]);
            mockCardRepository.getAllBasicUniverse.mockResolvedValue([]);

            // Deck with multiple copies of one-per-deck cards
            const deckCards: DeckCard[] = [
                { id: 'deck-char1', type: 'character', cardId: 'char1', quantity: 1 },
                { id: 'deck-special1', type: 'special', cardId: 'special1', quantity: 2 }, // Violation: 2 copies of one-per-deck special
                { id: 'deck-power1', type: 'power', cardId: 'power1', quantity: 3 }, // Violation: 3 copies of one-per-deck power
                { id: 'deck-mission1', type: 'mission', cardId: 'mission1', quantity: 7 } // 7 missions to satisfy mission rule
            ];

            const errors = await validationService.validateDeck(deckCards);

            // Should have one-per-deck violations
            const onePerDeckErrors = errors.filter(error => error.rule === 'one_per_deck_violation');
            expect(onePerDeckErrors).toHaveLength(2);
            
            // Check specific error messages
            expect(onePerDeckErrors[0].message).toContain('One Per Deck Special');
            expect(onePerDeckErrors[0].message).toContain('found 2');
            expect(onePerDeckErrors[1].message).toContain('One Per Deck Power');
            expect(onePerDeckErrors[1].message).toContain('found 3');
        });

        it('should handle cards with quantity > 1 correctly', async () => {
            // Mock card data
            const mockCharacter: Character = {
                id: 'char1',
                name: 'Character 1',
                energy: 5,
                combat: 5,
                brute_force: 5,
                intelligence: 5,
                threat_level: 5,
                special_abilities: '',
                image: 'char1.jpg'
            };
            
            const mockSpecial: SpecialCard = {
                id: 'special1',
                name: 'One Per Deck Special',
                card_type: 'Special',
                character: 'Any Character',
                card_effect: 'Test effect',
                image: 'special1.jpg',
                is_cataclysm: false,
                is_assist: false,
        is_ambush: false,
                one_per_deck: true
            };
            
            const mockMission: Mission = {
                id: 'mission1',
                mission_set: 'Test Set',
                card_name: 'Mission 1',
                image: 'mission1.jpg'
            };

            // Mock repository responses
            mockCardRepository.getAllCharacters.mockResolvedValue([mockCharacter]);
            mockCardRepository.getAllSpecialCards.mockResolvedValue([mockSpecial]);
            mockCardRepository.getAllPowerCards.mockResolvedValue([]);
            mockCardRepository.getAllMissions.mockResolvedValue([mockMission]);
            mockCardRepository.getAllEvents.mockResolvedValue([]);
            mockCardRepository.getAllLocations.mockResolvedValue([]);
            mockCardRepository.getAllAspects.mockResolvedValue([]);
            mockCardRepository.getAllAdvancedUniverse.mockResolvedValue([]);
            mockCardRepository.getAllTeamwork.mockResolvedValue([]);
            mockCardRepository.getAllAllyUniverse.mockResolvedValue([]);
            mockCardRepository.getAllTraining.mockResolvedValue([]);
            mockCardRepository.getAllBasicUniverse.mockResolvedValue([]);

            // Deck with one-per-deck card having quantity > 1
            const deckCards: DeckCard[] = [
                { id: 'deck-char1', type: 'character', cardId: 'char1', quantity: 1 },
                { id: 'deck-special1', type: 'special', cardId: 'special1', quantity: 2 }, // Violation: quantity 2 for one-per-deck card
                { id: 'deck-mission1', type: 'mission', cardId: 'mission1', quantity: 7 } // 7 missions to satisfy mission rule
            ];

            const errors = await validationService.validateDeck(deckCards);

            // Should have one-per-deck violation
            const onePerDeckErrors = errors.filter(error => error.rule === 'one_per_deck_violation');
            expect(onePerDeckErrors).toHaveLength(1);
            expect(onePerDeckErrors[0].message).toContain('One Per Deck Special');
            expect(onePerDeckErrors[0].message).toContain('found 2');
        });

        it('should handle cards without one_per_deck property', async () => {
            // Mock card data without one_per_deck property
            const mockCharacter: Character = {
                id: 'char1',
                name: 'Character 1',
                energy: 5,
                combat: 5,
                brute_force: 5,
                intelligence: 5,
                threat_level: 5,
                special_abilities: '',
                image: 'char1.jpg'
                // No one_per_deck property
            };
            
            const mockSpecial: SpecialCard = {
                id: 'special1',
                name: 'Special Card',
                card_type: 'Special',
                character: 'Any Character',
                card_effect: 'Test effect',
                image: 'special1.jpg',
                is_cataclysm: false,
                is_assist: false,
        is_ambush: false,
                one_per_deck: false // Explicitly false
            };
            
            const mockMission: Mission = {
                id: 'mission1',
                mission_set: 'Test Set',
                card_name: 'Mission 1',
                image: 'mission1.jpg'
                // No one_per_deck property
            };

            // Mock repository responses
            mockCardRepository.getAllCharacters.mockResolvedValue([mockCharacter]);
            mockCardRepository.getAllSpecialCards.mockResolvedValue([mockSpecial]);
            mockCardRepository.getAllPowerCards.mockResolvedValue([]);
            mockCardRepository.getAllMissions.mockResolvedValue([mockMission]);
            mockCardRepository.getAllEvents.mockResolvedValue([]);
            mockCardRepository.getAllLocations.mockResolvedValue([]);
            mockCardRepository.getAllAspects.mockResolvedValue([]);
            mockCardRepository.getAllAdvancedUniverse.mockResolvedValue([]);
            mockCardRepository.getAllTeamwork.mockResolvedValue([]);
            mockCardRepository.getAllAllyUniverse.mockResolvedValue([]);
            mockCardRepository.getAllTraining.mockResolvedValue([]);
            mockCardRepository.getAllBasicUniverse.mockResolvedValue([]);

            // Deck with multiple copies of cards without one_per_deck property
            const deckCards: DeckCard[] = [
                { id: 'deck-char1', type: 'character', cardId: 'char1', quantity: 1 },
                { id: 'deck-special1', type: 'special', cardId: 'special1', quantity: 3 }, // Should be allowed since one_per_deck is false
                { id: 'deck-mission1', type: 'mission', cardId: 'mission1', quantity: 7 } // 7 missions to satisfy mission rule
            ];

            const errors = await validationService.validateDeck(deckCards);

            // Should not have one-per-deck violations since cards don't have one_per_deck: true
            const onePerDeckErrors = errors.filter(error => error.rule === 'one_per_deck_violation');
            expect(onePerDeckErrors).toHaveLength(0);
        });

        it('should handle missing card data gracefully', async () => {
            // Mock repository responses with some missing cards
            mockCardRepository.getAllCharacters.mockResolvedValue([]);
            mockCardRepository.getAllSpecialCards.mockResolvedValue([]);
            mockCardRepository.getAllPowerCards.mockResolvedValue([]);
            mockCardRepository.getAllMissions.mockResolvedValue([]);
            mockCardRepository.getAllEvents.mockResolvedValue([]);
            mockCardRepository.getAllLocations.mockResolvedValue([]);
            mockCardRepository.getAllAspects.mockResolvedValue([]);
            mockCardRepository.getAllAdvancedUniverse.mockResolvedValue([]);
            mockCardRepository.getAllTeamwork.mockResolvedValue([]);
            mockCardRepository.getAllAllyUniverse.mockResolvedValue([]);
            mockCardRepository.getAllTraining.mockResolvedValue([]);
            mockCardRepository.getAllBasicUniverse.mockResolvedValue([]);

            // Deck with cards that don't exist in available cards
            const deckCards: DeckCard[] = [
                { id: 'deck-char1', type: 'character', cardId: 'nonexistent', quantity: 1 },
                { id: 'deck-special1', type: 'special', cardId: 'nonexistent', quantity: 2 }
            ];

            const errors = await validationService.validateDeck(deckCards);

            // Should not crash and should not have one-per-deck violations for missing cards
            const onePerDeckErrors = errors.filter(error => error.rule === 'one_per_deck_violation');
            expect(onePerDeckErrors).toHaveLength(0);
        });
    });
});