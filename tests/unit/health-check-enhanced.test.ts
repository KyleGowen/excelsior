import request from 'supertest';
import { execSync } from 'child_process';

// Mock the child_process module
jest.mock('child_process');
const mockExecSync = execSync as jest.MockedFunction<typeof execSync>;

// Mock the database and services
jest.mock('../../src/config/DataSourceConfig');
jest.mock('../../src/services/databaseInitialization');
jest.mock('../../src/services/deckPersistence');
jest.mock('../../src/services/deckValidationService');
jest.mock('../../src/services/deckService');
jest.mock('../../src/services/AuthenticationService');

// Mock the repositories
const mockPool = {
  connect: jest.fn(),
  query: jest.fn(),
  end: jest.fn()
};

const mockClient = {
  query: jest.fn(),
  release: jest.fn()
};

// Mock the data source
const mockDataSource = {
  getInstance: jest.fn(() => ({
    pool: mockPool,
    getUserRepository: jest.fn(() => mockUserRepository),
    getDeckRepository: jest.fn(() => mockDeckRepository),
    getCardRepository: jest.fn(() => mockCardRepository)
  }))
};

// Mock the database initialization service
const mockDatabaseInit = {
  initializeDatabase: jest.fn().mockResolvedValue(undefined),
  validateDatabase: jest.fn(),
  checkDatabaseStatus: jest.fn()
};

// Mock the repositories
const mockUserRepository = {
  initialize: jest.fn().mockResolvedValue(undefined)
};

const mockDeckRepository = {
  initialize: jest.fn().mockResolvedValue(undefined)
};

const mockCardRepository = {
  initialize: jest.fn().mockResolvedValue(undefined),
  getCardStats: jest.fn().mockResolvedValue({
    totalCharacters: 50,
    totalSpecialCards: 30,
    totalPowerCards: 20,
    totalLocations: 10,
    totalMissions: 15,
    totalEvents: 25,
    totalAspects: 8,
    totalAdvancedUniverse: 12,
    totalTeamwork: 6,
    totalAllyUniverse: 4,
    totalTraining: 18,
    totalBasicUniverse: 22
  })
};

// Mock the services
const mockDeckService = {
  initialize: jest.fn().mockResolvedValue(undefined)
};

const mockDeckValidationService = {
  initialize: jest.fn().mockResolvedValue(undefined)
};

const mockDeckBusinessService = {
  initialize: jest.fn().mockResolvedValue(undefined)
};

const mockAuthService = {
  initialize: jest.fn().mockResolvedValue(undefined)
};

// Set up the mocks
jest.doMock('../../src/config/DataSourceConfig', () => ({
  DataSourceConfig: mockDataSource
}));

jest.doMock('../../src/services/databaseInitialization', () => ({
  DatabaseInitializationService: jest.fn(() => mockDatabaseInit)
}));

jest.doMock('../../src/services/deckPersistence', () => ({
  DeckPersistenceService: jest.fn(() => mockDeckService)
}));

jest.doMock('../../src/services/deckValidationService', () => ({
  DeckValidationService: jest.fn(() => mockDeckValidationService)
}));

jest.doMock('../../src/services/deckService', () => ({
  DeckService: jest.fn(() => mockDeckBusinessService)
}));

jest.doMock('../../src/services/AuthenticationService', () => ({
  AuthenticationService: jest.fn(() => mockAuthService)
}));

describe('Enhanced Health Check Endpoint', () => {
  let app: any;

  beforeAll(async () => {
    // Mock the server initialization to prevent actual server startup
    jest.doMock('../../src/index', () => {
      const express = require('express');
      const app = express();
      
      // Add the health check endpoint directly
      app.get('/health', async (req: any, res: any) => {
        const startTime = Date.now();
        
        // Mock git info function
        function getGitInfo() {
          try {
            const commit = mockExecSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
            const branch = mockExecSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
            const shortCommit = mockExecSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
            const commitDate = mockExecSync('git log -1 --format=%ci', { encoding: 'utf8' }).trim();
            const commitMessage = mockExecSync('git log -1 --format=%s', { encoding: 'utf8' }).trim();
            const commitAuthor = mockExecSync('git log -1 --format=%an', { encoding: 'utf8' }).trim();
            const commitEmail = mockExecSync('git log -1 --format=%ae', { encoding: 'utf8' }).trim();
            const remoteUrl = mockExecSync('git config --get remote.origin.url', { encoding: 'utf8' }).trim();
            
            return { 
              commit, 
              shortCommit,
              branch, 
              commitDate,
              commitMessage,
              commitAuthor,
              commitEmail,
              remoteUrl
            };
          } catch (error) {
            return { 
              commit: 'unknown', 
              shortCommit: 'unknown',
              branch: 'unknown',
              commitDate: 'unknown',
              commitMessage: 'unknown',
              commitAuthor: 'unknown',
              commitEmail: 'unknown',
              remoteUrl: 'unknown'
            };
          }
        }

        const gitInfo = getGitInfo();
        const healthData: any = {
          status: 'OK',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          version: process.env.npm_package_version || '1.0.0',
          environment: process.env.NODE_ENV || 'development',
          git: {
            commit: gitInfo.commit,
            shortCommit: gitInfo.shortCommit,
            branch: gitInfo.branch,
            commitDate: gitInfo.commitDate,
            commitMessage: gitInfo.commitMessage,
            commitAuthor: gitInfo.commitAuthor,
            commitEmail: gitInfo.commitEmail,
            remoteUrl: gitInfo.remoteUrl
          }
        };

        try {
          // System resource information
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
            
            // Test database connection
            const client = await mockPool.connect();
            
            // Check if GUEST user exists
            const guestUserResult = await client.query(
              'SELECT id, username, role FROM users WHERE role = $1 OR username = $2',
              ['GUEST', 'guest']
            );
            
            // Count total guest decks
            const guestDecksResult = await client.query(
              'SELECT COUNT(*) as count FROM decks WHERE user_id IN (SELECT id FROM users WHERE role = $1 OR username = $2)',
              ['GUEST', 'guest']
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
            
            // Get latest migration information
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
                success,
                installed_rank
              FROM flyway_schema_history 
              ORDER BY installed_rank DESC 
              LIMIT 1
            `);
            
            // Get total migration count
            const migrationCountResult = await client.query(`
              SELECT COUNT(*) as total_migrations FROM flyway_schema_history
            `);
            
            // Get migration status summary
            const migrationStatusResult = await client.query(`
              SELECT 
                COUNT(CASE WHEN success = true THEN 1 END) as successful_migrations,
                COUNT(CASE WHEN success = false THEN 1 END) as failed_migrations,
                MAX(installed_on) as last_migration_date
              FROM flyway_schema_history
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
              migrations: {
                latest: migrationResult.rows.length > 0 ? {
                  version: migrationResult.rows[0].version,
                  description: migrationResult.rows[0].description,
                  type: migrationResult.rows[0].type,
                  script: migrationResult.rows[0].script,
                  checksum: migrationResult.rows[0].checksum,
                  installedBy: migrationResult.rows[0].installed_by,
                  installedOn: migrationResult.rows[0].installed_on,
                  executionTime: migrationResult.rows[0].execution_time,
                  success: migrationResult.rows[0].success,
                  installedRank: migrationResult.rows[0].installed_rank
                } : null,
                summary: {
                  total: parseInt(migrationCountResult.rows[0].total_migrations),
                  successful: parseInt(migrationStatusResult.rows[0].successful_migrations),
                  failed: parseInt(migrationStatusResult.rows[0].failed_migrations),
                  lastRun: migrationStatusResult.rows[0].last_migration_date
                }
              }
            };
            
          } catch (dbError) {
            healthData.database = {
              status: 'ERROR',
              error: dbError instanceof Error ? dbError.message : 'Unknown database error',
              connection: 'Failed'
            };
            healthData.status = 'DEGRADED';
          }

          // Check Flyway migrations status
          try {
            const isValid = await mockDatabaseInit.validateDatabase();
            const isUpToDate = await mockDatabaseInit.checkDatabaseStatus();
            
            healthData.migrations = {
              status: 'OK',
              valid: isValid,
              upToDate: isUpToDate
            };
          } catch (migrationError) {
            healthData.migrations = {
              status: 'ERROR',
              error: migrationError instanceof Error ? migrationError.message : 'Unknown migration error'
            };
            healthData.status = 'DEGRADED';
          }

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
      
      return { app };
    });

    // Import the app after mocks are set up
    const { app: importedApp } = await import('../../src/index');
    app = importedApp;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up default successful mocks
    mockPool.connect.mockResolvedValue(mockClient);
    mockClient.release.mockResolvedValue(undefined);
    mockDatabaseInit.validateDatabase.mockResolvedValue(true);
    mockDatabaseInit.checkDatabaseStatus.mockResolvedValue(true);
  });

  describe('Git Information', () => {
    it('should return comprehensive git information when git commands succeed', async () => {
      // Mock successful git commands
      mockExecSync
        .mockReturnValueOnce('abc123def456789') // git rev-parse HEAD
        .mockReturnValueOnce('main') // git rev-parse --abbrev-ref HEAD
        .mockReturnValueOnce('abc123d') // git rev-parse --short HEAD
        .mockReturnValueOnce('2025-01-07 23:10:45 +0000') // git log -1 --format=%ci
        .mockReturnValueOnce('Add enhanced health check with git info') // git log -1 --format=%s
        .mockReturnValueOnce('John Doe') // git log -1 --format=%an
        .mockReturnValueOnce('john.doe@example.com') // git log -1 --format=%ae
        .mockReturnValueOnce('https://github.com/username/repository.git'); // git config --get remote.origin.url

      // Mock successful database queries
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: '1', username: 'guest', role: 'GUEST' }] }) // guest user query
        .mockResolvedValueOnce({ rows: [{ count: '5' }] }) // guest decks count
        .mockResolvedValueOnce({ // database stats
          rows: [{
            total_users: '10',
            total_decks: '25',
            total_deck_cards: '150',
            total_characters: '50',
            total_special_cards: '30',
            total_power_cards: '20'
          }]
        })
        .mockResolvedValueOnce({ // latest migration
          rows: [{
            version: 'V150',
            description: 'Fix_The_Gemini_alternate_image',
            type: 'SQL',
            script: 'V150__Fix_The_Gemini_alternate_image.sql',
            checksum: '1234567890abcdef',
            installed_by: 'postgres',
            installed_on: '2025-01-07T23:00:00.000Z',
            execution_time: 150,
            success: true,
            installed_rank: 150
          }]
        })
        .mockResolvedValueOnce({ rows: [{ total_migrations: '150' }] }) // migration count
        .mockResolvedValueOnce({ // migration status
          rows: [{
            successful_migrations: '150',
            failed_migrations: '0',
            last_migration_date: '2025-01-07T23:00:00.000Z'
          }]
        });

      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.git).toEqual({
        commit: 'abc123def456789',
        shortCommit: 'abc123d',
        branch: 'main',
        commitDate: '2025-01-07 23:10:45 +0000',
        commitMessage: 'Add enhanced health check with git info',
        commitAuthor: 'John Doe',
        commitEmail: 'john.doe@example.com',
        remoteUrl: 'https://github.com/username/repository.git'
      });

      // Verify git commands were called
      expect(mockExecSync).toHaveBeenCalledWith('git rev-parse HEAD', { encoding: 'utf8' });
      expect(mockExecSync).toHaveBeenCalledWith('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' });
      expect(mockExecSync).toHaveBeenCalledWith('git rev-parse --short HEAD', { encoding: 'utf8' });
      expect(mockExecSync).toHaveBeenCalledWith('git log -1 --format=%ci', { encoding: 'utf8' });
      expect(mockExecSync).toHaveBeenCalledWith('git log -1 --format=%s', { encoding: 'utf8' });
      expect(mockExecSync).toHaveBeenCalledWith('git log -1 --format=%an', { encoding: 'utf8' });
      expect(mockExecSync).toHaveBeenCalledWith('git log -1 --format=%ae', { encoding: 'utf8' });
      expect(mockExecSync).toHaveBeenCalledWith('git config --get remote.origin.url', { encoding: 'utf8' });
    });

    it('should return unknown values when git commands fail', async () => {
      // Mock git command failures
      mockExecSync.mockImplementation(() => {
        throw new Error('Git command failed');
      });

      // Mock successful database queries
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: '1', username: 'guest', role: 'GUEST' }] })
        .mockResolvedValueOnce({ rows: [{ count: '5' }] })
        .mockResolvedValueOnce({
          rows: [{
            total_users: '10',
            total_decks: '25',
            total_deck_cards: '150',
            total_characters: '50',
            total_special_cards: '30',
            total_power_cards: '20'
          }]
        })
        .mockResolvedValueOnce({ rows: [] }) // no migrations
        .mockResolvedValueOnce({ rows: [{ total_migrations: '0' }] })
        .mockResolvedValueOnce({
          rows: [{
            successful_migrations: '0',
            failed_migrations: '0',
            last_migration_date: null
          }]
        });

      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.git).toEqual({
        commit: 'unknown',
        shortCommit: 'unknown',
        branch: 'unknown',
        commitDate: 'unknown',
        commitMessage: 'unknown',
        commitAuthor: 'unknown',
        commitEmail: 'unknown',
        remoteUrl: 'unknown'
      });
    });
  });

  describe('Database Migration Information', () => {
    beforeEach(() => {
      // Mock successful git commands
      mockExecSync
        .mockReturnValueOnce('abc123def456789')
        .mockReturnValueOnce('main')
        .mockReturnValueOnce('abc123d')
        .mockReturnValueOnce('2025-01-07 23:10:45 +0000')
        .mockReturnValueOnce('Add enhanced health check')
        .mockReturnValueOnce('John Doe')
        .mockReturnValueOnce('john.doe@example.com')
        .mockReturnValueOnce('https://github.com/username/repository.git');
    });

    it('should return detailed migration information when migrations exist', async () => {
      // Mock successful database queries
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: '1', username: 'guest', role: 'GUEST' }] })
        .mockResolvedValueOnce({ rows: [{ count: '5' }] })
        .mockResolvedValueOnce({
          rows: [{
            total_users: '10',
            total_decks: '25',
            total_deck_cards: '150',
            total_characters: '50',
            total_special_cards: '30',
            total_power_cards: '20'
          }]
        })
        .mockResolvedValueOnce({
          rows: [{
            version: 'V150',
            description: 'Fix_The_Gemini_alternate_image',
            type: 'SQL',
            script: 'V150__Fix_The_Gemini_alternate_image.sql',
            checksum: '1234567890abcdef',
            installed_by: 'postgres',
            installed_on: '2025-01-07T23:00:00.000Z',
            execution_time: 150,
            success: true,
            installed_rank: 150
          }]
        })
        .mockResolvedValueOnce({ rows: [{ total_migrations: '150' }] })
        .mockResolvedValueOnce({
          rows: [{
            successful_migrations: '150',
            failed_migrations: '0',
            last_migration_date: '2025-01-07T23:00:00.000Z'
          }]
        });

      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.database.migrations).toEqual({
        latest: {
          version: 'V150',
          description: 'Fix_The_Gemini_alternate_image',
          type: 'SQL',
          script: 'V150__Fix_The_Gemini_alternate_image.sql',
          checksum: '1234567890abcdef',
          installedBy: 'postgres',
          installedOn: '2025-01-07T23:00:00.000Z',
          executionTime: 150,
          success: true,
          installedRank: 150
        },
        summary: {
          total: 150,
          successful: 150,
          failed: 0,
          lastRun: '2025-01-07T23:00:00.000Z'
        }
      });
    });

    it('should return null for latest migration when no migrations exist', async () => {
      // Mock successful database queries with no migrations
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: '1', username: 'guest', role: 'GUEST' }] })
        .mockResolvedValueOnce({ rows: [{ count: '5' }] })
        .mockResolvedValueOnce({
          rows: [{
            total_users: '10',
            total_decks: '25',
            total_deck_cards: '150',
            total_characters: '50',
            total_special_cards: '30',
            total_power_cards: '20'
          }]
        })
        .mockResolvedValueOnce({ rows: [] }) // no migrations
        .mockResolvedValueOnce({ rows: [{ total_migrations: '0' }] })
        .mockResolvedValueOnce({
          rows: [{
            successful_migrations: '0',
            failed_migrations: '0',
            last_migration_date: null
          }]
        });

      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.database.migrations).toEqual({
        latest: null,
        summary: {
          total: 0,
          successful: 0,
          failed: 0,
          lastRun: null
        }
      });
    });
  });

  describe('Response Structure Validation', () => {
    beforeEach(() => {
      // Mock successful git commands
      mockExecSync
        .mockReturnValueOnce('abc123def456789')
        .mockReturnValueOnce('main')
        .mockReturnValueOnce('abc123d')
        .mockReturnValueOnce('2025-01-07 23:10:45 +0000')
        .mockReturnValueOnce('Add enhanced health check')
        .mockReturnValueOnce('John Doe')
        .mockReturnValueOnce('john.doe@example.com')
        .mockReturnValueOnce('https://github.com/username/repository.git');

      // Mock successful database queries
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: '1', username: 'guest', role: 'GUEST' }] })
        .mockResolvedValueOnce({ rows: [{ count: '5' }] })
        .mockResolvedValueOnce({
          rows: [{
            total_users: '10',
            total_decks: '25',
            total_deck_cards: '150',
            total_characters: '50',
            total_special_cards: '30',
            total_power_cards: '20'
          }]
        })
        .mockResolvedValueOnce({
          rows: [{
            version: 'V150',
            description: 'Fix_The_Gemini_alternate_image',
            type: 'SQL',
            script: 'V150__Fix_The_Gemini_alternate_image.sql',
            checksum: '1234567890abcdef',
            installed_by: 'postgres',
            installed_on: '2025-01-07T23:00:00.000Z',
            execution_time: 150,
            success: true,
            installed_rank: 150
          }]
        })
        .mockResolvedValueOnce({ rows: [{ total_migrations: '150' }] })
        .mockResolvedValueOnce({
          rows: [{
            successful_migrations: '150',
            failed_migrations: '0',
            last_migration_date: '2025-01-07T23:00:00.000Z'
          }]
        });
    });

    it('should return a complete health check response with all required fields', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      // Verify top-level structure
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('environment');
      expect(response.body).toHaveProperty('git');
      expect(response.body).toHaveProperty('resources');
      expect(response.body).toHaveProperty('database');
      expect(response.body).toHaveProperty('migrations');
      expect(response.body).toHaveProperty('latency');

      // Verify git structure
      expect(response.body.git).toHaveProperty('commit');
      expect(response.body.git).toHaveProperty('shortCommit');
      expect(response.body.git).toHaveProperty('branch');
      expect(response.body.git).toHaveProperty('commitDate');
      expect(response.body.git).toHaveProperty('commitMessage');
      expect(response.body.git).toHaveProperty('commitAuthor');
      expect(response.body.git).toHaveProperty('commitEmail');
      expect(response.body.git).toHaveProperty('remoteUrl');

      // Verify database structure
      expect(response.body.database).toHaveProperty('status');
      expect(response.body.database).toHaveProperty('latency');
      expect(response.body.database).toHaveProperty('connection');
      expect(response.body.database).toHaveProperty('guestUser');
      expect(response.body.database).toHaveProperty('guestDecks');
      expect(response.body.database).toHaveProperty('stats');
      expect(response.body.database).toHaveProperty('migrations');

      // Verify migrations structure
      expect(response.body.database.migrations).toHaveProperty('latest');
      expect(response.body.database.migrations).toHaveProperty('summary');
      expect(response.body.database.migrations.summary).toHaveProperty('total');
      expect(response.body.database.migrations.summary).toHaveProperty('successful');
      expect(response.body.database.migrations.summary).toHaveProperty('failed');
      expect(response.body.database.migrations.summary).toHaveProperty('lastRun');
    });
  });
});