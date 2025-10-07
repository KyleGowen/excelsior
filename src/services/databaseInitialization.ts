import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execAsync = promisify(exec);

export class DatabaseInitializationService {
  private isInitialized = false;

  async initializeDatabase(): Promise<void> {
    if (this.isInitialized) {
      console.log('📊 Database already initialized, skipping...');
      return;
    }

    try {
      // Check if migrations should be skipped
      if (process.env.SKIP_MIGRATIONS === 'true') {
        console.log('⏭️ Skipping Flyway migrations (SKIP_MIGRATIONS=true)');
        this.isInitialized = true;
        console.log('✅ Database initialization completed (migrations skipped)!');
        return;
      }

      console.log('🔄 Initializing database with Flyway migrations...');
      
      // Run Flyway migrations (includes schema and data population)
      await this.runMigrations();
      
      this.isInitialized = true;
      console.log('✅ Database initialization completed successfully!');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      console.error('❌ Database initialization error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        SKIP_MIGRATIONS: process.env.SKIP_MIGRATIONS,
        NODE_ENV: process.env.NODE_ENV
      });
      throw error;
    }
  }

  private async runMigrations(): Promise<void> {
    try {
      console.log('🔄 Running Flyway migrations...');
      
      // In production (Docker), use Flyway CLI directly
      // In development, use npm script with ts-node
      const isProduction = process.env.NODE_ENV === 'production';
      
      let command: string;
      if (isProduction) {
        // Use Flyway CLI directly in production
        let flywayUrl = process.env.FLYWAY_URL;
        let flywayUser = process.env.FLYWAY_USER;
        let flywayPassword = process.env.FLYWAY_PASSWORD;
        
        // If FLYWAY_URL is not provided, construct it from DATABASE_URL
        if (!flywayUrl && process.env.DATABASE_URL) {
          const dbUrl = new URL(process.env.DATABASE_URL);
          // Construct JDBC URL without credentials
          flywayUrl = `jdbc:postgresql://${dbUrl.hostname}:${dbUrl.port}${dbUrl.pathname}${dbUrl.search}`;
          
          // Extract credentials from DATABASE_URL if not provided separately
          if (!flywayUser) flywayUser = dbUrl.username;
          if (!flywayPassword) flywayPassword = dbUrl.password;
        }
        
        // Fallback to default values if still not set
        flywayUser = flywayUser || 'postgres';
        flywayPassword = flywayPassword || 'password';
        
        command = `flyway -url="${flywayUrl}" -user="${flywayUser}" -password="${flywayPassword}" -locations="filesystem:/app/migrations" migrate`;
      } else {
        // Use npm script in development
        command = 'npm run migrate';
      }
      
      console.log(`🔧 Running command: ${command.replace(/-password="[^"]*"/, '-password="***"')}`);
      const { stdout, stderr } = await execAsync(command);
      
      if (stderr && !stderr.includes('WARNING')) {
        console.error('❌ Migration error:', stderr);
        throw new Error(stderr);
      }
      
      console.log('✅ Migrations completed successfully!');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  // Data population is now handled by Flyway SQL migrations
  // No need for separate TypeScript data migration

  async checkDatabaseStatus(): Promise<boolean> {
    try {
      console.log('🔍 Checking database status...');
      const { stdout, stderr } = await execAsync('npm run migrate:info');
      
      if (stderr && !stderr.includes('WARNING')) {
        console.error('❌ Database status check failed:', stderr);
        return false;
      }
      
      // Check if there are pending migrations
      const hasPendingMigrations = stdout.includes('Pending');
      if (hasPendingMigrations) {
        console.log('⚠️  Pending migrations detected, will run during initialization');
        return false;
      }
      
      console.log('✅ Database is up to date');
      return true;
    } catch (error) {
      console.error('❌ Database status check failed:', error);
      return false;
    }
  }

  async validateDatabase(): Promise<boolean> {
    try {
      console.log('🔍 Validating database migrations...');
      const { stdout, stderr } = await execAsync('npm run migrate:validate');
      
      if (stderr && !stderr.includes('WARNING')) {
        console.error('❌ Database validation failed:', stderr);
        return false;
      }
      
      console.log('✅ Database validation passed');
      return true;
    } catch (error) {
      console.error('❌ Database validation failed:', error);
      return false;
    }
  }
}
