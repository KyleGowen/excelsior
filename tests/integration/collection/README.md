# Collection Feature Integration Tests

This directory contains comprehensive integration tests for the Collection feature, which allows ADMIN users to track their card collections.

## Overview

The Collection feature enables ADMIN users to:
- Create and manage their personal card collections
- Add cards of any type (characters, power cards, special cards, etc.)
- Track quantities for each card
- Update quantities and remove cards
- View their complete collection

## Test Organization

The tests are organized into 6 comprehensive test suites, each covering a specific aspect of the collection feature:

### 1. `collection-api-endpoints.test.ts`
**Purpose**: Tests all CRUD API endpoints for collections

**Coverage**:
- `GET /api/collections/me` - Get current user's collection
- `GET /api/collections/me/cards` - Get all cards in collection
- `POST /api/collections/me/cards` - Add card to collection
- `PUT /api/collections/me/cards/:cardId` - Update card quantity
- `DELETE /api/collections/me/cards/:cardId` - Remove card from collection

**Key Test Scenarios**:
- Collection creation and retrieval
- Adding cards of different types (character, power, special)
- Quantity management (add, update, remove)
- Incremental quantity increases
- Card removal via DELETE and quantity=0

### 2. `collection-admin-access.test.ts`
**Purpose**: Tests ADMIN-only access control enforcement

**Coverage**:
- Role-based access control (ADMIN only)
- Authentication requirements
- 403 Forbidden responses for non-admin users
- 401 Unauthorized for unauthenticated requests
- Consistent enforcement across all endpoints

**Key Test Scenarios**:
- ADMIN users can access all endpoints
- Regular USER role is blocked
- GUEST role is blocked
- Unauthenticated requests are rejected
- Role consistency across all endpoints

### 3. `collection-database-persistence.test.ts`
**Purpose**: Tests database persistence and data integrity

**Coverage**:
- Collection creation in database
- Card persistence with correct data
- Quantity update persistence
- Card removal persistence
- Timestamp management (created_at, updated_at)
- Referential integrity
- Data consistency

**Key Test Scenarios**:
- Collections are created with correct user_id
- Cards are persisted with all required fields
- Quantity updates are reflected in database
- Card removals delete database records
- Timestamps are properly set and updated
- Foreign key relationships are maintained

### 4. `collection-workflow.test.ts`
**Purpose**: Tests end-to-end user workflows

**Coverage**:
- Complete collection lifecycle workflows
- Multi-card collection building
- Quantity management workflows
- Collection retrieval workflows
- Real-world usage scenarios

**Key Test Scenarios**:
- Full workflow: create → add → update → remove
- Building collections with multiple card types
- Sequential and concurrent updates
- Incremental quantity management
- Collection state consistency

### 5. `collection-error-handling.test.ts`
**Purpose**: Tests error handling and edge cases

**Coverage**:
- Missing required parameters
- Invalid card IDs
- Invalid quantity values
- Non-existent cards
- Malformed requests
- Boundary conditions

**Key Test Scenarios**:
- 400 Bad Request for missing parameters
- 404 Not Found for non-existent cards
- Negative quantity rejection
- Empty/null value handling
- Invalid JSON handling
- Edge cases (zero quantity, very large quantities)

### 6. `collection-cross-user-isolation.test.ts`
**Purpose**: Tests user data isolation and security

**Coverage**:
- Collection isolation between users
- Independent collection IDs per user
- Card data isolation
- Quantity isolation
- Concurrent operations
- Database-level isolation

**Key Test Scenarios**:
- Each user has separate collection
- Users cannot access other users' collections
- Same card can exist in multiple collections independently
- Quantity updates are isolated per user
- Concurrent operations maintain isolation
- Database foreign keys enforce isolation

## Test Execution

### Running Locally

```bash
# Run all collection integration tests
npm run test:integration -- tests/integration/collection/*.test.ts

# Run specific test file
npm run test:integration -- tests/integration/collection/collection-api-endpoints.test.ts

# Run with verbose output
npm run test:integration -- tests/integration/collection/*.test.ts --verbose
```

### CI/CD Execution

Collection tests run as a parallel GitHub Actions job (`integration-tests-collection`) that executes after build and unit tests complete.

## Test Data Management

- **Test Users**: Created with unique timestamps to avoid conflicts
- **Test Cards**: Uses real card IDs from the database
- **Cleanup**: All test data is automatically cleaned up after tests complete
- **Isolation**: Each test suite uses `beforeEach` to ensure clean state

## Database Schema

The collection feature uses two main tables:

1. **`collections`**: Stores user collections
   - `id` (UUID, primary key)
   - `user_id` (UUID, foreign key to users)
   - `created_at` (timestamp)

2. **`collection_cards`**: Stores cards in collections
   - `id` (UUID, primary key)
   - `collection_id` (UUID, foreign key to collections)
   - `card_id` (UUID, references card)
   - `card_type` (string: 'character', 'power', 'special', etc.)
   - `quantity` (integer)
   - `image_path` (string)
   - `created_at` (timestamp)
   - `updated_at` (timestamp)

## Key Features Tested

### ✅ API Endpoints
- All CRUD operations
- Request/response validation
- Error responses

### ✅ Access Control
- ADMIN-only enforcement
- Authentication requirements
- Role-based restrictions

### ✅ Data Persistence
- Database storage
- Data integrity
- Timestamp management

### ✅ Workflows
- Complete user journeys
- Multi-step operations
- State management

### ✅ Error Handling
- Validation errors
- Not found errors
- Edge cases

### ✅ Security
- User isolation
- Data privacy
- Concurrent operations

## Test Statistics

- **Total Test Files**: 6
- **Total Test Cases**: ~80+ individual test scenarios
- **Coverage**: All API endpoints, access control, persistence, workflows, error handling, and isolation

## Adding New Tests

When adding new integration tests to this directory:

1. **Follow naming convention**: `collection-*.test.ts`
2. **Add documentation**: Include a header comment describing what the test file covers
3. **Use test utilities**: Leverage `integrationTestUtils` for user/deck creation
4. **Clean up**: Ensure all test data is cleaned up in `afterAll` or `beforeEach`
5. **Update README**: Add your test file to the appropriate section above

See `.cursorrules` in this directory for additional guidelines.

## Dependencies

- `supertest`: HTTP request testing
- `pg`: PostgreSQL database access
- `jest`: Test framework
- `integrationTestUtils`: Test helper utilities

## Related Documentation

- [API Documentation](../../../API_DOCUMENTATION.md) - Collection API endpoints
- [Integration Test README](../README.md) - General integration test guidelines
- [Collection Service Unit Tests](../../unit/collectionService.test.ts) - Unit tests for collection service

