# Game Logic Characters Test Parallelization

## Problem
The "Integration Tests - Game Logic Characters" package was consistently taking longer than 2 minutes to run in the CI pipeline, exceeding the desired threshold. The tests included:

- `characterLimitValidation.test.ts` (241 lines, 11 tests)
- `character-column-layout.test.ts` (221 lines, 12 tests)
- `special-character-threat-display.test.ts` (449 lines, 12 tests)

**Total:** 911 lines across 3 files, 35 tests

## Solution
Split the single "Game Logic Characters" test category into **3 parallel categories** based on thematic organization:

### 1. Game Logic - Character Validation (Port 3003)
**Files:**
- `characterLimitValidation.test.ts` (241 lines, 11 tests)

**Focus:** Character limit validation, API validation for character counts (0-4 characters)

**Total:** 241 lines, 11 tests

### 2. Game Logic - Character Layout (Port 3009)
**Files:**
- `character-column-layout.test.ts` (221 lines, 12 tests)

**Focus:** UI/layout-related character tests, single column layout enforcement

**Total:** 221 lines, 12 tests

### 3. Game Logic - Character Threat (Port 3010)
**Files:**
- `special-character-threat-display.test.ts` (449 lines, 12 tests)

**Focus:** Threat calculation and display for special characters (Carson of Venus, Morgan le Fay, etc.)

**Total:** 449 lines, 12 tests

## Implementation

### New Jest Configurations
1. **`jest.integration.game-logic-character-validation.config.js`** - Character validation tests
2. **`jest.integration.game-logic-character-layout.config.js`** - Character layout/UI tests
3. **`jest.integration.game-logic-character-threat.config.js`** - Character threat display tests

### Updated Files
- **`package.json`** - Added new test scripts for each category
- **`.github/workflows/deploy.yml`** - Replaced single Game Logic Characters job with 3 parallel jobs
- **`jest.integration.config.js`** - Already excludes character tests (no changes needed)

### New NPM Scripts
```bash
# Individual categories
npm run test:integration:game-logic-character-validation
npm run test:integration:game-logic-character-layout
npm run test:integration:game-logic-character-threat

# Watch modes
npm run test:integration:game-logic-character-validation:watch
npm run test:integration:game-logic-character-layout:watch
npm run test:integration:game-logic-character-threat:watch

# Coverage modes
npm run test:integration:game-logic-character-validation:coverage
npm run test:integration:game-logic-character-layout:coverage
npm run test:integration:game-logic-character-threat:coverage

# Parallel execution (all character tests)
npm run test:integration:game-logic:parallel
```

## Expected Performance Improvement

### Before
- **Single Game Logic Characters job**: ~2+ minutes
- **Total test files**: 3 files
- **Total lines**: 911 lines
- **Total tests**: 35 tests

### After
- **3 parallel Game Logic Characters jobs**: ~30-45 seconds each (running simultaneously)
- **Character Validation**: 1 file, 241 lines, 11 tests
- **Character Layout**: 1 file, 221 lines, 12 tests
- **Character Threat**: 1 file, 449 lines, 12 tests

### Time Savings
- **Previous**: 2+ minutes (sequential)
- **New**: ~30-45 seconds (parallel execution)
- **Improvement**: ~60-75% faster execution time

## GitHub Actions Workflow Changes

### Before
```yaml
integration-tests-game-logic-characters:
  name: Integration Tests - Game Logic Characters
  # Single job running all character tests
```

### After
```yaml
integration-tests-game-logic-character-validation:
  name: Integration Tests - Game Logic Character Validation
  # Character validation tests only

integration-tests-game-logic-character-layout:
  name: Integration Tests - Game Logic Character Layout
  # Character layout tests only

integration-tests-game-logic-character-threat:
  name: Integration Tests - Game Logic Character Threat
  # Character threat tests only
```

## Port Configuration
Each parallel test category uses a different port to avoid conflicts:
- **Character Validation**: Port 3003
- **Character Layout**: Port 3009
- **Character Threat**: Port 3010
- **Reserve Characters**: Port 3004 (unchanged)
- **Power & Teamwork**: Port 3005 (unchanged)
- **Main Integration**: Port 3000 (unchanged)

## Thematic Organization

The split follows a clear thematic organization:

1. **Validation** - Rules and constraints (character limits)
2. **Layout** - UI/UX and visual presentation (column layout)
3. **Threat** - Game mechanics and calculations (threat display)

This organization makes it easy to understand which tests belong in which category and helps maintain consistency as new tests are added.

## Maintenance
When adding new character-related tests:
1. **Character validation/rules tests** → Add to `characterLimitValidation.test.ts` or create new validation test file
2. **Character layout/UI tests** → Add to `character-column-layout.test.ts` or create new layout test file
3. **Character threat/mechanics tests** → Add to `special-character-threat-display.test.ts` or create new threat test file

The parallelization follows the same pattern established for other test categories, ensuring consistency across the test suite.

## Verification
All configurations have been tested and verified:
- ✅ Jest configurations correctly identify test files
- ✅ Main integration config excludes character tests
- ✅ New test scripts work correctly
- ✅ GitHub Actions workflow updated with parallel jobs
- ✅ Build-docker job updated to reference new job names

