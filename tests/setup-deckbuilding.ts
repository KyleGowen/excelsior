// Custom setup for deckBuilding integration test
// This setup does NOT include global cleanup to allow the test to manage its own data lifecycle

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3000';
// Note: SKIP_MIGRATIONS removed to ensure database schema is properly initialized

// Import test server
import { app, initializeTestServer } from '../src/test-server';

// Global test utilities for integration tests
export const integrationTestUtils = {
  // Helper to create test user in database
  createTestUser: async (userData: { name: string; email: string; role?: string; password?: string }) => {
    const { Pool } = require('pg');
    const crypto = require('crypto');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:1337/overpower'
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

  // Helper to ensure guest user exists
  ensureGuestUser: async () => {
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:1337/overpower'
    });
    
    try {
      const result = await pool.query('SELECT id FROM users WHERE username = $1', ['guest']);
      if (result.rows.length === 0) {
        await pool.query(
          'INSERT INTO users (id, username, email, password_hash, role) VALUES ($1, $2, $3, $4, $5)',
          ['00000000-0000-0000-0000-000000000000', 'guest', 'guest@example.com', 'guest', 'GUEST']
        );
        console.log('✅ Guest user created');
      } else {
        console.log('✅ Guest user already exists');
      }
    } finally {
      await pool.end();
    }
  },

  // Helper to ensure admin user exists
  ensureAdminUser: async () => {
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:1337/overpower'
    });
    
    try {
      const result = await pool.query('SELECT id FROM users WHERE username = $1', ['kyle']);
      if (result.rows.length === 0) {
        await pool.query(
          'INSERT INTO users (id, username, email, password_hash, role) VALUES ($1, $2, $3, $4, $5)',
          ['11111111-1111-1111-1111-111111111111', 'kyle', 'kyle@example.com', 'admin', 'ADMIN']
        );
        console.log('✅ Admin user created');
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

// Export the app for use in tests
export { app };
