#!/usr/bin/env bash
# Technical security regression checks supporting SOC 2 evidence, not certification.
# Endpoint/role isolation is additionally exercised against the production app by
# tests/integration/security/production-access-policy.test.ts in every CI run.
set -euo pipefail
cd "$(dirname "$0")/.."
node scripts/check-security-exceptions.mjs
npx jest --config tests/config/jest.unit.config.js --runInBand --runTestsByPath \
  tests/unit/authCookieOptions.test.ts \
  tests/unit/securityHeaders.test.ts \
  tests/unit/corsAllowlist.test.ts \
  tests/unit/v1RateLimit.test.ts \
  tests/unit/newAccountRateLimiter.test.ts \
  tests/unit/api/config/jwtConfig.test.ts \
  tests/unit/api/services/v1JwtTokenService.test.ts \
  tests/unit/api/http/v1SessionOrBearerAuth.test.ts \
  tests/unit/securityWorkflow.test.ts
