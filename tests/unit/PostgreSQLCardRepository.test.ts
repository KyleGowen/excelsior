/**
 * Unit tests for PostgreSQLCardRepository
 * Tests the actual repository code with mocked database connections
 */

import { Pool, PoolClient } from 'pg';
import { PostgreSQLCardRepository } from '../../src/database/PostgreSQLCardRepository';
import { 
  Character, 
  SpecialCard, 
  PowerCard, 
  Location, 
  Mission, 
  Event, 
  Aspect, 
  AdvancedUniverse, 
  Teamwork, 
  AllyUniverse, 
  TrainingCard, 
  BasicUniverse 
} from '../../src/types';

// Mock the pg module
jest.mock('pg', () => ({
  Pool: jest.fn(),
  PoolClient: jest.fn()
}));

describe('PostgreSQLCardRepository', () => {
  let repository: PostgreSQLCardRepository;
  let mockPool: jest.Mocked<Pool>;
  let mockClient: jest.Mocked<PoolClient>;

  beforeEach(() => {
    // Create mock client
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
      connect: jest.fn(),
      end: jest.fn(),
      on: jest.fn(),
      once: jest.fn(),
      removeListener: jest.fn(),
      removeAllListeners: jest.fn(),
      setMaxListeners: jest.fn(),
      getMaxListeners: jest.fn(),
      listeners: jest.fn(),
      rawListeners: jest.fn(),
      emit: jest.fn(),
      listenerCount: jest.fn(),
      prependListener: jest.fn(),
      prependOnceListener: jest.fn(),
      eventNames: jest.fn()
    } as any;

    // Create mock pool
    mockPool = {
      connect: jest.fn().mockResolvedValue(mockClient),
      end: jest.fn(),
      totalCount: 0,
      idleCount: 0,
      waitingCount: 0
    } as any;

    repository = new PostgreSQLCardRepository(mockPool);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize successfully', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await repository.initialize();
      
      expect(consoleSpy).toHaveBeenCalledWith('✅ PostgreSQL CardRepository initialized');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Character methods', () => {
    describe('getCharacterById', () => {
      it('should return a character when found', async () => {
        const mockCharacter = {
          id: 'char-123',
          name: 'Test Character',
          energy: 5,
          combat: 4,
          brute_force: 3,
          intelligence: 2,
          image_path: 'characters/test.webp',
          threat_level: 2
        };

        mockClient.query.mockResolvedValueOnce({
          rows: [mockCharacter],
          rowCount: 1,
          command: 'SELECT',
          oid: 0,
          fields: []
        });

        const result = await repository.getCharacterById('char-123');

        expect(mockClient.query).toHaveBeenCalledWith(
          'SELECT * FROM characters WHERE id = $1',
          ['char-123']
        );
        expect(result).toEqual(mockCharacter);
      });

      it('should return undefined when character not found', async () => {
        mockClient.query.mockResolvedValueOnce({
          rows: [],
          rowCount: 0,
          command: 'SELECT',
          oid: 0,
          fields: []
        });

        const result = await repository.getCharacterById('nonexistent');

        expect(result).toBeUndefined();
      });
    });

    describe('getAllCharacters', () => {
      it('should return all characters', async () => {
        const mockCharacters = [
          {
            id: 'char-1',
            name: 'Character 1',
            energy: 5,
            combat: 4,
            brute_force: 3,
            intelligence: 2,
            image_path: 'characters/char1.webp',
            threat_level: 2
          },
          {
            id: 'char-2',
            name: 'Character 2',
            energy: 3,
            combat: 5,
            brute_force: 2,
            intelligence: 4,
            image_path: 'characters/char2.webp',
            threat_level: 1
          }
        ];

        mockClient.query.mockResolvedValueOnce({
          rows: mockCharacters,
          rowCount: 2,
          command: 'SELECT',
          oid: 0,
          fields: []
        });

        const result = await repository.getAllCharacters();

        expect(mockClient.query).toHaveBeenCalledWith('SELECT * FROM characters ORDER BY name ASC');
        expect(result).toEqual(mockCharacters);
      });
    });
  });

  describe('Special Card methods', () => {
    describe('getSpecialCardById', () => {
      it('should return a special card when found', async () => {
        const mockSpecialCard = {
          id: 'spec-123',
          name: 'Test Special',
          type: 'special',
          value_to_use: 'combat',
          bonus: 2,
          image_path: 'special/test.webp'
        };

        mockClient.query.mockResolvedValueOnce({
          rows: [mockSpecialCard],
          rowCount: 1,
          command: 'SELECT',
          oid: 0,
          fields: []
        });

        const result = await repository.getSpecialCardById('spec-123');

        expect(mockClient.query).toHaveBeenCalledWith(
          'SELECT * FROM special_cards WHERE id = $1',
          ['spec-123']
        );
        expect(result).toEqual(mockSpecialCard);
      });
    });

    describe('getAllSpecialCards', () => {
      it('should return all special cards', async () => {
        const mockSpecialCards = [
          {
            id: 'spec-1',
            name: 'Special 1',
            type: 'special',
            value_to_use: 'combat',
            bonus: 2,
            image_path: 'special/spec1.webp'
          }
        ];

        mockClient.query.mockResolvedValueOnce({
          rows: mockSpecialCards,
          rowCount: 1,
          command: 'SELECT',
          oid: 0,
          fields: []
        });

        const result = await repository.getAllSpecialCards();

        expect(mockClient.query).toHaveBeenCalledWith('SELECT * FROM special_cards ORDER BY name ASC');
        expect(result).toEqual(mockSpecialCards);
      });
    });
  });

  describe('Power Card methods', () => {
    describe('getPowerCardById', () => {
      it('should return a power card when found', async () => {
        const mockPowerCard = {
          id: 'power-123',
          name: 'Test Power',
          type: 'power',
          value_to_use: 'energy',
          bonus: 3,
          image_path: 'power/test.webp'
        };

        mockClient.query.mockResolvedValueOnce({
          rows: [mockPowerCard],
          rowCount: 1,
          command: 'SELECT',
          oid: 0,
          fields: []
        });

        const result = await repository.getPowerCardById('power-123');

        expect(mockClient.query).toHaveBeenCalledWith(
          'SELECT * FROM power_cards WHERE id = $1',
          ['power-123']
        );
        expect(result).toEqual(mockPowerCard);
      });
    });

    describe('getAllPowerCards', () => {
      it('should return all power cards', async () => {
        const mockPowerCards = [
          {
            id: 'power-1',
            name: 'Power 1',
            type: 'power',
            value_to_use: 'energy',
            bonus: 3,
            image_path: 'power/power1.webp'
          }
        ];

        mockClient.query.mockResolvedValueOnce({
          rows: mockPowerCards,
          rowCount: 1,
          command: 'SELECT',
          oid: 0,
          fields: []
        });

        const result = await repository.getAllPowerCards();

        expect(mockClient.query).toHaveBeenCalledWith('SELECT * FROM power_cards ORDER BY name ASC');
        expect(result).toEqual(mockPowerCards);
      });
    });
  });

  describe('Location methods', () => {
    describe('getLocationById', () => {
      it('should return a location when found', async () => {
        const mockLocation = {
          id: 'loc-123',
          name: 'Test Location',
          type: 'location',
          value_to_use: 'combat',
          bonus: 1,
          image_path: 'locations/test.webp',
          threat_level: 1
        };

        mockClient.query.mockResolvedValueOnce({
          rows: [mockLocation],
          rowCount: 1,
          command: 'SELECT',
          oid: 0,
          fields: []
        });

        const result = await repository.getLocationById('loc-123');

        expect(mockClient.query).toHaveBeenCalledWith(
          'SELECT * FROM locations WHERE id = $1',
          ['loc-123']
        );
        expect(result).toEqual(mockLocation);
      });
    });

    describe('getAllLocations', () => {
      it('should return all locations', async () => {
        const mockLocations = [
          {
            id: 'loc-1',
            name: 'Location 1',
            type: 'location',
            value_to_use: 'combat',
            bonus: 1,
            image_path: 'locations/loc1.webp',
            threat_level: 1
          }
        ];

        mockClient.query.mockResolvedValueOnce({
          rows: mockLocations,
          rowCount: 1,
          command: 'SELECT',
          oid: 0,
          fields: []
        });

        const result = await repository.getAllLocations();

        expect(mockClient.query).toHaveBeenCalledWith('SELECT * FROM locations ORDER BY name ASC');
        expect(result).toEqual(mockLocations);
      });
    });
  });

  describe('Mission methods', () => {
    describe('getMissionById', () => {
      it('should return a mission when found', async () => {
        const mockMission = {
          id: 'mission-123',
          name: 'Test Mission',
          type: 'mission',
          value_to_use: 'intelligence',
          bonus: 2,
          image_path: 'missions/test.webp'
        };

        mockClient.query.mockResolvedValueOnce({
          rows: [mockMission],
          rowCount: 1,
          command: 'SELECT',
          oid: 0,
          fields: []
        });

        const result = await repository.getMissionById('mission-123');

        expect(mockClient.query).toHaveBeenCalledWith(
          'SELECT * FROM missions WHERE id = $1',
          ['mission-123']
        );
        expect(result).toEqual(mockMission);
      });
    });

    describe('getAllMissions', () => {
      it('should return all missions', async () => {
        const mockMissions = [
          {
            id: 'mission-1',
            name: 'Mission 1',
            type: 'mission',
            value_to_use: 'intelligence',
            bonus: 2,
            image_path: 'missions/mission1.webp'
          }
        ];

        mockClient.query.mockResolvedValueOnce({
          rows: mockMissions,
          rowCount: 1,
          command: 'SELECT',
          oid: 0,
          fields: []
        });

        const result = await repository.getAllMissions();

        expect(mockClient.query).toHaveBeenCalledWith('SELECT * FROM missions ORDER BY name ASC');
        expect(result).toEqual(mockMissions);
      });
    });
  });

  describe('Event methods', () => {
    describe('getEventById', () => {
      it('should return an event when found', async () => {
        const mockEvent = {
          id: 'event-123',
          name: 'Test Event',
          type: 'event',
          value_to_use: 'brute_force',
          bonus: 1,
          image_path: 'events/test.webp'
        };

        mockClient.query.mockResolvedValueOnce({
          rows: [mockEvent],
          rowCount: 1,
          command: 'SELECT',
          oid: 0,
          fields: []
        });

        const result = await repository.getEventById('event-123');

        expect(mockClient.query).toHaveBeenCalledWith(
          'SELECT * FROM events WHERE id = $1',
          ['event-123']
        );
        expect(result).toEqual(mockEvent);
      });
    });

    describe('getAllEvents', () => {
      it('should return all events', async () => {
        const mockEvents = [
          {
            id: 'event-1',
            name: 'Event 1',
            type: 'event',
            value_to_use: 'brute_force',
            bonus: 1,
            image_path: 'events/event1.webp'
          }
        ];

        mockClient.query.mockResolvedValueOnce({
          rows: mockEvents,
          rowCount: 1,
          command: 'SELECT',
          oid: 0,
          fields: []
        });

        const result = await repository.getAllEvents();

        expect(mockClient.query).toHaveBeenCalledWith('SELECT * FROM events ORDER BY name ASC');
        expect(result).toEqual(mockEvents);
      });
    });
  });

  describe('Aspect methods', () => {
    describe('getAspectById', () => {
      it('should return an aspect when found', async () => {
        const mockAspect = {
          id: 'aspect-123',
          name: 'Test Aspect',
          type: 'aspect',
          value_to_use: 'energy',
          bonus: 2,
          image_path: 'aspects/test.webp'
        };

        mockClient.query.mockResolvedValueOnce({
          rows: [mockAspect],
          rowCount: 1,
          command: 'SELECT',
          oid: 0,
          fields: []
        });

        const result = await repository.getAspectById('aspect-123');

        expect(mockClient.query).toHaveBeenCalledWith(
          'SELECT * FROM aspects WHERE id = $1',
          ['aspect-123']
        );
        expect(result).toEqual(mockAspect);
      });
    });

    describe('getAllAspects', () => {
      it('should return all aspects', async () => {
        const mockAspects = [
          {
            id: 'aspect-1',
            name: 'Aspect 1',
            type: 'aspect',
            value_to_use: 'energy',
            bonus: 2,
            image_path: 'aspects/aspect1.webp'
          }
        ];

        mockClient.query.mockResolvedValueOnce({
          rows: mockAspects,
          rowCount: 1,
          command: 'SELECT',
          oid: 0,
          fields: []
        });

        const result = await repository.getAllAspects();

        expect(mockClient.query).toHaveBeenCalledWith('SELECT * FROM aspects ORDER BY name ASC');
        expect(result).toEqual(mockAspects);
      });
    });
  });

  describe('Advanced Universe methods', () => {
    describe('getAdvancedUniverseById', () => {
      it('should return an advanced universe card when found', async () => {
        const mockAdvancedUniverse = {
          id: 'adv-123',
          name: 'Test Advanced',
          type: 'advanced_universe',
          value_to_use: 'combat',
          bonus: 3,
          image_path: 'advanced-universe/test.webp'
        };

        mockClient.query.mockResolvedValueOnce({
          rows: [mockAdvancedUniverse],
          rowCount: 1,
          command: 'SELECT',
          oid: 0,
          fields: []
        });

        const result = await repository.getAdvancedUniverseById('adv-123');

        expect(mockClient.query).toHaveBeenCalledWith(
          'SELECT * FROM advanced_universe_cards WHERE id = $1',
          ['adv-123']
        );
        expect(result).toEqual(mockAdvancedUniverse);
      });
    });

    describe('getAllAdvancedUniverse', () => {
      it('should return all advanced universe cards', async () => {
        const mockAdvancedUniverse = [
          {
            id: 'adv-1',
            name: 'Advanced 1',
            type: 'advanced_universe',
            value_to_use: 'combat',
            bonus: 3,
            image_path: 'advanced-universe/adv1.webp'
          }
        ];

        mockClient.query.mockResolvedValueOnce({
          rows: mockAdvancedUniverse,
          rowCount: 1,
          command: 'SELECT',
          oid: 0,
          fields: []
        });

        const result = await repository.getAllAdvancedUniverse();

        expect(mockClient.query).toHaveBeenCalledWith('SELECT * FROM advanced_universe_cards ORDER BY name ASC');
        expect(result).toEqual(mockAdvancedUniverse);
      });
    });
  });

  describe('Teamwork methods', () => {
    describe('getTeamworkById', () => {
      it('should return a teamwork card when found', async () => {
        const mockTeamwork = {
          id: 'team-123',
          name: 'Test Teamwork',
          type: 'teamwork',
          value_to_use: 'intelligence',
          bonus: 2,
          image_path: 'teamwork/test.webp'
        };

        mockClient.query.mockResolvedValueOnce({
          rows: [mockTeamwork],
          rowCount: 1,
          command: 'SELECT',
          oid: 0,
          fields: []
        });

        const result = await repository.getTeamworkById('team-123');

        expect(mockClient.query).toHaveBeenCalledWith(
          'SELECT * FROM teamwork_cards WHERE id = $1',
          ['team-123']
        );
        expect(result).toEqual(mockTeamwork);
      });
    });

    describe('getAllTeamwork', () => {
      it('should return all teamwork cards', async () => {
        const mockTeamwork = [
          {
            id: 'team-1',
            name: 'Teamwork 1',
            type: 'teamwork',
            value_to_use: 'intelligence',
            bonus: 2,
            image_path: 'teamwork/team1.webp'
          }
        ];

        mockClient.query.mockResolvedValueOnce({
          rows: mockTeamwork,
          rowCount: 1,
          command: 'SELECT',
          oid: 0,
          fields: []
        });

        const result = await repository.getAllTeamwork();

        expect(mockClient.query).toHaveBeenCalledWith('SELECT * FROM teamwork_cards ORDER BY name ASC');
        expect(result).toEqual(mockTeamwork);
      });
    });
  });

  describe('Ally Universe methods', () => {
    describe('getAllyUniverseById', () => {
      it('should return an ally universe card when found', async () => {
        const mockAllyUniverse = {
          id: 'ally-123',
          name: 'Test Ally',
          type: 'ally_universe',
          value_to_use: 'brute_force',
          bonus: 2,
          image_path: 'ally-universe/test.webp',
          attack_type: 'combat',
          stat_type_to_use: 'brute_force'
        };

        mockClient.query.mockResolvedValueOnce({
          rows: [mockAllyUniverse],
          rowCount: 1,
          command: 'SELECT',
          oid: 0,
          fields: []
        });

        const result = await repository.getAllyUniverseById('ally-123');

        expect(mockClient.query).toHaveBeenCalledWith(
          'SELECT * FROM ally_universe_cards WHERE id = $1',
          ['ally-123']
        );
        expect(result).toEqual(mockAllyUniverse);
      });
    });

    describe('getAllAllyUniverse', () => {
      it('should return all ally universe cards', async () => {
        const mockAllyUniverse = [
          {
            id: 'ally-1',
            name: 'Ally 1',
            type: 'ally_universe',
            value_to_use: 'brute_force',
            bonus: 2,
            image_path: 'ally-universe/ally1.webp',
            attack_type: 'combat',
            stat_type_to_use: 'brute_force'
          }
        ];

        mockClient.query.mockResolvedValueOnce({
          rows: mockAllyUniverse,
          rowCount: 1,
          command: 'SELECT',
          oid: 0,
          fields: []
        });

        const result = await repository.getAllAllyUniverse();

        expect(mockClient.query).toHaveBeenCalledWith('SELECT * FROM ally_universe_cards ORDER BY name ASC');
        expect(result).toEqual(mockAllyUniverse);
      });
    });
  });

  describe('Training Card methods', () => {
    describe('getTrainingCardById', () => {
      it('should return a training card when found', async () => {
        const mockTrainingCard = {
          id: 'train-123',
          name: 'Test Training',
          type: 'training',
          value_to_use: 'energy',
          bonus: 1,
          image_path: 'training/test.webp'
        };

        mockClient.query.mockResolvedValueOnce({
          rows: [mockTrainingCard],
          rowCount: 1,
          command: 'SELECT',
          oid: 0,
          fields: []
        });

        const result = await repository.getTrainingCardById('train-123');

        expect(mockClient.query).toHaveBeenCalledWith(
          'SELECT * FROM training_cards WHERE id = $1',
          ['train-123']
        );
        expect(result).toEqual(mockTrainingCard);
      });
    });

    describe('getAllTrainingCards', () => {
      it('should return all training cards', async () => {
        const mockTrainingCards = [
          {
            id: 'train-1',
            name: 'Training 1',
            type: 'training',
            value_to_use: 'energy',
            bonus: 1,
            image_path: 'training/train1.webp'
          }
        ];

        mockClient.query.mockResolvedValueOnce({
          rows: mockTrainingCards,
          rowCount: 1,
          command: 'SELECT',
          oid: 0,
          fields: []
        });

        const result = await repository.getAllTrainingCards();

        expect(mockClient.query).toHaveBeenCalledWith('SELECT * FROM training_cards ORDER BY name ASC');
        expect(result).toEqual(mockTrainingCards);
      });
    });
  });

  describe('Basic Universe methods', () => {
    describe('getBasicUniverseById', () => {
      it('should return a basic universe card when found', async () => {
        const mockBasicUniverse = {
          id: 'basic-123',
          name: 'Test Basic',
          type: 'basic_universe',
          value_to_use: 'combat',
          bonus: 1,
          image_path: 'basic-universe/test.webp'
        };

        mockClient.query.mockResolvedValueOnce({
          rows: [mockBasicUniverse],
          rowCount: 1,
          command: 'SELECT',
          oid: 0,
          fields: []
        });

        const result = await repository.getBasicUniverseById('basic-123');

        expect(mockClient.query).toHaveBeenCalledWith(
          'SELECT * FROM basic_universe_cards WHERE id = $1',
          ['basic-123']
        );
        expect(result).toEqual(mockBasicUniverse);
      });
    });

    describe('getAllBasicUniverse', () => {
      it('should return all basic universe cards', async () => {
        const mockBasicUniverse = [
          {
            id: 'basic-1',
            name: 'Basic 1',
            type: 'basic_universe',
            value_to_use: 'combat',
            bonus: 1,
            image_path: 'basic-universe/basic1.webp'
          }
        ];

        mockClient.query.mockResolvedValueOnce({
          rows: mockBasicUniverse,
          rowCount: 1,
          command: 'SELECT',
          oid: 0,
          fields: []
        });

        const result = await repository.getAllBasicUniverse();

        expect(mockClient.query).toHaveBeenCalledWith('SELECT * FROM basic_universe_cards ORDER BY name ASC');
        expect(result).toEqual(mockBasicUniverse);
      });
    });
  });

  describe('Error handling', () => {
    it('should always release client connection even on error', async () => {
      const error = new Error('Database error');
      mockClient.query.mockRejectedValueOnce(error);

      await expect(repository.getCharacterById('char-123'))
        .rejects.toThrow('Database error');

      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });

    it('should handle pool connection errors', async () => {
      const error = new Error('Pool connection failed');
      mockPool.connect.mockRejectedValueOnce(error);

      await expect(repository.getCharacterById('char-123'))
        .rejects.toThrow('Pool connection failed');
    });
  });
});
