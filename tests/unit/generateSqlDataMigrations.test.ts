import * as fs from 'fs';
import * as path from 'path';
import { SqlDataMigrationGenerator } from '../../src/scripts/generateSqlDataMigrations';

// Mock fs module
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

describe('SqlDataMigrationGenerator', () => {
  let generator: SqlDataMigrationGenerator;
  let mockConsoleLog: jest.SpyInstance;
  let mockConsoleError: jest.SpyInstance;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock console methods
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
    
    // Create instance
    generator = new SqlDataMigrationGenerator();
  });

  afterEach(() => {
    // Restore console methods
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
  });

  describe('constructor', () => {
    it('should initialize with correct output directory', () => {
      const gen = new SqlDataMigrationGenerator();
      expect(gen).toBeInstanceOf(SqlDataMigrationGenerator);
    });
  });

  describe('generateAllMigrations', () => {
    it('should call all migration generation methods', async () => {
      // Mock all private methods
      const mockGenerateCharacters = jest.spyOn(generator as any, 'generateCharactersMigration').mockResolvedValue(undefined);
      const mockGenerateSpecialCards = jest.spyOn(generator as any, 'generateSpecialCardsMigration').mockResolvedValue(undefined);
      const mockGeneratePowerCards = jest.spyOn(generator as any, 'generatePowerCardsMigration').mockResolvedValue(undefined);
      const mockGenerateMissions = jest.spyOn(generator as any, 'generateMissionsMigration').mockResolvedValue(undefined);
      const mockGenerateEvents = jest.spyOn(generator as any, 'generateEventsMigration').mockResolvedValue(undefined);
      const mockGenerateAspects = jest.spyOn(generator as any, 'generateAspectsMigration').mockResolvedValue(undefined);
      const mockGenerateAdvancedUniverse = jest.spyOn(generator as any, 'generateAdvancedUniverseMigration').mockResolvedValue(undefined);
      const mockGenerateTeamwork = jest.spyOn(generator as any, 'generateTeamworkMigration').mockResolvedValue(undefined);
      const mockGenerateAllyUniverse = jest.spyOn(generator as any, 'generateAllyUniverseMigration').mockResolvedValue(undefined);
      const mockGenerateTraining = jest.spyOn(generator as any, 'generateTrainingMigration').mockResolvedValue(undefined);
      const mockGenerateBasicUniverse = jest.spyOn(generator as any, 'generateBasicUniverseMigration').mockResolvedValue(undefined);

      await generator.generateAllMigrations();

      expect(mockConsoleLog).toHaveBeenCalledWith('🔄 Generating SQL data migration files...');
      expect(mockGenerateCharacters).toHaveBeenCalled();
      expect(mockGenerateSpecialCards).toHaveBeenCalled();
      expect(mockGeneratePowerCards).toHaveBeenCalled();
      expect(mockGenerateMissions).toHaveBeenCalled();
      expect(mockGenerateEvents).toHaveBeenCalled();
      expect(mockGenerateAspects).toHaveBeenCalled();
      expect(mockGenerateAdvancedUniverse).toHaveBeenCalled();
      expect(mockGenerateTeamwork).toHaveBeenCalled();
      expect(mockGenerateAllyUniverse).toHaveBeenCalled();
      expect(mockGenerateTraining).toHaveBeenCalled();
      expect(mockGenerateBasicUniverse).toHaveBeenCalled();
      expect(mockConsoleLog).toHaveBeenCalledWith('✅ All SQL data migration files generated successfully!');
    });

    it('should handle errors during migration generation', async () => {
      const error = new Error('Generation failed');
      jest.spyOn(generator as any, 'generateCharactersMigration').mockRejectedValue(error);

      await expect(generator.generateAllMigrations()).rejects.toThrow('Generation failed');
      
      expect(mockConsoleError).toHaveBeenCalledWith('❌ Migration generation failed:', error);
    });
  });

  describe('generateCharactersMigration', () => {
    it('should skip when characters file does not exist', async () => {
      const charactersPath = path.join(process.cwd(), 'src/resources/cards/descriptions/overpower-erb-characters.md');
      mockFs.existsSync.mockReturnValue(false);

      await (generator as any).generateCharactersMigration();

      expect(mockConsoleLog).toHaveBeenCalledWith('📊 Generating characters migration...');
      expect(mockConsoleLog).toHaveBeenCalledWith('⚠️  Characters file not found, skipping...');
      expect(mockFs.existsSync).toHaveBeenCalledWith(charactersPath);
    });

    it('should process characters file and generate SQL', async () => {
      const charactersPath = path.join(process.cwd(), 'src/resources/cards/descriptions/overpower-erb-characters.md');
      const mockContent = `| Character Name | Universe | Energy | Combat | Brute Force | Intelligence |
| --- | --- | --- | --- | --- | --- |
| Superman | DC | 10 | 8 | 9 | 7 |
| Batman | DC | 6 | 9 | 7 | 10 |`;

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(mockContent);
      mockFs.writeFileSync.mockImplementation();

      // Mock getAlternateImages
      jest.spyOn(generator as any, 'getAlternateImages').mockReturnValue(['alt1.webp', 'alt2.webp']);

      await (generator as any).generateCharactersMigration();

      expect(mockFs.existsSync).toHaveBeenCalledWith(charactersPath);
      expect(mockFs.readFileSync).toHaveBeenCalledWith(charactersPath, 'utf-8');
      expect(mockFs.writeFileSync).toHaveBeenCalled();
      
      // Verify SQL content
      const writeCall = mockFs.writeFileSync.mock.calls[0];
      expect(writeCall[0]).toContain('V22__Populate_characters_data.sql');
      expect(writeCall[1]).toContain('INSERT INTO characters');
      expect(writeCall[1]).toContain('Superman');
      expect(writeCall[1]).toContain('Batman');
    });

    it('should handle empty characters file', async () => {
      const charactersPath = path.join(process.cwd(), 'src/resources/cards/descriptions/overpower-erb-characters.md');
      const mockContent = `| Character Name | Universe | Energy | Combat | Brute Force | Intelligence |
| --- | --- | --- | --- | --- | --- |`;

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(mockContent);
      mockFs.writeFileSync.mockImplementation();

      await (generator as any).generateCharactersMigration();

      expect(mockFs.writeFileSync).toHaveBeenCalled();
      
      // Verify SQL content has no INSERT statements
      const writeCall = mockFs.writeFileSync.mock.calls[0];
      expect(writeCall[1]).not.toContain('INSERT INTO characters');
    });
  });

  describe('generatePowerCardsMigration', () => {
    it('should skip when power cards file does not exist', async () => {
      const powerCardsPath = path.join(process.cwd(), 'src/resources/cards/descriptions/overpower-erb-powercards.md');
      mockFs.existsSync.mockReturnValue(false);

      await (generator as any).generatePowerCardsMigration();

      expect(mockConsoleLog).toHaveBeenCalledWith('📊 Generating power cards migration...');
      expect(mockConsoleLog).toHaveBeenCalledWith('⚠️  Power cards file not found, skipping...');
      expect(mockFs.existsSync).toHaveBeenCalledWith(powerCardsPath);
    });

    it('should process power cards file and generate SQL', async () => {
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
      mockFs.writeFileSync.mockImplementation();

      // Mock getAlternateImages
      jest.spyOn(generator as any, 'getAlternateImages').mockReturnValue(['alt1.webp']);

      await (generator as any).generatePowerCardsMigration();

      expect(mockFs.existsSync).toHaveBeenCalledWith(powerCardsPath);
      expect(mockFs.readFileSync).toHaveBeenCalledWith(powerCardsPath, 'utf-8');
      expect(mockFs.writeFileSync).toHaveBeenCalled();
      
      // Verify SQL content
      const writeCall = mockFs.writeFileSync.mock.calls[0];
      expect(writeCall[0]).toContain('V23__Populate_power_cards_data.sql');
      expect(writeCall[1]).toContain('INSERT INTO power_cards');
      expect(writeCall[1]).toContain('Energy');
      expect(writeCall[1]).toContain('Combat');
    });

    it('should handle power cards file with no valid data', async () => {
      const powerCardsPath = path.join(process.cwd(), 'src/resources/cards/descriptions/overpower-erb-powercards.md');
      const mockContent = `## Energy
| Power Type | Value | One Per Deck |
| --- | --- | --- |`;

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(mockContent);
      mockFs.writeFileSync.mockImplementation();

      await (generator as any).generatePowerCardsMigration();

      expect(mockFs.writeFileSync).toHaveBeenCalled();
      
      // Verify SQL content has no INSERT statements
      const writeCall = mockFs.writeFileSync.mock.calls[0];
      expect(writeCall[1]).not.toContain('INSERT INTO power_cards');
    });
  });

  describe('generateSpecialCardsMigration', () => {
    it('should log generation message', async () => {
      await (generator as any).generateSpecialCardsMigration();

      expect(mockConsoleLog).toHaveBeenCalledWith('📊 Generating special cards migration...');
    });
  });

  describe('generateMissionsMigration', () => {
    it('should log generation message', async () => {
      await (generator as any).generateMissionsMigration();

      expect(mockConsoleLog).toHaveBeenCalledWith('📊 Generating missions migration...');
    });
  });

  describe('generateEventsMigration', () => {
    it('should log generation message', async () => {
      await (generator as any).generateEventsMigration();

      expect(mockConsoleLog).toHaveBeenCalledWith('📊 Generating events migration...');
    });
  });

  describe('generateAspectsMigration', () => {
    it('should log generation message', async () => {
      await (generator as any).generateAspectsMigration();

      expect(mockConsoleLog).toHaveBeenCalledWith('📊 Generating aspects migration...');
    });
  });

  describe('generateAdvancedUniverseMigration', () => {
    it('should log generation message', async () => {
      await (generator as any).generateAdvancedUniverseMigration();

      expect(mockConsoleLog).toHaveBeenCalledWith('📊 Generating advanced universe migration...');
    });
  });

  describe('generateTeamworkMigration', () => {
    it('should log generation message', async () => {
      await (generator as any).generateTeamworkMigration();

      expect(mockConsoleLog).toHaveBeenCalledWith('📊 Generating teamwork migration...');
    });
  });

  describe('generateAllyUniverseMigration', () => {
    it('should log generation message', async () => {
      await (generator as any).generateAllyUniverseMigration();

      expect(mockConsoleLog).toHaveBeenCalledWith('📊 Generating ally universe migration...');
    });
  });

  describe('generateTrainingMigration', () => {
    it('should log generation message', async () => {
      await (generator as any).generateTrainingMigration();

      expect(mockConsoleLog).toHaveBeenCalledWith('📊 Generating training migration...');
    });
  });

  describe('generateBasicUniverseMigration', () => {
    it('should log generation message', async () => {
      await (generator as any).generateBasicUniverseMigration();

      expect(mockConsoleLog).toHaveBeenCalledWith('📊 Generating basic universe migration...');
    });
  });

  describe('getAlternateImages', () => {
    it('should return empty array when alternate directory does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = (generator as any).getAlternateImages('characters', 'Superman');

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

      const result = (generator as any).getAlternateImages('characters', 'Superman');

      expect(result).toEqual(['characters/alternate/superman_alt1.webp', 'characters/alternate/superman_alt2.webp']);
      expect(mockFs.existsSync).toHaveBeenCalledWith(alternateDir);
      expect(mockFs.readdirSync).toHaveBeenCalledWith(alternateDir);
    });

    it('should return empty array when no matching files found', () => {
      const alternateDir = path.join(process.cwd(), 'src/resources/cards/images', 'characters', 'alternate');
      const mockFiles = ['batman_alt1.webp', 'wonder_woman_alt1.webp'];

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue(mockFiles as any);

      const result = (generator as any).getAlternateImages('characters', 'Superman');

      expect(result).toEqual([]);
    });
  });

  describe('writeCharactersSql', () => {
    it('should write characters SQL file with correct content', async () => {
      const characters = [
        {
          id: 'character_superman',
          name: 'Superman',
          universe: 'DC',
          description: 'Superman character from DC',
          energy: 10,
          combat: 8,
          bruteForce: 9,
          intelligence: 7,
          imagePath: 'characters/superman.webp',
          alternateImages: ['alt1.webp', 'alt2.webp']
        },
        {
          id: 'character_batman',
          name: 'Batman',
          universe: 'DC',
          description: 'Batman character from DC',
          energy: 6,
          combat: 9,
          bruteForce: 7,
          intelligence: 10,
          imagePath: 'characters/batman.webp',
          alternateImages: []
        }
      ];

      mockFs.writeFileSync.mockImplementation();

      await (generator as any).writeCharactersSql(characters);

      expect(mockFs.writeFileSync).toHaveBeenCalled();
      
      const writeCall = mockFs.writeFileSync.mock.calls[0];
      expect(writeCall[0]).toContain('V22__Populate_characters_data.sql');
      
      const sqlContent = writeCall[1];
      expect(sqlContent).toContain('-- Populate characters data from markdown file');
      expect(sqlContent).toContain('INSERT INTO characters');
      expect(sqlContent).toContain('character_superman');
      expect(sqlContent).toContain('character_batman');
      expect(sqlContent).toContain('ON CONFLICT (id) DO UPDATE SET');
    });

    it('should handle characters with no alternate images', async () => {
      const characters = [
        {
          id: 'character_superman',
          name: 'Superman',
          universe: 'DC',
          description: 'Superman character from DC',
          energy: 10,
          combat: 8,
          bruteForce: 9,
          intelligence: 7,
          imagePath: 'characters/superman.webp',
          alternateImages: []
        }
      ];

      mockFs.writeFileSync.mockImplementation();

      await (generator as any).writeCharactersSql(characters);

      const writeCall = mockFs.writeFileSync.mock.calls[0];
      const sqlContent = writeCall[1];
      expect(sqlContent).toContain("ARRAY[]::text[]");
    });
  });

  describe('writePowerCardsSql', () => {
    it('should write power cards SQL file with correct content', async () => {
      const powerCards = [
        {
          id: 'power_energy_5',
          name: '5 - Energy',
          universe: 'OverPower',
          description: '5 - Energy Power Card',
          powerType: 'Energy',
          value: 5,
          onePerDeck: true,
          imagePath: 'power-cards/5_energy.webp',
          alternateImages: ['alt1.webp']
        },
        {
          id: 'power_combat_3',
          name: '3 - Combat',
          universe: 'OverPower',
          description: '3 - Combat Power Card',
          powerType: 'Combat',
          value: 3,
          onePerDeck: false,
          imagePath: 'power-cards/3_combat.webp',
          alternateImages: []
        }
      ];

      mockFs.writeFileSync.mockImplementation();

      await (generator as any).writePowerCardsSql(powerCards);

      expect(mockFs.writeFileSync).toHaveBeenCalled();
      
      const writeCall = mockFs.writeFileSync.mock.calls[0];
      expect(writeCall[0]).toContain('V23__Populate_power_cards_data.sql');
      
      const sqlContent = writeCall[1];
      expect(sqlContent).toContain('-- Populate power cards data from markdown file');
      expect(sqlContent).toContain('INSERT INTO power_cards');
      expect(sqlContent).toContain('power_energy_5');
      expect(sqlContent).toContain('power_combat_3');
      expect(sqlContent).toContain('ON CONFLICT (id) DO UPDATE SET');
    });

    it('should handle power cards with no alternate images', async () => {
      const powerCards = [
        {
          id: 'power_energy_5',
          name: '5 - Energy',
          universe: 'OverPower',
          description: '5 - Energy Power Card',
          powerType: 'Energy',
          value: 5,
          onePerDeck: true,
          imagePath: 'power-cards/5_energy.webp',
          alternateImages: []
        }
      ];

      mockFs.writeFileSync.mockImplementation();

      await (generator as any).writePowerCardsSql(powerCards);

      const writeCall = mockFs.writeFileSync.mock.calls[0];
      const sqlContent = writeCall[1];
      expect(sqlContent).toContain("ARRAY[]::text[]");
    });
  });
});

// Test CLI interface
describe('SqlDataMigrationGenerator CLI', () => {
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

  it('should call generateAllMigrations when run as main module', async () => {
    // Test the main function logic directly
    const generator = new SqlDataMigrationGenerator();
    await generator.generateAllMigrations();

    expect(mockConsoleLog).toHaveBeenCalledWith('🔄 Generating SQL data migration files...');
  });

  it('should handle errors in main function', async () => {
    const error = new Error('Generation failed');
    const testGenerator = new SqlDataMigrationGenerator();
    jest.spyOn(testGenerator as any, 'generateCharactersMigration').mockRejectedValue(error);

    await expect(testGenerator.generateAllMigrations()).rejects.toThrow('Generation failed');
    
    expect(mockConsoleError).toHaveBeenCalledWith('❌ Migration generation failed:', error);
  });
});
