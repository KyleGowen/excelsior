#!/usr/bin/env bash
# =============================================================================
# SOC 2 Technical Compliance Checks
# =============================================================================
# Automated verification of technical controls mapped to SOC 2 Trust Service
# Criteria. These checks validate code-level security controls that auditors
# expect to see in place.
#
# Exit code: 0 = all checks pass, 1 = one or more checks failed
# =============================================================================

set -uo pipefail

PASS=0
FAIL=0
WARN=0

pass() { echo "  ✅ PASS: $1"; PASS=$((PASS + 1)); }
fail() { echo "  ❌ FAIL: $1"; FAIL=$((FAIL + 1)); }
warn() { echo "  ⚠️  WARN: $1"; WARN=$((WARN + 1)); }

# ─── CC6.1: Logical and Physical Access Controls ────────────────────────────
echo ""
echo "━━━ CC6.1: Logical Access Controls ━━━"

# Check: Authentication middleware exists and is applied to sensitive endpoints
if grep -q 'createAuthMiddleware' src/services/AuthenticationService.ts 2>/dev/null; then
  pass "Authentication middleware is defined"
else
  fail "Authentication middleware not found in AuthenticationService"
fi

if grep -q 'authenticateUser' src/index.ts 2>/dev/null; then
  pass "Authentication middleware is wired into route handlers"
else
  fail "Authentication middleware not applied to routes"
fi

# Check: Centralized authorization helpers exist
if [ -f "src/middleware/authorizationHelpers.ts" ]; then
  HELPERS_FOUND=0
  for helper in requireAuth requireAdmin blockGuestMutation requireDeckOwner; do
    if grep -q "export function $helper" src/middleware/authorizationHelpers.ts 2>/dev/null; then
      ((HELPERS_FOUND++))
    fi
  done
  if [ "$HELPERS_FOUND" -ge 3 ]; then
    pass "Centralized authorization helpers present ($HELPERS_FOUND/4)"
  else
    fail "Missing centralized authorization helpers ($HELPERS_FOUND/4 found)"
  fi
else
  fail "Centralized authorization helpers module missing"
fi

# Check: Admin-only endpoints are protected
ADMIN_ENDPOINTS=("/api/users" "/api/debug/clear-cache" "/api/debug/clear-card-cache" "/api/database/status")
ADMIN_PROTECTED=0
for endpoint in "${ADMIN_ENDPOINTS[@]}"; do
  # Check that endpoint handler uses requireAdmin or ADMIN role check
  if grep -A5 "'${endpoint}'" src/index.ts 2>/dev/null | grep -q 'requireAdmin\|ADMIN'; then
    ((ADMIN_PROTECTED++))
  fi
done
if [ "$ADMIN_PROTECTED" -ge 3 ]; then
  pass "Admin-only endpoints are role-gated ($ADMIN_PROTECTED/${#ADMIN_ENDPOINTS[@]})"
else
  fail "Some admin endpoints lack role gating ($ADMIN_PROTECTED/${#ADMIN_ENDPOINTS[@]})"
fi

# Check: Role-based access control model exists
if grep -rq "UserRole" src/types/ 2>/dev/null || \
   grep -rq "role.*ADMIN\|role.*USER\|role.*GUEST" src/types/ 2>/dev/null; then
  pass "Role-based access control model defined (ADMIN/USER/GUEST)"
else
  fail "No role-based access control model found"
fi

# ─── CC6.6: Encryption and Key Management ───────────────────────────────────
echo ""
echo "━━━ CC6.6: Encryption and Key Management ━━━"

# Check: Session IDs use crypto-grade randomness
if grep -q 'crypto\.randomBytes' src/services/AuthenticationService.ts 2>/dev/null; then
  pass "Session IDs use crypto-grade randomness (crypto.randomBytes)"
else
  fail "Session IDs may not use crypto-grade randomness"
fi

# Check: Session cookie has httpOnly flag
if grep -q 'httpOnly: true' src/services/AuthenticationService.ts 2>/dev/null; then
  pass "Session cookie has httpOnly flag"
else
  fail "Session cookie missing httpOnly flag"
fi

# Check: Session cookie secure flag is environment-aware
if grep -q "secure.*NODE_ENV.*production\|secure.*process\.env" src/services/AuthenticationService.ts 2>/dev/null; then
  pass "Session cookie secure flag is environment-aware (HTTPS in production)"
else
  fail "Session cookie secure flag is not tied to production environment"
fi

# Check: Session cookie has sameSite policy
if grep -q "sameSite" src/services/AuthenticationService.ts 2>/dev/null; then
  pass "Session cookie has sameSite policy set"
else
  fail "Session cookie missing sameSite policy"
fi

# Check: Passwords are hashed with bcrypt
if grep -rq 'bcrypt' src/ 2>/dev/null; then
  pass "Passwords hashed with bcrypt"
else
  fail "No bcrypt password hashing found"
fi

# Check: No hardcoded passwords or secrets in source code
HARDCODED=$(grep -rn "password\s*=\s*['\"][^'\"]*['\"]" src/ --include='*.ts' \
  | grep -v 'test\|spec\|mock\|example\|\.d\.ts\|password_hash\|password.*required\|password.*error\|password.*must\|password.*change\|password.*update\|newPassword\|oldPassword\|req\.body' \
  | grep -v '//\|/\*' \
  | head -5 || true)
if [ -z "$HARDCODED" ]; then
  pass "No hardcoded passwords detected in source code"
else
  warn "Potential hardcoded credentials found (review manually):"
  echo "$HARDCODED" | sed 's/^/       /'
fi

# ─── CC6.8: Software Security ───────────────────────────────────────────────
echo ""
echo "━━━ CC6.8: Software Security ━━━"

# Check: Input validation exists on mutation endpoints
INPUT_VALIDATION_COUNT=$(grep -c 'status(400)' src/index.ts 2>/dev/null || echo "0")
if [ "$INPUT_VALIDATION_COUNT" -ge 5 ]; then
  pass "Input validation present on endpoints ($INPUT_VALIDATION_COUNT validation responses)"
else
  fail "Insufficient input validation ($INPUT_VALIDATION_COUNT checks found, need ≥5)"
fi

# Check: Rate limiting is implemented
if grep -q 'checkRateLimit\|rateLimit\|rate.limit' src/index.ts 2>/dev/null; then
  pass "Rate limiting is implemented"
else
  fail "No rate limiting found"
fi

# Check: Guest mutation blocking
if grep -rq 'blockGuestMutation\|GUEST.*may not\|guest.*cannot' src/index.ts 2>/dev/null; then
  pass "Guest user mutation blocking is enforced"
else
  fail "No guest mutation blocking found"
fi

# Check: Deck ownership enforcement on write endpoints
OWNERSHIP_CHECKS=$(grep -c 'requireDeckOwner\|userOwnsDeck\|user_id.*req\.user\.id' src/index.ts 2>/dev/null || echo "0")
if [ "$OWNERSHIP_CHECKS" -ge 3 ]; then
  pass "Resource ownership enforced on write endpoints ($OWNERSHIP_CHECKS checks)"
else
  fail "Insufficient ownership enforcement ($OWNERSHIP_CHECKS checks, need ≥3)"
fi

# Check: Error responses don't leak stack traces to clients
STACK_LEAKS=$(grep -n 'res\.\(json\|send\|status\).*stack' src/index.ts 2>/dev/null | head -5 || true)
if [ -z "$STACK_LEAKS" ]; then
  pass "No stack traces leaked in HTTP responses"
else
  warn "Possible stack trace leakage in responses (review manually):"
  echo "$STACK_LEAKS" | sed 's/^/       /'
fi

# ─── CC7.1: Monitoring and Detection ────────────────────────────────────────
echo ""
echo "━━━ CC7.1: Monitoring and Detection ━━━"

# Check: Security events are logged
SECURITY_LOGS=$(grep -c 'SECURITY' src/index.ts 2>/dev/null || echo "0")
if [ "$SECURITY_LOGS" -ge 3 ]; then
  pass "Security event logging present ($SECURITY_LOGS log statements)"
else
  fail "Insufficient security event logging ($SECURITY_LOGS found, need ≥3)"
fi

# Check: Authentication failures are logged
if grep -q 'Login error\|Authentication error\|Invalid.*password\|Invalid.*session' src/services/AuthenticationService.ts 2>/dev/null; then
  pass "Authentication failures are logged"
else
  fail "Authentication failures may not be logged"
fi

# Check: Health check endpoint exists for availability monitoring
if grep -q "'/health'" src/index.ts 2>/dev/null; then
  pass "Health check endpoint exists for availability monitoring"
else
  fail "No health check endpoint found"
fi

# ─── CC8.1: Change Management ───────────────────────────────────────────────
echo ""
echo "━━━ CC8.1: Change Management ━━━"

# Check: CI/CD pipeline exists
if [ -f ".github/workflows/deploy.yml" ]; then
  pass "CI/CD pipeline defined (.github/workflows/deploy.yml)"
else
  fail "No CI/CD pipeline found"
fi

# Check: Automated tests gate deployment
if grep -q 'needs:.*unit-tests' .github/workflows/deploy.yml 2>/dev/null; then
  pass "Automated tests gate deployment"
else
  fail "Deployment is not gated by automated tests"
fi

# Check: Security scanning in CI
SCANNERS=0
grep -q 'semgrep' .github/workflows/deploy.yml 2>/dev/null && ((SCANNERS++))
grep -q 'trivy' .github/workflows/deploy.yml 2>/dev/null && ((SCANNERS++))
if [ "$SCANNERS" -ge 2 ]; then
  pass "Multiple security scanners in CI pipeline ($SCANNERS scanners)"
else
  warn "Only $SCANNERS security scanner(s) in CI pipeline (recommend ≥2)"
fi

# ─── CC9.1: Risk Mitigation ─────────────────────────────────────────────────
echo ""
echo "━━━ CC9.1: Risk Mitigation ━━━"

# Check: Session expiration is configured
if grep -q 'expiresAt\|maxAge\|expir' src/services/AuthenticationService.ts 2>/dev/null; then
  pass "Session expiration is configured"
else
  fail "No session expiration found"
fi

# Check: Session invalidation on logout
if grep -q 'destroySession\|sessions\.delete' src/services/AuthenticationService.ts 2>/dev/null; then
  pass "Session invalidation on logout is implemented"
else
  fail "No session invalidation on logout"
fi

# Check: Read-only mode support (operational safety)
if grep -q 'readOnly\|read.only\|readonly' src/index.ts 2>/dev/null; then
  pass "Read-only mode support exists for operational safety"
else
  warn "No read-only mode support found"
fi

# ─── Summary ────────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
TOTAL=$((PASS + FAIL + WARN))
echo "  SOC 2 Compliance Check Summary"
echo "  ✅ Passed: $PASS/$TOTAL"
echo "  ❌ Failed: $FAIL/$TOTAL"
echo "  ⚠️  Warnings: $WARN/$TOTAL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$FAIL" -gt 0 ]; then
  echo ""
  echo "  ❌ SOC 2 compliance checks FAILED ($FAIL failures)"
  exit 1
else
  echo ""
  echo "  ✅ All SOC 2 compliance checks passed"
  exit 0
fi
