import { mockUserRepository, mockDeckRepository, mockCardRepository } from './mocks/DatabaseMocks';

// Mock the DataSourceConfig to use our mocked repositories
jest.mock('../src/config/DataSourceConfig', () => ({
  DataSourceConfig: {
    getInstance: () => ({
      getUserRepository: () => mockUserRepository,
      getDeckRepository: () => mockDeckRepository,
      getCardRepository: () => mockCardRepository,
      getDataSourceType: () => 'postgresql',
      getPool: () => null, // Not needed for mocked tests
      close: () => Promise.resolve(),
      resetDatabase: () => Promise.resolve()
    })
  }
}));

// Mock the PostgreSQL repositories directly
jest.mock('../src/database/PostgreSQLUserRepository', () => ({
  PostgreSQLUserRepository: jest.fn().mockImplementation(() => mockUserRepository)
}));

jest.mock('../src/database/PostgreSQLDeckRepository', () => ({
  PostgreSQLDeckRepository: jest.fn().mockImplementation(() => mockDeckRepository)
}));

jest.mock('../src/database/PostgreSQLCardRepository', () => ({
  PostgreSQLCardRepository: jest.fn().mockImplementation(() => mockCardRepository)
}));

// Mock the UserPersistenceService
jest.mock('../src/persistence/userPersistence', () => ({
  UserPersistenceService: jest.fn().mockImplementation(() => ({
    authenticateUser: jest.fn().mockImplementation((username: string, password: string) => {
      if (username === 'kyle' && password === 'Overpower2025!') {
        return {
          id: '00000000-0000-0000-0000-000000000002',
          name: 'kyle',
          email: 'kyle@example.com',
          role: 'USER'
        };
      }
      if (username === 'guest' && password === 'GuestAccess2025!') {
        return {
          id: '00000000-0000-0000-0000-000000000001',
          name: 'guest',
          email: 'guest@example.com',
          role: 'GUEST'
        };
      }
      return undefined;
    }),
    createSession: jest.fn(),
    validateSession: jest.fn(),
    logout: jest.fn(),
    loadUsers: jest.fn(),
    loadSessions: jest.fn(),
    saveUsers: jest.fn(),
    saveSessions: jest.fn(),
    getUserById: jest.fn(),
    getUserByUsername: jest.fn(),
    getAllUsers: jest.fn(),
    getActiveSessions: jest.fn(),
    cleanupExpiredSessions: jest.fn(),
    initialize: jest.fn()
  }))
}));

// Global test utilities
export const testUtils = {
  getTestDataSource: () => ({
    getUserRepository: () => mockUserRepository,
    getDeckRepository: () => mockDeckRepository,
    getCardRepository: () => mockCardRepository,
    getDataSourceType: () => 'postgresql',
    getPool: () => null,
    close: () => Promise.resolve(),
    resetDatabase: () => Promise.resolve()
  }),
  
  resetTestDatabase: async () => {
    // Reset all mocks
    jest.clearAllMocks();
  },
  
  createTestUser: async (userData: { name: string; email: string; role?: string }) => {
    return await mockUserRepository.createUser(userData.name, userData.email, 'hashed_password', userData.role as any);
  },
  
  createTestDeck: async (userId: string, deckData: any) => {
    return await mockDeckRepository.createDeck(userId, deckData.name, deckData.description);
  },
  
  cleanupTestData: async () => {
    // Reset all mocks
    jest.clearAllMocks();
  }
};