import { DataSourceConfig, DataSourceType } from '../../src/config/DataSourceConfig';

// Mock the pg module
const mockPoolInstance = {
  end: jest.fn().mockResolvedValue(undefined),
};

const mockPoolConstructor = jest.fn().mockImplementation(() => mockPoolInstance);

jest.mock('pg', () => ({
  Pool: mockPoolConstructor,
}));

// Mock the repository classes
jest.mock('../../src/database/PostgreSQLUserRepository');
jest.mock('../../src/database/PostgreSQLDeckRepository');
jest.mock('../../src/database/PostgreSQLCardRepository');

describe('DataSourceConfig - Basic Functionality', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    // Store original environment
    originalEnv = { ...process.env };
    
    // Clear all mocks
    jest.clearAllMocks();
    
    // Mock console methods
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    
    // Restore console methods
    consoleSpy.mockRestore();
    jest.restoreAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should initialize with PostgreSQL as data source type', () => {
      const config = DataSourceConfig.getInstance();
      expect(config.getDataSourceType()).toBe('postgresql');
    });

    it('should return singleton instance', () => {
      const instance1 = DataSourceConfig.getInstance();
      const instance2 = DataSourceConfig.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should return user repository instance', () => {
      const config = DataSourceConfig.getInstance();
      const userRepo = config.getUserRepository();
      expect(userRepo).toBeDefined();
    });

    it('should return deck repository instance', () => {
      const config = DataSourceConfig.getInstance();
      const deckRepo = config.getDeckRepository();
      expect(deckRepo).toBeDefined();
    });

    it('should return card repository instance', () => {
      const config = DataSourceConfig.getInstance();
      const cardRepo = config.getCardRepository();
      expect(cardRepo).toBeDefined();
    });

    it('should close the pool when pool exists', async () => {
      const config = DataSourceConfig.getInstance();
      await config.close();
      
      expect(mockPoolInstance.end).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('🔌 PostgreSQL connection pool closed');
    });

    it('should handle pool being undefined', async () => {
      const config = DataSourceConfig.getInstance();
      // Manually set pool to undefined to test edge case
      (config as any).pool = undefined;
      
      await expect(config.close()).resolves.not.toThrow();
    });
  });

  describe('Environment Variable Handling', () => {
    it('should handle partial environment variables', () => {
      delete process.env.DATABASE_URL;
      process.env.DB_HOST = 'customhost';
      // Other DB_* vars not set
      
      // Reset singleton to test environment variable handling
      (DataSourceConfig as any).instance = undefined;
      DataSourceConfig.getInstance();
      
      expect(mockPoolConstructor).toHaveBeenCalledWith({
        host: 'customhost',
        port: 1337, // default
        database: 'overpower', // default
        user: 'postgres', // default
        password: 'password', // default
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });
    });

    it('should handle DATABASE_URL with all components', () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@host:5432/database';
      
      // Reset singleton to test environment variable handling
      (DataSourceConfig as any).instance = undefined;
      DataSourceConfig.getInstance();
      
      expect(mockPoolConstructor).toHaveBeenCalledWith({
        connectionString: 'postgresql://user:pass@host:5432/database',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });
    });
  });
});
