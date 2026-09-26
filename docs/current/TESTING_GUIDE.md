# Excelsior Deckbuilder Testing Guide

## 🚀 Jest Integration Test Framework Setup Complete!

Your project now has a comprehensive Jest testing framework set up with the following features:

### ✅ What's Included

1. **Jest Configuration** (`jest.config.js`)
   - TypeScript support with ts-jest
   - Test environment setup
   - Coverage reporting
   - Separate test database

2. **Test Structure**
   ```
   tests/
   ├── integration/          # Full API workflow tests
   ├── unit/                 # Individual function tests
   ├── helpers/              # Test utilities (ApiClient)
   ├── config/               # Test configuration
   └── setup.ts             # Global setup/teardown
   ```

3. **Test Scripts** (in package.json)
   - `npm test` - Run all tests
   - `npm run test:watch` - Run tests in watch mode
   - `npm run test:coverage` - Run with coverage report
   - `npm run test:integration` - Run only integration tests
   - `npm run test:unit` - Run only unit tests

4. **Sample Tests Created**
   - Authentication scenarios
   - Deck management workflows
   - Read-only mode functionality

### 🧪 How to Use

#### Running Tests
```bash
# Run all tests
npm test

# Run specific test file
npm test deckManagement.test.ts

# Run with coverage
npm run test:coverage
```

#### Writing New Tests

**For Integration Tests:**
```typescript
describe('Your Feature', () => {
  let apiClient: ApiClient;
  
  beforeEach(async () => {
    apiClient = new ApiClient(app);
    await apiClient.login('username', 'password');
  });
  
  it('should do something', async () => {
    const response = await apiClient.createDeck({ name: 'Test Deck' });
    expect(response.body.success).toBe(true);
  });
});
```

**For Unit Tests:**
```typescript
import { validateDeck } from '../../src/utils/deckValidation';

describe('Deck Validation', () => {
  it('should validate a legal deck', () => {
    const deck = [/* test data */];
    const result = validateDeck(deck);
    expect(result.isValid).toBe(true);
  });
});
```

### 📝 Describing Test Scenarios

When you want me to write tests for specific scenarios, just describe them like this:

**Example 1:**
> "I want to test the deck sharing functionality. When a user shares a deck link with another user, that user should be able to view the deck in read-only mode. The viewer should see all deck contents but not be able to edit them. Also test what happens if the deck doesn't exist or if the user isn't logged in."

**Example 2:**
> "Test the card search functionality. When a user types in the search bar, it should find cards by name, type, and character. Test that special cards show up when searching for a character name. Also test the hover effects and the scrollbar visibility."

**Example 3:**
> "Test the save functionality. When a user makes changes to their deck and clicks save, it should persist the changes. Test that validation errors are shown for invalid decks. Test that the save button is disabled in read-only mode."

### Test configuration and categories

Unit and integration tests use separate Jest configs in `tests/config/`. CI automatically shards the complete integration suite; category commands are available for focused local debugging.

**Unit tests**

- Config: `tests/config/jest.unit.config.js`
- Match: `**/tests/unit/**/*.test.ts` (and `*.spec.ts`)
- Run: `npm run test:unit`
- **v2 SPA tests:** `tests/unit/frontend-v2/` — import directly from `frontend/src/` (deck export/import, card images, legality badge, progressive images, etc.). No jsdom loading of removed `public/js` scripts.

**Integration tests (all)**

- Config: `tests/config/jest.integration.config.js`
- Match: `**/tests/integration/**/*.test.ts` (no category exclusions)
- Run: `npm run test:integration`
- Legacy JSON user/session persistence is automatically redirected to a process-scoped temporary directory whenever `NODE_ENV=test`. Tests must not rewrite repository `data/users.json` or `data/sessions.json`. Set `USER_PERSISTENCE_DATA_DIR` only when a test needs an explicit isolated location.
- Run `npm run test:integration:isolated` for the complete suite against a disposable PostgreSQL database without touching the development database.
- Run `npm run test:integration:sharded` for the same complete suite split across two concurrent Jest processes. The runner starts and migrates one disposable PostgreSQL container per shard, assigns distinct server ports, Jest caches, and persistence directories, and verifies before execution that every test file occurs in exactly one shard.
- Run `npm run test:integration:shard-plan` to verify and print the two-shard test-file counts without Docker or database changes.
- A fresh Ship integration gate uses the guarded two-shard runner. The original `npm run test:integration` command remains available for compatibility and focused local debugging against a caller-provided database.

**Integration test categories** (each has its own config in `tests/config/`)

| Config | Pattern / files |
|--------|------------------|
| `jest.integration.security.config.js` | `role-based-restrictions.test.ts` |
| `jest.integration.deck-security-save.config.js` | `deck-save-security*.test.ts` |
| `jest.integration.deck-security-ownership.config.js` | `deck-ownership-security*.test.ts` |
| `jest.integration.deck-security-frontend.config.js` | `deck-save-frontend-validation.test.ts` |
| `jest.integration.game-logic-reserve.config.js` | `reserve-character*.test.ts`, `guest-reserve-character-integration.test.ts` |
| `jest.integration.reserve-core.config.js` | `reserve-character-integration.test.ts`, `reserve-character-loading-integration.test.ts`, `reserve-character-simple.test.ts` |
| `jest.integration.reserve-threat.config.js` | `reserve-character-threat-integration.test.ts`, `reserve-character-threat-persistence.test.ts`, `guest-reserve-character-integration.test.ts` |
| `jest.integration.game-logic-characters.config.js` | `character*.test.ts`, `special-character-threat-display.test.ts` |
| `jest.integration.game-logic-character-validation.config.js` | `characterLimitValidation.test.ts` |
| `jest.integration.game-logic-character-layout.config.js` | `character-column-layout.test.ts` |
| `jest.integration.game-logic-character-threat.config.js` | `special-character-threat-display.test.ts` |
| `jest.integration.game-logic-power-teamwork.config.js` | `power*.test.ts`, `teamwork*.test.ts`, `event-mission-filtering-integration.test.ts` |
| `jest.deckbuilding.config.js` | `deckBuilding.test.ts` |

**Run a single category**

```bash
npx jest -c tests/config/jest.integration.security.config.js
npx jest -c tests/config/jest.integration.deck-security-save.config.js
# etc.
```

**Frontend (v2) unit tests**

- Directory: `tests/unit/frontend-v2/`
- Run: `npm run test:unit -- frontend-v2` or `npm run test:unit -- importDeckFromJson.test.ts`
- Examples: `buildDeckExportJson.test.ts`, `importDeckFromJson.test.ts`, `draw-hand-v2.test.ts` (under `tests/unit/`), `deck-card-catalog.test.ts`, `simulate-ko.test.ts`

### Where to add new tests

- **Unit tests**: Add `*.test.ts` under `tests/unit/` (backend) or `tests/unit/frontend-v2/` (v2 SPA). Use `tests/helpers/apiClient.ts` for integration HTTP helpers. See [tests/helpers/README.md](../../tests/helpers/README.md).
- **Integration tests**: Add `*.test.ts` under `tests/integration/`. Match one of the category patterns above (e.g. `deck-save-security-*.test.ts` for deck save security) so the test runs in the right CI job. See `tests/integration/.cursorrules` for mandatory cleanup rules (track test users/decks, clean up in `finally`).

### v2 layout mode

Mobile/desktop layout in the v2 SPA is driven by `LayoutModeProvider` at the 900px breakpoint. Feature-level unit tests live under `frontend/src/` and `tests/unit/frontend-v2/`; manual mobile checks use viewport ≤900px at `http://localhost:5173`.

### 🔧 Test Configuration

The tests use a separate test database (`overpower_test`) to avoid affecting your development data. The test database is automatically:
- Created before tests run
- Migrated with your schema
- Cleaned up after tests complete

### 🎯 Current Test Status

✅ **All tests passing** (62+ integration tests across 9 parallel categories)
- **Security tests**: Deck ownership, save security, role-based restrictions
- **Authentication tests**: Login/logout, guest users, password security
- **Search & Filtering tests**: Card search, stat filtering, ally search
- **Deck Core tests**: Deck building, management, navigation, editing
- **Deck Security tests**: Save validation, API security, role access
- **Game Logic tests**: Character mechanics, power cards, teamwork
- **UI/UX tests**: Clickability, editability, layout, navigation
- **User Management tests**: User creation, cross-user interactions
- **Remaining tests**: Database views, alternate cards, bug fixes

### 🚀 Next Steps

1. **Uncomment the actual API calls** in the test files when you're ready to test against your real application
2. **Add your app import** to the test files: `import app from '../../src/index';`
3. **Describe specific scenarios** you want me to write tests for
4. **Run tests regularly** as you develop new features

### 💡 Pro Tips

- Use `npm run test:watch` during development for instant feedback
- Check `coverage/` folder for detailed coverage reports
- Use `console.log()` in tests for debugging
- Tests run in isolation - each test gets a clean database state
- Use the `ApiClient` helper for consistent API testing

---

**Ready to test!** 🎉 Just describe any scenario you want tested and I'll write comprehensive tests for it!

### Authoritative integration discovery

The main integration config now includes **every** integration test; the CI
workflow uses eight automatic shards instead of hand-maintained categories.
Category commands remain useful for focused debugging but do not define CI
coverage. `npm run test:integration:shard-plan` additionally rejects any test
file omitted by the Jest configuration. Build the production frontend before
running integration tests that serve app routes.

Security tests in `production-access-policy.test.ts` and the deck-save suites
use the production Express app, real login cookies/JWTs, and disposable data.
Do not use `x-test-user-id` as evidence of production authentication. React
markup must be tested through React; the API's HTML shell is not rendered deck
content. Integration fixtures must use `DATABASE_URL`, never a hardcoded local
port, and must use real current card IDs rather than made-up IDs or old art paths.

Fresh Flyway replay includes a guarded `beforeEachMigrate` repair at version 358:
V201's unordered alternate-art selection could give Van Helsing 529F prize-pack
art and make V359's catalog assertion fail. The callback fixes that foil's source
and map before V359, preserves the prize-pack base, and does nothing after V359.
Applied migration checksums remain unchanged. `legacy-foil-migration.test.ts`
covers the adverse fixture, idempotence, and the version guard; every fresh CI
shard also runs the full migration history.
