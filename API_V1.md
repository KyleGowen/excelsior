# HTTP API v1 (`/api/v1`)

Versioned JSON API for Excelsior. **Legacy** routes remain documented in [API_DOCUMENTATION.md](API_DOCUMENTATION.md).

## Conventions

### Base URL

- Local: `http://localhost:8085` (or `PORT`) + prefix `**/api/v1`**.

### Authentication

- **Bearer JWT:** `Authorization: Bearer <access_token>` for protected v1 routes.
- **Login:** `POST /api/v1/auth/login` with JSON body `{ "username", "password" }` returns an access token. Password verification uses the **same** server stack as `POST /api/auth/login` (no separate hashing implementation).
- **Session cookie (`sessionId`):** Routes that use session auth (e.g. decks, collections, guest decks, admin, DBV backgrounds) accept the same cookie as legacy `/api/`*. If the session is missing or invalid, the server responds with **401** and the standard v1 envelope: `data: null`, `errors: [{ "code": "UNAUTHORIZED", "message": "..." }]`.

**Route auth matrix — which credential each endpoint family accepts:**

| Route family | Session cookie | Bearer JWT | Notes |
| ------------ | :------------: | :--------: | ----- |
| `POST /api/v1/auth/login` | — | — | Open — returns access + refresh tokens |
| `POST /api/v1/auth/refresh` | — | — | Open — accepts refresh token in body |
| `GET /api/v1/auth/me` | ✓ | ✓ | Returns current user; 401 if not authed |
| `POST /api/v1/auth/logout` | ✓ | ✓ | Clears session / revokes refresh token |
| `GET /api/v1/catalog/*` | ✓ (optional) | ✓ (optional) | Unauthenticated allowed (guest catalog reads) |
| `GET /api/v1/dbv/*` | ✓ (optional) | ✓ (optional) | Same as catalog |
| `GET /api/v1/recent-updates` | ✓ (optional) | ✓ (optional) | Same as catalog |
| `GET /api/v1/config/app` | — | — | Open — no auth required |
| `GET /api/v1/decks/:id` (+ `/full`) | ✓ (optional) | ✓ (optional) | Any persistent deck readable by direct URL; guest-session decks remain session-only |
| `GET /api/v1/decks` (list), `/stats`, `/community`, `/tournament` | ✓ | ✓ | Auth required |
| `POST/PUT/DELETE /api/v1/decks*` | ✓ | ✓ | Owner only; GUEST→403 |
| `GET /api/v1/community/decks` | ✓ (optional) | ✓ (optional) | Public read; guests allowed (`isFavorited:false`) |
| `GET /api/v1/users/:id/public-decks` | ✓ (optional) | ✓ (optional) | Public read; guests allowed |
| `GET /api/v1/decks/favorites` | ✓ | ✓ | USER/ADMIN; guests→401/403 |
| `POST/DELETE /api/v1/decks/:id/favorite` | ✓ | ✓ | USER/ADMIN; guests→403; cannot favorite own |
| `POST /api/v1/users/display-name` | ✓ | — | USER/ADMIN; GUEST→403 |
| `POST /api/v1/feedback` | ✓ | — | Any authenticated role; 5 submissions/minute |
| `/api/v1/guest/decks*` | ✓ (GUEST only) | ✗ | GUEST role required; wrong role→403 |
| `/api/v1/collections/me*` | ✓ | ✗ | USER/ADMIN; GUEST→401 (no collection) |
| `/api/v1/saved-database-views*` | ✓ | ✓ | Current-user-owned records; temporarily ADMIN-only via centralized eligibility policy |
| `/api/v1/admin/*` | ✓ | — | ADMIN role required; other roles→403 |

Bearer support on decks/catalog can be disabled server-side via `DISABLE_BEARER_DECKS_COLLECTIONS=1`. For a complete guide including token lifetimes, cookie names, and the GUEST session flow, see [docs/current/FRONTEND_AUTH_AND_SESSION.md](docs/current/FRONTEND_AUTH_AND_SESSION.md).

### JSON envelope

All v1 JSON responses use:

```json
{
  "data": {},
  "meta": {},
  "errors": [],
  "success": true
}
```

- `**data`:** payload on success; may be `null` on error.
- `**meta`:** optional. Always carries `requestId` (echoed `X-Request-Id`). On catalog / DBV-support responses it also carries `catalogDataVersion` and `catalogLastUpdated` (see [Caching & conditional GET](#caching--conditional-get)).
- `**errors`:** array of `{ "code": string, "message": string, "field"?: string }`. Do not echo raw user input in messages. The full list of stable `code` values is catalogued in `[docs/current/API_V1_ERROR_CATALOG.md](docs/current/API_V1_ERROR_CATALOG.md)`.
- `**success`:** backwards-compatible boolean derived from HTTP status and `errors`. New clients should prefer HTTP status plus `errors`.
- `**error` / `**message`:** optional backwards-compatible strings for older session-era clients and integration tests. New clients should prefer `errors[].message` and typed response DTOs.

### Status codes


| Code | Use                           |
| ---- | ----------------------------- |
| 200  | Success                       |
| 201  | Resource created              |
| 202  | Accepted for delivery          |
| 400  | Validation / bad request      |
| 401  | Missing or invalid auth       |
| 403  | Authenticated but not allowed |
| 409  | Resource limit/conflict       |
| 429  | Rate limited                  |
| 500  | Server error                  |


---

## Table of contents

1. [Auth](#auth)
2. [User account](#user-account)
3. [Feedback](#feedback)
4. [DBV catalog](#dbv-catalog)
5. [DBV support](#dbv-support)
6. [Recent updates](#recent-updates)
7. [User decks (list)](#user-decks-list)
8. [User decks (create + validate)](#user-decks-create--validate)
9. [User decks (single: get, full, update, delete)](#user-decks-single-get-full-update-delete)
10. [User decks (cards)](#user-decks-cards)
11. [User decks (UI preferences)](#user-decks-ui-preferences)
12. [Community, favorites, and public profiles](#community-favorites-and-public-profiles)
13. [Guest decks (session memory)](#guest-decks-session-memory)
14. [Collections (current user)](#collections-current-user)
15. [Saved database views](#saved-database-views)
16. [Admin](#admin)
17. [Image URL contract](#image-url-contract)
18. [Caching & conditional GET](#caching--conditional-get)
19. [Error catalog](#error-catalog)
20. [Changelog](#changelog)
21. [Deprecation policy](#deprecation-policy)

---

## Auth

### `POST /api/v1/auth/login`

**Auth:** None.

**Request model:** `[src/api/http/models/auth/LoginRequestBody.ts](src/api/http/models/auth/LoginRequestBody.ts)`

**Body:**

```json
{ "username": "kyle", "password": "test" }
```

**Response 200** (`data`):

```json
{
  "accessToken": "<jwt>",
  "tokenType": "Bearer",
  "expiresInSeconds": 900,
  "refreshToken": "<jwt>",
  "refreshExpiresInSeconds": 2592000,
  "user": {
    "id": "uuid",
    "username": "kyle",
    "role": "USER"
  }
}
```

Access token TTL defaults to 15 minutes (`JWT_ACCESS_TTL`), refresh token TTL to 30 days (`JWT_REFRESH_TTL_SECONDS`). When `DISABLE_AUTH_REFRESH=1` is set the `refreshToken` / `refreshExpiresInSeconds` fields are omitted (legacy shape, pre-Phase-2).

**Response 400:** `errors` include validation (e.g. missing username/password).

**Response 401:** invalid credentials — generic message, no per-field hint.

**Response 429:** too many login attempts from this IP (sliding window).

**Response 500:** server failure.

See `[docs/current/API_V1_AUTH_REFRESH.md](docs/current/API_V1_AUTH_REFRESH.md)` for the full rotation + reuse-detection contract.

---

### `POST /api/v1/auth/refresh`

**Auth:** None (refresh token carried in the JSON body).

**Body:**

```json
{ "refreshToken": "<jwt>" }
```

**Response 200:** same shape as `POST /auth/login`. The supplied refresh token is revoked and a new one is issued, chained via `rotated_from_jti`.

**Response 400:** missing or malformed `refreshToken`.

**Response 401:** `REFRESH_INVALID` (bad token), `REFRESH_EXPIRED` (past `expires_at`), `REFRESH_REUSED` (already-rotated token — the whole family is revoked).

**Response 501:** `REFRESH_DISABLED` (the `DISABLE_AUTH_REFRESH=1` kill switch is set).

---

### `GET /api/v1/auth/me`

**Auth:** Bearer access token.

**Response 200:**

```json
{
  "data": {
    "id": "uuid",
    "username": "kyle",
    "email": "user@example.com",
    "role": "USER",
    "lastLoginAt": "2026-04-03T10:00:00.000Z"
  },
  "meta": {},
  "errors": []
}
```

**Response 401:** missing/invalid/expired token.

---

### `POST /api/v1/auth/logout`

**Auth:** None (refresh token optionally carried in the JSON body). Bearer access token is also accepted but not required — the server identifies the session by `refreshToken`.

**Body (optional):**

```json
{ "refreshToken": "<jwt>" }
```

**Behavior:** When `refreshToken` is present and valid, the server revokes the matching row in `refresh_tokens` synchronously. When absent or invalid, the call is a no-op. Access token invalidation is still the caller's responsibility (short TTL + no server-side denylist).

**Response 200:**

```json
{ "data": { "loggedOut": true }, "meta": {}, "errors": [] }
```

---

## User account

Self-service account updates for **USER** and **ADMIN** (session cookie). **GUEST** receives **403**.

### `POST /api/v1/users/change-email`

**Auth:** Session cookie (`sessionId`).

**Request model:** `[src/api/http/models/users/ChangeEmailRequestBody.ts](src/api/http/models/users/ChangeEmailRequestBody.ts)`

**Body:**

```json
{ "email": "new@example.com" }
```

**Response 200** (`data`):

```json
{ "email": "new@example.com" }
```

**Response 400:** `EMAIL_REQUIRED`, `EMAIL_INVALID`, `EMAIL_UNCHANGED`, or `VALIDATION_ERROR`.

**Response 403:** `FORBIDDEN` (GUEST) or `GOOGLE_EMAIL_LOCKED` (Google-linked account).

**Response 409:** `EMAIL_TAKEN`.

---

### `POST /api/v1/users/change-password`

**Auth:** Session cookie (`sessionId`).

**Request model:** `[src/api/http/models/users/ChangePasswordRequestBody.ts](src/api/http/models/users/ChangePasswordRequestBody.ts)`

**Body:**

```json
{ "newPassword": "secret", "confirmPassword": "secret" }
```

**Response 200** (`data`):

```json
{ "message": "Password updated" }
```

**Response 400:** `PASSWORD_REQUIRED`, `PASSWORD_MISMATCH` (`"Passwords do not match."`), or `VALIDATION_ERROR`.

**Response 403:** `FORBIDDEN` (GUEST) or `GOOGLE_PASSWORD_LOCKED` (Google-linked account).

Legacy `POST /api/users/change-password` remains for backward compatibility and delegates to the same service (accepts `{ newPassword }` only).

---

### `POST /api/v1/users/display-name`

Sets the user's public name. The semantics deliberately differ by auth provider:

- **Password users:** renames their globally-unique `username` (login id). After this they log in with the new value; `display_name` stays `null`.
- **SSO (Google) users:** sets `display_name` only. They still log in via SSO and cannot log in with the display name.

The resolved public name everywhere in the app comes from `resolveUserDisplayName` (`display_name` → SSO `email` fallback → `username`).

**Auth:** Session cookie (`sessionId`).

**Request model:** `[src/api/http/models/users/SetDisplayNameRequestBody.ts](src/api/http/models/users/SetDisplayNameRequestBody.ts)`

**Body:**

```json
{ "displayName": "Spider Fan" }
```

**Response 200** (`data`):

```json
{ "username": "Spider Fan", "displayName": null, "resolvedName": "Spider Fan" }
```

(For SSO users `username` is unchanged and `displayName` holds the new value.)

**Response 400:** `DISPLAY_NAME_REQUIRED` or `VALIDATION_ERROR`.

**Response 403:** `FORBIDDEN` (GUEST).

**Response 409:** `USERNAME_TAKEN` (password user, name already in use).

**Implementation:** `[UserAccountService.setDisplayName](src/api/services/userAccountService.ts)`, `[src/api/http/users.http.ts](src/api/http/users.http.ts)`.

---

## Feedback

### `POST /api/v1/feedback`

Accepts an in-app bug report or feature/change request and delivers it to
`kyle@excelsior.cards` through server-side SES. Feedback text is not persisted
or written to application logs. The email identifies the sender with the
authenticated account's resolved display name and email address; registered-user
addresses are also set as the email's reply-to address.

**Auth:** Session cookie (`sessionId`). **GUEST**, **USER**, and **ADMIN** are accepted.

**Rate limit:** 5 submissions per authenticated user per minute.

**Request model:** `[src/api/http/models/feedback/SubmitFeedbackRequestBody.ts](src/api/http/models/feedback/SubmitFeedbackRequestBody.ts)`

**Body:**

```json
{ "category": "bug", "message": "Deck save failed after I changed the background." }
```

`category` is `bug` or `feature`; `message` is trimmed, required, and limited to 4,000 characters.

**Response 202** (`data`):

```json
{ "submitted": true }
```

**Response 400:** `VALIDATION_ERROR`.

**Response 401:** `UNAUTHORIZED`.

**Response 429:** `RATE_LIMITED`.

**Response 500:** `FEEDBACK_DELIVERY_ERROR`.

**Implementation:** `[FeedbackService](src/api/services/feedbackService.ts)`,
`[SesFeedbackEmailSender](src/api/services/sesFeedbackEmailSender.ts)`,
`[src/api/http/feedback.http.ts](src/api/http/feedback.http.ts)`.

---

## DBV catalog

**Authentication (all paths in this section):** Valid **session cookie** (`sessionId` after `POST /api/auth/login`) **or** `**Authorization: Bearer <accessToken>`** (after `POST /api/v1/auth/login`). The main web app should send cookies (`credentials: 'include'` in `fetch` when needed). **GUEST**, **USER**, and **ADMIN** all receive full catalog data; only anonymous/unauthenticated clients are denied.

**Response 401:** Missing, invalid, or expired session; missing/invalid Bearer token; or user record missing. Body: `{ "data": null, "meta": {}, "errors": [{ "code": "UNAUTHORIZED", "message": "..." }] }`.

> **Full-catalog download:** There are no server-side pagination or filtering parameters on these endpoints. Each call returns the **complete** array for that card type. The existing frontend downloads all catalogs at page load and filters entirely client-side. A new frontend should do the same — or cache the responses using the `ETag`/`If-None-Match` conditional GET pattern documented in [Caching & conditional GET](#caching--conditional-get) to avoid re-downloading unchanged catalogs. See `meta.catalogDataVersion` and `meta.catalogLastUpdated` in the response for cache keying.

**Official errata:** Any catalog item linked through `card_errata` includes an `errata` array ordered by `source_section`. Each entry contains `id`, `source_section`, `entry_title`, `entry_text` (card-scoped plain text with shared guidance and paragraph breaks preserved), and `source_url` (the canonical deep link on overpowercardgame.com). The canonical full source transcription remains in `errata.entry_text`; an association may narrow the returned text through `card_errata.display_text` when one source entry discusses multiple cards. Unlinked cards omit the field.

### `GET /api/v1/catalog/characters`

**Auth:** Session cookie or Bearer JWT (see introduction above).

**Request model:** none.

**Response 200:** `data` is an array of character objects. Example item:

```json
{
  "id": "98fd610e-39fd-470e-84b7-ab723cc0f39d",
  "name": "Angry Mob (Industrial Age)",
  "set": "ERB",
  "set_number": "008",
  "rarity": "Common",
  "energy": 4,
  "combat": 5,
  "brute_force": 7,
  "intelligence": 3,
  "threat_level": 18,
  "special_abilities": "Must have 25 hits to be Cumulative KO'd.",
  "image": "characters/angry_mob_industrial_age.webp",
  "image_path": "characters/angry_mob_industrial_age.webp",
  "reverse_image_path": null,
  "is_foil": false
}
```

Fields: `id`, `name`, `set`, `set_number` (string|null), `rarity` (`"Common"|"Uncommon"|"Rare"|"Ultra Rare"|null`), `energy`, `combat`, `brute_force`, `intelligence`, `threat_level` (all numbers), `special_abilities` (string), `image`, `image_path`, `reverse_image_path` (string|null; second face for two-faced characters), `is_foil`, and optional `errata`.

**Response 500:** `errors` populated; `data` may be `null`.

**Implementation:** `[src/api/services/catalogService.ts](src/api/services/catalogService.ts)` · HTTP `[src/api/http/dbv-catalog.http.ts](src/api/http/dbv-catalog.http.ts)`

### `GET /api/v1/catalog/locations`

**Auth:** Session cookie or Bearer JWT (see introduction above).

**Request model:** none.

**Response 200:** `data` is an array of location objects. Example item:

```json
{
  "id": "bc4e4d65-cc3f-4527-9005-cc7ebb7307be",
  "name": "221-B Baker St.",
  "threat_level": 0,
  "special_ability": "Any time the 221-B Baker St. team plays a card that Reveals...",
  "image": "alternate/221_b_baker_st.png",
  "image_path": "alternate/221_b_baker_st.png",
  "set": "ERBP",
  "set_number": null,
  "rarity": null
}
```

Fields: `id`, `name`, `threat_level`, `special_ability`, `image`, `image_path`, `set`, `set_number` (string|null), `rarity` (string|null).

**Response 500:** `errors` populated; `data` may be `null`.

**Implementation:** `[src/api/services/catalogService.ts](src/api/services/catalogService.ts)` · HTTP `[src/api/http/dbv-catalog.http.ts](src/api/http/dbv-catalog.http.ts)`

### `GET /api/v1/catalog/battlegrounds`

**Auth:** Session cookie or Bearer JWT (see introduction above).

**Request model:** none.

**Response 200:** `data` is an array of Battleground objects. Fields: `id`, `name`, `special_ability`, `image`, `image_path`, `set`, `set_number` (string|null), `rarity` (string|null), and `is_foil`. Global Defense Agency (`SKY` #348) is the first catalog entry; Battlegrounds are distinct from Locations.

**Response 500:** `errors` populated; `data` may be `null`.

**Implementation:** `[src/api/services/catalogService.ts](src/api/services/catalogService.ts)` · HTTP `[src/api/http/dbv-catalog.http.ts](src/api/http/dbv-catalog.http.ts)`

### `GET /api/v1/catalog/special-cards`

**Auth:** Session cookie or Bearer JWT (see introduction above).

**Request model:** none.

**Response 200:** `data` is an array of special card objects. Example item:

```json
{
  "id": "79cdbac0-ccfc-4e6f-bc68-5b6f47db5e43",
  "name": "Don't Let it Get Away!",
  "character": "Angry Mob",
  "card_effect": "Acts as a level 2 MultiPower attack...",
  "image": "specials/dont_let_it_get_away.webp",
  "image_path": "specials/dont_let_it_get_away.webp",
  "set": "ERB",
  "set_number": "002",
  "rarity": "Common",
  "icons": ["Energy", "Combat", "Brute Force", "Intelligence"],
  "value": 2,
  "is_cataclysm": false,
  "is_assist": false,
  "is_ambush": false,
  "one_per_deck": false,
  "icon_offensive_swords": true,
  "icon_defensive_shield": false,
  "icon_remainder_of_battle": false,
  "icon_remainder_of_game": false,
  "icon_attached_paperclip": false,
  "icon_astral_plane": false,
  "icon_first_action_only": false,
  "banned": false,
  "is_foil": false
}
```

Fields: `id`, `name`, `character`, `card_effect`, `image`, `image_path`, `set`, `set_number`, `rarity`, `icons` (string[]), `value` (number|null), `is_cataclysm`, `is_assist`, `is_ambush`, `one_per_deck`, icon booleans (`icon_offensive_swords` etc.), `banned`, `is_foil`, and optional `errata`.

**Response 500:** `errors` populated; `data` may be `null`.

**Implementation:** `[src/api/services/catalogService.ts](src/api/services/catalogService.ts)` · HTTP `[src/api/http/dbv-catalog.http.ts](src/api/http/dbv-catalog.http.ts)`

### `GET /api/v1/catalog/missions`

**Auth:** Session cookie or Bearer JWT (see introduction above).

**Request model:** none.

**Response 200:** `data` is an array of mission objects. Example item:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440015",
  "mission_set": "The Warlord of Mars",
  "card_name": "A Fighting Man of Mars",
  "name": "A Fighting Man of Mars",
  "image": "missions/the-warlord-of-mars/a_fighting_man_of_mars.webp",
  "image_path": "missions/the-warlord-of-mars/a_fighting_man_of_mars.webp",
  "set": "ERB",
  "set_number": "376",
  "rarity": "Common",
  "is_foil": false
}
```

Fields: `id`, `mission_set`, `card_name` (primary display name), `name` (same as `card_name` on list), `image`, `image_path`, `set`, `set_number`, `rarity`, `is_foil`.

**Response 500:** `errors` populated; `data` may be `null`.

**Implementation:** `[src/api/services/catalogService.ts](src/api/services/catalogService.ts)` · HTTP `[src/api/http/dbv-catalog.http.ts](src/api/http/dbv-catalog.http.ts)`

### `GET /api/v1/catalog/events`

**Auth:** Session cookie or Bearer JWT (see introduction above).

**Request model:** none.

**Response 200:** `data` is an array of event card objects. Fields match the special-cards shape: `id`, `name`, `character`, `card_effect`, `image`, `image_path`, `set`, `set_number`, `rarity`, `icons`, `value`, `is_cataclysm`, `is_assist`, `is_ambush`, `one_per_deck`, icon booleans, `banned`, `is_foil`.

**Response 500:** `errors` populated; `data` may be `null`.

**Implementation:** `[src/api/services/catalogService.ts](src/api/services/catalogService.ts)` · HTTP `[src/api/http/dbv-catalog.http.ts](src/api/http/dbv-catalog.http.ts)`

### `GET /api/v1/catalog/aspects`

**Auth:** Session cookie or Bearer JWT (see introduction above).

**Request model:** none.

**Response 200:** `data` is an array of aspect card objects. Fields match the special-cards shape: `id`, `name`, `character`, `card_effect`, `image`, `image_path`, `set`, `set_number`, `rarity`, `icons`, `value`, `is_cataclysm`, `is_assist`, `is_ambush`, `one_per_deck`, icon booleans, `banned`, `is_foil`.

**Response 500:** `errors` populated; `data` may be `null`.

**Implementation:** `[src/api/services/catalogService.ts](src/api/services/catalogService.ts)` · HTTP `[src/api/http/dbv-catalog.http.ts](src/api/http/dbv-catalog.http.ts)`

### `GET /api/v1/catalog/advanced-universe`

**Auth:** Session cookie or Bearer JWT (see introduction above).

**Request model:** none.

**Response 200:** `data` is an array of Universe: Advanced card objects: `id`, `name`, `character`, `card_effect`, `card_description`, `image`, `image_path`, `set`, `set_number`, `rarity`, `is_one_per_deck`, function icon booleans (`icon_offensive_swords`, `icon_defensive_shield`, `icon_remainder_of_battle`, `icon_remainder_of_game`, `icon_astral_plane`).

**Response 500:** `errors` populated; `data` may be `null`.

**Implementation:** `[src/api/services/catalogService.ts](src/api/services/catalogService.ts)` · HTTP `[src/api/http/dbv-catalog.http.ts](src/api/http/dbv-catalog.http.ts)`

### `GET /api/v1/catalog/teamwork`

**Auth:** Session cookie or Bearer JWT (see introduction above).

**Request model:** none.

**Response 200:** `data` is an array of Universe: Teamwork card objects. Fields match the special-cards shape.

**Response 500:** `errors` populated; `data` may be `null`.

**Implementation:** `[src/api/services/catalogService.ts](src/api/services/catalogService.ts)` · HTTP `[src/api/http/dbv-catalog.http.ts](src/api/http/dbv-catalog.http.ts)`

### `GET /api/v1/catalog/ally-universe`

**Auth:** Session cookie or Bearer JWT (see introduction above).

**Request model:** none.

**Response 200:** `data` is an array of Universe: Ally card objects. Fields match the special-cards shape.

**Response 500:** `errors` populated; `data` may be `null`.

**Implementation:** `[src/api/services/catalogService.ts](src/api/services/catalogService.ts)` · HTTP `[src/api/http/dbv-catalog.http.ts](src/api/http/dbv-catalog.http.ts)`

### `GET /api/v1/catalog/training`

**Auth:** Session cookie or Bearer JWT (see introduction above).

**Request model:** none.

**Response 200:** `data` is an array of Universe: Training card objects. Fields match the special-cards shape.

**Response 500:** `errors` populated; `data` may be `null`.

**Implementation:** `[src/api/services/catalogService.ts](src/api/services/catalogService.ts)` · HTTP `[src/api/http/dbv-catalog.http.ts](src/api/http/dbv-catalog.http.ts)`

### `GET /api/v1/catalog/basic-universe`

**Auth:** Session cookie or Bearer JWT (see introduction above).

**Request model:** none.

**Response 200:** `data` is an array of Universe: Basic card objects. Fields match the special-cards shape.

**Response 500:** `errors` populated; `data` may be `null`.

**Implementation:** `[src/api/services/catalogService.ts](src/api/services/catalogService.ts)` · HTTP `[src/api/http/dbv-catalog.http.ts](src/api/http/dbv-catalog.http.ts)`

### `GET /api/v1/catalog/power-cards`

**Auth:** Session cookie or Bearer JWT (see introduction above).

**Request model:** none.

**Response 200:** `data` is an array of power card objects. Example item:

```json
{
  "id": "b37d8f9c-364c-4b29-a0f2-cae2a54c157b",
  "name": "5 - Any-Power",
  "power_type": "Any-Power",
  "value": 5,
  "image": "power-cards/5_anypower.webp",
  "image_path": "power-cards/5_anypower.webp",
  "set": "ERB",
  "set_number": "473F",
  "rarity": "Uncommon",
  "set_name": "Edgar Rice Burroughs and the World Legends",
  "one_per_deck": true,
  "is_foil": true
}
```

Fields: `id`, `name`, `power_type` (`"Energy"|"Combat"|"Brute Force"|"Intelligence"|"Any-Power"|"Multi-Power"`), `value`, `image`, `image_path`, `set`, `set_number`, `rarity`, `set_name`, `one_per_deck`, `is_foil`.

**Response 500:** `errors` populated; `data` may be `null`.

**Implementation:** `[src/api/services/catalogService.ts](src/api/services/catalogService.ts)` · HTTP `[src/api/http/dbv-catalog.http.ts](src/api/http/dbv-catalog.http.ts)`

### `GET /api/v1/catalog/foil-card-map`

**Auth:** Session cookie or Bearer JWT (see introduction above).

**Request model:** none.

**Response 200:** `data` is an array of `{ "foilCardId", "baseCardId", "cardType" }` rows (camelCase; same objects the legacy route returned in `data`).

**Response 500:** `errors` populated; `data` may be `null`.

**Implementation:** `[src/api/services/catalogService.ts](src/api/services/catalogService.ts)` · HTTP `[src/api/http/dbv-catalog.http.ts](src/api/http/dbv-catalog.http.ts)` · response shape `[src/api/dto/v1/CatalogFoilCardMapResponseDto.ts](src/api/dto/v1/CatalogFoilCardMapResponseDto.ts)`

---

## DBV support

Reference data for Database View and collection UI (set codes → display names, etc.).

### `GET /api/v1/dbv/sets`

**Auth:** Session cookie or Bearer JWT (same rules as **DBV catalog** introduction).

**Request model:** none.

**Response 200:** `data` is an array of `{ "code", "name" }` rows from the `sets` table, ordered by `name` ascending (same shape as legacy `data` array).

**Response 500:** `errors` populated; `data` may be `null`.

**Implementation:** `[src/api/services/dbvSupportService.ts](src/api/services/dbvSupportService.ts)` · HTTP `[src/api/http/dbv-support.http.ts](src/api/http/dbv-support.http.ts)` · response shape `[src/api/dto/v1/DbvSetsResponseDto.ts](src/api/dto/v1/DbvSetsResponseDto.ts)`

### `GET /api/v1/dbv/deck-backgrounds`

**Auth:** Session cookie or Bearer JWT (same rules as **DBV catalog** introduction). Unauthenticated requests receive **401** with the **v1** envelope (`errors` with `**UNAUTHORIZED`**).

**Request model:** none.

**Response 200:** `data` is a string array of project-root-relative PNG paths under `src/resources/images/backgrounds/{landscape|portrait}/` (same list as legacy `data`).

**Response 500:** v1 envelope — `errors` with code `**DBV_SUPPORT_ERROR`**; `data` may be `null`.

**Implementation:** `[src/services/deckBackgroundService.ts](src/services/deckBackgroundService.ts)` · HTTP `[src/api/http/dbv-support.http.ts](src/api/http/dbv-support.http.ts)` · response shape `[src/api/dto/v1/DbvDeckBackgroundsResponseDto.ts](src/api/dto/v1/DbvDeckBackgroundsResponseDto.ts)`

---

## Recent updates

Hand-maintained news cards for the Home screen (v2 SPA). Rows live in the `recent_updates` table and are updated manually via SQL or migrations — not inferred from app activity.

### `GET /api/v1/recent-updates`

**Auth:** Session cookie or Bearer JWT (same rules as **DBV catalog** introduction).

**Request model:** none.

**Response 200:** `data` is an array of objects (newest `updatedAt` first):

```json
{
  "id": "uuid",
  "title": "string",
  "type": "feature | fix | news | update | event | new_cards",
  "description": "string (max 400 chars in DB)",
  "cardImageUrl": "characters/anubis.webp | null",
  "createdAt": "ISO 8601",
  "updatedAt": "ISO 8601"
}
```

`cardImageUrl` is a repo-relative card-art path (same convention as catalog image paths); the client resolves it via CDN/thumbnail helpers.

**Response 500:** `errors` with code `RECENT_UPDATES_ERROR`; `data` may be `null`.

**Implementation:** `[src/api/services/recentUpdatesService.ts](src/api/services/recentUpdatesService.ts)` · HTTP `[src/api/http/recent-updates.http.ts](src/api/http/recent-updates.http.ts)` · DB `[src/database/recentUpdatesLookup.ts](src/database/recentUpdatesLookup.ts)`

---

## User decks (list)

### `GET /api/v1/decks`

**Auth:** Valid **session cookie** OR `**Authorization: Bearer <accessToken>`** (`ownedAuth` middleware — accepts either; Bearer can be disabled via env `DISABLE_BEARER_DECKS_COLLECTIONS=1`). Send `credentials: 'include'` when using session cookies. Unauthenticated → **401** v1 envelope.

**Request model:** none.

**Response 200:** v1 envelope; `**data`** is the transformed deck list (array of `{ "metadata", "cards" }` rows from `transformDeckList` — same shapes the legacy list returned inside `{ success, data }`). Each `**metadata`** object includes **`reserve_character`** (UUID string or **`null`**, same semantics as single-deck `**GET /api/v1/decks/:id`**) so clients can show reserve on deck tiles without fetching each deck in full.

**Caching:** `Cache-Control: private, max-age=0, must-revalidate`, `Vary: Cookie`, `**ETag`** over the full v1 JSON body (`SHA-1` of `{"data":...,"meta":{},"errors":[]}`). Clients revalidate each use; if request header `**If-None-Match`** matches `**ETag**`, responds **304** with an **empty** body. (No long freshness window — deck metadata such as `**is_valid`** changes frequently after saves.)

**Response 500:** v1 envelope — `errors` with code `**DECK_LIST_ERROR`**; `data` may be `null`.

**Implementation:** `[src/api/services/deckListService.ts](src/api/services/deckListService.ts)` · HTTP `[src/api/http/decks.http.ts](src/api/http/decks.http.ts)` · response shape `[src/api/dto/v1/DeckListV1DataDto.ts](src/api/dto/v1/DeckListV1DataDto.ts)`

### `GET /api/v1/decks/stats`

**Auth:** Valid **session cookie** or Bearer JWT (same `ownedAuth` as `GET /api/v1/decks`). Unauthenticated → **401** v1 envelope.

**Request model:** none.

**Response 200:** v1 envelope; `**data`** is aggregate counts for the user’s database-backed decks:

- `**totalDecks`** — number of decks owned by the user
- `**totalCards**` — sum of card quantities across all those decks
- `**averageCardsPerDeck**` — `Math.round(totalCards / totalDecks)`, or **0** when `totalDecks` is 0
- `**largestDeckSize`** — maximum per-deck total quantity (sum of `quantity` per deck)

**Response 500:** v1 envelope — `errors` with code `**DECK_STATS_ERROR`**.

**Implementation:** `[DeckStatsService](src/api/services/deckStatsService.ts)` · HTTP `[decks.http.ts](src/api/http/decks.http.ts)` · response shape `[DeckStatsV1DataDto](src/api/dto/v1/DeckStatsV1DataDto.ts)`

### `GET /api/v1/decks/community`

**Auth:** Valid **session cookie** or Bearer JWT (same `ownedAuth` as `GET /api/v1/decks`). Unauthenticated → **401** v1 envelope.

**Request model:** none.

**Response 200:** v1 envelope; `**data**` is the deck-list array (same tile shape as `GET /api/v1/decks`) for the **community pool**. The pool is backed by the internal **`community_decks`** user account (`communityDecksUserId` = `00000000-0000-0000-0000-000000000002`, also surfaced in `GET /api/v1/config/app`), sorted by `updated_at` descending. Only decks with **`is_private = false`** and **`is_valid = true`** are returned (Limited decks are included when legal). Unlisted or not-legal WIP decks are excluded from this rail but remain readable by direct URL. See [docs/current/FRONTEND_V2.md](docs/current/FRONTEND_V2.md) and `.cursor/skills/add-community-deck/SKILL.md` for importing decks.

**Response 500:** v1 envelope — `errors` with code `**COMMUNITY_DECKS_ERROR**`.

**Note:** registered before `GET /api/v1/decks/:id` so the literal `community` segment is not parsed as a deck id.

### `GET /api/v1/decks/tournament`

**Auth:** Valid **session cookie** or Bearer JWT (same `ownedAuth` as `GET /api/v1/decks`). Unauthenticated → **401** v1 envelope.

**Request model:** none.

**Response 200:** v1 envelope; `**data**` is the deck-list array (same tile shape as `GET /api/v1/decks`) for the **tournament pool**. The pool is backed by the internal **`tournament_decks`** user account (`tournamentDecksUserId` = `00000000-0000-0000-0000-000000000003`, also surfaced in `GET /api/v1/config/app`), sorted by `updated_at` descending. Only decks with **`is_private = false`** and **`is_valid = true`** are returned (Limited decks are included when legal). Unlisted or not-legal WIP decks are excluded from this rail but remain readable by direct URL. See [docs/current/FRONTEND_V2.md](docs/current/FRONTEND_V2.md) and `.cursor/skills/add-tournament-deck/SKILL.md` for importing decks.

**Response 500:** v1 envelope — `errors` with code `**TOURNAMENT_DECKS_ERROR**`.

**Note:** registered before `GET /api/v1/decks/:id` so the literal `tournament` segment is not parsed as a deck id.

**Implementation:** `[DeckListService](src/api/services/deckListService.ts)` · HTTP `[decks.http.ts](src/api/http/decks.http.ts)` · guest id constant `[src/constants/guestUser.ts](src/constants/guestUser.ts)`

---

## User decks (create + validate)

### `POST /api/v1/decks`

**Auth:** Valid **session cookie** or Bearer JWT (`ownedAuth`). **GUEST** receives **403** v1 envelope (`errors` with code `**GUEST_FORBIDDEN`**). Unauthenticated → **401** v1 envelope.

**Rate limiting / read-only:** Same behavior as legacy create: **429** v1 envelope (`RATE_LIMIT_EXCEEDED`) when the shared per-IP limit is exceeded; **403** v1 envelope (`READ_ONLY_MODE`) when read-only mode is active (query/header as in [API_DOCUMENTATION.md](API_DOCUMENTATION.md)).

**Request model:** `[src/api/http/models/decks/CreateDeckRequestBody.ts](src/api/http/models/decks/CreateDeckRequestBody.ts)` — JSON body:

- `**name`** (string, required, non-empty after trim, max 100)
- `**description`** (optional string, max 500)
- `**characters**` (optional string array, max 50 entries; business rule still enforces max **4** character IDs via `**DeckService.createDeck`**)

**Response 201:** v1 envelope; `**data`** is the created deck row (same shape as legacy `data` from `POST /api/decks`).

**Response 400:** v1 envelope — validation (`VALIDATION_ERROR` / field hints) or `**Maximum 4 characters allowed per deck`** in `errors`.

The create request also accepts `is_private` (boolean): `true` makes the deck **unlisted** (excluded from Community, public profiles, and favorites), while `false` makes it public. Either persistent-deck setting is readable by direct URL. When omitted, the database default remains unlisted.

**Response 500:** v1 envelope — `errors` with code `**DECK_CREATE_ERROR`**.

**Implementation:** `[src/api/services/deckWriteService.ts](src/api/services/deckWriteService.ts)` · HTTP `[src/api/http/decks.http.ts](src/api/http/decks.http.ts)` · response `[src/api/dto/v1/DeckCreateV1DataDto.ts](src/api/dto/v1/DeckCreateV1DataDto.ts)`

### `POST /api/v1/decks/validate`

**Auth:** Valid **session cookie** or Bearer JWT. Unauthenticated → **401** v1 envelope.

**Request model:** `[src/api/http/models/decks/ValidateDeckRequestBody.ts](src/api/http/models/decks/ValidateDeckRequestBody.ts)` — `{ "cards": [ ... ] }` (array required; card shapes match legacy `**POST /api/decks/validate`**). Each card accepts an optional `**exclude_from_draw`** boolean (pre-placed cards); the pre-placed Basic Universe / Training limit + uniqueness rules read it. Omitted/false means the card is treated as a normal draw-pile card. Because saved cards are grouped by card identity, true marks exactly one physical copy in a row even when `quantity` is greater than 1.

**Response 200:** v1 envelope; `**data`** is `{ "valid": true, "message": "Deck is valid" }` (`[DeckValidateV1SuccessDto](src/api/dto/v1/DeckValidateV1SuccessDto.ts)`).

**Response 400:** v1 envelope — `errors` with code `**DECK_VALIDATION_FAILED`** and summary message; `data` includes a `validationErrors` array. Example:

```json
{
  "data": {
    "validationErrors": [
      "Deck must contain exactly 4 characters",
      "Deck must contain at least 1 location",
      "Total threat exceeds maximum allowed (60)"
    ]
  },
  "errors": [{ "code": "DECK_VALIDATION_FAILED", "message": "Deck validation failed" }],
  "success": false
}
```

**Response 500:** v1 envelope — `errors` with code `**DECK_VALIDATE_ERROR`**.

**Implementation:** `[DeckValidationService](src/services/deckValidationService.ts)` via `[DeckWriteService](src/api/services/deckWriteService.ts)` · HTTP `[src/api/http/decks.http.ts](src/api/http/decks.http.ts)`

---

## User decks (single: get, full, update, delete)

### `GET /api/v1/decks/:id`

**Auth:** Optional **session cookie** or Bearer JWT (`optionalOwnedAuth`). Any persistent deck can be fetched by its direct URL, whether `**is_private**` is `true` or `false`. This makes `is_private` an **unlisted/discovery** setting, not an access-control setting. Guest-session decks remain available only through their guest session endpoints.

**Request model:** none (path param `**id`** = deck UUID).

**Response 200:** v1 envelope; `data` is `{ "metadata", "cards" }`. Example:

```json
{
  "data": {
    "metadata": {
      "id": "e967130b-ca86-4e51-a6b3-c7908a5ce39f",
      "name": "My Deck",
      "description": "",
      "created": "2026-04-05T20:06:53.316Z",
      "lastModified": "2026-04-05T20:06:53.379Z",
      "cardCount": 1,
      "threat": 20,
      "is_valid": false,
      "is_private": true,
      "userId": "c567175f-a07b-41b7-b274-e82901d1b4f1",
      "uiPreferences": null,
      "isOwner": true,
      "is_limited": false,
      "reserve_character": null,
      "display_mission_card_id": null,
      "background_image_path": "src/resources/images/backgrounds/landscape/aesclepnotext.png"
    },
    "cards": [
      {
        "id": "41122877-fa93-4347-9242-d8b00604df6d",
        "type": "character",
        "cardId": "3bf3a341-d100-4718-af7f-de54ddf736ed",
        "quantity": 1,
        "exclude_from_draw": false
      }
    ]
  },
  "meta": {},
  "errors": [],
  "success": true
}
```

Metadata fields: `id`, `name`, `description`, `created` (ISO string), `lastModified` (ISO string), `cardCount`, `threat`, `is_valid` (server-owned — recomputed/persisted on every card mutation, create, import, and sample-deck copy; read-only for clients), `is_private` (boolean — deck listing; `true` = unlisted from Community, public profiles, and favorites, while still link-readable; `false` = public; defaults `true`), `userId`, `uiPreferences` (object or null — see [ui-preferences](#get-apiv1decksidui-preferences)), `isOwner`, `is_limited`, `reserve_character` (UUID or null), `display_mission_card_id` (UUID or null), `background_image_path`.

Card entry fields: `id` (deck-card row id), `type` (card category), `cardId` (catalog card id), `quantity`, optional `displayOrder` (stable zero-based deck-editor/preview order), and `exclude_from_draw` (true means one physical copy in the grouped row is pre-placed).

**Caching:** `Cache-Control: no-store`. Deck contents and calculated counts are mutable and publicly readable, so clients and edge caches must fetch the persisted state for every read.

**Response 404:** v1 envelope — `errors` with code `**DECK_NOT_FOUND`**.

**Response 500:** v1 envelope — `errors` with code `**DECK_FETCH_ERROR`**.

**Implementation:** `[DeckDetailService](src/api/services/deckDetailService.ts)` · HTTP `[decks.http.ts](src/api/http/decks.http.ts)`

### `GET /api/v1/decks/:id/full`

**Auth:** Same optional auth as `GET /api/v1/decks/:id` (all persistent decks readable by direct URL).

**Request model:** none.

**Response 200:** Same `**data`** shape as `**GET /api/v1/decks/:id`**, using `**getDeckSummaryWithAllCards**` (heavier card hydration).

**Caching:** Same `Cache-Control: no-store` behavior as `GET /api/v1/decks/:id`.

**Response 404 / 500:** Same codes as `**GET /api/v1/decks/:id`** (`DECK_NOT_FOUND` / `DECK_FETCH_ERROR`; full route uses “full deck data” in the 500 message).

### `PUT /api/v1/decks/:id`

**Auth:** Session cookie. **GUEST** → **403** v1 envelope (`GUEST_FORBIDDEN`). **Owner only**; non-owner → **403** (`DECK_ACCESS_DENIED`).

**Rate limiting / read-only:** Same pattern as `**POST /api/v1/decks`** (**429** `RATE_LIMIT_EXCEEDED`, **403** `READ_ONLY_MODE`).

**Request model:** partial JSON (same fields as legacy `**PUT /api/decks/:id`**): optional `**name`**, `**description**`, `**is_limited**`, `**is_private**` (boolean — toggle Community/public-profile listing; `true` means unlisted and `false` means public; owner-only), `**reserve_character**`, `**display_mission_card_id**`, `**background_image_path**` (non-empty paths validated via `**DeckBackgroundService.validateBackgroundPath**`). Validated in `[UpdateDeckRequestBody.ts](src/api/http/models/decks/UpdateDeckRequestBody.ts)`. **`is_valid` is server-owned and ignored on this route** — it is recomputed and persisted from the deck's cards on every card mutation, create, import, and sample-deck copy; clients cannot set it.

**Response 200:** v1 envelope; `**data`** = `{ "metadata", "cards": [] }` (updated metadata, empty cards array on success path).

**Response 400:** validation or invalid background (`INVALID_BACKGROUND`, `VALIDATION_ERROR`).

**Response 404:** `**DECK_NOT_FOUND`**.

**Response 500:** `**DECK_UPDATE_ERROR`**.

**Implementation:** `[DeckDetailService](src/api/services/deckDetailService.ts)` · HTTP `[decks.http.ts](src/api/http/decks.http.ts)`

### `DELETE /api/v1/decks/:id`

**Auth:** Session cookie. **GUEST** → **403** (`GUEST_FORBIDDEN`). **Owner only**; non-owner → **403** (`DECK_ACCESS_DENIED`).

**Rate limiting / read-only:** Same as `**PUT`**.

**Response 200:** v1 envelope; `**data`** = `{ "message": "Deck deleted successfully" }` (`[DeckDeleteV1DataDto](src/api/dto/v1/DeckDeleteV1DataDto.ts)`).

**Response 404:** `**DECK_NOT_FOUND`**.

**Response 500:** `**DECK_DELETE_ERROR`**.

**Implementation:** `[DeckDetailService](src/api/services/deckDetailService.ts)` · HTTP `[decks.http.ts](src/api/http/decks.http.ts)`

---

## User decks (cards)

Deck card CRUD for a database-backed deck. **Legacy** `**/api/decks/:id/cards`** routes are **removed** — only these v1 paths are registered.

### `GET /api/v1/decks/:id/cards`

**Auth:** Valid **session cookie** (same `**authenticateUser`** as `**GET /api/v1/decks/:id`**). Matches legacy behavior: **any authenticated user** may read the card list (no ownership check in the service).

**Response 200:** v1 envelope; `**data`** is an array of `{ "type", "cardId", "quantity"? }` rows from the repository’s `**getDeckCards`**.

**Response 501:** v1 envelope — `**NOT_IMPLEMENTED`** if the repository does not expose `**getDeckCards`** (unexpected for PostgreSQL).

**Response 500:** `**DECK_CARDS_FETCH_ERROR`**.

**Implementation:** `[DeckCardsService](src/api/services/deckCardsService.ts)` · HTTP `[decks.http.ts](src/api/http/decks.http.ts)`

### `POST /api/v1/decks/:id/cards`

**Auth:** Session cookie. **GUEST** → **403** (`GUEST_FORBIDDEN`). **Owner only**; non-owner → **403** (`DECK_ACCESS_DENIED`).

**Rate limiting / read-only:** Same pattern as `**POST /api/v1/decks`** (**429**, **403** `READ_ONLY_MODE`).

**Request model:** `[DeckCardsPostBody.ts](src/api/http/models/decks/DeckCardsPostBody.ts)` — JSON `**{ "cardType", "cardId", "quantity"? }`** (default quantity **1**).

**Response 200:** v1 envelope; `**data`** is transformed deck detail (`metadata` + `cards`) after add.

**Response 400:** validation or game rules (`VALIDATION_ERROR`); **404** `DECK_NOT_FOUND`; **500** `DECK_CARD_ADD_ERROR`.

**Implementation:** `[DeckCardsService](src/api/services/deckCardsService.ts)` · HTTP `[decks.http.ts](src/api/http/decks.http.ts)`

### `PUT /api/v1/decks/:id/cards`

**Auth:** Session cookie. **GUEST** → **403**. **Owner only**; non-owner → **403** (`DECK_ACCESS_DENIED`).

**Rate limiting / read-only:** Same as `**POST`**.

**Request model:** `[DeckCardsPutBody.ts](src/api/http/models/decks/DeckCardsPutBody.ts)` — `**{ "cards": [ { "cardType", "cardId", "quantity", "displayOrder"?, "exclude_from_draw"? }, … ] }`** (max **100** entries per request). `displayOrder` is a zero-based integer used to preserve deck-editor character order and deck-preview carousel order; omitted values remain backward compatible and sort after explicitly ordered rows.

**Response 200:** v1 envelope; `**data`** is updated deck detail after bulk replace.

**Response 400 / 500:** `**DECK_CARDS_REPLACE_FAILED`** (includes invalid card references); `**DECK_CARDS_REPLACE_ERROR`**.

**Implementation:** `[DeckCardsService](src/api/services/deckCardsService.ts)` · HTTP `[decks.http.ts](src/api/http/decks.http.ts)`

### `DELETE /api/v1/decks/:id/cards`

**Auth:** Session cookie. **GUEST** → **403**. **Owner only**.

**Rate limiting / read-only:** Same as `**POST`**.

**Request model:** same shape as `**POST`** (`[DeckCardsPostBody](src/api/http/models/decks/DeckCardsPostBody.ts)`) — partial remove with `**cardType`**, `**cardId**`, `**quantity**`, or clear all with `**cardType`: `"all"**`, `**cardId`: `"all"**`.

**Response 200:** v1 envelope; `**data`** is updated deck detail.

**Response 404 / 500:** `**DECK_NOT_FOUND`** / `**DECK_CARD_REMOVE_ERROR`**.

**Implementation:** `[DeckCardsService](src/api/services/deckCardsService.ts)` · HTTP `[decks.http.ts](src/api/http/decks.http.ts)`

---

## User decks (UI preferences)

### `GET /api/v1/decks/:id/ui-preferences`

**Auth:** Session cookie. **GUEST** → **403** (`GUEST_FORBIDDEN`). **Owner only**; non-owner → **403** (`DECK_ACCESS_DENIED`).

**Response 200:** v1 envelope; `data` = UI preferences object stored in `decks.ui_preferences`, or `{}` if unset. Schema:

```json
{
  "dividerPosition": 350,
  "expansionState": { "character": true, "location": false },
  "powerCardsSortMode": "type",
  "characterGroupExpansionState": { "group-id-abc": true }
}
```

All fields are optional: `dividerPosition` (number), `expansionState` (Record<string, boolean>), `powerCardsSortMode` (`"type"|"value"`), `characterGroupExpansionState` (Record<string, boolean>).

**Response 500:** `**UI_PREFERENCES_FETCH_ERROR`**.

**Implementation:** `[DeckUIPreferencesService](src/api/services/deckUIPreferencesService.ts)` · HTTP `[decks.http.ts](src/api/http/decks.http.ts)`

### `PUT /api/v1/decks/:id/ui-preferences`

**Auth:** Session cookie. **GUEST** → **403** (`GUEST_FORBIDDEN`). **Owner only**; non-owner → **403** (`DECK_ACCESS_DENIED`).

**Rate limiting / read-only:** Same patterns as other deck mutations (`checkRateLimit`, `blockInReadOnlyMode`).

**Body:** JSON object (optional `**viewMode`** (`tile`  `list`), `**sortBy`**, `**filterBy**`, max object size 1000 characters).

**Response 200:** v1 envelope; `**data`** = saved preferences body.

**Response 400 / 404 / 500:** `**VALIDATION_ERROR`**, `**DECK_NOT_FOUND`**, `**UI_PREFERENCES_UPDATE_ERROR**`.

**Implementation:** `[DeckUIPreferencesService](src/api/services/deckUIPreferencesService.ts)` · HTTP `[decks.http.ts](src/api/http/decks.http.ts)`

---

## Community, favorites, and public profiles

Read-only community feed, deck favorites, and public user profiles. These power the desktop `/community` page and the mobile Decks tabs.

**Enriched list items:** the responses below return deck list items in the same `{ "metadata", "cards" }` shape as `GET /api/v1/decks`, plus two extra `metadata` fields:

- `ownerDisplayName` (string or `null`) — the resolved public name of the deck owner (`resolveUserDisplayName`).
- `isFavorited` (boolean) — whether the **current viewer** has favorited this deck (always `false` for guests).

**Caching:** `GET /api/v1/community/decks`, `GET /api/v1/community/preconstructed-decks`, `GET /api/v1/users/:userId/public-decks`, and `GET /api/v1/decks/favorites` emit `Cache-Control: private, max-age=0, must-revalidate` and `Vary: Cookie` so CloudFront does not serve stale per-viewer favorite state after toggles. See [`docs/current/CLOUDFRONT_CDN.md`](docs/current/CLOUDFRONT_CDN.md).

**Visibility rule:** only decks with `is_private = false` are ever returned by the community feed, search, public profiles, and favorites. Curated internal accounts (`community_decks` `…0002`, `tournament_decks` `…0003`) are **excluded** from the community feed/search (they have their own `GET /api/v1/decks/community` and `GET /api/v1/decks/tournament` rails). Those curated rails return only **`is_private = false` AND `is_valid = true`** decks (Limited allowed when legal).

> **Naming:** `GET /api/v1/community/decks` (this section, user-submitted public feed) is distinct from `GET /api/v1/decks/community` (the curated `community_decks` account rail used by Home).

### `GET /api/v1/community/decks`

**Auth:** Optional session cookie or Bearer. Authenticated viewers get `isFavorited` populated; guests are allowed and always see `isFavorited: false`.

**Query:** optional `**search**` — when omitted/blank, returns the **20 most-recent** public, legal, non-limited decks; when present, name-matches deck titles, owner usernames, characters (slots 1–4 + reserve), or location across **all** public/legal/non-limited decks.

**Response 200:** v1 envelope; `**data`** = array of enriched deck list items.

**Implementation:** `[CommunityService.getCommunityDecks](src/api/services/communityService.ts)` · HTTP `[community.http.ts](src/api/http/community.http.ts)`

---

### `GET /api/v1/community/preconstructed-decks`

Official starter/preconstructed decks registered by release set. These decks are public and
Limited, remain directly linkable/shareable, and are omitted from the ordinary community feed.

**Auth:** Optional session cookie or Bearer. Authenticated viewers get `isFavorited` populated;
guests are allowed and always see `isFavorited: false`.

**Response 200:** v1 envelope; `**data**` = an array of
`{ "setCode": "SKY", "setName": "Skybound", "decks": [...] }` groups, newest release set first.
`setName` is the friendly name from the canonical sets catalog (for example,
`Edgar Rice Burroughs and the World Legends` rather than `ERB`). Each `decks` array preserves the
workbook-defined deck order and contains enriched deck list items. Each group also includes
`featuredUpgradeRecommendations`; Skybound contains the four curated upgrade decks in configured
display order, while sets without an upgrade row return an empty array. These items use the same
enriched deck shape and viewer-specific favorite state. Production resolves the supplied canonical
deck UUIDs; local development resolves browser-created stand-ins containing the same deck names and
character lineups.

**Response 500:** `PRECONSTRUCTED_DECKS_ERROR`.

**Implementation:** `[CommunityService.getPreconstructedDeckGroups](src/api/services/communityService.ts)` · HTTP `[community.http.ts](src/api/http/community.http.ts)`

---

### `GET /api/v1/users/:userId/public-decks`

Read-only public profile feed: the target user's `is_private = false` decks.

**Auth:** Optional session cookie or Bearer (guests allowed).

**Response 200:** v1 envelope; `**data`** = array of enriched deck list items (empty array if the user has no public decks).

**Implementation:** `[CommunityService.getPublicDecksForUser](src/api/services/communityService.ts)` · HTTP `[community.http.ts](src/api/http/community.http.ts)`

---

### `GET /api/v1/decks/favorites`

The current viewer's favorited decks (filters out private/deleted decks).

**Auth:** Session cookie or Bearer (required). **GUEST/unauthenticated** → **401/403**.

**Response 200:** v1 envelope; `**data`** = array of enriched deck list items (`isFavorited: true`).

**Implementation:** `[CommunityService.getFavorites](src/api/services/communityService.ts)` · HTTP `[community.http.ts](src/api/http/community.http.ts)`

---

### `POST /api/v1/decks/:id/favorite`

Favorite a deck. Idempotent (unique on `(user_id, deck_id)`).

**Auth:** Session cookie or Bearer (required).

**Response 200** (`data`): `{ "deckId": "<id>", "isFavorited": true }`

**Response 400:** `CANNOT_FAVORITE_OWN` (you cannot favorite your own deck).

**Response 404:** `DECK_NOT_FOUND`.

**Implementation:** `[CommunityService.addFavorite](src/api/services/communityService.ts)` · HTTP `[community.http.ts](src/api/http/community.http.ts)`

---

### `DELETE /api/v1/decks/:id/favorite`

Unfavorite a deck. Idempotent.

**Auth:** Session cookie or Bearer (required).

**Response 200** (`data`): `{ "deckId": "<id>", "isFavorited": false }`

**Implementation:** `[CommunityService.removeFavorite](src/api/services/communityService.ts)` · HTTP `[community.http.ts](src/api/http/community.http.ts)`

---

## Guest decks (session memory)

Session-scoped decks for **GUEST** users: stored **in memory** keyed by `**sessionId`** cookie (not persisted to PostgreSQL). **GET list** merges DB decks for the guest user (`getDecksByUserId` + `transformDeckList`) with session guest decks (same list shape as `**GET /api/v1/decks`** entries).

> **Clone-on-open pattern:** When a GUEST user navigates to a deck URL that belongs to a logged-in user (e.g. a shared link), the frontend checks deck ownership from `metadata.isOwner`. If `isOwner` is `false`, the client can offer to clone the deck into a new guest session deck via `POST /api/v1/guest/decks` (copy name/description) followed by `PUT /api/v1/guest/decks/:id/cards` (copy cards). There is no server-side clone endpoint — the client drives this sequence.

**Auth:** Valid **session cookie** (`authenticateUser`) **and** `**GUEST`** role **and** `**sessionId`** cookie. Unauthenticated → **401** v1 envelope (`UNAUTHORIZED`). Wrong role → **403** v1 envelope, code `**GUEST_ONLY`**. Missing `**sessionId`** → 401, code `**SESSION_REQUIRED**`.

> **Note:** Guest deck routes use **session cookie only** — Bearer JWT is not accepted on these endpoints.

**Implementation:** `[GuestDeckService](src/api/services/guestDeckService.ts)` · HTTP `[guest-decks.http.ts](src/api/http/guest-decks.http.ts)`

### `POST /api/v1/guest/decks`

**Body (optional):** `{ "name"?, "description"? }` — defaults `**name`** `"New Deck"`, `**description`** `""`. Request model: `[CreateGuestDeckBody.ts](src/api/http/models/guest-decks/CreateGuestDeckBody.ts)`

**Response 201:** v1 envelope; `**data`** = `{ "id", "name", "description", "created_at", "updated_at" }`.

### `GET /api/v1/guest/decks`

**Response 200:** v1 envelope; `**data`** = merged array (DB + session guest decks).

### `GET /api/v1/guest/decks/:id`

**Response 200:** v1 envelope; `**data`** = `{ "metadata": { ..., "isOwner": true }, "cards": [...] }`.

**Response 404:** `**DECK_NOT_FOUND`**.

### `PUT /api/v1/guest/decks/:id`

**Body:** optional `**name`**, `**description`**, `**reserve_character`** (character card UUID or `null`) — `[UpdateGuestDeckBody.ts](src/api/http/models/guest-decks/UpdateGuestDeckBody.ts)`

**Response 200:** v1 envelope; `**data`** = list-item shape (same as merged list entries).

### `PUT /api/v1/guest/decks/:id/cards`

Replace all cards (max **100** entries; per-entry `**quantity`** 1–100). **Body:** `{ "cards": [ { "cardType", "cardId", "quantity"?, "displayOrder"?, "exclude_from_draw"? }, ... ] }` — `[GuestDeckCardsPutBody.ts](src/api/http/models/guest-decks/GuestDeckCardsPutBody.ts)`. Guest decks retain the supplied zero-based `displayOrder` in session memory.

**Response 200:** v1 envelope; `**data`** = full guest deck `{ "metadata", "cards" }`.

### `POST /api/v1/guest/decks/:id/cards`

Add one card; same validation rules as DB deck add (one-per-deck, cataclysm, etc.). **Body:** `**cardType`**, `**cardId`**, optional `**quantity**`.

**Response 200:** v1 envelope; `**data`** = full guest deck.

### `DELETE /api/v1/guest/decks/:id`

**Response 200:** v1 envelope; `**data`** = `{}` (empty object).

**Response 404:** `**DECK_NOT_FOUND`**.

---

## Collections (current user)

> **GUEST users have no server-side collection.** The GUEST role (`POST /api/auth/login` with username `guest` and no password) is denied by `authenticateUser` on all `/api/v1/collections/*` endpoints (**401**). The web app tracks the guest collection entirely in **`localStorage`** (key: `guestCollection`) on the client — no collection API calls are made for GUEST sessions. A new frontend must replicate this localStorage read/write when the user role is `GUEST`.

**Caching (all collection GETs):** `Cache-Control: private, max-age=0, must-revalidate`
and `Vary: Cookie`. Collection responses are mutable and user-specific, so CloudFront
must not reuse an older response after a card mutation or share one between sessions.

### `GET /api/v1/collections/me`

**Auth:** Valid **session cookie** (`authenticateUser`). Unauthenticated requests receive **401** with the v1 envelope: `{ "data": null, "errors": [{ "code": "UNAUTHORIZED", "message": "..." }], "success": false }`.

**Request model:** none.

**Response 200:** v1 envelope; `**data`** is `{ "id": "<collection uuid>", "user_id": "<authenticated user id>" }` — same field names as removed legacy `**GET /api/collections/me`**. The server **gets or creates** the user’s collection row.

**Response 500:** v1 envelope — `errors` with code `**COLLECTION_ME_ERROR`**; `**data`** may be `null`.

**Implementation:** `[CollectionService](src/services/collectionService.ts)` · HTTP `[collections.http.ts](src/api/http/collections.http.ts)` · response shape `[CollectionMeV1DataDto](src/api/dto/v1/CollectionMeV1DataDto.ts)`

### `GET /api/v1/collections/me/cards`

**Auth:** Valid **session cookie** (`authenticateUser`). Unauthenticated → **401** v1 envelope.

**Response 200:** v1 envelope; `**data`** is an array of collection rows (same shape as legacy `GET /api/collections/me/cards` payload): snake_case fields including `card_id`, `card_type`, `quantity`, `image_path`, plus joined card metadata when present.

**Response 500:** `errors` with code `**COLLECTION_CARDS_FETCH_ERROR`**.

### `GET /api/v1/collections/me/history`

**Auth:** Session cookie (`authenticateUser`). Unauthenticated → **401** v1 envelope.

**Query:** optional `**limit`** — must be a **positive integer** when present (same rule as removed legacy `**GET /api/collections/me/history`**). Omit `**limit`** to return all history (service default).

**Response 200:** v1 envelope; `**data`** is an array of history rows: `id`, `collection_id`, `card_id`, `action` (`ADD`  `REMOVE`), `new_quantity`, `created_at`, ordered by `**created_at` DESC** (most recent first).

**Response 400:** `**VALIDATION_ERROR`** — `limit` not a positive integer.

**Response 500:** `**COLLECTION_HISTORY_ERROR`**.

**Implementation:** `[CollectionService.getCollectionHistory](src/services/collectionService.ts)` · HTTP `[collections.http.ts](src/api/http/collections.http.ts)`

### `POST /api/v1/collections/me/cards`

**Auth:** Session cookie.

**Body:** JSON — `**cardId`** (string), `**cardType`** (valid collection type; see `isValidCollectionCardType` in `[src/validation/collectionCardType.ts](src/validation/collectionCardType.ts)`), optional `**quantity**` (defaults like legacy: numeric `|| 1`), optional `**imagePath**`.

**Response 200:** v1 envelope; `**data`** is the full collection row after add (same as legacy).

**Response 400:** `**VALIDATION_ERROR`** (missing/invalid fields).

**Response 404:** `**COLLECTION_CARD_NOT_FOUND`** when the card does not exist in the catalog table for that type.

**Response 500:** `**COLLECTION_CARD_ADD_ERROR`**.

### `POST /api/v1/collections/me/cards/remove-one`

**Auth:** Session cookie.

**Body:** `**cardId`**, `**cardType`**, `**imagePath**` (all required non-empty strings; `**cardType**` must be valid).

**Response 200:** v1 envelope; `**data`** is the updated row or `**null`** if the last copy was removed.

**Response 400 / 404 / 500:** `**VALIDATION_ERROR`**, `**COLLECTION_REMOVE_ONE_NOT_FOUND`**, `**COLLECTION_REMOVE_ONE_ERROR**`.

### `PUT /api/v1/collections/me/cards/:cardId`

**Auth:** Session cookie.

**Body:** `**quantity`** (number, ≥ 0), `**cardType`** (valid), `**imagePath**` (required), optional `**oldImagePath**`.

**Response 200:** v1 envelope; `**data`** is the updated row, or `**null`** when `**quantity**` is **0** and the row was removed.

**Response 400:** `**VALIDATION_ERROR`** (missing fields, negative quantity, etc.).

**Response 404:** `**COLLECTION_CARD_NOT_IN_COLLECTION`** when the row does not exist (and `**quantity`** was not 0).

**Response 500:** `**COLLECTION_CARD_UPDATE_ERROR`**.

### `DELETE /api/v1/collections/me/cards/:cardId`

**Auth:** Session cookie.

**Query:** `**cardType`** required (valid collection type). Removes **all** rows for that `**cardId` + `cardType`** (same semantics as legacy).

**Response 200:** v1 envelope; `**data`** is `{ "message": "Card removed from collection" }`.

**Response 400 / 404 / 500:** `**VALIDATION_ERROR`**, `**COLLECTION_CARD_NOT_IN_COLLECTION`**, `**COLLECTION_CARD_DELETE_ERROR**`.

**Implementation (cards):** `[CollectionService](src/services/collectionService.ts)` · HTTP `[collections.http.ts](src/api/http/collections.http.ts)` · row type `[CollectionCardRowV1Dto](src/api/dto/v1/CollectionCardRowV1Dto.ts)`

---

## Saved database views

Personal shortcuts for restoring Card Database tabs and filters. Records are always scoped to the authenticated user's ID; no request accepts a `userId`. During the temporary launch phase, the centralized Saved Views access policy allows only the `ADMIN` role. This role check is an eligibility boundary, not an administrator-manages-users-data contract. All responses use `Cache-Control: private, max-age=0, must-revalidate` and `Vary: Cookie`.

The server enforces a maximum of **50** records per user. Names are trimmed, non-empty display labels of at most **80** characters; duplicate names are valid. Create serializes on the owning user row before counting, so concurrent requests cannot exceed the quota.

### Persisted V1 state

`viewState` is a strict, versioned object. Unknown fields, unsupported tabs/operators, tab-incompatible filter fields, and unsupported schema versions are rejected.

```json
{
  "schemaVersion": 1,
  "tab": "characters",
  "search": "invincible",
  "setFilter": "SKY",
  "filters": {
    "numeric": [{ "field": "energy", "op": "gte", "value": 5 }],
    "powerTypes": [],
    "functionIcons": [],
    "missionSet": ""
  },
  "hasFoilFilter": true,
  "hideAltsFilter": false
}
```

`tab` accepts `all` and every Card Database catalog tab. Numeric operators are `eq`, `gte`, and `lte`. The state deliberately excludes pagination, selected-card/detail state, filter-rail presentation state, and Saved Views panel presentation state.

### `GET /api/v1/saved-database-views`

Lists only the caller's records. Pinned records sort first; each section sorts by `createdAt DESC`, then ID descending.

**Response 200** (`data`):

```json
{
  "views": [{
    "id": "uuid",
    "name": "Skybound characters",
    "viewState": { "schemaVersion": 1, "tab": "characters", "search": "", "setFilter": "SKY", "filters": { "numeric": [], "powerTypes": [], "functionIcons": [], "missionSet": "" }, "hasFoilFilter": false, "hideAltsFilter": true },
    "isPinned": true,
    "createdAt": "2026-09-09T12:00:00.000Z",
    "updatedAt": "2026-09-09T12:00:00.000Z"
  }],
  "count": 1,
  "max": 50
}
```

### `POST /api/v1/saved-database-views`

**Body:** `{ "name": "...", "viewState": { ...complete V1 state... } }`.

**Response 201:** `{ "view": <created record>, "count": <current count>, "max": 50 }`. New records are unpinned.

### `PATCH /api/v1/saved-database-views/:id`

**Body:** one or both of `{ "name": "...", "isPinned": true }`. No state-update field is accepted. Metadata changes preserve `createdAt` and advance `updatedAt`.

**Response 200:** `{ "view": <updated record>, "count", "max" }`.

### `DELETE /api/v1/saved-database-views/:id`

Deletes one caller-owned record.

**Response 200:** `{ "deletedCount": 1, "notFoundCount": 0, "count", "max" }`.

### `POST /api/v1/saved-database-views/bulk-delete`

**Body:** `{ "ids": ["uuid", "uuid"] }`, one to 50 IDs. IDs are de-duplicated. The atomic delete remains caller-scoped and returns counts without identifying another user's records.

**Response 200:** `{ "deletedCount", "notFoundCount", "count", "max" }`.

**Shared errors:** 401 `UNAUTHORIZED`; 403 `SAVED_DATABASE_VIEW_FORBIDDEN`; 400 `SAVED_DATABASE_VIEW_INVALID_NAME`, `SAVED_DATABASE_VIEW_INVALID_STATE`, `SAVED_DATABASE_VIEW_UNSUPPORTED_SCHEMA_VERSION`, `SAVED_DATABASE_VIEW_INVALID_ID`, or `SAVED_DATABASE_VIEW_INVALID_METADATA`; 404 `SAVED_DATABASE_VIEW_NOT_FOUND`; 409 `SAVED_DATABASE_VIEW_LIMIT_REACHED`; 500 `SAVED_DATABASE_VIEW_ERROR`.

**Implementation:** HTTP [`saved-database-views.http.ts`](src/api/http/saved-database-views.http.ts) · service [`savedDatabaseViewService.ts`](src/api/services/savedDatabaseViewService.ts) · DTO [`SavedDatabaseViewDto.ts`](src/api/dto/v1/SavedDatabaseViewDto.ts)

---

## Admin

**Auth:** Valid **session cookie** (`authenticateUser`) **and** `**ADMIN`** role. Unauthenticated requests may receive **401** with the **legacy** session middleware shape (`{ "success": false, "error": "..." }`), consistent with other session-backed v1 routes. Non-admin → **403** v1 envelope, code `**ADMIN_REQUIRED`**.

**Implementation:** `[AdminService](src/api/services/adminService.ts)` · HTTP `[admin.http.ts](src/api/http/admin.http.ts)`

### `GET /api/v1/admin/biz-ops-dashboard`

Returns the ledger-backed AWS cost snapshot for the admin-only Biz Ops Dashboard. The server reads the committed `business-operations/metrics/aws-costs.csv` file through `AwsCostLedgerRepository`; the browser never receives the source CSV, record hashes, source identifiers, or ingestion internals.

**Response 200:** v1 envelope; `data` contains:

- `generatedAt`, `currency`
- finalized-invoice coverage: `coverage.finalizedInvoiceCount`, `finalizedPeriodStart`, `finalizedPeriodEnd`
- current estimated month: month, through date, estimated total, daily average, simple month-end projection, previous finalized invoice comparison, and historic-high flag
- year-to-date finalized, estimated, and tracked totals
- `monthlyCosts[]` with finalized/estimated identity for charting
- `serviceCosts[]` with service name, amount, and percentage of current estimated spend
- `serviceTrends[]` with each active service's rolling twelve-month window: the previous eleven finalized invoice-row amounts plus the current Cost Explorer amount marked as estimated
- the latest scheduled weekly digest period and amount when present

**Response 500:** `ADMIN_BIZ_OPS_DASHBOARD_ERROR`.

**Implementation:** [`AdminBizOpsDashboardService`](src/api/services/adminBizOpsDashboardService.ts) · [`AwsCostLedgerRepository`](src/repository/AwsCostLedgerRepository.ts) · HTTP [`admin.http.ts`](src/api/http/admin.http.ts)

### `GET /api/v1/admin/user-analytics`

Returns aggregate-only account, feature-usage, login-time, deck, and collection analytics for the admin User Analytics view. The query includes `USER` role accounts and excludes the `community_decks` and `tournament_decks` utility accounts from user and login metrics. No user identifiers are returned.

**Response 200:** v1 envelope; `**data`** contains:

- snapshot dates: `generatedAt`, `acquisitionPeriodStart`
- aggregate KPIs: `standardUserAccounts`, `newStandardAccounts`, `loggedInLast24Hours`, `loggedInLast30Days`, `inactiveOver30Days`, `googleAuthUsers`, `recordedLoginUsers`
- rolling twelve-month `signupMonths` counts (latest month marked `partial`)
- aggregate `loginRecency` buckets
- `siteSectionUsage`: cumulative classified request counts and percentage share for Home, Database, Decks, and Collection, derived from `endpoint_hit_counts`
- `loginTimeDistribution`: 24 Pacific-hour buckets with rolling-24-hour and all-known-history successful session-start counts, both aggregate totals, IANA timezone, and the rolling window start
- `deckStatistics`: total, legal, and Limited deck counts; legal/Limited percentages; average non-starter decks per standard user with all user-created decks and with legal user-created decks only
- `collectionStatistics`: users with a positive owned-card quantity, collection adoption percentage, average owned-card quantity per standard user, and average owned-card quantity per active collector

The acquisition period begins on the first day of the previous calendar month. Recent and inactive account counts use rolling 24-hour and 30-day windows relative to `generatedAt`; inactive accounts include accounts with no recorded login. Login-time telemetry stores no user identifiers, counts successful standard-user session starts (including signup), and groups UTC hourly counters with `America/Los_Angeles` so daylight-saving transitions are handled correctly. Each hour returns `count` for the rolling 24-hour window and `allTimeCount` across the complete aggregate counter history as of `generatedAt`; `totalLogins` and `allTimeTotalLogins` are the corresponding totals. Migrations V341 and V342 seed one known most-recent-login event per standard account from before live counters began; subsequent successful sessions are counted individually. The historical series therefore includes every known latest login, but cannot reconstruct additional earlier sign-ins from before telemetry existed.

`siteSectionUsage` is API request share, not time spent, page views, or unique users. Home includes recent-updates traffic; Database includes catalog and set traffic; Decks includes deck, community, public-deck, and deck-background traffic; Collection includes collection traffic. Shared endpoints may support more than one screen, and auth/admin/feedback/account traffic is not classified.

Deck legality reads the server-authoritative `decks.is_valid` value. Deck totals and percentages include every saved deck, while both per-user deck averages exclude the sample deck automatically copied during signup. Collection averages sum card quantities rather than unique collection-card rows; the per-user average includes users with no collection cards.

**Response 500:** `**ADMIN_USER_ANALYTICS_ERROR`**.

### `GET /api/v1/admin/users`

**Response 200:** v1 envelope; `**data`** = array of `{ "id", "name", "email", "role", "lastLoginAt" }` (no password hash).

**Response 500:** `**ADMIN_USERS_LIST_ERROR`**.

### `POST /api/v1/admin/users`

**Body:** `{ "username", "password" }` — request validation: `[CreateAdminUserBody.ts](src/api/http/models/admin/CreateAdminUserBody.ts)`

**Response 201:** v1 envelope; `**data`** = created user (same shape as list entries).

**Response 400:** validation — e.g. missing `**username`** / `**password`** (`VALIDATION_ERROR`).

**Response 409:** `**USERNAME_EXISTS`**.

**Response 500:** `**ADMIN_USER_CREATE_ERROR`**.

### `GET /api/v1/admin/debug/clear-cache`

Clears deck repository cache (in-memory).

**Response 200:** v1 envelope; `**data`** = `{ "message": "Deck cache cleared" }`.

### `GET /api/v1/admin/debug/clear-card-cache`

Clears card repository caches.

**Response 200:** v1 envelope; `**data`** = `{ "message": "Card repository cache cleared" }`.

### `GET /api/v1/admin/database/status`

**Response 200:** v1 envelope; `**data`** = `{ "status": "OK", "database": { "valid", "upToDate", "migrations" } }` (same semantics as former legacy `**GET /api/database/status`** payload, wrapped in `**data**`).

**Response 500:** `**ADMIN_DATABASE_STATUS_ERROR`**.

---

## Route index (v1)


| Method | Path                                    | Router module       |
| ------ | --------------------------------------- | ------------------- |
| POST   | /api/v1/auth/login                      | auth.http.ts        |
| POST   | /api/v1/auth/refresh                    | auth.http.ts        |
| GET    | /api/v1/auth/me                         | auth.http.ts        |
| POST   | /api/v1/auth/logout                     | auth.http.ts        |
| POST   | /api/v1/users/change-email              | users.http.ts       |
| POST   | /api/v1/users/change-password           | users.http.ts       |
| POST   | /api/v1/users/display-name              | users.http.ts       |
| POST   | /api/v1/feedback                        | feedback.http.ts    |
| GET    | /api/v1/catalog/characters              | dbv-catalog.http.ts |
| GET    | /api/v1/catalog/locations               | dbv-catalog.http.ts |
| GET    | /api/v1/catalog/battlegrounds           | dbv-catalog.http.ts |
| GET    | /api/v1/catalog/special-cards           | dbv-catalog.http.ts |
| GET    | /api/v1/catalog/missions                | dbv-catalog.http.ts |
| GET    | /api/v1/catalog/events                  | dbv-catalog.http.ts |
| GET    | /api/v1/catalog/aspects                 | dbv-catalog.http.ts |
| GET    | /api/v1/catalog/advanced-universe       | dbv-catalog.http.ts |
| GET    | /api/v1/catalog/teamwork                | dbv-catalog.http.ts |
| GET    | /api/v1/catalog/ally-universe           | dbv-catalog.http.ts |
| GET    | /api/v1/catalog/training                | dbv-catalog.http.ts |
| GET    | /api/v1/catalog/basic-universe          | dbv-catalog.http.ts |
| GET    | /api/v1/catalog/power-cards             | dbv-catalog.http.ts |
| GET    | /api/v1/catalog/foil-card-map           | dbv-catalog.http.ts |
| GET    | /api/v1/dbv/sets                        | dbv-support.http.ts |
| GET    | /api/v1/dbv/deck-backgrounds            | dbv-support.http.ts |
| GET    | /api/v1/recent-updates                  | recent-updates.http.ts |
| GET    | /api/v1/decks/favorites                 | community.http.ts   |
| POST   | /api/v1/decks/:id/favorite              | community.http.ts   |
| DELETE | /api/v1/decks/:id/favorite              | community.http.ts   |
| GET    | /api/v1/community/decks                 | community.http.ts   |
| GET    | /api/v1/community/preconstructed-decks | community.http.ts   |
| GET    | /api/v1/users/:userId/public-decks      | community.http.ts   |
| GET    | /api/v1/decks                           | decks.http.ts       |
| GET    | /api/v1/decks/stats                     | decks.http.ts       |
| POST   | /api/v1/decks                           | decks.http.ts       |
| POST   | /api/v1/decks/validate                  | decks.http.ts       |
| GET    | /api/v1/decks/:id/full                  | decks.http.ts       |
| GET    | /api/v1/decks/:id                       | decks.http.ts       |
| PUT    | /api/v1/decks/:id                       | decks.http.ts       |
| GET    | /api/v1/decks/:id/cards                 | decks.http.ts       |
| POST   | /api/v1/decks/:id/cards                 | decks.http.ts       |
| PUT    | /api/v1/decks/:id/cards                 | decks.http.ts       |
| DELETE | /api/v1/decks/:id/cards                 | decks.http.ts       |
| GET    | /api/v1/decks/:id/ui-preferences        | decks.http.ts       |
| PUT    | /api/v1/decks/:id/ui-preferences        | decks.http.ts       |
| DELETE | /api/v1/decks/:id                       | decks.http.ts       |
| GET    | /api/v1/guest/decks                     | guest-decks.http.ts |
| POST   | /api/v1/guest/decks                     | guest-decks.http.ts |
| GET    | /api/v1/guest/decks/:id                 | guest-decks.http.ts |
| PUT    | /api/v1/guest/decks/:id                 | guest-decks.http.ts |
| DELETE | /api/v1/guest/decks/:id                 | guest-decks.http.ts |
| PUT    | /api/v1/guest/decks/:id/cards           | guest-decks.http.ts |
| POST   | /api/v1/guest/decks/:id/cards           | guest-decks.http.ts |
| GET    | /api/v1/collections/me                  | collections.http.ts |
| GET    | /api/v1/collections/me/cards            | collections.http.ts |
| GET    | /api/v1/collections/me/history          | collections.http.ts |
| POST   | /api/v1/collections/me/cards            | collections.http.ts |
| POST   | /api/v1/collections/me/cards/remove-one | collections.http.ts |
| PUT    | /api/v1/collections/me/cards/:cardId    | collections.http.ts |
| DELETE | /api/v1/collections/me/cards/:cardId    | collections.http.ts |
| GET    | /api/v1/admin/users                     | admin.http.ts       |
| GET    | /api/v1/admin/biz-ops-dashboard         | admin.http.ts       |
| GET    | /api/v1/admin/user-analytics            | admin.http.ts       |
| POST   | /api/v1/admin/users                     | admin.http.ts       |
| GET    | /api/v1/admin/debug/clear-cache         | admin.http.ts       |
| GET    | /api/v1/admin/debug/clear-card-cache    | admin.http.ts       |
| GET    | /api/v1/admin/database/status           | admin.http.ts       |


---

## Non-v1 surfaces

These endpoints are **intentionally not** under `**/api/v1`**:

| Path | Notes |
| ---- | ----- |
| `GET /health` | Operations/monitoring; deep health check with DB ping. Shape is health-specific (not v1 envelope). |
| `GET /health/ready` | Readiness for deploy gates — live payload + `SELECT 1` DB ping. |
| `GET /health/live` | Lightweight liveness probe (no DB). Returns `{ "status": "OK" }`. |
| `GET /health/deep` | Same as `GET /health` — alias for deep health check. |
| `GET /api/v1/config/app` | JSON: `{ "cdnBase": "<string>", "communityDecksUserId": "<uuid>", "tournamentDecksUserId": "<uuid>" }`. No auth required. v2 SPA loads this at boot. `communityDecksUserId` backs the Home "Community Decks" pool; `tournamentDecksUserId` backs the "Tournament Winning Decks" pool. |
| **Static assets** | `src/resources/` (card images, UI assets) and `frontend/dist/assets/*` when built — see [API_DOCUMENTATION.md](API_DOCUMENTATION.md). |
| **HTML shell routes** | `/`, `/home`, `/login`, `/users/:userId/decks`, `/users/:userId/collection`, `/data` — serve `frontend/dist/index.html`; see [API_DOCUMENTATION.md](API_DOCUMENTATION.md). |

**Legacy** JSON that remains outside v1 (e.g. `**POST /api/users/change-password`**) is documented only in [API_DOCUMENTATION.md](API_DOCUMENTATION.md).

---

## Image URL contract

Excelsior card images are served from the CDN at `APP_CDN_BASE` (production:
`https://cdn.excelsior.cards`). Paths follow `/src/resources/cards/images/<type>/<file>`
and `/src/resources/cards/images/<type>/thumb/<file>` for thumbnails. Clients
MUST consume the `image` / `imagePath` fields on catalog DTOs rather than
constructing filenames from card IDs. Full details, valid `<type>` values,
and fallback behavior are in
`[docs/current/API_V1_IMAGE_CONTRACT.md](docs/current/API_V1_IMAGE_CONTRACT.md)`.

---

## Caching & conditional GET

All global-GET catalog routes (`/api/v1/catalog/`* and `/api/v1/dbv/sets`)
emit:

- `Cache-Control: public, max-age=300, stale-while-revalidate=3600`
- `ETag: "<catalogDataVersion>-<sha1(body)[:12]>"` (strong)
- `Vary: Accept-Encoding`
- `meta.catalogDataVersion` (monotonic integer, bumps on re-ingest)
- `meta.catalogLastUpdated` (ISO-8601 timestamp)

Clients SHOULD send `If-None-Match: "<last-seen-etag>"` to receive `304 Not Modified` when nothing has changed. CloudFront caches these paths at the
edge (`[infra/cloudfront.tf](infra/cloudfront.tf)`) and forwards the
conditional-GET headers to the origin.

Responses are also gzip/brotli compressed via the `compression` middleware;
clients should send `Accept-Encoding: br, gzip`.

Full spec, kill switches, and rollback:
`[docs/current/API_V1_CATALOG_CACHING.md](docs/current/API_V1_CATALOG_CACHING.md)`.

---

## Error catalog

Every stable `errors[].code` value is catalogued in
`[docs/current/API_V1_ERROR_CATALOG.md](docs/current/API_V1_ERROR_CATALOG.md)`
with HTTP status, meaning, and typical remediation. Adding a new `/api/v1`
route requires a new entry there and an entry in
`[docs/openapi.yaml](docs/openapi.yaml)` in the same PR.

---

## Changelog

See `[docs/current/API_V1_CHANGELOG.md](docs/current/API_V1_CHANGELOG.md)`
for the chronological list of v1 changes (one line per change, newest
first).

---

## Deprecation policy

- Additive changes (new endpoints, new optional fields, new error codes)
can ship at any time and are announced in the changelog.
- Breaking changes (removed endpoints, renamed fields, changed error
semantics) require at least 60 days of notice in the changelog and a
deprecation warning logged server-side with `deprecation_warning` in the
structured logs. Clients will see the old behavior during the deprecation
window.
- The `/api/v1` prefix itself is stable; a future `/api/v2` would be
introduced side-by-side rather than as a mutation of v1.
- The OpenAPI spec (`[docs/openapi.yaml](docs/openapi.yaml)`) is the
machine-readable contract. Any breaking change must be reflected there
before the deprecation window starts.
