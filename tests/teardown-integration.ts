// Global teardown for integration tests
// This ensures all database connections are properly closed

import { DataSourceConfig } from '../src/config/DataSourceConfig';

export default async function globalTeardown() {
  console.log('🧹 Cleaning up integration test resources...');
  
  try {
    // Close the main database connection pool
    const dataSourceConfig = DataSourceConfig.getInstance();
    await dataSourceConfig.close();
    console.log('✅ Database connection pool closed');
  } catch (error) {
    console.error('❌ Error during teardown:', error);
  }
  
  console.log('✅ Integration test cleanup completed');
}
