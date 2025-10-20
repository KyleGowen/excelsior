module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/tests/integration/reserve-character*.test.ts',
    '**/tests/integration/guest-reserve-character-integration.test.ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
  ],
  coverageDirectory: 'coverage/integration-game-logic-reserve',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup-integration.ts'],
  globalTeardown: '<rootDir>/tests/teardown-integration.ts',
  testTimeout: 30000,
  verbose: true,
  testEnvironmentOptions: {
    NODE_ENV: 'test',
    PORT: '3004' // Use a different port for parallel execution
  },
  maxWorkers: 1 // Still run tests within this suite sequentially
};
