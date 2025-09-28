# Overpower Deckbuilder Test Suite

This directory contains comprehensive integration and unit tests for the Overpower Deckbuilder application.

## Test Structure

```
tests/
├── integration/          # Integration tests that test full API workflows
│   ├── authentication.test.ts
│   ├── deckManagement.test.ts
│   └── readOnlyMode.test.ts
├── unit/                 # Unit tests for individual functions/classes
├── helpers/              # Test utilities and helpers
│   └── apiClient.ts
├── config/               # Test configuration
│   └── testConfig.ts
├── fixtures/             # Test data and fixtures
└── setup.ts             # Global test setup and teardown
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run only integration tests
npm run test:integration

# Run only unit tests
npm run test:unit
```

## Writing Tests

### Integration Tests

Integration tests test complete workflows and API endpoints. They use the `ApiClient` helper to make HTTP requests to your application.

Example:
```typescript
describe('Deck Creation', () => {
  it('should create a new deck with valid data', async () => {
    const deckData = {
      name: 'Test Deck',
      description: 'A test deck'
    };

    const response = await apiClient.createDeck(deckData);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe(deckData.name);
  });
});
```

### Unit Tests

Unit tests test individual functions or classes in isolation.

Example:
```typescript
import { validateDeck } from '../../src/utils/deckValidation';

describe('Deck Validation', () => {
  it('should validate a legal deck', () => {
    const deck = [/* test deck data */];
    const result = validateDeck(deck);
    
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
```

## Test Configuration

Tests use a separate test database (`overpower_test`) to avoid affecting your development data. The test database is automatically created and cleaned up during test runs.

## Available Test Helpers

### ApiClient

The `ApiClient` class provides convenient methods for making authenticated API requests:

```typescript
const apiClient = new ApiClient(app);

// Authentication
await apiClient.login('username', 'password');
await apiClient.logout();
await apiClient.getCurrentUser();

// Deck management
await apiClient.createDeck(deckData);
await apiClient.getDeck(deckId);
await apiClient.updateDeck(deckId, updates);
await apiClient.deleteDeck(deckId);

// Card management
await apiClient.addCardToDeck(deckId, cardData);
await apiClient.removeCardFromDeck(deckId, cardData);
```

### Test Configuration

Use `testConfig` for consistent test data:

```typescript
import { testConfig } from '../config/testConfig';

// Use predefined test users
await apiClient.login(testConfig.testUsers.regular.name, 'password');

// Use predefined test decks
const deck = await apiClient.createDeck(testConfig.testDecks.valid);

// Use predefined test cards
await apiClient.addCardToDeck(deckId, testConfig.testCards.character);
```

## Describing Test Scenarios

When you want me to write tests for specific scenarios, describe them like this:

1. **What you want to test**: "I want to test the deck sharing functionality"
2. **The scenario**: "When a user shares a deck link with another user, that user should be able to view the deck in read-only mode"
3. **Expected behavior**: "The viewer should see all deck contents but not be able to edit them"
4. **Edge cases**: "What happens if the deck doesn't exist? What if the user isn't logged in?"

I'll then write comprehensive tests covering all these scenarios!

## Test Data Management

- Tests automatically create and clean up test data
- Each test runs in isolation
- The test database is reset between test runs
- Use the `testConfig` for consistent test data across tests

## Debugging Tests

To debug failing tests:

1. Run tests with verbose output: `npm test -- --verbose`
2. Add `console.log` statements in your tests
3. Use `--detectOpenHandles` to find async operations that aren't closing
4. Check the test database for unexpected data

## Best Practices

1. **Test one thing at a time**: Each test should verify one specific behavior
2. **Use descriptive test names**: "should allow deck owner to edit their deck" not "should work"
3. **Arrange, Act, Assert**: Structure your tests clearly
4. **Clean up after yourself**: Don't leave test data in the database
5. **Test both success and failure cases**: Verify error handling works correctly
6. **Use realistic test data**: Make your tests reflect real usage patterns
