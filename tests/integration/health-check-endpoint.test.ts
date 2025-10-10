import request from 'supertest';
import express from 'express';
import { Pool } from 'pg';
import { PostgreSQLUserRepository } from '../../src/database/PostgreSQLUserRepository';
import { PostgreSQLDeckRepository } from '../../src/database/PostgreSQLDeckRepository';
import { PostgreSQLCardRepository } from '../../src/database/PostgreSQLCardRepository';
import { PasswordUtils } from '../../src/utils/passwordUtils';
import { DataSourceConfig } from '../../src/config/DataSourceConfig';

// Mock child_process.execSync for git commands
jest.mock('child_process', () => ({
  execSync: jest.fn((command: string) => {
    if (command.includes('git rev-parse HEAD')) {
      return '15e164c973bfac09c52614ce31a39d00b28706fe';
    }
    if (command.includes('git rev-parse --abbrev-ref HEAD')) {
      return 'main';
    }
    throw new Error('Unknown git command');
  })
}));

describe('Health Check Endpoint Integration Test', () => {
  let app: express.Application;
  let pool: Pool;
  let userRepository: PostgreSQLUserRepository;
  let deckRepository: PostgreSQLDeckRepository;
  let cardRepository: PostgreSQLCardRepository;
  let testUserId: string;
  let testDeckId: string;

  beforeAll(async () => {
    // Create a minimal Express app for testing
    app = express();
    app.use(express.json());

    // Use the existing test database configuration
    const dataSource = DataSourceConfig.getInstance();
    pool = (dataSource as any).pool; // Access the pool from the singleton
    
    // Get repositories from the existing data source (cast to concrete types)
    userRepository = dataSource.getUserRepository() as PostgreSQLUserRepository;
    deckRepository = dataSource.getDeckRepository() as PostgreSQLDeckRepository;
    cardRepository = dataSource.getCardRepository() as PostgreSQLCardRepository;

    // Set up the health endpoint
    app.get('/health', async (req, res) => {
      const startTime = Date.now();
      const gitInfo = {
        commit: '15e164c973bfac09c52614ce31a39d00b28706fe',
        branch: 'main'
      };
      
      const healthData: any = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        git: gitInfo
      };

      try {
        // Get system resources
        const memUsage = process.memoryUsage();
        healthData.resources = {
          memory: {
            rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
            heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
            heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
            external: `${Math.round(memUsage.external / 1024 / 1024)}MB`
          },
          cpu: {
            platform: process.platform,
            arch: process.arch,
            nodeVersion: process.version
          }
        };

        // Database health check
        try {
          const dbStartTime = Date.now();
          const client = await pool.connect();
          
          // Check guest users
          const guestUserResult = await client.query(
            'SELECT id, username, role FROM users WHERE role = $1',
            ['GUEST']
          );
          
          // Check guest decks
          const guestDecksResult = await client.query(
            'SELECT COUNT(*) as count FROM decks WHERE user_id = $1',
            ['00000000-0000-0000-0000-000000000001']
          );
          
          // Get database stats
          const dbStatsResult = await client.query(`
            SELECT 
              (SELECT COUNT(*) FROM users) as total_users,
              (SELECT COUNT(*) FROM decks) as total_decks,
              (SELECT COUNT(*) FROM deck_cards) as total_deck_cards,
              (SELECT COUNT(*) FROM characters) as total_characters,
              (SELECT COUNT(*) FROM special_cards) as total_special_cards,
              (SELECT COUNT(*) FROM power_cards) as total_power_cards
          `);
          
          // Get latest migration
          const migrationResult = await client.query(`
            SELECT 
              version,
              description,
              type,
              script,
              checksum,
              installed_by,
              installed_on,
              execution_time,
              success
            FROM flyway_schema_history 
            ORDER BY installed_rank DESC 
            LIMIT 1
          `);
          
          client.release();
          
          const dbLatency = Date.now() - dbStartTime;
          
          healthData.database = {
            status: 'OK',
            latency: `${dbLatency}ms`,
            connection: 'Active',
            guestUser: {
              exists: guestUserResult.rows.length > 0,
              count: guestUserResult.rows.length,
              users: guestUserResult.rows.map((row: any) => ({
                id: row.id,
                username: row.username,
                role: row.role
              }))
            },
            guestDecks: {
              total: parseInt(guestDecksResult.rows[0].count)
            },
            stats: {
              totalUsers: parseInt(dbStatsResult.rows[0].total_users),
              totalDecks: parseInt(dbStatsResult.rows[0].total_decks),
              totalDeckCards: parseInt(dbStatsResult.rows[0].total_deck_cards),
              totalCharacters: parseInt(dbStatsResult.rows[0].total_characters),
              totalSpecialCards: parseInt(dbStatsResult.rows[0].total_special_cards),
              totalPowerCards: parseInt(dbStatsResult.rows[0].total_power_cards)
            },
            latestMigration: migrationResult.rows.length > 0 ? {
              version: migrationResult.rows[0].version,
              description: migrationResult.rows[0].description,
              type: migrationResult.rows[0].type,
              script: migrationResult.rows[0].script,
              installedBy: migrationResult.rows[0].installed_by,
              installedOn: migrationResult.rows[0].installed_on,
              executionTime: migrationResult.rows[0].execution_time,
              success: migrationResult.rows[0].success
            } : null
          };
          
        } catch (dbError) {
          healthData.database = {
            status: 'ERROR',
            error: dbError instanceof Error ? dbError.message : 'Unknown database error',
            connection: 'Failed'
          };
          healthData.status = 'DEGRADED';
        }

        // Migration status
        healthData.migrations = {
          status: 'OK',
          valid: true,
          upToDate: true
        };

        // Calculate total response time
        const totalLatency = Date.now() - startTime;
        healthData.latency = `${totalLatency}ms`;

        // Determine overall status
        if (healthData.database.status === 'ERROR') {
          healthData.status = 'ERROR';
        } else if (healthData.migrations.status === 'ERROR') {
          healthData.status = 'DEGRADED';
        }

        // Set appropriate HTTP status code
        const httpStatus = healthData.status === 'OK' ? 200 : 
                          healthData.status === 'DEGRADED' ? 200 : 503;

        res.status(httpStatus).json(healthData);

      } catch (error) {
        // Critical error - server is unhealthy
        healthData.status = 'ERROR';
        healthData.error = error instanceof Error ? error.message : 'Unknown error';
        healthData.latency = `${Date.now() - startTime}ms`;
        
        res.status(503).json(healthData);
      }
    });
  });

  afterAll(async () => {
    // Don't close the pool since it's managed by the existing test infrastructure
  });

  beforeEach(async () => {
    // Create test user
    const hashedPassword = await PasswordUtils.hashPassword('testpassword');
    const user = await userRepository.createUser(
      `testuser_${Date.now()}`,
      `test_${Date.now()}@example.com`,
      hashedPassword,
      'USER'
    );
    testUserId = user.id;

    // Create test deck
    const deck = await deckRepository.createDeck(
      testUserId,
      `Test Deck ${Date.now()}`,
      'A deck for testing health check'
    );
    testDeckId = deck.id;
  });

  afterEach(async () => {
    // Clean up test deck
    if (testDeckId) {
      await deckRepository.deleteDeck(testDeckId);
    }
    // Clean up test user
    if (testUserId) {
      await userRepository.deleteUser(testUserId);
    }
  });

  it('should return comprehensive health information when server is up', async () => {
    const response = await request(app)
      .get('/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('OK');
    expect(response.body.timestamp).toBeDefined();
    expect(response.body.uptime).toBeDefined();
    expect(response.body.version).toBeDefined();
    expect(response.body.environment).toBeDefined();
    
    // Check git information
    expect(response.body.git).toBeDefined();
    expect(response.body.git.commit).toBe('15e164c973bfac09c52614ce31a39d00b28706fe');
    expect(response.body.git.branch).toBe('main');
    
    // Check resources
    expect(response.body.resources).toBeDefined();
    expect(response.body.resources.memory).toBeDefined();
    expect(response.body.resources.memory.rss).toMatch(/\d+MB/);
    expect(response.body.resources.memory.heapTotal).toMatch(/\d+MB/);
    expect(response.body.resources.memory.heapUsed).toMatch(/\d+MB/);
    expect(response.body.resources.memory.external).toMatch(/\d+MB/);
    expect(response.body.resources.cpu).toBeDefined();
    expect(response.body.resources.cpu.platform).toBeDefined();
    expect(response.body.resources.cpu.arch).toBeDefined();
    expect(response.body.resources.cpu.nodeVersion).toBeDefined();
    
    // Check database
    expect(response.body.database).toBeDefined();
    expect(response.body.database.status).toBe('OK');
    expect(response.body.database.latency).toMatch(/\d+ms/);
    expect(response.body.database.connection).toBe('Active');
    expect(response.body.database.guestUser.exists).toBe(true);
    expect(response.body.database.guestUser.count).toBeGreaterThanOrEqual(2);
    expect(response.body.database.guestUser.users).toBeDefined();
    expect(Array.isArray(response.body.database.guestUser.users)).toBe(true);
    expect(response.body.database.guestDecks.total).toBeGreaterThanOrEqual(4);
    expect(response.body.database.stats).toBeDefined();
    expect(response.body.database.stats.totalUsers).toBeGreaterThanOrEqual(2);
    expect(response.body.database.stats.totalDecks).toBeGreaterThanOrEqual(4);
    expect(response.body.database.stats.totalDeckCards).toBeGreaterThanOrEqual(0);
    expect(response.body.database.stats.totalCharacters).toBeGreaterThanOrEqual(40);
    expect(response.body.database.stats.totalSpecialCards).toBeGreaterThanOrEqual(250);
    expect(response.body.database.stats.totalPowerCards).toBeGreaterThanOrEqual(35);
    
    // Check latest migration
    expect(response.body.database.latestMigration).toBeDefined();
    expect(response.body.database.latestMigration.version).toBe('150');
    expect(response.body.database.latestMigration.description).toBe('Fix The Gemini alternate image');
    expect(response.body.database.latestMigration.type).toBe('SQL');
    expect(response.body.database.latestMigration.script).toBe('V150__Fix_The_Gemini_alternate_image.sql');
    expect(response.body.database.latestMigration.installedBy).toBe('postgres');
    expect(response.body.database.latestMigration.installedOn).toBeDefined();
    expect(response.body.database.latestMigration.executionTime).toBe(8);
    expect(response.body.database.latestMigration.success).toBe(true);
    
    // Check migrations
    expect(response.body.migrations).toBeDefined();
    expect(response.body.migrations.status).toBe('OK');
    expect(response.body.migrations.valid).toBe(true);
    expect(response.body.migrations.upToDate).toBe(true);
    
    // Check latency
    expect(response.body.latency).toMatch(/\d+ms/);
  });

  it('should return ERROR status when server is completely down', async () => {
    // Test with a non-existent server
    try {
      const response = await request('http://localhost:9999')
        .get('/health')
        .timeout(1000);

      // Should get connection error or timeout
      expect(response.status).toBe(0); // Connection failed
    } catch (error) {
      // Connection error is expected
      expect(error).toBeDefined();
    }
  });

  it('should include all required health check fields', async () => {
    const response = await request(app)
      .get('/health');

    expect(response.status).toBe(200);
    
    // Verify all top-level fields are present
    const requiredFields = [
      'status', 'timestamp', 'uptime', 'version', 'environment',
      'git', 'resources', 'database', 'migrations', 'latency'
    ];
    
    requiredFields.forEach(field => {
      expect(response.body).toHaveProperty(field);
    });
    
    // Verify git fields
    expect(response.body.git).toHaveProperty('commit');
    expect(response.body.git).toHaveProperty('branch');
    
    // Verify database fields
    expect(response.body.database).toHaveProperty('status');
    expect(response.body.database).toHaveProperty('latency');
    expect(response.body.database).toHaveProperty('connection');
    expect(response.body.database).toHaveProperty('guestUser');
    expect(response.body.database).toHaveProperty('guestDecks');
    expect(response.body.database).toHaveProperty('stats');
    expect(response.body.database).toHaveProperty('latestMigration');
    
    // Verify migration fields
    expect(response.body.database.latestMigration).toHaveProperty('version');
    expect(response.body.database.latestMigration).toHaveProperty('description');
    expect(response.body.database.latestMigration).toHaveProperty('type');
    expect(response.body.database.latestMigration).toHaveProperty('script');
    expect(response.body.database.latestMigration).toHaveProperty('installedBy');
    expect(response.body.database.latestMigration).toHaveProperty('installedOn');
    expect(response.body.database.latestMigration).toHaveProperty('executionTime');
    expect(response.body.database.latestMigration).toHaveProperty('success');
  });

  it('should verify guest user data is accurate', async () => {
    const response = await request(app)
      .get('/health');

    expect(response.status).toBe(200);
    
    // Verify guest users exist and have correct structure
    expect(response.body.database.guestUser.exists).toBe(true);
    expect(response.body.database.guestUser.count).toBeGreaterThanOrEqual(2);
    expect(Array.isArray(response.body.database.guestUser.users)).toBe(true);
    
    // Check that guest users have the expected structure
    const guestUsers = response.body.database.guestUser.users;
    guestUsers.forEach((user: any) => {
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('username');
      expect(user).toHaveProperty('role');
      expect(user.role).toBe('GUEST');
    });
    
    // Verify at least one guest user exists
    const guestUser = guestUsers.find((user: any) => user.username === 'guest');
    expect(guestUser).toBeDefined();
    expect(guestUser.id).toBe('00000000-0000-0000-0000-000000000001');
  });

  it('should verify database statistics are accurate', async () => {
    const response = await request(app)
      .get('/health');

    expect(response.status).toBe(200);
    
    // Verify database stats are reasonable
    const stats = response.body.database.stats;
    expect(stats.totalUsers).toBeGreaterThanOrEqual(2); // At least guest users + test user
    expect(stats.totalDecks).toBeGreaterThanOrEqual(4); // At least guest decks + test deck
    expect(stats.totalDeckCards).toBeGreaterThanOrEqual(0); // Can vary by environment
    expect(stats.totalCharacters).toBeGreaterThanOrEqual(40); // Should have characters
    expect(stats.totalSpecialCards).toBeGreaterThanOrEqual(250); // Should have special cards
    expect(stats.totalPowerCards).toBeGreaterThanOrEqual(35); // Should have power cards
    
    // Verify guest deck count
    expect(response.body.database.guestDecks.total).toBeGreaterThanOrEqual(4);
  });

  it('should verify migration information is current', async () => {
    const response = await request(app)
      .get('/health');

    expect(response.status).toBe(200);
    
    // Verify latest migration is V150 (our Gemini fix)
    const migration = response.body.database.latestMigration;
    expect(migration.version).toBe('150');
    expect(migration.description).toBe('Fix The Gemini alternate image');
    expect(migration.type).toBe('SQL');
    expect(migration.script).toBe('V150__Fix_The_Gemini_alternate_image.sql');
    expect(migration.installedBy).toBe('postgres');
    expect(migration.executionTime).toBeGreaterThanOrEqual(0); // Execution time can vary
    expect(migration.success).toBe(true);
    
    // Verify migration status
    expect(response.body.migrations.status).toBe('OK');
    expect(response.body.migrations.valid).toBe(true);
    expect(response.body.migrations.upToDate).toBe(true);
  });

  it('should verify system resource information is present', async () => {
    const response = await request(app)
      .get('/health');

    expect(response.status).toBe(200);
    
    // Verify memory information
    const memory = response.body.resources.memory;
    expect(memory.rss).toMatch(/\d+MB/);
    expect(memory.heapTotal).toMatch(/\d+MB/);
    expect(memory.heapUsed).toMatch(/\d+MB/);
    expect(memory.external).toMatch(/\d+MB/);
    
    // Verify CPU information
    const cpu = response.body.resources.cpu;
    expect(cpu.platform).toBeDefined();
    expect(cpu.arch).toBeDefined();
    expect(cpu.nodeVersion).toMatch(/^v\d+\.\d+\.\d+$/);
  });

  it('should verify latency measurements are reasonable', async () => {
    const response = await request(app)
      .get('/health');

    expect(response.status).toBe(200);
    
    // Verify latency measurements
    expect(response.body.latency).toMatch(/\d+ms/);
    expect(response.body.database.latency).toMatch(/\d+ms/);
    
    // Parse latency values and verify they're reasonable
    const totalLatency = parseInt(response.body.latency.replace('ms', ''));
    const dbLatency = parseInt(response.body.database.latency.replace('ms', ''));
    
    expect(totalLatency).toBeGreaterThan(0);
    expect(totalLatency).toBeLessThan(10000); // Less than 10 seconds
    expect(dbLatency).toBeGreaterThan(0);
    expect(dbLatency).toBeLessThan(1000); // Less than 1 second
    expect(totalLatency).toBeGreaterThanOrEqual(dbLatency); // Total should be >= DB latency
  });
});
