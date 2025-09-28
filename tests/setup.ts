import { execSync } from 'child_process';
import { Pool } from 'pg';

// Global test setup
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.PORT = '3001'; // Use different port for tests
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/overpower_test';
  
  const databaseUrl = process.env.DATABASE_URL;
  
  // Create test database if it doesn't exist
  try {
    const pool = new Pool({
      connectionString: databaseUrl.replace('/overpower_test', '/postgres')
    });
    
    await pool.query('CREATE DATABASE overpower_test');
    await pool.end();
  } catch (error) {
    // Database might already exist, that's fine
    console.log('Test database setup:', error instanceof Error ? error.message : String(error));
  }
  
  // Run migrations on test database
  try {
    execSync('npm run migrate', { 
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'pipe'
    });
  } catch (error) {
    console.log('Migration setup:', error instanceof Error ? error.message : String(error));
  }
});

afterAll(async () => {
  // Cleanup test database
  try {
    const databaseUrl = process.env.DATABASE_URL;
    const pool = new Pool({
      connectionString: databaseUrl?.replace('/overpower_test', '/postgres') || 'postgresql://postgres:password@localhost:5432/postgres'
    });
    
    await pool.query('DROP DATABASE IF EXISTS overpower_test');
    await pool.end();
  } catch (error) {
    console.log('Test database cleanup:', error instanceof Error ? error.message : String(error));
  }
});

// Global test utilities
export const testUtils = {
  // Helper to create test user
  createTestUser: async (userData: { name: string; email: string; role?: string }) => {
    // Implementation will be added as needed
  },
  
  // Helper to create test deck
  createTestDeck: async (userId: string, deckData: any) => {
    // Implementation will be added as needed
  },
  
  // Helper to clean up test data
  cleanupTestData: async () => {
    // Implementation will be added as needed
  }
};
