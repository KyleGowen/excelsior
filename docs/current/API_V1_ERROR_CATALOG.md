# API v1 — error catalog

Every `/api/v1` response uses the envelope `{ data, meta, errors }`. On any
non-2xx, `data` is `null` and `errors` is a non-empty array of
`{ code, message, field? }`. This table is authoritative for the stable
`code` values. **Any new `/api/v1` route MUST add its error codes here (and
to [`docs/openapi.yaml`](../openapi.yaml)) in the same PR.**

## Conventions

- `code` is uppercase snake_case, stable across versions.
- `message` is human-readable and may change freely.
- `field` is set only for `VALIDATION_ERROR` on body validation failures.
- `meta.requestId` is always present; include it when reporting issues.

## Table

| Code                          | HTTP | Meaning                                                                 | Typical remediation                                                                 |
| ----------------------------- | ---- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `UNAUTHORIZED`                | 401  | Missing/expired/invalid access token.                                   | Call `/api/v1/auth/refresh`; if that also 401s, re-login.                           |
| `INVALID_CREDENTIALS`         | 401  | Login failed.                                                            | Verify username/password.                                                           |
| `REFRESH_INVALID`             | 401  | Supplied refresh token is malformed or unknown.                          | Re-login.                                                                            |
| `REFRESH_EXPIRED`             | 401  | Refresh token past `refresh_tokens.expires_at`.                          | Re-login.                                                                            |
| `REFRESH_REUSED`              | 401  | Refresh token was already rotated; entire family revoked.                | Re-login. Investigate possible token theft.                                          |
| `REFRESH_DISABLED`            | 503  | `DISABLE_AUTH_REFRESH=1` kill switch is on.                              | Wait for operator; legacy login still works.                                         |
| `ADMIN_REQUIRED`              | 403  | Route is ADMIN-only.                                                     | Log in as an ADMIN account.                                                          |
| `GUEST_ONLY`                  | 403  | Route is only for GUEST sessions.                                        | Use a guest session cookie.                                                          |
| `GUEST_FORBIDDEN`             | 403  | GUESTs may not perform this operation.                                   | Log in as a persistent user.                                                         |
| `FORBIDDEN`                   | 403  | Caller role may not perform this operation.                              | Log in as USER or ADMIN.                                                             |
| `EMAIL_REQUIRED`              | 400  | Change-email body missing/empty email.                                   | Supply a non-empty email.                                                            |
| `EMAIL_INVALID`               | 400  | Email failed format validation.                                          | Use a valid email address.                                                           |
| `EMAIL_UNCHANGED`             | 400  | New email matches current email.                                         | Supply a different email.                                                            |
| `EMAIL_TAKEN`                 | 409  | Email already registered to another user.                                | Choose a different email.                                                            |
| `GOOGLE_EMAIL_LOCKED`         | 403  | Google-linked account cannot self-service change email.                    | Use Google account settings or contact support.                                        |
| `GOOGLE_PASSWORD_LOCKED`      | 403  | Google-linked account cannot set a local password.                         | Continue signing in with Google.                                                       |
| `PASSWORD_REQUIRED`           | 400  | Change-password body missing password field(s).                          | Supply newPassword and confirmPassword.                                              |
| `PASSWORD_MISMATCH`           | 400  | newPassword and confirmPassword differ.                                  | Re-enter matching passwords.                                                           |
| `CHANGE_EMAIL_ERROR`          | 500  | Change email failed unexpectedly.                                        | Retry; report `requestId`.                                                           |
| `CHANGE_PASSWORD_ERROR`       | 500  | Change password failed unexpectedly.                                     | Retry; report `requestId`.                                                           |
| `SESSION_REQUIRED`            | 401  | Guest deck APIs need a session cookie.                                   | Allow cookies or call `/api/auth/...` first.                                         |
| `VALIDATION_ERROR`            | 400  | Body/params/query failed validation (zod).                               | Fix the field listed in `errors[].field` and retry.                                  |
| `RATE_LIMITED`                | 429  | Too many requests per window.                                            | Honor `X-RateLimit-Reset`; retry after.                                              |
| `SAVED_DATABASE_VIEW_FORBIDDEN` | 403 | Saved Views eligibility policy denied this account.                    | Use an eligible account; the temporary policy allows ADMIN only.                    |
| `SAVED_DATABASE_VIEW_INVALID_NAME` | 400 | Name is empty, whitespace-only, oversized, or not a string.          | Supply a trimmed display name of 1–80 characters.                                   |
| `SAVED_DATABASE_VIEW_INVALID_STATE` | 400 | Persisted state is incomplete or has an invalid tab/filter value.     | Supply the complete documented schemaVersion 1 state.                               |
| `SAVED_DATABASE_VIEW_UNSUPPORTED_SCHEMA_VERSION` | 400 | `schemaVersion` is not supported.                         | Send `schemaVersion: 1`.                                                            |
| `SAVED_DATABASE_VIEW_INVALID_ID` | 400 | A path or bulk-list ID is not a UUID, or the bulk list is out of bounds. | Supply one to 50 valid UUIDs.                                                     |
| `SAVED_DATABASE_VIEW_INVALID_METADATA` | 400 | Metadata update has no allowed fields or includes unknown fields.   | Supply `name` and/or `isPinned` only.                                                |
| `SAVED_DATABASE_VIEW_NOT_FOUND` | 404 | ID does not exist or is not owned by the caller.                       | Verify the ID from the caller's list response.                                      |
| `SAVED_DATABASE_VIEW_LIMIT_REACHED` | 409 | The caller already owns 50 saved views.                              | Delete a saved view before creating another.                                        |
| `SAVED_DATABASE_VIEW_ERROR`   | 500  | Saved Views persistence failed unexpectedly.                             | Retry; report `requestId` if persistent.                                            |
| `FEEDBACK_DELIVERY_ERROR`     | 500  | In-app feedback could not be delivered through SES.                      | Retry; use email or Discord if the failure continues.                               |
| `CATALOG_ERROR`               | 500  | Upstream catalog query failed.                                           | Retry; report `requestId` if persistent.                                             |
| `DBV_SUPPORT_ERROR`           | 500  | DBV support lookup failed.                                               | Retry; report `requestId` if persistent.                                             |
| `DECK_LIST_ERROR`             | 500  | Listing decks failed.                                                    | Retry.                                                                                |
| `DECK_STATS_ERROR`            | 500  | Aggregating deck stats failed.                                           | Retry.                                                                                |
| `DECK_VALIDATION_FAILED`      | 400  | Deck failed legality rules.                                              | Fix deck per the message.                                                            |
| `DECK_VALIDATE_ERROR`         | 500  | Deck validator threw.                                                    | Retry.                                                                                |
| `DECK_CREATE_ERROR`           | 500  | Creating a deck failed.                                                  | Retry.                                                                                |
| `DECK_CARDS_FETCH_ERROR`      | 500  | Reading a deck's cards failed.                                           | Retry.                                                                                |
| `DECK_CARD_ADD_ERROR`         | 500  | Adding a card failed.                                                    | Retry.                                                                                |
| `DECK_CARDS_REPLACE_ERROR`    | 500  | Replacing cards failed.                                                  | Retry.                                                                                |
| `DECK_CARDS_REPLACE_FAILED`   | varies | Deck-card replace rejected with structured status.                     | Inspect status + message.                                                            |
| `DECK_CARD_REMOVE_ERROR`      | 500  | Removing a card failed.                                                  | Retry.                                                                                |
| `DECK_FETCH_ERROR`            | 500  | Fetching a deck failed.                                                  | Retry.                                                                                |
| `DECK_NOT_FOUND`              | 404  | Deck id does not exist or is not visible to you.                         | Verify ID or ownership.                                                              |
| `DECK_ACCESS_DENIED`          | 403  | You do not own this deck.                                                | Use your own deck.                                                                   |
| `DECK_UPDATE_ERROR`           | 500  | Updating the deck failed.                                                | Retry.                                                                                |
| `DECK_DELETE_ERROR`           | 500  | Deleting the deck failed.                                                | Retry.                                                                                |
| `INVALID_BACKGROUND`          | 400  | Supplied deck background path is not in the allowlist.                   | Use a path from `GET /api/v1/dbv/deck-backgrounds`.                                  |
| `UI_PREFERENCES_FETCH_ERROR`  | 500  | Reading deck UI preferences failed.                                      | Retry.                                                                                |
| `UI_PREFERENCES_UPDATE_ERROR` | 500  | Updating deck UI preferences failed.                                     | Retry.                                                                                |
| `USERNAME_EXISTS`             | 409  | Admin tried to create a user with a taken username.                      | Choose a different username.                                                         |
| `ADMIN_USERS_LIST_ERROR`      | 500  | Admin user listing failed.                                               | Retry.                                                                                |
| `ADMIN_USER_CREATE_ERROR`     | 500  | Admin user creation failed.                                              | Retry.                                                                                |
| `ADMIN_USER_ANALYTICS_ERROR`  | 500  | Admin aggregate user analytics query failed.                             | Retry; report `requestId` if persistent.                                             |
| `ADMIN_BIZ_OPS_DASHBOARD_ERROR` | 500 | Admin AWS cost ledger read or aggregation failed.                        | Verify the deployed ledger exists and retry; report `requestId` if persistent.       |
| `ADMIN_DEBUG_ERROR`           | 500  | Admin debug action failed.                                               | Retry.                                                                                |
| `ADMIN_DATABASE_STATUS_ERROR` | 500  | Admin DB status call failed.                                             | Retry.                                                                                |
| `NOT_IMPLEMENTED`             | 501  | Route intentionally unimplemented.                                       | Use documented alternative.                                                          |
| `INTERNAL_ERROR`              | 500  | Catch-all unexpected failure.                                            | Retry; report `requestId`.                                                           |

## Related docs

- [`API_V1.md`](../../API_V1.md) — envelope + endpoint details.
- [`API_V1_VALIDATION.md`](API_V1_VALIDATION.md) — how `VALIDATION_ERROR`
  is produced (`parseV1Body` + zod).
- [`API_V1_RATE_LIMITS.md`](API_V1_RATE_LIMITS.md) — how `RATE_LIMITED` is
  computed and which headers accompany it.
- [`API_V1_AUTH_REFRESH.md`](API_V1_AUTH_REFRESH.md) — refresh token flow
  and the `REFRESH_*` codes.
