module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/tests/integration/deckBuilding.test.ts'
  ],
  transform: {
    '^.+\\\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts', // Exclude main entry point from coverage
  ],
  coverageDirectory: 'coverage/integration',
  coverageReporters: ['text', 'lcov', 'html'],
  // Custom setup for deckBuilding test - no global cleanup
  setupFilesAfterEnv: ['<rootDir>/tests/setup-deckbuilding.ts'],
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
