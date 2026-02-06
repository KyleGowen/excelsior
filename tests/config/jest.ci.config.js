// CI config: extends the unit config with CI-specific overrides for
// parallelism, sharding, and coverage format. Does NOT change mock
// behavior -- tests are authored against the unit config defaults.
const unitConfig = require('./jest.unit.config');

module.exports = {
  ...unitConfig,
  // Override coverage reporters to include JSON for shard merging
  coverageReporters: ['text', 'lcov', 'json'],
  // Reduce log noise in CI
  verbose: false,
  // Let Jest use available cores for parallelism.
  // GitHub-hosted runners have 4 vCPUs / 16 GB RAM (ubuntu-latest),
  // which is more than enough for parallel workers.
  maxWorkers: '50%',
  // Force exit after tests complete (avoid hanging on open handles)
  forceExit: true,
};
