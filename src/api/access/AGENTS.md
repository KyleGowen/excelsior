# Confidential access context

Read root AGENTS.md and ../.cursorrules. Service identity and player identity are separate. serviceOperations.ts controls the general/native adapter and must not be broadened as a shortcut for external account access. databaseOperations and deckbuilderOperations retain their explicit catalog/stateless boundaries.

accountOperations.ts defines only literal aliases under /api/service/account/v1. accountAccess middleware requires ENABLE_ACCOUNT_SERVICE_GATEWAY=1 plus explicitly granted account:self, ignores ambient Cookie/Authorization, and transports a private upstream session header. It must not intercept native URLs or grant admin/deck/collection operations. No existing credentials gain scopes automatically. See docs/current/EXTERNAL_ACCOUNT_ACCESS.md.

Keep default-off/native regression, scopes/revocation, JSON/path/method/transport, independent sessions, role/provider, logging/redaction, no-store, and real-app database tests. Never log credentials. Native hashing/cookies/expiry changes and production activation require separate review.
