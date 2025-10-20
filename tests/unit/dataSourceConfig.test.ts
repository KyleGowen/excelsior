import { DataSourceConfig, DataSourceType } from '../../src/config/DataSourceConfig';
import { Pool } from 'pg';
import { PostgreSQLUserRepository } from '../../src/database/PostgreSQLUserRepository';
import { PostgreSQLDeckRepository } from '../../src/database/PostgreSQLDeckRepository';
import { PostgreSQLCardRepository } from '../../src/database/PostgreSQLCardRepository';

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

describe('DataSourceConfig', () => {
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

  describe('constructor', () => {
    it('should initialize with PostgreSQL as data source type', () => {
      const config = DataSourceConfig.getInstance();
      expect(config.getDataSourceType()).toBe('postgresql');
    });
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = DataSourceConfig.getInstance();
      const instance2 = DataSourceConfig.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('getUserRepository', () => {
    it('should return user repository instance', () => {
      const config = DataSourceConfig.getInstance();
      const userRepo = config.getUserRepository();
      expect(userRepo).toBeDefined();
    });
  });

  describe('getDeckRepository', () => {
    it('should return deck repository instance', () => {
      const config = DataSourceConfig.getInstance();
      const deckRepo = config.getDeckRepository();
      expect(deckRepo).toBeDefined();
    });
  });

  describe('getCardRepository', () => {
    it('should return card repository instance', () => {
      const config = DataSourceConfig.getInstance();
      const cardRepo = config.getCardRepository();
      expect(cardRepo).toBeDefined();
    });
  });

  describe('getDataSourceType', () => {
    it('should return postgresql as data source type', () => {
      const config = DataSourceConfig.getInstance();
      expect(config.getDataSourceType()).toBe('postgresql');
    });
  });

  describe('close', () => {
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

    it('should handle pool.end() throwing an error', async () => {
      mockPoolInstance.end.mockRejectedValueOnce(new Error('Pool close failed'));
      
      const config = DataSourceConfig.getInstance();
      
      await expect(config.close()).rejects.toThrow('Pool close failed');
    });
  });

  describe('environment variable handling', () => {
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

    it('should handle empty string environment variables', () => {
      delete process.env.DATABASE_URL;
      process.env.DB_HOST = '';
      process.env.DB_PORT = '';
      process.env.DB_NAME = '';
      process.env.DB_USER = '';
      process.env.DB_PASSWORD = '';
      
      // Reset singleton to test environment variable handling
      (DataSourceConfig as any).instance = undefined;
      DataSourceConfig.getInstance();
      
      expect(mockPoolConstructor).toHaveBeenCalledWith({
        host: 'localhost', // default
        port: 1337, // default
        database: 'overpower', // default
        user: 'postgres', // default
        password: 'password', // default
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });
    });

    it('should handle invalid port number', () => {
      delete process.env.DATABASE_URL;
      process.env.DB_PORT = 'invalid';
      
      // Reset singleton to test environment variable handling
      (DataSourceConfig as any).instance = undefined;
      DataSourceConfig.getInstance();
      
      expect(mockPoolConstructor).toHaveBeenCalledWith({
        host: 'localhost',
        port: NaN, // parseInt('invalid') returns NaN
        database: 'overpower',
        user: 'postgres',
        password: 'password',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });
    });
  });

  describe('DATABASE_URL parsing', () => {
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

    it('should handle DATABASE_URL without port', () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@host/database';
      
      // Reset singleton to test environment variable handling
      (DataSourceConfig as any).instance = undefined;
      DataSourceConfig.getInstance();
      
      expect(mockPoolConstructor).toHaveBeenCalledWith({
        connectionString: 'postgresql://user:pass@host/database',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });
    });

    it('should handle DATABASE_URL without credentials', () => {
      process.env.DATABASE_URL = 'postgresql://host:5432/database';
      
      // Reset singleton to test environment variable handling
      (DataSourceConfig as any).instance = undefined;
      DataSourceConfig.getInstance();
      
      expect(mockPoolConstructor).toHaveBeenCalledWith({
        connectionString: 'postgresql://host:5432/database',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle Pool constructor throwing an error', () => {
      mockPoolConstructor.mockImplementationOnce(() => {
        throw new Error('Pool creation failed');
      });
      
      // Reset singleton to test error handling
      (DataSourceConfig as any).instance = undefined;
      expect(() => DataSourceConfig.getInstance()).toThrow('Pool creation failed');
    });

    it('should handle repository constructors throwing errors', () => {
      (PostgreSQLUserRepository as jest.Mock).mockImplementationOnce(() => {
        throw new Error('UserRepository creation failed');
      });
      
      // Reset singleton to test error handling
      (DataSourceConfig as any).instance = undefined;
      expect(() => DataSourceConfig.getInstance()).toThrow('UserRepository creation failed');
    });
  });

  describe('repository initialization order', () => {
    it('should initialize repositories in correct order', () => {
      const initOrder: string[] = [];
      
      (PostgreSQLUserRepository as jest.Mock).mockImplementation(() => {
        initOrder.push('user');
        return {};
      });
      
      (PostgreSQLDeckRepository as jest.Mock).mockImplementation(() => {
        initOrder.push('deck');
        return {};
      });
      
      (PostgreSQLCardRepository as jest.Mock).mockImplementation(() => {
        initOrder.push('card');
        return {};
      });
      
      // Reset singleton to test initialization order
      (DataSourceConfig as any).instance = undefined;
      DataSourceConfig.getInstance();
      
      expect(initOrder).toEqual(['user', 'deck', 'card']);
    });
  });

  describe('pool configuration validation', () => {
    it('should use correct pool configuration for DATABASE_URL', () => {
      process.env.DATABASE_URL = 'postgresql://test:test@test:5432/test';
      
      // Reset singleton to test configuration
      (DataSourceConfig as any).instance = undefined;
      DataSourceConfig.getInstance();
      
      const poolCall = mockPoolConstructor.mock.calls[0][0];
      expect(poolCall).toHaveProperty('connectionString', 'postgresql://test:test@test:5432/test');
      expect(poolCall).toHaveProperty('max', 20);
      expect(poolCall).toHaveProperty('idleTimeoutMillis', 30000);
      expect(poolCall).toHaveProperty('connectionTimeoutMillis', 2000);
      expect(poolCall).not.toHaveProperty('host');
      expect(poolCall).not.toHaveProperty('port');
      expect(poolCall).not.toHaveProperty('database');
      expect(poolCall).not.toHaveProperty('user');
      expect(poolCall).not.toHaveProperty('password');
    });

    it('should use correct pool configuration for individual env vars', () => {
      delete process.env.DATABASE_URL;
      process.env.DB_HOST = 'testhost';
      process.env.DB_PORT = '5433';
      process.env.DB_NAME = 'testdb';
      process.env.DB_USER = 'testuser';
      process.env.DB_PASSWORD = 'testpass';
      
      // Reset singleton to test configuration
      (DataSourceConfig as any).instance = undefined;
      DataSourceConfig.getInstance();
      
      const poolCall = mockPoolConstructor.mock.calls[0][0];
      expect(poolCall).toHaveProperty('host', 'testhost');
      expect(poolCall).toHaveProperty('port', 5433);
      expect(poolCall).toHaveProperty('database', 'testdb');
      expect(poolCall).toHaveProperty('user', 'testuser');
      expect(poolCall).toHaveProperty('password', 'testpass');
      expect(poolCall).toHaveProperty('max', 20);
      expect(poolCall).toHaveProperty('idleTimeoutMillis', 30000);
      expect(poolCall).toHaveProperty('connectionTimeoutMillis', 2000);
      expect(poolCall).not.toHaveProperty('connectionString');
    });
  });
});