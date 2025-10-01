#!/usr/bin/env node

/**
 * Script to clean up all test data from the database
 * This removes all test decks, deck cards, and test users
 */

const { Pool } = require('pg');

async function cleanupAllTestData() {
  const pool = new Pool({
    connectionString: 'postgresql://postgres:password@localhost:1337/overpower'
  });
  
  try {
    console.log('🧹 Starting comprehensive test data cleanup...');
    
    // First, delete all deck cards for test decks
    await pool.query(`
      DELETE FROM deck_cards WHERE deck_id IN (
        SELECT id FROM decks WHERE 
          name LIKE ANY(ARRAY[
            'Character Layout Test Deck',
            'Test Navigation Deck', 
            'RO Deck%',
            'AGL Deck%',
            'um_it_%',
            'Test Deck for Guest Restrictions%',
            'Guest Test Deck',
            'Guest Attempted Deck',
            'User Deck',
            'Admin Deck',
            'Guest Modified Deck',
            'Updated Deck Name%',
            'Admin Modified Deck',
            'Deletion Test Deck',
            'Regular User Test Deck',
            'Another Regular User Deck',
            'Deck to Modify',
            'Modified Deck Name',
            'Admin Test Deck',
            'Another Admin Deck',
            'Admin Deck to Modify',
            'Modified Admin Deck',
            'Unauthenticated Deck',
            'Test Deck%',
            'Valid Deck',
            'Invalid Deck',
            'Modified Guest Deck',
            'Test Deck 0 Characters%',
            'Test Deck 1 Character%',
            'Test Deck 4 Characters%',
            'Test Deck 5 Characters%',
            'Test Deck 6+ Characters%',
            'Test Deck Undefined Characters%',
            'Test Deck Null Characters%',
            'Test Deck Empty Characters%',
            'Guest Deck',
            'Public Deck',
            'Test Card Deck',
            'A deck for testing card management',
            'This should succeed',
            'A test deck for integration testing',
            'A deck to test guest access functionality',
            'A deck to test read-only mode functionality',
            'A deck to test guest editing restrictions',
            'A deck specifically for testing deletion',
            'Test deck for guest user verification',
            'Test deck description',
            'Test Description',
            'Empty Deck'
          ])
          OR description LIKE ANY(ARRAY[
            'A deck to test guest editing restrictions',
            'A deck specifically for testing deletion',
            'A test deck for integration testing',
            'A deck for testing card management',
            'A deck to test guest access functionality',
            'A deck to test read-only mode functionality',
            'Test deck for guest user verification',
            'Test deck description',
            'Test Description'
          ])
          OR name LIKE 'Test Deck%'
          OR name LIKE 'Updated Deck Name%'
          OR name LIKE 'Deck Builder Test User%'
      )
    `);
    
    // Then delete the test decks
    const deckResult = await pool.query(`
      DELETE FROM decks WHERE 
        name LIKE ANY(ARRAY[
          'Character Layout Test Deck',
          'Test Navigation Deck', 
          'RO Deck%',
          'AGL Deck%',
          'um_it_%',
          'Test Deck for Guest Restrictions%',
          'Guest Test Deck',
          'Guest Attempted Deck',
          'User Deck',
          'Admin Deck',
          'Guest Modified Deck',
          'Updated Deck Name%',
          'Admin Modified Deck',
          'Deletion Test Deck',
          'Regular User Test Deck',
          'Another Regular User Deck',
          'Deck to Modify',
          'Modified Deck Name',
          'Admin Test Deck',
          'Another Admin Deck',
          'Admin Deck to Modify',
          'Modified Admin Deck',
          'Unauthenticated Deck',
          'Test Deck%',
          'Valid Deck',
          'Invalid Deck',
          'Modified Guest Deck',
          'Test Deck 0 Characters%',
          'Test Deck 1 Character%',
          'Test Deck 4 Characters%',
          'Test Deck 5 Characters%',
          'Test Deck 6+ Characters%',
          'Test Deck Undefined Characters%',
          'Test Deck Null Characters%',
          'Test Deck Empty Characters%',
          'Guest Deck',
          'Public Deck',
          'Test Card Deck',
          'A deck for testing card management',
          'This should succeed',
          'A test deck for integration testing',
          'A deck to test guest access functionality',
          'A deck to test read-only mode functionality',
          'A deck to test guest editing restrictions',
          'A deck specifically for testing deletion',
          'Test deck for guest user verification',
          'Test deck description',
          'Test Description',
          'Empty Deck'
        ])
        OR description LIKE ANY(ARRAY[
          'A deck to test guest editing restrictions',
          'A deck specifically for testing deletion',
          'A test deck for integration testing',
          'A deck for testing card management',
          'A deck to test guest access functionality',
          'A deck to test read-only mode functionality',
          'Test deck for guest user verification',
          'Test deck description',
          'Test Description'
        ])
        OR name LIKE 'Test Deck%'
        OR name LIKE 'Updated Deck Name%'
        OR name LIKE 'Deck Builder Test User%'
    `);
    
    // Finally, delete test users
    const userResult = await pool.query("DELETE FROM users WHERE (username ILIKE 'charlayout_%' OR username ILIKE 'decknavtest_%' OR username ILIKE 'ro_%' OR username ILIKE 'agl_%' OR username ILIKE 'um_it_%' OR username ILIKE 'Deck Builder Test User%' OR username ILIKE 'Test Deck Creator%' OR username IN ('usernameonly', 'middlewareuser', 'sessionuser', 'crosstestuser') OR email LIKE 'testuser_%@example.com' OR email LIKE 'usernameonly_%@example.com' OR email LIKE 'decknavtest_%@example.com' OR email LIKE 'charlayout_%@example.com' OR email LIKE 'ro-%@it.local' OR email LIKE 'agl-%@it.local' OR email LIKE 'crosstest_%@example.com') AND username NOT IN ('guest','kyle')");
    
    console.log(`✅ Cleanup completed: ${deckResult.rowCount} decks deleted, ${userResult.rowCount} users deleted`);
  } finally {
    await pool.end();
  }
}

async function main() {
  try {
    await cleanupAllTestData();
    console.log('✅ Test data cleanup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during test data cleanup:', error);
    process.exit(1);
  }
}

main();
