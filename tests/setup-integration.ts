// Integration test setup - uses real database and server
// No mocking - tests against actual PostgreSQL database

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3000';

// Import test server
import { app, initializeTestServer } from '../src/test-server';

// Global test utilities for integration tests
export const integrationTestUtils = {
  // Helper to create test user in database
  createTestUser: async (userData: { name: string; email: string; role?: string }) => {
    const { Pool } = require('pg');
    const crypto = require('crypto');
    const pool = new Pool({
      connectionString: 'postgresql://postgres:password@localhost:1337/overpower'
    });
    
    try {
      const result = await pool.query(
        'INSERT INTO users (id, username, email, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [
          crypto.randomUUID(), // Generate proper UUID
          userData.name,
          userData.email,
          'hashed_password',
          userData.role || 'USER'
        ]
      );
      return result.rows[0];
    } finally {
      await pool.end();
    }
  },
  
  // Helper to create test deck in database
  createTestDeck: async (userId: string, deckData: any) => {
    const { Pool } = require('pg');
    const crypto = require('crypto');
    const pool = new Pool({
      connectionString: 'postgresql://postgres:password@localhost:1337/overpower'
    });
    
    try {
      const result = await pool.query(
        'INSERT INTO decks (id, user_id, name, description) VALUES ($1, $2, $3, $4) RETURNING *',
        [
          crypto.randomUUID(), // Generate proper UUID
          userId,
          deckData.name,
          deckData.description || ''
        ]
      );
      return result.rows[0];
    } finally {
      await pool.end();
    }
  },
  
  // Helper to clean up test data
  cleanupTestData: async () => {
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: 'postgresql://postgres:password@localhost:1337/overpower'
    });
    
    try {
      // Clean up test users and decks
      await pool.query('DELETE FROM decks WHERE name LIKE \'Test%\' OR name LIKE \'Jest%\'');
      await pool.query('DELETE FROM users WHERE username LIKE \'Test%\' OR username LIKE \'Jest%\'');
    } finally {
      await pool.end();
    }
  },
  
  // Helper to ensure guest user exists
  ensureGuestUser: async () => {
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: 'postgresql://postgres:password@localhost:1337/overpower'
    });
    
    try {
      // Check if guest user exists
      const result = await pool.query('SELECT * FROM users WHERE username = $1', ['guest']);
      
      if (result.rows.length === 0) {
        // Create guest user if it doesn't exist
        await pool.query(
          'INSERT INTO users (id, username, email, password_hash, role) VALUES ($1, $2, $3, $4, $5)',
          [
            '00000000-0000-0000-0000-000000000001',
            'guest',
            'guest@example.com',
            'guest',
            'GUEST'
          ]
        );
        console.log('✅ Guest user created for integration tests');
      } else {
        console.log('✅ Guest user already exists');
      }
    } finally {
      await pool.end();
    }
  }
};

// Ensure guest user exists before running integration tests
beforeAll(async () => {
  await integrationTestUtils.ensureGuestUser();
  // Initialize test server
  await initializeTestServer();
});

// Clean up test data after each test
afterEach(async () => {
  await integrationTestUtils.cleanupTestData();
});

// Export the app for use in tests
export { app };
