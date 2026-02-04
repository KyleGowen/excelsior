# Game Logic Test Parallelization

## Problem
The "Game Logic" integration tests were taking over 2 minutes (2 minutes 1 second) in the CI pipeline, exceeding the desired threshold. The tests included large files with many test cases:

- `reserve-character-integration.test.ts` (952 lines) - **Largest file**
- `reserve-character-threat-integration.test.ts` (693 lines) - **Second largest**
- `power-card-counting-integration.test.ts` (515 lines)
- `special-character-threat-display.test.ts` (449 lines)
- `reserve-character-loading-integration.test.ts` (480 lines)

## Solution
Split the single "Game Logic" test category into **3 parallel categories** to reduce execution time:

### 1. Game Logic - Characters (Port 3003)
**Files:**
- `character-column-layout.test.ts` (221 lines)
- `characterLimitValidation.test.ts` (241 lines)
- `special-character-threat-display.test.ts` (449 lines)

**Total:** 911 lines across 3 files

### 2. Game Logic - Reserve Characters (Port 3004)
**Files:**
- `reserve-character-integration.test.ts` (952 lines) - **Largest**
- `reserve-character-threat-integration.test.ts` (693 lines) - **Second largest**
- `reserve-character-loading-integration.test.ts` (480 lines)
- `reserve-character-threat-persistence.test.ts` (407 lines)
- `reserve-character-simple.test.ts` (337 lines)
- `guest-reserve-character-integration.test.ts` (394 lines)

**Total:** 3,263 lines across 6 files

### 3. Game Logic - Power & Teamwork (Port 3005)
**Files:**
- `power-card-counting-integration.test.ts` (515 lines)
- `teamwork-card-fixes.test.ts` (202 lines)
- `event-mission-filtering-integration.test.ts` (376 lines)

**Total:** 1,093 lines across 3 files

## Implementation

### New Jest Configurations
1. **`jest.integration.game-logic-characters.config.js`** - Character-related tests
2. **`jest.integration.game-logic-reserve.config.js`** - Reserve character tests
3. **`jest.integration.game-logic-power-teamwork.config.js`** - Power, teamwork, and event-mission tests

### Updated Files
- **`package.json`** - Added new test scripts for each category
- **`jest.integration.config.js`** - Excluded Game Logic tests using `testPathIgnorePatterns`
- **`.github/workflows/deploy.yml`** - Replaced single Game Logic job with 3 parallel jobs

### New NPM Scripts
```bash
# Individual categories
npm run test:integration:game-logic-characters
npm run test:integration:game-logic-reserve
npm run test:integration:game-logic-power-teamwork

# Watch modes
npm run test:integration:game-logic-characters:watch
npm run test:integration:game-logic-reserve:watch
npm run test:integration:game-logic-power-teamwork:watch

# Coverage modes
npm run test:integration:game-logic-characters:coverage
npm run test:integration:game-logic-reserve:coverage
npm run test:integration:game-logic-power-teamwork:coverage

# Parallel execution
npm run test:integration:game-logic:parallel
```

## Expected Performance Improvement

### Before
- **Single Game Logic job**: ~2+ minutes
- **Total test files**: 12 files
- **Total lines**: 5,267 lines

### After
- **3 parallel Game Logic jobs**: ~1 minute each (running simultaneously)
- **Characters**: 3 files, 911 lines
- **Reserve Characters**: 6 files, 3,263 lines  
- **Power & Teamwork**: 3 files, 1,093 lines

### Time Savings
- **Previous**: 2+ minutes (sequential)
- **New**: ~1 minute (parallel execution)
- **Improvement**: ~50% faster execution time

## GitHub Actions Workflow Changes

### Before
```yaml
integration-tests-game-logic:
  name: Integration Tests - Game Logic
  # Single job running all Game Logic tests
```

### After
```yaml
integration-tests-game-logic-characters:
  name: Integration Tests - Game Logic Characters
  # Character-related tests only

integration-tests-game-logic-reserve:
  name: Integration Tests - Game Logic Reserve Characters
  # Reserve character tests only

integration-tests-game-logic-power-teamwork:
  name: Integration Tests - Game Logic Power & Teamwork
  # Power, teamwork, and event-mission tests only
```

## Port Configuration
Each parallel test category uses a different port to avoid conflicts:
- **Characters**: Port 3003
- **Reserve Characters**: Port 3004
- **Power & Teamwork**: Port 3005
- **Main Integration**: Port 3000 (unchanged)

## Verification
All configurations have been tested and verified:
- ✅ Jest configurations correctly identify test files
- ✅ Main integration config excludes Game Logic tests
- ✅ New test scripts work correctly
- ✅ GitHub Actions workflow updated with parallel jobs

## Maintenance
When adding new Game Logic tests:
1. **Character tests** → Add to `character*.test.ts` pattern
2. **Reserve character tests** → Add to `reserve-character*.test.ts` pattern
3. **Power/Teamwork tests** → Add to `power*.test.ts` or `teamwork*.test.ts` pattern
4. **Event/Mission tests** → Add to `event-mission*.test.ts` pattern

The parallelization follows the same pattern established for Search & Filtering tests, ensuring consistency across the test suite.
