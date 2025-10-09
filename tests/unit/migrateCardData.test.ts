import * as fs from 'fs';
import * as path from 'path';
import { Pool } from 'pg';
import { CardDataMigrator } from '../../src/scripts/migrateCardData';

// Mock fs module
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

// Mock pg module
jest.mock('pg');
const mockPool = Pool as jest.MockedClass<typeof Pool>;

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

describe('CardDataMigrator', () => {
  let migrator: CardDataMigrator;
  let mockPoolInstance: jest.Mocked<Pool>;
  let mockConsoleLog: jest.SpyInstance;
  let mockConsoleError: jest.SpyInstance;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock console methods
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
    
    // Mock Pool instance
    mockPoolInstance = {
      query: jest.fn().mockResolvedValue({}),
      end: jest.fn()
    } as any;
    
    mockPool.mockImplementation(() => mockPoolInstance);
    
    // Create instance
    migrator = new CardDataMigrator();
    
    // Reset environment variables
    delete process.env.DB_HOST;
    delete process.env.DB_PORT;
    delete process.env.DB_NAME;
    delete process.env.DB_USER;
    delete process.env.DB_PASSWORD;
  });

  afterEach(() => {
    // Restore console methods
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
  });

  describe('constructor', () => {
    it('should initialize with default configuration', () => {
      const mig = new CardDataMigrator();
      expect(mig).toBeInstanceOf(CardDataMigrator);
      expect(mockPool).toHaveBeenCalledWith({
        host: 'localhost',
        port: 1337,
        database: 'overpower',
        user: 'postgres',
        password: 'password'
      });
    });

    it('should use environment variables when available', () => {
      process.env.DB_HOST = 'testhost';
      process.env.DB_PORT = '5432';
      process.env.DB_NAME = 'testdb';
      process.env.DB_USER = 'testuser';
      process.env.DB_PASSWORD = 'testpass';
      
      new CardDataMigrator();
      
      expect(mockPool).toHaveBeenCalledWith({
        host: 'testhost',
        port: 5432,
        database: 'testdb',
        user: 'testuser',
        password: 'testpass'
      });
    });
  });

  describe('migrateAllData', () => {
    it('should call all migration methods and end pool connection', async () => {
      // Mock all private methods
      const mockMigrateCharacters = jest.spyOn(migrator as any, 'migrateCharacters').mockResolvedValue(undefined);
      const mockMigrateSpecialCards = jest.spyOn(migrator as any, 'migrateSpecialCards').mockResolvedValue(undefined);
      const mockMigratePowerCards = jest.spyOn(migrator as any, 'migratePowerCards').mockResolvedValue(undefined);
      const mockMigrateMissions = jest.spyOn(migrator as any, 'migrateMissions').mockResolvedValue(undefined);
      const mockMigrateEvents = jest.spyOn(migrator as any, 'migrateEvents').mockResolvedValue(undefined);
      const mockMigrateAspects = jest.spyOn(migrator as any, 'migrateAspects').mockResolvedValue(undefined);
      const mockMigrateAdvancedUniverse = jest.spyOn(migrator as any, 'migrateAdvancedUniverse').mockResolvedValue(undefined);
      const mockMigrateTeamwork = jest.spyOn(migrator as any, 'migrateTeamwork').mockResolvedValue(undefined);
      const mockMigrateAllyUniverse = jest.spyOn(migrator as any, 'migrateAllyUniverse').mockResolvedValue(undefined);
      const mockMigrateTraining = jest.spyOn(migrator as any, 'migrateTraining').mockResolvedValue(undefined);
      const mockMigrateBasicUniverse = jest.spyOn(migrator as any, 'migrateBasicUniverse').mockResolvedValue(undefined);

      await migrator.migrateAllData();

      expect(mockConsoleLog).toHaveBeenCalledWith('🔄 Starting card data migration...');
      expect(mockMigrateCharacters).toHaveBeenCalled();
      expect(mockMigrateSpecialCards).toHaveBeenCalled();
      expect(mockMigratePowerCards).toHaveBeenCalled();
      expect(mockMigrateMissions).toHaveBeenCalled();
      expect(mockMigrateEvents).toHaveBeenCalled();
      expect(mockMigrateAspects).toHaveBeenCalled();
      expect(mockMigrateAdvancedUniverse).toHaveBeenCalled();
      expect(mockMigrateTeamwork).toHaveBeenCalled();
      expect(mockMigrateAllyUniverse).toHaveBeenCalled();
      expect(mockMigrateTraining).toHaveBeenCalled();
      expect(mockMigrateBasicUniverse).toHaveBeenCalled();
      expect(mockConsoleLog).toHaveBeenCalledWith('✅ All card data migration completed successfully!');
      expect(mockPoolInstance.end).toHaveBeenCalled();
    });

    it('should handle errors and still end pool connection', async () => {
      const error = new Error('Migration failed');
      jest.spyOn(migrator as any, 'migrateCharacters').mockRejectedValue(error);

      await expect(migrator.migrateAllData()).rejects.toThrow('Migration failed');
      
      expect(mockConsoleError).toHaveBeenCalledWith('❌ Migration failed:', error);
      expect(mockPoolInstance.end).toHaveBeenCalled();
    });
  });

  describe('migrateCharacters', () => {
    it('should skip when characters file does not exist', async () => {
      const charactersPath = path.join(process.cwd(), 'src/resources/cards/descriptions/overpower-erb-characters.md');
      mockFs.existsSync.mockReturnValue(false);

      await (migrator as any).migrateCharacters();

      expect(mockConsoleLog).toHaveBeenCalledWith('📊 Migrating characters...');
      expect(mockConsoleLog).toHaveBeenCalledWith('⚠️  Characters file not found, skipping...');
      expect(mockFs.existsSync).toHaveBeenCalledWith(charactersPath);
    });

    it('should process characters file and insert data', async () => {
      const charactersPath = path.join(process.cwd(), 'src/resources/cards/descriptions/overpower-erb-characters.md');
      const mockContent = `| Character Name | Universe | Energy | Combat | Brute Force | Intelligence |
| --- | --- | --- | --- | --- | --- |
| Superman | DC | 10 | 8 | 9 | 7 |
| Batman | DC | 6 | 9 | 7 | 10 |`;

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(mockContent);
      // mockPoolInstance.query is already mocked to return {}

      // Mock getAlternateImages
      jest.spyOn(migrator as any, 'getAlternateImages').mockReturnValue(['alt1.webp', 'alt2.webp']);
      // Mock insertCharacter
      const mockInsertCharacter = jest.spyOn(migrator as any, 'insertCharacter').mockResolvedValue(undefined);

      await (migrator as any).migrateCharacters();

      expect(mockFs.existsSync).toHaveBeenCalledWith(charactersPath);
      expect(mockFs.readFileSync).toHaveBeenCalledWith(charactersPath, 'utf-8');
      expect(mockInsertCharacter).toHaveBeenCalledTimes(2);
      
      // Verify character data
      const firstCall = mockInsertCharacter.mock.calls[0][0] as any;
      expect(firstCall.id).toBe('character_superman');
      expect(firstCall.name).toBe('Superman');
      expect(firstCall.universe).toBe('DC');
      expect(firstCall.energy).toBe(10);
      expect(firstCall.combat).toBe(8);
      expect(firstCall.bruteForce).toBe(9);
      expect(firstCall.intelligence).toBe(7);
    });

    it('should handle empty characters file', async () => {
      const charactersPath = path.join(process.cwd(), 'src/resources/cards/descriptions/overpower-erb-characters.md');
      const mockContent = `| Character Name | Universe | Energy | Combat | Brute Force | Intelligence |
| --- | --- | --- | --- | --- | --- |`;

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(mockContent);
      const mockInsertCharacter = jest.spyOn(migrator as any, 'insertCharacter').mockResolvedValue(undefined);

      await (migrator as any).migrateCharacters();

      expect(mockInsertCharacter).not.toHaveBeenCalled();
    });
  });

  describe('migrateSpecialCards', () => {
    it('should skip when specials file does not exist', async () => {
      const specialsPath = path.join(process.cwd(), 'src/resources/cards/descriptions/overpower-erb-specials.md');
      mockFs.existsSync.mockReturnValue(false);

      await (migrator as any).migrateSpecialCards();

      expect(mockConsoleLog).toHaveBeenCalledWith('📊 Migrating special cards...');
      expect(mockConsoleLog).toHaveBeenCalledWith('⚠️  Specials file not found, skipping...');
      expect(mockFs.existsSync).toHaveBeenCalledWith(specialsPath);
    });

    it('should process specials file and insert data', async () => {
      const specialsPath = path.join(process.cwd(), 'src/resources/cards/descriptions/overpower-erb-specials.md');
      const mockContent = `| Character Name | Card Name | Universe | Card Effect | One Per Deck | Cataclysm | Ambush | Assist |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Superman | Heat Vision | DC | Deal 5 damage | true | false | false | false |
| Batman | Batarang | DC | Stun opponent | false | false | true | false |`;

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(mockContent);
      // mockPoolInstance.query is already mocked to return {}

      // Mock getAlternateImages
      jest.spyOn(migrator as any, 'getAlternateImages').mockReturnValue(['alt1.webp']);
      // Mock insertSpecialCard
      const mockInsertSpecialCard = jest.spyOn(migrator as any, 'insertSpecialCard').mockResolvedValue(undefined);

      await (migrator as any).migrateSpecialCards();

      expect(mockFs.existsSync).toHaveBeenCalledWith(specialsPath);
      expect(mockFs.readFileSync).toHaveBeenCalledWith(specialsPath, 'utf-8');
      expect(mockInsertSpecialCard).toHaveBeenCalledTimes(2);
      
      // Verify special card data
      const firstCall = mockInsertSpecialCard.mock.calls[0][0] as any;
      expect(firstCall.id).toBe('special_heat_vision');
      expect(firstCall.name).toBe('Heat Vision');
      expect(firstCall.characterName).toBe('Superman');
      expect(firstCall.universe).toBe('DC');
      expect(firstCall.description).toBe('Deal 5 damage');
      expect(firstCall.onePerDeck).toBe(true);
      expect(firstCall.cataclysm).toBe(false);
      expect(firstCall.ambush).toBe(false);
      expect(firstCall.assist).toBe(false);
    });

    it('should handle empty specials file', async () => {
      const specialsPath = path.join(process.cwd(), 'src/resources/cards/descriptions/overpower-erb-specials.md');
      const mockContent = `| Character Name | Card Name | Universe | Card Effect | One Per Deck | Cataclysm | Ambush | Assist |
| --- | --- | --- | --- | --- | --- | --- | --- |`;

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(mockContent);
      const mockInsertSpecialCard = jest.spyOn(migrator as any, 'insertSpecialCard').mockResolvedValue(undefined);

      await (migrator as any).migrateSpecialCards();

      expect(mockInsertSpecialCard).not.toHaveBeenCalled();
    });
  });

  describe('migratePowerCards', () => {
    it('should skip when power cards file does not exist', async () => {
      const powerCardsPath = path.join(process.cwd(), 'src/resources/cards/descriptions/overpower-erb-powercards.md');
      mockFs.existsSync.mockReturnValue(false);

      await (migrator as any).migratePowerCards();

      expect(mockConsoleLog).toHaveBeenCalledWith('📊 Migrating power cards...');
      expect(mockConsoleLog).toHaveBeenCalledWith('⚠️  Power cards file not found, skipping...');
      expect(mockFs.existsSync).toHaveBeenCalledWith(powerCardsPath);
    });

    it('should process power cards file and insert data', async () => {
      const powerCardsPath = path.join(process.cwd(), 'src/resources/cards/descriptions/overpower-erb-powercards.md');
      const mockContent = `## Energy
| Power Type | Value | One Per Deck |
| --- | --- | --- |
| Energy | 5 | true |
| Energy | 10 | false |

## Combat
| Power Type | Value | One Per Deck |
| --- | --- | --- |
| Combat | 3 | true |`;

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(mockContent);
      // mockPoolInstance.query is already mocked to return {}

      // Mock getAlternateImages
      jest.spyOn(migrator as any, 'getAlternateImages').mockReturnValue(['alt1.webp']);
      // Mock insertPowerCard
      const mockInsertPowerCard = jest.spyOn(migrator as any, 'insertPowerCard').mockResolvedValue(undefined);

      await (migrator as any).migratePowerCards();

      expect(mockFs.existsSync).toHaveBeenCalledWith(powerCardsPath);
      expect(mockFs.readFileSync).toHaveBeenCalledWith(powerCardsPath, 'utf-8');
      expect(mockInsertPowerCard).toHaveBeenCalledTimes(3);
      
      // Verify power card data
      const firstCall = mockInsertPowerCard.mock.calls[0][0] as any;
      expect(firstCall.id).toBe('power_energy_5');
      expect(firstCall.name).toBe('5 - Energy');
      expect(firstCall.universe).toBe('OverPower');
      expect(firstCall.powerType).toBe('Energy');
      expect(firstCall.value).toBe(5);
      expect(firstCall.onePerDeck).toBe(true);
    });

    it('should handle empty power cards file', async () => {
      const powerCardsPath = path.join(process.cwd(), 'src/resources/cards/descriptions/overpower-erb-powercards.md');
      const mockContent = `## Energy
| Power Type | Value | One Per Deck |
| --- | --- | --- |`;

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(mockContent);
      const mockInsertPowerCard = jest.spyOn(migrator as any, 'insertPowerCard').mockResolvedValue(undefined);

      await (migrator as any).migratePowerCards();

      expect(mockInsertPowerCard).not.toHaveBeenCalled();
    });
  });

  describe('migrateMissions', () => {
    it('should log migration message', async () => {
      await (migrator as any).migrateMissions();

      expect(mockConsoleLog).toHaveBeenCalledWith('📊 Migrating missions...');
    });
  });

  describe('migrateEvents', () => {
    it('should log migration message', async () => {
      await (migrator as any).migrateEvents();

      expect(mockConsoleLog).toHaveBeenCalledWith('📊 Migrating events...');
    });
  });

  describe('migrateAspects', () => {
    it('should log migration message', async () => {
      await (migrator as any).migrateAspects();

      expect(mockConsoleLog).toHaveBeenCalledWith('📊 Migrating aspects...');
    });
  });

  describe('migrateAdvancedUniverse', () => {
    it('should log migration message', async () => {
      await (migrator as any).migrateAdvancedUniverse();

      expect(mockConsoleLog).toHaveBeenCalledWith('📊 Migrating advanced universe...');
    });
  });

  describe('migrateTeamwork', () => {
    it('should log migration message', async () => {
      await (migrator as any).migrateTeamwork();

      expect(mockConsoleLog).toHaveBeenCalledWith('📊 Migrating teamwork...');
    });
  });

  describe('migrateAllyUniverse', () => {
    it('should log migration message', async () => {
      await (migrator as any).migrateAllyUniverse();

      expect(mockConsoleLog).toHaveBeenCalledWith('📊 Migrating ally universe...');
    });
  });

  describe('migrateTraining', () => {
    it('should log migration message', async () => {
      await (migrator as any).migrateTraining();

      expect(mockConsoleLog).toHaveBeenCalledWith('📊 Migrating training...');
    });
  });

  describe('migrateBasicUniverse', () => {
    it('should log migration message', async () => {
      await (migrator as any).migrateBasicUniverse();

      expect(mockConsoleLog).toHaveBeenCalledWith('📊 Migrating basic universe...');
    });
  });

  describe('getAlternateImages', () => {
    it('should return empty array when alternate directory does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = (migrator as any).getAlternateImages('characters', 'Superman');

      expect(result).toEqual([]);
      expect(mockFs.existsSync).toHaveBeenCalledWith(
        path.join(process.cwd(), 'src/resources/cards/images', 'characters', 'alternate')
      );
    });

    it('should return filtered alternate images when directory exists', () => {
      const alternateDir = path.join(process.cwd(), 'src/resources/cards/images', 'characters', 'alternate');
      const mockFiles = ['superman_alt1.webp', 'superman_alt2.webp', 'batman_alt1.webp'];

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue(mockFiles as any);

      const result = (migrator as any).getAlternateImages('characters', 'Superman');

      expect(result).toEqual(['characters/alternate/superman_alt1.webp', 'characters/alternate/superman_alt2.webp']);
      expect(mockFs.existsSync).toHaveBeenCalledWith(alternateDir);
      expect(mockFs.readdirSync).toHaveBeenCalledWith(alternateDir);
    });

    it('should return empty array when no matching files found', () => {
      const alternateDir = path.join(process.cwd(), 'src/resources/cards/images', 'characters', 'alternate');
      const mockFiles = ['batman_alt1.webp', 'wonder_woman_alt1.webp'];

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue(mockFiles as any);

      const result = (migrator as any).getAlternateImages('characters', 'Superman');

      expect(result).toEqual([]);
    });
  });

  describe('insertCharacter', () => {
    it('should insert character with correct query and parameters', async () => {
      const character = {
        id: 'character_superman',
        name: 'Superman',
        universe: 'DC',
        description: '',
        energy: 10,
        combat: 8,
        bruteForce: 9,
        intelligence: 7,
        imagePath: 'characters/superman.webp',
        alternateImages: ['alt1.webp', 'alt2.webp']
      };

      // mockPoolInstance.query is already mocked to return {}

      await (migrator as any).insertCharacter(character);

      expect(mockPoolInstance.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO characters'),
        [
          'character_superman',
          'Superman',
          'DC',
          10,
          8,
          9,
          7,
          'characters/superman.webp',
          ['alt1.webp', 'alt2.webp']
        ]
      );
    });

    it('should handle character with no alternate images', async () => {
      const character = {
        id: 'character_superman',
        name: 'Superman',
        universe: 'DC',
        description: '',
        energy: 10,
        combat: 8,
        bruteForce: 9,
        intelligence: 7,
        imagePath: 'characters/superman.webp',
        alternateImages: []
      };

      // mockPoolInstance.query is already mocked to return {}

      await (migrator as any).insertCharacter(character);

      expect(mockPoolInstance.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO characters'),
        [
          'character_superman',
          'Superman',
          'DC',
          10,
          8,
          9,
          7,
          'characters/superman.webp',
          []
        ]
      );
    });
  });

  describe('insertSpecialCard', () => {
    it('should insert special card with correct query and parameters', async () => {
      const special = {
        id: 'special_heat_vision',
        name: 'Heat Vision',
        characterName: 'Superman',
        universe: 'DC',
        description: 'Deal 5 damage',
        onePerDeck: true,
        cataclysm: false,
        ambush: false,
        assist: false,
        imagePath: 'specials/heat_vision.webp',
        alternateImages: ['alt1.webp']
      };

      // mockPoolInstance.query is already mocked to return {}

      await (migrator as any).insertSpecialCard(special);

      expect(mockPoolInstance.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO special_cards'),
        [
          'special_heat_vision',
          'Heat Vision',
          'Superman',
          'DC',
          'Deal 5 damage',
          'specials/heat_vision.webp',
          ['alt1.webp'],
          true,
          false,
          false,
          false
        ]
      );
    });

    it('should handle special card with default values', async () => {
      const special = {
        id: 'special_heat_vision',
        name: 'Heat Vision',
        characterName: 'Superman',
        universe: 'DC',
        description: 'Deal 5 damage',
        imagePath: 'specials/heat_vision.webp',
        alternateImages: []
      };

      // mockPoolInstance.query is already mocked to return {}

      await (migrator as any).insertSpecialCard(special);

      expect(mockPoolInstance.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO special_cards'),
        [
          'special_heat_vision',
          'Heat Vision',
          'Superman',
          'DC',
          'Deal 5 damage',
          'specials/heat_vision.webp',
          [],
          false,
          false,
          false,
          false
        ]
      );
    });
  });

  describe('insertPowerCard', () => {
    it('should insert power card with correct query and parameters', async () => {
      const powerCard = {
        id: 'power_energy_5',
        name: '5 - Energy',
        universe: 'OverPower',
        description: '5 - Energy Power Card',
        powerType: 'Energy',
        value: 5,
        onePerDeck: true,
        imagePath: 'power-cards/5_energy.webp',
        alternateImages: ['alt1.webp']
      };

      // mockPoolInstance.query is already mocked to return {}

      await (migrator as any).insertPowerCard(powerCard);

      expect(mockPoolInstance.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO power_cards'),
        [
          'power_energy_5',
          '5 - Energy',
          'Energy',
          5,
          'power-cards/5_energy.webp',
          ['alt1.webp'],
          true
        ]
      );
    });

    it('should handle power card with default values', async () => {
      const powerCard = {
        id: 'power_energy_5',
        name: '5 - Energy',
        universe: 'OverPower',
        description: '5 - Energy Power Card',
        powerType: 'Energy',
        value: 5,
        imagePath: 'power-cards/5_energy.webp',
        alternateImages: []
      };

      // mockPoolInstance.query is already mocked to return {}

      await (migrator as any).insertPowerCard(powerCard);

      expect(mockPoolInstance.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO power_cards'),
        [
          'power_energy_5',
          '5 - Energy',
          'Energy',
          5,
          'power-cards/5_energy.webp',
          [],
          false
        ]
      );
    });
  });
});

// Test CLI interface
describe('CardDataMigrator CLI', () => {
  let mockConsoleLog: jest.SpyInstance;
  let mockConsoleError: jest.SpyInstance;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock console methods
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    // Restore console methods
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
  });

  it('should call migrateAllData when run as main module', async () => {
    // Test the main function logic directly
    const migrator = new CardDataMigrator();
    await migrator.migrateAllData();

    expect(mockConsoleLog).toHaveBeenCalledWith('🔄 Starting card data migration...');
  });

  it('should handle errors in main function', async () => {
    const error = new Error('Migration failed');
    const testMigrator = new CardDataMigrator();
    jest.spyOn(testMigrator as any, 'migrateCharacters').mockRejectedValue(error);

    await expect(testMigrator.migrateAllData()).rejects.toThrow('Migration failed');
    
    expect(mockConsoleError).toHaveBeenCalledWith('❌ Migration failed:', error);
  });
});
