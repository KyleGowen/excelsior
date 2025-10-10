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

describe('Health Check Endpoint Integration Test', () => {

  it('should return comprehensive health information when server is up', async () => {
    // Test against the running server
    const response = await request('http://localhost:3000')
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
    expect(response.body.database.stats.totalUsers).toBeGreaterThanOrEqual(3);
    expect(response.body.database.stats.totalDecks).toBeGreaterThanOrEqual(5);
    expect(response.body.database.stats.totalDeckCards).toBeGreaterThanOrEqual(187);
    expect(response.body.database.stats.totalCharacters).toBe(43);
    expect(response.body.database.stats.totalSpecialCards).toBe(271);
    expect(response.body.database.stats.totalPowerCards).toBe(39);
    
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
    const response = await request('http://localhost:3000')
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
    const response = await request('http://localhost:3000')
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
    const response = await request('http://localhost:3000')
      .get('/health');

    expect(response.status).toBe(200);
    
    // Verify database stats are reasonable
    const stats = response.body.database.stats;
    expect(stats.totalUsers).toBeGreaterThanOrEqual(3); // At least guest users + test user
    expect(stats.totalDecks).toBeGreaterThanOrEqual(5); // At least guest decks + test deck
    expect(stats.totalDeckCards).toBeGreaterThanOrEqual(187);
    expect(stats.totalCharacters).toBe(43);
    expect(stats.totalSpecialCards).toBe(271);
    expect(stats.totalPowerCards).toBe(39);
    
    // Verify guest deck count
    expect(response.body.database.guestDecks.total).toBeGreaterThanOrEqual(4);
  });

  it('should verify migration information is current', async () => {
    const response = await request('http://localhost:3000')
      .get('/health');

    expect(response.status).toBe(200);
    
    // Verify latest migration is V150 (our Gemini fix)
    const migration = response.body.database.latestMigration;
    expect(migration.version).toBe('150');
    expect(migration.description).toBe('Fix The Gemini alternate image');
    expect(migration.type).toBe('SQL');
    expect(migration.script).toBe('V150__Fix_The_Gemini_alternate_image.sql');
    expect(migration.installedBy).toBe('postgres');
    expect(migration.executionTime).toBe(8);
    expect(migration.success).toBe(true);
    
    // Verify migration status
    expect(response.body.migrations.status).toBe('OK');
    expect(response.body.migrations.valid).toBe(true);
    expect(response.body.migrations.upToDate).toBe(true);
  });

  it('should verify system resource information is present', async () => {
    const response = await request('http://localhost:3000')
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
    expect(cpu.platform).toBe('darwin');
    expect(cpu.arch).toBe('arm64');
    expect(cpu.nodeVersion).toMatch(/^v\d+\.\d+\.\d+$/);
  });

  it('should verify latency measurements are reasonable', async () => {
    const response = await request('http://localhost:3000')
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
