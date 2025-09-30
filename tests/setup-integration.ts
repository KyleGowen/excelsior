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
  createTestUser: async (userData: { name: string; email: string; role?: string; password?: string }) => {
    const { Pool } = require('pg');
    const crypto = require('crypto');
    const pool = new Pool({
      connectionString: 'postgresql://postgres:password@localhost:1337/overpower'
    });
    
    try {
      // Ensure uniqueness to avoid constraint violations across tests
      const uniqueSuffix = `_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const username = (userData.name && userData.name.length > 0) ? `${userData.name}${uniqueSuffix}` : `testuser${uniqueSuffix}`;
      const email = userData.email ? userData.email.replace('@', `${uniqueSuffix}@`) : `testuser${uniqueSuffix}@example.com`;
      const result = await pool.query(
        'INSERT INTO users (id, username, email, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [
          crypto.randomUUID(), // Generate proper UUID
          username,
          email,
          userData.password || 'password123',
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
      // Clean up test users and decks created by integration tests
      await pool.query("DELETE FROM decks WHERE name LIKE 'Test%' OR name LIKE 'Jest%' OR name LIKE 'Character Layout Test Deck' OR name LIKE 'Test Navigation Deck'");
      // Delete ONLY users created by tests; preserve core seeded users like 'guest' and 'kyle'
      await pool.query("DELETE FROM users WHERE (username ILIKE 'test%' OR username ILIKE 'jest%' OR username ILIKE 'charlayout_%' OR username ILIKE 'decknavtest_%' OR username IN ('usernameonly', 'middlewareuser', 'sessionuser') OR email LIKE 'testuser_%@example.com' OR email LIKE 'usernameonly_%@example.com' OR email LIKE 'decknavtest_%@example.com' OR email LIKE 'charlayout_%@example.com') AND username NOT IN ('guest','kyle')");
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
  ,
  // Helper to ensure admin user (kyle) exists
  ensureAdminUser: async () => {
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: 'postgresql://postgres:password@localhost:1337/overpower'
    });
    try {
      const result = await pool.query('SELECT * FROM users WHERE username = $1', ['kyle']);
      if (result.rows.length === 0) {
        await pool.query(
          'INSERT INTO users (id, username, email, password_hash, role) VALUES ($1, $2, $3, $4, $5)',
          [
            'c567175f-a07b-41b7-b274-e82901d1b4f1',
            'kyle',
            'kyle@example.com',
            'test',
            'ADMIN'
          ]
        );
        console.log('✅ Admin user created for integration tests');
      } else {
        console.log('✅ Admin user already exists');
      }
    } finally {
      await pool.end();
    }
  }
};

// Ensure guest user exists before running integration tests
beforeAll(async () => {
  await integrationTestUtils.ensureGuestUser();
  await integrationTestUtils.ensureAdminUser();
  // Initialize test server
  await initializeTestServer();
});

// Clean up test data after each test
afterEach(async () => {
  await integrationTestUtils.cleanupTestData();
});

// Export the app for use in tests
export { app };
