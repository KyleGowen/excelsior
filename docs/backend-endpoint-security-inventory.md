## Backend endpoint security inventory (authz / impersonation focus)

### Scope
- Prevent **role/session impersonation** and **cross-user data mutation**.
- **Cross-user read is allowed** for deck reads (per current product behavior).

### Auth primitives
- **Auth middleware**: `AuthenticationService.createAuthMiddleware()` attaches `req.user` from `sessionId` cookie.
  - `src/services/AuthenticationService.ts`
- **Deck ownership check**: `deckRepository.userOwnsDeck(deckId, userId)` used widely on write routes.

### Endpoint inventory (high-level)

#### Authentication
- `POST /api/auth/login` (public)
- `POST /api/auth/logout` (public but affects current cookie)
- `GET /api/auth/me` (public, returns 401 if no/invalid session)

#### Card data (read-only, public)
- `GET /api/characters`, `/api/locations`, `/api/special-cards`, `/api/missions`, `/api/events`, `/api/aspects`
- `GET /api/advanced-universe`, `/api/teamwork`, `/api/ally-universe`, `/api/training`, `/api/basic-universe`, `/api/power-cards`

#### Decks
- **Authenticated read**
  - `GET /api/decks` (returns only `req.user.id` decks)
  - `GET /api/decks/:id` (cross-user read allowed; includes `isOwner` flag)
  - `GET /api/decks/:id/full` (cross-user read allowed; includes `isOwner` flag)
  - `GET /api/decks/:id/ui-preferences` (owner-only)
  - `GET /api/deck-stats` (scoped to `req.user.id`)
- **Authenticated write** (all owner-only + non-guest)
  - `POST /api/decks`
  - `PUT /api/decks/:id`
  - `DELETE /api/decks/:id`
  - `POST /api/decks/:id/cards`
  - `PUT /api/decks/:id/cards`
  - `DELETE /api/decks/:id/cards`
  - `PUT /api/decks/:id/ui-preferences`

#### Collections (ADMIN only)
- `GET /api/collections/me`
- `GET /api/collections/me/cards`
- `POST /api/collections/me/cards`
- `PUT /api/collections/me/cards/:cardId`
- `DELETE /api/collections/me/cards/:cardId`
- `GET /api/collections/me/history`

#### Users / Debug / DB status (security-sensitive)
- `GET /api/users` (**currently unauthenticated**; should be ADMIN-only)
- `GET /api/debug/clear-cache` (**currently unauthenticated**; should be ADMIN-only)
- `GET /api/debug/clear-card-cache` (**currently unauthenticated**; should be ADMIN-only)
- `GET /api/database/status` (**currently unauthenticated**; should be ADMIN-only)

### Key risks tracked by this effort
- **Impersonation risk**: session IDs generated with non-crypto randomness (to be hardened).
- **Access control gaps**: unauthenticated sensitive endpoints listed above.
- **Cross-user mutation**: validated by new integration tests ensuring all writes remain owner-only.

