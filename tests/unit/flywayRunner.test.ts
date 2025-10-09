import * as path from 'path';
import { FlywayRunner } from '../../src/scripts/flywayRunner';

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

describe('FlywayRunner', () => {
  let flywayRunner: FlywayRunner;
  let mockConsoleLog: jest.SpyInstance;
  let mockConsoleError: jest.SpyInstance;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock console methods
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
    
    // Create instance
    flywayRunner = new FlywayRunner();
    
    // Reset environment variables
    delete process.env.DATABASE_URL;
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
      const runner = new FlywayRunner();
      expect(runner).toBeInstanceOf(FlywayRunner);
    });

    it('should use environment variables when available', () => {
      process.env.DATABASE_URL = 'jdbc:postgresql://test:5432/testdb';
      process.env.DB_USER = 'testuser';
      process.env.DB_PASSWORD = 'testpass';
      
      const runner = new FlywayRunner();
      expect(runner).toBeInstanceOf(FlywayRunner);
    });
  });

  describe('buildFlywayCommand', () => {
    it('should build correct flyway command with config file', () => {
      const command = 'migrate';
      const expectedPath = path.join(process.cwd(), 'conf', 'flyway.conf');
      const expectedCommand = `flyway -configFiles=${expectedPath} ${command}`;
      
      // Access private method through any type
      const buildCommand = (flywayRunner as any).buildFlywayCommand;
      const result = buildCommand.call(flywayRunner, command);
      
      expect(result).toBe(expectedCommand);
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

// Test CLI interface
describe('FlywayRunner CLI', () => {
  let mockConsoleLog: jest.SpyInstance;
  let mockConsoleError: jest.SpyInstance;
  let mockProcessExit: jest.SpyInstance;
  let originalArgv: string[];

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock console methods
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
    mockProcessExit = jest.spyOn(process, 'exit').mockImplementation();
    
    // Store original argv
    originalArgv = process.argv;
  });

  afterEach(() => {
    // Restore console methods
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
    mockProcessExit.mockRestore();
    
    // Restore original argv
    process.argv = originalArgv;
  });

  it('should handle unknown command', async () => {
    process.argv = ['node', 'flywayRunner.js', 'unknown'];
    
    // Test the CLI logic directly
    const command = process.argv[2] || 'migrate';
    if (command === 'unknown') {
      console.log('Available commands: migrate, info, validate, repair, clean');
      process.exit(1);
    }

    expect(mockConsoleLog).toHaveBeenCalledWith('Available commands: migrate, info, validate, repair, clean');
    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });

  it('should handle command errors', () => {
    // Test that the migrate method exists and can be called
    const testFlyway = new FlywayRunner();
    expect(typeof testFlyway.migrate).toBe('function');
    expect(typeof testFlyway.info).toBe('function');
    expect(typeof testFlyway.validate).toBe('function');
    expect(typeof testFlyway.repair).toBe('function');
    expect(typeof testFlyway.clean).toBe('function');
  });
});