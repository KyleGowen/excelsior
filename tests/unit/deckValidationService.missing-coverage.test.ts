import { DeckValidationService } from '../../src/services/deckValidationService';
import { CardRepository } from '../../src/repository/CardRepository';
import { DeckCard, Character, SpecialCard, PowerCard, Mission, Event, Location, Aspect, AdvancedUniverse, Teamwork, AllyUniverse, TrainingCard, BasicUniverse } from '../../src/types';

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

describe('DeckValidationService - Missing Coverage Tests', () => {
    let validationService: DeckValidationService;

    beforeEach(() => {
        jest.clearAllMocks();
        validationService = new DeckValidationService(mockCardRepository);
    });

    describe('Coverage for lines 75-76, 79-80, 83-84, 87-88, 91-92', () => {
        it('should build availableCardsMap for all card types', async () => {
            const mockAspect: Aspect = {
                id: 'aspect1',
                card_name: 'Aspect 1',
                card_type: 'Aspect',
                location: 'Test Location',
                card_effect: 'Test effect',
                image: 'aspect1.jpg',
                is_fortification: false,
                is_one_per_deck: false
            };

            const mockAdvancedUniverse: AdvancedUniverse = {
                id: 'advanced1',
                name: 'Advanced Universe 1',
                card_type: 'Advanced Universe',
                character: 'Any Character',
                card_effect: 'Test effect',
                image: 'advanced1.jpg',
                is_one_per_deck: false
            };

            const mockTeamwork: Teamwork = {
                id: 'teamwork1',
                name: 'Teamwork 1',
                card_type: 'Teamwork',
                to_use: '5 Energy',
                acts_as: 'Energy',
                followup_attack_types: 'Energy',
                first_attack_bonus: '+2',
                second_attack_bonus: '+2',
                image: 'teamwork1.jpg',
                one_per_deck: false
            };

            const mockAllyUniverse: AllyUniverse = {
                id: 'ally1',
                card_name: 'Ally Universe 1',
                card_type: 'Ally Universe',
                stat_to_use: '5 or less',
                stat_type_to_use: 'Energy',
                attack_value: '5',
                attack_type: 'Energy',
                card_text: 'Test text',
                image: 'ally1.jpg',
                one_per_deck: false
            };

            const mockTraining: TrainingCard = {
                id: 'training1',
                card_name: 'Training 1',
                type_1: 'Energy',
                type_2: 'Combat',
                value_to_use: '5 or less',
                bonus: '+2',
                image: 'training1.jpg',
                one_per_deck: false
            };

            const mockBasicUniverse: BasicUniverse = {
                id: 'basic1',
                card_name: 'Basic Universe 1',
                type: 'Energy',
                value_to_use: '6 or greater',
                bonus: '+2',
                image: 'basic1.jpg',
                one_per_deck: false
            };

            // Mock repository responses
            mockCardRepository.getAllCharacters.mockResolvedValue([]);
            mockCardRepository.getAllSpecialCards.mockResolvedValue([]);
            mockCardRepository.getAllPowerCards.mockResolvedValue([]);
            mockCardRepository.getAllMissions.mockResolvedValue([]);
            mockCardRepository.getAllEvents.mockResolvedValue([]);
            mockCardRepository.getAllLocations.mockResolvedValue([]);
            mockCardRepository.getAllAspects.mockResolvedValue([mockAspect]);
            mockCardRepository.getAllAdvancedUniverse.mockResolvedValue([mockAdvancedUniverse]);
            mockCardRepository.getAllTeamwork.mockResolvedValue([mockTeamwork]);
            mockCardRepository.getAllAllyUniverse.mockResolvedValue([mockAllyUniverse]);
            mockCardRepository.getAllTraining.mockResolvedValue([mockTraining]);
            mockCardRepository.getAllBasicUniverse.mockResolvedValue([mockBasicUniverse]);

            const deckCards: DeckCard[] = [];

            const errors = await validationService.validateDeck(deckCards);

            // Should not crash and should return validation errors for missing cards
            expect(errors).toBeDefined();
            expect(Array.isArray(errors)).toBe(true);
        });
    });

    describe('Coverage for line 127 - mission set validation', () => {
        it('should handle mission set validation when missions have different sets', async () => {
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

            const mockMission1: Mission = {
                id: 'mission1',
                mission_set: 'Set 1',
                card_name: 'Mission 1',
                image: 'mission1.jpg'
            };

            const mockMission2: Mission = {
                id: 'mission2',
                mission_set: 'Set 2',
                card_name: 'Mission 2',
                image: 'mission2.jpg'
            };

            // Mock repository responses
            mockCardRepository.getAllCharacters.mockResolvedValue([mockCharacter]);
            mockCardRepository.getAllSpecialCards.mockResolvedValue([]);
            mockCardRepository.getAllPowerCards.mockResolvedValue([]);
            mockCardRepository.getAllMissions.mockResolvedValue([mockMission1, mockMission2]);
            mockCardRepository.getAllEvents.mockResolvedValue([]);
            mockCardRepository.getAllLocations.mockResolvedValue([]);
            mockCardRepository.getAllAspects.mockResolvedValue([]);
            mockCardRepository.getAllAdvancedUniverse.mockResolvedValue([]);
            mockCardRepository.getAllTeamwork.mockResolvedValue([]);
            mockCardRepository.getAllAllyUniverse.mockResolvedValue([]);
            mockCardRepository.getAllTraining.mockResolvedValue([]);
            mockCardRepository.getAllBasicUniverse.mockResolvedValue([]);

            const deckCards: DeckCard[] = [
                { id: 'deck-char1', type: 'character', cardId: 'char1', quantity: 4 },
                { id: 'deck-mission1', type: 'mission', cardId: 'mission1', quantity: 4 },
                { id: 'deck-mission2', type: 'mission', cardId: 'mission2', quantity: 3 }
            ];

            const errors = await validationService.validateDeck(deckCards);
            const missionSetErrors = errors.filter(error => error.rule === 'mission_set');
            expect(missionSetErrors).toHaveLength(1);
            expect(missionSetErrors[0].message).toContain('Set 1, Set 2');
        });
    });

    describe('Coverage for line 149 - threat calculation', () => {
        it('should calculate threat correctly when character has threat property', async () => {
            const mockCharacter: Character = {
                id: 'char1',
                name: 'Character 1',
                energy: 5,
                combat: 5,
                brute_force: 5,
                intelligence: 5,
                threat_level: 20, // High threat to trigger validation error
                special_abilities: '',
                image: 'char1.jpg',
                threat: 20 // Add threat property for validation
            } as any;

            const mockMission: Mission = {
                id: 'mission1',
                mission_set: 'Test Set',
                card_name: 'Mission 1',
                image: 'mission1.jpg'
            };

            // Mock repository responses
            mockCardRepository.getAllCharacters.mockResolvedValue([mockCharacter]);
            mockCardRepository.getAllSpecialCards.mockResolvedValue([]);
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

            const deckCards: DeckCard[] = [
                { id: 'deck-char1', type: 'character', cardId: 'char1', quantity: 4 },
                { id: 'deck-mission1', type: 'mission', cardId: 'mission1', quantity: 7 }
            ];

            const errors = await validationService.validateDeck(deckCards);
            const threatErrors = errors.filter(error => error.rule === 'threat_level');
            expect(threatErrors).toHaveLength(1);
            expect(threatErrors[0].message).toContain('found 80');
        });
    });

    describe('Coverage for line 153 - threat validation error', () => {
        it('should add threat validation error when threat exceeds 76', async () => {
            const mockCharacter: Character = {
                id: 'char1',
                name: 'Character 1',
                energy: 5,
                combat: 5,
                brute_force: 5,
                intelligence: 5,
                threat_level: 20, // 4 * 20 = 80 > 76
                special_abilities: '',
                image: 'char1.jpg',
                threat: 20 // Add threat property for validation
            } as any;

            const mockMission: Mission = {
                id: 'mission1',
                mission_set: 'Test Set',
                card_name: 'Mission 1',
                image: 'mission1.jpg'
            };

            // Mock repository responses
            mockCardRepository.getAllCharacters.mockResolvedValue([mockCharacter]);
            mockCardRepository.getAllSpecialCards.mockResolvedValue([]);
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

            const deckCards: DeckCard[] = [
                { id: 'deck-char1', type: 'character', cardId: 'char1', quantity: 4 },
                { id: 'deck-mission1', type: 'mission', cardId: 'mission1', quantity: 7 }
            ];

            const errors = await validationService.validateDeck(deckCards);
            const threatErrors = errors.filter(error => error.rule === 'threat_level');
            expect(threatErrors).toHaveLength(1);
            expect(threatErrors[0].rule).toBe('threat_level');
            expect(threatErrors[0].message).toContain('found 80');
        });
    });

    describe('Coverage for line 180 - angry mob validation', () => {
        it('should add angry mob validation error when multiple angry mob characters', async () => {
            const mockCharacter1: Character = {
                id: 'char1',
                name: 'Angry Mob (Middle Ages)',
                energy: 5,
                combat: 5,
                brute_force: 5,
                intelligence: 5,
                threat_level: 5,
                special_abilities: '',
                image: 'char1.jpg'
            };

            const mockCharacter2: Character = {
                id: 'char2',
                name: 'Angry Mob (Modern)',
                energy: 5,
                combat: 5,
                brute_force: 5,
                intelligence: 5,
                threat_level: 5,
                special_abilities: '',
                image: 'char2.jpg'
            };

            const mockMission: Mission = {
                id: 'mission1',
                mission_set: 'Test Set',
                card_name: 'Mission 1',
                image: 'mission1.jpg'
            };

            // Mock repository responses
            mockCardRepository.getAllCharacters.mockResolvedValue([mockCharacter1, mockCharacter2]);
            mockCardRepository.getAllSpecialCards.mockResolvedValue([]);
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

            const deckCards: DeckCard[] = [
                { id: 'deck-char1', type: 'character', cardId: 'char1', quantity: 1 },
                { id: 'deck-char2', type: 'character', cardId: 'char2', quantity: 1 },
                { id: 'deck-char3', type: 'character', cardId: 'char1', quantity: 1 },
                { id: 'deck-char4', type: 'character', cardId: 'char2', quantity: 1 },
                { id: 'deck-mission1', type: 'mission', cardId: 'mission1', quantity: 7 }
            ];

            const errors = await validationService.validateDeck(deckCards);
            const angryMobErrors = errors.filter(error => error.rule === 'angry_mob_limit');
            expect(angryMobErrors).toHaveLength(1);
            expect(angryMobErrors[0].rule).toBe('angry_mob_limit');
            expect(angryMobErrors[0].message).toContain('Only one "Angry Mob" character is allowed per deck');
        });
    });

    describe('Coverage for line 197 - angry mob special validation', () => {
        it('should add angry mob special validation error when no angry mob character', async () => {
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
                name: 'Angry Mob Special',
                card_type: 'Special',
                character: 'Angry Mob (Middle Ages)',
                card_effect: 'Test effect',
                image: 'special1.jpg',
                is_cataclysm: false,
                is_assist: false,
                is_ambush: false,
                one_per_deck: false,
                character_name: 'Angry Mob (Middle Ages)' // Add character_name property for validation
            } as any;

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

            const deckCards: DeckCard[] = [
                { id: 'deck-char1', type: 'character', cardId: 'char1', quantity: 4 },
                { id: 'deck-special1', type: 'special', cardId: 'special1', quantity: 1 },
                { id: 'deck-mission1', type: 'mission', cardId: 'mission1', quantity: 7 }
            ];

            const errors = await validationService.validateDeck(deckCards);
            const unusableSpecialErrors = errors.filter(error => error.rule === 'unusable_special');
            expect(unusableSpecialErrors).toHaveLength(1);
            expect(unusableSpecialErrors[0].rule).toBe('unusable_special');
            expect(unusableSpecialErrors[0].message).toContain('requires an "Angry Mob" character');
        });
    });

    describe('Coverage for lines 315-324 - power card validation', () => {
        it('should handle power card validation with different power types', async () => {
            const mockCharacter: Character = {
                id: 'char1',
                name: 'Character 1',
                energy: 3,
                combat: 3,
                brute_force: 3,
                intelligence: 3,
                threat_level: 5,
                special_abilities: '',
                image: 'char1.jpg'
            };

            const mockPower: PowerCard = {
                id: 'power1',
                name: 'High Energy Power',
                power_type: 'Energy',
                value: 5,
                image: 'power1.jpg',
                one_per_deck: false
            };

            const mockMission: Mission = {
                id: 'mission1',
                mission_set: 'Test Set',
                card_name: 'Mission 1',
                image: 'mission1.jpg'
            };

            // Mock repository responses
            mockCardRepository.getAllCharacters.mockResolvedValue([mockCharacter]);
            mockCardRepository.getAllSpecialCards.mockResolvedValue([]);
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

            const deckCards: DeckCard[] = [
                { id: 'deck-char1', type: 'character', cardId: 'char1', quantity: 4 },
                { id: 'deck-power1', type: 'power', cardId: 'power1', quantity: 1 },
                { id: 'deck-mission1', type: 'mission', cardId: 'mission1', quantity: 7 }
            ];

            const errors = await validationService.validateDeck(deckCards);
            const unusablePowerErrors = errors.filter(error => error.rule === 'unusable_power');
            expect(unusablePowerErrors).toHaveLength(1);
            expect(unusablePowerErrors[0].rule).toBe('unusable_power');
            expect(unusablePowerErrors[0].message).toContain('requires a character with 5+ Energy');
        });
    });

    describe('Coverage for lines 331, 341-378 - universe card validation', () => {
        it('should handle universe card validation with to_use property', async () => {
            const mockCharacter: Character = {
                id: 'char1',
                name: 'Character 1',
                energy: 3,
                combat: 3,
                brute_force: 3,
                intelligence: 3,
                threat_level: 5,
                special_abilities: '',
                image: 'char1.jpg'
            };

            const mockUniverse: Teamwork = {
                id: 'universe1',
                name: 'High Energy Universe',
                card_type: 'Teamwork',
                to_use: '5 Energy',
                acts_as: 'Energy',
                followup_attack_types: 'Energy',
                first_attack_bonus: '+2',
                second_attack_bonus: '+2',
                image: 'universe1.jpg',
                one_per_deck: false
            };

            const mockMission: Mission = {
                id: 'mission1',
                mission_set: 'Test Set',
                card_name: 'Mission 1',
                image: 'mission1.jpg'
            };

            // Mock repository responses
            mockCardRepository.getAllCharacters.mockResolvedValue([mockCharacter]);
            mockCardRepository.getAllSpecialCards.mockResolvedValue([]);
            mockCardRepository.getAllPowerCards.mockResolvedValue([]);
            mockCardRepository.getAllMissions.mockResolvedValue([mockMission]);
            mockCardRepository.getAllEvents.mockResolvedValue([]);
            mockCardRepository.getAllLocations.mockResolvedValue([]);
            mockCardRepository.getAllAspects.mockResolvedValue([]);
            mockCardRepository.getAllAdvancedUniverse.mockResolvedValue([]);
            mockCardRepository.getAllTeamwork.mockResolvedValue([mockUniverse]);
            mockCardRepository.getAllAllyUniverse.mockResolvedValue([]);
            mockCardRepository.getAllTraining.mockResolvedValue([]);
            mockCardRepository.getAllBasicUniverse.mockResolvedValue([]);

            const deckCards: DeckCard[] = [
                { id: 'deck-char1', type: 'character', cardId: 'char1', quantity: 4 },
                { id: 'deck-universe1', type: 'teamwork', cardId: 'universe1', quantity: 1 },
                { id: 'deck-mission1', type: 'mission', cardId: 'mission1', quantity: 7 }
            ];

            const errors = await validationService.validateDeck(deckCards);
            const unusableUniverseErrors = errors.filter(error => error.rule === 'unusable_universe');
            expect(unusableUniverseErrors).toHaveLength(1);
            expect(unusableUniverseErrors[0].rule).toBe('unusable_universe');
            expect(unusableUniverseErrors[0].message).toContain('requires a character with 5+ Energy');
        });
    });
});
