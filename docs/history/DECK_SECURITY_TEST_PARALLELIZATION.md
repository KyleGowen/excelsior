# Deck Security Test Parallelization

## Problem
The "Deck Security" integration tests were taking the longest time at **48.431 seconds** in the CI pipeline, making them the bottleneck after Game Logic tests were parallelized.

The tests included 6 large files with many test cases:
- `deck-save-security-comprehensive.test.ts` (678 lines) - **Largest file**
- `deck-save-frontend-validation.test.ts` (602 lines) - **Second largest**
- `deck-ownership-security.test.ts` (504 lines)
- `deck-save-security-api.test.ts` (413 lines)
- `deck-save-security-simple.test.ts` (365 lines)
- `deck-ownership-security-simple.test.ts` (346 lines)

**Total:** 2,908 lines across 6 files

## Solution
Split the single "Deck Security" test category into **3 parallel categories** to reduce execution time:

### 1. Deck Security - Ownership (Port 3006)
**Files:**
- `deck-ownership-security.test.ts` (504 lines)
- `deck-ownership-security-simple.test.ts` (346 lines)

**Total:** 850 lines across 2 files

### 2. Deck Security - Save Security (Port 3007)
**Files:**
- `deck-save-security-comprehensive.test.ts` (678 lines) - **Largest**
- `deck-save-security-api.test.ts` (413 lines)
- `deck-save-security-simple.test.ts` (365 lines)

**Total:** 1,456 lines across 3 files

### 3. Deck Security - Frontend Validation (Port 3008)
**Files:**
- `deck-save-frontend-validation.test.ts` (602 lines)

**Total:** 602 lines across 1 file

## Implementation

### New Jest Configurations
1. **`jest.integration.deck-security-ownership.config.js`** - Ownership-related tests
2. **`jest.integration.deck-security-save.config.js`** - Save security API tests
3. **`jest.integration.deck-security-frontend.config.js`** - Frontend validation tests

### Updated Files
- **`package.json`** - Added new test scripts for each category
- **`jest.integration.config.js`** - Excluded Deck Security tests using `testPathIgnorePatterns`
- **`.github/workflows/deploy.yml`** - Replaced single Deck Security job with 3 parallel jobs

### New NPM Scripts
```bash
# Individual categories
npm run test:integration:deck-security-ownership
npm run test:integration:deck-security-save
npm run test:integration:deck-security-frontend

# Watch modes
npm run test:integration:deck-security-ownership:watch
npm run test:integration:deck-security-save:watch
npm run test:integration:deck-security-frontend:watch

# Coverage modes
npm run test:integration:deck-security-ownership:coverage
npm run test:integration:deck-security-save:coverage
npm run test:integration:deck-security-frontend:coverage

# Parallel execution
npm run test:integration:deck-security:parallel
```

## Expected Performance Improvement

### Before
- **Single Deck Security job**: ~48 seconds
- **Total test files**: 6 files
- **Total lines**: 2,908 lines

### After
- **3 parallel Deck Security jobs**: ~16 seconds each (running simultaneously)
- **Ownership**: 2 files, 850 lines
- **Save Security**: 3 files, 1,456 lines
- **Frontend Validation**: 1 file, 602 lines

### Time Savings
- **Previous**: 48 seconds (sequential)
- **New**: ~16 seconds (parallel execution)
- **Improvement**: ~67% faster execution time

## GitHub Actions Workflow Changes

### Before
```yaml
integration-tests-deck-security:
  name: Integration Tests - Deck Security
  # Single job running all Deck Security tests
```

### After
```yaml
integration-tests-deck-security-ownership:
  name: Integration Tests - Deck Security Ownership
  # Ownership-related tests only

integration-tests-deck-security-save:
  name: Integration Tests - Deck Security Save
  # Save security API tests only

integration-tests-deck-security-frontend:
  name: Integration Tests - Deck Security Frontend
  # Frontend validation tests only
```

## Port Configuration
Each parallel test category uses a different port to avoid conflicts:
- **Ownership**: Port 3006
- **Save Security**: Port 3007
- **Frontend Validation**: Port 3008
- **Main Integration**: Port 3000 (unchanged)

## Verification
All configurations have been tested and verified:
- ✅ Jest configurations correctly identify test files
- ✅ Main integration config excludes Deck Security tests
- ✅ New test scripts work correctly
- ✅ GitHub Actions workflow updated with parallel jobs

## Test Distribution Analysis

### Ownership Tests (2 files, 850 lines)
- Focus on deck ownership validation
- User permission checks
- Access control scenarios

### Save Security Tests (3 files, 1,456 lines)
- API-level security validation
- Comprehensive save scenarios
- Security edge cases

### Frontend Validation Tests (1 file, 602 lines)
- Frontend-specific validation
- User interface security checks
- Client-side validation testing

## Maintenance
When adding new Deck Security tests:
1. **Ownership tests** → Add to `deck-ownership-security*.test.ts` pattern
2. **Save security tests** → Add to `deck-save-security*.test.ts` pattern
3. **Frontend validation tests** → Add to `deck-save-frontend-validation*.test.ts` pattern

The parallelization follows the same pattern established for Game Logic tests, ensuring consistency across the test suite.

## Combined Impact
With both Game Logic and Deck Security tests parallelized:
- **Game Logic**: 2+ minutes → ~1 minute (50% improvement)
- **Deck Security**: 48 seconds → ~16 seconds (67% improvement)
- **Overall CI pipeline**: Significantly faster execution times
