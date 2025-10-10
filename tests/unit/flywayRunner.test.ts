import { FlywayRunner } from '../../src/scripts/flywayRunner';

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

let mockConsoleLog: jest.SpyInstance;
let mockConsoleError: jest.SpyInstance;

describe('FlywayRunner', () => {
  let flywayRunner: FlywayRunner;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset environment variables
    delete process.env.DATABASE_URL;
    delete process.env.DB_USER;
    delete process.env.DB_PASSWORD;

    flywayRunner = new FlywayRunner();

    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
  });

  describe('constructor', () => {
    it('should initialize with default configuration', () => {
      const runner = new FlywayRunner();
      expect((runner as any).config).toEqual({
        url: 'jdbc:postgresql://localhost:1337/overpower',
        user: 'postgres',
        password: 'password',
        schemas: 'public',
        locations: 'filesystem:migrations',
        baselineOnMigrate: true,
        validateOnMigrate: true,
        cleanDisabled: false,
        baselineVersion: '0',
        baselineDescription: 'Initial baseline'
      });
    });

    it('should use environment variables when available', () => {
      process.env.DATABASE_URL = 'jdbc:postgresql://testhost:5432/testdb';
      process.env.DB_USER = 'testuser';
      process.env.DB_PASSWORD = 'testpass';

      const runner = new FlywayRunner();
      expect((runner as any).config.url).toBe('jdbc:postgresql://testhost:5432/testdb');
      expect((runner as any).config.user).toBe('testuser');
      expect((runner as any).config.password).toBe('testpass');

      delete process.env.DATABASE_URL;
      delete process.env.DB_USER;
      delete process.env.DB_PASSWORD;
    });
  });

  describe('buildFlywayCommand', () => {
    it('should build correct flyway command with config file', () => {
      const command = 'migrate';
      const result = (flywayRunner as any).buildFlywayCommand(command);

      expect(result).toContain('flyway -configFiles=');
      expect(result).toContain('migrate');
    });

    it('should handle different commands', () => {
      const commands = ['info', 'validate', 'repair', 'clean'];
      
      commands.forEach(command => {
        const result = (flywayRunner as any).buildFlywayCommand(command);
        
        expect(result).toContain('flyway -configFiles=');
        expect(result).toContain(command);
      });
    });
  });

  describe('migrate', () => {
    it('should have migrate method', () => {
      expect(typeof flywayRunner.migrate).toBe('function');
    });
  });

  describe('info', () => {
    it('should have info method', () => {
      expect(typeof flywayRunner.info).toBe('function');
    });
  });

  describe('validate', () => {
    it('should have validate method', () => {
      expect(typeof flywayRunner.validate).toBe('function');
    });
  });

  describe('repair', () => {
    it('should have repair method', () => {
      expect(typeof flywayRunner.repair).toBe('function');
    });
  });

  describe('clean', () => {
    it('should have clean method', () => {
      expect(typeof flywayRunner.clean).toBe('function');
    });
  });
});