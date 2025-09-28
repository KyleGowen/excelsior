export const testConfig = {
  // Database configuration for tests
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/overpower_test',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'overpower_test'
  },
  
  // Server configuration for tests
  server: {
    port: parseInt(process.env.PORT || '3001'),
    host: process.env.HOST || 'localhost'
  },
  
  // Test data
  testUsers: {
    admin: {
      name: 'Admin User',
      email: 'admin@test.com',
      role: 'ADMIN'
    },
    regular: {
      name: 'Test User',
      email: 'user@test.com',
      role: 'USER'
    },
    guest: {
      name: 'Guest User',
      email: 'guest@test.com',
      role: 'GUEST'
    }
  },
  
  // Test decks
  testDecks: {
    valid: {
      name: 'Test Deck',
      description: 'A test deck for integration testing'
    },
    invalid: {
      description: 'A deck without a name'
    }
  },
  
  // Test cards
  testCards: {
    character: {
      cardType: 'character',
      cardId: 'leonidas',
      quantity: 1
    },
    special: {
      cardType: 'special',
      cardId: 'sword-and-shield',
      quantity: 2
    },
    location: {
      cardType: 'location',
      cardId: 'round-table',
      quantity: 1
    }
  }
};
