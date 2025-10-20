import { DataSourceConfig } from '../../src/config/DataSourceConfig';

describe('DataSourceConfig - Basic Functionality', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Reset the singleton instance
    (DataSourceConfig as any).instance = undefined;
    
    // Mock console.log to avoid noise in test output
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('Basic Functionality', () => {
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

    it('should have close method', () => {
      const config = DataSourceConfig.getInstance();
      expect(typeof config.close).toBe('function');
    });

    it('should have getDataSourceType method', () => {
      const config = DataSourceConfig.getInstance();
      expect(typeof config.getDataSourceType).toBe('function');
    });

    it('should return postgresql as data source type', () => {
      const config = DataSourceConfig.getInstance();
      expect(config.getDataSourceType()).toBe('postgresql');
    });
  });
});