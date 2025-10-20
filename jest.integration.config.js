module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/tests/integration/**/*.test.ts',
    '**/tests/integration/**/*.spec.ts'
  ],
  testPathIgnorePatterns: [
    '.*/tests/integration/character.*\\.test\\.ts$',
    '.*/tests/integration/reserve-character.*\\.test\\.ts$',
    '.*/tests/integration/power.*\\.test\\.ts$',
    '.*/tests/integration/teamwork.*\\.test\\.ts$',
    '.*/tests/integration/event-mission-filtering-integration\\.test\\.ts$',
    '.*/tests/integration/special-character-threat-display\\.test\\.ts$',
    '.*/tests/integration/guest-reserve-character-integration\\.test\\.ts$',
    '.*/tests/integration/deck-ownership-security.*\\.test\\.ts$',
    '.*/tests/integration/deck-save-security.*\\.test\\.ts$',
    '.*/tests/integration/deck-save-frontend-validation\\.test\\.ts$'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts', // Exclude main entry point from coverage
  ],
  coverageDirectory: 'coverage/integration',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup-integration.ts'],
  globalTeardown: '<rootDir>/tests/teardown-integration.ts',
  testTimeout: 30000, // Longer timeout for integration tests
  verbose: true,
  // Environment variables for integration tests
  testEnvironmentOptions: {
    NODE_ENV: 'test',
    PORT: '3000'
  },
  // Run integration tests sequentially to avoid port conflicts
  maxWorkers: 1
};
