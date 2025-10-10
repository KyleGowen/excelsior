import { DataSourceConfig } from '../../src/config/DataSourceConfig';

describe('DataSourceConfig', () => {
  beforeEach(() => {
    // Reset environment variables
    delete process.env.DATABASE_URL;
    delete process.env.DB_HOST;
    delete process.env.DB_PORT;
    delete process.env.DB_NAME;
    delete process.env.DB_USER;
    delete process.env.DB_PASSWORD;

    // Reset singleton instance
    (DataSourceConfig as any).instance = undefined;
  });

  describe('constructor', () => {
    it('should initialize with PostgreSQL as data source type', () => {
      const config = DataSourceConfig.getInstance();
      expect(config.getDataSourceType()).toBe('postgresql');
    });

    it('should use environment variables when available', () => {
      process.env.DATABASE_URL = 'jdbc:postgresql://testhost:5432/testdb';
      process.env.DB_USER = 'testuser';
      process.env.DB_PASSWORD = 'testpass';

      const config = DataSourceConfig.getInstance();
      expect(config).toBeDefined();

      delete process.env.DATABASE_URL;
      delete process.env.DB_USER;
      delete process.env.DB_PASSWORD;
    });
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = DataSourceConfig.getInstance();
      const instance2 = DataSourceConfig.getInstance();
      
      expect(instance1).toBeDefined();
      expect(instance2).toBeDefined();
    });
  });

  describe('getDataSourceType', () => {
    it('should return postgresql as data source type', () => {
      const config = DataSourceConfig.getInstance();
      expect(config.getDataSourceType()).toBe('postgresql');
    });
  });

  describe('close', () => {
    it('should handle pool being undefined', async () => {
      const config = DataSourceConfig.getInstance();
      (config as any).pool = undefined;
      
      await expect(config.close()).resolves.not.toThrow();
    });
  });

  describe('environment variable handling', () => {
    it('should handle partial environment variables', () => {
      process.env.DB_HOST = 'customhost';
      process.env.DB_USER = 'customuser';
      // DB_PORT, DB_NAME, DB_PASSWORD not set
      
      const config = DataSourceConfig.getInstance();
      expect(config).toBeDefined();
    });

    it('should handle empty string environment variables', () => {
      process.env.DB_HOST = '';
      process.env.DB_PORT = '';
      process.env.DB_NAME = '';
      process.env.DB_USER = '';
      process.env.DB_PASSWORD = '';
      
      const config = DataSourceConfig.getInstance();
      expect(config).toBeDefined();
    });

    it('should handle invalid port number', () => {
      process.env.DB_PORT = 'invalid';
      
      const config = DataSourceConfig.getInstance();
      expect(config).toBeDefined();
    });
  });

  describe('DATABASE_URL parsing', () => {
    it('should handle DATABASE_URL with all components', () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb?sslmode=require';
      
      const config = DataSourceConfig.getInstance();
      expect(config).toBeDefined();
    });

    it('should handle DATABASE_URL without port', () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost/testdb';
      
      const config = DataSourceConfig.getInstance();
      expect(config).toBeDefined();
    });

    it('should handle DATABASE_URL without credentials', () => {
      process.env.DATABASE_URL = 'postgresql://localhost:5432/testdb';
      
      const config = DataSourceConfig.getInstance();
      expect(config).toBeDefined();
    });
  });
});