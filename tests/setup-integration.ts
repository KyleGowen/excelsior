// Integration test setup - uses real database and server
// No mocking - tests against actual PostgreSQL database

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3000';
// Note: SKIP_MIGRATIONS removed to ensure database schema is properly initialized

// Polyfill for TextEncoder/TextDecoder (required by pg library)
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Import test server
import { app, initializeTestServer } from '../src/test-server';

// Track test-created deck IDs to ensure we only delete what tests create
const testCreatedDeckIds = new Set<string>();

// Debug function to log all deck deletions
const logDeckDeletion = (source: string, deckId: string, reason: string = '') => {
  const timestamp = new Date().toISOString();
  console.log(`🔍 DEBUG: [${timestamp}] DECK DELETION from ${source}: ${deckId} ${reason ? `(${reason})` : ''}`);
  
  // Check if this is a protected deck
  const protectedDeckIds = [
    'be383a46-c8e0-4f85-8fc7-2a3b33048ced', // V113 "Ungodly Powers" deck
    'c17c8b37-6d6a-41ca-8460-c7eb4648406f', // Current "Ungodly Powers" deck
  ];
  
  if (protectedDeckIds.includes(deckId)) {
    console.error(`❌❌❌ CRITICAL: Protected deck ${deckId} is being deleted from ${source}! ❌❌❌`);
  }
};

// Global test utilities for integration tests
export const integrationTestUtils = {
  // Helper to track a deck created by tests
  trackTestDeck: (deckId: string) => {
    console.log(`🔍 DEBUG: trackTestDeck() called with deckId: ${deckId}`);
    testCreatedDeckIds.add(deckId);
    console.log(`✅ DEBUG: Deck ${deckId} added to tracking set. Current tracked decks: [${Array.from(testCreatedDeckIds).join(', ')}]`);
  },

  // Helper to untrack a deck (when it's deleted by tests)
  untrackTestDeck: (deckId: string) => {
    testCreatedDeckIds.delete(deckId);
  },

  // Helper to get all tracked test deck IDs
  getTrackedTestDeckIds: () => {
    return Array.from(testCreatedDeckIds);
  },
  // Helper to create test user in database
  createTestUser: async (userData: { name: string; email: string; role?: string; password?: string }) => {
    const { Pool } = require('pg');
    const crypto = require('crypto');
    const bcrypt = require('bcrypt');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:1337/overpower''
    });
    
    try {
      // Ensure uniqueness to avoid constraint violations across tests
      const uniqueSuffix = `_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const username = (userData.name && userData.name.length > 0) ? `${userData.name}${uniqueSuffix}` : `testuser${uniqueSuffix}`;
      const email = userData.email ? userData.email.replace('@', `${uniqueSuffix}@`) : `testuser${uniqueSuffix}@example.com`;
      
      // Hash the password
      const passwordToHash = userData.password || 'password123';
      const hashedPassword = await bcrypt.hash(passwordToHash, 10);
      
      const result = await pool.query(
        'INSERT INTO users (id, username, email, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [
          crypto.randomUUID(), // Generate proper UUID
          username,
          email,
          hashedPassword,
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
    console.log(`🔍 DEBUG: createTestDeck() called with userId: ${userId}, deckData:`, deckData);
    
    const { Pool } = require('pg');
    const crypto = require('crypto');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:1337/overpower''
    });
    
    try {
      const deckId = crypto.randomUUID();
      console.log(`🔍 DEBUG: createTestDeck() - Generated deckId: ${deckId}`);
      
      const result = await pool.query(
        'INSERT INTO decks (id, user_id, name, description) VALUES ($1, $2, $3, $4) RETURNING *',
        [
          deckId,
          userId,
          deckData.name,
          deckData.description || ''
        ]
      );
      
      // Track this deck as test-created
      testCreatedDeckIds.add(deckId);
      console.log(`✅ DEBUG: createTestDeck() - Deck ${deckId} added to tracking set. Current tracked decks: [${Array.from(testCreatedDeckIds).join(', ')}]`);
      
      return result.rows[0];
    } finally {
      await pool.end();
    }
  },
  
  // Helper to clean up test data - DEPRECATED: Use tracked deck IDs instead
  // This function is kept for backwards compatibility but should not be used
  // All cleanup should use trackTestDeck() and the tracked ID-based cleanup
  cleanupTestData: async () => {
    console.warn('⚠️ cleanupTestData() is deprecated. All cleanup should use trackTestDeck() and tracked ID-based cleanup.');
    // No operation - cleanup is handled by tracked IDs only
  },

  // Comprehensive cleanup function for manual cleanup of all test data
  cleanupAllTestData: async () => {
    console.log(`🔍 DEBUG: cleanupAllTestData() starting...`);
    
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:1337/overpower''
    });
    
    try {
      console.log('🧹 Starting comprehensive test data cleanup...');
      
      // Get tracked test deck IDs
      let trackedDeckIds = Array.from(testCreatedDeckIds);
      console.log(`🔍 DEBUG: cleanupAllTestData() - Current tracked deck IDs: [${trackedDeckIds.join(', ')}]`);
      
      // Only delete tracked test decks - no complex protection needed
      
      if (trackedDeckIds.length > 0) {
        console.log(`🗑️ Deleting ${trackedDeckIds.length} test-created decks: ${trackedDeckIds.join(', ')}`);
        
        // First, delete all deck cards for tracked test decks
        console.log(`🔍 DEBUG: cleanupAllTestData() - Deleting deck_cards for decks: [${trackedDeckIds.join(', ')}]`);
        await pool.query(`
          DELETE FROM deck_cards WHERE deck_id = ANY($1)
        `, [trackedDeckIds]);
        
        // Then delete the tracked test decks
        console.log(`🔍 DEBUG: cleanupAllTestData() - Deleting decks: [${trackedDeckIds.join(', ')}]`);
        for (const deckId of trackedDeckIds) {
          logDeckDeletion('cleanupAllTestData', deckId, 'tracked test deck');
        }
        const deckResult = await pool.query(`
          DELETE FROM decks WHERE id = ANY($1)
        `, [trackedDeckIds]);
        
        console.log(`✅ Deleted ${deckResult.rowCount} test-created decks`);
      } else {
        console.log('ℹ️ No tracked test decks to delete');
      }
      
      // Clear the tracking set
      testCreatedDeckIds.clear();
      
      // Note: Individual tests should clean up their own users in their afterAll hooks
      // We don't delete users here to avoid accidentally affecting production data
      console.log(`ℹ️ User cleanup is handled by individual test afterAll hooks`);
      
      console.log(`✅ Cleanup completed: 0 users deleted (handled by individual tests)`);
    } finally {
      await pool.end();
      console.log(`🔍 DEBUG: cleanupAllTestData() completed`);
    }
  },
  
  // Helper to ensure test guest user exists (separate from production guest)
  ensureGuestUser: async () => {
    const { Pool } = require('pg');
    const bcrypt = require('bcrypt');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:1337/overpower''
    });
    
    try {
      // Check if test guest user exists
      const result = await pool.query('SELECT * FROM users WHERE username = $1', ['Test-Guest']);
      
      if (result.rows.length === 0) {
        // Hash the test guest password
        const hashedPassword = await bcrypt.hash('test-guest', 10);
        
        // Create test guest user if it doesn't exist
        await pool.query(
          'INSERT INTO users (id, username, email, password_hash, role) VALUES ($1, $2, $3, $4, $5)',
          [
            '00000000-0000-0000-0000-000000000002', // Different ID from production guest
            'Test-Guest',
            'test-guest@example.com',
            hashedPassword,
            'GUEST'
          ]
        );
        console.log('✅ Test-Guest user created for integration tests');
      } else {
        console.log('✅ Test-Guest user already exists');
      }
    } finally {
      await pool.end();
    }
  }
  ,
  // Helper to ensure admin user (kyle) exists
  ensureAdminUser: async () => {
    const { Pool } = require('pg');
    const bcrypt = require('bcrypt');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:1337/overpower''
    });
    try {
      // Hash the admin password
      const hashedPassword = await bcrypt.hash('test', 10);
      
      const result = await pool.query('SELECT * FROM users WHERE username = $1', ['kyle']);
      
      if (result.rows.length === 0) {
        // Create new user
        await pool.query(
          'INSERT INTO users (id, username, email, password_hash, role) VALUES ($1, $2, $3, $4, $5)',
          [
            'c567175f-a07b-41b7-b274-e82901d1b4f1',
            'kyle',
            'kyle@example.com',
            hashedPassword,
            'ADMIN'
          ]
        );
        console.log('✅ Admin user created for integration tests');
      } else {
        // Update existing user's password
        await pool.query(
          'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE username = $2',
          [hashedPassword, 'kyle']
        );
        console.log('✅ Admin user password updated for integration tests');
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

// Clean up test data after each test suite (not after each individual test)
// This prevents deleting users that are needed for subsequent tests in the same suite
afterEach(async () => {
  console.log(`🔍 DEBUG: afterEach() cleanup starting...`);
  
  // Only clean up specific test data that should be cleaned after each test
  // Don't clean up users as they may be needed for subsequent tests in the same suite
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:1337/overpower''
  });
  
  try {
    // Get tracked test deck IDs for this test run
    const trackedDeckIds = Array.from(testCreatedDeckIds);
    console.log(`🔍 DEBUG: afterEach() - Current tracked deck IDs: [${trackedDeckIds.join(', ')}]`);
    
    if (trackedDeckIds.length > 0) {
      console.log(`🧹 Cleaning up ${trackedDeckIds.length} test-created decks after test: ${trackedDeckIds.join(', ')}`);
      
      // Only delete tracked test decks - no complex protection needed
      // First, delete all deck cards for tracked test decks
      console.log(`🔍 DEBUG: Deleting deck_cards for decks: [${trackedDeckIds.join(', ')}]`);
      await pool.query(`
        DELETE FROM deck_cards WHERE deck_id = ANY($1)
      `, [trackedDeckIds]);
      
      // Then delete the tracked test decks
      console.log(`🔍 DEBUG: Deleting decks: [${trackedDeckIds.join(', ')}]`);
      for (const deckId of trackedDeckIds) {
        logDeckDeletion('afterEach cleanup', deckId, 'tracked test deck');
      }
      await pool.query(`
        DELETE FROM decks WHERE id = ANY($1)
      `, [trackedDeckIds]);
      
      // Clear the tracking set for this test run
      testCreatedDeckIds.clear();
    } else {
      console.log(`🔍 DEBUG: afterEach() - No tracked decks to clean up`);
    }
  } finally {
    await pool.end();
    console.log(`🔍 DEBUG: afterEach() cleanup completed`);
  }
});

// Global cleanup after all tests
afterAll(async () => {
  console.log('🧹 Global test cleanup...');
  try {
    // Check V113 deck before cleanup
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:1337/overpower''
    });
    
    const beforeResult = await pool.query('SELECT id, name, user_id FROM decks WHERE id = $1', ['be383a46-c8e0-4f85-8fc7-2a3b33048ced']);
    console.log('🔍 DEBUG: afterAll() - V113 deck before cleanup:', beforeResult.rows.length > 0 ? beforeResult.rows[0] : 'NOT FOUND');
    
    // Run comprehensive cleanup of all test data
    await integrationTestUtils.cleanupAllTestData();
    
    // Check V113 deck after cleanup
    const afterResult = await pool.query('SELECT id, name, user_id FROM decks WHERE id = $1', ['be383a46-c8e0-4f85-8fc7-2a3b33048ced']);
    console.log('🔍 DEBUG: afterAll() - V113 deck after cleanup:', afterResult.rows.length > 0 ? afterResult.rows[0] : 'NOT FOUND');
    
    await pool.end();
    
    // Close any remaining database connections
    const { DataSourceConfig } = require('../src/config/DataSourceConfig');
    const dataSourceConfig = DataSourceConfig.getInstance();
    await dataSourceConfig.close();
    console.log('✅ All database connections closed');
  } catch (error) {
    console.error('❌ Error during global cleanup:', error);
  }
});

// Export the app and logging function for use in tests
export { app, logDeckDeletion };
