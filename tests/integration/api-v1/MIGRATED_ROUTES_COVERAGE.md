# `/api/v1` migrated routes — integration test coverage

Each row lists at least one integration test that exercises the route (happy path, auth error, or security case). Update this file when adding routes or tests.

**Keep in sync with [`API_MIGRATION_CHECKLIST.md`](../../../API_MIGRATION_CHECKLIST.md):** when a route is ticked as migrated in that checklist, add a coverage row here. When a route is removed, remove the row from both files.

| Method | Path | Test reference |
|--------|------|----------------|
| POST | `/api/v1/auth/login` | `api-v1/v1-api.integration.test.ts` — login + me |
| GET | `/api/v1/auth/me` | `api-v1/v1-api.integration.test.ts` |
| POST | `/api/v1/auth/logout` | `api-v1/v1-api.integration.test.ts` |
| GET | `/api/v1/catalog/characters` | `api-v1/v1-api.integration.test.ts` |
| GET | `/api/v1/catalog/locations` | `api-v1/v1-api.integration.test.ts` |
| GET | `/api/v1/catalog/special-cards` | `api-v1/v1-api.integration.test.ts` |
| GET | `/api/v1/catalog/missions` | `api-v1/v1-api.integration.test.ts` |
| GET | `/api/v1/catalog/events` | `api-v1/v1-api.integration.test.ts` |
| GET | `/api/v1/catalog/aspects` | `api-v1/v1-api.integration.test.ts` |
| GET | `/api/v1/catalog/advanced-universe` | `api-v1/v1-api.integration.test.ts` |
| GET | `/api/v1/catalog/teamwork` | `api-v1/v1-api.integration.test.ts` |
| GET | `/api/v1/catalog/ally-universe` | `api-v1/v1-api.integration.test.ts` |
| GET | `/api/v1/catalog/training` | `api-v1/v1-api.integration.test.ts` |
| GET | `/api/v1/catalog/basic-universe` | `api-v1/v1-api.integration.test.ts` |
| GET | `/api/v1/catalog/power-cards` | `api-v1/v1-api.integration.test.ts` |
| GET | `/api/v1/catalog/foil-card-map` | `foil-deck-editor-tile-view.test.ts` |
| GET | `/api/v1/dbv/sets` | `dbv-support-v1.test.ts` |
| GET | `/api/v1/dbv/deck-backgrounds` | `deck-background-api.test.ts` |
| GET | `/api/v1/recent-updates` | `recent-updates-v1.test.ts` |
| GET | `/api/v1/community/preconstructed-decks` | `preconstructed-decks-v1.test.ts` |
| GET | `/api/v1/decks` | `decks-list-v1.test.ts`, `security/v1-decks-list-and-authz.test.ts` |
| GET | `/api/v1/decks/stats` | `decks-v1-stats.test.ts` |
| POST | `/api/v1/decks/validate` | `decks-v1-create-validate.test.ts` |
| POST | `/api/v1/decks` | `decks-v1-detail.test.ts`, `security/cross-user-mutation-attempts.test.ts`, `security/v1-decks-list-and-authz.test.ts` |
| GET | `/api/v1/decks/:id/cards` | `decks-v1-cards.test.ts`, `security/v1-decks-list-and-authz.test.ts` |
| POST | `/api/v1/decks/:id/cards` | `decks-v1-cards.test.ts`, `security/cross-user-mutation-attempts.test.ts`, `security/v1-decks-list-and-authz.test.ts` |
| PUT | `/api/v1/decks/:id/cards` | `decks-v1-cards.test.ts`, `deck-save-security-*.test.ts`, `security/cross-user-mutation-attempts.test.ts`, `security/v1-decks-list-and-authz.test.ts` |
| DELETE | `/api/v1/decks/:id/cards` | `decks-v1-cards.test.ts`, `security/cross-user-mutation-attempts.test.ts`, `security/v1-decks-list-and-authz.test.ts` |
| GET | `/api/v1/decks/:id/full` | `decks-v1-detail.test.ts` |
| GET | `/api/v1/decks/:id` | `decks-v1-detail.test.ts` |
| PUT | `/api/v1/decks/:id` | `decks-v1-detail.test.ts`, `security/cross-user-mutation-attempts.test.ts`, `security/v1-decks-list-and-authz.test.ts` |
| GET | `/api/v1/decks/:id/ui-preferences` | `decks-v1-detail.test.ts` (or deck UI suites) |
| PUT | `/api/v1/decks/:id/ui-preferences` | `security/cross-user-mutation-attempts.test.ts`, `deck-ownership-security-simple.test.ts` |
| DELETE | `/api/v1/decks/:id` | `decks-v1-detail.test.ts`, `security/cross-user-mutation-attempts.test.ts`, `security/v1-decks-list-and-authz.test.ts` |
| GET | `/api/v1/collections/me` | `collection/collection-api-endpoints.test.ts`, `collection/collection-admin-access.test.ts` |
| GET | `/api/v1/collections/me/cards` | `collection/collection-api-endpoints.test.ts` |
| GET | `/api/v1/collections/me/history` | `collection/collection-api-endpoints.test.ts` |
| POST | `/api/v1/collections/me/cards` | `collection/collection-api-endpoints.test.ts` |
| POST | `/api/v1/collections/me/cards/remove-one` | `collection/collection-api-endpoints.test.ts` |
| PUT | `/api/v1/collections/me/cards/:cardId` | `collection/collection-api-endpoints.test.ts` |
| DELETE | `/api/v1/collections/me/cards/:cardId` | `collection/collection-api-endpoints.test.ts` |
| POST | `/api/v1/guest/decks` | `guest-deck-api.test.ts`, `security/guest-deck-session-isolation.test.ts` |
| GET | `/api/v1/guest/decks` | `guest-deck-api.test.ts`, `security/guest-deck-session-isolation.test.ts` |
| GET | `/api/v1/guest/decks/:id` | `guest-deck-api.test.ts`, `security/guest-deck-session-isolation.test.ts` |
| PUT | `/api/v1/guest/decks/:id` | `guest-deck-api.test.ts`, `security/guest-deck-session-isolation.test.ts` |
| PUT | `/api/v1/guest/decks/:id/cards` | `guest-deck-api.test.ts`, `security/guest-deck-session-isolation.test.ts` |
| POST | `/api/v1/guest/decks/:id/cards` | `guest-deck-api.test.ts` |
| DELETE | `/api/v1/guest/decks/:id` | `guest-deck-api.test.ts`, `security/guest-deck-session-isolation.test.ts` |
| GET | `/api/v1/admin/users` | `security/debug-endpoints-access.test.ts`, `createUserIntegration.test.ts` |
| GET | `/api/v1/admin/biz-ops-dashboard` | `security/debug-endpoints-access.test.ts` |
| GET | `/api/v1/admin/user-analytics` | `security/debug-endpoints-access.test.ts` |
| POST | `/api/v1/admin/users` | `createUserIntegration.test.ts`, `security/debug-endpoints-access.test.ts` |
| GET | `/api/v1/admin/debug/clear-cache` | `security/debug-endpoints-access.test.ts` |
| GET | `/api/v1/admin/debug/clear-card-cache` | `security/debug-endpoints-access.test.ts` |
| GET | `/api/v1/admin/database/status` | `security/debug-endpoints-access.test.ts` |
| POST | `/api/v1/feedback` | `api-v1/v1-feedback.integration.test.ts` |

Registration entrypoint: `src/api/http/registerApiV1Routes.ts`.
