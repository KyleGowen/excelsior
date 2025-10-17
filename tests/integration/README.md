# Integration Tests - Overpower Deckbuilder

This directory contains comprehensive integration tests for the Overpower Deckbuilder application. These tests verify end-to-end functionality by testing complete workflows, API endpoints, and user interactions against a real PostgreSQL database.

## Table of Contents

- [Overview](#overview)
- [Technologies & Architecture](#technologies--architecture)
- [Test Categories & Parallelization](#test-categories--parallelization)
- [Running Integration Tests](#running-integration-tests)
- [Test Structure & Patterns](#test-structure--patterns)
- [Database Management](#database-management)
- [Writing New Integration Tests](#writing-new-integration-tests)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

Integration tests in this project test complete user workflows and API interactions. Unlike unit tests that test individual functions in isolation, integration tests verify that multiple components work together correctly in realistic scenarios.

### Key Characteristics

- **Real Database**: Tests run against a real PostgreSQL database (not mocked)
- **Full API Testing**: Tests actual HTTP endpoints and responses
- **User Workflows**: Tests complete user journeys from login to deck creation
- **Parallel Execution**: Tests are organized into categories for parallel CI execution
- **Automatic Cleanup**: Test data is automatically tracked and cleaned up

## Technologies & Architecture

### Core Technologies

- **Jest**: Primary testing framework with TypeScript support
- **Supertest**: HTTP assertion library for API testing
- **PostgreSQL**: Real database for integration testing
- **Flyway**: Database migration management
- **Node.js**: Runtime environment
- **TypeScript**: Language for test implementation

### Test Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Integration Test Layer                    │
├─────────────────────────────────────────────────────────────┤
│  Jest Test Suites  │  Supertest API Client  │  Test Utils   │
├─────────────────────────────────────────────────────────────┤
│                    Application Layer                        │
├─────────────────────────────────────────────────────────────┤
│  Express.js API    │  Authentication    │  Business Logic   │
├─────────────────────────────────────────────────────────────┤
│                    Data Layer                               │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL Database  │  Flyway Migrations  │  Repositories │
└─────────────────────────────────────────────────────────────┘
```

### Test Environment Setup

- **Database**: PostgreSQL 15 with test-specific database
- **Port**: Tests run on port 3000 (configurable)
- **Environment**: `NODE_ENV=test`
- **Migrations**: Automatic Flyway migration execution
- **Cleanup**: Automatic test data cleanup after each test

## Test Categories & Parallelization

Integration tests are organized into **7 parallel categories** for optimal CI/CD performance. Each category runs independently with its own database instance.

### 1. Security & Authentication Tests
**Patterns**: `*-security-*.test.ts`, `*-auth-*.test.ts`, `guest-*.test.ts`, `authentication*.test.ts`, `auth-*.test.ts`

**Examples**:
- `deck-ownership-security*.test.ts` - Deck ownership validation
- `bcrypt-authentication.test.ts` - Password hashing verification
- `guest-*.test.ts` - Guest user functionality
- `authentication*.test.ts` - Login/logout workflows
- `auth-*.test.ts` - Authentication middleware

**Focus**: User authentication, authorization, security vulnerabilities, role-based access control

### 2. Search & Filtering Tests
**Patterns**: `*search*.test.ts`, `*filtering*.test.ts`, `stat-type-filtering*.test.ts`, `ally-search*.test.ts`

**Examples**:
- `search-functionality-integration.test.ts` - Card search functionality
- `stat-type-filtering-integration.test.ts` - Stat-based filtering
- `ally-search-integration.test.ts` - Ally card search

**Focus**: Search algorithms, filtering logic, card discovery, user interface interactions

### 3. Deck Core Tests
**Patterns**: `deckBuilding.test.ts`, `deckManagement.test.ts`, `deck-navigation-flow.test.ts`, `deck-editor-search-new-deck.test.ts`, `deckClickability.test.ts`, `deckEditabilityBrowser.test.ts`, `deckEditabilityHTML.test.ts`, `deckTitleDescriptionEditability.test.ts`, `deck-validation-unusable-cards.test.ts`, `limitedDeckIntegration.test.ts`, `limitedDeckSaveAndLoad.test.ts`, `limitedDeckSimpleIntegration.test.ts`

**Examples**:
- `deckManagement.test.ts` - Core deck operations
- `deckBuilding.test.ts` - Deck construction workflows
- `limitedDeckIntegration.test.ts` - Limited deck functionality
- `deck-editor-search-new-deck.test.ts` - New deck creation
- `deckClickability.test.ts` - Deck interaction functionality
- `deckEditabilityHTML.test.ts` - HTML-based deck editing

**Focus**: Basic deck operations, deck construction, navigation, editing, limited deck functionality

### 4. Deck Security Tests
**Patterns**: `deck-editor-role-access.test.ts`, `deck-ownership-security-simple.test.ts`, `deck-ownership-security.test.ts`, `deck-save-frontend-validation.test.ts`, `deck-save-security-api.test.ts`, `deck-save-security-comprehensive.test.ts`, `deck-save-security-simple.test.ts`

**Examples**:
- `deck-ownership-security.test.ts` - Deck ownership validation
- `deck-save-security-api.test.ts` - API-level save security
- `deck-editor-role-access.test.ts` - Role-based editor access
- `deck-save-frontend-validation.test.ts` - Frontend save validation

**Focus**: Deck security, ownership validation, role-based access control, save operation security

### 5. Game Logic Tests
**Patterns**: `reserve-character*.test.ts`, `character*.test.ts`, `power*.test.ts`, `teamwork*.test.ts`, `event-mission-filtering*.test.ts`

**Examples**:
- `reserve-character-integration.test.ts` - Reserve character mechanics
- `characterLimitValidation.test.ts` - Character limit rules
- `power-card-counting-integration.test.ts` - Power card calculations
- `teamwork-card-fixes.test.ts` - Teamwork card interactions
- `event-mission-filtering-integration.test.ts` - Event/mission filtering

**Focus**: Game rules, card interactions, validation logic, game mechanics

### 6. UI/UX & Frontend Tests
**Patterns**: `*HTML*.test.ts`, `*Browser*.test.ts`, `*Clickability*.test.ts`, `*Editability*.test.ts`, `*Layout*.test.ts`, `*Navigation*.test.ts`, `*Tooltip*.test.ts`

**Examples**:
- `deckClickability.test.ts` - Button click interactions
- `deckEditabilityHTML.test.ts` - HTML form editing
- `deckEditabilityBrowser.test.ts` - Browser-based editing
- `character-column-layout.test.ts` - Layout rendering
- `global-nav-integration.test.ts` - Navigation functionality
- `tooltipAndLegalityIconIntegration.test.ts` - UI tooltips and icons

**Focus**: User interface, user experience, browser interactions, layout rendering

### 7. Remaining Tests
**Patterns**: `create*.test.ts`, `user*.test.ts`, `cross*.test.ts`, `new*.test.ts`, `auto*.test.ts`, `database*.test.ts`, `change*.test.ts`, `username*.test.ts`, `alternate*.test.ts`

**Examples**:
- `createUserIntegration.test.ts` - User creation workflows
- `create-deck-scenarios.test.ts` - Deck creation scenarios
- `cross-user-deck-viewing.test.ts` - Cross-user interactions
- `autoGuestLogin.test.ts` - Automatic guest login
- `databaseView.test.ts` - Database view functionality
- `change-password.test.ts` - Password change workflows
- `username-persistence-flow.test.ts` - Username persistence
- `alternatePowerCards.test.ts` - Alternate card functionality

**Focus**: Miscellaneous functionality, cross-cutting concerns, utility features

## Running Integration Tests

### Local Development

```bash
# Run all integration tests
npm run test:integration

# Run specific test category
npm run test:integration -- tests/integration/deck*.test.ts

# Run with verbose output
npm run test:integration -- --verbose

# Run with coverage
npm run test:integration -- --coverage

# Run specific test file
npm run test:integration -- tests/integration/deckManagement.test.ts
```

### CI/CD Pipeline

Integration tests run in **7 parallel jobs** in GitHub Actions:

1. **integration-setup**: Shared setup (checkout, build, database setup)
2. **integration-tests-security**: Security & Authentication tests
3. **integration-tests-search**: Search & Filtering tests  
4. **integration-tests-deck-core**: Deck Core tests
5. **integration-tests-deck-security**: Deck Security tests
6. **integration-tests-game-logic**: Game Logic tests
7. **integration-tests-ui**: UI/UX & Frontend tests
8. **integration-tests-remaining**: Remaining tests

Each parallel job:
- Runs independently with its own PostgreSQL service
- Executes database migrations
- Runs tests with `--maxWorkers=2` for optimal performance
- Has a 15-minute timeout
- Reports results back to the main workflow

### Performance Metrics

**Typical Execution Times** (as of latest optimization):
- Security & Auth: ~1:44
- Search & Filtering: ~1:27
- Deck Core: ~1:00-1:30
- Deck Security: ~1:00-1:30
- Game Logic: ~1:00-1:30
- UI/UX & Frontend: ~1:21
- Remaining: ~1:42

**Total Pipeline Time**: ~1:44 (limited by longest category)

**Performance Improvement**: The subdivision of Deck Management into Deck Core and Deck Security categories allows these tests to run in parallel, reducing the overall pipeline execution time from the previous single large category.

## Test Structure & Patterns

### Basic Test Structure

```typescript
import { app } from '../../src/test-server';
import { integrationTestUtils } from '../setup-integration';
import request from 'supertest';

describe('Feature Name', () => {
  let testUser: any;
  let testDeck: any;

  beforeAll(async () => {
    // Setup test data
    testUser = await integrationTestUtils.createTestUser({
      name: 'TestUser',
      email: 'test@example.com',
      role: 'USER'
    });
  });

  afterEach(async () => {
    // Cleanup is automatic via integrationTestUtils
  });

  it('should perform specific action', async () => {
    // Arrange
    const deckData = { name: 'Test Deck', description: 'Test Description' };
    
    // Act
    const response = await request(app)
      .post('/api/decks')
      .send(deckData)
      .expect(201);
    
    // Assert
    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe(deckData.name);
  });
});
```

### Authentication Testing Pattern

```typescript
describe('Authentication', () => {
  it('should login with valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: 'kyle', password: 'test' })
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data.username).toBe('kyle');
    expect(response.headers['set-cookie']).toBeDefined();
  });

  it('should reject invalid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: 'invalid', password: 'wrong' })
      .expect(401);
    
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('Invalid credentials');
  });
});
```

### Deck Testing Pattern

```typescript
describe('Deck Management', () => {
  let testUser: any;
  let authCookie: string;

  beforeAll(async () => {
    testUser = await integrationTestUtils.createTestUser({
      name: 'DeckTestUser',
      email: 'decktest@example.com'
    });

    // Login to get auth cookie
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ username: testUser.username, password: 'password123' });
    
    authCookie = loginResponse.headers['set-cookie'][0];
  });

  it('should create a new deck', async () => {
    const deckData = {
      name: 'Test Deck',
      description: 'A test deck for integration testing'
    };

    const response = await request(app)
      .post('/api/decks')
      .set('Cookie', authCookie)
      .send(deckData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe(deckData.name);
    expect(response.body.data.user_id).toBe(testUser.id);

    // Track for cleanup
    integrationTestUtils.trackTestDeck(response.body.data.id);
  });
});
```

## Database Management

### Test Database Setup

- **Database Name**: `overpower` (same as development)
- **Port**: 1337 (CI), 5432 (local)
- **User**: `postgres`
- **Password**: `password`
- **Migrations**: Automatic via Flyway

### Data Cleanup Strategy

**Automatic Tracking**: All test-created data is automatically tracked:

```typescript
// Track a deck for cleanup
integrationTestUtils.trackTestDeck(deckId);

// Track a user for cleanup  
integrationTestUtils.trackTestUser(userId);

// Create tracked test data
const user = await integrationTestUtils.createTestUser(userData);
const deck = await integrationTestUtils.createTestDeck(userId, deckData);
```

**Cleanup Phases**:
1. **After Each Test**: Clean up tracked decks and cards
2. **After Each Suite**: Clean up tracked users (if needed)
3. **Global Cleanup**: Comprehensive cleanup of all test data

### Protected Data

Certain production data is protected from deletion:
- V113 "Ungodly Powers" deck (`be383a46-c8e0-4f85-8fc7-2a3b33048ced`)
- Current "Ungodly Powers" deck (`c17c8b37-6d6a-41ca-8460-c7eb4648406f`)

## Writing New Integration Tests

### 1. Choose the Right Category

Follow the categorization patterns to place your test in the appropriate category:

```typescript
// Security & Auth
describe('User Role Validation', () => {
  // Test role-based access control
});

// Search & Filtering  
describe('Card Search Functionality', () => {
  // Test search algorithms
});

// Deck Core
describe('Deck Creation Workflow', () => {
  // Test basic deck operations
});

// Deck Security
describe('Deck Ownership Validation', () => {
  // Test deck security and permissions
});

// Game Logic
describe('Power Card Validation', () => {
  // Test game rules and mechanics
});

// UI/UX & Frontend
describe('Button Click Interactions', () => {
  // Test user interface interactions
});

// Remaining
describe('User Management', () => {
  // Test miscellaneous functionality
});
```

### 2. Follow Naming Conventions

**File Naming**: Use descriptive names that match category patterns:
- `deck-ownership-security.test.ts` (Security & Auth)
- `search-functionality-integration.test.ts` (Search & Filtering)
- `deck-management.test.ts` (Deck Core)
- `deck-save-security-api.test.ts` (Deck Security)
- `power-card-validation.test.ts` (Game Logic)
- `button-clickability.test.ts` (UI/UX)
- `user-creation.test.ts` (Remaining)

**Test Naming**: Use descriptive test names:
```typescript
it('should allow deck owner to edit their deck', () => {});
it('should prevent non-owners from editing decks', () => {});
it('should validate deck size requirements', () => {});
```

### 3. Use Test Utilities

```typescript
import { integrationTestUtils } from '../setup-integration';

// Create test users
const user = await integrationTestUtils.createTestUser({
  name: 'TestUser',
  email: 'test@example.com',
  role: 'USER'
});

// Create test decks
const deck = await integrationTestUtils.createTestDeck(user.id, {
  name: 'Test Deck',
  description: 'Test Description'
});

// Track for cleanup
integrationTestUtils.trackTestDeck(deck.id);
```

### 4. Test Real Workflows

```typescript
describe('Complete Deck Creation Workflow', () => {
  it('should create deck, add cards, and save successfully', async () => {
    // 1. Login
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ username: 'kyle', password: 'test' });
    
    const authCookie = loginResponse.headers['set-cookie'][0];
    
    // 2. Create deck
    const deckResponse = await request(app)
      .post('/api/decks')
      .set('Cookie', authCookie)
      .send({ name: 'Test Deck', description: 'Test' });
    
    const deckId = deckResponse.body.data.id;
    integrationTestUtils.trackTestDeck(deckId);
    
    // 3. Add cards
    await request(app)
      .post(`/api/decks/${deckId}/cards`)
      .set('Cookie', authCookie)
      .send({ cardType: 'character', cardId: 'char1', quantity: 1 });
    
    // 4. Verify deck contents
    const deckData = await request(app)
      .get(`/api/decks/${deckId}`)
      .set('Cookie', authCookie);
    
    expect(deckData.body.data.cards).toHaveLength(1);
  });
});
```

## Best Practices

### 1. Test Organization

- **One concept per test**: Each test should verify one specific behavior
- **Descriptive names**: Test names should clearly describe what they're testing
- **Arrange, Act, Assert**: Structure tests with clear sections
- **Independent tests**: Tests should not depend on each other

### 2. Data Management

- **Use test utilities**: Always use `integrationTestUtils` for data creation
- **Track everything**: Track all created data for automatic cleanup
- **Realistic data**: Use realistic test data that reflects real usage
- **Clean state**: Ensure tests start with a clean database state

### 3. Error Handling

- **Test both success and failure**: Verify both happy path and error cases
- **Meaningful assertions**: Assert on specific values, not just existence
- **Error messages**: Verify error messages are helpful and accurate
- **Status codes**: Check appropriate HTTP status codes

### 4. Performance

- **Efficient queries**: Use efficient database queries in tests
- **Minimal data**: Create only the data needed for each test
- **Parallel execution**: Design tests to run in parallel safely
- **Timeouts**: Use appropriate timeouts for long-running operations

### 5. Maintenance

- **Update tests with features**: Keep tests in sync with application changes
- **Remove obsolete tests**: Delete tests for removed functionality
- **Document complex tests**: Add comments for complex test scenarios
- **Regular review**: Periodically review and refactor test code

## Troubleshooting

### Common Issues

**Database Connection Errors**:
```bash
# Check if PostgreSQL is running
pg_isready -h localhost -p 1337 -U postgres

# Check database URL
echo $DATABASE_URL
```

**Test Timeout Issues**:
```typescript
// Increase timeout for specific test
it('should handle long operation', async () => {
  // Test code
}, 60000); // 60 second timeout
```

**Cleanup Issues**:
```typescript
// Manual cleanup if needed
await integrationTestUtils.cleanupAllTestData();
```

**Port Conflicts**:
```bash
# Check what's using port 3000
lsof -i :3000

# Kill process if needed
kill -9 <PID>
```

### Debug Mode

```bash
# Run with debug output
npm run test:integration -- --verbose --detectOpenHandles

# Run specific test with debug
npm run test:integration -- tests/integration/deckManagement.test.ts --verbose
```

### CI/CD Issues

**Check GitHub Actions logs** for:
- Database connection issues
- Migration failures
- Test timeout errors
- Resource constraints

**Common CI fixes**:
- Increase timeout values
- Check database service configuration
- Verify test data cleanup
- Review parallel execution conflicts

---

## Contributing

When adding new integration tests:

1. **Choose the right category** based on functionality
2. **Follow naming conventions** for files and tests
3. **Use test utilities** for data creation and cleanup
4. **Test real workflows** end-to-end
5. **Update this README** if adding new patterns or categories

For questions or issues with integration tests, refer to the main project documentation or create an issue in the repository.
