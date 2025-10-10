import { DatabaseInitializationService } from '../../src/services/databaseInitialization';

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

let mockConsoleLog: jest.SpyInstance;
let mockConsoleError: jest.SpyInstance;

describe('DatabaseInitializationService', () => {
  let service: DatabaseInitializationService;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset environment variables
    delete process.env.SKIP_MIGRATIONS;
    delete process.env.NODE_ENV;
    delete process.env.DATABASE_URL;
    delete process.env.FLYWAY_URL;
    delete process.env.FLYWAY_USER;
    delete process.env.FLYWAY_PASSWORD;

    service = new DatabaseInitializationService();

    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
  });

  describe('constructor', () => {
    it('should initialize with isInitialized set to false', () => {
      expect((service as any).isInitialized).toBe(false);
    });
  });

  describe('initializeDatabase', () => {
    it('should skip initialization if already initialized', async () => {
      (service as any).isInitialized = true;
      
      await service.initializeDatabase();
      
      expect(mockConsoleLog).toHaveBeenCalledWith('📊 Database already initialized, skipping...');
    });

    it('should skip migrations when SKIP_MIGRATIONS=true', async () => {
      process.env.SKIP_MIGRATIONS = 'true';
      
      await service.initializeDatabase();
      
      expect(mockConsoleLog).toHaveBeenCalledWith('⏭️ Skipping Flyway migrations (SKIP_MIGRATIONS=true)');
      expect(mockConsoleLog).toHaveBeenCalledWith('✅ Database initialization completed (migrations skipped)!');
      expect((service as any).isInitialized).toBe(true);
    });
  });

  describe('checkDatabaseStatus', () => {
    it('should have checkDatabaseStatus method', () => {
      expect(typeof service.checkDatabaseStatus).toBe('function');
    });
  });

  describe('validateDatabase', () => {
    it('should have validateDatabase method', () => {
      expect(typeof service.validateDatabase).toBe('function');
    });
  });
});