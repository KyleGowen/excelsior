# Excelsior Deckbuilder API Documentation

## Base URL
- **Development**: `http://localhost:3000`
- **Production**: `https://your-domain.com`

## Authentication
Most endpoints require authentication via session cookies. The API uses cookie-based authentication with the following roles:
- **ADMIN**: Full access to all features
- **USER**: Standard user access
- **GUEST**: Read-only access to decks

---

## Authentication Endpoints

### POST /api/auth/login
Authenticate a user and create a session.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "role": "USER|ADMIN|GUEST"
  }
}
```

### POST /api/auth/logout
Logout the current user and destroy the session.

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### GET /api/auth/me
Get the current authenticated user's information.

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "role": "USER|ADMIN|GUEST"
  }
}
```

---

## Card Data Endpoints

### GET /api/characters
Get all character cards.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "image": "string",
      "alternateImages": ["string"],
      "threat": "number",
      "power": "number",
      "health": "number"
    }
  ]
}
```

### GET /api/characters/:id/alternate-images
Get alternate images for a specific character.

**Parameters:**
- `id` (string): Character ID

**Response:**
```json
{
  "success": true,
  "data": ["string"]
}
```

### GET /api/locations
Get all location cards.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "image": "string",
      "alternateImages": ["string"],
      "threat": "number"
    }
  ]
}
```

### GET /api/special-cards
Get all special cards.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "image": "string",
      "alternateImages": ["string"],
      "threat": "number"
    }
  ]
}
```

### GET /api/special-cards/:id/alternate-images
Get alternate images for a specific special card.

**Parameters:**
- `id` (string): Special card ID

**Response:**
```json
{
  "success": true,
  "data": ["string"]
}
```

### GET /api/missions
Get all mission cards.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "image": "string",
      "alternateImages": ["string"],
      "threat": "number"
    }
  ]
}
```

### GET /api/events
Get all event cards.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "image": "string",
      "alternateImages": ["string"],
      "threat": "number"
    }
  ]
}
```

### GET /api/aspects
Get all aspect cards.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "image": "string",
      "alternateImages": ["string"],
      "threat": "number"
    }
  ]
}
```

### GET /api/advanced-universe
Get all advanced universe cards.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "image": "string",
      "alternateImages": ["string"],
      "threat": "number"
    }
  ]
}
```

### GET /api/teamwork
Get all teamwork cards.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "image": "string",
      "alternateImages": ["string"],
      "threat": "number"
    }
  ]
}
```

### GET /api/ally-universe
Get all ally universe cards.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "image": "string",
      "alternateImages": ["string"],
      "threat": "number"
    }
  ]
}
```

### GET /api/training
Get all training cards.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "image": "string",
      "alternateImages": ["string"],
      "threat": "number"
    }
  ]
}
```

### GET /api/basic-universe
Get all basic universe cards.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "image": "string",
      "alternateImages": ["string"],
      "threat": "number"
    }
  ]
}
```

### GET /api/power-cards
Get all power cards.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "image": "string",
      "alternateImages": ["string"],
      "threat": "number"
    }
  ]
}
```

### GET /api/power-cards/:id/alternate-images
Get alternate images for a specific power card.

**Parameters:**
- `id` (string): Power card ID

**Response:**
```json
{
  "success": true,
  "data": ["string"]
}
```

---

## User Management Endpoints

### GET /api/users
Get all users (ADMIN only).

**Authentication:** Required (ADMIN role)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "username": "string",
      "email": "string",
      "role": "USER|ADMIN|GUEST",
      "created_at": "string",
      "updated_at": "string"
    }
  ]
}
```

### POST /api/users
Create a new user (ADMIN only).

**Authentication:** Required (ADMIN role)

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "username": "string",
    "email": "string",
    "role": "USER",
    "created_at": "string",
    "updated_at": "string"
  },
  "message": "User \"username\" created successfully"
}
```

### POST /api/users/change-password
Change the current user's password.

**Authentication:** Required (USER or ADMIN role)

**Request Body:**
```json
{
  "newPassword": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password updated"
}
```

---

## Deck Management Endpoints

### GET /api/decks
Get all decks for the authenticated user.

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "metadata": {
        "id": "string",
        "name": "string",
        "description": "string",
        "created": "string",
        "lastModified": "string",
        "cardCount": "number",
        "threat": "number",
        "is_valid": "boolean",
        "userId": "string",
        "uiPreferences": "object",
        "is_limited": "boolean"
      },
      "cards": [
        {
          "cardType": "string",
          "cardId": "string",
          "quantity": "number",
          "selectedAlternateImage": "string"
        }
      ]
    }
  ]
}
```

### POST /api/decks
Create a new deck.

**Authentication:** Required (USER or ADMIN role, not GUEST)

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "characters": [
    {
      "cardType": "string",
      "cardId": "string",
      "quantity": "number",
      "selectedAlternateImage": "string"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "description": "string",
    "user_id": "string",
    "created_at": "string",
    "updated_at": "string",
    "cards": []
  }
}
```

### GET /api/decks/:id
Get a specific deck by ID.

**Authentication:** Required

**Parameters:**
- `id` (string): Deck ID

**Response:**
```json
{
  "success": true,
  "data": {
    "metadata": {
      "id": "string",
      "name": "string",
      "description": "string",
      "created": "string",
      "lastModified": "string",
      "cardCount": "number",
      "userId": "string",
      "uiPreferences": "object",
      "isOwner": "boolean",
      "is_limited": "boolean",
      "reserve_character": "string"
    },
    "cards": []
  }
}
```

### GET /api/decks/:id/full
Get a deck with all card types loaded (background loading endpoint).

**Authentication:** Required

**Parameters:**
- `id` (string): Deck ID

**Response:**
```json
{
  "success": true,
  "data": {
    "metadata": {
      "id": "string",
      "name": "string",
      "description": "string",
      "created": "string",
      "lastModified": "string",
      "cardCount": "number",
      "userId": "string",
      "uiPreferences": "object",
      "isOwner": "boolean",
      "is_limited": "boolean",
      "reserve_character": "string"
    },
    "cards": []
  }
}
```

### PUT /api/decks/:id
Update a deck's metadata.

**Authentication:** Required (USER or ADMIN role, not GUEST)

**Parameters:**
- `id` (string): Deck ID

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "is_limited": "boolean",
  "is_valid": "boolean",
  "reserve_character": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "metadata": {
      "id": "string",
      "name": "string",
      "description": "string",
      "created": "string",
      "lastModified": "string",
      "cardCount": "number",
      "userId": "string",
      "uiPreferences": "object",
      "isOwner": "boolean",
      "is_limited": "boolean",
      "reserve_character": "string"
    },
    "cards": []
  }
}
```

### DELETE /api/decks/:id
Delete a deck.

**Authentication:** Required (USER or ADMIN role, not GUEST)

**Parameters:**
- `id` (string): Deck ID

**Response:**
```json
{
  "success": true,
  "message": "Deck deleted successfully"
}
```

---

## Deck Card Management Endpoints

### POST /api/decks/:id/cards
Add a card to a deck.

**Authentication:** Required (USER or ADMIN role, not GUEST)

**Parameters:**
- `id` (string): Deck ID

**Request Body:**
```json
{
  "cardType": "string",
  "cardId": "string",
  "quantity": "number",
  "selectedAlternateImage": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "description": "string",
    "user_id": "string",
    "created_at": "string",
    "updated_at": "string",
    "cards": []
  }
}
```

### PUT /api/decks/:id/cards
Replace all cards in a deck (bulk operation).

**Authentication:** Required (USER or ADMIN role, not GUEST)

**Parameters:**
- `id` (string): Deck ID

**Request Body:**
```json
{
  "cards": [
    {
      "cardType": "string",
      "cardId": "string",
      "quantity": "number",
      "selectedAlternateImage": "string"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "description": "string",
    "user_id": "string",
    "created_at": "string",
    "updated_at": "string",
    "cards": []
  }
}
```

### DELETE /api/decks/:id/cards
Remove a card from a deck.

**Authentication:** Required (USER or ADMIN role, not GUEST)

**Parameters:**
- `id` (string): Deck ID

**Request Body:**
```json
{
  "cardType": "string",
  "cardId": "string",
  "quantity": "number"
}
```

**Special Case - Clear All Cards:**
```json
{
  "cardType": "all",
  "cardId": "all"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "description": "string",
    "user_id": "string",
    "created_at": "string",
    "updated_at": "string",
    "cards": []
  }
}
```

---

## Deck Validation Endpoint

### POST /api/decks/validate
Validate a deck configuration.

**Authentication:** Required

**Request Body:**
```json
{
  "cards": [
    {
      "cardType": "string",
      "cardId": "string",
      "quantity": "number",
      "selectedAlternateImage": "string"
    }
  ]
}
```

**Response (Valid Deck):**
```json
{
  "success": true,
  "message": "Deck is valid"
}
```

**Response (Invalid Deck):**
```json
{
  "success": false,
  "error": "Validation error messages",
  "validationErrors": [
    {
      "message": "string",
      "type": "string"
    }
  ]
}
```

---

## Statistics Endpoints

### GET /api/deck-stats
Get deck statistics for the authenticated user.

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "totalDecks": "number",
    "totalCards": "number",
    "averageCardsPerDeck": "number",
    "largestDeckSize": "number"
  }
}
```

---

## UI Preferences Endpoints

### GET /api/decks/:id/ui-preferences
Get UI preferences for a specific deck.

**Authentication:** Required

**Parameters:**
- `id` (string): Deck ID

**Response:**
```json
{
  "success": true,
  "data": {
    "viewMode": "tile|list",
    "sortBy": "string",
    "filterBy": "string"
  }
}
```

### PUT /api/decks/:id/ui-preferences
Update UI preferences for a specific deck.

**Authentication:** Required (GUEST users can save preferences for read-only access)

**Parameters:**
- `id` (string): Deck ID

**Request Body:**
```json
{
  "viewMode": "tile|list",
  "sortBy": "string",
  "filterBy": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "viewMode": "tile|list",
    "sortBy": "string",
    "filterBy": "string"
  }
}
```

---

## System Endpoints

### GET /health
Comprehensive health check endpoint that provides detailed system status information.

**Description:**
This endpoint performs a thorough health check of the entire system, including database connectivity, migration status, resource usage, and application metrics. It's designed for monitoring, debugging, and deployment verification.

**HTTP Status Codes:**
- `200` - System is healthy (OK or DEGRADED status)
- `503` - System is unhealthy (ERROR status)

**Response:**
```json
{
  "status": "OK|DEGRADED|ERROR",
  "timestamp": "2024-01-15T10:30:45.123Z",
  "uptime": 3600.5,
  "version": "1.0.0",
  "environment": "development|production|staging",
  "git": {
    "commit": "4a2f68584caa4dc270f45c3d4f279c93307b4f17",
    "branch": "main"
  },
  "resources": {
    "memory": {
      "rss": "45MB",
      "heapTotal": "20MB", 
      "heapUsed": "15MB",
      "external": "2MB"
    },
    "cpu": {
      "platform": "darwin",
      "arch": "x64",
      "nodeVersion": "v18.17.0"
    }
  },
  "database": {
    "status": "OK|ERROR",
    "latency": "15ms",
    "connection": "Active|Failed",
    "guestUser": {
      "exists": true,
      "count": 1,
      "users": [
        {
          "id": "uuid",
          "username": "guest",
          "role": "GUEST"
        }
      ]
    },
    "guestDecks": {
      "total": 5
    },
    "stats": {
      "totalUsers": 3,
      "totalDecks": 12,
      "totalDeckCards": 156,
      "totalCharacters": 43,
      "totalSpecialCards": 28,
      "totalPowerCards": 15
    },
    "latestMigration": {
      "version": "V150",
      "description": "Fix_The_Gemini_alternate_image",
      "type": "SQL",
      "script": "V150__Fix_The_Gemini_alternate_image.sql",
      "installedBy": "postgres",
      "installedOn": "2024-01-15T09:45:30.000Z",
      "executionTime": 250,
      "success": true
    }
  },
  "migrations": {
    "status": "OK|ERROR",
    "valid": true,
    "upToDate": true
  },
  "latency": "45ms"
}
```

**Field Descriptions:**

**Top Level:**
- `status`: Overall system health status
  - `OK`: All systems functioning normally
  - `DEGRADED`: Some non-critical issues detected (database slow, migrations pending)
  - `ERROR`: Critical system failure (database down, migration errors)
- `timestamp`: ISO 8601 timestamp of when the health check was performed
- `uptime`: Server uptime in seconds since last restart
- `version`: Application version from package.json
- `environment`: Current Node.js environment (development/production/staging)
- `latency`: Total time taken to perform the health check

**Git Information:**
- `commit`: Full SHA hash of the current git commit
- `branch`: Current git branch name

**Resource Usage:**
- `memory.rss`: Resident Set Size - total memory allocated to the process
- `memory.heapTotal`: Total heap memory allocated by V8
- `memory.heapUsed`: Heap memory currently in use by V8
- `memory.external`: Memory used by C++ objects bound to JavaScript objects
- `cpu.platform`: Operating system platform (darwin, linux, win32)
- `cpu.arch`: CPU architecture (x64, arm64, etc.)
- `cpu.nodeVersion`: Node.js version string

**Database Health:**
- `status`: Database connection and query status
- `latency`: Time taken to execute database health queries
- `connection`: Database connection state
- `guestUser`: Information about guest user accounts
  - `exists`: Whether guest users are properly configured
  - `count`: Number of guest users in the system
  - `users`: Array of guest user details
- `guestDecks`: Statistics about guest-created decks
- `stats`: Database table row counts for monitoring
- `latestMigration`: Information about the most recent database migration
  - `version`: Migration version number (e.g., V150)
  - `description`: Human-readable migration description
  - `type`: Migration type (SQL, JAVA, etc.)
  - `script`: Migration script filename
  - `installedBy`: Database user who ran the migration
  - `installedOn`: When the migration was executed
  - `executionTime`: How long the migration took (milliseconds)
  - `success`: Whether the migration completed successfully

**Migration Status:**
- `status`: Overall migration system health
- `valid`: Whether the database schema is valid
- `upToDate`: Whether all available migrations have been applied

**Usage Examples:**

**Basic Health Check:**
```bash
curl http://localhost:3000/health
```

**Health Check with Status Code:**
```bash
curl -w "%{http_code}" http://localhost:3000/health
```

**Monitoring Integration:**
This endpoint is designed for integration with monitoring systems like:
- Prometheus/Grafana
- DataDog
- New Relic
- Custom health check services

**Error Scenarios:**
- Database connection failure returns `status: "ERROR"` with HTTP 503
- Migration issues return `status: "DEGRADED"` with HTTP 200
- System resource exhaustion may affect response times
- Network issues between application and database are detected

### GET /api/database/status
Get database status information.

**Response:**
```json
{
  "status": "OK|ERROR",
  "database": {
    "valid": "boolean",
    "upToDate": "boolean",
    "migrations": "Flyway managed"
  }
}
```

### GET /test
Test endpoint for development (returns sample data).

**Response:**
```json
{
  "characters": "number",
  "locations": "number",
  "stats": {
    "characters": "number",
    "locations": "number"
  },
  "sampleLocation": {
    "id": "string",
    "name": "string",
    "description": "string"
  }
}
```

---

## Static File Endpoints

### GET /
Main application page.

### GET /users/:userId/decks
Deck builder page for a specific user.

**Parameters:**
- `userId` (string): User ID

### GET /users/:userId/decks/:deckId
Deck editor page for a specific deck.

**Parameters:**
- `userId` (string): User ID
- `deckId` (string): Deck ID

### GET /data
Database view page.

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message description"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error
- `503` - Service Unavailable

---

## Image Resources

Card images are served from the following static endpoints:
- `/src/resources/cards/images/` - Card images
- `/src/resources/images/` - General images

---

## Notes

- All timestamps are in ISO 8601 format
- Card quantities default to 1 if not specified
- Guest users have read-only access to decks
- Deck validation includes business rules (e.g., maximum 4 characters per deck)
- UI preferences are stored per deck and persist across sessions
- The health check endpoint provides comprehensive system status information