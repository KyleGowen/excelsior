module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom', // Use jsdom for browser-like environment
  roots: ['<rootDir>/public', '<rootDir>/tests'],
  testMatch: [
    '**/tests/frontend/**/*.test.ts',
    '**/tests/frontend/**/*.spec.ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
    '^.+\\.js$': 'babel-jest', // Transform JavaScript files
  },
  collectCoverageFrom: [
    'public/js/**/*.js',
    'public/css/**/*.css',
    'public/templates/**/*.html',
    '!public/js/**/*.min.js',
    '!public/js/**/*.bundle.js',
  ],
  coverageDirectory: 'coverage/frontend',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup-frontend.ts'],
  testTimeout: 10000,
  verbose: true,
  // Environment variables for frontend tests
  testEnvironmentOptions: {
    NODE_ENV: 'test',
    PORT: '3001'
  },
  // Mock global browser objects
  globals: {
    'ts-jest': {
      useESM: true
    }
  }
};
