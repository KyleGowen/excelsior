module.exports = {
  rootDir: '../../',
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/tests/integration/reserve-character-threat-integration.test.ts',
    '**/tests/integration/reserve-character-threat-persistence.test.ts',
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
  coverageDirectory: 'coverage/integration-reserve-threat',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup-integration.ts'],
  globalTeardown: '<rootDir>/tests/teardown-integration.ts',
  testTimeout: 30000,
  verbose: true,
  testEnvironmentOptions: {
    NODE_ENV: 'test',
    PORT: '3005'
  },
  maxWorkers: 1
};
