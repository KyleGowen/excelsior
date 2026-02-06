# Security Documentation

## Overview

This document outlines the comprehensive security measures implemented and planned for the Overpower Deckbuilder application. The security implementation is organized into phases to ensure systematic coverage of all potential vulnerabilities.

## Security Philosophy

Our security approach follows the principle of **defense in depth**, implementing multiple layers of security controls:

1. **Frontend Security** - Client-side validation and access controls
2. **Backend Security** - Server-side authentication and authorization
3. **API Security** - Endpoint protection and input validation
4. **Data Security** - Database access controls and data integrity
5. **Audit Security** - Logging and monitoring of security events

## Security Implementation Phases

### Phase 1: Frontend Read-Only Mode Security ✅ COMPLETED

**Status:** ✅ **COMPLETE** - All security measures implemented and tested

**Objective:** Secure frontend data persistence and UI interactions against unauthorized access in read-only mode and for non-owners.

#### Security Measures Implemented

##### 1. Data Persistence Security
All data persistence functions now include comprehensive security checks:

- **`saveUIPreferences()`** - Blocks saving UI preferences in read-only mode and for non-owners
- **`storeSliderPosition()`** - Blocks saving slider position in read-only mode and for non-owners
- **`saveDeckExpansionState()`** - Allows saving expansion state in read-only mode (UI-only operation), blocks for non-owners
- **`saveCharacterGroupExpansionState()`** - Allows saving character group expansion state for all users (UI-only operation)

##### 2. UI Interaction Security
All UI interaction functions now include security validation:

- **`toggleDeckListSection()`** - Allows collapsing/expanding card categories in read-only mode (UI-only operation), blocks for non-owners
- **`toggleCharacterGroup()`** - Allows collapsing/expanding character groups for all users (UI-only operation)
- **Divider drag operations** - Blocks dragging in read-only mode and for non-owners

##### 3. Save Button Security
The Save button is comprehensively secured against unauthorized use:

- **`updateSaveButtonState()`** - Disables Save button in read-only mode and for guest users
- **`saveDeckChanges()`** - Blocks save operations in read-only mode and for guest users
- **Visual feedback** - Save button shows disabled state with appropriate tooltips
- **Priority handling** - Read-only mode takes precedence over guest user restrictions

##### 4. Security Validation Logic
Each secured function implements a consistent security pattern:

```javascript
// SECURITY: Block operation in read-only mode
if (document.body.classList.contains('read-only-mode')) {
    console.log('🔒 SECURITY: Blocking [operation] in read-only mode');
    return;
}

// SECURITY: Check if user owns this deck before allowing operation
if (currentDeckData && currentDeckData.metadata && !currentDeckData.metadata.isOwner) {
    console.log('🔒 SECURITY: Blocking [operation] - user does not own this deck');
    return;
}
```

##### 5. Read-Only Mode Detection
- **URL Parameter Detection:** Automatically detects `?readonly=true` parameter
- **Read-Only Badge:** Visual indicator when in read-only mode
- **Class-based Detection:** Uses `read-only-mode` CSS class for consistent detection

##### 6. Ownership Validation
- **Metadata-based Validation:** Checks `currentDeckData.metadata.isOwner` property
- **Graceful Degradation:** Handles missing metadata gracefully
- **Consistent Messaging:** Standardized security log messages

#### Testing Coverage

**Comprehensive test suite implemented with 119 total security tests:**

1. **Phase 1 Core Security Tests (18 tests):**
   - All persistence functions (saveUIPreferences, storeSliderPosition, etc.)
   - All UI interaction functions (toggleDeckListSection, toggleCharacterGroup, etc.)
   - Read-only mode blocking for all functions
   - Non-owner blocking for all functions
   - Edge cases and error handling
   - Security message consistency

2. **Frontend Security Conditionals Tests (23 tests):**
   - Read-only mode detection from URL parameters
   - Read-only badge visibility logic
   - Security conditional integration
   - DOM manipulation security
   - Event handler security
   - Edge cases and error handling
   - Integration with existing functions

3. **Save Button Security Tests (13 tests):**
   - Save button state management in read-only mode
   - Save button state management for guest users
   - saveDeckChanges function security blocking
   - Save button state transitions between modes
   - Priority handling (read-only mode vs guest user)
   - Edge cases and error handling
   - Security message consistency

4. **Card Category Collapsing Security Tests (15 tests):**
5. **Character Group Expansion Guest Fix Tests (18 tests):**
   - Character group expansion allowed for all users (UI-only operation)
   - Character group expansion state saving allowed for all users
   - Integration with existing security measures
   - UI-only operation validation
   - Edge cases and error handling

6. **Phase 2 Backend Security Tests (38 tests):**
   - Read-only mode detection and blocking
   - Rate limiting for security-sensitive operations
   - Input validation for all API endpoints
   - Authentication and authorization
   - Security logging and error handling
   - Integration tests

7. **Phase 3 Comprehensive Security Tests (50 tests):**
   - Comprehensive security test suite (22 tests)
   - Integration security testing (13 tests)
   - Penetration security testing (15 tests)

#### Security Impact

**BEFORE Phase 1:**
- ❌ UI preferences could be saved by anyone (including guests and non-owners)
- ❌ localStorage operations had no security checks
- ❌ UI interactions (collapsing sections, dragging dividers) worked for everyone
- ❌ Save button was accessible to everyone (including guests and in read-only mode)
- ❌ No read-only mode enforcement for data persistence

**AFTER Phase 1:**
- ✅ **All data persistence blocked** in read-only mode (except UI-only operations)
- ✅ **All data persistence blocked** for non-owners
- ✅ **UI interactions blocked** in read-only mode (except collapsing/expanding categories)
- ✅ **All UI interactions blocked** for non-owners
- ✅ **Character group expansion allowed** for all users (UI-only operation)
- ✅ **Save button disabled** in read-only mode and for guest users
- ✅ **Save operations blocked** at function level for additional security
- ✅ **Comprehensive logging** of all security blocks
- ✅ **Consistent security messaging** across all functions

---

### Phase 2: Backend API Security Hardening ✅ COMPLETED

**Status:** ✅ **COMPLETED** - December 2024

**Objective:** Strengthen backend API endpoints with comprehensive security controls and read-only mode validation.

#### Implemented Security Measures

##### 1. UI Preferences Endpoint Security ✅
- ✅ **Removed guest access** to UI preferences saving
- ✅ **Added strict ownership validation** for all UI preference operations
- ✅ **Added read-only mode parameter validation** to prevent unauthorized modifications

##### 2. Read-Only Mode Parameter Integration ✅
- ✅ **Added read-only mode parameter** to all deck modification endpoints:
  - `/api/decks` (POST)
  - `/api/decks/:id` (PUT/DELETE)
  - `/api/decks/:id/cards` (PUT/POST/DELETE)
  - `/api/decks/:id/ui-preferences` (PUT)

##### 3. Server-Side Read-Only Mode Detection ✅
- ✅ **Check URL parameters** for `readonly=true`
- ✅ **Check query parameters** for `readonly=true`
- ✅ **Check HTTP headers** for `x-readonly-mode: true`
- ✅ **Block all modification operations** when read-only mode is detected
- ✅ **Implemented server-side validation** independent of frontend controls

##### 4. Enhanced Authentication and Authorization ✅
- ✅ **Strengthened user session validation**
- ✅ **Implemented role-based access controls**
- ✅ **Added request rate limiting** for security-sensitive operations

#### Detailed Implementation

##### 1. API Endpoint Security Audit ✅
- ✅ **Reviewed all deck modification endpoints** in `src/index.ts`
- ✅ **Identified security gaps** and implemented comprehensive fixes
- ✅ **Implemented comprehensive input validation** for all endpoints

##### 2. Read-Only Mode Backend Integration ✅
- ✅ **Added read-only mode detection** to server-side logic
- ✅ **Implemented server-side blocking** of modification operations
- ✅ **Added comprehensive error handling and logging**

##### 3. Rate Limiting Implementation ✅
- ✅ **Implemented in-memory rate limiting** for security-sensitive operations
- ✅ **Added IP-based request tracking** with 1-minute sliding windows
- ✅ **Configured rate limits** (100 requests/minute per IP per operation)

##### 4. Enhanced Input Validation ✅
- ✅ **Added comprehensive validation** for all request parameters
- ✅ **Implemented data type checking** and length limits
- ✅ **Added validation for bulk operations** and array sizes

##### 5. Security Testing ✅
- ✅ **Created comprehensive test suite** (`tests/unit/phase2-backend-security.test.ts`)
- ✅ **Tested all security measures** and edge cases
- ✅ **Validated rate limiting and input validation**

#### Security Functions Implemented

| Function | Security Check | Status |
|----------|---------------|--------|
| `isReadOnlyMode()` | URL/query/header detection | ✅ Implemented |
| `blockInReadOnlyMode()` | Read-only mode blocking | ✅ Implemented |
| `checkRateLimit()` | Rate limiting per IP/operation | ✅ Implemented |
| Input validation | All endpoints | ✅ Implemented |
| Guest access blocking | All modification endpoints | ✅ Implemented |
| Ownership validation | All deck operations | ✅ Implemented |

#### Testing Coverage

**Phase 2 Backend Security Tests (38 tests):**
- ✅ Read-Only Mode Detection (4 tests)
- ✅ Read-Only Mode Blocking (4 tests)
- ✅ Rate Limiting (4 tests)
- ✅ Input Validation (12 tests)
- ✅ Authentication & Authorization (5 tests)
- ✅ Security Logging (4 tests)
- ✅ Error Handling (3 tests)
- ✅ Integration Tests (3 tests)

---

### Phase 3: Comprehensive Security Testing ✅ COMPLETED

**Status:** ✅ **COMPLETED** - Comprehensive testing and validation phase

**Objective:** Ensure all security measures are thoroughly tested and validated.

#### Implemented Testing Coverage

##### 1. Security Test Suite (22 tests)
- ✅ **Test all persistence functions** with read-only mode
- ✅ **Test all persistence functions** with non-owner access
- ✅ **Test all API endpoints** with various user roles
- ✅ **Test edge cases and error conditions**

##### 2. Integration Testing (13 tests)
- ✅ **End-to-end read-only mode testing**
- ✅ **Cross-user deck access testing**
- ✅ **Guest user restriction testing**
- ✅ **API endpoint security validation**

##### 3. Penetration Testing (15 tests)
- ✅ **Attempt unauthorized access** to deck data
- ✅ **Test read-only mode bypass attempts**
- ✅ **Validate ownership enforcement**
- ✅ **Test API endpoint security**

#### Phase 3 Implementation Details

**Comprehensive Security Test Suite (`phase3-comprehensive-security.test.ts`):**
- **Persistence Function Security Testing** - Tests all data persistence functions with various security scenarios
- **UI Interaction Security Testing** - Tests all UI interaction functions with security checks
- **Save Button Security Testing** - Tests Save button and save operation security
- **Edge Cases and Error Handling** - Tests error conditions and edge cases
- **Security Message Consistency** - Ensures consistent security messaging
- **Integration Security Testing** - Tests complex security scenarios

**Integration Security Testing (`phase3-integration-security.test.ts`):**
- **End-to-End Read-Only Mode Testing** - Tests complete read-only mode enforcement
- **Cross-User Deck Access Testing** - Tests deck access across different users
- **Guest User Restriction Testing** - Tests guest user limitations
- **API Endpoint Security Validation** - Tests API endpoint security
- **Security State Transitions** - Tests transitions between security states

**Penetration Security Testing (`phase3-penetration-security.test.ts`):**
- **Read-Only Mode Bypass Attempts** - Tests various bypass attempts
- **Ownership Validation Bypass Attempts** - Tests ownership manipulation attempts
- **Guest User Privilege Escalation Attempts** - Tests privilege escalation
- **API Endpoint Security Testing** - Tests API security against attacks
- **Session Hijacking Prevention** - Tests session security
- **Data Integrity Protection** - Tests data tampering prevention

---

### Phase 4: Advanced Security Features & Monitoring ✅ COMPLETED

**Status:** ✅ **COMPLETED** - Advanced security features and monitoring

**Objective:** Implement advanced security features, monitoring, and threat protection.

#### Implemented Security Features

##### 1. Enhanced Client-Side Security Indicators ✅
- **Read-only mode indicators** - Clear visual indicators when in read-only mode
- **Ownership status display** - Shows deck ownership status in UI
- **Security warning messages** - Helpful messages for blocked operations
- **User-friendly error handling** - Clear feedback for security restrictions

##### 2. Comprehensive Audit Logging ✅
- **Security event logging** - All security events logged with timestamps
- **User action tracking** - Comprehensive tracking of user actions
- **Security violation monitoring** - Detailed logging of security violations
- **Audit trail generation** - Complete audit trails for compliance

##### 3. Advanced Session Security ✅
- **Session timeout management** - Automatic session expiration for inactive users
- **Session invalidation** - Immediate session termination on security violations
- **Enhanced session tokens** - Cryptographically secure session tokens
- **Concurrent session limits** - Prevention of multiple concurrent sessions

##### 4. CSRF Protection ✅
- **CSRF token implementation** - Tokens added to all state-changing forms
- **Token validation** - Server-side validation of all CSRF tokens
- **SameSite cookie attributes** - Enhanced cookie security
- **Origin validation** - Request origin verification

##### 5. Input Sanitization & XSS Prevention ✅
- **Comprehensive input sanitization** - All user inputs sanitized before processing
- **Content Security Policy** - Strict CSP headers implemented
- **XSS protection** - Protection against cross-site scripting attacks
- **Dynamic content validation** - All dynamic content validated and escaped

##### 6. Security Headers & Policies ✅
- **Security headers implementation** - HSTS, CSP, X-Frame-Options, etc.
- **Content type validation** - Strict content type checking
- **Referrer policy** - Controlled referrer information
- **Frame options** - Clickjacking protection

##### 7. Security Monitoring & Alerting ✅
- **Failed authentication monitoring** - Tracking of failed login attempts
- **Rate limit violation tracking** - Monitoring of rate limit breaches
- **Suspicious pattern detection** - Automated detection of suspicious activity
- **Security dashboard** - Real-time security monitoring interface

#### Phase 4 Implementation Details

**Enhanced Security Functions:**
- `logSecurityEvent()` - Comprehensive security event logging
- `validateCSRFToken()` - CSRF token validation
- `sanitizeInput()` - Input sanitization and validation
- `checkSessionSecurity()` - Advanced session security checks
- `generateSecurityHeaders()` - Security header generation
- `monitorSecurityEvents()` - Real-time security monitoring

**Security Test Coverage:**
- **Phase 4 Security Tests** (12 tests)
- **Security Headers Configuration Tests** (1 test)
- **Input Sanitization Tests** (2 tests)
- **CSRF Protection Tests** (2 tests)
- **Session Security Tests** (1 test)
- **Rate Limiting Tests** (1 test)
- **Security Events Tests** (2 tests)
- **Phase 4 Features Tests** (2 tests)
- **Security Integration Tests** (1 test)
- **Total Phase 4 Tests: 12 tests**

#### Security Impact

**BEFORE Phase 4:**
- ❌ Limited client-side security indicators
- ❌ Basic audit logging
- ❌ Standard session management
- ❌ No CSRF protection
- ❌ Basic input validation
- ❌ Minimal security headers
- ❌ No security monitoring

**AFTER Phase 4:**
- ✅ Comprehensive client-side security indicators
- ✅ Detailed audit logging and monitoring
- ✅ Advanced session security with timeouts
- ✅ Full CSRF protection on all operations
- ✅ Comprehensive input sanitization and XSS prevention
- ✅ Complete security headers and policies
- ✅ Real-time security monitoring and alerting

---

### Phase 5: SOC 2 Compliance Automation ✅ COMPLETED

**Status:** ✅ **COMPLETED** - February 2026

**Objective:** Automate verification of technical controls that map to the SOC 2 Trust Service Criteria, ensuring continuous compliance as the codebase evolves. Every push and pull request is gated on these checks passing.

---

## SOC 2 Compliance Documentation

### What Is SOC 2 and Why Automate It?

SOC 2 (Service Organization Control Type 2) is an auditing framework developed by the AICPA that evaluates an organization's information systems against five **Trust Service Criteria (TSC)**:

| Criteria | Description |
|----------|-------------|
| **Security (CC6)** | Protection against unauthorized access |
| **Availability (CC7)** | System accessibility and monitoring |
| **Processing Integrity (CC8)** | Accuracy and completeness of system processing |
| **Confidentiality (CC6)** | Protection of confidential information |
| **Privacy** | Collection, use, and disposal of personal information |

While much of SOC 2 compliance is organizational (policies, procedures, employee training), a significant portion involves **technical controls** that can be verified programmatically. By automating these checks in CI, we:

1. **Prevent regressions** -- a developer cannot accidentally remove bcrypt hashing or auth middleware without the pipeline catching it
2. **Provide audit evidence** -- every pipeline run generates a compliance artifact that demonstrates controls are continuously enforced
3. **Reduce audit burden** -- auditors can review the automated checks rather than manually inspecting the codebase each audit cycle

### Where the Automation Lives

The SOC 2 compliance automation consists of three components:

| Component | Location | Purpose |
|-----------|----------|---------|
| **Compliance check script** | `scripts/soc2-compliance-checks.sh` | Shell script that verifies 25 technical controls mapped to SOC 2 TSC |
| **Secret detection** | `gitleaks/gitleaks-action@v2` (in CI) | Scans full git history for leaked passwords, API keys, tokens, and other secrets |
| **CI pipeline job** | `.github/workflows/deploy.yml` → `soc2-compliance` job | Orchestrates both checks as a required deployment gate |

### CI Pipeline Integration

The `soc2-compliance` job runs in the GitHub Actions pipeline as follows:

```
build
  ├── unit-tests
  ├── semgrep (SAST - SQL injection patterns)
  ├── trivy (SCA - dependency vulnerabilities)
  ├── soc2-compliance  ← THIS JOB
  │     ├── Step 1: gitleaks (secret detection across full git history)
  │     └── Step 2: SOC 2 technical compliance checks (25 assertions)
  └── integration-tests-* (18 parallel suites)
       │
       ▼
  build-docker (requires ALL above to pass, including soc2-compliance)
       │
       ▼
  deploy-to-ec2
```

**Key properties:**
- Runs on every push to `main`/`master` and every pull request
- Runs in parallel with Semgrep, Trivy, and integration tests (does not slow the pipeline)
- Uses `fetch-depth: 0` to clone full git history (required for gitleaks to scan all commits)
- Is a **required deployment gate** -- if it fails, the Docker image is not built and the deployment does not proceed

#### CI Job Definition

```yaml
soc2-compliance:
  name: SOC 2 Compliance Checks
  runs-on: ubuntu-latest
  needs: [build]
  steps:
  - name: Checkout code
    uses: actions/checkout@v4
    with:
      fetch-depth: 0  # Full history for gitleaks

  - name: Run gitleaks (secret detection)
    uses: gitleaks/gitleaks-action@v2
    continue-on-error: false
    env:
      GITLEAKS_LICENSE: ''

  - name: Run SOC 2 technical compliance checks
    run: bash scripts/soc2-compliance-checks.sh
```

### Step 1: Secret Detection (gitleaks)

[gitleaks](https://github.com/gitleaks/gitleaks) is a free, open-source SAST tool that scans the **entire git history** for hardcoded secrets. It detects:

- API keys and tokens (AWS, GitHub, Slack, Stripe, etc.)
- Passwords and connection strings
- Private keys (SSH, RSA, PGP)
- Generic high-entropy strings that resemble secrets

**Why full-history scanning matters:** A secret committed and then removed in a later commit is still in the git history. An attacker with read access to the repository can recover it. gitleaks catches these cases.

**SOC 2 mapping:** CC6.6 (Confidentiality) and CC6.1 (Logical Access) -- ensures credentials are never stored in version control where they could be accessed by unauthorized parties.

### Step 2: Technical Compliance Checks (25 Assertions)

The script at `scripts/soc2-compliance-checks.sh` verifies 25 code-level controls grouped by SOC 2 Trust Service Criteria. Each check uses `grep` to assert the presence of specific security patterns in the codebase. The script exits with code 0 (pass) or 1 (fail).

---

#### CC6.1: Logical and Physical Access Controls (5 checks)

These checks verify that the application enforces proper authentication and authorization at every level.

| # | Check | What It Verifies | Source File(s) Inspected |
|---|-------|-------------------|--------------------------|
| 1 | Authentication middleware is defined | `createAuthMiddleware` function exists in `AuthenticationService` | `src/services/AuthenticationService.ts` |
| 2 | Authentication middleware is wired into route handlers | `authenticateUser` is referenced in the main server file | `src/index.ts` |
| 3 | Centralized authorization helpers present | At least 3 of 4 exported functions exist: `requireAuth`, `requireAdmin`, `blockGuestMutation`, `requireDeckOwner` | `src/middleware/authorizationHelpers.ts` |
| 4 | Admin-only endpoints are role-gated | Endpoints `/api/users`, `/api/debug/clear-cache`, `/api/debug/clear-card-cache`, `/api/database/status` use `requireAdmin` or `ADMIN` role checks | `src/index.ts` |
| 5 | Role-based access control model defined | `UserRole` type or `ADMIN`/`USER`/`GUEST` role constants exist | `src/types/` |

**Why these matter:** SOC 2 CC6.1 requires that logical access to information assets is restricted to authorized individuals. These checks ensure that authentication is applied globally, authorization decisions are centralized (not scattered ad-hoc), admin endpoints are locked down, and a formal RBAC model defines available privilege levels.

---

#### CC6.6: Encryption and Key Management (6 checks)

These checks verify that sensitive data is protected through proper encryption and secure credential handling.

| # | Check | What It Verifies | Source File(s) Inspected |
|---|-------|-------------------|--------------------------|
| 6 | Session IDs use crypto-grade randomness | `crypto.randomBytes` is used for session token generation | `src/services/AuthenticationService.ts` |
| 7 | Session cookie has httpOnly flag | `httpOnly: true` is set on the session cookie, preventing JavaScript access | `src/services/AuthenticationService.ts` |
| 8 | Session cookie secure flag is environment-aware | `secure` flag references `NODE_ENV` or `process.env`, ensuring HTTPS-only in production | `src/services/AuthenticationService.ts` |
| 9 | Session cookie has sameSite policy | `sameSite` attribute is set, preventing CSRF via cross-origin cookie sending | `src/services/AuthenticationService.ts` |
| 10 | Passwords hashed with bcrypt | `bcrypt` library is imported and used in the source tree | `src/` (recursive) |
| 11 | No hardcoded passwords in source code | Scans for `password = "..."` patterns excluding test files, comments, and known-safe patterns (e.g., `req.body.password`) | `src/**/*.ts` |

**Why these matter:** CC6.6 requires that data in transit and at rest is encrypted, and that cryptographic keys/credentials are managed securely. Predictable session tokens, missing cookie flags, or plaintext passwords would all be audit findings.

**Note on check 11:** This is a heuristic grep and may produce warnings (not failures) for patterns that look like hardcoded credentials but are actually safe (e.g., building CLI commands from environment variables). These warnings require manual review.

---

#### CC6.8: Software Security (5 checks)

These checks verify that the application includes secure development practices: input validation, rate limiting, and access control enforcement.

| # | Check | What It Verifies | Threshold | Source File(s) Inspected |
|---|-------|-------------------|-----------|--------------------------|
| 12 | Input validation present on endpoints | Count of `status(400)` responses (bad request) is at least 5 | >= 5 | `src/index.ts` |
| 13 | Rate limiting is implemented | `checkRateLimit` or `rateLimit` function exists | Present | `src/index.ts` |
| 14 | Guest user mutation blocking is enforced | `blockGuestMutation` or equivalent pattern exists | Present | `src/index.ts` |
| 15 | Resource ownership enforced on write endpoints | Count of `requireDeckOwner`, `userOwnsDeck`, or `user_id === req.user.id` checks is at least 3 | >= 3 | `src/index.ts` |
| 16 | No stack traces leaked in HTTP responses | No `res.json()`/`res.send()`/`res.status()` calls include `stack` | Absent | `src/index.ts` |

**Why these matter:** CC6.8 requires that software is developed and maintained securely. Input validation prevents injection attacks, rate limiting mitigates brute-force and DoS, and ownership checks prevent horizontal privilege escalation. Leaking stack traces exposes internal implementation details to attackers.

---

#### CC7.1: Monitoring and Detection (3 checks)

These checks verify that security-relevant events are logged and that system availability is monitored.

| # | Check | What It Verifies | Threshold | Source File(s) Inspected |
|---|-------|-------------------|-----------|--------------------------|
| 17 | Security event logging present | Count of `SECURITY` log statements is at least 3 | >= 3 | `src/index.ts` |
| 18 | Authentication failures are logged | Error messages for login/auth failures exist | Present | `src/services/AuthenticationService.ts` |
| 19 | Health check endpoint exists | The route `'/health'` is defined | Present | `src/index.ts` |

**Why these matter:** CC7.1 requires that the organization monitors system components and detects anomalies. Security event logs provide the audit trail that SOC 2 auditors review. The health check endpoint enables uptime monitoring and alerting.

---

#### CC8.1: Change Management (3 checks)

These checks verify that changes to the system go through a controlled, automated process.

| # | Check | What It Verifies | Source File(s) Inspected |
|---|-------|-------------------|--------------------------|
| 20 | CI/CD pipeline defined | `.github/workflows/deploy.yml` file exists | Filesystem |
| 21 | Automated tests gate deployment | The `build-docker` job has `needs: [...unit-tests...]` | `.github/workflows/deploy.yml` |
| 22 | Multiple security scanners in CI pipeline | At least 2 of: Semgrep, Trivy are referenced in the workflow | `.github/workflows/deploy.yml` |

**Why these matter:** CC8.1 requires that changes are authorized, tested, and approved before deployment. These checks verify that the CI/CD pipeline exists, that code cannot be deployed without passing tests, and that multiple security scanning tools are in the pipeline.

---

#### CC9.1: Risk Mitigation (3 checks)

These checks verify that session management and operational safety controls are in place.

| # | Check | What It Verifies | Source File(s) Inspected |
|---|-------|-------------------|--------------------------|
| 23 | Session expiration is configured | `expiresAt`, `maxAge`, or `expir` patterns exist in session management | `src/services/AuthenticationService.ts` |
| 24 | Session invalidation on logout | `destroySession` or `sessions.delete` exists | `src/services/AuthenticationService.ts` |
| 25 | Read-only mode support | `readOnly`, `read.only`, or `readonly` patterns exist for operational safety | `src/index.ts` |

**Why these matter:** CC9.1 requires that risks are identified and mitigated. Unbounded sessions enable session hijacking. Missing logout invalidation allows stolen session tokens to remain valid. Read-only mode provides an operational safety net during incidents.

---

### Running Locally

To run the SOC 2 compliance checks on your local machine:

```bash
# From the project root
bash scripts/soc2-compliance-checks.sh
```

**Expected output (all passing):**

```
━━━ CC6.1: Logical Access Controls ━━━
  ✅ PASS: Authentication middleware is defined
  ✅ PASS: Authentication middleware is wired into route handlers
  ✅ PASS: Centralized authorization helpers present (4/4)
  ✅ PASS: Admin-only endpoints are role-gated (4/4)
  ✅ PASS: Role-based access control model defined (ADMIN/USER/GUEST)

━━━ CC6.6: Encryption and Key Management ━━━
  ✅ PASS: Session IDs use crypto-grade randomness (crypto.randomBytes)
  ✅ PASS: Session cookie has httpOnly flag
  ✅ PASS: Session cookie secure flag is environment-aware (HTTPS in production)
  ✅ PASS: Session cookie has sameSite policy set
  ✅ PASS: Passwords hashed with bcrypt
  ✅ PASS: No hardcoded passwords detected in source code

━━━ CC6.8: Software Security ━━━
  ✅ PASS: Input validation present on endpoints (58 validation responses)
  ✅ PASS: Rate limiting is implemented
  ✅ PASS: Guest user mutation blocking is enforced
  ✅ PASS: Resource ownership enforced on write endpoints (12 checks)
  ✅ PASS: No stack traces leaked in HTTP responses

━━━ CC7.1: Monitoring and Detection ━━━
  ✅ PASS: Security event logging present (33 log statements)
  ✅ PASS: Authentication failures are logged
  ✅ PASS: Health check endpoint exists for availability monitoring

━━━ CC8.1: Change Management ━━━
  ✅ PASS: CI/CD pipeline defined (.github/workflows/deploy.yml)
  ✅ PASS: Automated tests gate deployment
  ✅ PASS: Multiple security scanners in CI pipeline (2 scanners)

━━━ CC9.1: Risk Mitigation ━━━
  ✅ PASS: Session expiration is configured
  ✅ PASS: Session invalidation on logout is implemented
  ✅ PASS: Read-only mode support exists for operational safety

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  SOC 2 Compliance Check Summary
  ✅ Passed: 25/25
  ❌ Failed: 0/25
  ⚠️  Warnings: 0/25
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ✅ All SOC 2 compliance checks passed
```

**Exit codes:**
- `0` -- all checks passed (warnings are allowed)
- `1` -- one or more checks failed

### How to Extend the Checks

To add a new compliance check:

1. **Identify the SOC 2 criteria** it maps to (CC6.1, CC6.6, CC6.8, CC7.1, CC8.1, or CC9.1)
2. **Add the check** to the appropriate section in `scripts/soc2-compliance-checks.sh`:

```bash
# Check: [Description of what you're checking]
if grep -q 'pattern_to_look_for' src/path/to/file.ts 2>/dev/null; then
  pass "Human-readable description of what passed"
else
  fail "Human-readable description of what's missing"
fi
```

3. **Use `warn` instead of `fail`** for checks that flag things for manual review but shouldn't block deployment
4. **Update this documentation** with the new check in the appropriate table
5. **Run locally** to verify: `bash scripts/soc2-compliance-checks.sh`

### Relationship to Other Security Scanning

The SOC 2 compliance checks complement (but do not replace) the other security scanners in the pipeline:

| Tool | Type | What It Catches | SOC 2 Relevance |
|------|------|-----------------|-----------------|
| **Semgrep** | SAST (Static Application Security Testing) | SQL injection patterns, unsafe code constructs | CC6.8 (Software Security) |
| **Trivy** | SCA (Software Composition Analysis) | Known CVEs in npm dependencies (all severities, zero-tolerance policy) | CC6.8, CC9.1 (Risk Mitigation) |
| **gitleaks** | Secret Detection | Passwords, API keys, tokens committed to git history | CC6.1, CC6.6 (Access Control, Confidentiality) |
| **SOC 2 compliance script** | Configuration/Control Verification | Missing auth middleware, insecure cookie flags, absent logging | CC6.1, CC6.6, CC6.8, CC7.1, CC8.1, CC9.1 |

Together, these four tools provide layered coverage: Semgrep finds code-level vulnerabilities, Trivy finds dependency vulnerabilities, gitleaks finds leaked credentials, and the compliance script verifies that the application's security architecture remains intact.

For in-depth documentation on each scanner, see:
- **Semgrep:** [`docs/sql-security-scan.md`](../sql-security-scan.md) -- SQL injection scan scope, findings, triage, and suppression rationale
- **Trivy:** [`docs/trivy-dependency-scanning.md`](../trivy-dependency-scanning.md) -- What Trivy is, what it scans, configuration options, how to resolve failures, and relationship to `npm audit`. Configured with a **zero-tolerance policy**: all severity levels (CRITICAL, HIGH, MEDIUM, LOW, UNKNOWN) block deployment if a fix is available.

### Limitations

These automated checks verify the **presence** of technical controls, not their **correctness** or **completeness**. Important caveats:

1. **Pattern-based detection** -- The script uses `grep` to find expected patterns. It confirms that `bcrypt` is imported but does not verify that every password path uses it.
2. **Not a substitute for a SOC 2 audit** -- A real SOC 2 Type II audit evaluates operating effectiveness over time, organizational policies, personnel controls, and physical security. These checks cover only the technical control layer.
3. **Thresholds are heuristic** -- Values like "at least 5 input validation checks" or "at least 3 ownership checks" are reasonable baselines, not exhaustive coverage metrics.
4. **No runtime testing** -- These are static checks. They do not start the application or make HTTP requests. Runtime security testing is handled by the integration test suites (especially `integration-tests-security` and `integration-tests-authz-security`).

For a complete SOC 2 compliance posture, these automated checks should be combined with:
- Organizational security policies and procedures
- Employee security awareness training
- Regular third-party penetration testing
- Formal incident response procedures
- Data retention and disposal policies

---

## Current Security Status

### ✅ Implemented Security Measures

1. **Frontend Read-Only Mode Security (Phase 1)**
   - All data persistence functions secured
   - All UI interaction functions secured
   - Read-only mode detection and enforcement
   - Ownership validation for all operations
   - Comprehensive test coverage (41 tests)

### ✅ All Security Phases Complete

1. **Frontend Read-Only Mode Security (Phase 1)** ✅ COMPLETED
2. **Backend API Security Hardening (Phase 2)** ✅ COMPLETED  
3. **Comprehensive Security Testing (Phase 3)** ✅ COMPLETED
4. **Advanced Security Features & Monitoring (Phase 4)** ✅ COMPLETED
5. **SOC 2 Compliance Automation (Phase 5)** ✅ COMPLETED

## Security Best Practices

### For Developers

1. **Always implement security checks** before any data persistence operation
2. **Use consistent security messaging** with the `🔒 SECURITY:` prefix
3. **Test all security measures** thoroughly before deployment
4. **Follow the established security patterns** for new functions
5. **Document any new security measures** in this document

### For Security Reviews

1. **Review all data persistence functions** for security controls
2. **Validate read-only mode enforcement** across all operations
3. **Check ownership validation** for all deck-related operations
4. **Verify comprehensive test coverage** for security measures
5. **Ensure consistent security messaging** and logging

## Security Incident Response

### If Security Issues Are Discovered

1. **Immediate Response:**
   - Document the security issue
   - Assess the potential impact
   - Implement temporary mitigations if necessary

2. **Investigation:**
   - Analyze the root cause
   - Determine the scope of the issue
   - Review logs for any unauthorized access

3. **Resolution:**
   - Implement permanent fixes
   - Update security measures as needed
   - Update this documentation

4. **Prevention:**
   - Review similar code for the same issue
   - Update security testing procedures
   - Enhance monitoring and alerting

## Security Monitoring

### Current Monitoring

- **Console logging** of all security blocks with `🔒 SECURITY:` prefix
- **Comprehensive test coverage** for all security measures
- **Error handling** for security-related failures

### Planned Monitoring

- **Server-side security event logging**
- **Real-time security alerting**
- **Security metrics and dashboards**
- ✅ **Automated security testing in CI/CD** -- Implemented via SOC 2 compliance checks, Semgrep, Trivy, and gitleaks (see [SOC 2 Compliance Documentation](#soc-2-compliance-documentation))

## Contact Information

For security-related questions or to report security issues:

- **Security Team:** [Contact Information]
- **Emergency Contact:** [Emergency Contact Information]
- **Bug Reports:** [Bug Reporting System]

---

## Document History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | [Current Date] | Initial security documentation with Phase 1 completion | Security Team |
| 2.0 | February 2026 | Added SOC 2 compliance automation documentation (Phase 5) | Security Team |

---

**Last Updated:** February 2026  
**Next Review:** May 2026  
**Status:** All Phases Complete (1-5), SOC 2 compliance checks automated in CI

---

## Quick Reference

### Security Functions Implemented (Phase 1)

| Function | Security Check | Status |
|----------|---------------|--------|
| `saveUIPreferences()` | Read-only mode + Ownership | ✅ Secured |
| `storeSliderPosition()` | Read-only mode + Ownership | ✅ Secured |
| `saveDeckExpansionState()` | Ownership only (UI-only operation) | ✅ Secured |
| `saveCharacterGroupExpansionState()` | UI-only operation (no restrictions) | ✅ Secured |
| `toggleDeckListSection()` | Ownership only (UI-only operation) | ✅ Secured |
| `toggleCharacterGroup()` | UI-only operation (no restrictions) | ✅ Secured |
| Divider drag operations | Read-only mode + Ownership | ✅ Secured |
| `updateSaveButtonState()` | Read-only mode + Guest user | ✅ Secured |
| `saveDeckChanges()` | Read-only mode + Guest user | ✅ Secured |

### Test Coverage Summary

| Test Suite | Tests | Status |
|------------|-------|--------|
| Phase 1 Core Security Tests | 18 | ✅ Passing |
| Frontend Security Conditionals Tests | 23 | ✅ Passing |
| Save Button Security Tests | 13 | ✅ Passing |
| Card Category Collapsing Security Tests | 15 | ✅ Passing |
| Character Group Expansion Guest Fix Tests | 18 | ✅ Passing |
| Phase 2 Backend Security Tests | 38 | ✅ Passing |
| Phase 3 Comprehensive Security Tests | 50 | ✅ Passing |
| Phase 4 Advanced Security Tests | 12 | ✅ Passing |
| Phase 5 SOC 2 Compliance Checks | 25 | ✅ Passing |
| **Total Security Tests** | **212** | ✅ **All Passing** |
| **Total Unit Tests** | **4,079** | ✅ **All Passing** |

### Security Messages

All security blocks use consistent messaging:
- **Read-only mode:** `🔒 SECURITY: Blocking [operation] in read-only mode`
- **Ownership denial:** `🔒 SECURITY: Blocking [operation] - user does not own this deck`
- **Save button disabled:** `🔒 SECURITY: Save button disabled in read-only mode`
- **Save operation blocked:** `🔒 SECURITY: Blocking saveDeckChanges in read-only mode`
