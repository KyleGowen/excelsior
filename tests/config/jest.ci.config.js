module.exports = {
  rootDir: '../../',
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/tests/unit/**/*.test.ts',
    '**/tests/unit/**/*.spec.ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts', // Exclude main entry point from coverage
  ],
  coverageDirectory: 'coverage/unit',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 60000, // Increased timeout for CI
  verbose: true,
  // CI-specific optimizations
  maxWorkers: 1, // Force single worker to avoid memory issues
  runInBand: true, // Run tests sequentially
  detectOpenHandles: true, // Detect open handles
  forceExit: true, // Force exit after tests complete
  logHeapUsage: true, // Log heap usage for debugging
  // Environment variables for unit tests
  testEnvironmentOptions: {
    NODE_ENV: 'test',
    PORT: '3001'
  },
  // Memory and performance optimizations
  cache: false, // Disable cache to avoid CI issues
  clearMocks: true, // Clear mocks between tests
  restoreMocks: true, // Restore mocks after each test
  resetMocks: true, // Reset mocks before each test
};
