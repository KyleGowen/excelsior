import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execAsync = promisify(exec);

interface FlywayConfig {
  url: string;
  user: string;
  password: string;
  schemas: string;
  locations: string;
  baselineOnMigrate: boolean;
  validateOnMigrate: boolean;
  cleanDisabled: boolean;
  baselineVersion: string;
  baselineDescription: string;
}

class FlywayRunner {
  private config: FlywayConfig;

  constructor() {
    this.config = {
      url: process.env.DATABASE_URL || 'jdbc:postgresql://localhost:1337/overpower',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      schemas: 'public',
      locations: 'filesystem:migrations',
      baselineOnMigrate: true,
      validateOnMigrate: true,
      cleanDisabled: false,
      baselineVersion: '0',
      baselineDescription: 'Initial baseline'
    };
  }

  private buildFlywayCommand(command: string): string {
    const configPath = path.join(process.cwd(), 'conf', 'flyway.conf');
    return `flyway -configFiles=${configPath} ${command}`;
  }

  async migrate(): Promise<void> {
    try {
      console.log('🔄 Running Flyway migrations...');
      const { stdout, stderr } = await execAsync(this.buildFlywayCommand('migrate'));
      
      if (stderr && !stderr.includes('WARNING')) {
        console.error('❌ Migration error:', stderr);
        throw new Error(stderr);
      }
      
      console.log('✅ Migrations completed successfully!');
      console.log(stdout);
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  async info(): Promise<void> {
    try {
      console.log('📊 Getting migration info...');
      const { stdout, stderr } = await execAsync(this.buildFlywayCommand('info'));
      
      if (stderr && !stderr.includes('WARNING')) {
        console.error('❌ Info error:', stderr);
        throw new Error(stderr);
      }
      
      console.log(stdout);
    } catch (error) {
      console.error('❌ Info command failed:', error);
      throw error;
    }
  }

  async validate(): Promise<void> {
    try {
      console.log('🔍 Validating migrations...');
      const { stdout, stderr } = await execAsync(this.buildFlywayCommand('validate'));
      
      if (stderr && !stderr.includes('WARNING')) {
        console.error('❌ Validation error:', stderr);
        throw new Error(stderr);
      }
      
      console.log('✅ Validation completed successfully!');
      console.log(stdout);
    } catch (error) {
      console.error('❌ Validation failed:', error);
      throw error;
    }
  }

  async repair(): Promise<void> {
    try {
      console.log('🔧 Repairing migration history...');
      const { stdout, stderr } = await execAsync(this.buildFlywayCommand('repair'));
      
      if (stderr && !stderr.includes('WARNING')) {
        console.error('❌ Repair error:', stderr);
        throw new Error(stderr);
      }
      
      console.log('✅ Repair completed successfully!');
      console.log(stdout);
    } catch (error) {
      console.error('❌ Repair failed:', error);
      throw error;
    }
  }

  async clean(): Promise<void> {
    try {
      console.log('🧹 Cleaning database...');
      const { stdout, stderr } = await execAsync(this.buildFlywayCommand('clean'));
      
      if (stderr && !stderr.includes('WARNING')) {
        console.error('❌ Clean error:', stderr);
        throw new Error(stderr);
      }
      
      console.log('✅ Database cleaned successfully!');
      console.log(stdout);
    } catch (error) {
      console.error('❌ Clean failed:', error);
      throw error;
    }
  }
}

// CLI interface
async function main() {
  const command = process.argv[2] || 'migrate';
  const flyway = new FlywayRunner();

  try {
    switch (command) {
      case 'migrate':
        await flyway.migrate();
        break;
      case 'info':
        await flyway.info();
        break;
      case 'validate':
        await flyway.validate();
        break;
      case 'repair':
        await flyway.repair();
        break;
      case 'clean':
        await flyway.clean();
        break;
      default:
        console.log('Available commands: migrate, info, validate, repair, clean');
        process.exit(1);
    }
  } catch (error) {
    console.error('Command failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { FlywayRunner };
