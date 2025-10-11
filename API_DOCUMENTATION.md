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
Comprehensive health check endpoint.

**Response:**
```json
{
  "status": "OK|DEGRADED|ERROR",
  "timestamp": "string",
  "uptime": "number",
  "version": "string",
  "environment": "string",
  "git": {
    "commit": "string",
    "branch": "string"
  },
  "resources": {
    "memory": {
      "rss": "string",
      "heapTotal": "string",
      "heapUsed": "string",
      "external": "string"
    },
    "cpu": {
      "platform": "string",
      "arch": "string",
      "nodeVersion": "string"
    }
  },
  "database": {
    "status": "OK|ERROR",
    "latency": "string",
    "connection": "Active|Failed",
    "guestUser": {
      "exists": "boolean",
      "count": "number",
      "users": []
    },
    "guestDecks": {
      "total": "number"
    },
    "stats": {
      "totalUsers": "number",
      "totalDecks": "number",
      "totalDeckCards": "number",
      "totalCharacters": "number",
      "totalSpecialCards": "number",
      "totalPowerCards": "number"
    },
    "latestMigration": {
      "version": "string",
      "description": "string",
      "type": "string",
      "script": "string",
      "installedBy": "string",
      "installedOn": "string",
      "executionTime": "number",
      "success": "boolean"
    }
  },
  "migrations": {
    "status": "OK|ERROR",
    "valid": "boolean",
    "upToDate": "boolean"
  },
  "latency": "string"
}
```

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