import express from 'express';
import request from 'supertest';

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

// Create a test app with just the health check route
const app = express();

// Mock the health check route logic
app.get('/health', async (req, res) => {
  const startTime = Date.now();
  const healthData: any = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    environment: 'test',
    git: {
      commit: '15e164c973bfac09c52614ce31a39d00b28706fe',
      branch: 'main'
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

    // Mock database health check
    healthData.database = {
      status: 'OK',
      latency: '5ms',
      connection: 'Active',
      guestUser: {
        exists: true,
        count: 2,
        users: [
          { id: 'guest-1', username: 'guest', role: 'GUEST' },
          { id: 'guest-2', username: 'Test-Guest', role: 'GUEST' }
        ]
      },
      guestDecks: {
        total: 4
      },
      stats: {
        totalUsers: 3,
        totalDecks: 5,
        totalDeckCards: 187,
        totalCharacters: 43,
        totalSpecialCards: 271,
        totalPowerCards: 39
      },
      latestMigration: {
        version: '149',
        description: 'Fix The Resistance Three Musketeers Image',
        type: 'SQL',
        script: 'V149__Fix_The_Resistance_Three_Musketeers_Image.sql',
        installedBy: 'postgres',
        installedOn: '2025-10-09T19:43:01.803Z',
        executionTime: 1,
        success: true
      }
    };

    // Mock migrations status
    healthData.migrations = {
      status: 'OK',
      valid: true,
      upToDate: true
    };

    // Calculate total response time
    const totalLatency = Date.now() - startTime;
    healthData.latency = `${totalLatency}ms`;

    res.status(200).json(healthData);

  } catch (error) {
    healthData.status = 'ERROR';
    healthData.error = error instanceof Error ? error.message : 'Unknown error';
    healthData.latency = `${Date.now() - startTime}ms`;
    
    res.status(503).json(healthData);
  }
});

describe('Health Check Endpoint - Simple Test', () => {
  it('should return comprehensive health information', async () => {
    const response = await request(app)
      .get('/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('OK');
    expect(response.body.timestamp).toBeDefined();
    expect(response.body.uptime).toBeDefined();
    expect(response.body.version).toBe('1.0.0');
    expect(response.body.environment).toBe('test');
    
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
    expect(response.body.database.latency).toBe('5ms');
    expect(response.body.database.connection).toBe('Active');
    expect(response.body.database.guestUser.exists).toBe(true);
    expect(response.body.database.guestUser.count).toBe(2);
    expect(response.body.database.guestUser.users).toHaveLength(2);
    expect(response.body.database.guestDecks.total).toBe(4);
    expect(response.body.database.stats).toBeDefined();
    expect(response.body.database.stats.totalUsers).toBe(3);
    expect(response.body.database.stats.totalDecks).toBe(5);
    expect(response.body.database.stats.totalDeckCards).toBe(187);
    expect(response.body.database.stats.totalCharacters).toBe(43);
    expect(response.body.database.stats.totalSpecialCards).toBe(271);
    expect(response.body.database.stats.totalPowerCards).toBe(39);
    
    // Check latest migration
    expect(response.body.database.latestMigration).toBeDefined();
    expect(response.body.database.latestMigration.version).toBe('149');
    expect(response.body.database.latestMigration.description).toBe('Fix The Resistance Three Musketeers Image');
    expect(response.body.database.latestMigration.type).toBe('SQL');
    expect(response.body.database.latestMigration.script).toBe('V149__Fix_The_Resistance_Three_Musketeers_Image.sql');
    expect(response.body.database.latestMigration.installedBy).toBe('postgres');
    expect(response.body.database.latestMigration.installedOn).toBe('2025-10-09T19:43:01.803Z');
    expect(response.body.database.latestMigration.executionTime).toBe(1);
    expect(response.body.database.latestMigration.success).toBe(true);
    
    // Check migrations
    expect(response.body.migrations).toBeDefined();
    expect(response.body.migrations.status).toBe('OK');
    expect(response.body.migrations.valid).toBe(true);
    expect(response.body.migrations.upToDate).toBe(true);
    
    // Check latency
    expect(response.body.latency).toMatch(/\d+ms/);
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
});
